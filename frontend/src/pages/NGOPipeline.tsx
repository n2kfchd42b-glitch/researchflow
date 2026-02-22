import React, { useState } from 'react';
import { api } from '../services/api';

export default function NGOPipeline() {
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [datasetId, setDatasetId]       = useState('');
  const [programme, setProgramme]       = useState('');
  const [organisation, setOrganisation] = useState('');
  const [donor, setDonor]               = useState('');
  const [outcome, setOutcome]           = useState('');
  const [predictors, setPredictors]     = useState<string[]>([]);
  const [results, setResults]           = useState<any>(null);
  const [rigor, setRigor]               = useState<any>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

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
      setError('Upload failed: ' + (err.message || 'Unknown error'));
    }
    setLoading(false);
  }

  function togglePredictor(col: string) {
    setPredictors(prev =>
      prev.includes(col)
        ? prev.filter(p => p !== col)
        : [...prev, col]
    );
  }

  async function runEvaluation() {
    setLoading(true);
    setError('');
    try {
      const studyRes = await api.createStudy({
        title: programme || 'Programme Evaluation',
        description: `Evaluation for ${donor}`,
        study_type: 'retrospective_cohort',
        user_role: 'ngo'
      });
      const sid = studyRes.id;
      const analysisRes = await api.analyseStudy(sid, {
        dataset_id: datasetId,
        outcome_column: outcome,
        predictor_columns: predictors
      });
      setResults(analysisRes.results);
      setRigor(analysisRes.rigor_score);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        'Evaluation failed. Check your selections.'
      );
    }
    setLoading(false);
  }

  function getRigorColor(score: number) {
    if (score >= 70) return '#4caf50';
    if (score >= 40) return '#ff9800';
    return '#f44336';
  }

  const columns = uploadResult
    ? Object.keys(uploadResult.column_types)
    : [];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Sidebar */}
      <div style={{ width: 220, background: '#1C2B3A', padding: '2rem 1rem', color: 'white' }}>
        <h2 style={{ color: '#C0533A', marginBottom: '2rem', fontSize: '1.1rem' }}>
          NGO Dashboard
        </h2>
        {[
          { icon: '📊', label: 'New Evaluation' },
          { icon: '📁', label: 'My Studies' },
          { icon: '📄', label: 'Reports' },
          { icon: '⚙️', label: 'Settings' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 6, marginBottom: 4, background: i === 0 ? 'rgba(192,83,58,0.2)' : 'transparent', cursor: 'pointer' }}>
            <span>{item.icon}</span>
            <span style={{ fontSize: '0.9rem', opacity: i === 0 ? 1 : 0.7 }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '2rem', background: '#f8f7f4' }}>
        <h1 style={{ color: '#5A8A6A', marginBottom: 0 }}>Programme Evaluation</h1>
        <p style={{ marginBottom: '1.5rem' }}>
          From raw data to donor-ready evaluation report.
        </p>

        {error && (
          <div className="alert alert-critical">{error}</div>
        )}

        {/* Programme Details */}
        <div className="card">
          <h2>Programme Details</h2>
          <div className="grid-2">
            <div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Programme Name</label>
              <input value={programme} onChange={e => setProgramme(e.target.value)}
                placeholder="e.g. Community Health Worker Programme"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }} />
            </div>
            <div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Organisation</label>
              <input value={organisation} onChange={e => setOrganisation(e.target.value)}
                placeholder="e.g. Health NGO Tanzania"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }} />
            </div>
            <div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Donor / Funder</label>
              <input value={donor} onChange={e => setDonor(e.target.value)}
                placeholder="e.g. USAID, Gates Foundation"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }} />
            </div>
          </div>
        </div>

        {/* Data Upload */}
        <div className="card">
          <h2>Upload Programme Data</h2>
          <label className="upload-zone" style={{ display: 'block', cursor: 'pointer' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📂</div>
            <p style={{ fontWeight: 600, color: '#5A8A6A' }}>
              Tap to upload evaluation dataset
            </p>
            <p style={{ fontSize: '0.85rem' }}>CSV, XLSX, SAV, DTA</p>
            <input type="file" accept=".csv,.xlsx,.xls,.sav,.dta"
              onChange={handleUpload} style={{ display: 'none' }} />
          </label>

          {loading && !results && (
            <p style={{ textAlign: 'center', marginTop: '1rem', color: '#5A8A6A' }}>
              Processing data...
            </p>
          )}

          {uploadResult && (
            <div style={{ marginTop: '1rem' }}>
              <div className="alert alert-success">
                ✓ {uploadResult.rows} records loaded across {uploadResult.columns} variables
              </div>
              <div className="grid-2" style={{ marginTop: '1rem' }}>
                <div style={{ background: '#f0f4f8', padding: '1rem', borderRadius: 8 }}>
                  <p style={{ fontWeight: 700, fontSize: '1.5rem', color: '#1C2B3A', marginBottom: 0 }}>
                    {uploadResult.rows}
                  </p>
                  <p style={{ fontSize: '0.85rem', marginBottom: 0 }}>Total Records</p>
                </div>
                <div style={{ background: '#f0f4f8', padding: '1rem', borderRadius: 8 }}>
                  <p style={{ fontWeight: 700, fontSize: '1.5rem', color: '#1C2B3A', marginBottom: 0 }}>
                    {uploadResult.issues.length}
                  </p>
                  <p style={{ fontSize: '0.85rem', marginBottom: 0 }}>Data Issues Found</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Configuration */}
        {uploadResult && (
          <div className="card">
            <h2>Evaluation Configuration</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Primary Outcome
              </label>
              <select value={outcome} onChange={e => setOutcome(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }}>
                <option value="">Select outcome variable...</option>
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Variables to Analyse
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {columns.filter(c => c !== outcome).map(col => (
                  <span key={col} onClick={() => togglePredictor(col)}
                    className="badge"
                    style={{
                      cursor: 'pointer',
                      background: predictors.includes(col) ? '#5A8A6A' : '#eee',
                      color: predictors.includes(col) ? 'white' : '#444',
                      padding: '0.4rem 0.9rem'
                    }}>
                    {col}
                  </span>
                ))}
              </div>
            </div>
            <button
              className="btn btn-full"
              style={{ background: '#5A8A6A', color: 'white', marginTop: '1.5rem' }}
              onClick={runEvaluation}
              disabled={!outcome || predictors.length === 0 || loading}>
              {loading ? 'Running Evaluation...' : '▶ Run Evaluation'}
            </button>
          </div>
        )}

        {/* Results */}
        {results && rigor && (
          <div>
            <div className="card" style={{ borderTop: '4px solid #5A8A6A' }}>
              <h2>Evaluation Results</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 100, height: 100, borderRadius: '50%', border: `8px solid ${getRigorColor(rigor.overall_score)}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: 700, color: getRigorColor(rigor.overall_score) }}>
                      {rigor.overall_score}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#888' }}>Rigor</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1C2B3A' }}>
                    {results.interpretation}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    <span className="badge badge-blue">n = {results.n}</span>
                    <span className="badge badge-green">Grade: {rigor.grade}</span>
                    <span className="badge badge-orange">{results.model}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h2>Score Breakdown</h2>
              {Object.entries(rigor.breakdown).map(([key, val]: any) => (
                <div key={key} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span style={{ color: '#5A8A6A', fontWeight: 700 }}>
                      {val.score}/{val.max}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(val.score/val.max)*100}%`, background: '#5A8A6A' }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <h2>Recommendations for Donor Report</h2>
              {rigor.recommendations.map((rec: string, i: number) => (
                <div key={i} className="alert alert-success">✓ {rec}</div>
              ))}
            </div>

            <button className="btn btn-full"
              style={{ background: '#5A8A6A', color: 'white', marginTop: '1rem' }}>
              📄 Download Donor Report (PDF)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}