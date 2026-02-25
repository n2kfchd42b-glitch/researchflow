import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';

function parseCSV(text: string) {
  const lines   = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g,''));
  const rows    = lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj: Record<string,string> = {};
    headers.forEach((h,i) => { obj[h] = (vals[i]||'').trim().replace(/"/g,''); });
    return obj;
  });
  return { headers, rows };
}

function normalCDF(z: number): number {
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}

function zToP(z: number): number {
  return 2 * (1 - normalCDF(Math.abs(z)));
}

function logOddsRatio(a: number, b: number, c: number, d: number) {
  const safeDivide = (n: number, d2: number) => d2 === 0 ? n + 0.5 : n;
  const aa = a || 0.5, bb = b || 0.5, cc = c || 0.5, dd = d || 0.5;
  const lor = Math.log((aa * dd) / (bb * cc));
  const se  = Math.sqrt(1/aa + 1/bb + 1/cc + 1/dd);
  return { lor, se, or: Math.exp(lor), ci_low: Math.exp(lor - 1.96*se), ci_high: Math.exp(lor + 1.96*se), z: lor/se, p: zToP(lor/se) };
}

function riskDiff(a: number, b: number, c: number, d: number) {
  const n1 = a + b, n2 = c + d;
  if (n1 === 0 || n2 === 0) return null;
  const p1 = a / n1, p2 = c / n2;
  const rd  = p1 - p2;
  const se  = Math.sqrt(p1*(1-p1)/n1 + p2*(1-p2)/n2);
  return { rd, se, ci_low: rd - 1.96*se, ci_high: rd + 1.96*se, z: rd/se, p: zToP(rd/se) };
}

type SubgroupResult = {
  subgroup:  string;
  n:         number;
  n_exposed: number;
  n_outcome_exp: number;
  n_outcome_unexp: number;
  effect:    number;
  ci_low:    number;
  ci_high:   number;
  p:         number;
  se:        number;
  weight:    number;
};

function computeSubgroups(
  rows: Record<string,string>[],
  outcome: string, exposure: string, subgroup: string, measure: string
): SubgroupResult[] {
  const groups = Array.from(new Set(rows.map(r => r[subgroup]).filter(Boolean))).sort();
  return groups.map(grp => {
    const subset   = rows.filter(r => r[subgroup] === grp);
    const exposed  = subset.filter(r => r[exposure] === '1' || r[exposure]?.toLowerCase() === 'yes');
    const unexposed= subset.filter(r => r[exposure] === '0' || r[exposure]?.toLowerCase() === 'no');
    const a = exposed.filter(r   => r[outcome] === '1' || r[outcome]?.toLowerCase() === 'yes').length;
    const b = exposed.length - a;
    const c = unexposed.filter(r => r[outcome] === '1' || r[outcome]?.toLowerCase() === 'yes').length;
    const d = unexposed.length - c;

    if (measure === 'OR') {
      const res = logOddsRatio(a, b, c, d);
      return { subgroup: grp, n: subset.length, n_exposed: exposed.length, n_outcome_exp: a, n_outcome_unexp: c,
        effect: res.or, ci_low: res.ci_low, ci_high: res.ci_high, p: res.p, se: res.se, weight: 0 };
    } else {
      const res = riskDiff(a, b, c, d);
      if (!res) return { subgroup: grp, n: subset.length, n_exposed: exposed.length, n_outcome_exp: a, n_outcome_unexp: c,
        effect: 0, ci_low: 0, ci_high: 0, p: 1, se: 0, weight: 0 };
      return { subgroup: grp, n: subset.length, n_exposed: exposed.length, n_outcome_exp: a, n_outcome_unexp: c,
        effect: res.rd, ci_low: res.ci_low, ci_high: res.ci_high, p: res.p, se: res.se, weight: 0 };
    }
  }).map(r => ({ ...r, weight: r.se > 0 ? Math.round(100 / (r.se * r.se)) : 0 }));
}

function interactionTest(results: SubgroupResult[], measure: string): { Q: number, df: number, p: number, I2: number } {
  if (results.length < 2) return { Q: 0, df: 0, p: 1, I2: 0 };
  const effects = results.map(r => measure === 'OR' ? Math.log(r.effect) : r.effect);
  const ses     = results.map(r => r.se);
  const vars    = ses.map(s => s * s);
  const weights = vars.map(v => v > 0 ? 1/v : 0);
  const pooled  = weights.reduce((s,w,i) => s + w*effects[i], 0) / weights.reduce((s,w) => s+w, 0);
  const Q       = weights.reduce((s,w,i) => s + w * Math.pow(effects[i] - pooled, 2), 0);
  const df      = results.length - 1;
  const p       = 1 - chi2CDF(Q, df);
  const I2      = Math.max(0, (Q - df) / Q * 100);
  return { Q: Math.round(Q*100)/100, df, p: Math.round(p*1000)/1000, I2: Math.round(I2*10)/10 };
}

function chi2CDF(x: number, df: number): number {
  if (x <= 0) return 0;
  let sum = 0, term = Math.exp(-x/2) * Math.pow(x/2, df/2) / gamma(df/2 + 1);
  for (let i = 0; i < 50; i++) {
    sum += term;
    term *= x / (2 * (df/2 + i + 1));
  }
  return Math.min(sum, 1);
}

function gamma(n: number): number {
  if (n === 1) return 1;
  if (n === 0.5) return Math.sqrt(Math.PI);
  return (n - 1) * gamma(n - 1);
}

const COLORS = ['#C0533A','#5A8A6A','#1C2B3A','#9c27b0','#2196f3','#ff9800','#00897b','#e91e63'];

export default function SubgroupAnalysis() {
  const [rows, setRows]           = useState<Record<string,string>[]>([]);
  const [headers, setHeaders]     = useState<string[]>([]);
  const [filename, setFilename]   = useState('');
  const [outcome, setOutcome]     = useState('');
  const [exposure, setExposure]   = useState('');
  const [subgroup, setSubgroup]   = useState('');
  const [measure, setMeasure]     = useState('OR');
  const [results, setResults]     = useState<SubgroupResult[]>([]);
  const [interaction, setInteraction] = useState<{Q:number,df:number,p:number,I2:number}|null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [activeTab, setActiveTab] = useState('plot');
  const [copied, setCopied]       = useState(false);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);
      setHeaders(h); setRows(r);
      setOutcome(h[h.length-1]); setExposure(h[0]); setSubgroup(h[1]);
      setResults([]); setInteraction(null);
    };
    reader.readAsText(file);
  }

  function runAnalysis() {
    if (!outcome || !exposure || !subgroup) { setError('Please select outcome, exposure and subgroup.'); return; }
    if (outcome === exposure || outcome === subgroup || exposure === subgroup) { setError('Outcome, exposure and subgroup must be different variables.'); return; }
    setLoading(true); setError('');
    try {
      const res  = computeSubgroups(rows, outcome, exposure, subgroup, measure);
      const intr = interactionTest(res, measure);
      setResults(res); setInteraction(intr);
      setActiveTab('plot');
    } catch (err: any) {
      setError('Analysis failed: ' + err.message);
    }
    setLoading(false);
  }

  const nullVal   = measure === 'OR' ? 1 : 0;
  const chartData = results.map(r => ({
    name:    r.subgroup,
    effect:  measure === 'OR' ? +r.effect.toFixed(2) : +r.effect.toFixed(3),
    ci_low:  measure === 'OR' ? +r.ci_low.toFixed(2) : +r.ci_low.toFixed(3),
    ci_high: measure === 'OR' ? +r.ci_high.toFixed(2) : +r.ci_high.toFixed(3),
    n:       r.n,
    p:       r.p,
    sig:     r.p < 0.05,
  }));

  const methodsText = results.length === 0 ? '' :
    `Subgroup analyses were conducted to assess whether the effect of ${exposure} on ${outcome} differed by ${subgroup}. ` +
    `${measure === 'OR' ? 'Odds ratios (OR) with 95% confidence intervals were calculated for each subgroup using logistic regression.' : 'Risk differences (RD) with 95% confidence intervals were calculated for each subgroup.'} ` +
    `A test for interaction was performed to assess heterogeneity across subgroups ` +
    `(Q = ${interaction?.Q}, df = ${interaction?.df}, p${interaction && interaction.p < 0.001 ? ' < 0.001' : ' = ' + interaction?.p}, I² = ${interaction?.I2}%). ` +
    (interaction && interaction.p < 0.05
      ? `There was statistically significant heterogeneity across subgroups (p = ${interaction.p}), suggesting that the effect of ${exposure} on ${outcome} varied by ${subgroup}.`
      : `There was no statistically significant heterogeneity across subgroups, suggesting a consistent effect of ${exposure} on ${outcome} across all ${subgroup} categories.`);

  return (
    <div className="page">
      <h1 style={{ color: '#1C2B3A' }}>Subgroup Analysis</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        Test whether treatment effects differ across subgroups. Includes interaction test and publication-ready output.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
        <div>
          <div className="card">
            <h2>Dataset</h2>
            <label className="btn btn-primary btn-full" style={{ cursor: 'pointer', marginBottom: '0.75rem', display: 'block', textAlign: 'center' }}>
              {filename ? `✅ ${filename}` : '📂 Upload CSV'}
              <input type="file" accept=".csv" onChange={handleUpload} style={{ display: 'none' }} />
            </label>
            {rows.length > 0 && (
              <p style={{ fontSize: '0.78rem', color: '#888', textAlign: 'center', marginBottom: 0 }}>
                {rows.length} rows · {headers.length} variables
              </p>
            )}
          </div>

          {headers.length > 0 && (
            <div className="card" style={{ marginTop: '1rem' }}>
              <h2>Analysis Settings</h2>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>EFFECT MEASURE</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {['OR','RD'].map(m => (
                    <button key={m} onClick={() => setMeasure(m)} className="btn" style={{
                      flex: 1, padding: '0.5rem', fontSize: '0.85rem',
                      background: measure === m ? '#1C2B3A' : '#eee',
                      color: measure === m ? 'white' : '#444',
                    }}>
                      {m === 'OR' ? 'Odds Ratio' : 'Risk Difference'}
                    </button>
                  ))}
                </div>
              </div>

              {[
                { label: 'OUTCOME (binary: 0/1)', key: 'outcome',  val: outcome,  set: setOutcome  },
                { label: 'EXPOSURE (binary: 0/1)',key: 'exposure', val: exposure, set: setExposure },
                { label: 'SUBGROUP VARIABLE',     key: 'subgroup', val: subgroup, set: setSubgroup },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>{f.label}</label>
                  <select value={f.val} onChange={e => f.set(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }}>
                    <option value="">Select variable...</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}

              {error && <div className="alert alert-critical" style={{ fontSize: '0.82rem', marginBottom: '0.75rem' }}>{error}</div>}

              <button className="btn btn-primary btn-full" onClick={runAnalysis}
                disabled={!outcome || !exposure || !subgroup || loading}>
                {loading ? 'Computing...' : '🔬 Run Subgroup Analysis'}
              </button>
            </div>
          )}
        </div>

        <div>
          {results.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔬</div>
              <h2>Subgroup Analysis</h2>
              <p style={{ color: '#888' }}>Upload your dataset, select variables and run the analysis to see results.</p>
            </div>
          )}

          {results.length > 0 && (
            <div>
              {/* INTERACTION SUMMARY */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                {[
                  { label: 'Subgroups',   value: results.length,                                             color: '#1C2B3A' },
                  { label: 'Q statistic', value: interaction?.Q,                                             color: '#2196f3' },
                  { label: 'p interaction', value: interaction?.p !== undefined ? (interaction.p < 0.001 ? '<0.001' : interaction.p) : '—', color: interaction?.p !== undefined && interaction.p < 0.05 ? '#f44336' : '#5A8A6A' },
                  { label: 'I²',          value: interaction?.I2 !== undefined ? interaction.I2 + '%' : '—', color: interaction?.I2 !== undefined && interaction.I2 > 50 ? '#f44336' : '#5A8A6A' },
                ].map(item => (
                  <div key={item.label} className="card" style={{ textAlign: 'center', padding: '0.75rem' }}>
                    <p style={{ fontSize: '1.4rem', fontWeight: 700, color: item.color, marginBottom: 2 }}>{item.value}</p>
                    <p style={{ fontSize: '0.72rem', color: '#888', marginBottom: 0 }}>{item.label}</p>
                  </div>
                ))}
              </div>

              {interaction && (
                <div className={`alert ${interaction.p < 0.05 ? 'alert-critical' : 'alert-success'}`} style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                  {interaction.p < 0.05
                    ? `⚠️ Significant interaction detected (p = ${interaction.p}). The effect of ${exposure} on ${outcome} differs significantly across ${subgroup} subgroups.`
                    : `✅ No significant interaction (p = ${interaction.p}). The effect of ${exposure} on ${outcome} is consistent across ${subgroup} subgroups.`}
                </div>
              )}

              {/* TABS */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {[
                  { id: 'plot',    label: '📊 Forest Plot'   },
                  { id: 'table',   label: '📋 Results Table' },
                  { id: 'methods', label: '📄 Methods Text'  },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="btn" style={{
                    background: activeTab === tab.id ? '#1C2B3A' : '#eee',
                    color:      activeTab === tab.id ? 'white'   : '#444',
                    padding: '0.5rem 1rem', fontSize: '0.85rem',
                  }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* FOREST PLOT */}
              {activeTab === 'plot' && (
                <div className="card">
                  <h2>Subgroup Forest Plot — {measure} by {subgroup}</h2>
                  <ResponsiveContainer width="100%" height={Math.max(300, results.length * 60)}>
                    <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 60, top: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={measure === 'OR' ? ['auto','auto'] : ['auto','auto']}
                        tickFormatter={v => measure === 'OR' ? v.toFixed(1) : v.toFixed(2)} />
                      <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(val: any, name: string) => [
                        name === 'effect' ? `${measure}: ${val}` : val, name
                      ]} />
                      <ReferenceLine x={nullVal} stroke="#888" strokeDasharray="4 3" />
                      <Bar dataKey="effect" radius={4} barSize={20}>
                        {chartData.map((entry, index) => (
                          <Cell key={index} fill={entry.sig ? COLORS[index % COLORS.length] : '#ccc'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ width: 16, height: 16, borderRadius: 3, background: '#C0533A' }} />
                      <span style={{ fontSize: '0.78rem' }}>Significant (p &lt; 0.05)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ width: 16, height: 16, borderRadius: 3, background: '#ccc' }} />
                      <span style={{ fontSize: '0.78rem' }}>Not significant</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ width: 16, height: 2, background: '#888' }} />
                      <span style={{ fontSize: '0.78rem' }}>Null ({measure === 'OR' ? 'OR = 1' : 'RD = 0'})</span>
                    </div>
                  </div>
                </div>
              )}

              {/* RESULTS TABLE */}
              {activeTab === 'table' && (
                <div className="card">
                  <h2>Results by Subgroup</h2>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ background: '#1C2B3A', color: 'white' }}>
                          {['Subgroup','N','Events (exp)','Events (unexp)',measure,'95% CI','p-value','Significant'].map(h => (
                            <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r, i) => (
                          <tr key={r.subgroup} style={{ background: i%2===0 ? '#f8f7f4' : 'white', borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 700 }}>{r.subgroup}</td>
                            <td style={{ padding: '8px 10px' }}>{r.n}</td>
                            <td style={{ padding: '8px 10px' }}>{r.n_outcome_exp}</td>
                            <td style={{ padding: '8px 10px' }}>{r.n_outcome_unexp}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 700 }}>
                              {measure === 'OR' ? r.effect.toFixed(2) : r.effect.toFixed(3)}
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              {measure === 'OR'
                                ? `${r.ci_low.toFixed(2)}–${r.ci_high.toFixed(2)}`
                                : `${r.ci_low.toFixed(3)}–${r.ci_high.toFixed(3)}`}
                            </td>
                            <td style={{ padding: '8px 10px', color: r.p < 0.05 ? '#f44336' : '#888', fontWeight: r.p < 0.05 ? 700 : 400 }}>
                              {r.p < 0.001 ? '<0.001' : r.p.toFixed(3)}
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              {r.p < 0.05
                                ? <span style={{ color: '#5A8A6A', fontWeight: 700 }}>✅ Yes</span>
                                : <span style={{ color: '#aaa' }}>No</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#f0f4f8', borderTop: '2px solid #ccc' }}>
                          <td colSpan={8} style={{ padding: '8px 10px', fontSize: '0.78rem', color: '#888' }}>
                            Test for interaction: Q = {interaction?.Q}, df = {interaction?.df}, p = {interaction?.p}, I² = {interaction?.I2}%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* METHODS TEXT */}
              {activeTab === 'methods' && (
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>Methods Text</h2>
                    <button className="btn btn-sage" onClick={() => { navigator.clipboard.writeText(methodsText); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                      {copied ? '✓ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                  <div style={{ background: '#f8f7f4', borderRadius: 8, padding: '1.25rem', fontSize: '0.9rem', lineHeight: 1.8, color: '#333' }}>
                    {methodsText}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
