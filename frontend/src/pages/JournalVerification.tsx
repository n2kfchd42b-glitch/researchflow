import React, { useState } from 'react';
import { api } from '../services/api';
import { DescriptiveStats, ResultsCharts } from '../components/AnalysisCharts';

const CONSORT_ITEMS = [
  'Title identifies as randomised trial',
  'Abstract describes trial design and results',
  'Background and rationale explained',
  'Eligibility criteria specified',
  'Interventions described in detail',
  'Primary and secondary outcomes defined',
  'Sample size calculation reported',
  'Randomisation method described',
  'Allocation concealment described',
  'Blinding described',
  'Statistical methods specified',
  'Participant flow described',
  'Recruitment dates reported',
  'Baseline characteristics reported',
  'Numbers analysed reported',
  'Outcomes and estimation reported',
  'Harms reported',
  'Limitations discussed',
  'Generalisability discussed',
  'Conclusions match evidence',
];

const STROBE_ITEMS = [
  'Study design indicated in title',
  'Background and rationale given',
  'Study design described',
  'Setting and dates described',
  'Eligibility criteria given',
  'Variables clearly defined',
  'Data sources described',
  'Bias addressed',
  'Sample size explained',
  'Statistical methods described',
  'Participants described',
  'Descriptive data reported',
  'Outcome data reported',
  'Main results reported',
  'Unadjusted and adjusted estimates given',
  'Key results summarised',
  'Limitations discussed',
  'Generalisability discussed',
  'Funding sources reported',
];

export default function JournalVerification() {
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [datasetId, setDatasetId]       = useState('');
  const [studyId, setStudyId]           = useState('');
  const [studyType, setStudyType]       = useState('observational');
  const [standard, setStandard]         = useState('STROBE');
  const [outcome, setOutcome]           = useState('');
  const [predictors, setPredictors]     = useState<string[]>([]);
  const [results, setResults]           = useState<any>(null);
  const [rigor, setRigor]               = useState<any>(null);
  const [loading, setLoading]           = useState(false);
  const [downloading, setDownloading]   = useState(false);
  const [error, setError]               = useState('');
  const [checklist, setChecklist]       = useState<boolean[]>([]);
  const [verificationId]                = useState('RF-' + Date.now().toString(36).toUpperCase());

  const items = standard === 'CONSORT' ? CONSORT_ITEMS : STROBE_ITEMS;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.upload(file);
      setUploadResult(data);
      setDatasetId(data.dataset_id);
      setChecklist(new Array(items.length).fill(false));
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

  function toggleChecklist(i: number) {
    setChecklist(prev => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  }

  async function runVerification() {
    setLoading(true);
    setError('');
    try {
      const studyRes = await api.createStudy({
        title: 'Journal Verification',
        description: standard + ' verification for ' + studyType,
        study_type: studyType,
        user_role: 'journal'
      });
      setStudyId(studyRes.id);
      const analysisRes = await api.analyseStudy(studyRes.id, {
        dataset_id: datasetId,
        outcome_column: outcome,
        predictor_columns: predictors
      });
      setResults(analysisRes.results);
      setRigor(analysisRes.rigor_score);
    } catch (err: any) {
      setError('Verification failed: ' + (err.message || 'Unknown error'));
    }
    setLoading(false);
  }

  async function handleDownload() {
    if (!studyId) return;
    setDownloading(true);
    try {
      await api.downloadReport(studyId, 'journal');
    } catch (err: any) {
      setError('Download failed: ' + (err.message || 'Unknown error'));
    }
    setDownloading(false);
  }

  const columns      = uploadResult ? Object.keys(uploadResult.column_types) : [];
  const checklistScore = checklist.length > 0
    ? Math.round((checklist.filter(Boolean).length / checklist.length) * 100)
    : 0;
  const overallScore = rigor
    ? Math.round((rigor.overall_score + checklistScore) / 2)
    : 0;
  const status       = overallScore >= 75 ? 'PASSED' : overallScore >= 50 ? 'FLAGGED' : 'FAILED';
  const statusColor  = status === 'PASSED' ? '#4caf50' : status === 'FLAGGED' ? '#ff9800' : '#f44336';
  const statusBg     = status === 'PASSED' ? '#e8f5e9' : status === 'FLAGGED' ? '#fff3e0' : '#ffebee';

  return (
    <div className="page">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: '#1C2B3A' }}>Research Verification Portal</h1>
        <p>Automated statistical integrity verification for submitted manuscripts.</p>
      </div>

      {error && <div className="alert alert-critical">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        <div>
          <div className="card">
            <h2>Study Configuration</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Study Type</label>
              <select value={studyType} onChange={e => setStudyType(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }}>
                <option value="rct">Randomised Controlled Trial</option>
                <option value="observational">Observational Study</option>
                <option value="retrospective_cohort">Retrospective Cohort</option>
                <option value="systematic_review">Systematic Review</option>
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Reporting Standard</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {['CONSORT', 'STROBE', 'PRISMA'].map(s => (
                  <button key={s} onClick={() => {
                    setStandard(s);
                    setChecklist(new Array(
                      s === 'CONSORT' ? CONSORT_ITEMS.length : STROBE_ITEMS.length
                    ).fill(false));
                  }}
                  className="btn" style={{
                    flex: 1,
                    background: standard === s ? '#1C2B3A' : '#eee',
                    color: standard === s ? 'white' : '#444',
                    padding: '0.5rem'
                  }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Upload Dataset</h2>
            <label className="upload-zone" style={{ display: 'block', cursor: 'pointer' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
              <p style={{ fontWeight: 600, color: '#1C2B3A' }}>Upload research dataset</p>
              <p style={{ fontSize: '0.85rem' }}>CSV, XLSX, SAV, DTA</p>
              <input type="file" accept=".csv,.xlsx,.xls,.sav,.dta"
                onChange={handleUpload} style={{ display: 'none' }} />
            </label>
            {loading && !results && (
              <p style={{ textAlign: 'center', marginTop: '1rem', color: '#1C2B3A' }}>Processing...</p>
            )}
            {uploadResult && (
              <div className="alert alert-success" style={{ marginTop: '1rem' }}>
                {uploadResult.rows} records, {uploadResult.columns} variables loaded
              </div>
            )}
          </div>

          {uploadResult && <DescriptiveStats uploadResult={uploadResult} />}

          {uploadResult && (
            <div className="card">
              <h2>Variable Selection</h2>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Primary Outcome</label>
                <select value={outcome} onChange={e => setOutcome(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }}>
                  <option value="">Select outcome...</option>
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
                      cursor: 'pointer',
                      background: predictors.includes(col) ? '#1C2B3A' : '#eee',
                      color: predictors.includes(col) ? 'white' : '#444',
                      padding: '0.4rem 0.9rem'
                    }}>
                      {col}
                    </span>
                  ))}
                </div>
              </div>
              <button className="btn btn-full btn-navy"
                onClick={runVerification}
                disabled={!outcome || predictors.length === 0 || loading}
                style={{ opacity: (!outcome || predictors.length === 0) ? 0.5 : 1 }}>
                {loading ? 'Verifying...' : 'Run Verification'}
              </button>
            </div>
          )}

          {uploadResult && checklist.length > 0 && (
            <div className="card">
              <h2>{standard} Reporting Checklist</h2>
              <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                Mark each item as present in the manuscript.
              </p>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>Compliance</span>
                  <span style={{ color: '#1C2B3A', fontWeight: 700 }}>{checklistScore}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: checklistScore + '%',
                    background: checklistScore >= 75 ? '#4caf50' : checklistScore >= 50 ? '#ff9800' : '#f44336'
                  }} />
                </div>
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {items.map((item, i) => (
                  <div key={i} onClick={() => toggleChecklist(i)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.5rem', borderRadius: 4, cursor: 'pointer',
                    background: checklist[i] ? '#e8f5e9' : 'transparent',
                    marginBottom: 2
                  }}>
                    <span style={{ fontSize: '1.1rem' }}>{checklist[i] ? '✅' : '⬜'}</span>
                    <span style={{ fontSize: '0.85rem', color: checklist[i] ? '#2e7d32' : '#444' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          {!results && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔬</div>
              <h2>Verification Results</h2>
              <p>Upload a dataset and run verification to see results here.</p>
            </div>
          )}

          {results && rigor && (
            <div>
              <div className="card" style={{ textAlign: 'center', background: statusBg, borderTop: '4px solid ' + statusColor }}>
                <h2>Verification Status</h2>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: statusColor, padding: '0.5rem 0' }}>
                  {status}
                </div>
                <div style={{ fontSize: '3rem', fontWeight: 700, color: statusColor }}>
                  {overallScore}/100
                </div>
                <p style={{ color: statusColor, fontWeight: 600 }}>Combined integrity score</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-blue">Statistical: {rigor.overall_score}/100</span>
                  <span className="badge badge-blue">{standard}: {checklistScore}%</span>
                </div>
              </div>

              {[
                { label: 'Internal Consistency',    key: 'data_quality', icon: '🔍' },
                { label: 'Methodology Alignment',   key: 'methodology',  icon: '📐' },
                { label: 'Assumption Verification', key: 'assumptions',  icon: '✓'  },
                { label: 'Reporting Completeness',  key: 'reporting',    icon: '📄' },
              ].map(panel => {
                const val  = rigor.breakdown[panel.key];
                const pct  = Math.round((val.score / val.max) * 100);
                const pass = pct >= 70;
                return (
                  <div key={panel.key} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h2 style={{ marginBottom: 0 }}>{panel.icon} {panel.label}</h2>
                      <span className={'badge badge-' + (pass ? 'green' : pct >= 50 ? 'orange' : 'red')}>
                        {pass ? 'PASSED' : pct >= 50 ? 'REVIEW' : 'FAILED'}
                      </span>
                    </div>
                    <div className="progress-bar" style={{ marginBottom: '0.75rem' }}>
                      <div className="progress-fill" style={{
                        width: pct + '%',
                        background: pass ? '#4caf50' : pct >= 50 ? '#ff9800' : '#f44336'
                      }} />
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: '0.5rem' }}>
                      Score: {val.score}/{val.max}
                    </p>
                    {val.findings.map((f: string, i: number) => (
                      <p key={i} style={{ fontSize: '0.82rem', color: '#555', marginBottom: 2 }}>• {f}</p>
                    ))}
                  </div>
                );
              })}

              <ResultsCharts results={results} rigor={rigor} />

              <div className="card" style={{ background: '#f0f4f8' }}>
                <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: 4 }}>Verification ID</p>
                <p style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#1C2B3A', marginBottom: 8, fontWeight: 700 }}>
                  {verificationId}
                </p>
                <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: 0 }}>
                  {new Date().toISOString().split('T')[0]} · ResearchFlow v0.1.0
                </p>
              </div>

              <button
                className="btn btn-full btn-navy"
                style={{ marginTop: '0.5rem' }}
                onClick={handleDownload}
                disabled={downloading}>
                {downloading ? 'Generating PDF...' : 'Download Verification Report (PDF)'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
