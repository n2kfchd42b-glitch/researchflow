import React, { useState } from 'react';
import { api } from '../services/api';
import { DescriptiveStats, BivariateCharts, ResultsCharts } from '../components/AnalysisCharts';

export default function NGOPipeline() {
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [datasetId, setDatasetId]       = useState('');
  const [studyId, setStudyId]           = useState('');
  const [programme, setProgramme]       = useState('');
  const [organisation, setOrganisation] = useState('');
  const [donor, setDonor]               = useState('');
  const [outcome, setOutcome]           = useState('');
  const [predictors, setPredictors]     = useState<string[]>([]);
  const [results, setResults]           = useState<any>(null);
  const [rigor, setRigor]               = useState<any>(null);
  const [loading, setLoading]           = useState(false);
  const [downloading, setDownloading]   = useState(false);
  const [error, setError]               = useState('');
  const [activeTab, setActiveTab]       = useState('evaluation');

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
      prev.includes(col) ? prev.filter(p => p !== col) : [...prev, col]
    );
  }

  async function runEvaluation() {
    setLoading(true);
    setError('');
    try {
      const studyRes = await api.createStudy({
        title: programme || 'Programme Evaluation',
        description: 'Evaluation for ' + donor,
        study_type: 'retrospective_cohort',
        user_role: 'ngo'
      });
      setStudyId(studyRes.id);
      const analysisRes = await api.analyseStudy(studyRes.id, {
        dataset_id: datasetId,
        outcome_column: outcome,
        predictor_columns: predictors
      });
      setResults(analysisRes.results);
      setRigor(analysisRes.rigor_score);
      setActiveTab('results');
    } catch (err: any) {
      setError('Evaluation failed: ' + (err.message || 'Unknown error'));
    }
    setLoading(false);
  }

  async function handleDownload() {
    if (!studyId) return;
    setDownloading(true);
    try {
      await api.downloadReport(studyId, 'ngo');
    } catch (err: any) {
      setError('Download failed: ' + (err.message || 'Unknown error'));
    }
    setDownloading(false);
  }

  function getRigorColor(score: number) {
    if (score >= 70) return '#4caf50';
    if (score >= 40) return '#ff9800';
    return '#f44336';
  }

  const columns = uploadResult ? Object.keys(uploadResult.column_types) : [];

  const sidebarItems = [
    { id: 'evaluation', icon: '📊', label: 'New Evaluation' },
    { id: 'data',       icon: '📁', label: 'Data Explorer'  },
    { id: 'results',    icon: '📄', label: 'Results'        },
    { id: 'settings',   icon: '⚙️', label: 'Settings'       },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      <div style={{ width: 220, background: '#1C2B3A', padding: '2rem 1rem', color: 'white', flexShrink: 0 }}>
        <h2 style={{ color: '#C0533A', marginBottom: '0.5rem', fontSize: '1.1rem' }}>ResearchFlow</h2>
        <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '2rem' }}>NGO Dashboard</p>
        {sidebarItems.map(item => (
          <div key={item.id} onClick={() => setActiveTab(item.id)} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem', borderRadius: 6, marginBottom: 4,
            background: activeTab === item.id ? 'rgba(192,83,58,0.2)' : 'transparent',
            cursor: 'pointer'
          }}>
            <span>{item.icon}</span>
            <span style={{ fontSize: '0.9rem', opacity: activeTab === item.id ? 1 : 0.7 }}>{item.label}</span>
          </div>
        ))}
        {rigor && (
          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
            <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: 4 }}>Last Rigor Score</p>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: getRigorColor(rigor.overall_score), marginBottom: 0 }}>
              {rigor.overall_score}
            </p>
            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: 0 }}>{rigor.grade}</p>
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: '2rem', background: '#f8f7f4', overflowY: 'auto' }}>

        {error && <div className="alert alert-critical" style={{ marginBottom: '1rem' }}>{error}</div>}

        {activeTab === 'evaluation' && (
          <div>
            <h1 style={{ color: '#5A8A6A', marginBottom: 0 }}>New Programme Evaluation</h1>
            <p style={{ marginBottom: '1.5rem' }}>From raw data to donor-ready evaluation report.</p>

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

            <div className="card">
              <h2>Upload Programme Data</h2>
              <label className="upload-zone" style={{ display: 'block', cursor: 'pointer' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📂</div>
                <p style={{ fontWeight: 600, color: '#5A8A6A' }}>Tap to upload evaluation dataset</p>
                <p style={{ fontSize: '0.85rem' }}>CSV, XLSX, SAV, DTA</p>
                <input type="file" accept=".csv,.xlsx,.xls,.sav,.dta"
                  onChange={handleUpload} style={{ display: 'none' }} />
              </label>
              {loading && !results && (
                <p style={{ textAlign: 'center', marginTop: '1rem', color: '#5A8A6A' }}>Processing data...</p>
              )}
              {uploadResult && (
                <div style={{ marginTop: '1rem' }}>
                  <div className="alert alert-success">
                    {uploadResult.rows} records loaded across {uploadResult.columns} variables
                  </div>
                  <div className="grid-2" style={{ marginTop: '1rem' }}>
                    <div style={{ background: '#f0f4f8', padding: '1rem', borderRadius: 8 }}>
                      <p style={{ fontWeight: 700, fontSize: '1.5rem', color: '#1C2B3A', marginBottom: 0 }}>{uploadResult.rows}</p>
                      <p style={{ fontSize: '0.85rem', marginBottom: 0 }}>Total Records</p>
                    </div>
                    <div style={{ background: '#f0f4f8', padding: '1rem', borderRadius: 8 }}>
                      <p style={{ fontWeight: 700, fontSize: '1.5rem', color: uploadResult.issues.length > 0 ? '#f44336' : '#4caf50', marginBottom: 0 }}>
                        {uploadResult.issues.length}
                      </p>
                      <p style={{ fontSize: '0.85rem', marginBottom: 0 }}>Data Issues Found</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {uploadResult && (
              <div className="card">
                <h2>Evaluation Configuration</h2>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Primary Outcome</label>
                  <select value={outcome} onChange={e => setOutcome(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }}>
                    <option value="">Select outcome variable...</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Variables to Analyse</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {columns.filter(c => c !== outcome).map(col => (
                      <span key={col} onClick={() => togglePredictor(col)} className="badge" style={{
                        cursor: 'pointer',
                        background: predictors.includes(col) ? '#5A8A6A' : '#eee',
                        color: predictors.includes(col) ? 'white' : '#444',
                        padding: '0.4rem 0.9rem'
                      }}>
                        {col}
                      </span>
                    ))}
                  </div>
                  {predictors.length > 0 && (
                    <p style={{ marginTop: 8, fontSize: '0.85rem', color: '#5A8A6A' }}>
                      {predictors.length} variables selected
                    </p>
                  )}
                </div>
                <button
                  className="btn btn-full"
                  style={{ background: '#5A8A6A', color: 'white', opacity: (!outcome || predictors.length === 0) ? 0.5 : 1 }}
                  onClick={runEvaluation}
                  disabled={!outcome || predictors.length === 0 || loading}>
                  {loading ? 'Running Evaluation...' : 'Run Evaluation'}
                </button>
              </div>
            )}

            {uploadResult && outcome && predictors.length > 0 && (
              <BivariateCharts uploadResult={uploadResult} outcome={outcome} predictors={predictors} />
            )}
          </div>
        )}

        {activeTab === 'data' && (
          <div>
            <h1 style={{ color: '#5A8A6A', marginBottom: 0 }}>Data Explorer</h1>
            <p style={{ marginBottom: '1.5rem' }}>Explore your dataset variables and quality.</p>
            {!uploadResult ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
                <p>Upload a dataset in the New Evaluation tab to explore it here.</p>
              </div>
            ) : (
              <DescriptiveStats uploadResult={uploadResult} />
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <div>
            <h1 style={{ color: '#5A8A6A', marginBottom: 0 }}>Evaluation Results</h1>
            <p style={{ marginBottom: '1.5rem' }}>
              {programme ? programme : 'Programme Evaluation'}
              {organisation ? ' · ' + organisation : ''}
            </p>

            {!results ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                <p>Run an evaluation to see results here.</p>
                <button className="btn" style={{ background: '#5A8A6A', color: 'white' }}
                  onClick={() => setActiveTab('evaluation')}>
                  Go to Evaluation
                </button>
              </div>
            ) : (
              <div>
                <div className="card" style={{ borderTop: '4px solid #5A8A6A' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: 100, height: 100, borderRadius: '50%',
                        border: '8px solid ' + getRigorColor(rigor.overall_score),
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center'
                      }}>
                        <span style={{ fontSize: '1.8rem', fontWeight: 700, color: getRigorColor(rigor.overall_score) }}>
                          {rigor.overall_score}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#888' }}>Rigor</span>
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h2 style={{ marginBottom: '0.5rem' }}>Key Finding</h2>
                      <p style={{ fontSize: '1rem', color: '#1C2B3A' }}>{results.interpretation}</p>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                        <span className="badge badge-blue">n = {results.n}</span>
                        <span className="badge badge-green">Grade: {rigor.grade}</span>
                        <span className="badge badge-orange">{results.model}</span>
                        {donor && <span className="badge badge-blue">Funder: {donor}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <ResultsCharts results={results} rigor={rigor} />

                <div className="card">
                  <h2>Recommendations for Donor Report</h2>
                  {rigor.recommendations.map((rec: string, i: number) => (
                    <div key={i} className="alert alert-success">{rec}</div>
                  ))}
                </div>

                <button
                  className="btn btn-full"
                  style={{ background: '#5A8A6A', color: 'white', marginTop: '1rem' }}
                  onClick={handleDownload}
                  disabled={downloading}>
                  {downloading ? 'Generating PDF...' : 'Download Donor Report (PDF)'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h1 style={{ color: '#5A8A6A', marginBottom: 0 }}>Settings</h1>
            <p style={{ marginBottom: '1.5rem' }}>Configure your NGO dashboard preferences.</p>
            <div className="card">
              <h2>Organisation Profile</h2>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Organisation Name</label>
                <input value={organisation} onChange={e => setOrganisation(e.target.value)}
                  placeholder="Your organisation name"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }} />
              </div>
              <div className="alert alert-success">Settings saved automatically.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
