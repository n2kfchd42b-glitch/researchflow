import React, { useState } from 'react';
import { api, cohortApi } from '../services/api';

const OPERATORS = [
  { value: 'equals',        label: '= equals'         },
  { value: 'not_equals',    label: '≠ not equals'     },
  { value: 'greater_than',  label: '> greater than'   },
  { value: 'less_than',     label: '< less than'      },
  { value: 'greater_equal', label: '≥ greater or equal'},
  { value: 'less_equal',    label: '≤ less or equal'  },
  { value: 'contains',      label: '~ contains'       },
  { value: 'not_contains',  label: '!~ not contains'  },
  { value: 'is_missing',    label: '∅ is missing'     },
  { value: 'is_not_missing',label: '✓ is not missing' },
];

function CriterionRow({ criterion, columns, onChange, onDelete }: any) {
  return (
    <div style={{
      display: 'flex', gap: '0.5rem', alignItems: 'center',
      padding: '0.75rem', background: '#f8f7f4', borderRadius: 8, marginBottom: 8
    }}>
      <select value={criterion.column} onChange={e => onChange({...criterion, column: e.target.value})}
        style={{ flex: 2, padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.9rem' }}>
        <option value="">Select column...</option>
        {columns.map((col: string) => <option key={col} value={col}>{col}</option>)}
      </select>
      <select value={criterion.operator} onChange={e => onChange({...criterion, operator: e.target.value})}
        style={{ flex: 2, padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.9rem' }}>
        <option value="">Select operator...</option>
        {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
      </select>
      {criterion.operator !== 'is_missing' && criterion.operator !== 'is_not_missing' && (
        <input value={criterion.value} onChange={e => onChange({...criterion, value: e.target.value})}
          placeholder="Value..."
          style={{ flex: 2, padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.9rem' }} />
      )}
      <button onClick={onDelete} style={{
        background: 'transparent', border: '1px solid #f44336',
        color: '#f44336', padding: '0.4rem 0.7rem', borderRadius: 6, cursor: 'pointer', fontSize: '1rem'
      }}>×</button>
    </div>
  );
}

export default function CohortBuilder() {
  const [uploadResult, setUploadResult]   = useState<any>(null);
  const [datasetId, setDatasetId]         = useState('');
  const [inclusion, setInclusion]         = useState<any[]>([]);
  const [exclusion, setExclusion]         = useState<any[]>([]);
  const [cohortResult, setCohortResult]   = useState<any>(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

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

  function addCriterion(type: 'inclusion' | 'exclusion') {
    const criterion = { id: Date.now(), column: '', operator: '', value: '' };
    if (type === 'inclusion') setInclusion(prev => [...prev, criterion]);
    else setExclusion(prev => [...prev, criterion]);
  }

  function updateCriterion(type: 'inclusion' | 'exclusion', id: number, updated: any) {
    if (type === 'inclusion') {
      setInclusion(prev => prev.map(c => c.id === id ? updated : c));
    } else {
      setExclusion(prev => prev.map(c => c.id === id ? updated : c));
    }
  }

  function deleteCriterion(type: 'inclusion' | 'exclusion', id: number) {
    if (type === 'inclusion') setInclusion(prev => prev.filter(c => c.id !== id));
    else setExclusion(prev => prev.filter(c => c.id !== id));
  }

  async function applyFilters() {
    setLoading(true);
    setError('');
    try {
      const result = await cohortApi.buildCohort(datasetId, inclusion, exclusion);
      setCohortResult(result);
    } catch (err: any) {
      setError('Failed to build cohort: ' + err.message);
    }
    setLoading(false);
  }

  const columns = uploadResult ? Object.keys(uploadResult.column_types) : [];

  return (
    <div className="page">
      <h1 style={{ color: '#1C2B3A' }}>Cohort Builder</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        Define inclusion and exclusion criteria to build your analytic cohort.
      </p>

      {error && <div className="alert alert-critical">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <div className="card">
            <h2>Upload Dataset</h2>
            <label className="upload-zone" style={{ display: 'block', cursor: 'pointer' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📂</div>
              <p style={{ fontWeight: 600, color: '#1C2B3A' }}>Upload your dataset</p>
              <p style={{ fontSize: '0.85rem' }}>CSV, XLSX, SAV, DTA</p>
              <input type="file" accept=".csv,.xlsx,.xls,.sav,.dta"
                onChange={handleUpload} style={{ display: 'none' }} />
            </label>
            {uploadResult && (
              <div className="alert alert-success" style={{ marginTop: '1rem' }}>
                {uploadResult.rows} records loaded across {uploadResult.columns} variables
              </div>
            )}
          </div>

          {uploadResult && (
            <div>
              <div className="card" style={{ borderTop: '4px solid #5A8A6A' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ marginBottom: 0 }}>✅ Inclusion Criteria</h2>
                  <button className="btn" style={{ background: '#5A8A6A', color: 'white', padding: '0.4rem 0.9rem' }}
                    onClick={() => addCriterion('inclusion')}>
                    + Add
                  </button>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>
                  Keep participants who match ALL of these criteria.
                </p>
                {inclusion.length === 0 && (
                  <p style={{ color: '#aaa', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                    No inclusion criteria — all records will be included.
                  </p>
                )}
                {inclusion.map(c => (
                  <CriterionRow key={c.id} criterion={c} columns={columns}
                    onChange={(updated: any) => updateCriterion('inclusion', c.id, updated)}
                    onDelete={() => deleteCriterion('inclusion', c.id)} />
                ))}
              </div>

              <div className="card" style={{ borderTop: '4px solid #C0533A' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ marginBottom: 0 }}>❌ Exclusion Criteria</h2>
                  <button className="btn btn-primary" style={{ padding: '0.4rem 0.9rem' }}
                    onClick={() => addCriterion('exclusion')}>
                    + Add
                  </button>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>
                  Remove participants who match ANY of these criteria.
                </p>
                {exclusion.length === 0 && (
                  <p style={{ color: '#aaa', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                    No exclusion criteria — no records will be excluded.
                  </p>
                )}
                {exclusion.map(c => (
                  <CriterionRow key={c.id} criterion={c} columns={columns}
                    onChange={(updated: any) => updateCriterion('exclusion', c.id, updated)}
                    onDelete={() => deleteCriterion('exclusion', c.id)} />
                ))}
              </div>

              <button className="btn btn-full btn-navy"
                onClick={applyFilters} disabled={loading}>
                {loading ? 'Building Cohort...' : 'Apply Filters & Build Cohort'}
              </button>
            </div>
          )}
        </div>

        <div>
          {!cohortResult && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👥</div>
              <h2>Cohort Flow</h2>
              <p>Upload a dataset and apply filters to see your cohort flow here.</p>
            </div>
          )}

          {cohortResult && (
            <div>
              <div className="card" style={{ textAlign: 'center', borderTop: '4px solid #1C2B3A' }}>
                <h2>CONSORT Flow Diagram</h2>
                <div style={{ margin: '1.5rem 0' }}>
                  {cohortResult.consort_flow.map((step: any, i: number) => (
                    <div key={i}>
                      <div style={{
                        padding: '1rem 1.5rem', borderRadius: 8, margin: '0 auto',
                        maxWidth: 280, background: i === cohortResult.consort_flow.length - 1 ? '#1C2B3A' : '#f8f7f4',
                        border: '2px solid ' + (i === cohortResult.consort_flow.length - 1 ? '#1C2B3A' : '#ddd'),
                        color: i === cohortResult.consort_flow.length - 1 ? 'white' : '#1C2B3A',
                      }}>
                        <p style={{ fontWeight: 700, fontSize: '1.5rem', marginBottom: 4 }}>{step.n}</p>
                        <p style={{ fontSize: '0.85rem', marginBottom: 0 }}>{step.label}</p>
                      </div>
                      {i < cohortResult.consort_flow.length - 1 && (
                        <div style={{ textAlign: 'center', fontSize: '1.5rem', color: '#888', margin: '0.25rem 0' }}>↓</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2>Cohort Summary</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {[
                    { label: 'Original Records',       value: cohortResult.original_n,            color: '#1C2B3A' },
                    { label: 'Final Cohort',            value: cohortResult.final_n,               color: '#5A8A6A' },
                    { label: 'Excluded by Inclusion',  value: cohortResult.excluded_by_inclusion,  color: '#ff9800' },
                    { label: 'Excluded by Exclusion',  value: cohortResult.excluded_by_exclusion,  color: '#C0533A' },
                  ].map(item => (
                    <div key={item.label} style={{
                      padding: '1rem', borderRadius: 8,
                      background: '#f8f7f4', border: '1px solid #eee'
                    }}>
                      <p style={{ fontSize: '1.8rem', fontWeight: 700, color: item.color, marginBottom: 4 }}>
                        {item.value}
                      </p>
                      <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: 0 }}>{item.label}</p>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '1rem' }} className={'alert alert-' + (cohortResult.exclusion_rate > 50 ? 'warning' : 'success')}>
                  {cohortResult.exclusion_rate}% of records excluded.
                  {cohortResult.exclusion_rate > 50
                    ? ' High exclusion rate — review your criteria.'
                    : ' Exclusion rate is acceptable.'}
                </div>
              </div>

              {cohortResult.final_n < 30 && (
                <div className="alert alert-critical">
                  Warning: Final cohort has fewer than 30 participants.
                  Statistical analysis may not be reliable.
                </div>
              )}

              {cohortResult.final_n >= 30 && (
                <div className="card" style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>
                    Your cohort of <strong style={{ color: '#5A8A6A' }}>{cohortResult.final_n} participants</strong> is ready for analysis.
                  </p>
                  <a href="/student" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                    Proceed to Student Wizard
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
