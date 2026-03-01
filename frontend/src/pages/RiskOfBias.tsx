import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'researchflow_rob';

// ── ROB 2.0 DOMAINS ──────────────────────────────────────
const ROB2_DOMAINS = [
  {
    id: 'randomisation',
    label: 'D1: Randomisation process',
    questions: [
      'Was the allocation sequence random?',
      'Was the allocation sequence concealed until participants enrolled?',
      'Did baseline differences suggest a problem with randomisation?',
    ],
  },
  {
    id: 'deviations',
    label: 'D2: Deviations from intended interventions',
    questions: [
      'Were participants aware of their assigned intervention?',
      'Were carers/personnel aware of assigned intervention?',
      'Were there deviations from intended intervention that arose because of the trial context?',
    ],
  },
  {
    id: 'missing_data',
    label: 'D3: Missing outcome data',
    questions: [
      'Were data for this outcome available for all randomised participants?',
      'Is there evidence that the result was not biased by missing outcome data?',
      'Could missingness in the outcome depend on its true value?',
    ],
  },
  {
    id: 'measurement',
    label: 'D4: Measurement of the outcome',
    questions: [
      'Was the method for measuring the outcome inappropriate?',
      'Could measurement of the outcome have differed between groups?',
      'Were outcome assessors aware of the intervention received by study participants?',
    ],
  },
  {
    id: 'reporting',
    label: 'D5: Selection of reported results',
    questions: [
      'Were the trial analyses likely pre-specified?',
      'Is the reported outcome likely to have been selected from multiple outcomes?',
      'Is the reported analysis likely selected from multiple analyses?',
    ],
  },
];

// ── ROBINS-I DOMAINS ─────────────────────────────────────
const ROBINSI_DOMAINS = [
  { id: 'confounding',  label: 'D1: Confounding',                    questions: ['Were there important confounders?', 'Did the study control for all important confounders?', 'Were confounders measured validly and reliably?'] },
  { id: 'selection',    label: 'D2: Selection of participants',       questions: ['Was selection of participants based on participant characteristics post-exposure?', 'Were there deviations due to selection?'] },
  { id: 'classification',label: 'D3: Classification of interventions',questions: ['Were intervention groups clearly defined?', 'Was information used to classify interventions reliable?'] },
  { id: 'deviations',   label: 'D4: Deviations from interventions',   questions: ['Were there deviations from intended interventions?', 'Were these deviations likely to affect the outcome?'] },
  { id: 'missing',      label: 'D5: Missing data',                    questions: ['Were data complete for all participants?', 'Was missingness related to predictors or outcomes?'] },
  { id: 'measurement',  label: 'D6: Measurement of outcomes',         questions: ['Was the outcome measured appropriately?', 'Could measurement have differed between groups?'] },
  { id: 'reporting',    label: 'D7: Selection of reported results',   questions: ['Was the reported outcome prespecified?', 'Was the analysis prespecified?'] },
];

// ── NOS DOMAINS ──────────────────────────────────────────
const NOS_COHORT = [
  { id: 'representativeness', label: 'Selection: Representativeness of exposed cohort',   max: 1 },
  { id: 'selection_non',      label: 'Selection: Selection of non-exposed cohort',         max: 1 },
  { id: 'ascertainment',      label: 'Selection: Ascertainment of exposure',               max: 1 },
  { id: 'outcome_absent',     label: 'Selection: Outcome not present at start',            max: 1 },
  { id: 'comparability',      label: 'Comparability: Comparability of cohorts',            max: 2 },
  { id: 'assessment',         label: 'Outcome: Assessment of outcome',                     max: 1 },
  { id: 'follow_up_length',   label: 'Outcome: Follow-up long enough',                     max: 1 },
  { id: 'follow_up_adequacy', label: 'Outcome: Adequacy of follow-up',                     max: 1 },
];

const JUDGEMENTS = ['Low', 'Some Concerns', 'High', 'No Information'];
const JUDGEMENT_COLORS: Record<string, string> = {
  'Low':             '#4caf50',
  'Some Concerns':   '#ff9800',
  'High':            '#f44336',
  'No Information':  '#9e9e9e',
};
const JUDGEMENT_ICONS: Record<string, string> = {
  'Low':             '🟢',
  'Some Concerns':   '🟡',
  'High':            '🔴',
  'No Information':  '⚪',
};

type Assessment = {
  id:         string;
  study:      string;
  authors:    string;
  year:       number;
  tool:       'rob2' | 'robinsi' | 'nos';
  domains:    Record<string, string>;
  notes:      Record<string, string>;
  overall:    string;
  created_at: string;
};

function emptyAssessment(tool: 'rob2' | 'robinsi' | 'nos'): Assessment {
  return {
    id:         Date.now().toString(),
    study:      '',
    authors:    '',
    year:       new Date().getFullYear(),
    tool,
    domains:    {},
    notes:      {},
    overall:    'Some Concerns',
    created_at: new Date().toISOString(),
  };
}

export default function RiskOfBias() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [active, setActive]           = useState<Assessment | null>(null);
  const [showAdd, setShowAdd]         = useState(false);
  const [tool, setTool]               = useState<'rob2'|'robinsi'|'nos'>('rob2');
  const [activeTab, setActiveTab]     = useState('assess');
  const [copied, setCopied]           = useState(false);
  const [form, setForm]               = useState<Assessment>(emptyAssessment('rob2'));

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setAssessments(parsed);
        if (parsed.length > 0) setActive(parsed[0]);
      }
    } catch (e) {}
  }, []);

  function save(updated: Assessment[]) {
    setAssessments(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch (e) {}
  }

  function addAssessment() {
    if (!form.study) return;
    const a = { ...form, id: Date.now().toString(), created_at: new Date().toISOString() };
    const updated = [...assessments, a];
    save(updated);
    setActive(a);
    setShowAdd(false);
    setForm(emptyAssessment(tool));
  }

  function updateDomain(id: string, domainId: string, value: string) {
    const updated = assessments.map(a => a.id === id ? { ...a, domains: { ...a.domains, [domainId]: value } } : a);
    save(updated);
    setActive(prev => prev?.id === id ? { ...prev, domains: { ...prev.domains, [domainId]: value } } : prev);
  }

  function updateNote(id: string, domainId: string, note: string) {
    const updated = assessments.map(a => a.id === id ? { ...a, notes: { ...a.notes, [domainId]: note } } : a);
    save(updated);
    setActive(prev => prev?.id === id ? { ...prev, notes: { ...prev.notes, [domainId]: note } } : prev);
  }

  function updateOverall(id: string, value: string) {
    const updated = assessments.map(a => a.id === id ? { ...a, overall: value } : a);
    save(updated);
    setActive(prev => prev?.id === id ? { ...prev, overall: value } : prev);
  }

  function deleteAssessment(id: string) {
    if (!window.confirm('Delete this assessment?')) return;
    const updated = assessments.filter(a => a.id !== id);
    save(updated);
    setActive(updated[0] || null);
  }

  function getDomains(a: Assessment) {
    if (a.tool === 'rob2')     return ROB2_DOMAINS;
    if (a.tool === 'robinsi')  return ROBINSI_DOMAINS;
    return NOS_COHORT.map(d => ({ id: d.id, label: d.label, questions: [] }));
  }

  const methodsText = assessments.length === 0 ? '' :
    `Risk of bias was assessed for ${assessments.length} included ${assessments.length === 1 ? 'study' : 'studies'} using ` +
    (assessments[0].tool === 'rob2' ? 'the Cochrane Risk of Bias tool version 2.0 (RoB 2) for randomised trials' :
     assessments[0].tool === 'robinsi' ? 'the Risk Of Bias In Non-randomised Studies of Interventions (ROBINS-I) tool' :
     'the Newcastle-Ottawa Scale (NOS)') +
    `. Overall risk of bias was judged as low for ${assessments.filter(a => a.overall === 'Low').length}, ` +
    `some concerns for ${assessments.filter(a => a.overall === 'Some Concerns').length}, ` +
    `and high for ${assessments.filter(a => a.overall === 'High').length} ${assessments.length === 1 ? 'study' : 'studies'}.`;

  function exportCSV() {
    const domains = active ? getDomains(active).map(d => d.label) : [];
    const headers = ['Study', 'Authors', 'Year', 'Tool', ...domains, 'Overall', 'Notes'];
    const rows = assessments.map(a => {
      const doms = getDomains(a).map(d => a.domains[d.id] || 'No Information');
      return [a.study, a.authors, a.year, a.tool.toUpperCase(), ...doms, a.overall, Object.values(a.notes).join(' | ')];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'risk_of_bias.csv'; a.click();
  }

  const toolLabels: Record<string, string> = {
    rob2:     'Cochrane RoB 2.0 (RCTs)',
    robinsi:  'ROBINS-I (Observational)',
    nos:      'Newcastle-Ottawa Scale',
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ color: '#1C2B3A', marginBottom: 0 }}>Risk of Bias Assessment</h1>
          <p style={{ marginBottom: 0, fontSize: '0.88rem', color: '#888' }}>
            Cochrane RoB 2.0 · ROBINS-I · Newcastle-Ottawa Scale
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyAssessment(tool)); setShowAdd(true); }}>
          + Add Study
        </button>
      </div>

      {/* ADD MODAL */}
      {showAdd && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: 500, maxWidth: '95vw' }}>
            <h2>Add Study for Assessment</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>ASSESSMENT TOOL</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['rob2','robinsi','nos'] as const).map(t => (
                  <button key={t} onClick={() => { setTool(t); setForm(emptyAssessment(t)); }}
                    className="btn" style={{ flex: 1, fontSize: '0.75rem', padding: '0.5rem',
                      background: tool === t ? '#1C2B3A' : '#eee',
                      color: tool === t ? 'white' : '#444' }}>
                    {t === 'rob2' ? 'RoB 2.0' : t === 'robinsi' ? 'ROBINS-I' : 'NOS'}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#888', marginTop: 4 }}>{toolLabels[tool]}</p>
            </div>
            {[
              { label: 'STUDY NAME / CITATION', key: 'study',   placeholder: 'Smith 2020 — CHW intervention Tanzania' },
              { label: 'AUTHORS',               key: 'authors', placeholder: 'Smith J, Jones A, et al.'                },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
              </div>
            ))}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>YEAR</label>
              <input type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: parseInt(e.target.value)||0 }))}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={addAssessment} disabled={!form.study}>Add Study</button>
              <button className="btn" style={{ background: '#eee', color: '#444' }} onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {assessments.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚦</div>
          <h2>No Assessments Yet</h2>
          <p style={{ color: '#888', marginBottom: '1.5rem' }}>
            Add studies from your systematic review to assess their risk of bias using standardised tools.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {(['rob2','robinsi','nos'] as const).map(t => (
              <button key={t} className="btn btn-primary" onClick={() => { setTool(t); setForm(emptyAssessment(t)); setShowAdd(true); }}>
                + {t === 'rob2' ? 'RoB 2.0' : t === 'robinsi' ? 'ROBINS-I' : 'NOS'}
              </button>
            ))}
          </div>
        </div>
      )}

      {assessments.length > 0 && (
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'assess',  label: '🚦 Assess'        },
              { id: 'summary', label: '📊 Summary Table'  },
              { id: 'methods', label: '📄 Methods Text'   },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="btn" style={{
                background: activeTab === tab.id ? '#1C2B3A' : '#eee',
                color:      activeTab === tab.id ? 'white'   : '#444',
                padding: '0.5rem 1.25rem',
              }}>
                {tab.label}
              </button>
            ))}
            <button className="btn" style={{ background: '#eee', color: '#444', marginLeft: 'auto' }} onClick={exportCSV}>
              ⬇️ Export CSV
            </button>
          </div>

          {/* ASSESS TAB */}
          {activeTab === 'assess' && (
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.5rem' }}>
              <div className="card" style={{ padding: '1rem' }}>
                <h3 style={{ fontSize: '0.82rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.75rem' }}>
                  Studies ({assessments.length})
                </h3>
                {assessments.map(a => (
                  <div key={a.id} onClick={() => setActive(a)}
                    style={{ padding: '0.6rem 0.75rem', borderRadius: 8, cursor: 'pointer', marginBottom: '0.4rem',
                      background: active?.id === a.id ? '#fff5f3' : 'transparent',
                      border: '1px solid ' + (active?.id === a.id ? '#C0533A' : '#eee'),
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: 2, color: active?.id === a.id ? '#C0533A' : '#1C2B3A' }}>
                        {a.study}
                      </p>
                      <span style={{ fontSize: '1rem' }}>{JUDGEMENT_ICONS[a.overall]}</span>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: '#aaa', marginBottom: 0 }}>
                      {a.tool.toUpperCase()} · {a.year}
                    </p>
                  </div>
                ))}
              </div>

              {active && (
                <div>
                  <div className="card" style={{ marginBottom: '1rem', borderTop: `4px solid ${JUDGEMENT_COLORS[active.overall]}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h2 style={{ marginBottom: 4 }}>{active.study}</h2>
                        <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: 0 }}>
                          {active.authors} · {active.year} · {toolLabels[active.tool]}
                        </p>
                      </div>
                      <button onClick={() => deleteAssessment(active.id)}
                        className="btn" style={{ background: '#fff5f5', color: '#f44336', fontSize: '0.82rem' }}>
                        Delete
                      </button>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 6 }}>
                        OVERALL JUDGEMENT
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {JUDGEMENTS.map(j => (
                          <button key={j} onClick={() => updateOverall(active.id, j)} style={{
                            padding: '0.4rem 0.9rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
                            background: active.overall === j ? JUDGEMENT_COLORS[j] : '#eee',
                            color: active.overall === j ? 'white' : '#444',
                          }}>
                            {JUDGEMENT_ICONS[j]} {j}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {getDomains(active).map(domain => (
                    <div key={domain.id} className="card" style={{ marginBottom: '0.75rem', borderLeft: `4px solid ${JUDGEMENT_COLORS[active.domains[domain.id] || 'No Information']}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '0.9rem', marginBottom: 0 }}>{domain.label}</h3>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          {JUDGEMENTS.map(j => (
                            <button key={j} onClick={() => updateDomain(active.id, domain.id, j)} style={{
                              padding: '0.25rem 0.5rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
                              background: active.domains[domain.id] === j ? JUDGEMENT_COLORS[j] : '#eee',
                              color: active.domains[domain.id] === j ? 'white' : '#666',
                            }}>
                              {JUDGEMENT_ICONS[j]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {domain.questions.length > 0 && (
                        <div style={{ marginBottom: '0.75rem' }}>
                          {domain.questions.map((q, i) => (
                            <p key={i} style={{ fontSize: '0.78rem', color: '#666', marginBottom: '0.25rem', paddingLeft: '0.75rem', borderLeft: '2px solid #eee' }}>
                              {i+1}. {q}
                            </p>
                          ))}
                        </div>
                      )}

                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#aaa', display: 'block', marginBottom: 3 }}>NOTES (optional)</label>
                        <input value={active.notes[domain.id] || ''} onChange={e => updateNote(active.id, domain.id, e.target.value)}
                          placeholder="Add justification for your judgement..."
                          style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #eee', fontSize: '0.8rem' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUMMARY TABLE */}
          {activeTab === 'summary' && (
            <div className="card">
              <h2>Risk of Bias Summary</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#1C2B3A', color: 'white' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', minWidth: 160 }}>Study</th>
                      {assessments[0] && getDomains(assessments[0]).map(d => (
                        <th key={d.id} style={{ padding: '8px 8px', textAlign: 'center', fontSize: '0.72rem', minWidth: 80 }}>
                          {d.label.split(':')[0]}
                        </th>
                      ))}
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Overall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.map((a, i) => (
                      <tr key={a.id} style={{ background: i % 2 === 0 ? '#f8f7f4' : 'white', borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                          {a.study} ({a.year})
                        </td>
                        {getDomains(a).map(d => {
                          const j = a.domains[d.id] || 'No Information';
                          return (
                            <td key={d.id} style={{ padding: '8px', textAlign: 'center' }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: JUDGEMENT_COLORS[j], margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', color: 'white', fontWeight: 700 }}>
                                {j === 'Low' ? 'L' : j === 'Some Concerns' ? 'S' : j === 'High' ? 'H' : '?'}
                              </div>
                            </td>
                          );
                        })}
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.6rem', borderRadius: 8, background: JUDGEMENT_COLORS[a.overall] + '22', color: JUDGEMENT_COLORS[a.overall], fontWeight: 700, fontSize: '0.78rem' }}>
                            {JUDGEMENT_ICONS[a.overall]} {a.overall}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                {JUDGEMENTS.slice(0,3).map(j => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: JUDGEMENT_COLORS[j] }} />
                    <span style={{ fontSize: '0.82rem' }}>{j}: {assessments.filter(a => a.overall === j).length} studies</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* METHODS TEXT */}
          {activeTab === 'methods' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Methods Text</h2>
                <button className="btn btn-sage" onClick={() => { navigator.clipboard.writeText(methodsText); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
              <div style={{ background: '#f8f7f4', borderRadius: 8, padding: '1.25rem', fontSize: '0.9rem', lineHeight: 1.8, color: '#333' }}>
                {methodsText}
              </div>
              <div className="alert alert-success" style={{ marginTop: '1rem', fontSize: '0.82rem' }}>
                <strong>References:</strong> RoB 2: Sterne JAC, et al. BMJ 2019;366:l4898 · ROBINS-I: Sterne JA, et al. BMJ 2016;355:i4919 · NOS: Wells GA, et al. Ottawa Hospital Research Institute
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
