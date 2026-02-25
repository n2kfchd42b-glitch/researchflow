import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'researchflow_dictionary';

const VAR_TYPES    = ['Continuous','Categorical','Binary','Ordinal','Date','Text','ID'];
const UNITS        = ['Years','Months','Days','kg','cm','mmHg','mmol/L','mg/dL','%','Score','Count','Other','None'];
const SENSITIVITY  = ['Public','Internal','Sensitive','PII','Highly Sensitive'];
const SENSITIVITY_COLORS: Record<string,string> = {
  'Public':          '#5A8A6A',
  'Internal':        '#2196f3',
  'Sensitive':       '#ff9800',
  'PII':             '#f44336',
  'Highly Sensitive':'#9c27b0',
};

const DHS_MAPPINGS: Record<string,{label:string,definition:string,unit:string}> = {
  v012: { label: 'Respondent age',           definition: 'Age of respondent in completed years at time of interview', unit: 'Years' },
  v025: { label: 'Type of residence',        definition: 'Urban (1) or Rural (2) residence', unit: 'None' },
  v106: { label: 'Highest education level',  definition: 'Highest level of education attained (0=None,1=Primary,2=Secondary,3=Higher)', unit: 'None' },
  v190: { label: 'Wealth index',             definition: 'Household wealth index quintile (1=Poorest to 5=Richest)', unit: 'None' },
  v201: { label: 'Total children ever born', definition: 'Total number of children ever born to respondent', unit: 'Count' },
  v313: { label: 'Current contraceptive use',definition: 'Current use of any contraceptive method (0=No,1=Yes)', unit: 'None' },
  b5:   { label: 'Child alive',              definition: 'Whether child is still alive at time of interview (0=No,1=Yes)', unit: 'None' },
  hw70: { label: 'Height-for-age z-score',   definition: 'Height-for-age z-score (WHO standards) x100', unit: 'Score' },
  hw71: { label: 'Weight-for-height z-score',definition: 'Weight-for-height z-score (WHO standards) x100', unit: 'Score' },
};

type DictEntry = {
  id:           string;
  name:         string;
  label:        string;
  definition:   string;
  type:         string;
  unit:         string;
  values:       string;
  min_val:      string;
  max_val:      string;
  missing_code: string;
  sensitivity:  string;
  source:       string;
  notes:        string;
  dhs_mapped:   boolean;
  n:            number;
  missing_pct:  number;
  example:      string;
};

function parseCSV(text: string) {
  const lines   = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g,''));
  const rows    = lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj: Record<string,string> = {};
    headers.forEach((h,i) => { obj[h] = (vals[i]||'').trim().replace(/"/g,''); });
    return obj;
  });
  return { headers, rows };
}

function inferType(values: string[]): string {
  const nonEmpty = values.filter(v => v !== '' && v !== 'NA');
  const numeric  = nonEmpty.filter(v => !isNaN(parseFloat(v)));
  if (numeric.length / nonEmpty.length > 0.85) {
    return new Set(numeric).size <= 2 ? 'Binary' : 'Continuous';
  }
  return new Set(nonEmpty).size <= 10 ? 'Categorical' : 'Text';
}

function buildDictionary(headers: string[], rows: Record<string,string>[]): DictEntry[] {
  return headers.map(col => {
    const allVals   = rows.map(r => r[col] || '');
    const nonEmpty  = allVals.filter(v => v !== '' && v !== 'NA' && v !== 'NULL');
    const missing   = allVals.length - nonEmpty.length;
    const type      = inferType(nonEmpty);
    const numVals   = nonEmpty.map(v => parseFloat(v)).filter(v => !isNaN(v));
    const uniqueVals = Array.from(new Set(nonEmpty)).slice(0, 10);
    const dhs       = DHS_MAPPINGS[col.toLowerCase()];
    return {
      id:           col,
      name:         col,
      label:        dhs?.label || '',
      definition:   dhs?.definition || '',
      type,
      unit:         dhs?.unit || (type === 'Continuous' ? 'None' : 'None'),
      values:       (type === 'Categorical' || type === 'Binary') ? uniqueVals.join(', ') : '',
      min_val:      numVals.length > 0 ? Math.min(...numVals).toString() : '',
      max_val:      numVals.length > 0 ? Math.max(...numVals).toString() : '',
      missing_code: '.',
      sensitivity:  col.toLowerCase().includes('id') || col.toLowerCase().includes('name') ? 'PII' : 'Internal',
      source:       '',
      notes:        '',
      dhs_mapped:   !!dhs,
      n:            nonEmpty.length,
      missing_pct:  Math.round(missing / allVals.length * 100),
      example:      nonEmpty[0] || '',
    };
  });
}

export default function DataDictionary() {
  const [entries, setEntries]         = useState<DictEntry[]>([]);
  const [filename, setFilename]       = useState('');
  const [nRows, setNRows]             = useState(0);
  const [activeEntry, setActiveEntry] = useState<string|null>(null);
  const [search, setSearch]           = useState('');
  const [filterType, setFilterType]   = useState('All');
  const [filterSens, setFilterSens]   = useState('All');
  const [activeTab, setActiveTab]     = useState('dictionary');
  const [copied, setCopied]           = useState(false);
  const [saved, setSaved]             = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { entries: e, filename: f, nRows: n } = JSON.parse(stored);
        setEntries(e); setFilename(f); setNRows(n);
      }
    } catch {}
  }, []);

  function saveLocal(e: DictEntry[], f: string, n: number) {
    setEntries(e); setFilename(f); setNRows(n);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries: e, filename: f, nRows: n })); } catch {}
    setSaved(true); setTimeout(() => setSaved(false), 1500);
  }

  function handleUpload(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]; if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      const dict = buildDictionary(headers, rows);
      saveLocal(dict, file.name, rows.length);
      setActiveEntry(dict[0]?.id || null);
    };
    reader.readAsText(file);
  }

  function updateEntry(id: string, field: keyof DictEntry, value: string | boolean) {
    const updated = entries.map(e => e.id === id ? { ...e, [field]: value } : e);
    saveLocal(updated, filename, nRows);
    if (activeEntry === id) setActiveEntry(id);
  }

  function exportCSV() {
    const headers = ['Variable Name','Label','Definition','Type','Unit','Values / Codes','Min','Max','Missing Code','Sensitivity','Source','N','Missing%','Notes'];
    const rows = entries.map(e => [
      e.name, e.label, e.definition, e.type, e.unit, e.values,
      e.min_val, e.max_val, e.missing_code, e.sensitivity,
      e.source, e.n, e.missing_pct + '%', e.notes
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `data_dictionary_${filename.replace('.csv','')}.csv`; a.click();
  }

  function exportMarkdown() {
    const header = `| Variable | Label | Type | Definition | Values | Unit | Sensitivity |\n|---|---|---|---|---|---|---|`;
    const rows   = entries.map(e =>
      `| ${e.name} | ${e.label||'-'} | ${e.type} | ${e.definition||'-'} | ${e.values||'-'} | ${e.unit} | ${e.sensitivity} |`
    ).join('\n');
    navigator.clipboard.writeText(`# Data Dictionary — ${filename}\n\n${header}\n${rows}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const filtered = entries.filter(e => {
    const matchSearch = !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.label.toLowerCase().includes(search.toLowerCase()) ||
      e.definition.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'All' || e.type === filterType;
    const matchSens = filterSens === 'All' || e.sensitivity === filterSens;
    return matchSearch && matchType && matchSens;
  });

  const activeData = entries.find(e => e.id === activeEntry);
  const dhsCount   = entries.filter(e => e.dhs_mapped).length;
  const piiCount   = entries.filter(e => e.sensitivity === 'PII' || e.sensitivity === 'Highly Sensitive').length;
  const labelled   = entries.filter(e => e.label && e.definition).length;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ color: '#1C2B3A', marginBottom: 0 }}>Data Dictionary Builder</h1>
          <p style={{ marginBottom: 0, fontSize: '0.88rem', color: '#888' }}>
            Build a publication-ready data dictionary with variable definitions, coding and sensitivity labels
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {saved && <span style={{ color: '#5A8A6A', fontSize: '0.82rem' }}>✓ Saved</span>}
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            {entries.length ? 'Upload New' : '📂 Upload CSV'}
            <input type="file" accept=".csv" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {!entries.length && (
        <div className="card" style={{ maxWidth: 540, margin: '0 auto', textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📖</div>
          <h2>Upload Your Dataset</h2>
          <p style={{ color: '#888', marginBottom: '1.5rem' }}>
            Variable types, ranges and WHO/DHS mappings are auto-detected. Add labels and definitions to complete your dictionary.
          </p>
          <label className="btn btn-primary" style={{ cursor: 'pointer', fontSize: '1rem' }}>
            📂 Upload CSV
            <input type="file" accept=".csv" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
        </div>
      )}

      {entries.length > 0 && (
        <div>
          {/* STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Variables',     value: entries.length,                                       color: '#1C2B3A' },
              { label: 'Labelled',      value: `${labelled}/${entries.length}`,                      color: '#5A8A6A' },
              { label: 'DHS Mapped',    value: dhsCount,                                             color: '#2196f3' },
              { label: 'PII Variables', value: piiCount,                                             color: '#f44336' },
            ].map(item => (
              <div key={item.label} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                <p style={{ fontSize: '1.8rem', fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.value}</p>
                <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 0 }}>{item.label}</p>
              </div>
            ))}
          </div>

          {/* TABS */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {[
              { id: 'dictionary', label: '📖 Dictionary'   },
              { id: 'pii',        label: '🔒 Sensitive Vars' },
              { id: 'export',     label: '⬇️ Export'        },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="btn" style={{
                background: activeTab === tab.id ? '#1C2B3A' : '#eee',
                color:      activeTab === tab.id ? 'white'   : '#444',
                padding: '0.5rem 1rem',
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* DICTIONARY TAB */}
          {activeTab === 'dictionary' && (
            <div>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search variables..."
                  style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid #ccc', fontSize: '0.88rem', minWidth: 180 }} />
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                  style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid #ccc', fontSize: '0.85rem' }}>
                  <option value="All">All Types</option>
                  {VAR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={filterSens} onChange={e => setFilterSens(e.target.value)}
                  style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid #ccc', fontSize: '0.85rem' }}>
                  <option value="All">All Sensitivity</option>
                  {SENSITIVITY.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button className="btn" style={{ background: '#eee', color: '#444', fontSize: '0.82rem' }} onClick={exportCSV}>
                  ⬇️ CSV
                </button>
                <button className="btn btn-sage" style={{ fontSize: '0.82rem' }} onClick={exportMarkdown}>
                  {copied ? '✓ Copied!' : '📋 Markdown'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: activeEntry ? '1fr 360px' : '1fr', gap: '1.5rem' }}>
                <div className="card">
                  <h2>{filename} — {filtered.length} variables</h2>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ background: '#1C2B3A', color: 'white' }}>
                          {['#','Variable','Label','Type','N','Missing%','Sensitivity',''].map(h => (
                            <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((e, i) => (
                          <tr key={e.id} onClick={() => setActiveEntry(activeEntry === e.id ? null : e.id)}
                            style={{ background: activeEntry === e.id ? '#fff5f3' : i%2===0 ? '#f8f7f4' : 'white', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '8px 10px', color: '#aaa', fontSize: '0.72rem' }}>{i+1}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: '#1C2B3A' }}>
                              {e.name}
                              {e.dhs_mapped && <span style={{ marginLeft: 4, fontSize: '0.65rem', color: '#2196f3', fontWeight: 700 }}>DHS</span>}
                            </td>
                            <td style={{ padding: '8px 10px', color: e.label ? '#555' : '#ddd', fontStyle: e.label ? 'normal' : 'italic', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {e.label || 'Add label...'}
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <span style={{ padding: '0.15rem 0.45rem', borderRadius: 6, fontSize: '0.7rem', background: '#f0f0f0', color: '#555' }}>
                                {e.type}
                              </span>
                            </td>
                            <td style={{ padding: '8px 10px' }}>{e.n}</td>
                            <td style={{ padding: '8px 10px' }}>
                              <span style={{ color: e.missing_pct > 10 ? '#f44336' : e.missing_pct > 0 ? '#ff9800' : '#5A8A6A', fontWeight: 600 }}>
                                {e.missing_pct}%
                              </span>
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <span style={{ padding: '0.15rem 0.45rem', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700,
                                background: (SENSITIVITY_COLORS[e.sensitivity]||'#888') + '22',
                                color: SENSITIVITY_COLORS[e.sensitivity] || '#888' }}>
                                {e.sensitivity}
                              </span>
                            </td>
                            <td style={{ padding: '8px 10px', color: '#C0533A', fontSize: '0.78rem' }}>
                              {activeEntry === e.id ? '▼' : '▶'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {activeEntry && activeData && (
                  <div>
                    <div className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ marginBottom: 0, color: '#1C2B3A' }}>{activeData.name}</h2>
                        <button onClick={() => setActiveEntry(null)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                      </div>

                      {activeData.dhs_mapped && (
                        <div style={{ padding: '0.5rem 0.75rem', background: '#dbeafe', borderRadius: 6, marginBottom: '1rem', fontSize: '0.78rem', color: '#1d4ed8', fontWeight: 600 }}>
                          🌐 DHS Standard Variable — definition auto-populated
                        </div>
                      )}

                      {[
                        { label: 'VARIABLE LABEL', field: 'label',      placeholder: 'Short descriptive name',                type: 'text' },
                        { label: 'DEFINITION',      field: 'definition', placeholder: 'Full definition of the variable',       type: 'textarea' },
                        { label: 'SOURCE / INSTRUMENT', field: 'source', placeholder: 'e.g. DHS Module 4, Clinical records',  type: 'text' },
                        { label: 'VALUES / CODING',  field: 'values',    placeholder: '0=No, 1=Yes or 1=Male, 2=Female',      type: 'text' },
                        { label: 'MISSING CODE',     field: 'missing_code', placeholder: '. or 99 or NA',                    type: 'text' },
                        { label: 'NOTES',            field: 'notes',     placeholder: 'Measurement method, known issues...',  type: 'textarea' },
                      ].map(f => (
                        <div key={f.field} style={{ marginBottom: '0.75rem' }}>
                          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 3 }}>{f.label}</label>
                          {f.type === 'textarea' ? (
                            <textarea value={(activeData as any)[f.field]}
                              onChange={e => updateEntry(activeData.id, f.field as keyof DictEntry, e.target.value)}
                              placeholder={f.placeholder}
                              style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.82rem', minHeight: 60 }} />
                          ) : (
                            <input value={(activeData as any)[f.field]}
                              onChange={e => updateEntry(activeData.id, f.field as keyof DictEntry, e.target.value)}
                              placeholder={f.placeholder}
                              style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.82rem' }} />
                          )}
                        </div>
                      ))}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 3 }}>TYPE</label>
                          <select value={activeData.type} onChange={e => updateEntry(activeData.id, 'type', e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.82rem' }}>
                            {VAR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 3 }}>UNIT</label>
                          <select value={activeData.unit} onChange={e => updateEntry(activeData.id, 'unit', e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.82rem' }}>
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 3 }}>MIN VALUE</label>
                          <input value={activeData.min_val} onChange={e => updateEntry(activeData.id, 'min_val', e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.82rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 3 }}>MAX VALUE</label>
                          <input value={activeData.max_val} onChange={e => updateEntry(activeData.id, 'max_val', e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.82rem' }} />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 6 }}>SENSITIVITY</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {SENSITIVITY.map(s => (
                            <button key={s} onClick={() => updateEntry(activeData.id, 'sensitivity', s)} style={{
                              padding: '0.25rem 0.6rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
                              background: activeData.sensitivity === s ? SENSITIVITY_COLORS[s] : '#eee',
                              color: activeData.sensitivity === s ? 'white' : '#555',
                            }}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', background: '#f8f7f4', borderRadius: 6, fontSize: '0.78rem' }}>
                        <span style={{ color: '#888' }}>Example value: </span>
                        <span style={{ fontWeight: 600 }}>{activeData.example || '—'}</span>
                        <span style={{ color: '#aaa', marginLeft: 12 }}>n = {activeData.n} · {activeData.missing_pct}% missing</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PII TAB */}
          {activeTab === 'pii' && (
            <div className="card">
              <h2>🔒 Sensitive & PII Variables</h2>
              <p style={{ fontSize: '0.88rem', color: '#888', marginBottom: '1.25rem' }}>
                Review variables flagged as sensitive or personally identifiable information (PII) before sharing data.
              </p>
              {entries.filter(e => e.sensitivity === 'PII' || e.sensitivity === 'Highly Sensitive' || e.sensitivity === 'Sensitive').length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                  <p>No sensitive variables flagged. Review your dictionary and update sensitivity labels as needed.</p>
                </div>
              ) : (
                entries.filter(e => e.sensitivity !== 'Public' && e.sensitivity !== 'Internal').map(e => (
                  <div key={e.id} style={{ padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '0.5rem',
                    background: (SENSITIVITY_COLORS[e.sensitivity]||'#888') + '11',
                    border: '1px solid ' + (SENSITIVITY_COLORS[e.sensitivity]||'#888') + '44' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{e.name}</span>
                        {e.label && <span style={{ fontSize: '0.82rem', color: '#888', marginLeft: 8 }}>{e.label}</span>}
                      </div>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700,
                        background: SENSITIVITY_COLORS[e.sensitivity], color: 'white' }}>
                        {e.sensitivity}
                      </span>
                    </div>
                    {e.definition && <p style={{ fontSize: '0.78rem', color: '#666', marginBottom: 0, marginTop: 4 }}>{e.definition}</p>}
                  </div>
                ))
              )}

              <div className="alert alert-critical" style={{ marginTop: '1.5rem', fontSize: '0.82rem' }}>
                <strong>Data Sharing Reminder:</strong> Remove or anonymise PII variables before sharing datasets with collaborators or journals. Consider using pseudonymised IDs.
              </div>
            </div>
          )}

          {/* EXPORT TAB */}
          {activeTab === 'export' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { title: 'CSV Export', desc: 'Full data dictionary as spreadsheet. Import into Excel or share with co-investigators.', btn: '⬇️ Download CSV', action: exportCSV, color: '#5A8A6A' },
                  { title: 'Markdown Table', desc: 'Copy as Markdown table for README files, GitHub repositories or protocol documents.', btn: copied ? '✓ Copied!' : '📋 Copy Markdown', action: exportMarkdown, color: '#2196f3' },
                ].map(item => (
                  <div key={item.title} className="card" style={{ borderTop: `4px solid ${item.color}` }}>
                    <h2 style={{ color: item.color }}>{item.title}</h2>
                    <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>{item.desc}</p>
                    <button className="btn btn-primary" onClick={item.action} style={{ background: item.color }}>
                      {item.btn}
                    </button>
                  </div>
                ))}
              </div>

              <div className="card" style={{ marginTop: '1rem', borderLeft: '4px solid #ff9800' }}>
                <h2>📋 Data Sharing Checklist</h2>
                {[
                  'All variables have labels and definitions',
                  'Missing codes are documented',
                  'PII variables identified and handled',
                  'Value codes explained for categorical variables',
                  'Units specified for continuous variables',
                  'Data source documented for each variable',
                  'Allowed range specified for validation',
                ].map((item, i) => {
                  const done = (() => {
                    if (i === 0) return labelled === entries.length;
                    if (i === 2) return piiCount > 0;
                    return false;
                  })();
                  return (
                    <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.85rem', alignItems: 'center' }}>
                      <span style={{ color: done ? '#5A8A6A' : '#ccc', fontSize: '1rem' }}>{done ? '✅' : '⬜'}</span>
                      <span style={{ color: done ? '#333' : '#888' }}>{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
