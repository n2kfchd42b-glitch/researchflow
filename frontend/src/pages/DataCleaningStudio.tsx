import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { API_URL } from '../config';

export default function DataCleaningStudio() {
  const [uploadResult, setUploadResult]   = useState<any>(null);
  const [datasetId, setDatasetId]         = useState('');
  const [summary, setSummary]             = useState<any>(null);
  const [activeTab, setActiveTab]         = useState('overview');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const [selectedCol, setSelectedCol]     = useState('');
  const [outlierResult, setOutlierResult] = useState<any>(null);
  const [imputing, setImputing]           = useState(false);
  const [cleaningLog, setCleaningLog]     = useState<any[]>([]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.upload(file);
      setUploadResult(data);
      setDatasetId(data.dataset_id);
      await loadSummary(data.dataset_id);
    } catch (err: any) {
      setError('Upload failed: ' + err.message);
    }
    setLoading(false);
  }

  async function loadSummary(did: string) {
    try {
      const res = await fetch(`${API_URL}/clean/${did}/summary`);
      const data = await res.json();
      setSummary(data);
    } catch (err: any) {
      setError('Failed to load summary');
    }
  }

  async function handleOutlierDetect() {
    if (!selectedCol) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/clean/outliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset_id: datasetId, column: selectedCol, method: 'iqr' })
      });
      const data = await res.json();
      setOutlierResult(data);
    } catch (err: any) {
      setError('Outlier detection failed');
    }
    setLoading(false);
  }

  async function handleImpute(column: string, method: string) {
    setImputing(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/clean/impute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset_id: datasetId, column, method })
      });
      const data = await res.json();
      setSuccess(`Imputed ${data.imputed_count} missing values in '${column}' using ${method}`);
      setCleaningLog(prev => [...prev, { action: 'IMPUTE', column, method, count: data.imputed_count, time: new Date().toLocaleTimeString() }]);
      await loadSummary(datasetId);
    } catch (err: any) {
      setError('Imputation failed');
    }
    setImputing(false);
  }

  async function handleRemoveDuplicates() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/clean/${datasetId}/duplicates`, { method: 'DELETE' });
      const data = await res.json();
      setSuccess(`Removed ${data.removed} duplicate rows. ${data.rows_remaining} rows remaining.`);
      setCleaningLog(prev => [...prev, { action: 'REMOVE_DUPLICATES', count: data.removed, time: new Date().toLocaleTimeString() }]);
      await loadSummary(datasetId);
    } catch (err: any) {
      setError('Failed to remove duplicates');
    }
    setLoading(false);
  }

  const numericColumns = uploadResult
    ? Object.entries(uploadResult.column_types)
        .filter(([, type]: any) => type.includes('continuous') || type.includes('numeric'))
        .map(([col]) => col)
    : [];

  const allColumns = uploadResult ? Object.keys(uploadResult.column_types) : [];

  return (
    <div className="page">
      <h1 style={{ color: '#1C2B3A' }}>Data Cleaning Studio</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        Detect outliers, impute missing values, remove duplicates and prepare your data for analysis.
      </p>

      {error   && <div className="alert alert-critical">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {!uploadResult && (
        <div className="card" style={{ maxWidth: 500 }}>
          <h2>Upload Dataset</h2>
          <label className="upload-zone" style={{ display: 'block', cursor: 'pointer' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📂</div>
            <p style={{ fontWeight: 600, color: '#1C2B3A' }}>Upload your dataset to begin cleaning</p>
            <p style={{ fontSize: '0.85rem' }}>CSV, XLSX, SAV, DTA</p>
            <input type="file" accept=".csv,.xlsx,.xls,.sav,.dta"
              onChange={handleUpload} style={{ display: 'none' }} />
          </label>
          {loading && <p style={{ textAlign: 'center', color: '#888', marginTop: '1rem' }}>Uploading...</p>}
        </div>
      )}

      {uploadResult && summary && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Rows',    value: uploadResult.rows,                          color: '#1C2B3A' },
              { label: 'Columns',       value: uploadResult.columns,                       color: '#5A8A6A' },
              { label: 'Missing Fields',value: Object.keys(summary.missing || {}).length,   color: '#ff9800' },
              { label: 'Duplicates',    value: summary.duplicates?.duplicate_count || 0,    color: '#C0533A' },
            ].map(item => (
              <div key={item.label} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.value}</p>
                <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: 0 }}>{item.label}</p>
              </div>
            ))}
          </div>

          {summary.recommendations?.length > 0 && (
            <div className="card" style={{ borderLeft: '4px solid #C0533A', marginBottom: '1.5rem' }}>
              <h2>🔍 AI Recommendations</h2>
              {summary.recommendations.map((rec: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: i < summary.recommendations.length - 1 ? '1px solid #eee' : 'none' }}>
                  <span style={{ color: '#C0533A', fontSize: '1.2rem' }}>⚠️</span>
                  <span style={{ fontSize: '0.9rem' }}>{rec}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {['overview', 'missing', 'outliers', 'duplicates', 'log'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className="btn" style={{
                background: activeTab === tab ? '#1C2B3A' : '#eee',
                color: activeTab === tab ? 'white' : '#444',
                padding: '0.5rem 1rem', textTransform: 'capitalize'
              }}>
                {tab === 'log' ? '📋 Cleaning Log' :
                 tab === 'missing' ? '❓ Missing Values' :
                 tab === 'outliers' ? '📊 Outliers' :
                 tab === 'duplicates' ? '🔄 Duplicates' : '📈 Overview'}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="card">
              <h2>Dataset Overview</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#1C2B3A', color: 'white' }}>
                      {['Column', 'Type', 'Missing %', 'Outliers', 'Status'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allColumns.map((col, i) => {
                      const missingPct = summary.missing?.[col] || 0;
                      const outlierCount = summary.outliers?.[col] || 0;
                      const status = missingPct > 30 ? 'Critical' : missingPct > 5 ? 'Warning' : outlierCount > 5 ? 'Review' : 'Good';
                      const statusColor = status === 'Critical' ? '#f44336' : status === 'Warning' ? '#ff9800' : status === 'Review' ? '#2196f3' : '#4caf50';
                      return (
                        <tr key={col} style={{ background: i % 2 === 0 ? '#f8f7f4' : 'white' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600 }}>{col}</td>
                          <td style={{ padding: '8px 12px', color: '#888', fontSize: '0.82rem' }}>
                            {uploadResult.column_types[col]}
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ color: missingPct > 10 ? '#f44336' : missingPct > 0 ? '#ff9800' : '#4caf50', fontWeight: 600 }}>
                              {missingPct}%
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            {outlierCount > 0 ? <span style={{ color: '#ff9800', fontWeight: 600 }}>{outlierCount}</span> : <span style={{ color: '#4caf50' }}>0</span>}
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, background: statusColor + '22', color: statusColor }}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'missing' && (
            <div>
              {Object.keys(summary.missing || {}).length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                  <h2>No Missing Values</h2>
                  <p>Your dataset has no missing values.</p>
                </div>
              ) : (
                Object.entries(summary.missing).map(([col, pct]: any) => (
                  <div key={col} className="card" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ marginBottom: 4 }}>{col}</h3>
                        <span style={{ color: pct > 20 ? '#f44336' : '#ff9800', fontWeight: 600 }}>
                          {pct}% missing
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['mean', 'median', 'mode', 'zero'].map(method => (
                          <button key={method} className="btn" disabled={imputing}
                            onClick={() => handleImpute(col, method)}
                            style={{ background: '#f8f7f4', color: '#1C2B3A', padding: '0.4rem 0.8rem', fontSize: '0.82rem', border: '1px solid #ddd' }}>
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: '#f8f7f4', borderRadius: 6, height: 8 }}>
                      <div style={{ background: pct > 20 ? '#f44336' : '#ff9800', borderRadius: 6, height: 8, width: `${pct}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'outliers' && (
            <div>
              <div className="card" style={{ marginBottom: '1rem' }}>
                <h2>Outlier Detection</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Select Column</label>
                    <select value={selectedCol} onChange={e => setSelectedCol(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc' }}>
                      <option value="">Select numeric column...</option>
                      {numericColumns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </div>
                  <button className="btn btn-primary" onClick={handleOutlierDetect} disabled={!selectedCol || loading}>
                    Detect Outliers
                  </button>
                </div>
              </div>

              {outlierResult && (
                <div className="card">
                  <h2>Results for: {outlierResult.column}</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                    {[
                      { label: 'Outliers Found', value: outlierResult.outlier_count, color: outlierResult.outlier_count > 0 ? '#C0533A' : '#5A8A6A' },
                      { label: 'Lower Bound',    value: outlierResult.lower_bound,   color: '#1C2B3A' },
                      { label: 'Upper Bound',    value: outlierResult.upper_bound,   color: '#1C2B3A' },
                    ].map(item => (
                      <div key={item.label} style={{ padding: '1rem', background: '#f8f7f4', borderRadius: 8, textAlign: 'center' }}>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.value}</p>
                        <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: 0 }}>{item.label}</p>
                      </div>
                    ))}
                  </div>
                  {outlierResult.outlier_count > 0 && (
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: 8 }}>Outlier Values:</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {outlierResult.outlier_values.map((v: any, i: number) => (
                          <span key={i} style={{ padding: '0.3rem 0.75rem', background: '#fff5f3', border: '1px solid #C0533A44', borderRadius: 20, fontSize: '0.85rem', color: '#C0533A', fontWeight: 600 }}>
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {outlierResult.outlier_count === 0 && (
                    <div className="alert alert-success">No outliers detected using IQR method.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'duplicates' && (
            <div className="card">
              <h2>Duplicate Detection</h2>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '3rem', fontWeight: 700, color: summary.duplicates?.duplicate_count > 0 ? '#C0533A' : '#5A8A6A', marginBottom: 8 }}>
                  {summary.duplicates?.duplicate_count || 0}
                </div>
                <p style={{ fontSize: '1rem', color: '#888', marginBottom: '1.5rem' }}>
                  duplicate rows detected ({summary.duplicates?.duplicate_pct || 0}% of dataset)
                </p>
                {summary.duplicates?.duplicate_count > 0 ? (
                  <button className="btn btn-primary" onClick={handleRemoveDuplicates} disabled={loading}>
                    Remove All Duplicates
                  </button>
                ) : (
                  <div className="alert alert-success">No duplicate rows found. Your dataset is clean.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'log' && (
            <div className="card">
              <h2>Cleaning Log</h2>
              {cleaningLog.length === 0 ? (
                <p style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>
                  No cleaning actions performed yet.
                </p>
              ) : (
                cleaningLog.map((entry, i) => (
                  <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.75rem', background: '#f8f7f4', borderRadius: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: '1.2rem' }}>
                      {entry.action === 'IMPUTE' ? '🔧' : entry.action === 'REMOVE_DUPLICATES' ? '🗑️' : '✏️'}
                    </span>
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: 2 }}>{entry.action.replace(/_/g, ' ')}</p>
                      <p style={{ fontSize: '0.82rem', color: '#555', marginBottom: 0 }}>
                        {entry.column && `Column: ${entry.column} · `}
                        {entry.method && `Method: ${entry.method} · `}
                        {entry.count !== undefined && `Affected: ${entry.count} rows`}
                      </p>
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#aaa' }}>{entry.time}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
