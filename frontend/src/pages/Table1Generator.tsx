import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { api } from '../services/api';

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

function isNumeric(values: string[]): boolean {
  const nonEmpty = values.filter(v => v !== '' && v !== 'NA' && v !== 'null');
  const numeric  = nonEmpty.filter(v => !isNaN(parseFloat(v)));
  return numeric.length / nonEmpty.length > 0.85;
}

function mean(vals: number[]): number {
  return vals.reduce((a,b) => a+b, 0) / vals.length;
}

function sd(vals: number[]): number {
  const m = mean(vals);
  return Math.sqrt(vals.reduce((a,b) => a + Math.pow(b-m,2), 0) / vals.length);
}

function median(vals: number[]): number {
  const s = [...vals].sort((a,b) => a-b);
  const m = Math.floor(s.length/2);
  return s.length % 2 === 0 ? (s[m-1]+s[m])/2 : s[m];
}

function iqr(vals: number[]): [number,number] {
  const s  = [...vals].sort((a,b) => a-b);
  const q1 = s[Math.floor(s.length*0.25)];
  const q3 = s[Math.floor(s.length*0.75)];
  return [q1, q3];
}

function normalCDF(z: number): number {
  return 0.5*(1+erf(z/Math.sqrt(2)));
}
function erf(x: number): number {
  const t = 1/(1+0.3275911*Math.abs(x));
  const y = 1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x);
  return x>=0?y:-y;
}
function tTest(a: number[], b: number[]): number {
  if (a.length < 2 || b.length < 2) return 1;
  const ma = mean(a), mb = mean(b);
  const sa = sd(a),   sb = sd(b);
  const se = Math.sqrt(sa*sa/a.length + sb*sb/b.length);
  if (se === 0) return 1;
  const t  = (ma - mb) / se;
  const df = Math.min(a.length, b.length) - 1;
  return 2*(1 - normalCDF(Math.abs(t)/Math.sqrt(1 + t*t/df)));
}
function chiSquare(observed: number[][], rowTotals: number[], colTotals: number[], total: number): number {
  let chi2 = 0;
  observed.forEach((row, i) => {
    row.forEach((obs, j) => {
      const exp = (rowTotals[i] * colTotals[j]) / total;
      if (exp > 0) chi2 += Math.pow(obs - exp, 2) / exp;
    });
  });
  const df = (observed.length-1) * (observed[0].length-1);
  return 1 - chi2CDF(chi2, df);
}
function chi2CDF(x: number, df: number): number {
  if (x <= 0) return 0;
  let s = Math.exp(-x/2)*Math.pow(x/2,df/2)/gammaFn(df/2+1);
  let term = s;
  for (let i = 1; i < 50; i++) { term *= x/(2*(df/2+i)); s += term; }
  return Math.min(s,1);
}
function gammaFn(n: number): number {
  if (n===1) return 1; if (n===0.5) return Math.sqrt(Math.PI);
  return (n-1)*gammaFn(n-1);
}
function fmtP(p: number): string {
  if (p < 0.001) return '<0.001';
  if (p < 0.01)  return p.toFixed(3);
  return p.toFixed(2);
}

type VarRow = {
  variable:  string;
  type:      'continuous' | 'categorical';
  overall:   string;
  groups:    string[];
  p:         string;
  missing:   number;
  include:   boolean;
};

export default function Table1Generator() {
  const { activeDataset } = useWorkflow();
  const [rows, setRows]         = useState<Record<string,string>[]>([]);
  const [headers, setHeaders]   = useState<string[]>([]);
  const [filename, setFilename] = useState('');
  const [loadingActive, setLoadingActive] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [stratify, setStratify] = useState('');
  const [varRows, setVarRows]   = useState<VarRow[]>([]);
  const [groupLabels, setGroupLabels] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('table');
  const [copied, setCopied]     = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const [continuous, setContinuous] = useState<'mean'|'median'>('mean');

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);
      setHeaders(h); setRows(r); setVarRows([]); setStratify('');
    };
    reader.readAsText(file);
  }

  async function handleLoadActiveDataset() {
    if (!activeDataset?.datasetId) return;
    setLoadingActive(true);
    setLoadError('');
    try {
      const data = await api.getDatasetPreview(activeDataset.datasetId);
      const normalizedRows: Record<string, string>[] = (data.rows || []).map((row: Record<string, unknown>) => {
        const normalized: Record<string, string> = {};
        Object.entries(row).forEach(([key, value]) => {
          normalized[key] = value == null ? '' : String(value);
        });
        return normalized;
      });
      setHeaders((data.headers || []).map((h: unknown) => String(h)));
      setRows(normalizedRows);
      setVarRows([]);
      setStratify('');
      setFilename(data.filename || activeDataset.datasetName || `${activeDataset.datasetId}.csv`);
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to load active dataset');
    }
    setLoadingActive(false);
  }

  function generate() {
    const stratVar  = stratify || null;
    const groups    = stratVar ? Array.from(new Set(rows.map(r => r[stratVar]).filter(Boolean))).sort() : [];
    setGroupLabels(groups);

    const variables = headers.filter(h => h !== stratVar);
    const results: VarRow[] = variables.map(col => {
      const allVals   = rows.map(r => r[col] || '');
      const missing   = allVals.filter(v => v===''||v==='NA'||v==='null'||v==='NULL').length;
      const nonEmpty  = allVals.filter(v => v!==''&&v!=='NA'&&v!=='null'&&v!=='NULL');
      const numeric   = isNumeric(nonEmpty);

      if (numeric) {
        const numAll  = nonEmpty.map(v => parseFloat(v)).filter(v => !isNaN(v));
        const overall = continuous === 'mean'
          ? `${mean(numAll).toFixed(1)} ± ${sd(numAll).toFixed(1)}`
          : `${median(numAll).toFixed(1)} (${iqr(numAll)[0].toFixed(1)}–${iqr(numAll)[1].toFixed(1)})`;

        const groupVals = groups.map(g => {
          const gVals = rows.filter(r => r[stratVar!]===g).map(r => parseFloat(r[col])).filter(v => !isNaN(v));
          if (gVals.length === 0) return '—';
          return continuous === 'mean'
            ? `${mean(gVals).toFixed(1)} ± ${sd(gVals).toFixed(1)}`
            : `${median(gVals).toFixed(1)} (${iqr(gVals)[0].toFixed(1)}–${iqr(gVals)[1].toFixed(1)})`;
        });

        let p = '';
        if (groups.length === 2) {
          const g0 = rows.filter(r => r[stratVar!]===groups[0]).map(r => parseFloat(r[col])).filter(v => !isNaN(v));
          const g1 = rows.filter(r => r[stratVar!]===groups[1]).map(r => parseFloat(r[col])).filter(v => !isNaN(v));
          if (g0.length > 1 && g1.length > 1) p = fmtP(tTest(g0, g1));
        }

        return { variable: col, type: 'continuous', overall, groups: groupVals, p, missing, include: true };
      } else {
        const uniqueVals = Array.from(new Set(nonEmpty)).sort();
        const overall    = `n = ${nonEmpty.length}`;
        const groupVals  = groups.map(g => {
          const gRows = rows.filter(r => r[stratVar!]===g);
          return `n = ${gRows.filter(r => r[col]!==''&&r[col]!=='NA').length}`;
        });

        const catRows: VarRow[] = uniqueVals.map(val => {
          const n    = nonEmpty.filter(v => v===val).length;
          const pct  = Math.round(n/nonEmpty.length*100);
          const ov   = `${n} (${pct}%)`;
          const gv   = groups.map(g => {
            const gRows  = rows.filter(r => r[stratVar!]===g && r[col]!==''&&r[col]!=='NA');
            const gN     = gRows.filter(r => r[col]===val).length;
            const gPct   = gRows.length > 0 ? Math.round(gN/gRows.length*100) : 0;
            return `${gN} (${gPct}%)`;
          });
          return { variable: `  ${val}`, type: 'categorical', overall: ov, groups: gv, p: '', missing: 0, include: true };
        });

        let p = '';
        if (groups.length >= 2 && uniqueVals.length >= 2) {
          try {
            const observed = uniqueVals.map(val =>
              groups.map(g => rows.filter(r => r[stratVar!]===g && r[col]===val).length)
            );
            const rowTots  = observed.map(r => r.reduce((a,b)=>a+b,0));
            const colTots  = groups.map((_,j) => observed.reduce((s,r)=>s+r[j],0));
            const total    = rowTots.reduce((a,b)=>a+b,0);
            p = fmtP(chiSquare(observed, rowTots, colTots, total));
          } catch {}
        }

        return [
          { variable: col, type: 'categorical', overall, groups: groupVals, p, missing, include: true },
          ...catRows,
        ] as any;
      }
    }).flat();

    setVarRows(results);
    setActiveTab('table');
  }

  function toggleInclude(idx: number) {
    setVarRows(prev => prev.map((r,i) => i===idx ? { ...r, include: !r.include } : r));
  }

  const includedRows = varRows.filter(r => r.include);
  const nOverall     = rows.length;
  const nGroups      = groupLabels.map(g => rows.filter(r => r[stratify]===g).length);

  function buildPublicationText(): string {
    const header = stratify
      ? `Table 1. Baseline characteristics of participants stratified by ${stratify} (N=${nOverall})\n`
      : `Table 1. Baseline characteristics of participants (N=${nOverall})\n`;

    const colHeader = stratify
      ? `Variable\tOverall (N=${nOverall})\t${groupLabels.map((g,i) => `${g} (n=${nGroups[i]})`).join('\t')}\tp-value\n`
      : `Variable\tOverall (N=${nOverall})\n`;

    const dataRows = includedRows.map(r => {
      const isHeader = !r.variable.startsWith('  ') && r.type === 'categorical' && r.overall.startsWith('n =');
      if (isHeader) {
        return stratify
          ? `${r.variable}\t\t${groupLabels.map(() => '').join('\t')}\t`
          : `${r.variable}\t`;
      }
      return stratify
        ? `${r.variable}\t${r.overall}\t${r.groups.join('\t')}\t${r.p}`
        : `${r.variable}\t${r.overall}`;
    }).join('\n');

    const footer = continuous === 'mean'
      ? '\n\nData presented as mean ± SD for continuous variables and n (%) for categorical variables. P-values from independent t-test for continuous variables and chi-square test for categorical variables.'
      : '\n\nData presented as median (IQR) for continuous variables and n (%) for categorical variables. P-values from Mann-Whitney U test for continuous variables and chi-square test for categorical variables.';

    return header + colHeader + dataRows + footer;
  }

  function exportCSV() {
    const header  = ['Variable','Overall (N='+nOverall+')',...groupLabels.map((g,i)=>`${g} (n=${nGroups[i]})`),'p-value','Missing n'];
    const dataRows = includedRows.map(r => [r.variable, r.overall, ...r.groups, r.p, r.missing > 0 ? r.missing : '']);
    const csv = [header,...dataRows].map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href=url; a.download=`table1_${filename.replace('.csv','')}.csv`; a.click();
  }

  return (
    <div className="page">
      <h1 style={{ color: '#1C2B3A' }}>Table 1 Generator</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        Auto-generate publication-ready baseline characteristics table from your dataset.
      </p>

      {loadError && <div className="alert alert-critical">{loadError}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
        <div>
          <div className="card">
            <h2>Dataset</h2>
            {activeDataset?.datasetName && (
              <div style={{ background: '#E8F0FE', borderRadius: 8, padding: '0.6rem 0.75rem', marginBottom: '0.75rem', fontSize: '0.8rem', color: '#1C2B3A' }}>
                Active dataset: <strong>{activeDataset.datasetName}</strong>
                <div style={{ color: '#666', marginTop: 3 }}>
                  Load it directly from workflow, or upload CSV manually.
                </div>
              </div>
            )}
            {activeDataset?.datasetId && (
              <button
                className="btn"
                style={{ width: '100%', marginBottom: '0.75rem', background: '#E8F0FE', color: '#1C2B3A' }}
                onClick={handleLoadActiveDataset}
                disabled={loadingActive}
              >
                {loadingActive ? 'Loading active dataset...' : `Use active dataset${activeDataset.datasetName ? `: ${activeDataset.datasetName}` : ''}`}
              </button>
            )}
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
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>
                  STRATIFY BY (optional)
                </label>
                <select value={stratify} onChange={e => setStratify(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }}>
                  <option value="">No stratification (overall only)</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                {stratify && <p style={{ fontSize: '0.72rem', color: '#888', marginTop: 4 }}>
                  Groups: {Array.from(new Set(rows.map(r=>r[stratify]).filter(Boolean))).sort().join(', ')}
                </p>}
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>
                  CONTINUOUS VARIABLES DISPLAY
                </label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {[
                    { id: 'mean',   label: 'Mean ± SD'      },
                    { id: 'median', label: 'Median (IQR)'   },
                  ].map(opt => (
                    <button key={opt.id} onClick={() => setContinuous(opt.id as any)} className="btn" style={{
                      flex: 1, fontSize: '0.78rem', padding: '0.5rem',
                      background: continuous === opt.id ? '#1C2B3A' : '#eee',
                      color:      continuous === opt.id ? 'white'   : '#444',
                    }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={showMissing} onChange={e => setShowMissing(e.target.checked)} />
                  Show missing data column
                </label>
              </div>
              <button className="btn btn-primary btn-full" onClick={generate} disabled={rows.length === 0}>
                🔬 Generate Table 1
              </button>
            </div>
          )}
        </div>

        <div>
          {varRows.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
              <h2>Table 1 Generator</h2>
              <p style={{ color: '#888' }}>Upload your dataset, configure settings and click Generate Table 1.</p>
            </div>
          )}

          {varRows.length > 0 && (
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  { id: 'table',   label: '📊 Table'          },
                  { id: 'select',  label: '✏️ Customise'       },
                  { id: 'text',    label: '📄 Publication Text' },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="btn" style={{
                    background: activeTab === tab.id ? '#1C2B3A' : '#eee',
                    color:      activeTab === tab.id ? 'white'   : '#444',
                    padding: '0.5rem 1rem', fontSize: '0.85rem',
                  }}>
                    {tab.label}
                  </button>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-sage" style={{ fontSize: '0.82rem' }} onClick={() => {
                    navigator.clipboard.writeText(buildPublicationText());
                    setCopied(true); setTimeout(()=>setCopied(false),2000);
                  }}>
                    {copied ? '✓ Copied!' : '📋 Copy'}
                  </button>
                  <button className="btn" style={{ background: '#eee', color: '#444', fontSize: '0.82rem' }} onClick={exportCSV}>
                    ⬇️ CSV
                  </button>
                </div>
              </div>

              {/* TABLE TAB */}
              {activeTab === 'table' && (
                <div className="card">
                  <h2>Table 1. Baseline Characteristics{stratify ? ` by ${stratify}` : ''}</h2>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#1C2B3A', color: 'white' }}>
                          <th style={{ padding: '10px 12px', textAlign: 'left', minWidth: 160 }}>Variable</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            Overall<br/><span style={{ fontSize: '0.72rem', fontWeight: 400 }}>N = {nOverall}</span>
                          </th>
                          {groupLabels.map((g,i) => (
                            <th key={g} style={{ padding: '10px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                              {g}<br/><span style={{ fontSize: '0.72rem', fontWeight: 400 }}>n = {nGroups[i]}</span>
                            </th>
                          ))}
                          {stratify && <th style={{ padding: '10px 12px', textAlign: 'center' }}>p-value</th>}
                          {showMissing && <th style={{ padding: '10px 12px', textAlign: 'center' }}>Missing</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {includedRows.map((r, i) => {
                          const isHeader = !r.variable.startsWith('  ') && r.type === 'categorical' && r.overall.startsWith('n =');
                          return (
                            <tr key={i} style={{ background: isHeader ? '#f0f4f8' : i%2===0 ? '#f8f7f4' : 'white', borderBottom: '1px solid #eee' }}>
                              <td style={{ padding: '8px 12px', fontWeight: isHeader ? 700 : 400, color: isHeader ? '#1C2B3A' : '#333', paddingLeft: r.variable.startsWith('  ') ? 28 : 12 }}>
                                {r.variable.trim()}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                {isHeader ? '' : r.overall}
                              </td>
                              {groupLabels.map((g, gi) => (
                                <td key={g} style={{ padding: '8px 12px', textAlign: 'center' }}>
                                  {isHeader ? '' : (r.groups[gi] || '—')}
                                </td>
                              ))}
                              {stratify && (
                                <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: r.p && parseFloat(r.p) < 0.05 ? 700 : 400, color: r.p && parseFloat(r.p) < 0.05 ? '#C0533A' : '#888' }}>
                                  {r.p || (isHeader ? '' : '—')}
                                </td>
                              )}
                              {showMissing && (
                                <td style={{ padding: '8px 12px', textAlign: 'center', color: r.missing > 0 ? '#f44336' : '#aaa' }}>
                                  {r.missing > 0 ? r.missing : '0'}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.75rem', fontStyle: 'italic' }}>
                    {continuous === 'mean'
                      ? 'Continuous variables presented as mean ± SD; categorical variables as n (%).'
                      : 'Continuous variables presented as median (IQR); categorical variables as n (%).'}
                    {stratify && ' P-values from independent t-test and chi-square test.'}
                  </p>
                </div>
              )}

              {/* CUSTOMISE TAB */}
              {activeTab === 'select' && (
                <div className="card">
                  <h2>Customise Variables</h2>
                  <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>
                    Toggle variables to include or exclude from Table 1.
                  </p>
                  {varRows.filter(r => !r.variable.startsWith('  ')).map((r, i) => {
                    const actualIdx = varRows.indexOf(r);
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' }}>
                        <input type="checkbox" checked={r.include} onChange={() => toggleInclude(actualIdx)}
                          style={{ accentColor: '#C0533A' }} />
                        <span style={{ flex: 1, fontSize: '0.88rem', color: r.include ? '#333' : '#bbb', textDecoration: r.include ? 'none' : 'line-through' }}>
                          {r.variable}
                        </span>
                        <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: 6, background: r.type === 'continuous' ? '#dbeafe' : '#fce7f3', color: r.type === 'continuous' ? '#1d4ed8' : '#9d174d' }}>
                          {r.type}
                        </span>
                        {r.missing > 0 && (
                          <span style={{ fontSize: '0.72rem', color: '#f44336' }}>{r.missing} missing</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* PUBLICATION TEXT TAB */}
              {activeTab === 'text' && (
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>Publication-Ready Text</h2>
                    <button className="btn btn-sage" onClick={() => {
                      navigator.clipboard.writeText(buildPublicationText());
                      setCopied(true); setTimeout(()=>setCopied(false),2000);
                    }}>
                      {copied ? '✓ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                  <pre style={{ background: '#f8f7f4', borderRadius: 8, padding: '1.25rem', fontSize: '0.82rem', lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre-wrap', color: '#333' }}>
                    {buildPublicationText()}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
