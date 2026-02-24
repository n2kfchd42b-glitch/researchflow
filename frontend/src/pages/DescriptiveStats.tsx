import React, { useState } from 'react';
import { api } from '../services/api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8004';

export default function DescriptiveStats() {
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [datasetId, setDatasetId]       = useState('');
  const [stats, setStats]               = useState<any>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [activeTab, setActiveTab]       = useState('numeric');
  const [copied, setCopied]             = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.upload(file);
      setUploadResult(data);
      setDatasetId(data.dataset_id);
      await loadStats(data.dataset_id);
    } catch (err: any) {
      setError('Upload failed: ' + err.message);
    }
    setLoading(false);
  }

  async function loadStats(did: string) {
    try {
      const res = await fetch(`${API_URL}/descriptive/${did}`);
      if (!res.ok) throw new Error('Failed to load statistics');
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    }
  }

  function copyTable() {
    if (!stats) return;
    const headers = ['Variable', 'N', 'Missing%', 'Mean', 'SD', 'Median', 'IQR', 'Min', 'Max', 'Normal?'];
    const rows = stats.numeric_summary.map((r: any) => [
      r.variable, r.n, r.missing_pct + '%',
      r.mean, r.sd, r.median,
      `${r.q1}–${r.q3}`, r.min, r.max,
      r.normal === null ? 'N/A' : r.normal ? 'Yes' : 'No'
    ]);
    const text = [headers, ...rows].map(r => r.join('\t')).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="page">
      <h1 style={{ color: '#1C2B3A' }}>Descriptive Statistics</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        Publication-ready summary statistics, frequency tables, normality tests and correlation matrix.
      </p>

      {error && <div className="alert alert-critical">{error}</div>}

      {!uploadResult && (
        <div className="card" style={{ maxWidth: 500 }}>
          <h2>Upload Dataset</h2>
          <label className="upload-zone" style={{ display: 'block', cursor: 'pointer' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📂</div>
            <p style={{ fontWeight: 600, color: '#1C2B3A' }}>Upload your dataset</p>
            <p style={{ fontSize: '0.85rem' }}>CSV, XLSX, SAV, DTA</p>
            <input type="file" accept=".csv,.xlsx,.xls,.sav,.dta"
              onChange={handleUpload} style={{ display: 'none' }} />
          </label>
          {loading && <p style={{ textAlign: 'center', color: '#888', marginTop: '1rem' }}>Computing statistics...</p>}
        </div>
      )}

      {stats && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Rows',          value: stats.n_rows,                          color: '#1C2B3A' },
              { label: 'Numeric Variables',   value: stats.numeric_cols?.length || 0,       color: '#C0533A' },
              { label: 'Categorical Variables',value: stats.categorical_cols?.length || 0,  color: '#5A8A6A' },
              { label: 'Normal Distributions',value: stats.numeric_summary?.filter((r: any) => r.normal === true).length || 0, color: '#2196f3' },
            ].map(item => (
              <div key={item.label} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                <p style={{ fontSize: '1.8rem', fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.value}</p>
                <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 0 }}>{item.label}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'numeric',      label: '📊 Continuous Variables' },
              { id: 'categorical',  label: '📋 Categorical Variables' },
              { id: 'correlation',  label: '🔗 Correlation Matrix'    },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="btn" style={{
                background: activeTab === tab.id ? '#1C2B3A' : '#eee',
                color: activeTab === tab.id ? 'white' : '#444',
                padding: '0.5rem 1rem'
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'numeric' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ marginBottom: 0 }}>Continuous Variables — Table 1</h2>
                <button className="btn btn-sage" onClick={copyTable} style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
                  {copied ? '✓ Copied!' : '📋 Copy for Word'}
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#1C2B3A', color: 'white' }}>
                      {['Variable', 'N', 'Missing', 'Mean (SD)', 'Median (IQR)', 'Range', 'Skewness', 'Normal?'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.numeric_summary?.map((row: any, i: number) => (
                      <tr key={row.variable} style={{ background: i % 2 === 0 ? '#f8f7f4' : 'white' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{row.variable}</td>
                        <td style={{ padding: '8px 10px' }}>{row.n}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ color: row.missing_pct > 10 ? '#f44336' : row.missing_pct > 0 ? '#ff9800' : '#4caf50' }}>
                            {row.missing_pct}%
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px' }}>{row.mean} ({row.sd})</td>
                        <td style={{ padding: '8px 10px' }}>{row.median} ({row.q1}–{row.q3})</td>
                        <td style={{ padding: '8px 10px' }}>{row.min}–{row.max}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ color: Math.abs(row.skewness) > 1 ? '#ff9800' : '#4caf50' }}>
                            {row.skewness}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {row.normal === null ? (
                            <span style={{ color: '#aaa', fontSize: '0.78rem' }}>N/A</span>
                          ) : row.normal ? (
                            <span style={{ color: '#4caf50', fontWeight: 700 }}>✓ Yes</span>
                          ) : (
                            <span style={{ color: '#f44336', fontWeight: 700 }}>✗ No</span>
                          )}
                          {row.shapiro_p !== null && (
                            <span style={{ fontSize: '0.72rem', color: '#aaa', marginLeft: 4 }}>
                              p={row.shapiro_p}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#aaa', marginTop: '0.75rem', marginBottom: 0 }}>
                Normality assessed by Shapiro-Wilk test (p &gt; 0.05 = normal). IQR = interquartile range.
              </p>
            </div>
          )}

          {activeTab === 'categorical' && (
            <div>
              {stats.categorical_summary?.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>No categorical variables found in this dataset.</p>
                </div>
              )}
              {stats.categorical_summary?.map((cat: any) => (
                <div key={cat.variable} className="card" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ marginBottom: 4 }}>{cat.variable}</h3>
                      <span style={{ fontSize: '0.82rem', color: '#888' }}>
                        n = {cat.n} · {cat.n_unique} unique values · {cat.missing_pct}% missing
                      </span>
                    </div>
                    <span style={{ padding: '0.3rem 0.75rem', background: '#f0f4f8', borderRadius: 20, fontSize: '0.8rem', color: '#1C2B3A', fontWeight: 600 }}>
                      Mode: {cat.mode}
                    </span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#f8f7f4' }}>
                          <th style={{ padding: '6px 10px', textAlign: 'left', color: '#555' }}>Value</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right', color: '#555' }}>N</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right', color: '#555' }}>%</th>
                          <th style={{ padding: '6px 10px', textAlign: 'left', color: '#555' }}>Distribution</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cat.freq_table?.map((row: any, i: number) => (
                          <tr key={row.value} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '6px 10px', fontWeight: 600 }}>{row.value}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right' }}>{row.n}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', color: '#C0533A', fontWeight: 600 }}>{row.pct}%</td>
                            <td style={{ padding: '6px 10px' }}>
                              <div style={{ background: '#eee', borderRadius: 4, height: 8, width: '100%' }}>
                                <div style={{ background: '#C0533A', borderRadius: 4, height: 8, width: `${row.pct}%` }} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'correlation' && (
            <div className="card">
              <h2>Correlation Matrix</h2>
              {!stats.correlation?.columns?.length ? (
                <p style={{ color: '#888' }}>Need at least 2 numeric variables for correlation matrix.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '8px 10px', background: '#1C2B3A', color: 'white' }}></th>
                        {stats.correlation.columns.map((col: string) => (
                          <th key={col} style={{ padding: '8px 10px', background: '#1C2B3A', color: 'white', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                            {col.length > 10 ? col.slice(0, 10) + '…' : col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.correlation.matrix?.map((row: number[], i: number) => (
                        <tr key={i}>
                          <td style={{ padding: '8px 10px', fontWeight: 600, background: '#f8f7f4', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                            {stats.correlation.columns[i].length > 10
                              ? stats.correlation.columns[i].slice(0, 10) + '…'
                              : stats.correlation.columns[i]}
                          </td>
                          {row.map((val: number, j: number) => {
                            const absVal = Math.abs(val);
                            const bg = i === j ? '#1C2B3A'
                              : absVal > 0.7 ? (val > 0 ? '#C0533A' : '#1C2B3A')
                              : absVal > 0.4 ? (val > 0 ? '#e8998a' : '#8aa8c0')
                              : '#f8f7f4';
                            const color = (i === j || absVal > 0.4) ? 'white' : '#333';
                            return (
                              <td key={j} style={{ padding: '8px 10px', textAlign: 'center', background: bg, color, fontWeight: absVal > 0.4 ? 700 : 400 }}>
                                {i === j ? '1.00' : val.toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p style={{ fontSize: '0.78rem', color: '#aaa', marginTop: '0.75rem', marginBottom: 0 }}>
                    Pearson correlation coefficients. Dark red = strong positive, dark blue = strong negative.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
