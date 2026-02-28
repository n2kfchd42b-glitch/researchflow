import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';

const STUDY_DESIGNS = ['RCT', 'Cohort', 'Case-Control', 'Cross-sectional', 'Systematic Review', 'Meta-analysis', 'Case Report', 'Qualitative', 'Other'];
const EVIDENCE_LEVELS = ['1a', '1b', '2a', '2b', '3', '4', '5'];
const GRADE_LEVELS = ['High', 'Moderate', 'Low', 'Very Low'];
const THEMES = ['Background', 'Methods', 'Intervention', 'Outcome', 'Comparison', 'Population', 'Risk Factor', 'Epidemiology', 'Policy'];

const GRADE_COLORS: Record<string, string> = {
  'High':     '#5A8A6A',
  'Moderate': '#2196f3',
  'Low':      '#ff9800',
  'Very Low': '#f44336',
};

const LEVEL_COLORS: Record<string, string> = {
  '1a': '#5A8A6A', '1b': '#5A8A6A',
  '2a': '#2196f3', '2b': '#2196f3',
  '3':  '#ff9800',
  '4':  '#f44336',
  '5':  '#9c27b0',
};

type Reference = {
  id:           string;
  title:        string;
  authors:      string;
  journal:      string;
  year:         number;
  volume:       string;
  issue:        string;
  pages:        string;
  doi:          string;
  design:       string;
  grade:        string;
  level:        string;
  theme:        string;
  notes:        string;
  pico_p:       string;
  pico_i:       string;
  pico_c:       string;
  pico_o:       string;
  sample_size:  number;
  country:      string;
  key_finding:  string;
  added_at:     string;
};

function emptyRef(): Reference {
  return {
    id:          Date.now().toString(),
    title:       '',
    authors:     '',
    journal:     '',
    year:        new Date().getFullYear(),
    volume:      '',
    issue:       '',
    pages:       '',
    doi:         '',
    design:      'Cohort',
    grade:       'Moderate',
    level:       '2b',
    theme:       'Background',
    notes:       '',
    pico_p:      '',
    pico_i:      '',
    pico_c:      '',
    pico_o:      '',
    sample_size: 0,
    country:     '',
    key_finding: '',
    added_at:    new Date().toISOString(),
  };
}

function vancouverCite(ref: Reference, index: number): string {
  const authors = ref.authors.split(',').slice(0, 6).join(', ');
  const et_al   = ref.authors.split(',').length > 6 ? ', et al' : '';
  return `${index}. ${authors}${et_al}. ${ref.title}. ${ref.journal}. ${ref.year};${ref.volume}${ref.issue ? `(${ref.issue})` : ''}:${ref.pages}.${ref.doi ? ` doi:${ref.doi}` : ''}`;
}

function apaCite(ref: Reference): string {
  const authors = ref.authors;
  return `${authors} (${ref.year}). ${ref.title}. ${ref.journal}, ${ref.volume}${ref.issue ? `(${ref.issue})` : ''}, ${ref.pages}.${ref.doi ? ` https://doi.org/${ref.doi}` : ''}`;
}

export default function LiteratureReview() {
  const { projectId } = useProject();
  const [refs, setRefs]             = useState<Reference[]>([]);
  const [activeTab, setActiveTab]   = useState('library');
  const [showAdd, setShowAdd]       = useState(false);
  const [showPICO, setShowPICO]     = useState(false);
  const [editing, setEditing]       = useState<Reference | null>(null);
  const [form, setForm]             = useState<Reference>(emptyRef());
  const [search, setSearch]         = useState('');
  const [filterTheme, setFilterTheme] = useState('All');
  const [filterGrade, setFilterGrade] = useState('All');
  const [citStyle, setCitStyle]     = useState<'vancouver'|'apa'>('vancouver');
  const [copied, setCopied]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [loading, setLoading]       = useState(false);

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
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function addRef() {
    if (!form.title || !form.authors || !projectId) return;
    const payload = { ...form, project_id: projectId };
    const res = await fetch('/api/references', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
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
    await deleteRef(editing.id, false);
    await addRef();
    setEditing(null);
    setForm(emptyRef());
    setShowAdd(false);
  }

  async function deleteRef(id: string, confirm = true) {
    if (confirm && !window.confirm('Delete this reference?')) return;
    const res = await fetch(`/api/references/${id}`, { method: 'DELETE' });
    if (res.ok) {
      save(refs.filter(r => r.id !== id));
    }
  }

  function startEdit(ref: Reference) {
    setForm({ ...ref });
    setEditing(ref);
    setShowAdd(true);
  }

  function copyBibliography() {
    const text = filtered.map((r, i) =>
      citStyle === 'vancouver' ? vancouverCite(r, i + 1) : apaCite(r)
    ).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!projectId) {
    return (
      <div className="card" style={{ margin: '2rem auto', maxWidth: 500, textAlign: 'center' }}>
        <h2>Please select or create a project to continue.</h2>
      </div>
    );
  }

  const filtered = refs.filter(r => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.authors.toLowerCase().includes(search.toLowerCase()) ||
      r.key_finding.toLowerCase().includes(search.toLowerCase()) ||
      r.country.toLowerCase().includes(search.toLowerCase());
    const matchTheme = filterTheme === 'All' || r.theme === filterTheme;
    const matchGrade = filterGrade === 'All' || r.grade === filterGrade;
    return matchSearch && matchTheme && matchGrade;
  });

  const themeGroups = THEMES.reduce((acc, theme) => {
    acc[theme] = refs.filter(r => r.theme === theme);
    return acc;
  }, {} as Record<string, Reference[]>);

  const gradeDistribution = GRADE_LEVELS.map(g => ({
    grade: g, count: refs.filter(r => r.grade === g).length
  }));

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ color: '#1C2B3A', marginBottom: 0 }}>Literature Review Manager</h1>
          <p style={{ marginBottom: 0, fontSize: '0.88rem', color: '#888' }}>
            Organise evidence, rate quality, generate references — built for global health research
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {saved && <span style={{ color: '#5A8A6A', fontSize: '0.82rem' }}>✓ Saved</span>}
          <button className="btn" style={{ background: '#eee', color: '#555', fontSize: '0.85rem' }}
            onClick={() => setShowPICO(true)}>
            PICO Framework
          </button>
          <button className="btn btn-primary" onClick={() => { setForm(emptyRef()); setEditing(null); setShowAdd(true); }}>
            + Add Reference
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total References', value: refs.length,                                    color: '#1C2B3A' },
          { label: 'High Quality',     value: refs.filter(r => r.grade === 'High').length,    color: '#5A8A6A' },
          { label: 'Study Designs',    value: new Set(refs.map(r => r.design)).size,           color: '#2196f3' },
          { label: 'Countries',        value: new Set(refs.map(r => r.country).filter(Boolean)).size, color: '#C0533A' },
        ].map(item => (
          <div key={item.label} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
            <p style={{ fontSize: '1.8rem', fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.value}</p>
            <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 0 }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'library',     label: '📚 Library'         },
          { id: 'themes',      label: '🏷️ By Theme'        },
          { id: 'evidence',    label: '⭐ Evidence Table'   },
          { id: 'bibliography',label: '📄 Bibliography'     },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="btn" style={{
            background: activeTab === tab.id ? '#1C2B3A' : '#eee',
            color: activeTab === tab.id ? 'white' : '#444',
            padding: '0.5rem 1rem',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* SEARCH + FILTER */}
      {(activeTab === 'library' || activeTab === 'evidence') && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, author, finding, country..."
            style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid #ccc', fontSize: '0.88rem', minWidth: 200 }} />
          <select value={filterTheme} onChange={e => setFilterTheme(e.target.value)}
            style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid #ccc', fontSize: '0.88rem' }}>
            <option value="All">All Themes</option>
            {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
            style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid #ccc', fontSize: '0.88rem' }}>
            <option value="All">All Quality</option>
            {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      )}

      {/* LIBRARY TAB */}
      {activeTab === 'library' && (
        <div>
          {filtered.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
              <h2>No references yet</h2>
              <p style={{ color: '#888' }}>Add your first reference to get started.</p>
              <button className="btn btn-primary" onClick={() => { setForm(emptyRef()); setShowAdd(true); }} style={{ marginTop: '1rem' }}>
                + Add First Reference
              </button>
            </div>
          )}
          {filtered.map((ref, i) => (
            <div key={ref.id} className="card" style={{ marginBottom: '0.75rem', borderLeft: `4px solid ${GRADE_COLORS[ref.grade] || '#888'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: 10, fontSize: '0.72rem', fontWeight: 700, background: (GRADE_COLORS[ref.grade] || '#888') + '22', color: GRADE_COLORS[ref.grade] || '#888' }}>
                      GRADE: {ref.grade}
                    </span>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: 10, fontSize: '0.72rem', background: '#f0f0f0', color: '#555' }}>
                      Level {ref.level}
                    </span>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: 10, fontSize: '0.72rem', background: '#f0f0f0', color: '#555' }}>
                      {ref.design}
                    </span>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: 10, fontSize: '0.72rem', background: '#fff5f3', color: '#C0533A', fontWeight: 600 }}>
                      {ref.theme}
                    </span>
                    {ref.country && (
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: 10, fontSize: '0.72rem', background: '#f0f8ff', color: '#2196f3' }}>
                        📍 {ref.country}
                      </span>
                    )}
                  </div>
                  <h3 style={{ marginBottom: 4, fontSize: '0.95rem', color: '#1C2B3A' }}>{ref.title}</h3>
                  <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: 4 }}>
                    {ref.authors} · <em>{ref.journal}</em> · {ref.year}
                    {ref.sample_size > 0 && ` · n = ${ref.sample_size.toLocaleString()}`}
                  </p>
                  {ref.key_finding && (
                    <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: 0, fontStyle: 'italic' }}>
                      "{ref.key_finding}"
                    </p>
                  )}
                  {ref.notes && (
                    <p style={{ fontSize: '0.78rem', color: '#888', marginTop: 4, marginBottom: 0 }}>
                      📝 {ref.notes}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  <button onClick={() => startEdit(ref)} className="btn" style={{ background: '#eee', color: '#555', padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}>
                    Edit
                  </button>
                  <button onClick={() => deleteRef(ref.id)} className="btn" style={{ background: '#fff5f5', color: '#f44336', padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}>
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* THEMES TAB */}
      {activeTab === 'themes' && (
        <div>
          {THEMES.map(theme => {
            const themeRefs = themeGroups[theme] || [];
            if (themeRefs.length === 0) return null;
            return (
              <div key={theme} className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h2 style={{ marginBottom: 0, color: '#C0533A' }}>{theme}</h2>
                  <span className="badge badge-blue">{themeRefs.length} studies</span>
                </div>
                {themeRefs.map(ref => (
                  <div key={ref.id} style={{ padding: '0.6rem 0', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700, background: (GRADE_COLORS[ref.grade] || '#888') + '22', color: GRADE_COLORS[ref.grade] || '#888', flexShrink: 0 }}>
                      {ref.grade}
                    </span>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 2 }}>{ref.title}</p>
                      <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: ref.key_finding ? 2 : 0 }}>
                        {ref.authors} ({ref.year}) · {ref.design}
                      </p>
                      {ref.key_finding && (
                        <p style={{ fontSize: '0.78rem', color: '#555', fontStyle: 'italic', marginBottom: 0 }}>
                          {ref.key_finding}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          {refs.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: '#888' }}>Add references and assign themes to see them organised here.</p>
            </div>
          )}
        </div>
      )}

      {/* EVIDENCE TABLE TAB */}
      {activeTab === 'evidence' && (
        <div className="card">
          <h2>Evidence Quality Table</h2>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {gradeDistribution.map(g => (
              <div key={g.grade} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: GRADE_COLORS[g.grade] }} />
                <span style={{ fontSize: '0.82rem' }}>{g.grade}: <strong>{g.count}</strong></span>
              </div>
            ))}
          </div>
          {filtered.length === 0 ? (
            <p style={{ color: '#888' }}>No references found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#1C2B3A', color: 'white' }}>
                    {['Author(s)', 'Year', 'Design', 'N', 'Country', 'Key Finding', 'GRADE', 'Level'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ref, i) => (
                    <tr key={ref.id} style={{ background: i % 2 === 0 ? '#f8f7f4' : 'white', borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600, maxWidth: 150 }}>{ref.authors.split(',')[0]}{ref.authors.split(',').length > 1 ? ' et al.' : ''}</td>
                      <td style={{ padding: '8px 10px' }}>{ref.year}</td>
                      <td style={{ padding: '8px 10px' }}>{ref.design}</td>
                      <td style={{ padding: '8px 10px' }}>{ref.sample_size > 0 ? ref.sample_size.toLocaleString() : '—'}</td>
                      <td style={{ padding: '8px 10px' }}>{ref.country || '—'}</td>
                      <td style={{ padding: '8px 10px', maxWidth: 200, whiteSpace: 'normal' }}>{ref.key_finding || '—'}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700, background: (GRADE_COLORS[ref.grade] || '#888') + '22', color: GRADE_COLORS[ref.grade] || '#888' }}>
                          {ref.grade}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700, background: (LEVEL_COLORS[ref.level] || '#888') + '22', color: LEVEL_COLORS[ref.level] || '#888' }}>
                          {ref.level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* BIBLIOGRAPHY TAB */}
      {activeTab === 'bibliography' && (
        <div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ marginBottom: 0 }}>Reference List</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select value={citStyle} onChange={e => setCitStyle(e.target.value as any)}
                  style={{ padding: '0.4rem 0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.85rem' }}>
                  <option value="vancouver">Vancouver</option>
                  <option value="apa">APA</option>
                </select>
                <button className="btn btn-sage" onClick={copyBibliography} style={{ fontSize: '0.85rem' }}>
                  {copied ? '✓ Copied!' : '📋 Copy All'}
                </button>
              </div>
            </div>
            {refs.length === 0 ? (
              <p style={{ color: '#888' }}>No references yet.</p>
            ) : (
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
                const text = refs.map((r, i) => vancouverCite(r, i+1)).join('\n\n');
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
                const headers = ['Title','Authors','Journal','Year','Volume','Issue','Pages','DOI','Design','GRADE','Level','Theme','Country','Sample Size','Key Finding','Notes'];
                const rows = refs.map(r => [r.title,r.authors,r.journal,r.year,r.volume,r.issue,r.pages,r.doi,r.design,r.grade,r.level,r.theme,r.country,r.sample_size,r.key_finding,r.notes]);
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

      {/* ADD/EDIT MODAL */}
      {showAdd && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem' }}>
          <div className="card" style={{ width: 680, maxWidth: '95vw' }}>
            <h2>{editing ? 'Edit Reference' : 'Add Reference'}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>TITLE *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Full paper title"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>AUTHORS * (comma separated)</label>
                <input value={form.authors} onChange={e => setForm(p => ({ ...p, authors: e.target.value }))}
                  placeholder="Smith J, Jones A, Patel B"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>JOURNAL</label>
                <input value={form.journal} onChange={e => setForm(p => ({ ...p, journal: e.target.value }))}
                  placeholder="Lancet Global Health"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>YEAR</label>
                <input type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: parseInt(e.target.value) }))}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>VOLUME</label>
                <input value={form.volume} onChange={e => setForm(p => ({ ...p, volume: e.target.value }))}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>ISSUE</label>
                <input value={form.issue} onChange={e => setForm(p => ({ ...p, issue: e.target.value }))}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>PAGES</label>
                <input value={form.pages} onChange={e => setForm(p => ({ ...p, pages: e.target.value }))}
                  placeholder="e12-e24"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>DOI</label>
                <input value={form.doi} onChange={e => setForm(p => ({ ...p, doi: e.target.value }))}
                  placeholder="10.1016/..."
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>COUNTRY</label>
                <input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                  placeholder="Kenya, Uganda..."
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>SAMPLE SIZE</label>
                <input type="number" value={form.sample_size} onChange={e => setForm(p => ({ ...p, sample_size: parseInt(e.target.value) }))}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>STUDY DESIGN</label>
                <select value={form.design} onChange={e => setForm(p => ({ ...p, design: e.target.value }))}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }}>
                  {STUDY_DESIGNS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>THEME</label>
                <select value={form.theme} onChange={e => setForm(p => ({ ...p, theme: e.target.value }))}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }}>
                  {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>GRADE (evidence quality)</label>
                <select value={form.grade} onChange={e => setForm(p => ({ ...p, grade: e.target.value }))}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }}>
                  {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>EVIDENCE LEVEL (Oxford)</label>
                <select value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }}>
                  {EVIDENCE_LEVELS.map(l => <option key={l} value={l}>Level {l}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>KEY FINDING</label>
                <input value={form.key_finding} onChange={e => setForm(p => ({ ...p, key_finding: e.target.value }))}
                  placeholder="One sentence summary of the main finding"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>NOTES</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Your personal notes, limitations, relevance to your study..."
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem', minHeight: 60 }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={editing ? updateRef : addRef}
                disabled={!form.title || !form.authors}>
                {editing ? 'Update Reference' : 'Add Reference'}
              </button>
              <button className="btn" style={{ background: '#eee', color: '#444' }}
                onClick={() => { setShowAdd(false); setEditing(null); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PICO MODAL */}
      {showPICO && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: 580, maxWidth: '95vw' }}>
            <h2>PICO Framework</h2>
            <p style={{ fontSize: '0.88rem', color: '#888', marginBottom: '1.25rem' }}>
              Define your research question using the PICO framework to guide your literature search.
            </p>
            {[
              { key: 'pico_p', label: 'P — Population',     placeholder: 'e.g. Children under 5 in rural Tanzania',       color: '#C0533A' },
              { key: 'pico_i', label: 'I — Intervention',   placeholder: 'e.g. Community health worker home visits',        color: '#5A8A6A' },
              { key: 'pico_c', label: 'C — Comparison',     placeholder: 'e.g. Standard facility-based care',               color: '#2196f3' },
              { key: 'pico_o', label: 'O — Outcome',        placeholder: 'e.g. Under-5 mortality within 12 months',         color: '#9c27b0' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: 700, fontSize: '0.88rem', color: field.color, display: 'block', marginBottom: 6 }}>
                  {field.label}
                </label>
                <input
                  value={(form as any)[field.key]}
                  onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: `1px solid ${field.color}44`, fontSize: '0.88rem' }} />
              </div>
            ))}
            <button className="btn btn-primary" onClick={() => setShowPICO(false)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
