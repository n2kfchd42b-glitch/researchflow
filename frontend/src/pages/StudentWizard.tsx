import React, { useState } from 'react';
import { api } from '../services/api';
import { DescriptiveStats, BivariateCharts, ResultsCharts } from '../components/AnalysisCharts';

const STEPS = ['Upload Data','Study Design','Your Population','Run Analysis','Results'];

const DESIGNS = [
  { id: 'retrospective_cohort', label: 'Retrospective Cohort', desc: 'Compare outcomes between two groups using existing records. Most common in global health.' },
  { id: 'case_control', label: 'Case Control', desc: 'Compare people with an outcome to those without. Good for rare diseases.' },
  { id: 'cross_sectional', label: 'Cross Sectional', desc: 'Snapshot of a population at one point in time. Good for prevalence studies.' },
  { id: 'rct', label: 'Randomised Controlled Trial', desc: 'Participants randomly assigned to groups. Gold standard for causal evidence.' },
];

export default function StudentWizard() {
  const [step, setStep]                 = useState(0);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [datasetId, setDatasetId]       = useState('');
  const [studyId, setStudyId]           = useState('');
  const [studyDesign, setStudyDesign]   = useState('');
  const [question, setQuestion]         = useState('');
  const [outcome, setOutcome]           = useState('');
  const [predictors, setPredictors]     = useState<string[]>([]);
  const [results, setResults]           = useState<any>(null);
  const [rigor, setRigor]               = useState<any>(null);
  const [loading, setLoading]           = useState(false);
  const [downloading, setDownloading]   = useState(false);
  const [progress, setProgress]         = useState<string[]>([]);
  const [error, setError]               = useState('');
  const [protocol, setProtocol] = useState<any>(null);
  const [protocolLoading, setProtocolLoading] = useState(false);
  async function handleProtocolUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProtocolLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8002';
      const res = await fetch(`${API_URL}/protocol/extract`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      setProtocol(data);
      if (data.study_design) setStudyDesign(data.study_design);
      if (data.suggested_outcomes?.length > 0) setOutcome(data.suggested_outcomes[0]);
    } catch (err) {
      console.error('Protocol upload failed:', err);
    }
    setProtocolLoading(false);
  }

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
      const studyRes = await api.createStudy({
        title: question || 'Student Analysis',
        description: question,
        study_type: studyDesign,
        user_role: 'student'
      });
      setStudyId(studyRes.id);
      for (let i = 0; i < steps_log.length; i++) {
        await new Promise(r => setTimeout(r, 600));
        setProgress(prev => [...prev, steps_log[i]]);
      }
      const analysisRes = await api.analyseStudy(studyRes.id, {
        dataset_id: datasetId,
        outcome_column: outcome,
        predictor_columns: predictors
      });
      setResults(analysisRes.results);
      setRigor(analysisRes.rigor_score);
      setStep(4);
    } catch (err: any) {
      setError('Analysis failed: ' + (err.message || 'Unknown error'));
    }
    setLoading(false);
  }

  async function handleDownload() {
    if (!studyId) return;
    setDownloading(true);
    try {
      await api.downloadReport(studyId, 'student');
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

  return (
    <div className="page">
      <h1 style={{ color: '#C0533A' }}>Student Analysis Wizard</h1>
      <p>Guided step-by-step research analysis with methodology education.</p>

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

      {error && <div className="alert alert-critical" style={{ marginBottom: '1rem' }}>{error}</div>}

      {step === 0 && (
        <div>
          <div style={{ marginBottom: '1.5rem', padding: '1.25rem', borderRadius: 10, background: '#f0f4f8', border: '2px dashed #1C2B3A33' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📋</span>
              <div>
                <p style={{ fontWeight: 700, color: '#1C2B3A', marginBottom: 2 }}>Upload Study Protocol (Optional)</p>
                <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: 0 }}>PDF, Word or TXT — AI will extract your objectives and suggest variables</p>
              </div>
            </div>
            <label style={{ cursor: 'pointer', display: 'inline-block', padding: '0.5rem 1rem', background: '#1C2B3A', color: 'white', borderRadius: 6, fontSize: '0.85rem' }}>
              {protocolLoading ? 'Reading protocol...' : '+ Upload Protocol'}
              <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleProtocolUpload} style={{ display: 'none' }} />
            </label>
            {protocol && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'white', borderRadius: 8, border: '1px solid #5A8A6A44' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span>✅</span>
                  <span style={{ fontWeight: 700, color: '#5A8A6A' }}>Protocol Read Successfully</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#aaa' }}>Confidence: {protocol.extraction_confidence}%</span>
                </div>
                {protocol.objectives?.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>Objectives Found</p>
                    {protocol.objectives.map((obj: string, i: number) => (
                      <p key={i} style={{ fontSize: '0.82rem', color: '#555', padding: '0.4rem 0.75rem', background: '#f8f7f4', borderRadius: 6, marginBottom: 4 }}>{obj}</p>
                    ))}
                  </div>
                )}
                {protocol.suggested_outcomes?.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>Suggested Outcome Variable</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {protocol.suggested_outcomes.map((o: string) => (
                        <span key={o} style={{ padding: '0.3rem 0.75rem', background: '#fff5f3', border: '1px solid #C0533A44', borderRadius: 20, fontSize: '0.8rem', color: '#C0533A', fontWeight: 600 }}>{o}</span>
                      ))}
                    </div>
                  </div>
                )}
                {protocol.suggested_predictors?.length > 0 && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>Suggested Predictor Variables</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {protocol.suggested_predictors.map((p: string) => (
                        <span key={p} style={{ padding: '0.3rem 0.75rem', background: '#f3faf5', border: '1px solid #5A8A6A44', borderRadius: 20, fontSize: '0.8rem', color: '#5A8A6A', fontWeight: 600 }}>{p}</span>
                      ))}
                    </div>
                  </div>
                )}
                {protocol.study_design && (
                  <p style={{ fontSize: '0.82rem', color: '#888', marginTop: '0.5rem', marginBottom: 0 }}>
                    Study design: <strong>{protocol.study_design.replace(/_/g, ' ')}</strong>
                    {protocol.sample_size_target && ` · Target sample: ${protocol.sample_size_target}`}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="card">
            <h2>Upload Your Research Data</h2>
            <p>Supported formats: CSV, Excel, SPSS, Stata</p>
            <label className="upload-zone" style={{ display: 'block', cursor: 'pointer' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
              <p style={{ fontWeight: 600, color: '#C0533A' }}>Tap to select your data file</p>
              <p style={{ fontSize: '0.85rem' }}>CSV, XLSX, SAV, DTA supported</p>
              <input type="file" accept=".csv,.xlsx,.xls,.sav,.dta"
                onChange={handleUpload} style={{ display: 'none' }} />
            </label>
            {loading && (
              <p style={{ textAlign: 'center', marginTop: '1rem', color: '#C0533A' }}>Analysing your data...</p>
            )}
            {uploadResult && (
              <div style={{ marginTop: '1.5rem' }}>
                <div className="alert alert-success">
                  Dataset loaded: {uploadResult.rows} rows, {uploadResult.columns} columns
                </div>
                {uploadResult.issues.map((issue: any, i: number) => (
                  <div key={i} className={'alert alert-' + (issue.severity === 'critical' ? 'critical' : 'warning')}>
                    {issue.message} — {issue.recommendation}
                  </div>
                ))}
              </div>
            )}
          </div>
          {uploadResult && (
            <div>
              <DescriptiveStats uploadResult={uploadResult} />
              <div style={{ marginTop: '1rem' }}>
                <button className="btn btn-primary btn-full" onClick={() => setStep(1)}>
                  Next: Choose Study Design
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="card">
          <h2>Choose Your Study Design</h2>
          <p>Select the design that best matches how your data was collected.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1.5rem 0' }}>
            {DESIGNS.map(d => (
              <div key={d.id} onClick={() => setStudyDesign(d.id)} style={{
                padding: '1rem', borderRadius: 8, cursor: 'pointer',
                border: '2px solid ' + (studyDesign === d.id ? '#C0533A' : '#eee'),
                background: studyDesign === d.id ? '#fff5f3' : 'white'
              }}>
                <h3 style={{ color: studyDesign === d.id ? '#C0533A' : '#1C2B3A' }}>{d.label}</h3>
                <p style={{ fontSize: '0.85rem', marginBottom: 0 }}>{d.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>What is your research question?</label>
            <textarea value={question} onChange={e => setQuestion(e.target.value)}
              placeholder="e.g. Does the CHW intervention reduce child mortality?"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', minHeight: 80, fontSize: '0.95rem' }} />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-navy" onClick={() => setStep(0)}>Back</button>
            <button className="btn btn-primary" style={{ flex: 1 }}
              onClick={() => setStep(2)} disabled={!studyDesign}>
              Next: Define Population
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="card">
            <h2>Define Your Study Population</h2>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Primary Outcome Variable</label>
              <select value={outcome} onChange={e => setOutcome(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }}>
                <option value="">Select outcome column...</option>
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Predictor Variables</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {columns.filter(c => c !== outcome).map(col => (
                  <span key={col} onClick={() => togglePredictor(col)} className="badge" style={{
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
                  {predictors.length} selected: {predictors.join(', ')}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-navy" onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-primary" style={{ flex: 1 }}
                onClick={() => { setStep(3); runAnalysis(); }}
                disabled={!outcome || predictors.length === 0}>
                Run Analysis
              </button>
            </div>
          </div>
          {outcome && predictors.length > 0 && (
            <BivariateCharts uploadResult={uploadResult} outcome={outcome} predictors={predictors} />
          )}
        </div>
      )}

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
                <span style={{ fontSize: '1.2rem' }}>{progress.includes(s) ? '✅' : '⏳'}</span>
                <span style={{ color: progress.includes(s) ? '#2e7d32' : '#888' }}>{s}</span>
              </div>
            ))}
          </div>
          {loading && <p style={{ color: '#C0533A', fontWeight: 600 }}>Processing...</p>}
        </div>
      )}

      {step === 4 && rigor && (
        <div>
          <div className="card" style={{ textAlign: 'center' }}>
            <h2>Your Analysis Results</h2>
            <div style={{
              margin: '1.5rem auto', width: 160, height: 160, borderRadius: '50%',
              border: '12px solid ' + getRigorColor(rigor.overall_score),
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 700, color: getRigorColor(rigor.overall_score) }}>
                {rigor.overall_score}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#888' }}>Rigor Score</span>
            </div>
            <span className={'badge badge-' + (rigor.overall_score >= 70 ? 'green' : rigor.overall_score >= 40 ? 'orange' : 'red')}
              style={{ fontSize: '1rem', padding: '0.4rem 1.2rem' }}>
              {rigor.grade}
            </span>
          </div>

          {results && <ResultsCharts results={results} rigor={rigor} />}

          <div className="card">
            <h2>Recommendations</h2>
            {rigor.recommendations.map((rec: string, i: number) => (
              <div key={i} className="alert alert-success">{rec}</div>
            ))}
          </div>

          {results && results.interpretation && (
            <div className="card">
              <h2>Plain Language Summary</h2>
              <p><strong>Model:</strong> {results.model}</p>
              <p><strong>Sample size:</strong> {results.n} participants</p>
              <div className="alert alert-success">{results.interpretation}</div>
            </div>
          )}

          <button
            className="btn btn-navy btn-full"
            style={{ marginBottom: '0.75rem' }}
            onClick={handleDownload}
            disabled={downloading}>
            {downloading ? 'Generating PDF...' : 'Download Student Report (PDF)'}
          </button>

          <button className="btn btn-primary btn-full" onClick={() => {
            setStep(0);
            setUploadResult(null);
            setResults(null);
            setRigor(null);
            setPredictors([]);
            setOutcome('');
            setStudyId('');
          }}>
            Start New Analysis
          </button>
        </div>
      )}
    </div>
  );
}
