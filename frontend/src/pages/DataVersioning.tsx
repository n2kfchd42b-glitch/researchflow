import React, { useState } from 'react';

type Version = {
  id:          string;
  name:        string;
  description: string;
  rows:        number;
  cols:        number;
  created_at:  string;
  changes:     string[];
  data:        string;
  size_kb:     number;
};

function parseCSV(text: string): { headers: string[], rows: Record<string, string>[] } {
  const lines   = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows    = lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim().replace(/"/g, ''); });
    return obj;
  });
  return { headers, rows };
}

function computeDiff(v1: Version, v2: Version): string[] {
  const diffs: string[] = [];
  if (v1.rows !== v2.rows) diffs.push(`Rows: ${v1.rows} → ${v2.rows} (${v2.rows - v1.rows > 0 ? '+' : ''}${v2.rows - v1.rows})`);
  if (v1.cols !== v2.cols) diffs.push(`Columns: ${v1.cols} → ${v2.cols}`);
  return diffs.length > 0 ? diffs : ['No structural changes'];
}

const VERSION_NAMES = [
  'Raw Data',
  'Duplicates Removed',
  'Outliers Handled',
  'Missing Imputed',
  'Variables Recoded',
  'Final Clean',
  'Analysis Ready',
];

export default function DataVersioning() {
  const [versions, setVersions]       = useState<Version[]>([]);
  const [loading, setLoading]         = useState(false);
  const [activeVersion, setActiveVersion] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA]       = useState<string | null>(null);
  const [compareB, setCompareB]       = useState<string | null>(null);
  const [showSave, setShowSave]       = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionDesc, setNewVersionDesc] = useState('');
  const [newVersionChanges, setNewVersionChanges] = useState('');
  const [currentData, setCurrentData] = useState<string>('');
  const [currentHeaders, setCurrentHeaders] = useState<string[]>([]);
  const [currentRows, setCurrentRows] = useState<Record<string, string>[]>([]);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers, rows } = parseCSV(text);
      setCurrentData(text);
      setCurrentHeaders(headers);
      setCurrentRows(rows);
      setShowSave(true);
      setNewVersionName(versions.length === 0 ? 'Raw Data' : VERSION_NAMES[Math.min(versions.length, VERSION_NAMES.length - 1)]);
      setLoading(false);
    };
    reader.readAsText(file);
  }

  function saveVersion() {
    if (!newVersionName || !currentData) return;
    const { headers, rows } = parseCSV(currentData);
    const version: Version = {
      id:          Date.now().toString(),
      name:        newVersionName,
      description: newVersionDesc,
      rows:        rows.length,
      cols:        headers.length,
      created_at:  new Date().toISOString(),
      changes:     newVersionChanges.split('\n').filter(Boolean),
      data:        currentData,
      size_kb:     Math.round(currentData.length / 1024 * 10) / 10,
    };
    setVersions(prev => [...prev, version]);
    setShowSave(false);
    setNewVersionName('');
    setNewVersionDesc('');
    setNewVersionChanges('');
    setActiveVersion(version.id);
  }

  function downloadVersion(version: Version) {
    const blob = new Blob([version.data], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `${version.name.replace(/\s+/g, '_').toLowerCase()}.csv`;
    a.click();
  }

  function deleteVersion(id: string) {
    if (window.confirm('Delete this version? This cannot be undone.')) {
      setVersions(prev => prev.filter(v => v.id !== id));
      if (activeVersion === id) setActiveVersion(null);
    }
  }

  const activeVer  = versions.find(v => v.id === activeVersion);
  const compareVerA = versions.find(v => v.id === compareA);
  const compareVerB = versions.find(v => v.id === compareB);

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ color: '#1C2B3A', marginBottom: 0 }}>Data Versioning</h1>
          <p style={{ marginBottom: 0, fontSize: '0.88rem', color: '#888' }}>
            Save snapshots at each cleaning stage — never lose your raw data
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {versions.length >= 2 && (
            <button className="btn" style={{ background: compareMode ? '#1C2B3A' : '#eee', color: compareMode ? 'white' : '#444', fontSize: '0.85rem' }}
              onClick={() => setCompareMode(!compareMode)}>
              {compareMode ? '✓ Compare Mode' : '⚖️ Compare Versions'}
            </button>
          )}
          <label className="btn btn-primary" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
            + Upload & Save Version
            <input type="file" accept=".csv" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* SAVE MODAL */}
      {showSave && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: 500, maxWidth: '90vw' }}>
            <h2>Save Dataset Version</h2>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>VERSION NAME</label>
              <select value={newVersionName} onChange={e => setNewVersionName(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                {VERSION_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <input value={newVersionName} onChange={e => setNewVersionName(e.target.value)}
                placeholder="Or type a custom name..."
                style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>DESCRIPTION</label>
              <input value={newVersionDesc} onChange={e => setNewVersionDesc(e.target.value)}
                placeholder="Brief description of this version"
                style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>CHANGES MADE (one per line)</label>
              <textarea value={newVersionChanges} onChange={e => setNewVersionChanges(e.target.value)}
                placeholder={`Removed 12 duplicate rows\nImputed missing age values with median\nRecoded education variable`}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.85rem', minHeight: 90 }} />
            </div>
            <div style={{ background: '#f8f7f4', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', fontSize: '0.82rem' }}>
              <strong>Dataset preview:</strong> {currentRows.length} rows · {currentHeaders.length} columns · {Math.round(currentData.length / 1024 * 10) / 10} KB
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={saveVersion} disabled={!newVersionName}>
                💾 Save Version
              </button>
              <button className="btn" style={{ background: '#eee', color: '#444' }} onClick={() => setShowSave(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {versions.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🗂️</div>
          <h2>No Versions Yet</h2>
          <p style={{ color: '#888', marginBottom: '1.5rem' }}>
            Upload your raw dataset to create the first version. Then upload cleaned versions as you process your data.
          </p>
          <div style={{ textAlign: 'left', background: '#f8f7f4', borderRadius: 8, padding: '1.25rem', marginBottom: '1.5rem' }}>
            <p style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Recommended workflow:</p>
            {['Upload raw data → Save as "Raw Data"', 'Clean in Data Cleaning Studio', 'Upload cleaned file → Save as "Duplicates Removed"', 'Continue cleaning → Save each stage', 'Final version → "Analysis Ready"'].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                <span style={{ color: '#C0533A', fontWeight: 700, minWidth: 20 }}>{i+1}.</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            Upload First Version
            <input type="file" accept=".csv" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
        </div>
      )}

      {versions.length > 0 && !compareMode && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>

          {/* VERSION LIST */}
          <div>
            <div className="card" style={{ padding: '1rem' }}>
              <h3 style={{ fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.75rem' }}>
                Versions ({versions.length})
              </h3>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, width: 2, background: '#eee', zIndex: 0 }} />
                {versions.map((v, i) => (
                  <div key={v.id} onClick={() => setActiveVersion(v.id)} style={{
                    display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', cursor: 'pointer',
                    position: 'relative', zIndex: 1,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: activeVersion === v.id ? '#C0533A' : '#1C2B3A',
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.78rem', fontWeight: 700,
                    }}>
                      v{i+1}
                    </div>
                    <div style={{
                      flex: 1, padding: '0.5rem 0.75rem', borderRadius: 8,
                      background: activeVersion === v.id ? '#fff5f3' : '#f8f7f4',
                      border: '1px solid ' + (activeVersion === v.id ? '#C0533A' : '#eee'),
                    }}>
                      <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 2, color: activeVersion === v.id ? '#C0533A' : '#1C2B3A' }}>
                        {v.name}
                      </p>
                      <p style={{ fontSize: '0.72rem', color: '#888', marginBottom: 0 }}>
                        {v.rows} rows · {formatTime(v.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* VERSION DETAIL */}
          <div>
            {!activeVer && (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: '#888' }}>Select a version to view details</p>
              </div>
            )}
            {activeVer && (
              <div>
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h2 style={{ marginBottom: 4 }}>{activeVer.name}</h2>
                      {activeVer.description && <p style={{ color: '#888', fontSize: '0.88rem', marginBottom: 4 }}>{activeVer.description}</p>}
                      <p style={{ fontSize: '0.78rem', color: '#aaa', marginBottom: 0 }}>
                        Saved {formatTime(activeVer.created_at)} · {activeVer.size_kb} KB
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-sage" onClick={() => downloadVersion(activeVer)} style={{ fontSize: '0.85rem' }}>
                        ⬇️ Download
                      </button>
                      <button className="btn" style={{ background: '#fff5f5', color: '#f44336', fontSize: '0.85rem' }}
                        onClick={() => deleteVersion(activeVer.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="card">
                    <h2>Dataset Info</h2>
                    {[
                      { label: 'Rows',    value: activeVer.rows },
                      { label: 'Columns', value: activeVer.cols },
                      { label: 'Size',    value: activeVer.size_kb + ' KB' },
                      { label: 'Saved',   value: formatTime(activeVer.created_at) },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.85rem' }}>
                        <span style={{ color: '#888' }}>{item.label}</span>
                        <span style={{ fontWeight: 600 }}>{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="card">
                    <h2>Changes in This Version</h2>
                    {activeVer.changes.length === 0 ? (
                      <p style={{ color: '#888', fontSize: '0.85rem' }}>No changes recorded.</p>
                    ) : (
                      activeVer.changes.map((change, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.5rem', padding: '0.4rem 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.85rem' }}>
                          <span style={{ color: '#5A8A6A', fontWeight: 700 }}>✓</span>
                          <span>{change}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {versions.indexOf(activeVer) > 0 && (
                  <div className="card">
                    <h2>Changes from Previous Version</h2>
                    {computeDiff(versions[versions.indexOf(activeVer) - 1], activeVer).map((diff, i) => (
                      <div key={i} style={{ padding: '0.5rem 0.75rem', background: '#f0f8ff', borderRadius: 6, marginBottom: '0.4rem', fontSize: '0.85rem', color: '#2196f3', fontWeight: 600 }}>
                        📊 {diff}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPARE MODE */}
      {compareMode && versions.length >= 2 && (
        <div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
            <select value={compareA || ''} onChange={e => setCompareA(e.target.value)}
              style={{ flex: 1, padding: '0.75rem', borderRadius: 8, border: '2px solid #C0533A', fontSize: '0.88rem' }}>
              <option value="">Select Version A...</option>
              {versions.map((v, i) => <option key={v.id} value={v.id}>v{i+1} — {v.name}</option>)}
            </select>
            <span style={{ fontWeight: 700, color: '#888', fontSize: '1.2rem' }}>vs</span>
            <select value={compareB || ''} onChange={e => setCompareB(e.target.value)}
              style={{ flex: 1, padding: '0.75rem', borderRadius: 8, border: '2px solid #1C2B3A', fontSize: '0.88rem' }}>
              <option value="">Select Version B...</option>
              {versions.map((v, i) => <option key={v.id} value={v.id}>v{i+1} — {v.name}</option>)}
            </select>
          </div>

          {compareVerA && compareVerB && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { ver: compareVerA, color: '#C0533A', label: 'Version A' },
                { ver: compareVerB, color: '#1C2B3A', label: 'Version B' },
              ].map(({ ver, color, label }) => (
                <div key={ver.id} className="card" style={{ borderTop: `4px solid ${color}` }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</p>
                  <h2 style={{ color, marginBottom: '1rem' }}>{ver.name}</h2>
                  {[
                    { label: 'Rows',    value: ver.rows,   highlight: compareVerA.rows !== compareVerB.rows },
                    { label: 'Columns', value: ver.cols,   highlight: compareVerA.cols !== compareVerB.cols },
                    { label: 'Size',    value: ver.size_kb + ' KB', highlight: false },
                    { label: 'Saved',   value: formatTime(ver.created_at), highlight: false },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: 6, marginBottom: 4, background: item.highlight ? color + '11' : '#f8f7f4', fontSize: '0.85rem' }}>
                      <span style={{ color: '#888' }}>{item.label}</span>
                      <span style={{ fontWeight: 700, color: item.highlight ? color : '#333' }}>{item.value}</span>
                    </div>
                  ))}
                  {ver.changes.length > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', marginBottom: '0.4rem' }}>CHANGES:</p>
                      {ver.changes.map((c, i) => (
                        <div key={i} style={{ fontSize: '0.78rem', color: '#555', padding: '0.25rem 0' }}>✓ {c}</div>
                      ))}
                    </div>
                  )}
                  <button className="btn btn-sage" onClick={() => downloadVersion(ver)} style={{ marginTop: '1rem', width: '100%', fontSize: '0.82rem' }}>
                    ⬇️ Download {ver.name}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
