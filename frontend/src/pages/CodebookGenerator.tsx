import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { api } from '../services/api';

type VariableInfo = {
  name:         string;
  type:         'numeric' | 'categorical' | 'binary' | 'date' | 'text';
  label:        string;
  n:            number;
  missing:      number;
  missing_pct:  number;
  unique:       number;
  min:          string;
  max:          string;
  mean:         string;
  values:       string[];
  notes:        string;
};

function inferType(values: string[]): VariableInfo['type'] {
  const nonEmpty = values.filter(v => v !== '' && v !== 'NA' && v !== 'null');
  const numeric  = nonEmpty.filter(v => !isNaN(parseFloat(v)));
  if (numeric.length / nonEmpty.length > 0.85) {
    const unique = new Set(numeric).size;
    if (unique <= 2) return 'binary';
    return 'numeric';
  }
  const unique = new Set(nonEmpty).size;
  if (unique <= 10) return 'categorical';
  return 'text';
}

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

function buildCodebook(headers: string[], rows: Record<string, string>[]): VariableInfo[] {
  return headers.map(col => {
    const allVals   = rows.map(r => r[col] || '');
    const nonEmpty  = allVals.filter(v => v !== '' && v !== 'NA' && v !== 'null' && v !== 'NULL');
    const missing   = allVals.length - nonEmpty.length;
    const type      = inferType(nonEmpty);
    const unique    = new Set(nonEmpty).size;
    const numVals   = nonEmpty.map(v => parseFloat(v)).filter(v => !isNaN(v));
    const mean      = numVals.length > 0 ? (numVals.reduce((a,b) => a+b, 0) / numVals.length).toFixed(2) : '';
    const min       = numVals.length > 0 ? Math.min(...numVals).toString() : (nonEmpty.sort()[0] || '');
    const max       = numVals.length > 0 ? Math.max(...numVals).toString() : (nonEmpty.sort().slice(-1)[0] || '');
    const vc        = new Set(nonEmpty).size <= 15
      ? Array.from(new Set(nonEmpty)).slice(0, 15)
      : [];

    return {
      name:        col,
      type,
      label:       '',
      n:           nonEmpty.length,
      missing,
      missing_pct: Math.round(missing / allVals.length * 100),
      unique,
      min,
      max,
      mean,
      values:      vc,
      notes:       '',
    };
  });
}

const TYPE_COLORS: Record<string, string> = {
  numeric:     '#2196f3',
  categorical: '#9c27b0',
  binary:      '#C0533A',
  date:        '#00897b',
  text:        '#607d8b',
};

const TYPE_ICONS: Record<string, string> = {
  numeric:     '🔢',
  categorical: '🏷️',
  binary:      '⚡',
  date:        '📅',
  text:        '📝',
};

export default function CodebookGenerator() {
  const { activeDataset } = useWorkflow();
  const [codebook, setCodebook]   = useState<VariableInfo[]>([]);
  const [filename, setFilename]   = useState('');
  const [nRows, setNRows]         = useState(0);
  const [loading, setLoading]     = useState(false);
  const [loadingActive, setLoadingActive] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch]       = useState('');
  const [filterType, setFilterType] = useState('All');
  const [activeVar, setActiveVar] = useState<string | null>(null);
  const [copied, setCopied]       = useState(false);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers, rows } = parseCSV(text);
      setNRows(rows.length);
      setCodebook(buildCodebook(headers, rows));
      setLoading(false);
    };
    reader.readAsText(file);
  }

  async function handleLoadActiveDataset() {
    if (!activeDataset?.datasetId) return;
    setLoadingActive(true);
    setLoadError('');
    try {
      const data = await api.getDatasetPreview(activeDataset.datasetId);
      const headers = (data.headers || []).map((h: unknown) => String(h));
      const rows = (data.rows || []).map((row: Record<string, unknown>) => {
        const normalized: Record<string, string> = {};
        Object.entries(row).forEach(([key, value]) => {
          normalized[key] = value == null ? '' : String(value);
        });
        return normalized;
      });
      setFilename(data.filename || activeDataset.datasetName || `${activeDataset.datasetId}.csv`);
      setNRows(rows.length);
      setCodebook(buildCodebook(headers, rows));
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to load active dataset');
    }
    setLoadingActive(false);
  }

  function updateLabel(name: string, label: string) {
    setCodebook(prev => prev.map(v => v.name === name ? { ...v, label } : v));
  }

  function updateNotes(name: string, notes: string) {
    setCodebook(prev => prev.map(v => v.name === name ? { ...v, notes } : v));
  }

  function updateType(name: string, type: VariableInfo['type']) {
    setCodebook(prev => prev.map(v => v.name === name ? { ...v, type } : v));
  }

  function exportCSV() {
    const headers = ['Variable','Label','Type','N','Missing','Missing%','Unique Values','Min','Max','Mean','Value Labels','Notes'];
    const rows = codebook.map(v => [
      v.name, v.label, v.type, v.n, v.missing, v.missing_pct + '%',
      v.unique, v.min, v.max, v.mean,
      v.values.join(' | '), v.notes
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `codebook_${filename.replace('.csv','')}.csv`; a.click();
  }

  function exportText() {
    const lines = [
      `VARIABLE CODEBOOK`,
      `Dataset: ${filename}`,
      `Rows: ${nRows} | Variables: ${codebook.length}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      `${'='.repeat(60)}`,
      '',
      ...codebook.map((v, i) => [
        `${i+1}. ${v.name}`,
        `   Label:    ${v.label || '(no label)'}`,
        `   Type:     ${v.type}`,
        `   N:        ${v.n} (${v.missing} missing, ${v.missing_pct}%)`,
        `   Range:    ${v.min} — ${v.max}`,
        v.mean ? `   Mean:     ${v.mean}` : '',
        v.values.length > 0 ? `   Values:   ${v.values.join(', ')}` : '',
        v.notes ? `   Notes:    ${v.notes}` : '',
        '',
      ].filter(Boolean).join('\n'))
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `codebook_${filename.replace('.csv','')}.txt`; a.click();
  }

  function copyMarkdown() {
    const header = `| Variable | Label | Type | N | Missing% | Range |\n|---|---|---|---|---|---|`;
    const rows   = codebook.map(v =>
      `| ${v.name} | ${v.label || '-'} | ${v.type} | ${v.n} | ${v.missing_pct}% | ${v.min}–${v.max} |`
    ).join('\n');
    navigator.clipboard.writeText(`${header}\n${rows}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const filtered = codebook.filter(v => {
    const matchSearch = !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.label.toLowerCase().includes(search.toLowerCase());
    const matchType   = filterType === 'All' || v.type === filterType;
    return matchSearch && matchType;
  });

  const activeVarData = codebook.find(v => v.name === activeVar);

  return (
    <div className="page">
      <h1 style={{ color: '#1C2B3A' }}>Variable Codebook Generator</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        Auto-generate a publication-ready variable codebook from your dataset. Add labels, notes and export.
      </p>

      {loadError && <div className="alert alert-critical">{loadError}</div>}

      {!codebook.length && (
        <div className="card" style={{ maxWidth: 500 }}>
          <h2>Upload Dataset</h2>
          {activeDataset?.datasetId && (
            <button
              className="btn"
              style={{ width: '100%', marginBottom: '0.75rem', background: '#E8F0FE', color: '#1C2B3A' }}
              onClick={handleLoadActiveDataset}
              disabled={loadingActive || loading}
            >
              {loadingActive ? 'Loading active dataset...' : `Use active dataset${activeDataset.datasetName ? `: ${activeDataset.datasetName}` : ''}`}
            </button>
          )}
          <label className="upload-zone" style={{ display: 'block', cursor: 'pointer' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📂</div>
            <p style={{ fontWeight: 600, color: '#1C2B3A' }}>Upload CSV file</p>
            <p style={{ fontSize: '0.85rem' }}>Variable types, ranges and value labels auto-detected</p>
            <input type="file" accept=".csv" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
          {loading && <p style={{ textAlign: 'center', color: '#888', marginTop: '1rem' }}>Generating codebook...</p>}
        </div>
      )}

      {codebook.length > 0 && (
        <div>
          {/* STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Variables',    value: codebook.length,                                        color: '#1C2B3A' },
              { label: 'Numeric',      value: codebook.filter(v => v.type === 'numeric').length,      color: '#2196f3' },
              { label: 'Categorical',  value: codebook.filter(v => v.type === 'categorical').length,  color: '#9c27b0' },
              { label: 'Total Rows',   value: nRows,                                                   color: '#C0533A' },
            ].map(item => (
              <div key={item.label} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                <p style={{ fontSize: '1.8rem', fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.value}</p>
                <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 0 }}>{item.label}</p>
              </div>
            ))}
          </div>

          {/* TOOLBAR */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search variables..."
              style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid #ccc', fontSize: '0.88rem', minWidth: 180 }} />
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid #ccc', fontSize: '0.88rem' }}>
              <option value="All">All Types</option>
              {['numeric','categorical','binary','text'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button className="btn" style={{ background: '#eee', color: '#444', fontSize: '0.82rem' }} onClick={exportCSV}>
              ⬇️ CSV
            </button>
            <button className="btn" style={{ background: '#eee', color: '#444', fontSize: '0.82rem' }} onClick={exportText}>
              ⬇️ TXT
            </button>
            <button className="btn btn-sage" style={{ fontSize: '0.82rem' }} onClick={copyMarkdown}>
              {copied ? '✓ Copied!' : '📋 Copy Table'}
            </button>
            <label className="btn" style={{ background: '#1C2B3A', color: 'white', fontSize: '0.82rem', cursor: 'pointer' }}>
              Upload New
              <input type="file" accept=".csv" onChange={handleUpload} style={{ display: 'none' }} />
            </label>
            {activeDataset?.datasetId && (
              <button
                className="btn"
                style={{ background: '#E8F0FE', color: '#1C2B3A', fontSize: '0.82rem' }}
                onClick={handleLoadActiveDataset}
                disabled={loadingActive || loading}
              >
                {loadingActive ? 'Loading active dataset...' : 'Use active dataset'}
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: activeVar ? '1fr 340px' : '1fr', gap: '1.5rem' }}>

            {/* TABLE */}
            <div className="card">
              <h2>Codebook — {filename} ({filtered.length} variables)</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#1C2B3A', color: 'white' }}>
                      {['#', 'Variable', 'Label', 'Type', 'N', 'Missing%', 'Range / Values', ''].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((v, i) => (
                      <tr key={v.name} style={{ background: activeVar === v.name ? '#fff5f3' : i % 2 === 0 ? '#f8f7f4' : 'white', cursor: 'pointer' }}
                        onClick={() => setActiveVar(activeVar === v.name ? null : v.name)}>
                        <td style={{ padding: '8px 10px', color: '#aaa', fontSize: '0.75rem' }}>{i+1}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: '#1C2B3A' }}>{v.name}</td>
                        <td style={{ padding: '8px 10px', color: v.label ? '#555' : '#ccc', fontStyle: v.label ? 'normal' : 'italic' }}>
                          {v.label || 'Add label...'}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ padding: '0.2rem 0.5rem', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700, background: (TYPE_COLORS[v.type] || '#888') + '22', color: TYPE_COLORS[v.type] || '#888' }}>
                            {TYPE_ICONS[v.type]} {v.type}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px' }}>{v.n}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ color: v.missing_pct > 10 ? '#f44336' : v.missing_pct > 0 ? '#ff9800' : '#4caf50', fontWeight: 600 }}>
                            {v.missing_pct}%
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {v.type === 'categorical' || v.type === 'binary'
                            ? v.values.slice(0, 4).join(', ') + (v.values.length > 4 ? '...' : '')
                            : v.mean ? `${v.min} – ${v.max} (mean: ${v.mean})`
                            : `${v.min} – ${v.max}`}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ color: '#C0533A', fontSize: '0.78rem' }}>
                            {activeVar === v.name ? '▼' : '▶'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DETAIL PANEL */}
            {activeVar && activeVarData && (
              <div>
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ marginBottom: 0, color: TYPE_COLORS[activeVarData.type] }}>
                      {TYPE_ICONS[activeVarData.type]} {activeVarData.name}
                    </h2>
                    <button onClick={() => setActiveVar(null)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>VARIABLE LABEL</label>
                    <input value={activeVarData.label}
                      onChange={e => updateLabel(activeVarData.name, e.target.value)}
                      placeholder="e.g. Age of participant in years"
                      style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.85rem' }} />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>VARIABLE TYPE</label>
                    <select value={activeVarData.type} onChange={e => updateType(activeVarData.name, e.target.value as VariableInfo['type'])}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.85rem' }}>
                      {['numeric','categorical','binary','date','text'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ background: '#f8f7f4', borderRadius: 8, padding: '0.875rem', marginBottom: '1rem' }}>
                    {[
                      { label: 'Valid N',    value: activeVarData.n },
                      { label: 'Missing',    value: `${activeVarData.missing} (${activeVarData.missing_pct}%)` },
                      { label: 'Unique',     value: activeVarData.unique },
                      { label: 'Min',        value: activeVarData.min },
                      { label: 'Max',        value: activeVarData.max },
                      ...(activeVarData.mean ? [{ label: 'Mean', value: activeVarData.mean }] : []),
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid #eee', fontSize: '0.85rem' }}>
                        <span style={{ color: '#888' }}>{item.label}</span>
                        <span style={{ fontWeight: 600 }}>{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {activeVarData.values.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 6 }}>VALUES</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {activeVarData.values.map(v => (
                          <span key={v} style={{ padding: '0.25rem 0.6rem', background: '#f0f0f0', borderRadius: 10, fontSize: '0.78rem', color: '#555' }}>
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>NOTES</label>
                    <textarea value={activeVarData.notes}
                      onChange={e => updateNotes(activeVarData.name, e.target.value)}
                      placeholder="Measurement method, coding notes, limitations..."
                      style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.82rem', minHeight: 80 }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
