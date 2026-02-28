import React, { useState, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { useStudentWizard, ColumnInfo, DatasetInfo, ColumnIntelligence, ColumnWarning } from '../context/StudentWizardContext';
import { useNavigate } from 'react-router-dom';
import DataIntelligencePanel from '../components/DataIntelligencePanel';
import LearningTip from '../components/LearningTip';
import WizardEmptyState from '../components/WizardEmptyState';
import StepSuccessMessage from '../components/StepSuccessMessage';
import { FileUploader, ValidationWarning } from '../../../packages/ui';
import { uploadDataset } from '../../../packages/api';
import '../student.css';

const ROLE_OPTIONS = [
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'outcome',    label: 'Outcome' },
  { value: 'exposure',   label: 'Exposure' },
  { value: 'covariate',  label: 'Covariate' },
  { value: 'id',         label: 'ID' },
  { value: 'time',       label: 'Time Variable' },
];

const ROLE_PILL_STYLES: Record<string, { bg: string; color: string }> = {
  outcome:    { bg: '#EBF5FB', color: '#2E86C1' },
  exposure:   { bg: '#FDEDEC', color: '#C0533A' },
  covariate:  { bg: '#E9F7EF', color: '#5A8A6A' },
  id:         { bg: '#F2F3F4', color: '#666' },
  time:       { bg: '#F5EEF8', color: '#7D3C98' },
  unassigned: { bg: 'transparent', color: '#bbb' },
};

const COVARIATE_ALIASES = ['age', 'sex', 'gender', 'bmi', 'region', 'district', 'education', 'income', 'group', 'race', 'ethnicity', 'weight', 'height', 'area'];
const ID_ALIASES = ['id', 'code', 'number', 'num', 'identifier', 'uid', 'pid', 'patid', 'studyid'];

function fuzzyMatch(a: string, b: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[_\s-]+/g, '');
  const na = normalize(a);
  const nb = normalize(b);
  if (na.includes(nb) || nb.includes(na)) return true;
  // Check aliases
  const ALIASES: Record<string, string[]> = {
    mort: ['mortality', 'death', 'died'],
    tx: ['treatment', 'intervention', 'therapy'],
    grp: ['group', 'arm'],
    outcome: ['result', 'endpoint'],
    hiv: ['hivstatus', 'hivpos'],
  };
  for (const [alias, targets] of Object.entries(ALIASES)) {
    if ((na.includes(alias) || nb.includes(alias)) && targets.some(t => na.includes(t) || nb.includes(t))) return true;
  }
  return false;
}

function buildColumnIntelligence(
  col: ColumnInfo,
  primaryOutcome: string,
  exposureVariable: string,
): ColumnIntelligence {
  const nameL = col.name.toLowerCase();

  // Suggest role
  let suggestedRole: ColumnIntelligence['suggestedRole'] = 'unassigned';
  let roleMatchReason = '';

  if (primaryOutcome && fuzzyMatch(col.name, primaryOutcome)) {
    suggestedRole = 'outcome';
    roleMatchReason = `Matches outcome "${primaryOutcome}"`;
  } else if (exposureVariable && fuzzyMatch(col.name, exposureVariable)) {
    suggestedRole = 'exposure';
    roleMatchReason = `Matches exposure "${exposureVariable}"`;
  } else if (col.type === 'date') {
    suggestedRole = 'time';
    roleMatchReason = 'Date column → time variable';
  } else if (ID_ALIASES.some(id => nameL.includes(id)) && col.uniqueValues >= col.missingCount) {
    suggestedRole = 'id';
    roleMatchReason = 'Looks like an identifier column';
  } else if (COVARIATE_ALIASES.some(a => nameL.includes(a))) {
    suggestedRole = 'covariate';
    roleMatchReason = 'Common covariate name';
  }

  // Build warnings
  const warnings: ColumnWarning[] = [];
  if (col.missingPercent > 20) warnings.push({ type: 'high-missing', severity: 'error', message: `${col.missingPercent.toFixed(1)}% missing`, suggestion: 'Consider imputation or exclusion of this variable' });
  if (col.uniqueValues === 2) warnings.push({ type: 'binary-outcome', severity: 'info', message: 'Binary variable', suggestion: 'Consider binary outcome analysis (logistic regression)' });
  if (col.uniqueValues === 1) warnings.push({ type: 'constant', severity: 'error', message: 'No variation', suggestion: 'Exclude from analysis — constant columns provide no information' });
  if (col.type === 'numeric' && col.uniqueValues < 3 && col.uniqueValues > 1) warnings.push({ type: 'low-variance', severity: 'warning', message: 'Low variance', suggestion: 'Very few unique values for a numeric variable' });

  const detectedType: ColumnIntelligence['detectedType'] =
    col.type === 'binary' ? 'binary' :
    col.type === 'numeric' ? 'numeric' :
    col.type === 'date' ? 'date' :
    col.type === 'categorical' ? 'categorical' : 'text';

  const typeConfidence = col.type === 'numeric' ? 95 : col.type === 'binary' ? 90 : col.type === 'date' ? 85 : 75;

  return {
    name: col.name,
    detectedType,
    typeConfidence,
    suggestedRole,
    roleMatchReason,
    warnings,
    stats: {
      missing: col.missingCount,
      missingPercent: col.missingPercent,
      unique: col.uniqueValues,
      skewness: null,
      mean: null,
      median: null,
      sd: null,
      min: null,
      max: null,
      mode: null,
      frequencies: null,
    },
  };
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
  const { state, setDataset, completeStep, setColumnIntelligence } = useStudentWizard();
  const navigate = useNavigate();

  const [columns, setColumns] = useState<ColumnInfo[]>(state.dataset?.columns ?? []);
  const [fileInfo, setFileInfo] = useState<{ name: string; rows: number; cols: number; size: string } | null>(
    state.dataset ? { name: state.dataset.fileName, rows: state.dataset.rowCount, cols: state.dataset.columnCount, size: '' } : null
  );
  const [preview, setPreview] = useState<{ headers: string[]; rows: any[][] } | null>(null);
  const [showSuccess, setShowSuccess] = useState(state.maxCompletedStep >= 1 && state.maxCompletedStep < 2);
  const [colIntelligence, setColIntelligence] = useState<ColumnIntelligence[]>(state.columnIntelligence ?? []);

  const handleFile = useCallback(async (file: File) => {
    if (!file) return;
    try {
      // Use consolidated uploadDataset from packages/api
      const data = await uploadDataset(file, 'student');

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

      // Build column intelligence
      const intelligence = cols.map(c =>
        buildColumnIntelligence(c, state.studyConfig.primaryOutcome, state.studyConfig.exposureVariable)
      );

      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      setFileInfo({ name: file.name, rows: data.rows, cols: data.columns, size: `${sizeMB} MB` });
      setColumns(cols);
      setColIntelligence(intelligence);
      setColumnIntelligence(intelligence);

      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split('\n').slice(0, 11);
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const rows = lines.slice(1, 11).map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
        setPreview({ headers, rows });
      }

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
      // Error state is managed by the shared FileUploader
      throw e;
    }
  }, [state.studyConfig, setDataset, setColumnIntelligence]);

  const updateRole = (colName: string, role: ColumnInfo['role']) => {
    setColumns(prev => {
      const updated = prev.map(c => c.name === colName ? { ...c, role } : c);
      if (state.dataset) {
        setDataset({ ...state.dataset, columns: updated });
      }
      return updated;
    });
  };

  const acceptAllSuggestions = () => {
    const updated = columns.map(col => {
      const intel = colIntelligence.find(ci => ci.name === col.name);
      if (intel && intel.suggestedRole !== 'unassigned') {
        return { ...col, role: intel.suggestedRole as ColumnInfo['role'] };
      }
      return col;
    });
    setColumns(updated);
    if (state.dataset) {
      setDataset({ ...state.dataset, columns: updated });
    }
  };

  const hasOutcome = columns.some(c => c.role === 'outcome');
  const hasExposure = columns.some(c => c.role === 'exposure');
  const hasCovariates = columns.some(c => c.role === 'covariate');
  const highMissingCols = columns.filter(c => c.missingPercent > 20).map(c => c.name);
  const binaryOutcome = columns.find(c => c.role === 'outcome' && c.uniqueValues === 2);
  const timeCol = columns.find(c => c.role === 'time');
  const canContinue = fileInfo !== null && hasOutcome && hasExposure;
  const hasSuggestions = colIntelligence.some(ci => ci.suggestedRole !== 'unassigned');

  const score = qualityScore(columns);
  const scoreColor = score >= 80 ? '#27AE60' : score >= 50 ? '#E67E22' : '#E74C3C';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {showSuccess && <StepSuccessMessage step={1} onDismiss={() => setShowSuccess(false)} />}

      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1C2B3A', marginBottom: '0.25rem' }}>
        Step 2: Data Upload
      </h2>
      <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Upload your dataset and assign variable roles.
      </p>

      <LearningTip
        visible={state.learningMode}
        title="What makes a good dataset?"
        explanation="Good datasets have clear variable names, minimal missing values, and consistent data entry. Each row should represent one participant or observation. Before uploading, make sure your columns have descriptive names that match your research variables."
        relatedConcepts={['Data quality', 'Variable types', 'Missing data']}
      />

      <div className="two-col-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '1.5rem' }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Section A: Upload Zone — shared FileUploader */}
          {fileInfo ? (
            /* Already-uploaded file card (loaded from persisted state) */
            <div style={{ background: 'white', borderRadius: 10, padding: '1rem 1.25rem', border: '1px solid #E5E9EF', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <FileText size={28} color="#2E86C1" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#1C2B3A' }}>{fileInfo.name}</div>
                <div style={{ fontSize: '0.82rem', color: '#888' }}>{fileInfo.rows} rows · {fileInfo.cols} columns {fileInfo.size && `· ${fileInfo.size}`}</div>
              </div>
              <button
                onClick={() => { setFileInfo(null); setColumns([]); setPreview(null); setColIntelligence([]); }}
                style={{ background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.8rem', color: '#666' }}
              >
                Replace
              </button>
            </div>
          ) : (
            <FileUploader
              context="student"
              acceptedTypes={['.csv', '.xlsx', '.xls']}
              maxSizeMB={50}
              onUpload={handleFile}
              label="Upload your dataset to begin"
              hint="Drag & drop or click to browse your CSV or Excel file"
            />
          )}

          {/* Data Intelligence Panel */}
          {colIntelligence.length > 0 && fileInfo && (
            <>
              <LearningTip
                visible={state.learningMode}
                title="What are variable roles?"
                explanation="Each variable in your dataset plays a specific role in your analysis. The outcome is what you're measuring, the exposure is what you're studying, and covariates are factors that might influence both. Assigning roles correctly is crucial for getting the right analysis."
                relatedConcepts={['Variable types', 'Covariates', 'Confounders']}
              />
              <DataIntelligencePanel columns={colIntelligence} rowCount={fileInfo.rows} />
            </>
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
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #E5E9EF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1C2B3A' }}>Variable Role Assignment</span>
                {hasSuggestions && (
                  <button
                    onClick={acceptAllSuggestions}
                    style={{
                      padding: '0.3rem 0.85rem',
                      background: '#2E86C1',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Accept All Suggestions
                  </button>
                )}
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
                    {columns.map(col => {
                      const roleCfg = ROLE_PILL_STYLES[col.role] ?? ROLE_PILL_STYLES.unassigned;
                      return (
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <select
                                className="role-select"
                                value={col.role}
                                onChange={e => updateRole(col.name, e.target.value as ColumnInfo['role'])}
                                style={{ width: 130 }}
                              >
                                {ROLE_OPTIONS.map(o => (
                                  <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                              </select>
                              {col.role !== 'unassigned' && (
                                <span style={{
                                  padding: '1px 8px',
                                  background: roleCfg.bg,
                                  color: roleCfg.color,
                                  borderRadius: 99,
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  border: `1px solid ${roleCfg.color}40`,
                                  whiteSpace: 'nowrap',
                                }}>
                                  {col.role.charAt(0).toUpperCase() + col.role.slice(1)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ color: col.missingPercent > 20 ? '#E74C3C' : '#666' }}>
                            {col.missingPercent.toFixed(1)}%
                          </td>
                          <td style={{ color: '#666' }}>{col.uniqueValues || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Validation warnings — shared ValidationWarning component */}
              <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #F0F4FA', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {!hasOutcome && (
                  <ValidationWarning
                    field="Outcome"
                    message="No outcome variable assigned — required to continue"
                    severity="error"
                  />
                )}
                {!hasExposure && (
                  <ValidationWarning
                    field="Exposure"
                    message="No exposure variable assigned — required to continue"
                    severity="error"
                  />
                )}
                {!hasCovariates && hasOutcome && hasExposure && (
                  <ValidationWarning
                    message="No covariates selected — your analysis won't be adjusted for confounders"
                    suggestion="Consider assigning covariate roles to potential confounders"
                    severity="warning"
                  />
                )}
                {fileInfo && fileInfo.rows < 30 && (
                  <ValidationWarning
                    field="Sample size"
                    message={`Dataset has only ${fileInfo.rows} rows — results may not be reliable`}
                    suggestion="Consider collecting more data before running analyses"
                    severity="warning"
                  />
                )}
                {highMissingCols.length > 0 && (
                  <ValidationWarning
                    field="Missing data"
                    message={`High missing data (>20%) in: ${highMissingCols.join(', ')}`}
                    suggestion="Consider imputation or excluding variables with excessive missingness"
                    severity="warning"
                  />
                )}
                {binaryOutcome && (
                  <ValidationWarning
                    field={binaryOutcome.name}
                    message="Binary outcome detected — logistic regression will be recommended"
                    severity="info"
                  />
                )}
                {timeCol && (
                  <ValidationWarning
                    field={timeCol.name}
                    message="Time variable detected — survival analysis will be available"
                    severity="info"
                  />
                )}
                {hasOutcome && hasExposure && (
                  <ValidationWarning
                    message="Variable roles assigned. Ready to continue."
                    severity="info"
                  />
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
