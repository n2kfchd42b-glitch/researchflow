import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useStudentWizard, ColumnInfo, DatasetInfo } from '../context/StudentWizardContext';
import { useNavigate } from 'react-router-dom';
import '../student.css';

const ROLE_OPTIONS = [
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'outcome',    label: 'Outcome' },
  { value: 'exposure',   label: 'Exposure' },
  { value: 'covariate',  label: 'Covariate' },
  { value: 'id',         label: 'ID' },
  { value: 'time',       label: 'Time Variable' },
];

function fuzzyMatch(a: string, b: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[_\s-]+/g, '');
  return normalize(a).includes(normalize(b)) || normalize(b).includes(normalize(a));
}

function qualityScore(columns: ColumnInfo[]): number {
  if (columns.length === 0) return 0;
  const avgMissing = columns.reduce((s, c) => s + c.missingPercent, 0) / columns.length;
  const hasOutcome = columns.some(c => c.role === 'outcome');
  const hasExposure = columns.some(c => c.role === 'exposure');
  let score = 100;
  score -= avgMissing * 0.8;
  if (!hasOutcome) score -= 20;
  if (!hasExposure) score -= 10;
  return Math.max(0, Math.round(score));
}

export default function DataUploadPage() {
  const { state, setDataset, completeStep } = useStudentWizard();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [columns, setColumns] = useState<ColumnInfo[]>(state.dataset?.columns ?? []);
  const [fileInfo, setFileInfo] = useState<{ name: string; rows: number; cols: number; size: string } | null>(
    state.dataset ? { name: state.dataset.fileName, rows: state.dataset.rowCount, cols: state.dataset.columnCount, size: '' } : null
  );
  const [preview, setPreview] = useState<{ headers: string[]; rows: any[][] } | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file) return;
    setError('');
    setUploading(true);
    setUploadProgress(0);

    // Simulate progress while uploading
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 85));
    }, 120);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/upload', { method: 'POST', body: formData });
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(data.detail || 'Upload failed');
      }

      const data = await res.json();

      // Build column list from API response
      const colTypes = data.column_types || {};
      const missingPct = data.missing_percentage || {};
      const numericSummary = data.numeric_summary || {};

      const cols: ColumnInfo[] = Object.keys(colTypes).map(name => {
        const rawType = colTypes[name];
        let detectedType: ColumnInfo['type'] = 'text';
        if (rawType === 'clinical_continuous' || rawType === 'numeric') detectedType = 'numeric';
        else if (rawType === 'demographic_categorical') detectedType = 'categorical';
        else if (rawType === 'binary') detectedType = 'binary';
        else if (rawType === 'date') detectedType = 'date';

        // Auto-assign roles based on fuzzy matching
        let role: ColumnInfo['role'] = 'unassigned';
        if (state.studyConfig.primaryOutcome && fuzzyMatch(name, state.studyConfig.primaryOutcome)) role = 'outcome';
        else if (state.studyConfig.exposureVariable && fuzzyMatch(name, state.studyConfig.exposureVariable)) role = 'exposure';

        const uniq = numericSummary[name]?.unique ?? 0;
        return {
          name,
          type: detectedType,
          role,
          missingCount: 0,
          missingPercent: missingPct[name] ?? 0,
          uniqueValues: uniq,
        };
      });

      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      setFileInfo({ name: file.name, rows: data.rows, cols: data.columns, size: `${sizeMB} MB` });
      setColumns(cols);

      // Build a quick preview using File reader for CSV
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split('\n').slice(0, 11);
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const rows = lines.slice(1, 11).map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
        setPreview({ headers, rows });
      }

      // Save to context
      const datasetInfo: DatasetInfo = {
        fileName: file.name,
        rowCount: data.rows,
        columnCount: data.columns,
        columns: cols,
        uploadedAt: new Date().toISOString(),
        fileId: data.dataset_id,
      };
      setDataset(datasetInfo);

    } catch (e: any) {
      clearInterval(progressInterval);
      setError(e.message || 'Upload failed');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  }, [state.studyConfig, setDataset]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const updateRole = (colName: string, role: ColumnInfo['role']) => {
    setColumns(prev => {
      const updated = prev.map(c => c.name === colName ? { ...c, role } : c);
      // Sync updated columns back to dataset context
      if (state.dataset) {
        setDataset({ ...state.dataset, columns: updated });
      }
      return updated;
    });
  };

  const hasOutcome = columns.some(c => c.role === 'outcome');
  const hasExposure = columns.some(c => c.role === 'exposure');
  const highMissingCols = columns.filter(c => c.missingPercent > 20).map(c => c.name);
  const binaryOutcome = columns.find(c => c.role === 'outcome' && c.uniqueValues === 2);
  const canContinue = fileInfo !== null && hasOutcome && hasExposure;

  const score = qualityScore(columns);
  const scoreColor = score >= 80 ? '#27AE60' : score >= 50 ? '#E67E22' : '#E74C3C';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1C2B3A', marginBottom: '0.25rem' }}>
        Step 2: Data Upload
      </h2>
      <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Upload your dataset and assign variable roles.
      </p>

      <div className="two-col-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '1.5rem' }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Section A: Upload Zone */}
          {!fileInfo ? (
            <div
              className={`upload-zone${dragging ? ' dragging' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                style={{ display: 'none' }}
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              />
              <Upload size={40} color="#aaa" style={{ marginBottom: '0.75rem' }} />
              <p style={{ fontWeight: 600, color: '#444', margin: '0 0 0.25rem' }}>
                Drop your CSV or Excel file here, or click to browse
              </p>
              <p style={{ color: '#999', fontSize: '0.85rem', margin: 0 }}>
                Accepts .csv, .xlsx, .xls
              </p>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 10, padding: '1rem 1.25rem', border: '1px solid #E5E9EF', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <FileText size={28} color="#2E86C1" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#1C2B3A' }}>{fileInfo.name}</div>
                <div style={{ fontSize: '0.82rem', color: '#888' }}>{fileInfo.rows} rows · {fileInfo.cols} columns {fileInfo.size && `· ${fileInfo.size}`}</div>
              </div>
              <button
                onClick={() => { setFileInfo(null); setColumns([]); setPreview(null); setError(''); }}
                style={{ background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.8rem', color: '#666' }}
              >
                Replace
              </button>
            </div>
          )}

          {/* Progress bar */}
          {uploading && (
            <div>
              <div style={{ marginBottom: '0.4rem', fontSize: '0.85rem', color: '#555' }}>Uploading… {uploadProgress}%</div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: '#FDEDEC', border: '1px solid #FADBD8', borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: '#A93226', fontSize: '0.875rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
            </div>
          )}

          {/* Section B: Data Preview */}
          {preview && (
            <div style={{ background: 'white', borderRadius: 10, border: '1px solid #E5E9EF', overflow: 'hidden' }}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #E5E9EF', fontWeight: 600, fontSize: '0.9rem', color: '#1C2B3A' }}>
                Data Preview (first 10 rows)
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      {preview.headers.slice(0, 8).map(h => (
                        <th key={h} style={{ padding: '0.5rem 0.75rem', background: '#F4F7FA', borderBottom: '2px solid #E5E9EF', textAlign: 'left', color: '#555', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {h}
                          <span style={{ marginLeft: 4, padding: '1px 5px', background: '#E5E9EF', borderRadius: 4, fontSize: '0.7rem', color: '#888' }}>
                            {columns.find(c => c.name === h)?.type ?? ''}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, ri) => (
                      <tr key={ri}>
                        {row.slice(0, 8).map((cell, ci) => (
                          <td key={ci} style={{ padding: '0.45rem 0.75rem', borderBottom: '1px solid #F0F4FA', color: '#333' }}>
                            {String(cell).slice(0, 30)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section C: Variable Role Assignment */}
          {columns.length > 0 && (
            <div style={{ background: 'white', borderRadius: 10, border: '1px solid #E5E9EF', overflow: 'hidden' }}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #E5E9EF', fontWeight: 600, fontSize: '0.9rem', color: '#1C2B3A' }}>
                Variable Role Assignment
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="var-table">
                  <thead>
                    <tr>
                      <th>Variable Name</th>
                      <th>Detected Type</th>
                      <th>Role</th>
                      <th>Missing %</th>
                      <th>Unique Values</th>
                    </tr>
                  </thead>
                  <tbody>
                    {columns.map(col => (
                      <tr key={col.name}>
                        <td style={{ fontWeight: 500, color: '#1C2B3A' }}>{col.name}</td>
                        <td>
                          <span style={{
                            padding: '2px 8px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600,
                            background: col.type === 'numeric' ? '#EAF4FF' : col.type === 'categorical' ? '#E9F7EF' : '#F4F7FA',
                            color: col.type === 'numeric' ? '#1A6EA6' : col.type === 'categorical' ? '#1E8449' : '#666',
                          }}>
                            {col.type}
                          </span>
                        </td>
                        <td>
                          <select
                            className="role-select"
                            value={col.role}
                            onChange={e => updateRole(col.name, e.target.value as ColumnInfo['role'])}
                            style={{ width: 140 }}
                          >
                            {ROLE_OPTIONS.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ color: col.missingPercent > 20 ? '#E74C3C' : '#666' }}>
                          {col.missingPercent.toFixed(1)}%
                        </td>
                        <td style={{ color: '#666' }}>{col.uniqueValues || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Validation warnings */}
              <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #F0F4FA', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {!hasOutcome && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#A93226', fontSize: '0.82rem' }}>
                    <AlertCircle size={14} /> No outcome variable assigned
                  </div>
                )}
                {!hasExposure && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#A93226', fontSize: '0.82rem' }}>
                    <AlertCircle size={14} /> No exposure variable assigned
                  </div>
                )}
                {highMissingCols.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#D68910', fontSize: '0.82rem' }}>
                    <AlertTriangle size={14} /> High missing data (&gt;20%) in: {highMissingCols.join(', ')}
                  </div>
                )}
                {binaryOutcome && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#2E86C1', fontSize: '0.82rem' }}>
                    <Info size={14} /> Outcome variable has only 2 unique values — binary analysis recommended
                  </div>
                )}
                {hasOutcome && hasExposure && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#27AE60', fontSize: '0.82rem' }}>
                    <CheckCircle size={14} /> Variable roles assigned. Ready to continue.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right — Data Summary sidebar */}
        {fileInfo && (
          <div>
            <div style={{ background: 'white', borderRadius: 10, border: '1px solid #E5E9EF', padding: '1.25rem', position: 'sticky', top: 80 }}>
              <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: '#1C2B3A' }}>Data Summary</h4>
              {[
                { label: 'Total Rows', value: fileInfo.rows },
                { label: 'Total Columns', value: fileInfo.cols },
                { label: 'Numeric Cols', value: columns.filter(c => c.type === 'numeric').length },
                { label: 'Categorical Cols', value: columns.filter(c => c.type === 'categorical').length },
                { label: 'Avg Missing %', value: `${columns.length ? (columns.reduce((s, c) => s + c.missingPercent, 0) / columns.length).toFixed(1) : 0}%` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #F0F4FA', fontSize: '0.85rem' }}>
                  <span style={{ color: '#666' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: '#1C2B3A' }}>{value}</span>
                </div>
              ))}

              {/* Quality score */}
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.82rem', color: '#666', fontWeight: 600 }}>Data Quality Score</span>
                  <span style={{ fontWeight: 700, color: scoreColor, fontSize: '0.95rem' }}>{score}/100</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${score}%`, background: scoreColor }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="action-bar">
        <button className="btn-secondary" onClick={() => navigate('/student/setup')}>
          ← Back to Setup
        </button>
        <button
          className="btn-primary"
          onClick={() => { if (canContinue) completeStep(2); }}
          disabled={!canContinue}
        >
          Save &amp; Continue →
        </button>
      </div>
    </div>
  );
}
