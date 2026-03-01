import React, { useState } from 'react';
import { api } from '../services/api';
import { API_URL } from '../config';

const CATEGORY_COLORS: Record<string, string> = {
  outcome:        '#C0533A',
  exposure:       '#1C2B3A',
  demographic:    '#5A8A6A',
  socioeconomic:  '#9c27b0',
  clinical:       '#2196f3',
  anthropometric: '#ff9800',
  location:       '#795548',
  time:           '#607d8b',
  survey_variable:'#00897b',
};

const CATEGORY_ICONS: Record<string, string> = {
  outcome:        '🎯',
  exposure:       '💊',
  demographic:    '👤',
  socioeconomic:  '💰',
  clinical:       '🏥',
  anthropometric: '📏',
  location:       '📍',
  time:           '⏱️',
  survey_variable:'📋',
};

export default function InstrumentRecognition() {
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [datasetId, setDatasetId]       = useState('');
  const [recognition, setRecognition]   = useState<any>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [activeTab, setActiveTab]       = useState('overview');

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.upload(file);
      setUploadResult(data);
      setDatasetId(data.dataset_id);
      await runRecognition(data.dataset_id);
    } catch (err: any) {
      setError('Upload failed: ' + err.message);
    }
    setLoading(false);
  }

  async function runRecognition(did: string) {
    try {
      const res = await fetch(`${API_URL}/instrument/${did}`);
      if (!res.ok) throw new Error('Recognition failed');
      const data = await res.json();
      setRecognition(data);
    } catch (err: any) {
      setError('Instrument recognition failed: ' + err.message);
    }
  }

  const categories = recognition
    ? Array.from(new Set<string>(Object.values(recognition.variable_categories) as string[]))
    : [];

  return (
    <div className="page">
      <h1 style={{ color: '#1C2B3A' }}>WHO/DHS Instrument Recognition</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        Automatically detect survey instruments and label variables from DHS, MICS, WHO STEPS and other global health surveys.
      </p>

      {error && <div className="alert alert-critical">{error}</div>}

      {!uploadResult && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { name: 'DHS', icon: '🌍', desc: 'Demographic and Health Survey — 90+ countries', color: '#C0533A' },
            { name: 'MICS', icon: '👶', desc: 'Multiple Indicator Cluster Survey — UNICEF', color: '#5A8A6A' },
            { name: 'STEPS', icon: '❤️', desc: 'WHO STEPwise NCD Risk Factor Survey', color: '#1C2B3A' },
          ].map(survey => (
            <div key={survey.name} className="card" style={{ textAlign: 'center', borderTop: `4px solid ${survey.color}` }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{survey.icon}</div>
              <h3 style={{ color: survey.color, marginBottom: 4 }}>{survey.name}</h3>
              <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: 0 }}>{survey.desc}</p>
            </div>
          ))}
        </div>
      )}

      {!uploadResult && (
        <div className="card" style={{ maxWidth: 500 }}>
          <h2>Upload Survey Dataset</h2>
          <label className="upload-zone" style={{ display: 'block', cursor: 'pointer' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📂</div>
            <p style={{ fontWeight: 600, color: '#1C2B3A' }}>Upload your survey dataset</p>
            <p style={{ fontSize: '0.85rem' }}>CSV, XLSX, SAV, DTA — variable names will be auto-detected</p>
            <input type="file" accept=".csv,.xlsx,.xls,.sav,.dta"
              onChange={handleUpload} style={{ display: 'none' }} />
          </label>
          {loading && <p style={{ textAlign: 'center', color: '#888', marginTop: '1rem' }}>Analysing instrument...</p>}
        </div>
      )}

      {recognition && (
        <div>
          {recognition.survey_info && (
            <div className="card" style={{ borderTop: '4px solid #C0533A', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '3rem' }}>🎉</div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ color: '#C0533A', marginBottom: 4 }}>
                    {recognition.survey_info.name} Detected!
                  </h2>
                  <p style={{ marginBottom: 4 }}>{recognition.survey_info.description}</p>
                  <span className="badge badge-green">
                    {recognition.survey_info.confidence}% confidence
                  </span>
                </div>
              </div>
              <div className="alert alert-success" style={{ marginTop: '1rem' }}>
                <strong>Analysis Note:</strong> {recognition.survey_info.analysis_notes}
              </div>
            </div>
          )}

          {!recognition.survey_info && (
            <div className="card" style={{ borderTop: '4px solid #5A8A6A', marginBottom: '1.5rem' }}>
              <h2>Generic Health Dataset Detected</h2>
              <p>No standard survey instrument detected. Variables have been labelled using common global health naming conventions.</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Columns',    value: recognition.total_columns,   color: '#1C2B3A' },
              { label: 'Labeled',          value: recognition.labeled_columns,  color: '#5A8A6A' },
              { label: 'Recognition Rate', value: recognition.recognition_rate + '%', color: '#C0533A' },
              { label: 'Unrecognized',     value: recognition.unrecognized_columns?.length || 0, color: '#ff9800' },
            ].map(item => (
              <div key={item.label} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                <p style={{ fontSize: '1.8rem', fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.value}</p>
                <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 0 }}>{item.label}</p>
              </div>
            ))}
          </div>

          {recognition.suggested_outcomes?.length > 0 && (
            <div className="card" style={{ marginBottom: '1rem', borderLeft: '4px solid #C0533A' }}>
              <h2>🎯 Suggested Outcome Variables</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {recognition.suggested_outcomes.map((col: string) => (
                  <div key={col} style={{ padding: '0.5rem 1rem', background: '#fff5f3', border: '1px solid #C0533A44', borderRadius: 8 }}>
                    <p style={{ fontWeight: 700, color: '#C0533A', marginBottom: 2, fontSize: '0.9rem' }}>{col}</p>
                    <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 0 }}>
                      {recognition.variable_labels[col] || 'Outcome variable'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recognition.suggested_predictors?.length > 0 && (
            <div className="card" style={{ marginBottom: '1rem', borderLeft: '4px solid #5A8A6A' }}>
              <h2>📊 Suggested Predictor Variables</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {recognition.suggested_predictors.map((col: string) => (
                  <div key={col} style={{ padding: '0.5rem 1rem', background: '#f3faf5', border: '1px solid #5A8A6A44', borderRadius: 8 }}>
                    <p style={{ fontWeight: 700, color: '#5A8A6A', marginBottom: 2, fontSize: '0.9rem' }}>{col}</p>
                    <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 0 }}>
                      {recognition.variable_labels[col] || 'Predictor variable'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {['overview', 'all', 'unrecognized'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className="btn" style={{
                background: activeTab === tab ? '#1C2B3A' : '#eee',
                color: activeTab === tab ? 'white' : '#444',
                padding: '0.5rem 1rem', textTransform: 'capitalize'
              }}>
                {tab === 'overview' ? '📋 By Category' : tab === 'all' ? '📊 All Variables' : '❓ Unrecognized'}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {categories.map(cat => {
                const cols = Object.entries(recognition.variable_categories)
                  .filter(([, c]) => c === cat)
                  .map(([col]) => col);
                return (
                  <div key={cat} className="card" style={{ borderLeft: `4px solid ${CATEGORY_COLORS[cat] || '#888'}` }}>
                    <h3 style={{ color: CATEGORY_COLORS[cat] || '#888', marginBottom: '0.75rem' }}>
                      {CATEGORY_ICONS[cat] || '•'} {cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#aaa', marginLeft: 8 }}>({cols.length})</span>
                    </h3>
                    {cols.map(col => (
                      <div key={col} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f0f0f0' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{col}</span>
                        <span style={{ fontSize: '0.78rem', color: '#888', maxWidth: '60%', textAlign: 'right' }}>
                          {recognition.variable_labels[col] || ''}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'all' && (
            <div className="card">
              <h2>All Variables</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#1C2B3A', color: 'white' }}>
                      {['Column', 'Label', 'Category'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(recognition.variable_labels).map((col, i) => (
                      <tr key={col} style={{ background: i % 2 === 0 ? '#f8f7f4' : 'white' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{col}</td>
                        <td style={{ padding: '8px 12px', color: '#555' }}>{recognition.variable_labels[col]}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{
                            padding: '0.2rem 0.6rem', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600,
                            background: (CATEGORY_COLORS[recognition.variable_categories[col]] || '#888') + '22',
                            color: CATEGORY_COLORS[recognition.variable_categories[col]] || '#888'
                          }}>
                            {CATEGORY_ICONS[recognition.variable_categories[col]] || ''} {recognition.variable_categories[col]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'unrecognized' && (
            <div className="card">
              <h2>Unrecognized Columns</h2>
              {recognition.unrecognized_columns?.length === 0 ? (
                <div className="alert alert-success">All columns were successfully recognized!</div>
              ) : (
                <div>
                  <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>
                    These columns were not matched to any known survey instrument or common naming convention.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {recognition.unrecognized_columns?.map((col: string) => (
                      <span key={col} style={{ padding: '0.4rem 0.9rem', background: '#fff3e0', border: '1px solid #ff980044', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, color: '#e65100' }}>
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
