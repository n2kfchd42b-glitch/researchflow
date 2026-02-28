import React, { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'researchflow_literature';

const STUDY_DESIGNS   = ['RCT', 'Cohort', 'Case-Control', 'Cross-sectional', 'Systematic Review', 'Meta-analysis', 'Case Report', 'Qualitative', 'Other'];
const EVIDENCE_LEVELS = ['1a', '1b', '2a', '2b', '3', '4', '5'];
const GRADE_LEVELS    = ['High', 'Moderate', 'Low', 'Very Low'];
const THEMES          = ['Background', 'Methods', 'Intervention', 'Outcome', 'Comparison', 'Population', 'Risk Factor', 'Epidemiology', 'Policy'];
const EFFECT_TYPES    = ['', 'OR', 'RR', 'HR', 'IRR', 'MD', 'SMD', 'RD', 'ARR', 'NNT', 'β', 'Other'];
const ROB_RATINGS     = ['', 'Low', 'Some concerns', 'High', 'Very High'];

const GRADE_COLORS: Record<string, string> = {
  High: '#5A8A6A', Moderate: '#2196f3', Low: '#ff9800', 'Very Low': '#f44336',
};
const LEVEL_COLORS: Record<string, string> = {
  '1a': '#5A8A6A', '1b': '#5A8A6A', '2a': '#2196f3', '2b': '#2196f3',
  '3': '#ff9800', '4': '#f44336', '5': '#9c27b0',
};
const ROB_COLORS: Record<string, string> = {
  Low: '#5A8A6A', 'Some concerns': '#ff9800', High: '#f44336', 'Very High': '#9c27b0',
};

// ── Types ─────────────────────────────────────────────────────────────────────

type Reference = {
  id:              string;
  title:           string;
  authors:         string;
  journal:         string;
  year:            number;
  volume:          string;
  issue:           string;
  pages:           string;
  doi:             string;
  pmid:            string;
  design:          string;
  grade:           string;
  level:           string;
  theme:           string;
  notes:           string;
  pico_p:          string;
  pico_i:          string;
  pico_c:          string;
  pico_o:          string;
  sample_size:     number;
  country:         string;
  key_finding:     string;
  added_at:        string;
  // Feature #41 — Evidence Extraction
  effect_type:     string;
  effect_value:    string;
  ci_lower:        string;
  ci_upper:        string;
  rob_rating:      string;
  adjustment_vars: string;
};

function emptyRef(): Reference {
  return {
    id: Date.now().toString(),
    title: '', authors: '', journal: '',
    year: new Date().getFullYear(),
    volume: '', issue: '', pages: '', doi: '', pmid: '',
    design: 'Cohort', grade: 'Moderate', level: '2b', theme: 'Background',
    notes: '', pico_p: '', pico_i: '', pico_c: '', pico_o: '',
    sample_size: 0, country: '', key_finding: '',
    added_at: new Date().toISOString(),
    // extraction defaults
    effect_type: '', effect_value: '', ci_lower: '', ci_upper: '',
    rob_rating: '', adjustment_vars: '',
  };
}

function vancouverCite(ref: Reference, index: number): string {
  const authors = ref.authors.split(',').slice(0, 6).join(', ');
  const et_al   = ref.authors.split(',').length > 6 ? ', et al' : '';
  return `${index}. ${authors}${et_al}. ${ref.title}. ${ref.journal}. ${ref.year};${ref.volume}${ref.issue ? `(${ref.issue})` : ''}:${ref.pages}.${ref.doi ? ` doi:${ref.doi}` : ''}`;
}

function apaCite(ref: Reference): string {
  return `${ref.authors} (${ref.year}). ${ref.title}. ${ref.journal}, ${ref.volume}${ref.issue ? `(${ref.issue})` : ''}, ${ref.pages}.${ref.doi ? ` https://doi.org/${ref.doi}` : ''}`;
}

// ── CrossRef / PubMed helpers ─────────────────────────────────────────────────

function cleanDoi(raw: string): string {
  return raw.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim();
}

interface CrossRefAuthor { given?: string; family?: string; }

async function fetchByDoi(doi: string): Promise<Partial<Reference>> {
  const clean = cleanDoi(doi);
  const res   = await fetch(`https://api.crossref.org/works/${encodeURIComponent(clean)}`);
  if (!res.ok) throw new Error(`CrossRef returned ${res.status}`);
  const w = (await res.json()).message;
  const authors = (w.author as CrossRefAuthor[] || [])
    .map((a: CrossRefAuthor) => [a.family, a.given].filter(Boolean).join(' '))
    .join(', ');
  const journal = (w['container-title']?.[0]) || (w['short-container-title']?.[0]) || '';
  const year    = w.issued?.['date-parts']?.[0]?.[0] ?? new Date().getFullYear();
  return { title: w.title?.[0] || '', authors, journal, year, volume: w.volume || '', issue: w.issue || '', pages: w.page || '', doi: clean };
}

async function fetchByPmid(pmid: string): Promise<Partial<Reference>> {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${encodeURIComponent(pmid.trim())}&retmode=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NCBI returned ${res.status}`);
  const doc = (await res.json()).result?.[pmid.trim()];
  if (!doc) throw new Error('PMID not found');
  const authors = (doc.authors as Array<{ name: string }> || []).map((a: { name: string }) => a.name).join(', ');
  const year    = doc.pubdate ? parseInt(doc.pubdate.split(' ')[0], 10) : new Date().getFullYear();
  const doi     = (doc.elocationid || '').replace('doi: ', '').trim();
  return { title: doc.title || '', authors, journal: doc.fulljournalname || doc.source || '', year, volume: doc.volume || '', issue: doc.issue || '', pages: doc.pages || '', doi, pmid: pmid.trim() };
}

// ── AutoImportPanel (Feature #39 + #40) ───────────────────────────────────────

function AutoImportPanel({ onFill }: { onFill: (data: Partial<Reference>) => void }) {
  const [mode,    setMode]    = useState<'doi' | 'pmid'>('doi');
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  async function handleFetch() {
    setError(''); setSuccess('');
    const val = input.trim();
    if (!val) { setError('Please enter a ' + mode.toUpperCase()); return; }
    setLoading(true);
    try {
      const data = mode === 'doi' ? await fetchByDoi(val) : await fetchByPmid(val);
      onFill(data);
      setSuccess('Fields auto-filled! Review and complete the form below.');
      setInput('');
    } catch (err: any) {
      setError(err.message || 'Lookup failed. Check your input and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: '#f0f7f4', border: '1px solid #b2d8c4', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '1.1rem' }}>🔍</span>
        <strong style={{ fontSize: '0.9rem', color: '#1C2B3A' }}>Auto-import from DOI or PubMed</strong>
        <span style={{ fontSize: '0.75rem', color: '#5A8A6A', background: '#e8f5ec', padding: '0.1rem 0.5rem', borderRadius: 6, fontWeight: 600 }}>FREE API</span>
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
        {(['doi', 'pmid'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setInput(''); setError(''); setSuccess(''); }}
            style={{ padding: '0.3rem 0.9rem', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, background: mode === m ? '#1C2B3A' : '#ddd', color: mode === m ? 'white' : '#555', transition: 'all 0.15s' }}>
            {m.toUpperCase()}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input value={input} onChange={e => { setInput(e.target.value); setError(''); setSuccess(''); }}
          onKeyDown={e => e.key === 'Enter' && handleFetch()}
          placeholder={mode === 'doi' ? 'Paste DOI  e.g.  10.1016/S0140-6736(20)31180-0' : 'Paste PubMed ID  e.g.  32640463'}
          style={{ flex: 1, padding: '0.55rem 0.85rem', borderRadius: 7, border: error ? '1.5px solid #f44336' : '1.5px solid #b2d8c4', fontSize: '0.88rem', outline: 'none' }} />
        <button onClick={handleFetch} disabled={loading}
          style={{ padding: '0.55rem 1.2rem', borderRadius: 7, border: 'none', background: loading ? '#aaa' : '#5A8A6A', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
          {loading ? 'Fetching…' : 'Auto-fill ↓'}
        </button>
      </div>
      {error   && <p style={{ marginTop: '0.5rem', marginBottom: 0, fontSize: '0.8rem', color: '#f44336' }}>⚠ {error}</p>}
      {success && <p style={{ marginTop: '0.5rem', marginBottom: 0, fontSize: '0.8rem', color: '#5A8A6A', fontWeight: 600 }}>✓ {success}</p>}
    </div>
  );
}

// ── BulkImportModal (Feature #42) ─────────────────────────────────────────────

const KNOWN_COLS = ['title', 'authors', 'author', 'year', 'journal', 'doi', 'pmid', 'volume', 'issue', 'pages', 'country', 'design', 'notes'];

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  for (const line of lines) {
    const cells: string[] = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { cells.push(cur.trim()); cur = ''; }
      else { cur += c; }
    }
    cells.push(cur.trim());
    rows.push(cells);
  }
  return rows;
}

function guessMapping(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  headers.forEach(h => {
    const lh = h.toLowerCase().trim();
    if (lh === 'title' || lh === 'paper title' || lh === 'article title') map[h] = 'title';
    else if (lh === 'author' || lh === 'authors' || lh === 'author(s)') map[h] = 'authors';
    else if (lh === 'year' || lh === 'pub year' || lh === 'publication year') map[h] = 'year';
    else if (lh === 'journal' || lh === 'source' || lh === 'publication' || lh === 'journal/source') map[h] = 'journal';
    else if (lh === 'doi') map[h] = 'doi';
    else if (lh === 'pmid' || lh === 'pubmed id') map[h] = 'pmid';
    else if (lh === 'volume' || lh === 'vol') map[h] = 'volume';
    else if (lh === 'issue' || lh === 'number') map[h] = 'issue';
    else if (lh === 'pages' || lh === 'page' || lh === 'start page') map[h] = 'pages';
    else if (lh === 'country') map[h] = 'country';
    else if (lh === 'abstract' || lh === 'notes' || lh === 'note') map[h] = 'notes';
    else map[h] = '';
  });
  return map;
}

function BulkImportModal({ onImport, onClose }: { onImport: (refs: Reference[]) => void; onClose: () => void }) {
  const [step,      setStep]      = useState<'upload' | 'map' | 'preview'>('upload');
  const [headers,   setHeaders]   = useState<string[]>([]);
  const [rows,      setRows]      = useState<string[][]>([]);
  const [mapping,   setMapping]   = useState<Record<string, string>>({});
  const [fileName,  setFileName]  = useState('');
  const [error,     setError]     = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setError('');
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const all  = parseCSV(text);
      if (all.length < 2) { setError('File must have at least a header row and one data row.'); return; }
      const hdrs = all[0];
      const data = all.slice(1).filter(r => r.some(c => c.trim()));
      setHeaders(hdrs);
      setRows(data);
      setMapping(guessMapping(hdrs));
      setFileName(file.name);
      setStep('map');
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function buildRefs(): Reference[] {
    return rows.map((row, i) => {
      const get = (field: string) => {
        const hdr = Object.keys(mapping).find(h => mapping[h] === field);
        if (!hdr) return '';
        const idx = headers.indexOf(hdr);
        return idx >= 0 ? (row[idx] || '').trim() : '';
      };
      const yr = parseInt(get('year'), 10);
      return {
        ...emptyRef(),
        id:          `bulk_${Date.now()}_${i}`,
        added_at:    new Date().toISOString(),
        title:       get('title'),
        authors:     get('authors'),
        journal:     get('journal'),
        year:        isNaN(yr) ? new Date().getFullYear() : yr,
        volume:      get('volume'),
        issue:       get('issue'),
        pages:       get('pages'),
        doi:         get('doi'),
        pmid:        get('pmid'),
        country:     get('country'),
        notes:       get('notes'),
        design:      get('design') || 'Other',
      };
    }).filter(r => r.title || r.authors || r.doi || r.pmid);
  }

  const preview = buildRefs().slice(0, 5);
  const total   = buildRefs().length;

  function doImport() {
    const built = buildRefs();
    if (!built.length) { setError('No valid rows found. Ensure Title or Authors column is mapped.'); return; }
    onImport(built);
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1100, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem' }}>
      <div className="card" style={{ width: 760, maxWidth: '96vw' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ marginBottom: 2 }}>📥 Bulk Import References</h2>
            <p style={{ fontSize: '0.82rem', color: '#888', margin: 0 }}>
              Import from Zotero / Mendeley CSV export or any CSV with title, authors, year, journal, doi columns
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#888', lineHeight: 1 }}>×</button>
        </div>

        {/* Steps indicator */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {(['upload', 'map', 'preview'] as const).map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, background: step === s ? '#1C2B3A' : ((['upload', 'map', 'preview'].indexOf(step) > i) ? '#5A8A6A' : '#ddd'), color: step === s || ['upload', 'map', 'preview'].indexOf(step) > i ? 'white' : '#888' }}>
                {['upload', 'map', 'preview'].indexOf(step) > i ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '0.8rem', color: step === s ? '#1C2B3A' : '#888', fontWeight: step === s ? 700 : 400 }}>
                {s === 'upload' ? 'Upload CSV' : s === 'map' ? 'Map Columns' : 'Preview & Import'}
              </span>
              {i < 2 && <span style={{ color: '#ccc', fontSize: '0.8rem' }}>›</span>}
            </div>
          ))}
        </div>

        {error && <div style={{ background: '#fff5f5', border: '1px solid #fcc', borderRadius: 8, padding: '0.7rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#c00' }}>⚠ {error}</div>}

        {/* STEP 1: Upload */}
        {step === 'upload' && (
          <div>
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{ border: '2px dashed #b2d8c4', borderRadius: 12, padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', background: '#f8fdf9', transition: 'border-color 0.2s' }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📂</div>
              <p style={{ fontWeight: 600, marginBottom: 6 }}>Drop CSV file here or click to browse</p>
              <p style={{ fontSize: '0.82rem', color: '#888', margin: 0 }}>Supports: Zotero CSV, Mendeley CSV, any CSV with column headers</p>
              <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            </div>

            <div style={{ marginTop: '1.25rem', background: '#f8f7f4', borderRadius: 8, padding: '0.85rem 1rem' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#555', marginBottom: 6 }}>Expected CSV columns (any order, extra columns ignored):</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {['title', 'authors', 'year', 'journal', 'doi', 'pmid', 'volume', 'issue', 'pages', 'country', 'notes'].map(c => (
                  <code key={c} style={{ background: '#e8e8e8', borderRadius: 4, padding: '0.15rem 0.45rem', fontSize: '0.75rem' }}>{c}</code>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Map columns */}
        {step === 'map' && (
          <div>
            <p style={{ fontSize: '0.88rem', color: '#555', marginBottom: '1rem' }}>
              <strong>{rows.length}</strong> rows found in <strong>{fileName}</strong>. Map each CSV column to a reference field (or leave blank to skip).
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1.25rem' }}>
              {headers.map(h => (
                <div key={h} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#f8f7f4', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1C2B3A', minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={h}>{h}</span>
                  <span style={{ color: '#aaa', fontSize: '0.8rem' }}>→</span>
                  <select value={mapping[h] || ''} onChange={e => setMapping(prev => ({ ...prev, [h]: e.target.value }))}
                    style={{ padding: '0.3rem 0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.78rem', background: mapping[h] ? '#e8f5ec' : 'white', minWidth: 100 }}>
                    <option value="">— skip —</option>
                    {KNOWN_COLS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={() => { setError(''); setStep('preview'); }}>
                Preview Import →
              </button>
              <button className="btn" style={{ background: '#eee', color: '#555' }} onClick={() => setStep('upload')}>
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Preview & Import */}
        {step === 'preview' && (
          <div>
            <p style={{ fontSize: '0.88rem', color: '#555', marginBottom: '1rem' }}>
              Showing first 5 of <strong>{total}</strong> importable rows. Empty fields will use defaults.
            </p>
            <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ background: '#1C2B3A', color: 'white' }}>
                    {['Title', 'Authors', 'Year', 'Journal', 'DOI / PMID'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#f8f7f4' : 'white', borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '7px 10px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title || <em style={{ color: '#bbb' }}>—</em>}</td>
                      <td style={{ padding: '7px 10px', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.authors || <em style={{ color: '#bbb' }}>—</em>}</td>
                      <td style={{ padding: '7px 10px' }}>{r.year}</td>
                      <td style={{ padding: '7px 10px', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.journal || <em style={{ color: '#bbb' }}>—</em>}</td>
                      <td style={{ padding: '7px 10px', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.doi || r.pmid || <em style={{ color: '#bbb' }}>—</em>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total === 0 && (
              <div style={{ background: '#fff5f5', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#c00' }}>
                No valid rows to import. Make sure at least "title" or "authors" is mapped.
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={doImport} disabled={total === 0}>
                Import {total} Reference{total !== 1 ? 's' : ''} ✓
              </button>
              <button className="btn" style={{ background: '#eee', color: '#555' }} onClick={() => setStep('map')}>
                ← Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LiteratureReview() {
  const { projectId } = useProject();
  const [refs, setRefs]               = useState<Reference[]>([]);
  const [activeTab, setActiveTab]     = useState('library');
  const [showAdd, setShowAdd]         = useState(false);
  const [showPICO, setShowPICO]       = useState(false);
  const [editing, setEditing]         = useState<Reference | null>(null);
  const [form, setForm]               = useState<Reference>(emptyRef());
  const [search, setSearch]           = useState('');
  const [filterTheme, setFilterTheme] = useState('All');
  const [filterGrade, setFilterGrade] = useState('All');
  const [citStyle, setCitStyle]       = useState<'vancouver' | 'apa'>('vancouver');
  const [copied, setCopied]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    fetch(`/api/references?project_id=${projectId}`)
      .then(res => res.json())
      .then(data => setRefs(data))
      .finally(() => setLoading(false));
  }, [projectId]);

  function save(updated: Reference[]) {
    setRefs(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch (e) {}
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function addRef() {
    if (!form.title || !form.authors || !projectId) return;
    const payload = { ...form, project_id: projectId };
    const res = await fetch('/api/references', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const newRef = await res.json();
      save([...refs, newRef]);
      setForm(emptyRef());
      setShowAdd(false);
    }
  }

  async function updateRef() {
    if (!editing) return;
    save(refs.map(r => r.id === editing.id ? { ...form, id: editing.id } : r));
    setEditing(null); setForm(emptyRef()); setShowAdd(false);
  }

  async function deleteRef(id: string, confirm = true) {
    if (confirm && !window.confirm('Delete this reference?')) return;
    const res = await fetch(`/api/references/${id}`, { method: 'DELETE' });
    if (res.ok) {
      save(refs.filter(r => r.id !== id));
    }
  }

  function startEdit(ref: Reference) {
    setForm({ ...ref }); setEditing(ref); setShowAdd(true);
  }

  function handleAutoFill(data: Partial<Reference>) {
    setForm(prev => ({
      ...prev,
      title:   data.title   || prev.title,
      authors: data.authors || prev.authors,
      journal: data.journal || prev.journal,
      year:    data.year    ?? prev.year,
      volume:  data.volume  || prev.volume,
      issue:   data.issue   || prev.issue,
      pages:   data.pages   || prev.pages,
      doi:     data.doi     || prev.doi,
      pmid:    data.pmid    || prev.pmid,
    }));
  }

  function handleBulkImport(incoming: Reference[]) {
    save([...refs, ...incoming]);
    setShowBulk(false);
  }

  function copyBibliography() {
    const text = filtered.map((r, i) => citStyle === 'vancouver' ? vancouverCite(r, i + 1) : apaCite(r)).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  function exportExtractionCSV() {
    const headers = ['Author(s)', 'Year', 'Title', 'Journal', 'Design', 'N', 'Effect Type', 'Effect Value', 'CI Lower', 'CI Upper', '95% CI', 'RoB Rating', 'Adjustment Variables', 'GRADE', 'DOI'];
    const rows = refs.map(r => [
      r.authors.split(',')[0] + (r.authors.split(',').length > 1 ? ' et al.' : ''),
      r.year, r.title, r.journal, r.design,
      r.sample_size > 0 ? r.sample_size : '',
      r.effect_type, r.effect_value, r.ci_lower, r.ci_upper,
      r.ci_lower && r.ci_upper ? `${r.ci_lower}–${r.ci_upper}` : '',
      r.rob_rating, r.adjustment_vars, r.grade, r.doi,
    ]);
    const csv  = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'evidence_extraction.csv'; a.click();
  }

  if (!projectId) {
    return (
      <div className="card" style={{ margin: '2rem auto', maxWidth: 500, textAlign: 'center' }}>
        <h2>Please select or create a project to continue.</h2>
      </div>
    );
  }

  const filtered = refs.filter(r => {
    const matchSearch = !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.authors.toLowerCase().includes(search.toLowerCase()) ||
      r.key_finding.toLowerCase().includes(search.toLowerCase()) ||
      r.country.toLowerCase().includes(search.toLowerCase());
    const matchTheme = filterTheme === 'All' || r.theme === filterTheme;
    const matchGrade = filterGrade === 'All' || r.grade === filterGrade;
    return matchSearch && matchTheme && matchGrade;
  });

  const themeGroups   = THEMES.reduce((acc, t) => { acc[t] = refs.filter(r => r.theme === t); return acc; }, {} as Record<string, Reference[]>);
  const gradeDist     = GRADE_LEVELS.map(g => ({ grade: g, count: refs.filter(r => r.grade === g).length }));
  const extractedRefs = refs.filter(r => r.effect_type || r.rob_rating);

  const gradeDistribution = GRADE_LEVELS.map(g => ({
    grade: g, count: refs.filter(r => r.grade === g).length,
  }));

  return (
    <div className="page">
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ color: '#1C2B3A', marginBottom: 0 }}>Literature Review Manager</h1>
          <p style={{ marginBottom: 0, fontSize: '0.88rem', color: '#888' }}>
            Track and organise your research references with evidence grading.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn"
            style={{ background: '#f0f4f8', color: '#444' }}
            onClick={() => setShowPICO(true)}
          >
            PICO Framework
          </button>
          <button
            className="btn btn-primary"
            onClick={() => { setEditing(null); setForm(emptyRef()); setShowAdd(true); }}
          >
            + Add Reference
          </button>
        </div>
      </div>

      {saved && (
        <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '0.5rem 1rem', borderRadius: 6, marginBottom: '1rem', fontSize: '0.88rem' }}>
          Saved!
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '2px solid #eee' }}>
        {[
          { key: 'library',      label: `Library (${refs.length})` },
          { key: 'themes',       label: 'By Theme' },
          { key: 'synthesis',    label: 'Evidence Synthesis' },
          { key: 'bibliography', label: 'Bibliography' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.5rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #5A8A6A' : '2px solid transparent',
              color: activeTab === tab.key ? '#5A8A6A' : '#666',
              fontWeight: activeTab === tab.key ? 700 : 400,
              cursor: 'pointer',
              fontSize: '0.88rem',
              marginBottom: '-2px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* LIBRARY TAB */}
      {activeTab === 'library' && (
        <div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                placeholder="Search by title, author, finding, country..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, minWidth: 200, padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.85rem' }}
              />
              <select
                value={filterTheme}
                onChange={e => setFilterTheme(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.85rem' }}
              >
                <option value="All">All Themes</option>
                {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select
                value={filterGrade}
                onChange={e => setFilterGrade(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.85rem' }}
              >
                <option value="All">All GRADE</option>
                {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          {loading ? (
            <p>Loading references…</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', background: 'white', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <thead>
                  <tr style={{ background: '#1C2B3A', color: 'white' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Author</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Year</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Design</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>N</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Country</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Key Finding</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>GRADE</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Level</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ref, i) => (
                    <tr key={ref.id} style={{ background: i % 2 === 0 ? '#f8f7f4' : 'white', borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600, maxWidth: 150 }}>
                        {ref.authors.split(',')[0]}{ref.authors.split(',').length > 1 ? ' et al.' : ''}
                      </td>
                      <td style={{ padding: '8px 10px' }}>{ref.year}</td>
                      <td style={{ padding: '8px 10px' }}>{ref.design}</td>
                      <td style={{ padding: '8px 10px' }}>{ref.sample_size > 0 ? ref.sample_size.toLocaleString() : '—'}</td>
                      <td style={{ padding: '8px 10px' }}>{ref.country || '—'}</td>
                      <td style={{ padding: '8px 10px', maxWidth: 200, whiteSpace: 'normal' }}>{ref.key_finding || '—'}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700, background: (GRADE_COLORS[ref.grade] || '#888') + '22', color: GRADE_COLORS[ref.grade] || '#888' }}>{ref.grade}</span>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700, background: (LEVEL_COLORS[ref.level] || '#888') + '22', color: LEVEL_COLORS[ref.level] || '#888' }}>{ref.level}</span>
                      </td>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => startEdit(ref)}
                          style={{ marginRight: 6, padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: 4, border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteRef(ref.id)}
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: 4, border: '1px solid #f44336', background: 'white', color: '#f44336', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* THEMES TAB */}
      {activeTab === 'themes' && (
        <div>
          {THEMES.map(theme => (
            themeGroups[theme].length > 0 && (
              <div key={theme} className="card" style={{ marginBottom: '1rem' }}>
                <h3 style={{ color: '#1C2B3A', marginBottom: '0.75rem' }}>{theme} ({themeGroups[theme].length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {themeGroups[theme].map(ref => (
                    <div key={ref.id} style={{ padding: '0.75rem', background: '#f8f7f4', borderRadius: 6, fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 600 }}>
                        {ref.authors.split(',')[0]}{ref.authors.split(',').length > 1 ? ' et al.' : ''} ({ref.year}). {ref.title}
                      </div>
                      {ref.key_finding && <div style={{ color: '#666', marginTop: '0.25rem' }}>{ref.key_finding}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
          {refs.length === 0 && <p style={{ color: '#888' }}>No references yet.</p>}
        </div>
      )}

      {/* EVIDENCE SYNTHESIS TAB */}
      {activeTab === 'synthesis' && (
        <div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ color: '#1C2B3A', marginBottom: '1rem' }}>GRADE Evidence Distribution</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {gradeDistribution.map(({ grade, count }) => (
                <div key={grade} style={{ padding: '1rem 1.5rem', borderRadius: 8, background: (GRADE_COLORS[grade] || '#888') + '18', borderLeft: `4px solid ${GRADE_COLORS[grade] || '#888'}`, minWidth: 120 }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: GRADE_COLORS[grade] || '#888' }}>{count}</div>
                  <div style={{ fontSize: '0.82rem', color: '#666' }}>{grade}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 style={{ color: '#1C2B3A', marginBottom: '1rem' }}>Study Design Distribution</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {STUDY_DESIGNS.map(design => {
                const count = refs.filter(r => r.design === design).length;
                if (count === 0) return null;
                return (
                  <div key={design} style={{ padding: '0.4rem 0.9rem', borderRadius: 20, background: '#f0f4f8', fontSize: '0.82rem', color: '#444' }}>
                    {design}: <strong>{count}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* BIBLIOGRAPHY TAB */}
      {activeTab === 'bibliography' && (
        <div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ marginBottom: 0 }}>Reference List</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  value={citStyle}
                  onChange={e => setCitStyle(e.target.value as 'vancouver' | 'apa')}
                  style={{ padding: '0.4rem 0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.85rem' }}
                >
                  <option value="vancouver">Vancouver</option>
                  <option value="apa">APA</option>
                </select>
                <button className="btn btn-sage" onClick={copyBibliography} style={{ fontSize: '0.85rem' }}>
                  {copied ? '✓ Copied!' : '📋 Copy All'}
                </button>
              </div>
            </div>
            {refs.length === 0 ? <p style={{ color: '#888' }}>No references yet.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {refs.map((ref, i) => (
                  <div key={ref.id} style={{ padding: '0.75rem', background: '#f8f7f4', borderRadius: 8, fontSize: '0.85rem', lineHeight: 1.7 }}>
                    {citStyle === 'vancouver' ? vancouverCite(ref, i + 1) : apaCite(ref)}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card" style={{ borderLeft: '4px solid #5A8A6A' }}>
            <h2>Export Options</h2>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn" style={{ background: '#eee', color: '#444' }} onClick={() => {
                const text = refs.map((r, i) => vancouverCite(r, i + 1)).join('\n\n');
                const blob = new Blob([text], { type: 'text/plain' });
                const url  = URL.createObjectURL(blob);
                const a    = document.createElement('a');
                a.href = url; a.download = 'references_vancouver.txt'; a.click();
              }}>
                ⬇️ Download Vancouver (.txt)
              </button>
              <button className="btn" style={{ background: '#eee', color: '#444' }} onClick={() => {
                const text = refs.map(r => apaCite(r)).join('\n\n');
                const blob = new Blob([text], { type: 'text/plain' });
                const url  = URL.createObjectURL(blob);
                const a    = document.createElement('a');
                a.href = url; a.download = 'references_apa.txt'; a.click();
              }}>
                ⬇️ Download APA (.txt)
              </button>
              <button className="btn" style={{ background: '#eee', color: '#444' }} onClick={() => {
                const headers = ['Title', 'Authors', 'Journal', 'Year', 'Volume', 'Issue', 'Pages', 'DOI', 'Design', 'GRADE', 'Level', 'Theme', 'Country', 'Sample Size', 'Key Finding', 'Notes'];
                const rows = refs.map(r => [r.title, r.authors, r.journal, r.year, r.volume, r.issue, r.pages, r.doi, r.design, r.grade, r.level, r.theme, r.country, r.sample_size, r.key_finding, r.notes]);
                const csv  = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url  = URL.createObjectURL(blob);
                const a    = document.createElement('a');
                a.href = url; a.download = 'literature_review.csv'; a.click();
              }}>
                ⬇️ Download CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT MODAL ────────────────────────────────────────────────── */}
      {showAdd && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem' }}>
          <div className="card" style={{ width: 720, maxWidth: '95vw' }}>
            <h2>{editing ? 'Edit Reference' : 'Add Reference'}</h2>

            {/* Auto-import */}
            <AutoImportPanel onFill={handleAutoFill} />

            {/* ── Core fields ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>TITLE *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Full paper title" style={inp} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>AUTHORS * (comma separated)</label>
                <input value={form.authors} onChange={e => setForm(p => ({ ...p, authors: e.target.value }))} placeholder="Smith J, Jones A, Patel B" style={inp} />
              </div>
              <div>
                <label style={lbl}>JOURNAL</label>
                <input value={form.journal} onChange={e => setForm(p => ({ ...p, journal: e.target.value }))} placeholder="Lancet Global Health" style={inp} />
              </div>
              <div>
                <label style={lbl}>YEAR</label>
                <input type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: parseInt(e.target.value) }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>VOLUME</label>
                <input value={form.volume} onChange={e => setForm(p => ({ ...p, volume: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>ISSUE</label>
                <input value={form.issue} onChange={e => setForm(p => ({ ...p, issue: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>PAGES</label>
                <input value={form.pages} onChange={e => setForm(p => ({ ...p, pages: e.target.value }))} placeholder="e12-e24" style={inp} />
              </div>
              <div>
                <label style={lbl}>DOI</label>
                <input value={form.doi} onChange={e => setForm(p => ({ ...p, doi: e.target.value }))} placeholder="10.1016/..." style={inp} />
              </div>
              <div>
                <label style={lbl}>PMID</label>
                <input value={form.pmid} onChange={e => setForm(p => ({ ...p, pmid: e.target.value }))} placeholder="32640463" style={inp} />
              </div>
              <div>
                <label style={lbl}>COUNTRY</label>
                <input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} placeholder="Kenya, Uganda..." style={inp} />
              </div>
              <div>
                <label style={lbl}>SAMPLE SIZE</label>
                <input type="number" value={form.sample_size} onChange={e => setForm(p => ({ ...p, sample_size: parseInt(e.target.value) }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>STUDY DESIGN</label>
                <select value={form.design} onChange={e => setForm(p => ({ ...p, design: e.target.value }))} style={inp}>
                  {STUDY_DESIGNS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>THEME</label>
                <select value={form.theme} onChange={e => setForm(p => ({ ...p, theme: e.target.value }))} style={inp}>
                  {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>GRADE (evidence quality)</label>
                <select value={form.grade} onChange={e => setForm(p => ({ ...p, grade: e.target.value }))} style={inp}>
                  {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>EVIDENCE LEVEL (Oxford)</label>
                <select value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))} style={inp}>
                  {EVIDENCE_LEVELS.map(l => <option key={l} value={l}>Level {l}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>KEY FINDING</label>
                <input value={form.key_finding} onChange={e => setForm(p => ({ ...p, key_finding: e.target.value }))} placeholder="One sentence summary of the main finding" style={inp} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>NOTES</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Personal notes, limitations, relevance..." style={{ ...inp, minHeight: 55 }} />
              </div>
            </div>

            {/* ── Evidence Extraction section (Feature #41) ── */}
            <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginBottom: '1rem' }}>
              <button
                onClick={() => setShowExtract(e => !e)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0, marginBottom: showExtract ? '0.85rem' : 0 }}
              >
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1C2B3A' }}>🧪 Evidence Extraction</span>
                <span style={{ fontSize: '0.75rem', color: '#888' }}>(effect size · 95% CI · risk of bias · adjustment variables)</span>
                <span style={{ fontSize: '0.75rem', color: '#C0533A', marginLeft: 'auto' }}>{showExtract ? '▲ collapse' : '▼ expand'}</span>
              </button>

              {showExtract && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={lbl}>EFFECT SIZE TYPE</label>
                    <select value={form.effect_type} onChange={e => setForm(p => ({ ...p, effect_type: e.target.value }))} style={inp}>
                      {EFFECT_TYPES.map(t => <option key={t} value={t}>{t || '— select —'}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>EFFECT VALUE</label>
                    <input value={form.effect_value} onChange={e => setForm(p => ({ ...p, effect_value: e.target.value }))} placeholder="e.g. 0.72 or 2.14" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>95% CI LOWER</label>
                    <input value={form.ci_lower} onChange={e => setForm(p => ({ ...p, ci_lower: e.target.value }))} placeholder="e.g. 0.55" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>95% CI UPPER</label>
                    <input value={form.ci_upper} onChange={e => setForm(p => ({ ...p, ci_upper: e.target.value }))} placeholder="e.g. 0.94" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>RISK OF BIAS RATING</label>
                    <select value={form.rob_rating} onChange={e => setForm(p => ({ ...p, rob_rating: e.target.value }))} style={{ ...inp, borderColor: form.rob_rating ? (ROB_COLORS[form.rob_rating] || '#ccc') : '#ccc' }}>
                      {ROB_RATINGS.map(r => <option key={r} value={r}>{r || '— select —'}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>ADJUSTMENT VARIABLES</label>
                    <input value={form.adjustment_vars} onChange={e => setForm(p => ({ ...p, adjustment_vars: e.target.value }))} placeholder="age, sex, SES, district..." style={inp} />
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={editing ? updateRef : addRef} disabled={!form.title || !form.authors}>
                {editing ? 'Update Reference' : 'Add Reference'}
              </button>
              <button className="btn" style={{ background: '#eee', color: '#444' }} onClick={() => { setShowAdd(false); setEditing(null); setShowExtract(false); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PICO MODAL ──────────────────────────────────────────────────────── */}
      {showPICO && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: 580, maxWidth: '95vw' }}>
            <h2>PICO Framework</h2>
            <p style={{ fontSize: '0.88rem', color: '#888', marginBottom: '1.25rem' }}>Define your research question to guide your literature search.</p>
            {[
              { key: 'pico_p', label: 'P — Population',   placeholder: 'e.g. Children under 5 in rural Tanzania',     color: '#C0533A' },
              { key: 'pico_i', label: 'I — Intervention', placeholder: 'e.g. Community health worker home visits',      color: '#5A8A6A' },
              { key: 'pico_c', label: 'C — Comparison',   placeholder: 'e.g. Standard facility-based care',             color: '#2196f3' },
              { key: 'pico_o', label: 'O — Outcome',      placeholder: 'e.g. Under-5 mortality within 12 months',       color: '#9c27b0' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: 700, fontSize: '0.88rem', color: field.color, display: 'block', marginBottom: 6 }}>{field.label}</label>
                <input value={(form as any)[field.key]} onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: `1px solid ${field.color}44`, fontSize: '0.88rem' }} />
              </div>
            ))}
            <button className="btn btn-primary" onClick={() => setShowPICO(false)}>Done</button>
          </div>
        </div>
      )}

      {/* ── BULK IMPORT MODAL (Feature #42) ─────────────────────────────────── */}
      {showBulk && (
        <BulkImportModal
          onImport={handleBulkImport}
          onClose={() => setShowBulk(false)}
        />
      )}
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────

const lbl: React.CSSProperties = {
  fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4,
};
const inp: React.CSSProperties = {
  width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem',
};

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
