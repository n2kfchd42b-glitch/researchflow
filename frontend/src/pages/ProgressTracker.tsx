import React, { useState, useEffect } from 'react';

const PHASES = [
  {
    id:    'protocol',
    label: 'Protocol',
    icon:  '📋',
    color: '#9c27b0',
    tasks: [
      'Define research question and objectives',
      'Choose study design',
      'Write study protocol',
      'Calculate sample size',
      'Submit ethics application',
      'Receive ethics approval',
      'Register study (ClinicalTrials / ISRCTN)',
      'Develop data collection tools',
    ],
  },
  {
    id:    'data_collection',
    label: 'Data Collection',
    icon:  '📊',
    color: '#2196f3',
    tasks: [
      'Train data collectors',
      'Pilot test data collection tools',
      'Begin data collection',
      'Monitor data quality weekly',
      'Reach target sample size',
      'Close data collection',
      'Export raw data',
    ],
  },
  {
    id:    'data_cleaning',
    label: 'Data Cleaning',
    icon:  '🧹',
    color: '#ff9800',
    tasks: [
      'Check for duplicates',
      'Assess missing data',
      'Handle outliers',
      'Recode variables',
      'Create derived variables',
      'Document all cleaning steps',
      'Save clean dataset',
      'Verify data with co-investigator',
    ],
  },
  {
    id:    'analysis',
    label: 'Analysis',
    icon:  '🔬',
    color: '#C0533A',
    tasks: [
      'Descriptive statistics (Table 1)',
      'Check assumptions for main analysis',
      'Run primary analysis',
      'Run secondary analyses',
      'Sensitivity analyses',
      'Subgroup analyses',
      'Peer review of analysis code',
      'Interpret results',
    ],
  },
  {
    id:    'writing',
    label: 'Writing',
    icon:  '✍️',
    color: '#5A8A6A',
    tasks: [
      'Write Introduction',
      'Write Methods section',
      'Write Results section',
      'Create tables and figures',
      'Write Discussion',
      'Write Abstract',
      'Internal review by co-authors',
      'Revise based on feedback',
    ],
  },
  {
    id:    'submission',
    label: 'Submission',
    icon:  '📨',
    color: '#1C2B3A',
    tasks: [
      'Choose target journal',
      'Format manuscript to journal guidelines',
      'Complete CONSORT / STROBE checklist',
      'Prepare cover letter',
      'Upload supplementary materials',
      'Submit manuscript',
      'Respond to reviewer comments',
      'Final acceptance',
    ],
  },
];

const STORAGE_KEY = 'researchflow_progress';

type ProjectData = {
  title:        string;
  description:  string;
  start_date:   string;
  target_date:  string;
  completed:    Record<string, boolean>;
  notes:        Record<string, string>;
  phase_dates:  Record<string, string>;
  created_at:   string;
};

function emptyProject(): ProjectData {
  return {
    title:       'My Research Study',
    description: '',
    start_date:  new Date().toISOString().split('T')[0],
    target_date: '',
    completed:   {},
    notes:       {},
    phase_dates: {},
    created_at:  new Date().toISOString(),
  };
}

export default function ProgressTracker() {
  const [project, setProject]       = useState<ProjectData>(emptyProject());
  const [activePhase, setActivePhase] = useState('protocol');
  const [editingTitle, setEditingTitle] = useState(false);
  const [showNotes, setShowNotes]   = useState<string|null>(null);
  const [noteText, setNoteText]     = useState('');
  const [saved, setSaved]           = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setProject(JSON.parse(stored));
    } catch (e) {}
  }, []);

  function save(updated: ProjectData) {
    setProject(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {}
  }

  function toggleTask(phaseId: string, task: string) {
    const key = `${phaseId}__${task}`;
    const updated = {
      ...project,
      completed: { ...project.completed, [key]: !project.completed[key] }
    };
    save(updated);
  }

  function saveNote(phaseId: string) {
    const updated = {
      ...project,
      notes: { ...project.notes, [phaseId]: noteText }
    };
    save(updated);
    setShowNotes(null);
  }

  function setPhaseDate(phaseId: string, date: string) {
    const updated = {
      ...project,
      phase_dates: { ...project.phase_dates, [phaseId]: date }
    };
    save(updated);
  }

  function resetProject() {
    if (window.confirm('Reset all progress? This cannot be undone.')) {
      const fresh = emptyProject();
      save(fresh);
    }
  }

  function getPhaseProgress(phaseId: string) {
    const phase = PHASES.find(p => p.id === phaseId)!;
    const done  = phase.tasks.filter(t => project.completed[`${phaseId}__${t}`]).length;
    return { done, total: phase.tasks.length, pct: Math.round(done / phase.tasks.length * 100) };
  }

  function getTotalProgress() {
    const allTasks = PHASES.flatMap(p => p.tasks.map(t => `${p.id}__${t}`));
    const done     = allTasks.filter(k => project.completed[k]).length;
    return Math.round(done / allTasks.length * 100);
  }

  function getCurrentPhase() {
    for (const phase of PHASES) {
      const { pct } = getPhaseProgress(phase.id);
      if (pct < 100) return phase;
    }
    return PHASES[PHASES.length - 1];
  }

  const totalPct    = getTotalProgress();
  const currentPhase = getCurrentPhase();
  const activePhaseData = PHASES.find(p => p.id === activePhase)!;
  const activeProgress  = getPhaseProgress(activePhase);

  function daysUntil(dateStr: string) {
    if (!dateStr) return null;
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
    return diff;
  }

  const daysLeft = project.target_date ? daysUntil(project.target_date) : null;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1 }}>
          {editingTitle ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: 4 }}>
              <input value={project.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProject((p: ProjectData) => ({ ...p, title: e.target.value }))}
                onBlur={() => { save(project); setEditingTitle(false); }}
                autoFocus
                style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1C2B3A', border: 'none', borderBottom: '2px solid #C0533A', outline: 'none', background: 'transparent', width: '100%' }} />
            </div>
          ) : (
            <h1 style={{ color: '#1C2B3A', marginBottom: 4, cursor: 'pointer' }} onClick={() => setEditingTitle(true)}>
              {project.title} <span style={{ fontSize: '0.9rem', color: '#aaa' }}>✏️</span>
            </h1>
          )}
          <input value={project.description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => save({ ...project, description: e.target.value })}
            placeholder="Add a description..."
            style={{ border: 'none', outline: 'none', color: '#888', fontSize: '0.9rem', background: 'transparent', width: '100%' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {saved && <span style={{ color: '#5A8A6A', fontSize: '0.82rem' }}>✓ Saved</span>}
          <button className="btn" style={{ background: '#eee', color: '#888', fontSize: '0.78rem', padding: '0.4rem 0.8rem' }} onClick={resetProject}>
            Reset
          </button>
        </div>
      </div>

      {/* OVERVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '1rem', borderTop: '4px solid #C0533A' }}>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: '#C0533A', marginBottom: 4 }}>{totalPct}%</p>
          <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 0 }}>Overall Progress</p>
          <div style={{ background: '#eee', borderRadius: 4, height: 6, marginTop: 8 }}>
            <div style={{ background: '#C0533A', borderRadius: 4, height: 6, width: `${totalPct}%`, transition: 'width 0.3s' }} />
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
          <p style={{ fontSize: '1.4rem', marginBottom: 4 }}>{currentPhase.icon}</p>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: currentPhase.color, marginBottom: 2 }}>{currentPhase.label}</p>
          <p style={{ fontSize: '0.72rem', color: '#888', marginBottom: 0 }}>Current Phase</p>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 4 }}>Start Date</p>
          <input type="date" value={project.start_date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => save({ ...project, start_date: e.target.value })}
            style={{ border: 'none', outline: 'none', fontSize: '0.9rem', fontWeight: 700, color: '#1C2B3A', background: 'transparent', width: '100%' }} />
          <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 4, marginTop: 8 }}>Target Submission</p>
          <input type="date" value={project.target_date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => save({ ...project, target_date: e.target.value })}
            style={{ border: 'none', outline: 'none', fontSize: '0.9rem', fontWeight: 700, color: '#1C2B3A', background: 'transparent', width: '100%' }} />
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1rem', borderTop: daysLeft !== null && daysLeft < 30 ? '4px solid #f44336' : '4px solid #5A8A6A' }}>
          {daysLeft !== null ? (
            <>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: daysLeft < 30 ? '#f44336' : '#5A8A6A', marginBottom: 4 }}>
                {daysLeft < 0 ? 'Overdue' : daysLeft}
              </p>
              <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 0 }}>
                {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : 'Days remaining'}
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: '1.5rem', marginBottom: 4 }}>📅</p>
              <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 0 }}>Set target date</p>
            </>
          )}
        </div>
      </div>

      {/* PHASE OVERVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {PHASES.map(phase => {
          const { done, total, pct } = getPhaseProgress(phase.id);
          const isActive = activePhase === phase.id;
          return (
            <div key={phase.id} onClick={() => setActivePhase(phase.id)} style={{
              padding: '0.75rem 0.5rem', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
              background: isActive ? phase.color : 'white',
              border: '2px solid ' + (isActive ? phase.color : '#eee'),
              transition: 'all 0.2s',
            }}>
              <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{phase.icon}</div>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: isActive ? 'white' : phase.color, marginBottom: 4 }}>{phase.label}</p>
              <p style={{ fontSize: '0.68rem', color: isActive ? 'rgba(255,255,255,0.8)' : '#888', marginBottom: 4 }}>{done}/{total}</p>
              <div style={{ background: isActive ? 'rgba(255,255,255,0.3)' : '#eee', borderRadius: 4, height: 4 }}>
                <div style={{ background: isActive ? 'white' : phase.color, borderRadius: 4, height: 4, width: `${pct}%`, transition: 'width 0.3s' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ACTIVE PHASE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.8rem' }}>{activePhaseData.icon}</span>
              <div>
                <h2 style={{ color: activePhaseData.color, marginBottom: 2 }}>{activePhaseData.label} Phase</h2>
                <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: 0 }}>
                  {activeProgress.done} of {activeProgress.total} tasks completed ({activeProgress.pct}%)
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="date" value={project.phase_dates[activePhase] || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhaseDate(activePhase, e.target.value)}
                style={{ padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.78rem' }}
                title="Target date for this phase" />
              <button className="btn" style={{ background: '#eee', color: '#555', fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
                onClick={() => { setNoteText(project.notes[activePhase] || ''); setShowNotes(activePhase); }}>
                📝 Notes
              </button>
            </div>
          </div>

          <div style={{ background: '#eee', borderRadius: 6, height: 8, marginBottom: '1.25rem' }}>
            <div style={{ background: activePhaseData.color, borderRadius: 6, height: 8, width: `${activeProgress.pct}%`, transition: 'width 0.3s' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {activePhaseData.tasks.map((task, i) => {
              const key     = `${activePhase}__${task}`;
              const isDone  = !!project.completed[key];
              return (
                <div key={i} onClick={() => toggleTask(activePhase, task)} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem', borderRadius: 8, cursor: 'pointer',
                  background: isDone ? activePhaseData.color + '11' : '#f8f7f4',
                  border: '1px solid ' + (isDone ? activePhaseData.color + '44' : '#eee'),
                  transition: 'all 0.15s',
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: isDone ? activePhaseData.color : 'white',
                    border: '2px solid ' + (isDone ? activePhaseData.color : '#ccc'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isDone && <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: '0.9rem', color: isDone ? '#888' : '#333', textDecoration: isDone ? 'line-through' : 'none', flex: 1 }}>
                    {task}
                  </span>
                  {isDone && <span style={{ fontSize: '0.72rem', color: activePhaseData.color, fontWeight: 700 }}>Done</span>}
                </div>
              );
            })}
          </div>

          {project.notes[activePhase] && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fff9e6', borderRadius: 8, border: '1px solid #ffe082' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f57f17', marginBottom: 4 }}>📝 Notes</p>
              <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: 0, whiteSpace: 'pre-line' }}>{project.notes[activePhase]}</p>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <h2>All Phases</h2>
            {PHASES.map(phase => {
              const { done, total, pct } = getPhaseProgress(phase.id);
              return (
                <div key={phase.id} onClick={() => setActivePhase(phase.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>
                  <span style={{ fontSize: '1.1rem' }}>{phase.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: phase.color }}>{phase.label}</span>
                      <span style={{ fontSize: '0.72rem', color: '#888' }}>{done}/{total}</span>
                    </div>
                    <div style={{ background: '#eee', borderRadius: 4, height: 5 }}>
                      <div style={{ background: phase.color, borderRadius: 4, height: 5, width: `${pct}%` }} />
                    </div>
                  </div>
                  {pct === 100 && <span style={{ color: '#5A8A6A' }}>✅</span>}
                </div>
              );
            })}
          </div>

          <div className="card">
            <h2>ResearchFlow Tools</h2>
            <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.75rem' }}>Tools for current phase:</p>
            {activePhase === 'protocol' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {[
                  { label: '🔢 Sample Size Calculator', path: '/samplesize' },
                  { label: '📋 Protocol Intelligence',  path: '/student' },
                ].map(t => (
                  <a key={t.path} href={t.path} style={{ padding: '0.5rem 0.75rem', background: '#f8f7f4', borderRadius: 6, fontSize: '0.82rem', color: '#1C2B3A', textDecoration: 'none', fontWeight: 600 }}>
                    {t.label}
                  </a>
                ))}
              </div>
            )}
            {activePhase === 'data_cleaning' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {[
                  { label: '🧹 Data Cleaning Studio', path: '/clean' },
                  { label: '🌐 Instrument Recognition', path: '/instrument' },
                ].map(t => (
                  <a key={t.path} href={t.path} style={{ padding: '0.5rem 0.75rem', background: '#f8f7f4', borderRadius: 6, fontSize: '0.82rem', color: '#1C2B3A', textDecoration: 'none', fontWeight: 600 }}>
                    {t.label}
                  </a>
                ))}
              </div>
            )}
            {activePhase === 'analysis' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {[
                  { label: '🔬 Guided Analysis', path: '/guided' },
                  { label: '📊 Descriptive Stats', path: '/descriptive' },
                  { label: '⚖️ PSM',               path: '/psm' },
                  { label: '⏱️ Survival Analysis',  path: '/survival' },
                ].map(t => (
                  <a key={t.path} href={t.path} style={{ padding: '0.5rem 0.75rem', background: '#f8f7f4', borderRadius: 6, fontSize: '0.82rem', color: '#1C2B3A', textDecoration: 'none', fontWeight: 600 }}>
                    {t.label}
                  </a>
                ))}
              </div>
            )}
            {activePhase === 'writing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {[
                  { label: '📰 Journal Assistant',   path: '/journal-assistant' },
                  { label: '🤖 AI Research Chat',    path: '/ai-assistant' },
                  { label: '📈 Visualisation Studio', path: '/visualise' },
                ].map(t => (
                  <a key={t.path} href={t.path} style={{ padding: '0.5rem 0.75rem', background: '#f8f7f4', borderRadius: 6, fontSize: '0.82rem', color: '#1C2B3A', textDecoration: 'none', fontWeight: 600 }}>
                    {t.label}
                  </a>
                ))}
              </div>
            )}
            {activePhase === 'submission' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {[
                  { label: '📰 Journal Assistant', path: '/journal-assistant' },
                  { label: '📋 Audit Trail',        path: '/audit' },
                ].map(t => (
                  <a key={t.path} href={t.path} style={{ padding: '0.5rem 0.75rem', background: '#f8f7f4', borderRadius: 6, fontSize: '0.82rem', color: '#1C2B3A', textDecoration: 'none', fontWeight: 600 }}>
                    {t.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NOTES MODAL */}
      {showNotes && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: 500, maxWidth: '90vw' }}>
            <h2>Notes — {PHASES.find(p => p.id === showNotes)?.label}</h2>
            <textarea value={noteText} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNoteText(e.target.value)}
              placeholder="Add notes, decisions, blockers or reminders for this phase..."
              style={{ width: '100%', minHeight: 150, padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.9rem', marginBottom: '1rem' }} />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={() => saveNote(showNotes)}>Save Notes</button>
              <button className="btn" style={{ background: '#eee', color: '#444' }} onClick={() => setShowNotes(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
