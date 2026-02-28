import React, { useState } from 'react';
import { Database, Upload, AlertCircle, Copy, TrendingDown, Tag, RefreshCw, GitBranch, BookOpen, ChevronDown } from 'lucide-react';
import { useNGO, DatasetRef } from '../context/NGOPlatformContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import StatusBadge from '../components/StatusBadge';

const CLEANING_TABS = ['Missing Data', 'Duplicates', 'Outliers', 'Recode', 'Transform', 'Dictionary'] as const;
type CleaningTab = typeof CLEANING_TABS[number];

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #E0E4E8', borderRadius: 8, fontSize: '0.875rem', color: '#1C2B3A', background: 'white', boxSizing: 'border-box' };

// Mock dataset preview for demo
const MOCK_COLUMNS = ['id', 'age', 'gender', 'site', 'enrolled_date', 'outcome', 'treatment', 'weight_kg', 'height_cm', 'income_level'];
const MOCK_MISSING = [
  { column: 'income_level', missing: 34, total: 255, pct: 13.3, suggested: 'Flag only' },
  { column: 'weight_kg', missing: 12, total: 255, pct: 4.7, suggested: 'Impute (mean)' },
  { column: 'height_cm', missing: 8, total: 255, pct: 3.1, suggested: 'Impute (mean)' },
];
const MOCK_OUTLIERS = [
  { column: 'age', outlierCount: 3, method: 'IQR', values: [2, 89, 94] },
  { column: 'weight_kg', outlierCount: 2, method: 'Z-score', values: [14.2, 312.0] },
];
const MOCK_DICT = [
  { variable: 'id', type: 'integer', description: 'Participant identifier', range: '1–999', missing: '0%', unique: 255 },
  { variable: 'age', type: 'integer', description: 'Age in years at enrollment', range: '18–65', missing: '0%', unique: 38 },
  { variable: 'gender', type: 'categorical', description: 'Self-reported gender identity', range: 'Male/Female/Other', missing: '0%', unique: 3 },
  { variable: 'site', type: 'categorical', description: 'Research site', range: '3 sites', missing: '0%', unique: 3 },
  { variable: 'income_level', type: 'categorical', description: 'Household income bracket', range: 'Low/Medium/High', missing: '13.3%', unique: 3 },
  { variable: 'outcome', type: 'binary', description: 'Primary study outcome', range: '0/1', missing: '0%', unique: 2 },
  { variable: 'treatment', type: 'binary', description: 'Treatment group assignment', range: '0/1', missing: '0%', unique: 2 },
];

const VERSION_HISTORY = [
  { version: 1, date: '2025-10-15', rows: 260, cols: 10, changes: 'Raw upload', type: 'raw' as const },
  { version: 2, date: '2025-10-18', rows: 255, cols: 10, changes: 'Removed 5 duplicates', type: 'cleaning' as const },
  { version: 3, date: '2025-10-22', rows: 255, cols: 12, changes: 'Imputed weight_kg/height_cm; created bmi variable', type: 'clean' as const },
];

export default function DataManagementPage() {
  const { activeProject, addDataset, addActivity } = useNGO();
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(activeProject?.datasets[0]?.id || '');
  const [activeTab, setActiveTab] = useState<CleaningTab>('Missing Data');

  const datasets = activeProject?.datasets || [];
  const selectedDataset = datasets.find(d => d.id === selectedDatasetId) || datasets[0];

  // Mock quality score
  const qualityScore = selectedDataset ? 82 : 0;
  const qualityColor = qualityScore >= 80 ? '#27AE60' : qualityScore >= 60 ? '#E67E22' : '#C0533A';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1C2B3A', margin: 0 }}>Data Management</h1>
        <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Upload, clean, and manage research datasets for {activeProject?.name || 'your project'}
        </p>
      </div>

      {/* Section A: Dataset Selector */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E4E8', padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={labelStyle}>Active Dataset</label>
            <select style={inputStyle} value={selectedDatasetId} onChange={e => setSelectedDatasetId(e.target.value)}>
              {datasets.length === 0 && <option value="">No datasets</option>}
              {datasets.map(d => <option key={d.id} value={d.id}>{d.name} (v{d.version})</option>)}
            </select>
          </div>
          {selectedDataset && (
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: '#6B7280', flexWrap: 'wrap' }}>
              <span><b>{selectedDataset.rowCount.toLocaleString()}</b> rows</span>
              <span><b>{selectedDataset.columnCount}</b> columns</span>
              <StatusBadge status={selectedDataset.status} variant="dataset" />
            </div>
          )}
          <button style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#2E86C1', color: 'white', border: 'none', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
            <Upload size={15} /> Upload New
          </button>
        </div>
      </div>

      {datasets.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 12, border: '2px dashed #E0E4E8', padding: '4rem', textAlign: 'center' }}>
          <Database size={48} color="#D1D5DB" style={{ marginBottom: '1rem' }} />
          <div style={{ color: '#9CA3AF', fontSize: '0.95rem', marginBottom: '1rem' }}>No datasets in this project</div>
          <button style={{ background: '#2E86C1', color: 'white', border: 'none', borderRadius: 8, padding: '0.6rem 1.25rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
            Upload First Dataset
          </button>
        </div>
      ) : (
        <>
          {/* Section B: Data Quality Dashboard */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E4E8', padding: '1.25rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontWeight: 700, color: '#1C2B3A', fontSize: '0.95rem' }}>Data Quality Dashboard</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem', alignItems: 'center' }}>
              {/* Quality gauge (SVG circular) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <QualityGauge score={qualityScore} color={qualityColor} />
                <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '0.4rem', textAlign: 'center' }}>Overall Quality Score</div>
              </div>
              {/* Issue cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
                {[
                  { label: 'Missing Data', value: `${MOCK_MISSING.reduce((s, r) => s + r.missing, 0)} cells`, sub: `${MOCK_MISSING.length} columns affected`, color: '#E67E22', icon: <AlertCircle size={16} />, tab: 'Missing Data' as CleaningTab },
                  { label: 'Duplicates', value: '5 rows', sub: '1.9% of data', color: '#8E44AD', icon: <Copy size={16} />, tab: 'Duplicates' as CleaningTab },
                  { label: 'Outliers', value: `${MOCK_OUTLIERS.reduce((s, r) => s + r.outlierCount, 0)} detected`, sub: '2 columns', color: '#C0533A', icon: <TrendingDown size={16} />, tab: 'Outliers' as CleaningTab },
                  { label: 'Type Issues', value: '0 columns', sub: 'All types match', color: '#27AE60', icon: <Tag size={16} />, tab: 'Recode' as CleaningTab },
                ].map(issue => (
                  <div
                    key={issue.label}
                    onClick={() => setActiveTab(issue.tab)}
                    style={{ background: '#F9FAFB', borderRadius: 10, padding: '0.875rem', border: '1px solid #E0E4E8', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'}
                  >
                    <div style={{ color: issue.color, marginBottom: '0.35rem' }}>{issue.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: issue.color }}>{issue.value}</div>
                    <div style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.1rem' }}>{issue.label}</div>
                    <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '0.15rem' }}>{issue.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section C: Cleaning Tools */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E4E8', overflow: 'hidden', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #E0E4E8', overflowX: 'auto' }}>
              {CLEANING_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{ padding: '0.75rem 1.1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: activeTab === tab ? 700 : 400, color: activeTab === tab ? '#5A8A6A' : '#6B7280', borderBottom: activeTab === tab ? '2px solid #5A8A6A' : '2px solid transparent', marginBottom: -1, whiteSpace: 'nowrap' }}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div style={{ padding: '1.25rem' }}>
              {activeTab === 'Missing Data' && <MissingDataTab />}
              {activeTab === 'Duplicates' && <DuplicatesTab />}
              {activeTab === 'Outliers' && <OutliersTab />}
              {activeTab === 'Recode' && <RecodeTab />}
              {activeTab === 'Transform' && <TransformTab />}
              {activeTab === 'Dictionary' && <DictionaryTab />}
            </div>
          </div>

          {/* Section D: Version Control */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E4E8', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontWeight: 700, color: '#1C2B3A', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GitBranch size={16} /> Version History
              </h3>
              <button style={{ background: 'white', border: '1px solid #E0E4E8', borderRadius: 8, padding: '0.4rem 0.875rem', cursor: 'pointer', fontSize: '0.8rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <RefreshCw size={13} /> Compare Versions
              </button>
            </div>
            <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
              <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: '#E0E4E8' }} />
              {VERSION_HISTORY.map((v, i) => (
                <div key={v.version} style={{ position: 'relative', marginBottom: '0.875rem', paddingLeft: '1rem' }}>
                  <div style={{ position: 'absolute', left: -19, top: 6, width: 12, height: 12, borderRadius: '50%', background: i === VERSION_HISTORY.length - 1 ? '#5A8A6A' : '#E0E4E8', border: '2px solid white', boxShadow: i === VERSION_HISTORY.length - 1 ? '0 0 0 2px #5A8A6A' : 'none' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB', borderRadius: 10, padding: '0.75rem 1rem', border: '1px solid #E0E4E8' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1C2B3A' }}>v{v.version}</span>
                        <StatusBadge status={v.type} variant="dataset" />
                        <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>{v.date}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '0.15rem' }}>{v.changes} · {v.rows} rows × {v.cols} cols</div>
                    </div>
                    {i < VERSION_HISTORY.length - 1 && (
                      <button style={{ background: 'none', border: '1px solid #E0E4E8', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', color: '#6B7280' }}>Restore</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Quality Gauge ────────────────────────────────────────────────────────────
function QualityGauge({ score, color }: { score: number; color: string }) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width={100} height={100} viewBox="0 0 100 100">
      <circle cx={50} cy={50} r={r} fill="none" stroke="#E0E4E8" strokeWidth={10} />
      <circle
        cx={50} cy={50} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text x={50} y={54} textAnchor="middle" fontSize={18} fontWeight={700} fill={color}>{score}</text>
    </svg>
  );
}

// ─── Missing Data Tab ─────────────────────────────────────────────────────────
function MissingDataTab() {
  const [actions, setActions] = useState<Record<string, string>>({});

  return (
    <div>
      <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '1rem' }}>
        {MOCK_MISSING.length} columns have missing values. Choose an action for each:
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ background: '#F9FAFB' }}>
            {['Column', 'Missing', '%', 'Suggested Action', 'Apply'].map(h => (
              <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: '0.75rem', borderBottom: '1px solid #E0E4E8' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MOCK_MISSING.map(row => (
            <tr key={row.column} style={{ borderBottom: '1px solid #F3F4F6' }}>
              <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, fontFamily: 'monospace', color: '#1C2B3A' }}>{row.column}</td>
              <td style={{ padding: '0.6rem 0.75rem' }}>{row.missing}</td>
              <td style={{ padding: '0.6rem 0.75rem', color: row.pct > 10 ? '#C0533A' : '#E67E22' }}>{row.pct}%</td>
              <td style={{ padding: '0.6rem 0.75rem' }}>
                <select
                  value={actions[row.column] || row.suggested}
                  onChange={e => setActions(a => ({ ...a, [row.column]: e.target.value }))}
                  style={{ padding: '0.35rem 0.6rem', border: '1px solid #E0E4E8', borderRadius: 6, fontSize: '0.8rem', background: 'white' }}
                >
                  <option>Drop rows</option>
                  <option>Impute (mean)</option>
                  <option>Impute (median)</option>
                  <option>Impute (mode)</option>
                  <option>Fill with value</option>
                  <option>Flag only</option>
                </select>
              </td>
              <td style={{ padding: '0.6rem 0.75rem' }}>
                <button style={{ background: '#5A8A6A', color: 'white', border: 'none', borderRadius: 6, padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Apply</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '1rem', padding: '0.875rem', background: '#F0FFF4', borderRadius: 8, border: '1px solid #A7F3D0', fontSize: '0.82rem', color: '#065F46' }}>
        After applying imputation, a new dataset version (v4) will be created automatically.
      </div>
    </div>
  );
}

// ─── Duplicates Tab ───────────────────────────────────────────────────────────
function DuplicatesTab() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ background: '#FEF3C7', borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#92400E' }}>
          <Copy size={16} /> <strong>5 duplicate rows</strong> detected (1.9% of data)
        </div>
        <select style={{ padding: '0.4rem 0.6rem', border: '1px solid #E0E4E8', borderRadius: 6, fontSize: '0.82rem', background: 'white' }}>
          <option>Keep first occurrence</option>
          <option>Keep last occurrence</option>
        </select>
        <button style={{ background: '#C0533A', color: 'white', border: 'none', borderRadius: 8, padding: '0.45rem 0.875rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
          Remove All Duplicates
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ background: '#FEE2E2' }}>
              <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: '#991B1B', fontWeight: 600, fontSize: '0.75rem' }}>Row #</th>
              <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: '#991B1B', fontWeight: 600, fontSize: '0.75rem' }}>Duplicate of Row</th>
              {MOCK_COLUMNS.slice(0, 4).map(c => <th key={c} style={{ padding: '0.5rem 0.75rem', color: '#991B1B', fontWeight: 600, fontSize: '0.75rem' }}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {[{r: 42, dup: 15}, {r: 87, dup: 23}, {r: 128, dup: 55}, {r: 190, dup: 88}, {r: 247, dup: 102}].map(({r, dup}) => (
              <tr key={r} style={{ background: '#FFF5F5', borderBottom: '1px solid #FEE2E2' }}>
                <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: '#C0533A' }}>Row {r}</td>
                <td style={{ padding: '0.5rem 0.75rem', color: '#6B7280' }}>Row {dup}</td>
                <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>{r + 100}</td>
                <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>{Math.floor(Math.random() * 40) + 20}</td>
                <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>Female</td>
                <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>Site A</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Outliers Tab ─────────────────────────────────────────────────────────────
function OutliersTab() {
  const [selectedCol, setSelectedCol] = useState('age');
  const [method, setMethod] = useState('IQR');

  const demoData = Array.from({ length: 20 }, (_, i) => ({
    value: Math.round(25 + Math.random() * 30 + (i === 3 ? 60 : 0) + (i === 15 ? -15 : 0)),
    idx: i,
  }));

  const outlier = MOCK_OUTLIERS.find(o => o.column === selectedCol);

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={labelStyle}>Column</label>
          <select style={{ ...inputStyle, width: 160 }} value={selectedCol} onChange={e => setSelectedCol(e.target.value)}>
            {MOCK_COLUMNS.filter(c => ['age', 'weight_kg', 'height_cm'].includes(c)).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Detection Method</label>
          <select style={{ ...inputStyle, width: 160 }} value={method} onChange={e => setMethod(e.target.value)}>
            <option>IQR</option>
            <option>Z-score (2SD)</option>
            <option>Z-score (3SD)</option>
          </select>
        </div>
      </div>

      {outlier && (
        <div style={{ marginBottom: '1rem', padding: '0.875rem', background: '#FEF3C7', borderRadius: 8, border: '1px solid #FDE68A', fontSize: '0.85rem', color: '#92400E' }}>
          <strong>{outlier.outlierCount} outliers</strong> detected in <code>{outlier.column}</code>: {outlier.values.join(', ')}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={demoData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
            <XAxis dataKey="idx" hide />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: any) => [v, 'Value']} />
            <Bar dataKey="value" fill="#5A8A6A" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {['Remove', 'Cap (Winsorize)', 'Flag', 'Keep'].map(action => (
          <button key={action} style={{ background: action === 'Remove' ? '#C0533A' : 'white', color: action === 'Remove' ? 'white' : '#1C2B3A', border: '1px solid #E0E4E8', borderRadius: 8, padding: '0.45rem 0.875rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: action === 'Remove' ? 600 : 400 }}>
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Recode Tab ───────────────────────────────────────────────────────────────
function RecodeTab() {
  const [selectedCol, setSelectedCol] = useState('gender');
  const [mappings, setMappings] = useState<{old: string; new: string}[]>([
    { old: 'Male', new: '1' }, { old: 'Female', new: '0' }, { old: 'Other', new: '2' }
  ]);

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Select Column to Recode</label>
        <select style={{ ...inputStyle, width: 200 }} value={selectedCol} onChange={e => setSelectedCol(e.target.value)}>
          {MOCK_COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button style={{ background: '#F3F4F6', border: '1px solid #E0E4E8', borderRadius: 6, padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.78rem', color: '#6B7280' }}>Yes/No → 1/0</button>
        <button style={{ background: '#F3F4F6', border: '1px solid #E0E4E8', borderRadius: 6, padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.78rem', color: '#6B7280' }}>True/False → 1/0</button>
        <button style={{ background: '#F3F4F6', border: '1px solid #E0E4E8', borderRadius: 6, padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.78rem', color: '#6B7280' }}>Collapse categories</button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
        <thead>
          <tr style={{ background: '#F9FAFB' }}>
            {['Old Value', 'New Value', ''].map(h => <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: '0.75rem', borderBottom: '1px solid #E0E4E8' }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {mappings.map((m, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
              <td style={{ padding: '0.4rem 0.75rem' }}>
                <input style={{ ...inputStyle, width: '100%' }} value={m.old} onChange={e => setMappings(ms => ms.map((mm, ii) => ii === i ? { ...mm, old: e.target.value } : mm))} />
              </td>
              <td style={{ padding: '0.4rem 0.75rem' }}>
                <input style={{ ...inputStyle, width: '100%' }} value={m.new} onChange={e => setMappings(ms => ms.map((mm, ii) => ii === i ? { ...mm, new: e.target.value } : mm))} />
              </td>
              <td style={{ padding: '0.4rem 0.75rem' }}>
                <button onClick={() => setMappings(ms => ms.filter((_, ii) => ii !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0533A' }}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button onClick={() => setMappings(ms => [...ms, { old: '', new: '' }])} style={{ background: 'none', border: '1px dashed #E0E4E8', borderRadius: 6, padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.78rem', color: '#5A8A6A' }}>+ Add mapping</button>
        <button style={{ background: '#5A8A6A', color: 'white', border: 'none', borderRadius: 8, padding: '0.45rem 0.875rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>Apply Recode</button>
      </div>
    </div>
  );
}

// ─── Transform Tab ────────────────────────────────────────────────────────────
function TransformTab() {
  const [selectedCol, setSelectedCol] = useState('age');
  const [transform, setTransform] = useState('Log');

  const transforms = ['Log', 'Square root', 'Z-score standardize', 'Categorize continuous', 'Create new variable'];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <label style={labelStyle}>Select Column</label>
          <select style={inputStyle} value={selectedCol} onChange={e => setSelectedCol(e.target.value)}>
            {MOCK_COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Transformation</label>
          <select style={inputStyle} value={transform} onChange={e => setTransform(e.target.value)}>
            {transforms.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '0.875rem', border: '1px solid #E0E4E8', marginBottom: '0.75rem', fontSize: '0.82rem' }}>
        <div style={{ fontWeight: 600, color: '#1C2B3A', marginBottom: '0.3rem' }}>Preview: {transform}({selectedCol})</div>
        <div style={{ color: '#6B7280' }}>
          Original range: 18–65 → Transformed range: 2.89–4.17
        </div>
        {transform === 'Z-score standardize' && <div style={{ color: '#6B7280' }}>Mean = 0, SD = 1</div>}
        {transform === 'Categorize continuous' && (
          <div style={{ color: '#6B7280' }}>Creates: {selectedCol}_cat with quartile/tertile bins</div>
        )}
      </div>

      <button style={{ background: '#5A8A6A', color: 'white', border: 'none', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
        Apply Transformation
      </button>
    </div>
  );
}

// ─── Dictionary Tab ───────────────────────────────────────────────────────────
function DictionaryTab() {
  const [dict, setDict] = useState(MOCK_DICT);
  const [editingRow, setEditingRow] = useState<string | null>(null);

  function updateRow(variable: string, field: string, value: string) {
    setDict(d => d.map(r => r.variable === variable ? { ...r, [field]: value } : r));
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ margin: 0, fontWeight: 700, color: '#1C2B3A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <BookOpen size={16} /> Data Dictionary
        </h4>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={{ background: 'none', border: '1px solid #E0E4E8', borderRadius: 8, padding: '0.4rem 0.875rem', cursor: 'pointer', fontSize: '0.8rem', color: '#6B7280' }}>Export CSV</button>
          <button style={{ background: 'none', border: '1px solid #E0E4E8', borderRadius: 8, padding: '0.4rem 0.875rem', cursor: 'pointer', fontSize: '0.8rem', color: '#6B7280' }}>Generate Codebook</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              {['Variable', 'Type', 'Description', 'Valid Range', 'Missing %', 'Unique Values'].map(h => (
                <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: '0.75rem', borderBottom: '1px solid #E0E4E8' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dict.map(row => (
              <tr key={row.variable} style={{ borderBottom: '1px solid #F3F4F6' }} onDoubleClick={() => setEditingRow(editingRow === row.variable ? null : row.variable)}>
                <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'monospace', fontWeight: 600, color: '#2E86C1' }}>{row.variable}</td>
                <td style={{ padding: '0.6rem 0.75rem', color: '#6B7280', fontSize: '0.75rem' }}>{row.type}</td>
                <td style={{ padding: '0.6rem 0.75rem', color: '#1C2B3A' }}>
                  {editingRow === row.variable ? (
                    <input style={{ ...inputStyle, fontSize: '0.8rem' }} value={row.description} onChange={e => updateRow(row.variable, 'description', e.target.value)} />
                  ) : row.description}
                </td>
                <td style={{ padding: '0.6rem 0.75rem', color: '#6B7280' }}>
                  {editingRow === row.variable ? (
                    <input style={{ ...inputStyle, fontSize: '0.8rem', width: 120 }} value={row.range} onChange={e => updateRow(row.variable, 'range', e.target.value)} />
                  ) : row.range}
                </td>
                <td style={{ padding: '0.6rem 0.75rem', color: parseFloat(row.missing) > 5 ? '#C0533A' : '#6B7280' }}>{row.missing}</td>
                <td style={{ padding: '0.6rem 0.75rem', color: '#6B7280' }}>{row.unique}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.5rem' }}>Double-click a row to edit description and valid range</div>
    </div>
  );
}
