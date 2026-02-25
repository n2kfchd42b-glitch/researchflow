import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'researchflow_studies';

const DESIGNS = ['Randomised Controlled Trial','Cohort Study','Case-Control','Cross-sectional','Systematic Review','Meta-analysis','Qualitative','Mixed Methods','Other'];
const STATUSES = ['Planning','Data Collection','Data Cleaning','Analysis','Writing','Submitted','Published'];
const STATUS_COLORS: Record<string,string> = {
  'Planning':        '#9c27b0',
  'Data Collection': '#2196f3',
  'Data Cleaning':   '#ff9800',
  'Analysis':        '#C0533A',
  'Writing':         '#5A8A6A',
  'Submitted':       '#00897b',
  'Published':       '#1C2B3A',
};

const TOOLS = [
  { label: 'Sample Size',       path: '/samplesize',   icon: '🔢', phase: 'Planning'        },
  { label: 'Protocol',          path: '/student',      icon: '📋', phase: 'Planning'        },
  { label: 'Cohort Builder',    path: '/cohort',       icon: '👥', phase: 'Planning'        },
  { label: 'Data Cleaning',     path: '/clean',        icon: '🧹', phase: 'Data Cleaning'   },
  { label: 'Codebook',          path: '/codebook',     icon: '📖', phase: 'Data Cleaning'   },
  { label: 'Versioning',        path: '/versioning',   icon: '🗂️', phase: 'Data Cleaning'   },
  { label: 'Descriptive Stats', path: '/descriptive',  icon: '📊', phase: 'Analysis'        },
  { label: 'Guided Analysis',   path: '/guided',       icon: '🔬', phase: 'Analysis'        },
  { label: 'PSM',               path: '/psm',          icon: '⚖️', phase: 'Analysis'        },
  { label: 'Survival',          path: '/survival',     icon: '⏱️', phase: 'Analysis'        },
  { label: 'Forest Plot',       path: '/forest-plot',  icon: '🌲', phase: 'Analysis'        },
  { label: 'Visualise',         path: '/visualise',    icon: '📈', phase: 'Analysis'        },
  { label: 'Syntax Export',     path: '/syntax',       icon: '💻', phase: 'Analysis'        },
  { label: 'Journal Assistant', path: '/journal-assistant', icon: '📰', phase: 'Writing'   },
  { label: 'AI Assistant',      path: '/ai-assistant', icon: '🤖', phase: 'Writing'         },
  { label: 'PRISMA',            path: '/prisma',       icon: '🔷', phase: 'Writing'         },
  { label: 'Literature Review', path: '/literature',   icon: '📚', phase: 'Writing'         },
  { label: 'Audit Trail',       path: '/audit',        icon: '🔍', phase: 'Writing'         },
  { label: 'Collaboration',     path: '/collaborate',  icon: '👥', phase: 'Writing'         },
];

type Study = {
  id:          string;
  title:       string;
  design:      string;
  country:     string;
  pi:          string;
  status:      string;
  outcome:     string;
  sample_size: number;
  start_date:  string;
  end_date:    string;
  description: string;
  created_at:  string;
  progress:    number;
  pinned_tools: string[];
  notes:       string;
  tags:        string[];
};

function emptyStudy(): Study {
  return {
    id:           Date.now().toString(),
    title:        '',
    design:       'Cohort Study',
    country:      '',
    pi:           '',
    status:       'Planning',
    outcome:      '',
    sample_size:  0,
    start_date:   new Date().toISOString().split('T')[0],
    end_date:     '',
    description:  '',
    created_at:   new Date().toISOString(),
    progress:     0,
    pinned_tools: ['/descriptive', '/guided', '/journal-assistant'],
    notes:        '',
    tags:         [],
  };
}

export default function StudyDashboard() {
  const navigate                        = useNavigate();
  const [studies, setStudies]           = useState<Study[]>([]);
  const [activeStudy, setActiveStudy]   = useState<Study | null>(null);
  const [showCreate, setShowCreate]     = useState(false);
  const [showEdit, setShowEdit]         = useState(false);
  const [form, setForm]                 = useState<Study>(emptyStudy());
  const [activeTab, setActiveTab]       = useState('overview');
  const [saved, setSaved]               = useState(false);
  const [tagInput, setTagInput]         = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setStudies(parsed);
        if (parsed.length > 0) setActiveStudy(parsed[0]);
      }
    } catch (e) {}
  }, []);

  function save(updated: Study[]) {
    setStudies(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch (e) {}
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function createStudy() {
    if (!form.title) return;
    const s = { ...form, id: Date.now().toString(), created_at: new Date().toISOString() };
    const updated = [...studies, s];
    save(updated);
    setActiveStudy(s);
    setShowCreate(false);
    setForm(emptyStudy());
  }

  function updateStudy() {
    const updated = studies.map(s => s.id === form.id ? form : s);
    save(updated);
    setActiveStudy(form);
    setShowEdit(false);
  }

  function deleteStudy(id: string) {
    if (!window.confirm('Delete this study?')) return;
    const updated = studies.filter(s => s.id !== id);
    save(updated);
    setActiveStudy(updated[0] || null);
  }

  function updateProgress(id: string, progress: number) {
    const updated = studies.map(s => s.id === id ? { ...s, progress } : s);
    save(updated);
    setActiveStudy(prev => prev?.id === id ? { ...prev, progress } : prev);
  }

  function togglePinnedTool(path: string) {
    if (!activeStudy) return;
    const pinned = activeStudy.pinned_tools.includes(path)
      ? activeStudy.pinned_tools.filter(p => p !== path)
      : [...activeStudy.pinned_tools, path];
    const updated = studies.map(s => s.id === activeStudy.id ? { ...s, pinned_tools: pinned } : s);
    save(updated);
    setActiveStudy(prev => prev ? { ...prev, pinned_tools: pinned } : prev);
  }

  function addTag() {
    if (!tagInput.trim() || !activeStudy) return;
    const tags = [...activeStudy.tags, tagInput.trim()];
    const updated = studies.map(s => s.id === activeStudy.id ? { ...s, tags } : s);
    save(updated);
    setActiveStudy(prev => prev ? { ...prev, tags } : prev);
    setTagInput('');
  }

  function removeTag(tag: string) {
    if (!activeStudy) return;
    const tags = activeStudy.tags.filter(t => t !== tag);
    const updated = studies.map(s => s.id === activeStudy.id ? { ...s, tags } : s);
    save(updated);
    setActiveStudy(prev => prev ? { ...prev, tags } : prev);
  }

  function saveNotes(notes: string) {
    if (!activeStudy) return;
    const updated = studies.map(s => s.id === activeStudy.id ? { ...s, notes } : s);
    save(updated);
    setActiveStudy(prev => prev ? { ...prev, notes } : prev);
  }

  function StudyForm({ onSubmit, onCancel }: { onSubmit: () => void, onCancel: () => void }) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ width: 600, maxWidth: '95vw' }}>
          <h2>{showCreate ? 'Create New Study' : 'Edit Study'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>STUDY TITLE *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. CHW Intervention Study Tanzania 2024"
                style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>DESCRIPTION</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Brief overview of the study"
                style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.85rem', minHeight: 60 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>STUDY DESIGN</label>
              <select value={form.design} onChange={e => setForm(p => ({ ...p, design: e.target.value }))}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }}>
                {DESIGNS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>STATUS</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>COUNTRY / SETTING</label>
              <input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                placeholder="e.g. Rural Tanzania"
                style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>PRINCIPAL INVESTIGATOR</label>
              <input value={form.pi} onChange={e => setForm(p => ({ ...p, pi: e.target.value }))}
                placeholder="Dr. Jane Smith"
                style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>PRIMARY OUTCOME</label>
              <input value={form.outcome} onChange={e => setForm(p => ({ ...p, outcome: e.target.value }))}
                placeholder="e.g. Under-5 mortality"
                style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>TARGET SAMPLE SIZE</label>
              <input type="number" value={form.sample_size} onChange={e => setForm(p => ({ ...p, sample_size: parseInt(e.target.value)||0 }))}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>START DATE</label>
              <input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>END DATE</label>
              <input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button className="btn btn-primary" onClick={onSubmit} disabled={!form.title}>
              {showCreate ? 'Create Study' : 'Save Changes'}
            </button>
            <button className="btn" style={{ background: '#eee', color: '#444' }} onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  const phasedTools = (phase: string) => TOOLS.filter(t => t.phase === phase);
  const allPhases   = ['Planning','Data Collection','Data Cleaning','Analysis','Writing'];

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ color: '#1C2B3A', marginBottom: 0 }}>Study Dashboard</h1>
          <p style={{ marginBottom: 0, fontSize: '0.88rem', color: '#888' }}>
            Manage all your research studies in one place
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {saved && <span style={{ color: '#5A8A6A', fontSize: '0.82rem' }}>✓ Saved</span>}
          <button className="btn btn-primary" onClick={() => { setForm(emptyStudy()); setShowCreate(true); }}>
            + New Study
          </button>
        </div>
      </div>

      {showCreate && <StudyForm onSubmit={createStudy} onCancel={() => setShowCreate(false)} />}
      {showEdit   && <StudyForm onSubmit={updateStudy} onCancel={() => setShowEdit(false)} />}

      {studies.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔬</div>
          <h2>No Studies Yet</h2>
          <p style={{ color: '#888', marginBottom: '1.5rem' }}>
            Create your first study to get a dedicated dashboard with all ResearchFlow tools organised by phase.
          </p>
          <button className="btn btn-primary" onClick={() => { setForm(emptyStudy()); setShowCreate(true); }}>
            + Create First Study
          </button>
        </div>
      )}

      {studies.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem' }}>

          {/* STUDY LIST */}
          <div>
            <div className="card" style={{ padding: '1rem' }}>
              <h3 style={{ fontSize: '0.82rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.75rem' }}>
                Studies ({studies.length})
              </h3>
              {studies.map(study => (
                <div key={study.id} onClick={() => { setActiveStudy(study); setActiveTab('overview'); }}
                  style={{ padding: '0.75rem', borderRadius: 8, cursor: 'pointer', marginBottom: '0.5rem',
                    background: activeStudy?.id === study.id ? '#fff5f3' : 'transparent',
                    border: '1px solid ' + (activeStudy?.id === study.id ? '#C0533A' : '#eee'),
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ fontWeight: 700, color: activeStudy?.id === study.id ? '#C0533A' : '#1C2B3A', marginBottom: 2, fontSize: '0.88rem', lineHeight: 1.3 }}>
                      {study.title}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ padding: '0.1rem 0.45rem', borderRadius: 8, fontSize: '0.68rem', fontWeight: 700,
                      background: (STATUS_COLORS[study.status] || '#888') + '22',
                      color: STATUS_COLORS[study.status] || '#888' }}>
                      {study.status}
                    </span>
                    {study.country && (
                      <span style={{ fontSize: '0.68rem', color: '#aaa' }}>📍 {study.country}</span>
                    )}
                  </div>
                  <div style={{ background: '#eee', borderRadius: 4, height: 4 }}>
                    <div style={{ background: STATUS_COLORS[study.status] || '#888', borderRadius: 4, height: 4, width: `${study.progress}%`, transition: 'width 0.3s' }} />
                  </div>
                  <p style={{ fontSize: '0.68rem', color: '#aaa', marginBottom: 0, marginTop: 2 }}>{study.progress}% complete</p>
                </div>
              ))}
            </div>
          </div>

          {/* STUDY DETAIL */}
          {activeStudy && (
            <div>
              {/* HEADER */}
              <div className="card" style={{ marginBottom: '1rem', borderTop: `4px solid ${STATUS_COLORS[activeStudy.status] || '#888'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ marginBottom: 4 }}>{activeStudy.title}</h2>
                    {activeStudy.description && <p style={{ color: '#888', fontSize: '0.88rem', marginBottom: 6 }}>{activeStudy.description}</p>}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700,
                        background: (STATUS_COLORS[activeStudy.status] || '#888') + '22',
                        color: STATUS_COLORS[activeStudy.status] || '#888' }}>
                        {activeStudy.status}
                      </span>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: 10, fontSize: '0.75rem', background: '#f0f0f0', color: '#555' }}>
                        {activeStudy.design}
                      </span>
                      {activeStudy.country && (
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: 10, fontSize: '0.75rem', background: '#f0f0f0', color: '#555' }}>
                          📍 {activeStudy.country}
                        </span>
                      )}
                      {activeStudy.tags.map(tag => (
                        <span key={tag} onClick={() => removeTag(tag)} style={{ padding: '0.2rem 0.6rem', borderRadius: 10, fontSize: '0.72rem', background: '#fff5f3', color: '#C0533A', cursor: 'pointer' }}>
                          {tag} ×
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button className="btn" style={{ background: '#eee', color: '#555', fontSize: '0.82rem' }}
                      onClick={() => { setForm({ ...activeStudy }); setShowEdit(true); }}>
                      ✏️ Edit
                    </button>
                    <button className="btn" style={{ background: '#fff5f5', color: '#f44336', fontSize: '0.82rem' }}
                      onClick={() => deleteStudy(activeStudy.id)}>
                      Delete
                    </button>
                  </div>
                </div>

                {/* PROGRESS SLIDER */}
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.78rem', color: '#888' }}>Overall Progress</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: STATUS_COLORS[activeStudy.status] }}>{activeStudy.progress}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={activeStudy.progress}
                    onChange={e => updateProgress(activeStudy.id, parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: STATUS_COLORS[activeStudy.status] || '#C0533A' }} />
                </div>
              </div>

              {/* TABS */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'overview', label: '📊 Overview'    },
                  { id: 'tools',    label: '🔧 Tools'        },
                  { id: 'notes',    label: '📝 Notes'        },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="btn" style={{
                    background: activeTab === tab.id ? '#1C2B3A' : '#eee',
                    color:      activeTab === tab.id ? 'white'   : '#444',
                    padding: '0.5rem 1rem', fontSize: '0.85rem',
                  }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                    {[
                      { label: 'Principal Investigator', value: activeStudy.pi || '—',           icon: '👩‍🔬' },
                      { label: 'Sample Size',            value: activeStudy.sample_size > 0 ? activeStudy.sample_size.toLocaleString() : '—', icon: '👥' },
                      { label: 'Primary Outcome',        value: activeStudy.outcome || '—',       icon: '🎯' },
                    ].map(item => (
                      <div key={item.label} className="card" style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{item.icon}</div>
                        <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>{item.value}</p>
                        <p style={{ fontSize: '0.72rem', color: '#888', marginBottom: 0 }}>{item.label}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div className="card">
                      <h2>Timeline</h2>
                      {[
                        { label: 'Start Date', value: activeStudy.start_date ? new Date(activeStudy.start_date).toLocaleDateString() : '—' },
                        { label: 'End Date',   value: activeStudy.end_date   ? new Date(activeStudy.end_date).toLocaleDateString()   : '—' },
                        { label: 'Duration',   value: activeStudy.start_date && activeStudy.end_date
                          ? Math.ceil((new Date(activeStudy.end_date).getTime() - new Date(activeStudy.start_date).getTime()) / (1000*60*60*24*30)) + ' months'
                          : '—' },
                        { label: 'Created',    value: new Date(activeStudy.created_at).toLocaleDateString() },
                      ].map(item => (
                        <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.85rem' }}>
                          <span style={{ color: '#888' }}>{item.label}</span>
                          <span style={{ fontWeight: 600 }}>{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="card">
                      <h2>Pinned Tools</h2>
                      {activeStudy.pinned_tools.length === 0 && (
                        <p style={{ color: '#888', fontSize: '0.85rem' }}>No tools pinned. Go to Tools tab to pin.</p>
                      )}
                      {activeStudy.pinned_tools.map(path => {
                        const tool = TOOLS.find(t => t.path === path);
                        return tool ? (
                          <div key={path} onClick={() => navigate(path)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: 6, cursor: 'pointer', marginBottom: 4, background: '#f8f7f4' }}
                            onMouseOver={e => e.currentTarget.style.background = '#fff5f3'}
                            onMouseOut={e  => e.currentTarget.style.background = '#f8f7f4'}>
                            <span style={{ fontSize: '1.1rem' }}>{tool.icon}</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{tool.label}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>

                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h2 style={{ marginBottom: 0 }}>Tags</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      {activeStudy.tags.map(tag => (
                        <span key={tag} onClick={() => removeTag(tag)}
                          style={{ padding: '0.25rem 0.6rem', borderRadius: 10, background: '#fff5f3', color: '#C0533A', fontSize: '0.82rem', cursor: 'pointer', border: '1px solid #C0533A44' }}>
                          {tag} ×
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && addTag()}
                        placeholder="Add tag (e.g. HIV, RCT, Kenya)..."
                        style={{ flex: 1, padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.85rem' }} />
                      <button className="btn btn-sage" onClick={addTag} style={{ fontSize: '0.82rem' }}>Add</button>
                    </div>
                  </div>
                </div>
              )}

              {/* TOOLS TAB */}
              {activeTab === 'tools' && (
                <div>
                  {allPhases.map(phase => (
                    <div key={phase} className="card" style={{ marginBottom: '1rem' }}>
                      <h2 style={{ color: STATUS_COLORS[phase] || '#1C2B3A', marginBottom: '0.75rem' }}>
                        {phase}
                      </h2>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem' }}>
                        {phasedTools(phase).map(tool => {
                          const isPinned = activeStudy.pinned_tools.includes(tool.path);
                          return (
                            <div key={tool.path} style={{
                              border: '1px solid ' + (isPinned ? '#C0533A' : '#eee'),
                              borderRadius: 8, padding: '0.75rem', background: isPinned ? '#fff5f3' : '#f8f7f4',
                              position: 'relative',
                            }}>
                              <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{tool.icon}</div>
                              <p style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 6, color: '#1C2B3A' }}>{tool.label}</p>
                              <div style={{ display: 'flex', gap: '0.3rem' }}>
                                <button onClick={() => navigate(tool.path)} className="btn" style={{ flex: 1, padding: '0.3rem', fontSize: '0.7rem', background: '#1C2B3A', color: 'white' }}>
                                  Open
                                </button>
                                <button onClick={() => togglePinnedTool(tool.path)} style={{
                                  padding: '0.3rem 0.5rem', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: '0.7rem',
                                  background: isPinned ? '#C0533A' : '#eee',
                                  color: isPinned ? 'white' : '#888',
                                }}>
                                  {isPinned ? '📌' : '📍'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* NOTES TAB */}
              {activeTab === 'notes' && (
                <div className="card">
                  <h2>Study Notes</h2>
                  <textarea
                    value={activeStudy.notes}
                    onChange={e => saveNotes(e.target.value)}
                    placeholder="Add notes, decisions, protocol changes, meeting minutes, important findings..."
                    style={{ width: '100%', minHeight: 400, padding: '0.75rem', borderRadius: 8, border: '1px solid #ccc', fontSize: '0.9rem', lineHeight: 1.7, resize: 'vertical' }} />
                  <p style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: 0, marginTop: 6 }}>Auto-saved as you type</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
