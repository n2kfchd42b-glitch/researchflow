import React, { useState } from 'react';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { API_URL } from '../config';

export default function PropensityMatching() {
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [datasetId, setDatasetId]       = useState('');
  const [treatment, setTreatment]       = useState('');
  const [covariates, setCovariates]     = useState<string[]>([]);
  const [caliper, setCaliper]           = useState(0.2);
  const [result, setResult]             = useState<any>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [activeTab, setActiveTab]       = useState('summary');

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.upload(file);
      setUploadResult(data);
      setDatasetId(data.dataset_id);
    } catch (err: any) {
      setError('Upload failed: ' + err.message);
    }
    setLoading(false);
  }

  function toggleCovariate(col: string) {
    setCovariates(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  }

  async function runPSM() {
    if (!treatment || covariates.length === 0) {
      setError('Please select a treatment variable and at least one covariate.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/psm/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_id:     datasetId,
          treatment_col:  treatment,
          covariate_cols: covariates,
          caliper,
          ratio: 1,
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
      setActiveTab('summary');
    } catch (err: any) {
      setError('PSM failed: ' + err.message);
    }
    setLoading(false);
  }

  const columns = uploadResult ? Object.keys(uploadResult.column_types) : [];

  const smdChartData = result?.balance_before?.map((b: any, i: number) => ({
    name:   b.covariate.length > 12 ? b.covariate.slice(0, 12) + '…' : b.covariate,
    Before: b.smd,
    After:  result.balance_after?.[i]?.smd || 0,
  })) || [];

  return (
    <div className="page">
      <h1 style={{ color: '#1C2B3A' }}>Propensity Score Matching</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        Reduce confounding in observational studies by matching treated and control participants on their probability of treatment.
      </p>

      {error && <div className="alert alert-critical">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '1.5rem' }}>
        <div>
          {!uploadResult ? (
            <div className="card">
              <h2>Upload Dataset</h2>
              <label className="upload-zone" style={{ display: 'block', cursor: 'pointer' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📂</div>
                <p style={{ fontWeight: 600, color: '#1C2B3A' }}>Upload your dataset</p>
                <p style={{ fontSize: '0.85rem' }}>CSV, XLSX, SAV, DTA</p>
                <input type="file" accept=".csv,.xlsx,.xls,.sav,.dta"
                  onChange={handleUpload} style={{ display: 'none' }} />
              </label>
            </div>
          ) : (
            <div>
              <div className="card">
                <h2>Treatment Variable</h2>
                <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.75rem' }}>
                  Select the binary variable indicating treatment/exposure (1 = treated, 0 = control).
                </p>
                <select value={treatment} onChange={e => setTreatment(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }}>
                  <option value="">Select treatment variable...</option>
                  {columns.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
              </div>

              <div className="card">
                <h2>Covariates</h2>
                <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.75rem' }}>
                  Select variables to match on — these are potential confounders.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {columns.filter(c => c !== treatment).map(col => (
                    <button key={col} onClick={() => toggleCovariate(col)} style={{
                      padding: '0.4rem 0.9rem', borderRadius: 20, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                      background: covariates.includes(col) ? '#5A8A6A' : '#f0f0f0',
                      color: covariates.includes(col) ? 'white' : '#444',
                      border: '1px solid ' + (covariates.includes(col) ? '#5A8A6A' : '#ddd')
                    }}>
                      {col}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2>Caliper Width</h2>
                <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.75rem' }}>
                  Maximum allowed difference in propensity scores. Smaller = stricter matching.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input type="range" min="0.05" max="0.5" step="0.05"
                    value={caliper} onChange={e => setCaliper(parseFloat(e.target.value))}
                    style={{ flex: 1 }} />
                  <span style={{ fontWeight: 700, color: '#C0533A', minWidth: 40 }}>{caliper}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#aaa', marginTop: 4 }}>
                  <span>Strict (0.05)</span>
                  <span>Lenient (0.50)</span>
                </div>
              </div>

              <button className="btn btn-primary btn-full" onClick={runPSM}
                disabled={!treatment || covariates.length === 0 || loading}>
                {loading ? 'Matching...' : '🔗 Run Propensity Score Matching'}
              </button>
            </div>
          )}
        </div>

        <div>
          {!result && (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚖️</div>
              <h2>Propensity Score Matching</h2>
              <p>Upload your dataset, select your treatment variable and covariates, then run matching.</p>
              <div className="alert alert-success" style={{ textAlign: 'left', marginTop: '1.5rem' }}>
                <strong>When to use PSM:</strong> Use propensity score matching when comparing outcomes between treated and untreated groups in observational data where randomisation was not possible. PSM creates a pseudo-randomised comparison group.
              </div>
            </div>
          )}

          {result && (
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'summary',  label: '📊 Summary'         },
                  { id: 'balance',  label: '⚖️ Balance Table'   },
                  { id: 'chart',    label: '📈 SMD Chart'        },
                  { id: 'interpret',label: '📖 Interpretation'   },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="btn" style={{
                    background: activeTab === tab.id ? '#1C2B3A' : '#eee',
                    color: activeTab === tab.id ? 'white' : '#444',
                    padding: '0.5rem 1rem', fontSize: '0.85rem'
                  }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'summary' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    {[
                      { label: 'Treated (original)',  value: result.n_treated_original, color: '#C0533A' },
                      { label: 'Control (original)',  value: result.n_control_original, color: '#1C2B3A' },
                      { label: 'Treated (matched)',   value: result.n_treated_matched,  color: '#5A8A6A' },
                      { label: 'Control (matched)',   value: result.n_control_matched,  color: '#5A8A6A' },
                      { label: 'Match Rate',          value: result.match_rate + '%',   color: result.match_rate > 80 ? '#5A8A6A' : '#ff9800' },
                      { label: 'Unmatched Treated',   value: result.n_unmatched,        color: result.n_unmatched > 0 ? '#ff9800' : '#5A8A6A' },
                    ].map(item => (
                      <div key={item.label} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                        <p style={{ fontSize: '1.8rem', fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.value}</p>
                        <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 0 }}>{item.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="card">
                    <h2>Model Quality</h2>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8f7f4', borderRadius: 8 }}>
                      <span style={{ fontWeight: 600 }}>Propensity Model AUC</span>
                      <span style={{ fontWeight: 700, color: result.model_auc > 0.7 ? '#5A8A6A' : '#ff9800', fontSize: '1.2rem' }}>
                        {result.model_auc}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#888', marginTop: '0.5rem', marginBottom: 0 }}>
                      AUC &gt; 0.7 indicates good model discrimination. AUC close to 0.5 suggests poor separation between groups.
                    </p>
                  </div>

                  <div className="card">
                    <h2>Propensity Score Distribution</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      {['treated', 'control'].map(group => (
                        <div key={group} style={{ padding: '1rem', background: '#f8f7f4', borderRadius: 8 }}>
                          <p style={{ fontWeight: 700, color: group === 'treated' ? '#C0533A' : '#1C2B3A', marginBottom: 8, textTransform: 'capitalize' }}>
                            {group}
                          </p>
                          {['mean', 'std', 'min', 'max'].map(stat => (
                            <div key={stat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                              <span style={{ color: '#888', textTransform: 'capitalize' }}>{stat}</span>
                              <span style={{ fontWeight: 600 }}>{result.ps_distribution[group][stat]}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {result.imbalanced_after === 0 ? (
                    <div className="alert alert-success">
                      ✅ All covariates are balanced after matching (SMD &lt; 0.1). Your matched dataset is ready for outcome analysis.
                    </div>
                  ) : (
                    <div className="alert alert-warning">
                      ⚠️ {result.imbalanced_after} covariate(s) remain imbalanced after matching. Consider adjusting the caliper or adding more covariates.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'balance' && (
                <div className="card">
                  <h2>Covariate Balance Table</h2>
                  <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>
                    Standardised Mean Difference (SMD) &lt; 0.1 indicates good balance.
                  </p>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#1C2B3A', color: 'white' }}>
                          {['Covariate', 'Treated Mean', 'Control Mean', 'SMD Before', 'SMD After', 'Balanced?'].map(h => (
                            <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '0.8rem' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.balance_before?.map((b: any, i: number) => {
                          const after = result.balance_after?.[i];
                          return (
                            <tr key={b.covariate} style={{ background: i % 2 === 0 ? '#f8f7f4' : 'white' }}>
                              <td style={{ padding: '8px 10px', fontWeight: 600 }}>{b.covariate}</td>
                              <td style={{ padding: '8px 10px' }}>{after?.treated_mean ?? b.treated_mean}</td>
                              <td style={{ padding: '8px 10px' }}>{after?.control_mean ?? b.control_mean}</td>
                              <td style={{ padding: '8px 10px' }}>
                                <span style={{ color: b.smd > 0.1 ? '#f44336' : '#4caf50', fontWeight: 600 }}>{b.smd}</span>
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <span style={{ color: (after?.smd || 0) > 0.1 ? '#f44336' : '#4caf50', fontWeight: 600 }}>
                                  {after?.smd ?? '—'}
                                </span>
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <span style={{ fontSize: '1rem' }}>{after?.balanced ? '✅' : '❌'}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'chart' && (
                <div className="card">
                  <h2>Standardised Mean Differences</h2>
                  <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>
                    Bars crossing the red line (SMD = 0.1) indicate imbalance.
                  </p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={smdChartData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 'auto']} />
                      <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <ReferenceLine x={0.1} stroke="#f44336" strokeDasharray="4 4" label={{ value: '0.1', fill: '#f44336', fontSize: 11 }} />
                      <Bar dataKey="Before" fill="#C0533A" name="Before Matching" />
                      <Bar dataKey="After"  fill="#5A8A6A" name="After Matching"  />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {activeTab === 'interpret' && (
                <div>
                  <div className="card">
                    <h2>How to Report PSM in Your Paper</h2>
                    <div style={{ background: '#f8f7f4', borderRadius: 8, padding: '1.25rem', lineHeight: 1.8, fontSize: '0.88rem', color: '#333' }}>
                      <p><strong>Methods section text:</strong></p>
                      <p>
                        To reduce confounding, propensity score matching was performed using nearest-neighbour 
                        matching with a caliper of {result.caliper} (1:{1} ratio). 
                        Propensity scores were estimated using logistic regression including {covariates.join(', ')} as covariates 
                        (model AUC = {result.model_auc}). 
                        Of {result.n_treated_original} treated participants, {result.n_treated_matched} ({result.match_rate}%) 
                        were successfully matched to {result.n_control_matched} control participants. 
                        Covariate balance was assessed using standardised mean differences (SMD), 
                        with SMD &lt; 0.1 indicating adequate balance.
                        {result.imbalanced_after === 0
                          ? ' All covariates achieved balance after matching.'
                          : ` ${result.imbalanced_after} covariate(s) remained imbalanced after matching.`}
                      </p>
                    </div>
                  </div>
                  <div className="card">
                    <h2>Next Steps</h2>
                    {[
                      'Use the matched dataset for your outcome analysis',
                      'Run logistic regression on matched pairs using conditional logistic regression',
                      'Report both unmatched and matched results for transparency',
                      'Check overlap of propensity score distributions (common support)',
                      'Consider sensitivity analysis with different calipers',
                    ].map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderBottom: i < 4 ? '1px solid #eee' : 'none' }}>
                        <span style={{ color: '#5A8A6A', fontWeight: 700, minWidth: 20 }}>{i + 1}.</span>
                        <span style={{ fontSize: '0.88rem' }}>{step}</span>
                      </div>
                    ))}
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
