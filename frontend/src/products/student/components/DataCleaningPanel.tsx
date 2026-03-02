import React, { useState } from 'react';
import { Trash2, Copy, ArrowRightLeft, Filter, Hash, Type, Save, RotateCcw, Eye } from 'lucide-react';
import { useStudentWizard } from '../context/StudentWizardContext';
import DataPreviewModal from './DataPreviewModal';

export default function DataCleaningPanel() {
  const { state, setCleanedData, addCleaningAction, addDataVersion } = useStudentWizard();
  const { cleanedHeaders, cleanedData, rawData, dataVersions } = state;
  const [showPreview, setShowPreview] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saveVersionOpen, setSaveVersionOpen] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [versionDesc, setVersionDesc] = useState('');

  // Cleaning action states
  const [selectedCol, setSelectedCol] = useState('');
  const [filterCol, setFilterCol] = useState('');
  const [filterOp, setFilterOp] = useState<'equals' | 'not-equals' | 'contains' | 'greater' | 'less'>('equals');
  const [filterVal, setFilterVal] = useState('');
  const [recodeCol, setRecodeCol] = useState('');
  const [recodeFrom, setRecodeFrom] = useState('');
  const [recodeTo, setRecodeTo] = useState('');
  const [renameCol, setRenameCol] = useState('');
  const [renameNew, setRenameNew] = useState('');

  const headers = cleanedHeaders.length > 0 ? cleanedHeaders : state.rawHeaders;
  const data = cleanedData.length > 0 ? cleanedData : rawData;

  if (data.length === 0) return null;

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  // ─── Cleaning Operations ─────────────────────────────────
  const removeDuplicates = () => {
    const seen = new Set<string>();
    const deduped = data.filter(row => {
      const key = headers.map(h => row[h] ?? '').join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const removed = data.length - deduped.length;
    if (removed === 0) {
      showFeedback('success', 'No duplicate rows found');
      return;
    }
    setCleanedData(headers, deduped);
    addCleaningAction({ type: 'remove-duplicates', description: `Removed ${removed} duplicate rows` });
    showFeedback('success', `Removed ${removed} duplicate rows → ${deduped.length} rows remaining`);
  };

  const dropMissing = (column?: string) => {
    let cleaned: Record<string, string>[];
    let desc: string;
    if (column) {
      cleaned = data.filter(row => {
        const val = row[column] ?? '';
        return val !== '' && val !== 'NA' && val !== 'null' && val !== 'NaN' && val !== 'N/A';
      });
      desc = `Dropped rows with missing values in "${column}" (${data.length - cleaned.length} removed)`;
    } else {
      cleaned = data.filter(row =>
        headers.every(h => {
          const val = row[h] ?? '';
          return val !== '' && val !== 'NA' && val !== 'null' && val !== 'NaN' && val !== 'N/A';
        })
      );
      desc = `Dropped rows with any missing values (${data.length - cleaned.length} removed)`;
    }
    const removed = data.length - cleaned.length;
    if (removed === 0) {
      showFeedback('success', 'No missing values found');
      return;
    }
    setCleanedData(headers, cleaned);
    addCleaningAction({ type: 'drop-missing', column, description: desc });
    showFeedback('success', `${desc} → ${cleaned.length} rows remaining`);
  };

  const imputeValues = (column: string, method: 'mean' | 'median' | 'mode') => {
    const values = data.map(r => r[column] ?? '').filter(v => v !== '' && v !== 'NA' && v !== 'null' && v !== 'NaN');
    let replacement: string;

    if (method === 'mean') {
      const nums = values.map(Number).filter(n => !isNaN(n));
      if (nums.length === 0) { showFeedback('error', 'No numeric values to compute mean'); return; }
      replacement = (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
    } else if (method === 'median') {
      const nums = values.map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
      if (nums.length === 0) { showFeedback('error', 'No numeric values to compute median'); return; }
      const mid = Math.floor(nums.length / 2);
      replacement = (nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid]).toFixed(2);
    } else {
      const freq: Record<string, number> = {};
      values.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
      replacement = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
    }

    let imputed = 0;
    const cleaned = data.map(row => {
      const val = row[column] ?? '';
      if (val === '' || val === 'NA' || val === 'null' || val === 'NaN' || val === 'N/A') {
        imputed++;
        return { ...row, [column]: replacement };
      }
      return row;
    });
    if (imputed === 0) {
      showFeedback('success', `No missing values in "${column}"`);
      return;
    }
    setCleanedData(headers, cleaned);
    addCleaningAction({ type: `impute-${method}` as any, column, description: `Imputed ${imputed} missing values in "${column}" with ${method} (${replacement})` });
    showFeedback('success', `Imputed ${imputed} values in "${column}" with ${method} = ${replacement}`);
  };

  const dropColumn = (column: string) => {
    const newHeaders = headers.filter(h => h !== column);
    const cleaned = data.map(row => {
      const newRow = { ...row };
      delete newRow[column];
      return newRow;
    });
    setCleanedData(newHeaders, cleaned);
    addCleaningAction({ type: 'drop-column', column, description: `Dropped column "${column}"` });
    showFeedback('success', `Dropped column "${column}" → ${newHeaders.length} columns remaining`);
  };

  const renameColumn = () => {
    if (!renameCol || !renameNew) return;
    if (headers.includes(renameNew)) { showFeedback('error', `Column "${renameNew}" already exists`); return; }
    const newHeaders = headers.map(h => h === renameCol ? renameNew : h);
    const cleaned = data.map(row => {
      const newRow: Record<string, string> = {};
      headers.forEach(h => { newRow[h === renameCol ? renameNew : h] = row[h] ?? ''; });
      return newRow;
    });
    setCleanedData(newHeaders, cleaned);
    addCleaningAction({ type: 'rename-column', column: renameCol, params: { newName: renameNew }, description: `Renamed "${renameCol}" → "${renameNew}"` });
    showFeedback('success', `Renamed "${renameCol}" → "${renameNew}"`);
    setRenameCol('');
    setRenameNew('');
  };

  const recodeValues = () => {
    if (!recodeCol || recodeFrom === '' || recodeTo === '') return;
    let changed = 0;
    const cleaned = data.map(row => {
      if (row[recodeCol] === recodeFrom) {
        changed++;
        return { ...row, [recodeCol]: recodeTo };
      }
      return row;
    });
    if (changed === 0) {
      showFeedback('error', `No values "${recodeFrom}" found in "${recodeCol}"`);
      return;
    }
    setCleanedData(headers, cleaned);
    addCleaningAction({ type: 'recode-values', column: recodeCol, params: { from: recodeFrom, to: recodeTo }, description: `Recoded ${changed} values in "${recodeCol}": "${recodeFrom}" → "${recodeTo}"` });
    showFeedback('success', `Recoded ${changed} values in "${recodeCol}"`);
    setRecodeFrom('');
    setRecodeTo('');
  };

  const filterRows = () => {
    if (!filterCol || filterVal === '') return;
    const cleaned = data.filter(row => {
      const val = row[filterCol] ?? '';
      switch (filterOp) {
        case 'equals': return val === filterVal;
        case 'not-equals': return val !== filterVal;
        case 'contains': return val.toLowerCase().includes(filterVal.toLowerCase());
        case 'greater': return parseFloat(val) > parseFloat(filterVal);
        case 'less': return parseFloat(val) < parseFloat(filterVal);
        default: return true;
      }
    });
    const kept = cleaned.length;
    const removed = data.length - kept;
    setCleanedData(headers, cleaned);
    addCleaningAction({ type: 'filter-rows', column: filterCol, params: { op: filterOp, value: filterVal }, description: `Filtered "${filterCol}" ${filterOp} "${filterVal}" — kept ${kept}, removed ${removed} rows` });
    showFeedback('success', `Kept ${kept} rows (removed ${removed})`);
    setFilterVal('');
  };

  const handleSaveVersion = () => {
    if (!versionName) return;
    addDataVersion(versionName, versionDesc, state.cleaningActions.slice(-5).map(a => a.description));
    setSaveVersionOpen(false);
    setVersionName('');
    setVersionDesc('');
    showFeedback('success', `Saved version: "${versionName}"`);
  };

  // Compute missing stats per column
  const missingCounts: Record<string, number> = {};
  headers.forEach(h => {
    missingCounts[h] = data.filter(row => {
      const v = row[h] ?? '';
      return v === '' || v === 'NA' || v === 'null' || v === 'NaN' || v === 'N/A';
    }).length;
  });

  const inputStyle: React.CSSProperties = {
    padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #D5D8DC',
    fontSize: '0.82rem', width: '100%', outline: 'none',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle, background: '#fff', cursor: 'pointer',
  };

  const btnStyle = (color: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '0.35rem',
    padding: '0.45rem 0.85rem', background: color, color: '#fff',
    border: 'none', borderRadius: 6, cursor: 'pointer',
    fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap',
  });

  const sectionStyle: React.CSSProperties = {
    background: '#fff', borderRadius: 10, border: '1px solid #E5E9EF',
    padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header bar */}
      <div style={{
        background: '#fff', borderRadius: 10, border: '1px solid #E5E9EF',
        padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1C2B3A' }}>
            Data Cleaning
          </h3>
          <span style={{ fontSize: '0.82rem', color: '#888' }}>
            {data.length} rows · {headers.length} columns
            {state.cleaningActions.length > 0 && ` · ${state.cleaningActions.length} actions applied`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setShowPreview(true)} style={btnStyle('#2E86C1')}>
            <Eye size={14} /> View Data
          </button>
          <button onClick={() => setSaveVersionOpen(true)} style={btnStyle('#5A8A6A')}>
            <Save size={14} /> Save Version
          </button>
          <button onClick={() => {
            setCleanedData([...state.rawHeaders], state.rawData.map(r => ({ ...r })));
            showFeedback('success', 'Reset to original data');
          }} style={btnStyle('#E67E22')}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{
          padding: '0.6rem 1rem', borderRadius: 8,
          background: feedback.type === 'success' ? '#E9F7EF' : '#FDEDEC',
          color: feedback.type === 'success' ? '#1E8449' : '#C0533A',
          fontSize: '0.85rem', fontWeight: 600,
          border: `1px solid ${feedback.type === 'success' ? '#A9DFBF' : '#F5B7B1'}`,
        }}>
          {feedback.message}
        </div>
      )}

      {/* Operations grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>

        {/* 1. Remove Duplicates */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#1C2B3A', fontSize: '0.9rem' }}>
            <Copy size={16} color="#E74C3C" /> Remove Duplicates
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>Remove rows that are exact duplicates across all columns.</p>
          <button onClick={removeDuplicates} style={btnStyle('#E74C3C')}>
            <Trash2 size={14} /> Remove Duplicates
          </button>
        </div>

        {/* 2. Handle Missing Values */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#1C2B3A', fontSize: '0.9rem' }}>
            <Hash size={16} color="#2E86C1" /> Handle Missing Values
          </div>
          <select value={selectedCol} onChange={e => setSelectedCol(e.target.value)} style={selectStyle}>
            <option value="">Select column...</option>
            {headers.map(h => (
              <option key={h} value={h}>{h} ({missingCounts[h]} missing)</option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button onClick={() => dropMissing(selectedCol || undefined)} style={btnStyle('#E74C3C')}>
              Drop Rows
            </button>
            {selectedCol && (
              <>
                <button onClick={() => imputeValues(selectedCol, 'mean')} style={btnStyle('#2E86C1')}>Mean</button>
                <button onClick={() => imputeValues(selectedCol, 'median')} style={btnStyle('#2E86C1')}>Median</button>
                <button onClick={() => imputeValues(selectedCol, 'mode')} style={btnStyle('#2E86C1')}>Mode</button>
              </>
            )}
          </div>
        </div>

        {/* 3. Drop Column */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#1C2B3A', fontSize: '0.9rem' }}>
            <Trash2 size={16} color="#E67E22" /> Drop Column
          </div>
          <select value="" onChange={e => { if (e.target.value) dropColumn(e.target.value); }} style={selectStyle}>
            <option value="">Select column to drop...</option>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>

        {/* 4. Rename Column */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#1C2B3A', fontSize: '0.9rem' }}>
            <Type size={16} color="#7D3C98" /> Rename Column
          </div>
          <select value={renameCol} onChange={e => setRenameCol(e.target.value)} style={selectStyle}>
            <option value="">Select column...</option>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          {renameCol && (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <input value={renameNew} onChange={e => setRenameNew(e.target.value)} placeholder="New name" style={inputStyle} />
              <button onClick={renameColumn} style={btnStyle('#7D3C98')}>Rename</button>
            </div>
          )}
        </div>

        {/* 5. Recode Values */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#1C2B3A', fontSize: '0.9rem' }}>
            <ArrowRightLeft size={16} color="#5A8A6A" /> Recode Values
          </div>
          <select value={recodeCol} onChange={e => setRecodeCol(e.target.value)} style={selectStyle}>
            <option value="">Select column...</option>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          {recodeCol && (
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <input value={recodeFrom} onChange={e => setRecodeFrom(e.target.value)} placeholder="From value" style={inputStyle} />
              <span style={{ color: '#888' }}>→</span>
              <input value={recodeTo} onChange={e => setRecodeTo(e.target.value)} placeholder="To value" style={inputStyle} />
              <button onClick={recodeValues} style={btnStyle('#5A8A6A')}>Apply</button>
            </div>
          )}
        </div>

        {/* 6. Filter Rows */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#1C2B3A', fontSize: '0.9rem' }}>
            <Filter size={16} color="#1C2B3A" /> Filter Rows
          </div>
          <select value={filterCol} onChange={e => setFilterCol(e.target.value)} style={selectStyle}>
            <option value="">Select column...</option>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          {filterCol && (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <select value={filterOp} onChange={e => setFilterOp(e.target.value as any)} style={{ ...selectStyle, width: 'auto', minWidth: 100 }}>
                <option value="equals">equals</option>
                <option value="not-equals">not equals</option>
                <option value="contains">contains</option>
                <option value="greater">greater than</option>
                <option value="less">less than</option>
              </select>
              <input value={filterVal} onChange={e => setFilterVal(e.target.value)} placeholder="Value" style={inputStyle} />
              <button onClick={filterRows} style={btnStyle('#1C2B3A')}>Filter</button>
            </div>
          )}
        </div>
      </div>

      {/* Cleaning History */}
      {state.cleaningActions.length > 0 && (
        <div style={{
          background: '#fff', borderRadius: 10, border: '1px solid #E5E9EF',
          padding: '1rem 1.25rem',
        }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#1C2B3A' }}>
            Cleaning History ({state.cleaningActions.length} actions)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {state.cleaningActions.map((action, i) => (
              <div key={action.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.35rem 0', borderBottom: i < state.cleaningActions.length - 1 ? '1px solid #F0F4FA' : 'none',
                fontSize: '0.82rem',
              }}>
                <span style={{ color: '#2E86C1', fontWeight: 700, minWidth: 20 }}>{i + 1}.</span>
                <span style={{ color: '#333' }}>{action.description}</span>
                <span style={{ color: '#bbb', fontSize: '0.75rem', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                  {new Date(action.appliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved Versions */}
      {dataVersions.length > 0 && (
        <div style={{
          background: '#fff', borderRadius: 10, border: '1px solid #E5E9EF',
          padding: '1rem 1.25rem',
        }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#1C2B3A' }}>
            Saved Versions ({dataVersions.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {dataVersions.map(v => (
              <div key={v.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.5rem 0.75rem', background: state.activeVersionId === v.id ? '#EBF5FB' : '#FAFBFC',
                borderRadius: 8, border: `1px solid ${state.activeVersionId === v.id ? '#AED6F1' : '#E5E9EF'}`,
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1C2B3A' }}>{v.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#888' }}>
                    {v.rows} rows · {v.cols} cols · {new Date(v.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
                <button onClick={() => {
                  setCleanedData([...v.headers], v.data.map(r => ({ ...r })));
                  showFeedback('success', `Restored version: "${v.name}"`);
                }} style={{
                  padding: '0.3rem 0.65rem', background: state.activeVersionId === v.id ? '#2E86C1' : '#fff',
                  color: state.activeVersionId === v.id ? '#fff' : '#555',
                  border: `1px solid ${state.activeVersionId === v.id ? '#2E86C1' : '#ddd'}`,
                  borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                }}>
                  {state.activeVersionId === v.id ? 'Active' : 'Restore'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Version Dialog */}
      {saveVersionOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setSaveVersionOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 14, padding: '1.75rem',
            width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}>
            <h3 style={{ margin: '0 0 1rem', color: '#1C2B3A' }}>Save Data Version</h3>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Version Name *</label>
              <input value={versionName} onChange={e => setVersionName(e.target.value)} placeholder="e.g. Cleaned — Missing Imputed" style={inputStyle} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Description</label>
              <textarea value={versionDesc} onChange={e => setVersionDesc(e.target.value)} placeholder="What was cleaned?" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setSaveVersionOpen(false)} style={{ padding: '0.45rem 1rem', background: '#F4F7FA', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSaveVersion} disabled={!versionName} style={{
                ...btnStyle('#5A8A6A'),
                opacity: versionName ? 1 : 0.5,
                cursor: versionName ? 'pointer' : 'default',
              }}>
                <Save size={14} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Preview Modal */}
      <DataPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        headers={headers}
        data={data}
        title={`Current Data — ${data.length} rows × ${headers.length} columns`}
      />
    </div>
  );
}
