import React, { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000';

const STEPS = [
  'Upload Data',
  'Study Design',
  'Your Population',
  'Run Analysis',
  'Results'
];

const DESIGNS = [
  { id: 'retrospective_cohort', label: 'Retrospective Cohort', desc: 'Compare outcomes between two groups using existing records. Most common in global health programme evaluation.' },
  { id: 'case_control', label: 'Case Control', desc: 'Compare people with an outcome to those without. Good for rare diseases.' },
  { id: 'cross_sectional', label: 'Cross Sectional', desc: 'Snapshot of a population at one point in time. Good for prevalence studies.' },
  { id: 'rct', label: 'Randomised Controlled Trial', desc: 'Participants randomly assigned to groups. Gold standard for causal evidence.' },
];

export default function StudentWizard() {
  const [step, setStep]               = useState(0);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [datasetId, setDatasetId]     = useState('');
  const [studyDesign, setStudyDesign] = useState('');
  const [question, setQuestion]       = useState('');
  const [outcome, setOutcome]         = useState('');
  const [predictors, setPredictors]   = useState<string[]>([]);
  const [studyId, setStudyId]         = useState('');
  const [results, setResults]         = useState<any>(null);
  const [rigor, setRigor]             = useState<any>(null);
  const [loading, setLoading]         = useState(false);
  const [progress, setProgress]       = useState<string[]>([]);
  const [error, setError]             = useState('');

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await axios.post(`${API}/upload`, form);
      setUploadResult(res.data);
      setDatasetId(res.data.dataset_id);
    } catch (err: any) {
      setError('Upload failed. Check the file format and try again.');
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

  async function runAnalysis() {
    setLoading(true);
    setProgress([]);
    setError('');
    const steps_log = [
      'Validating data quality',
      'Building study cohort',
      'Running statistical models',
      'Checking assumptions',
      'Calculating Rigor Score',
      'Generating report',
    ];
    try {
      const studyRes = await axios.post(`${API}/study`, {
        title: question || 'Student Analysis',
        description: question,
        study_type: studyDesign,
        user_role: 'student'
      });
      const sid = studyRes.data.id;
      setStudyId(sid);

      for (let i = 0; i < steps_log.length; i++) {
        await new Promise(r => setTimeout(r, 600));
        setProgress(prev => [...prev, steps_log[i]]);
      }

      const analysisRes = await axios.post(
        `${API}/study/${sid}/analyse`, {
          dataset_id: datasetId,
          outcome_column: outcome,
          predictor_columns: predictors
        }
      );
      setResults(analysisRes.data.results);
      setRigor(analysisRes.data.rigor_score);
      setStep(4);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        'Analysis failed. Check your column selections.'
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

  const outcomeCols = uploadResult
    ? Object.entries(uploadResult.column_types)
        .filter(([_, t]) => 
          t === 'outcome' || t === 'categorical'
        )
        .map(([c]) => c)
    : [];

  return (
    <div className="page">
      <h1 style={{ color: '#C0533A' }}>Student Analysis Wizard</h1>
      <p>Guided step-by-step research analysis with methodology education.</p>

      {/* Step bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2rem 0', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 15, left: 0, right: 0, height: 2, background: '#eee', zIndex: 0 }} />
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 1 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700,
              background: i < step ? '#5A8A6A' : i === step ? '#C0533A' : '#eee',
              color: i <= step ? 'white' : '#888'
            }}>{i < step ? '✓' : i + 1}</div>
            <span style={{ fontSize: '0.72rem', color: i === step ? '#C0533A' : '#888' }}>{s}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="alert alert-critical" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* STEP 0 — Upload */}
      {step === 0 && (
        <div className="card">
          <h2>Upload Your Research Data</h2>
          <p>Supported formats: CSV, Excel (.xlsx), SPSS (.sav), Stata (.dta)</p>
          <label className="upload-zone" style={{ display: 'block', cursor: 'pointer' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
            <p style={{ fontWeight: 600, color: '#C0533A' }}>
              Tap to select your data file
            </p>
            <p style={{ fontSize: '0.85rem' }}>CSV, XLSX, SAV, DTA supported</p>
            <input type="file" accept=".csv,.xlsx,.xls,.sav,.dta" onChange={handleUpload} style={{ display: 'none' }} />
          </label>

          {loading && (
            <p style={{ textAlign: 'center', marginTop: '1rem', color: '#C0533A' }}>
              Analysing your data...
            </p>
          )}

          {uploadResult && (
            <div style={{ marginTop: '1.5rem' }}>
              <div className="alert alert-success">
                ✓ Dataset loaded: {uploadResult.rows} rows, {uploadResult.columns} columns
              </div>

              {uploadResult.issues.map((issue: any, i: number) => (
                <div key={i} className={`alert alert-${issue.severity === 'critical' ? 'critical' : 'warning'}`}>
                  ⚠ {issue.message} — {issue.recommendation}
                </div>
              ))}

              <h3 style={{ marginTop: '1rem' }}>Columns detected:</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {Object.entries(uploadResult.column_types).map(([col, type]: any) => (
                  <span key={col} className="badge badge-blue" style={{ marginBottom: 4 }}>
                    {col} <span style={{ opacity: 0.7 }}>({type})</span>
                  </span>
                ))}
              </div>

              <button className="btn btn-primary btn-full" style={{ marginTop: '1.5rem' }} onClick={() => setStep(1)}>
                Next: Choose Study Design →
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 1 — Study Design */}
      {step === 1 && (
        <div className="card">
          <h2>Choose Your Study Design</h2>
          <p>Select the design that best matches how your data was collected.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1.5rem 0' }}>
            {DESIGNS.map(d => (
              <div key={d.id} onClick={() => setStudyDesign(d.id)}
                style={{
                  padding: '1rem', borderRadius: 8, cursor: 'pointer',
                  border: `2px solid ${studyDesign === d.id ? '#C0533A' : '#eee'}`,
                  background: studyDesign === d.id ? '#fff5f3' : 'white'
                }}>
                <h3 style={{ color: studyDesign === d.id ? '#C0533A' : '#1C2B3A' }}>{d.label}</h3>
                <p style={{ fontSize: '0.85rem', marginBottom: 0 }}>{d.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
              What is your research question?
            </label>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="e.g. Does the community health worker intervention reduce child mortality in the Northern district?"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', minHeight: 80, fontSize: '0.95rem' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-navy" onClick={() => setStep(0)}>← Back</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setStep(2)} disabled={!studyDesign}>
              Next: Define Population →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Population */}
      {step === 2 && (
        <div className="card">
          <h2>Define Your Study Population</h2>
          <p>Select your outcome variable and the factors you want to analyse.</p>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Primary Outcome Variable
            </label>
            <p style={{ fontSize: '0.85rem', marginBottom: 8 }}>
              This is what you are trying to predict or explain — usually a binary variable (0/1, yes/no, died/survived).
            </p>
            <select value={outcome} onChange={e => setOutcome(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }}>
              <option value="">Select outcome column...</option>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Predictor Variables
            </label>
            <p style={{ fontSize: '0.85rem', marginBottom: 8 }}>
              These are the factors you think might influence your outcome. Select all that are relevant.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {columns.filter(c => c !== outcome).map(col => (
                <span key={col} onClick={() => togglePredictor(col)}
                  className="badge"
                  style={{
                    cursor: 'pointer', padding: '0.4rem 0.9rem',
                    background: predictors.includes(col) ? '#C0533A' : '#eee',
                    color: predictors.includes(col) ? 'white' : '#444'
                  }}>
                  {col}
                </span>
              ))}
            </div>
            {predictors.length > 0 && (
              <p style={{ marginTop: 8, fontSize: '0.85rem', color: '#5A8A6A' }}>
                ✓ {predictors.length} predictor(s) selected: {predictors.join(', ')}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-navy" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary" style={{ flex: 1 }}
              onClick={() => { setStep(3); runAnalysis(); }}
              disabled={!outcome || predictors.length === 0}>
              Run Analysis →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Running */}
      {step === 3 && (
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>Running Your Analysis</h2>
          <p>ResearchFlow is processing your data through the analytics engine.</p>
          <div style={{ margin: '2rem auto', maxWidth: 400 }}>
            {[
              'Validating data quality',
              'Building study cohort',
              'Running statistical models',
              'Checking assumptions',
              'Calculating Rigor Score',
              'Generating report',
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: '1.2rem' }}>
                  {progress.includes(s) ? '✅' : '⏳'}
                </span>
                <span style={{ color: progress.includes(s) ? '#2e7d32' : '#888' }}>{s}</span>
              </div>
            ))}
          </div>
          {loading && (
            <p style={{ color: '#C0533A', fontWeight: 600 }}>Processing...</p>
          )}
        </div>
      )}

      {/* STEP 4 — Results */}
      {step === 4 && rigor && (
        <div>
          <div className="card" style={{ textAlign: 'center' }}>
            <h2>Your Analysis Results</h2>
            <div style={{ margin: '1.5rem auto', width: 160, height: 160, borderRadius: '50%', border: `12px solid ${getRigorColor(rigor.overall_score)}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 700, color: getRigorColor(rigor.overall_score) }}>
                {rigor.overall_score}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#888' }}>Rigor Score</span>
            </div>
            <span className={`badge badge-${rigor.overall_score >= 70 ? 'green' : rigor.overall_score >= 40 ? 'orange' : 'red'}`} style={{ fontSize: '1rem', padding: '0.4rem 1.2rem' }}>
              {rigor.grade}
            </span>
          </div>

          <div className="card">
            <h2>Score Breakdown</h2>
            {Object.entries(rigor.breakdown).map(([key, val]: any) => (
              <div key={key} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span style={{ color: '#C0533A', fontWeight: 700 }}>
                    {val.score}/{val.max}
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(val.score/val.max)*100}%`, background: getRigorColor((val.score/val.max)*100) }} />
                </div>
                {val.findings.map((f: string, i: number) => (
                  <p key={i} style={{ fontSize: '0.82rem', color: '#666', marginBottom: 2 }}>• {f}</p>
                ))}
              </div>
            ))}
          </div>

          <div className="card">
            <h2>Recommendations</h2>
            {rigor.recommendations.map((rec: string, i: number) => (
              <div key={i} className="alert alert-success">✓ {rec}</div>
            ))}
          </div>

          {results && (
            <div className="card">
              <h2>Statistical Results</h2>
              <p><strong>Model:</strong> {results.model}</p>
              <p><strong>Sample size:</strong> {results.n} participants</p>
              {results.interpretation && (
                <div className="alert alert-success" style={{ marginTop: '1rem' }}>
                  {results.interpretation}
                </div>
              )}
              {results.odds_ratios && (
                <div style={{ marginTop: '1rem' }}>
                  <h3>Key Findings:</h3>
                  {Object.entries(results.odds_ratios).map(([v, vals]: any) => (
                    <div key={v} style={{ padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                      <span style={{ marginLeft: '1rem', color: vals.significant ? '#C0533A' : '#888' }}>
                        OR={vals.OR} (95% CI: {vals.CI_low}–{vals.CI_high})
                      </span>
                      {vals.significant && (
                        <span className="badge badge-orange" style={{ marginLeft: 8 }}>Significant</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button className="btn btn-primary btn-full" onClick={() => { setStep(0); setUploadResult(null); setResults(null); setRigor(null); setPredictors([]); }}>
            Start New Analysis
          </button>
        </div>
      )}
    </div>
  );
}