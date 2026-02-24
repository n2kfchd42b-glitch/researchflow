import React, { useState } from 'react';
import { api } from '../services/api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8002';

const STUDY_DESIGNS = [
  { id: 'retrospective_cohort', label: 'Retrospective Cohort' },
  { id: 'prospective_cohort',   label: 'Prospective Cohort'   },
  { id: 'case_control',         label: 'Case Control'          },
  { id: 'cross_sectional',      label: 'Cross Sectional'       },
  { id: 'rct',                  label: 'Randomised Controlled Trial' },
  { id: 'observational',        label: 'Observational'         },
];

export default function JournalAssistant() {
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [datasetId, setDatasetId]       = useState('');
  const [outcome, setOutcome]           = useState('');
  const [predictors, setPredictors]     = useState<string[]>([]);
  const [studyDesign, setStudyDesign]   = useState('retrospective_cohort');
  const [researchQ, setResearchQ]       = useState('');
  const [setting, setSetting]           = useState('sub-Saharan Africa');
  const [statTest, setStatTest]         = useState('logistic regression');
  const [openAccess, setOpenAccess]     = useState(false);
  const [result, setResult]             = useState<any>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [activeTab, setActiveTab]       = useState('methods');
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
    } catch (err: any) {
      setError('Upload failed: ' + err.message);
    }
    setLoading(false);
  }

  function togglePredictor(col: string) {
    setPredictors(prev =>
      prev.includes(col) ? prev.filter(p => p !== col) : [...prev, col]
    );
  }

  async function generate() {
    if (!outcome || predictors.length === 0) {
      setError('Please select an outcome and at least one predictor.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/journal/package`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_id:        datasetId,
          outcome_col:       outcome,
          predictor_cols:    predictors,
          study_design:      studyDesign,
          research_question: researchQ,
          statistical_test:  statTest,
          setting,
          open_access_only:  openAccess,
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
      setActiveTab('methods');
    } catch (err: any) {
      setError('Failed to generate: ' + err.message);
    }
    setLoading(false);
  }

  function copyMethods() {
    if (result?.methods_section) {
      navigator.clipboard.writeText(result.methods_section);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const columns = uploadResult ? Object.keys(uploadResult.column_types) : [];

  return (
    <div className="page">
      <h1 style={{ color: '#1C2B3A' }}>Journal Submission Assistant</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        Auto-generate your methods section, complete reporting checklists and find the right journal.
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
                <h2>Study Details</h2>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Research Question</label>
                  <textarea value={researchQ} onChange={e => setResearchQ(e.target.value)}
                    placeholder="e.g. Does CHW intervention reduce child mortality?"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem', minHeight: 70 }} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Study Setting</label>
                  <input value={setting} onChange={e => setSetting(e.target.value)}
                    placeholder="e.g. rural Tanzania, urban Kenya"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Study Design</label>
                  <select value={studyDesign} onChange={e => setStudyDesign(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }}>
                    {STUDY_DESIGNS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Statistical Test Used</label>
                  <select value={statTest} onChange={e => setStatTest(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }}>
                    {['logistic regression', 'linear regression', 'cox regression', 'chi-square test', 'kaplan-meier analysis', 'poisson regression'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="card">
                <h2>Outcome Variable</h2>
                <select value={outcome} onChange={e => setOutcome(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }}>
                  <option value="">Select outcome...</option>
                  {columns.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
              </div>

              <div className="card">
                <h2>Predictor Variables</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {columns.filter(c => c !== outcome).map(col => (
                    <button key={col} onClick={() => togglePredictor(col)} style={{
                      padding: '0.35rem 0.8rem', borderRadius: 20, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                      background: predictors.includes(col) ? '#5A8A6A' : '#f0f0f0',
                      color: predictors.includes(col) ? 'white' : '#444',
                      border: '1px solid ' + (predictors.includes(col) ? '#5A8A6A' : '#ddd')
                    }}>
                      {col}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={openAccess} onChange={e => setOpenAccess(e.target.checked)} />
                  <span style={{ fontWeight: 600 }}>Open Access journals only</span>
                </label>
              </div>

              <button className="btn btn-primary btn-full" onClick={generate}
                disabled={!outcome || predictors.length === 0 || loading}>
                {loading ? 'Generating...' : '📝 Generate Submission Package'}
              </button>
            </div>
          )}
        </div>

        <div>
          {!result && (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📰</div>
              <h2>Journal Submission Package</h2>
              <p>Fill in your study details and tap Generate to get your methods section, checklist and journal recommendations.</p>
            </div>
          )}

          {result && (
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'methods',  label: '📝 Methods Section' },
                  { id: 'journals', label: '📚 Journal Suggestions' },
                  { id: 'checklist',label: `✅ ${result.guideline} Checklist` },
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

              {activeTab === 'methods' && (
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ marginBottom: 0 }}>Methods Section</h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#888', alignSelf: 'center' }}>
                        {result.word_count} words
                      </span>
                      <button className="btn btn-sage" onClick={copyMethods} style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
                        {copied ? '✓ Copied!' : 'Copy Text'}
                      </button>
                    </div>
                  </div>
                  <div style={{ background: '#f8f7f4', borderRadius: 8, padding: '1.25rem', lineHeight: 1.8, fontSize: '0.9rem', color: '#333', whiteSpace: 'pre-line' }}>
                    {result.methods_section}
                  </div>
                  <div className="alert alert-success" style={{ marginTop: '1rem' }}>
                    Review and customise the bracketed placeholders before submission. This text follows {result.guideline} reporting guidelines.
                  </div>
                </div>
              )}

              {activeTab === 'journals' && (
                <div>
                  {result.journals.map((journal: any, i: number) => (
                    <div key={journal.name} className="card" style={{ marginBottom: '1rem', borderLeft: '4px solid ' + (i === 0 ? '#C0533A' : i === 1 ? '#5A8A6A' : '#1C2B3A') }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                            <span style={{ fontSize: '1.2rem' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                            <h3 style={{ marginBottom: 0, color: '#1C2B3A' }}>{journal.name}</h3>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span className="badge badge-blue">IF: {journal.impact}</span>
                            {journal.open_access && <span className="badge badge-green">Open Access</span>}
                            <span style={{ fontSize: '0.78rem', color: '#888', alignSelf: 'center' }}>
                              ⏱ {journal.turnaround}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {journal.focus.map((f: string) => (
                          <span key={f} style={{ padding: '0.2rem 0.6rem', background: '#f0f0f0', borderRadius: 10, fontSize: '0.75rem', color: '#555' }}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'checklist' && (
                <div className="card">
                  <h2>{result.guideline} Reporting Checklist</h2>
                  <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>
                    Mark each item as you complete it for your manuscript.
                  </p>
                  {['Title', 'Abstract', 'Background', 'Objectives', 'Methods', 'Results', 'Discussion', 'Other'].map(section => {
                    const items = result.checklist.filter((item: any) => item.section === section);
                    if (items.length === 0) return null;
                    return (
                      <div key={section} style={{ marginBottom: '1.25rem' }}>
                        <h3 style={{ color: '#C0533A', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.5rem' }}>
                          {section}
                        </h3>
                        {items.map((item: any) => (
                          <div key={item.id} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 6, marginBottom: 4, background: '#f8f7f4', alignItems: 'flex-start' }}>
                            <input type="checkbox" style={{ marginTop: 3, flexShrink: 0 }} />
                            <div>
                              <span style={{ fontSize: '0.75rem', color: '#C0533A', fontWeight: 700, marginRight: 8 }}>{item.id}</span>
                              <span style={{ fontSize: '0.85rem' }}>{item.item}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
