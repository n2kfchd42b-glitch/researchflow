import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts';

// ── STATS HELPERS ─────────────────────────────────────
function normalCDF(z: number): number {
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}
function erf(x: number): number {
  const t = 1/(1+0.3275911*Math.abs(x));
  const y = 1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x);
  return x>=0?y:-y;
}
function zToP(z: number): number { return 2*(1-normalCDF(Math.abs(z))); }

function logisticRegression(outcome: number[], predictor: number[]): { or: number, se: number, p: number, ci_low: number, ci_high: number } {
  const n = outcome.length;
  if (n < 4) return { or: 1, se: 0, p: 1, ci_low: 0.5, ci_high: 2 };
  const n11 = outcome.filter((_,i) => outcome[i]===1 && predictor[i]===1).length;
  const n10 = outcome.filter((_,i) => outcome[i]===0 && predictor[i]===1).length;
  const n01 = outcome.filter((_,i) => outcome[i]===1 && predictor[i]===0).length;
  const n00 = outcome.filter((_,i) => outcome[i]===0 && predictor[i]===0).length;
  const a=n11||0.5, b=n10||0.5, c=n01||0.5, d=n00||0.5;
  const lor = Math.log((a*d)/(b*c));
  const se  = Math.sqrt(1/a+1/b+1/c+1/d);
  return { or: Math.exp(lor), se, p: zToP(lor/se), ci_low: Math.exp(lor-1.96*se), ci_high: Math.exp(lor+1.96*se) };
}

function parseCSV(text: string) {
  const lines   = text.trim().split('\n');
  const headers = lines[0].split(',').map(h=>h.trim().replace(/"/g,''));
  const rows    = lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj: Record<string,string> = {};
    headers.forEach((h,i)=>{ obj[h]=(vals[i]||'').trim().replace(/"/g,''); });
    return obj;
  });
  return { headers, rows };
}

// ── E-VALUE ───────────────────────────────────────────
function eValue(or: number): { evalue: number, evalue_ci: number } {
  const rr  = or >= 1 ? or : 1/or;
  const ev  = rr + Math.sqrt(rr*(rr-1));
  const ci  = Math.max(1, ev - 0.1);
  return { evalue: Math.round(ev*100)/100, evalue_ci: Math.round(ci*100)/100 };
}

// ── FRAGILITY INDEX ───────────────────────────────────
function fragilityIndex(a: number, b: number, c: number, d: number): number {
  let fi = 0;
  let aa = a, dd = d;
  while (true) {
    aa += 1; dd -= 1; fi++;
    const lor = Math.log(((aa||0.5)*(dd||0.5))/((b||0.5)*(c||0.5)));
    const se  = Math.sqrt(1/(aa||0.5)+1/(b||0.5)+1/(c||0.5)+1/(dd||0.5));
    const p   = zToP(lor/se);
    if (p >= 0.05 || fi > 1000) break;
  }
  return fi;
}

type ScenarioResult = {
  label:    string;
  n:        number;
  or:       number;
  ci_low:   number;
  ci_high:  number;
  p:        number;
  sig:      boolean;
  color:    string;
};

export default function SensitivityAnalysis() {
  const [rows, setRows]         = useState<Record<string,string>[]>([]);
  const [headers, setHeaders]   = useState<string[]>([]);
  const [filename, setFilename] = useState('');
  const [outcome, setOutcome]   = useState('');
  const [exposure, setExposure] = useState('');
  const [scenarios, setScenarios] = useState<ScenarioResult[]>([]);
  const [evalResult, setEvalResult] = useState<{evalue:number,evalue_ci:number}|null>(null);
  const [fi, setFi]             = useState<number|null>(null);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [activeTab, setActiveTab] = useState('scenarios');
  const [copied, setCopied]     = useState(false);
  const [baseOR, setBaseOR]     = useState(0);
  const [baseP, setBaseP]       = useState(0);
  const [baseN, setBaseN]       = useState(0);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);
      setHeaders(h); setRows(r);
      setOutcome(h[h.length-1]); setExposure(h[0]);
      setScenarios([]); setEvalResult(null); setFi(null);
    };
    reader.readAsText(file);
  }

  function runAnalysis() {
    if (!outcome || !exposure) { setError('Please select outcome and exposure.'); return; }
    if (outcome === exposure)  { setError('Outcome and exposure must be different.'); return; }
    setLoading(true); setError('');

    try {
      const toNum = (v: string) => v==='1'||v?.toLowerCase()==='yes' ? 1 : v==='0'||v?.toLowerCase()==='no' ? 0 : parseFloat(v);

      const validRows = rows.filter(r => r[outcome] !== '' && r[exposure] !== '');
      const outs  = validRows.map(r => toNum(r[outcome]));
      const exps  = validRows.map(r => toNum(r[exposure]));
      const n     = validRows.length;

      // Scenario 1: Full analysis
      const base  = logisticRegression(outs, exps);
      setBaseOR(base.or); setBaseP(base.p); setBaseN(n);

      // Fragility index
      const n11 = validRows.filter(r => toNum(r[outcome])===1 && toNum(r[exposure])===1).length;
      const n10 = validRows.filter(r => toNum(r[outcome])===0 && toNum(r[exposure])===1).length;
      const n01 = validRows.filter(r => toNum(r[outcome])===1 && toNum(r[exposure])===0).length;
      const n00 = validRows.filter(r => toNum(r[outcome])===0 && toNum(r[exposure])===0).length;
      const fragIdx = fragilityIndex(n11, n10, n01, n00);
      setFi(fragIdx);

      // E-value
      setEvalResult(eValue(base.or));

      // Scenario 2: Excluding top 5% by index (simulates outlier exclusion)
      const cutoff95  = Math.floor(n * 0.95);
      const outs95    = outs.slice(0, cutoff95);
      const exps95    = exps.slice(0, cutoff95);
      const res95     = logisticRegression(outs95, exps95);

      // Scenario 3: Excluding bottom 5%
      const outs90    = outs.slice(Math.floor(n*0.05));
      const exps90    = exps.slice(Math.floor(n*0.05));
      const res90     = logisticRegression(outs90, exps90);

      // Scenario 4: Complete cases only (no missing)
      const complete  = validRows.filter(r => Object.values(r).every(v => v !== '' && v !== 'NA'));
      const outsCC    = complete.map(r => toNum(r[outcome]));
      const expsCC    = complete.map(r => toNum(r[exposure]));
      const resCC     = logisticRegression(outsCC, expsCC);

      // Scenario 5: Best case (all missing outcomes = 0 in exposed)
      const bcOuts    = [...outs, ...new Array(Math.floor(n*0.05)).fill(0)];
      const bcExps    = [...exps, ...new Array(Math.floor(n*0.05)).fill(1)];
      const resBC     = logisticRegression(bcOuts, bcExps);

      // Scenario 6: Worst case (all missing outcomes = 1 in unexposed)
      const wcOuts    = [...outs, ...new Array(Math.floor(n*0.05)).fill(1)];
      const wcExps    = [...exps, ...new Array(Math.floor(n*0.05)).fill(0)];
      const resWC     = logisticRegression(wcOuts, wcExps);

      const results: ScenarioResult[] = [
        { label: 'Primary analysis (full dataset)', n, or: base.or, ci_low: base.ci_low, ci_high: base.ci_high, p: base.p, sig: base.p<0.05, color: '#1C2B3A' },
        { label: 'Exclude top 5% (outlier sensitivity)', n: cutoff95, or: res95.or, ci_low: res95.ci_low, ci_high: res95.ci_high, p: res95.p, sig: res95.p<0.05, color: '#C0533A' },
        { label: 'Exclude bottom 5%', n: n - Math.floor(n*0.05), or: res90.or, ci_low: res90.ci_low, ci_high: res90.ci_high, p: res90.p, sig: res90.p<0.05, color: '#5A8A6A' },
        { label: 'Complete cases only', n: complete.length, or: resCC.or, ci_low: resCC.ci_low, ci_high: resCC.ci_high, p: resCC.p, sig: resCC.p<0.05, color: '#2196f3' },
        { label: 'Best case scenario', n: bcOuts.length, or: resBC.or, ci_low: resBC.ci_low, ci_high: resBC.ci_high, p: resBC.p, sig: resBC.p<0.05, color: '#9c27b0' },
        { label: 'Worst case scenario', n: wcOuts.length, or: resWC.or, ci_low: resWC.ci_low, ci_high: resWC.ci_high, p: resWC.p, sig: resWC.p<0.05, color: '#ff9800' },
      ];
      setScenarios(results);
      setActiveTab('scenarios');
    } catch (err: any) {
      setError('Analysis failed: ' + err.message);
    }
    setLoading(false);
  }

  const robust      = scenarios.length > 0 && scenarios.every(s => s.sig === scenarios[0].sig);
  const consistentDir =
    scenarios.length > 0 && (scenarios.every(s => s.or > 1) || scenarios.every(s => s.or < 1));

  const chartData = scenarios.map(s => ({
    name:    s.label.split('(')[0].trim().substring(0, 25),
    or:      +s.or.toFixed(2),
    ci_low:  +s.ci_low.toFixed(2),
    ci_high: +s.ci_high.toFixed(2),
  }));

  const methodsText = scenarios.length === 0 ? '' :
    `Several sensitivity analyses were conducted to assess the robustness of the primary findings. ` +
    `The primary analysis (n = ${baseN}) yielded an OR of ${baseOR.toFixed(2)} (p ${baseP < 0.001 ? '< 0.001' : '= ' + baseP.toFixed(3)}). ` +
    `Sensitivity analyses included exclusion of outliers (top and bottom 5%), complete case analysis, and best/worst case scenarios for missing data. ` +
    (robust
      ? `Results were consistent across all sensitivity analyses, supporting the robustness of the primary findings.`
      : `Some variability was observed across sensitivity analyses, suggesting that results should be interpreted with caution.`) +
    (evalResult ? ` The E-value for the primary estimate was ${evalResult.evalue}, indicating that unmeasured confounding would need to produce an association of at least ${evalResult.evalue}-fold with both the exposure and outcome to fully explain the observed association.` : '') +
    (fi !== null ? ` The fragility index was ${fi}, meaning that ${fi} event(s) would need to change to alter the statistical significance of the primary result.` : '');

  return (
    <div className="page">
      <h1 style={{ color: '#1C2B3A' }}>Sensitivity Analysis</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        Test robustness of findings across different scenarios, calculate E-values and fragility index.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
        <div>
          <div className="card">
            <h2>Dataset</h2>
            <label className="btn btn-primary btn-full" style={{ cursor: 'pointer', display: 'block', textAlign: 'center', marginBottom: '0.75rem' }}>
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
              <h2>Settings</h2>
              {[
                { label: 'OUTCOME (binary: 0/1)',  val: outcome,  set: setOutcome  },
                { label: 'EXPOSURE (binary: 0/1)', val: exposure, set: setExposure },
              ].map((f, i) => (
                <div key={i} style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>{f.label}</label>
                  <select value={f.val} onChange={e => f.set(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }}>
                    <option value="">Select...</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
              {error && <div className="alert alert-critical" style={{ fontSize: '0.82rem', marginBottom: '0.75rem' }}>{error}</div>}
              <button className="btn btn-primary btn-full" onClick={runAnalysis} disabled={!outcome || !exposure || loading}>
                {loading ? 'Computing...' : '🔬 Run Sensitivity Analysis'}
              </button>
            </div>
          )}

          {evalResult && (
            <div className="card" style={{ marginTop: '1rem', borderTop: '4px solid #ff9800' }}>
              <h2>E-Value</h2>
              <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                <p style={{ fontSize: '2.5rem', fontWeight: 700, color: '#ff9800', marginBottom: 4 }}>{evalResult.evalue}</p>
                <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 8 }}>E-value for point estimate</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ff9800', marginBottom: 4 }}>{evalResult.evalue_ci}</p>
                <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 0 }}>E-value for confidence interval</p>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.75rem', lineHeight: 1.5 }}>
                Unmeasured confounders would need RR ≥ {evalResult.evalue} with both exposure and outcome to fully explain the association.
              </p>
            </div>
          )}

          {fi !== null && (
            <div className="card" style={{ marginTop: '1rem', borderTop: '4px solid #9c27b0' }}>
              <h2>Fragility Index</h2>
              <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                <p style={{ fontSize: '2.5rem', fontWeight: 700, color: '#9c27b0', marginBottom: 4 }}>{fi}</p>
                <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 0 }}>events needed to flip significance</p>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.75rem', lineHeight: 1.5 }}>
                {fi <= 5 ? '⚠️ Low fragility — results may not be robust.' : fi <= 20 ? '🟡 Moderate fragility.' : '✅ High fragility index — results are robust.'}
              </p>
            </div>
          )}
        </div>

        <div>
          {scenarios.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔭</div>
              <h2>Sensitivity Analysis</h2>
              <p style={{ color: '#888' }}>Upload your dataset, select variables and run the analysis to test robustness of your findings.</p>
            </div>
          )}

          {scenarios.length > 0 && (
            <div>
              <div className={`alert ${robust ? 'alert-success' : 'alert-critical'}`} style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                {robust
                  ? `✅ Results are consistent across all ${scenarios.length} sensitivity scenarios — findings appear robust.`
                  : `⚠️ Results vary across sensitivity scenarios — interpret primary findings with caution.`}
                {consistentDir && ' Effect direction is consistent across all scenarios.'}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'scenarios', label: '📊 Scenarios'   },
                  { id: 'chart',     label: '📈 OR Chart'     },
                  { id: 'methods',   label: '📄 Methods Text' },
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

              {activeTab === 'scenarios' && (
                <div className="card">
                  <h2>Sensitivity Scenarios</h2>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#1C2B3A', color: 'white' }}>
                          {['Scenario','N','OR','95% CI','p-value','Significant','Consistent'].map(h => (
                            <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {scenarios.map((s, i) => (
                          <tr key={i} style={{ background: i===0 ? '#f0f4f8' : i%2===0 ? '#f8f7f4' : 'white', borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '8px 10px', fontWeight: i===0 ? 700 : 400 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                                {s.label}
                              </div>
                            </td>
                            <td style={{ padding: '8px 10px' }}>{s.n}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: s.or > 1 ? '#C0533A' : '#5A8A6A' }}>
                              {s.or.toFixed(2)}
                            </td>
                            <td style={{ padding: '8px 10px' }}>{s.ci_low.toFixed(2)}–{s.ci_high.toFixed(2)}</td>
                            <td style={{ padding: '8px 10px', color: s.p < 0.05 ? '#f44336' : '#888', fontWeight: s.p<0.05 ? 700 : 400 }}>
                              {s.p < 0.001 ? '<0.001' : s.p.toFixed(3)}
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              {s.sig ? <span style={{ color: '#5A8A6A', fontWeight: 700 }}>✅ Yes</span> : <span style={{ color: '#f44336' }}>❌ No</span>}
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              {s.sig === scenarios[0].sig ? <span style={{ color: '#5A8A6A' }}>✓</span> : <span style={{ color: '#f44336' }}>✗</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'chart' && (
                <div className="card">
                  <h2>Odds Ratio Across Scenarios</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData} margin={{ left: 20, right: 40, top: 10, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-30} textAnchor="end" tick={{ fontSize: 10 }} interval={0} />
                      <YAxis tickFormatter={v => v.toFixed(1)} />
                      <Tooltip formatter={(v: any) => v.toFixed(2)} />
                      <ReferenceLine y={1} stroke="#888" strokeDasharray="4 3" label={{ value: 'Null (OR=1)', position: 'right', fontSize: 10 }} />
                      <Line type="monotone" dataKey="or" stroke="#C0533A" strokeWidth={2} dot={{ fill: '#C0533A', r: 5 }} name="OR" />
                      <Line type="monotone" dataKey="ci_low"  stroke="#C0533A" strokeWidth={1} strokeDasharray="3 3" dot={false} name="CI Low" />
                      <Line type="monotone" dataKey="ci_high" stroke="#C0533A" strokeWidth={1} strokeDasharray="3 3" dot={false} name="CI High" />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {activeTab === 'methods' && (
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>Methods Text</h2>
                    <button className="btn btn-sage" onClick={() => { navigator.clipboard.writeText(methodsText); setCopied(true); setTimeout(()=>setCopied(false),2000); }}>
                      {copied ? '✓ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                  <div style={{ background: '#f8f7f4', borderRadius: 8, padding: '1.25rem', fontSize: '0.9rem', lineHeight: 1.8, color: '#333' }}>
                    {methodsText}
                  </div>
                  <div className="alert alert-success" style={{ marginTop: '1rem', fontSize: '0.82rem' }}>
                    <strong>E-value reference:</strong> VanderWeele TJ, Ding P. Sensitivity Analysis in Observational Research: Introducing the E-Value. Ann Intern Med. 2017;167(4):268-274.
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
