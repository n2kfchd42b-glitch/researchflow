import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { API_URL } from '../config';
import { useWorkflow } from '../context/WorkflowContext';
import { previewToUploadResult } from '../utils/datasetPreview';

const STUDY_DESIGNS = [
  { id: 'retrospective_cohort', label: 'Retrospective Cohort' },
  { id: 'prospective_cohort',   label: 'Prospective Cohort'   },
  { id: 'case_control',         label: 'Case Control'          },
  { id: 'cross_sectional',      label: 'Cross Sectional'       },
  { id: 'rct',                  label: 'Randomised Controlled Trial' },
  { id: 'observational',        label: 'Observational'         },
];

export default function GuidedAnalysis() {
  const { activeDataset, setActiveDataset } = useWorkflow();
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [datasetId, setDatasetId]       = useState(activeDataset?.datasetId || '');
  const [outcome, setOutcome]           = useState('');
  const [predictors, setPredictors]     = useState<string[]>([]);
  const [studyDesign, setStudyDesign]   = useState('retrospective_cohort');
  const [researchQ, setResearchQ]       = useState('');
  const [recommendation, setRec]        = useState<any>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  useEffect(() => {
    if (activeDataset?.datasetId) {
      setDatasetId(activeDataset.datasetId);
    }
  }, [activeDataset?.datasetId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.upload(file);
      setUploadResult(data);
      setDatasetId(data.dataset_id);
      setActiveDataset({
        datasetId: data.dataset_id,
        datasetName: file.name,
        datasetVersionId: null,
        source: 'shared',
        columnTypes: data.column_types,
      });
    } catch (err: any) {
      setError('Upload failed: ' + err.message);
    }
    setLoading(false);
  }

  async function useActiveDataset() {
    if (!activeDataset?.datasetId) return;
    setLoading(true);
    setError('');
    try {
      const preview = await api.getDatasetPreview(activeDataset.datasetId);
      const hydrated = previewToUploadResult(preview);
      setUploadResult(hydrated);
      setDatasetId(activeDataset.datasetId);
    } catch (err: any) {
      setError('Failed to load active dataset: ' + (err.message || 'Unknown error'));
    }
    setLoading(false);
  }

  function togglePredictor(col: string) {
    setPredictors(prev =>
      prev.includes(col) ? prev.filter(p => p !== col) : [...prev, col]
    );
  }

  async function getRecommendation() {
    if (!outcome || predictors.length === 0) {
      setError('Please select an outcome and at least one predictor.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/guided/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_id:        datasetId,
          outcome_col:       outcome,
          predictor_cols:    predictors,
          study_design:      studyDesign,
          research_question: researchQ,
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRec(data);
    } catch (err: any) {
      setError('Failed to get recommendation: ' + err.message);
    }
    setLoading(false);
  }

  const columns = uploadResult
    ? Object.keys(uploadResult.column_types)
    : activeDataset?.columnTypes
      ? Object.keys(activeDataset.columnTypes)
      : [];

  return (
    <div className="page">
      <h1 style={{ color: '#1C2B3A' }}>Guided Analysis Engine</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        Describe your study and let the engine recommend the right statistical test.
      </p>

      {error && <div className="alert alert-critical">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem' }}>
        <div>
          {!uploadResult && (
            <div className="card">
              <h2>Dataset Source</h2>
              {activeDataset?.datasetId && (
                <button
                  className="btn"
                  style={{ width: '100%', marginBottom: '0.75rem', background: '#E8F0FE', color: '#1C2B3A' }}
                  onClick={useActiveDataset}
                  disabled={loading}
                >
                  {loading ? 'Loading active dataset...' : `Use active dataset${activeDataset.datasetName ? `: ${activeDataset.datasetName}` : ''}`}
                </button>
              )}
              <label className="btn" style={{ width: '100%', background: '#F3F4F6', color: '#374151', textAlign: 'center', cursor: 'pointer' }}>
                Upload a different file (fallback)
                <input type="file" accept=".csv,.xlsx,.xls,.sav,.dta" onChange={handleUpload} style={{ display: 'none' }} />
              </label>
              <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.6rem', marginBottom: 0 }}>
                Reuse active dataset to avoid re-entry. Upload only if you need to switch source data.
              </p>
            </div>
          )}

          {uploadResult && (
            <div>
              <div className="card">
                <h2>Research Question</h2>
                <textarea value={researchQ} onChange={e => setResearchQ(e.target.value)}
                  placeholder="e.g. Does CHW intervention reduce child mortality in rural Tanzania?"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.9rem', minHeight: 80 }} />
              </div>

              <div className="card">
                <h2>Study Design</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {STUDY_DESIGNS.map(d => (
                    <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 6, cursor: 'pointer', background: studyDesign === d.id ? '#fff5f3' : 'transparent', border: '1px solid ' + (studyDesign === d.id ? '#C0533A' : 'transparent') }}>
                      <input type="radio" name="design" value={d.id} checked={studyDesign === d.id} onChange={() => setStudyDesign(d.id)} />
                      <span style={{ fontWeight: studyDesign === d.id ? 700 : 400, color: studyDesign === d.id ? '#C0533A' : '#1C2B3A' }}>{d.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2>Outcome Variable</h2>
                <select value={outcome} onChange={e => setOutcome(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }}>
                  <option value="">Select outcome variable...</option>
                  {columns.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
              </div>

              <div className="card">
                <h2>Predictor Variables</h2>
                <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.75rem' }}>Select all variables you want to include as predictors.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {columns.filter(c => c !== outcome).map(col => (
                    <button key={col} onClick={() => togglePredictor(col)} style={{
                      padding: '0.4rem 0.9rem', borderRadius: 20, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                      background: predictors.includes(col) ? '#5A8A6A' : '#f0f0f0',
                      color: predictors.includes(col) ? 'white' : '#444',
                      border: '1px solid ' + (predictors.includes(col) ? '#5A8A6A' : '#ddd')
                    }}>
                      {col}
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary btn-full" onClick={getRecommendation}
                disabled={!outcome || predictors.length === 0 || loading}>
                {loading ? 'Analysing...' : '🔬 Get Statistical Recommendation'}
              </button>
            </div>
          )}
        </div>

        <div>
          {!recommendation && (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔬</div>
              <h2>Statistical Recommendation</h2>
              <p>Upload your dataset, describe your study, select variables and tap Get Recommendation.</p>
              <div className="alert alert-success" style={{ textAlign: 'left', marginTop: '1.5rem' }}>
                <strong>How it works:</strong> The engine analyses your outcome type, study design, sample size and number of predictors to recommend the most appropriate statistical test — with a plain language explanation of why.
              </div>
            </div>
          )}

          {recommendation && (
            <div>
              <div className="card" style={{ borderTop: '4px solid #C0533A' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '2rem' }}>🥇</span>
                  <div>
                    <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: 2 }}>RECOMMENDED TEST</p>
                    <h2 style={{ color: '#C0533A', marginBottom: 0 }}>{recommendation.primary_test.name}</h2>
                  </div>
                </div>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#555', marginBottom: '1rem' }}>
                  {recommendation.explanation}
                </p>
                <div style={{ padding: '1rem', background: '#f8f7f4', borderRadius: 8 }}>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>Expected Output</p>
                  <p style={{ fontSize: '0.88rem', color: '#555', marginBottom: 0 }}>{recommendation.primary_test.output}</p>
                </div>
              </div>

              {recommendation.warnings?.length > 0 && (
                <div className="card" style={{ borderTop: '4px solid #ff9800' }}>
                  <h2>⚠️ Warnings</h2>
                  {recommendation.warnings.map((w: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderBottom: i < recommendation.warnings.length - 1 ? '1px solid #eee' : 'none' }}>
                      <span>⚠️</span>
                      <span style={{ fontSize: '0.9rem' }}>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="card">
                <h2>Assumptions to Check</h2>
                {recommendation.primary_test.assumptions?.map((a: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.5rem 0', borderBottom: i < recommendation.primary_test.assumptions.length - 1 ? '1px solid #eee' : 'none' }}>
                    <span style={{ color: '#5A8A6A', fontSize: '1.1rem' }}>☑</span>
                    <span style={{ fontSize: '0.9rem' }}>{a}</span>
                  </div>
                ))}
              </div>

              <div className="card">
                <h2>Pre-Analysis Checklist</h2>
                {recommendation.checklist?.map((item: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.5rem 0', borderBottom: i < recommendation.checklist.length - 1 ? '1px solid #eee' : 'none' }}>
                    <span style={{ fontSize: '1.2rem' }}>{item.check ? '✅' : '❌'}</span>
                    <span style={{ fontSize: '0.88rem', color: item.check ? '#1C2B3A' : '#f44336' }}>{item.item}</span>
                  </div>
                ))}
              </div>

              {recommendation.secondary_test && (
                <div className="card" style={{ borderTop: '4px solid #5A8A6A' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🥈</span>
                    <div>
                      <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: 2 }}>ALTERNATIVE TEST</p>
                      <h3 style={{ color: '#5A8A6A', marginBottom: 0 }}>{recommendation.secondary_test.name}</h3>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#555' }}>{recommendation.secondary_test.when_to_use}</p>
                  <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: 0 }}>
                    Reference: {recommendation.secondary_test.citations}
                  </p>
                </div>
              )}

              <div className="card" style={{ background: '#1C2B3A', color: 'white' }}>
                <h2 style={{ color: 'white' }}>Reference</h2>
                <p style={{ fontSize: '0.88rem', color: '#aaa', marginBottom: 0 }}>
                  {recommendation.primary_test.citations}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
