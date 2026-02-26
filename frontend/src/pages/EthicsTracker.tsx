import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'researchflow_ethics';

type Document = {
  id: string;
  name: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'expired';
  submitted_date: string;
  approved_date: string;
  expiry_date: string;
  reference: string;
  notes: string;
};

type Submission = {
  id: string;
  title: string;
  committee: string;
  study_type: string;
  risk_level: 'minimal' | 'low' | 'moderate' | 'high';
  pi_name: string;
  institution: string;
  country: string;
  submitted_date: string;
  decision_date: string;
  approval_number: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'approved_with_conditions' | 'rejected' | 'expired';
  conditions: string;
  documents: Document[];
  amendments: Amendment[];
  created_at: string;
};

type Amendment = {
  id: string;
  title: string;
  reason: string;
  submitted_date: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:                    { label: 'Draft',                    color: '#888',    bg: '#f5f5f5' },
  submitted:                { label: 'Submitted',                color: '#2196f3', bg: '#e3f2fd' },
  under_review:             { label: 'Under Review',             color: '#ff9800', bg: '#fff3e0' },
  approved:                 { label: 'Approved',                 color: '#5A8A6A', bg: '#e8f5e9' },
  approved_with_conditions: { label: 'Approved (Conditions)',    color: '#5A8A6A', bg: '#e8f5e9' },
  rejected:                 { label: 'Rejected',                 color: '#f44336', bg: '#ffebee' },
  expired:                  { label: 'Expired',                  color: '#C0533A', bg: '#fff5f3' },
};

const RISK_COLORS: Record<string, string> = {
  minimal: '#5A8A6A',
  low:     '#2196f3',
  moderate:'#ff9800',
  high:    '#f44336',
};

const COMMITTEES = [
  'Institutional Review Board (IRB)',
  'Research Ethics Committee (REC)',
  'National Ethics Committee',
  'Hospital Ethics Committee',
  'University Research Ethics Committee',
  'Ministry of Health Ethics Board',
];

const STUDY_TYPES = [
  'RCT', 'Cohort Study', 'Case-Control', 'Cross-Sectional', 'Qualitative',
  'Mixed Methods', 'Systematic Review', 'Meta-Analysis', 'Case Report', 'Other',
];

const DOC_TEMPLATES = [
  'Protocol',
  'Informed Consent Form',
  'Patient Information Sheet',
  'Data Collection Tool',
  'CV of Principal Investigator',
  'Budget Justification',
  'Community Advisory Board Approval',
];

function emptySubmission(): Omit<Submission, 'id' | 'created_at'> {
  return {
    title:          '',
    committee:      '',
    study_type:     '',
    risk_level:     'low',
    pi_name:        '',
    institution:    '',
    country:        '',
    submitted_date: '',
    decision_date:  '',
    approval_number:'',
    status:         'draft',
    conditions:     '',
    documents:      [],
    amendments:     [],
  };
}

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function EthicsTracker() {
  const [submissions, setSubmissions]   = useState<Submission[]>([]);
  const [activeId, setActiveId]         = useState<string | null>(null);
  const [showCreate, setShowCreate]     = useState(false);
  const [showAmendment, setShowAmendment] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const [activeTab, setActiveTab]       = useState('overview');
  const [draft, setDraft]               = useState(emptySubmission());
  const [newAmend, setNewAmend]         = useState({ title: '', reason: '', submitted_date: '' });
  const [newDoc, setNewDoc]             = useState({ name: '', status: 'pending' as Document['status'], submitted_date: '', approved_date: '', expiry_date: '', reference: '', notes: '' });
  const [saved, setSaved]               = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) setSubmissions(JSON.parse(s));
    } catch (_) {}
  }, []);

  function persist(updated: Submission[]) {
    setSubmissions(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function createSubmission() {
    if (!draft.title) return;
    const sub: Submission = { ...draft, id: Date.now().toString(), created_at: new Date().toISOString() };
    const updated = [...submissions, sub];
    persist(updated);
    setActiveId(sub.id);
    setShowCreate(false);
    setDraft(emptySubmission());
    setActiveTab('overview');
  }

  function updateSubmission(id: string, changes: Partial<Submission>) {
    const updated = submissions.map(s => s.id === id ? { ...s, ...changes } : s);
    persist(updated);
  }

  function deleteSubmission(id: string) {
    if (!window.confirm('Delete this ethics submission? This cannot be undone.')) return;
    const updated = submissions.filter(s => s.id !== id);
    persist(updated);
    if (activeId === id) setActiveId(null);
  }

  function addAmendment() {
    if (!newAmend.title || !activeId) return;
    const amend: Amendment = { id: Date.now().toString(), status: 'pending', notes: '', ...newAmend };
    const sub = submissions.find(s => s.id === activeId);
    if (!sub) return;
    updateSubmission(activeId, { amendments: [...sub.amendments, amend] });
    setNewAmend({ title: '', reason: '', submitted_date: '' });
    setShowAmendment(false);
  }

  function addDocument() {
    if (!newDoc.name || !activeId) return;
    const doc: Document = { id: Date.now().toString(), ...newDoc };
    const sub = submissions.find(s => s.id === activeId);
    if (!sub) return;
    updateSubmission(activeId, { documents: [...sub.documents, doc] });
    setNewDoc({ name: '', status: 'pending', submitted_date: '', approved_date: '', expiry_date: '', reference: '', notes: '' });
    setShowDocument(false);
  }

  function updateDocStatus(docId: string, status: Document['status']) {
    if (!activeId) return;
    const sub = submissions.find(s => s.id === activeId);
    if (!sub) return;
    updateSubmission(activeId, {
      documents: sub.documents.map(d => d.id === docId ? { ...d, status } : d),
    });
  }

  const active = submissions.find(s => s.id === activeId);

  const statusCounts = {
    total:       submissions.length,
    approved:    submissions.filter(s => s.status === 'approved' || s.status === 'approved_with_conditions').length,
    pending:     submissions.filter(s => ['submitted', 'under_review', 'draft'].includes(s.status)).length,
    expiring:    submissions.filter(s => {
      const d = daysUntil(s.decision_date);
      return d !== null && d < 90 && d > 0 && (s.status === 'approved' || s.status === 'approved_with_conditions');
    }).length,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.6rem 0.75rem', borderRadius: 6,
    border: '1px solid #ddd', fontSize: '0.88rem', outline: 'none',
    background: '#fafafa',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '0.75rem', fontWeight: 700, color: '#888',
    textTransform: 'uppercase', letterSpacing: 0.5,
    display: 'block', marginBottom: 4,
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ color: '#1C2B3A', marginBottom: 4 }}>Ethics Clearance Tracker</h1>
          <p style={{ color: '#888', fontSize: '0.88rem', marginBottom: 0 }}>
            Manage IRB/REC submissions, track approvals, documents and amendments
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {saved && <span style={{ color: '#5A8A6A', fontSize: '0.82rem', fontWeight: 600 }}>✓ Saved</span>}
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + New Submission
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Submissions', value: statusCounts.total,    color: '#1C2B3A', icon: '📋' },
          { label: 'Approved',          value: statusCounts.approved,  color: '#5A8A6A', icon: '✅' },
          { label: 'Pending Review',    value: statusCounts.pending,   color: '#ff9800', icon: '⏳' },
          { label: 'Expiring (90d)',    value: statusCounts.expiring,  color: '#C0533A', icon: '⚠️' },
        ].map(item => (
          <div key={item.label} className="card" style={{ textAlign: 'center', padding: '1rem', borderTop: `3px solid ${item.color}` }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{item.icon}</div>
            <p style={{ fontSize: '1.8rem', fontWeight: 800, color: item.color, marginBottom: 2 }}>{item.value}</p>
            <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: 0 }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: 600, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.25rem' }}>New Ethics Submission</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Study Title *</label>
                <input value={draft.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(d => ({ ...d, title: e.target.value }))}
                  placeholder="Full title of your study" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Ethics Committee</label>
                <select value={draft.committee} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDraft(d => ({ ...d, committee: e.target.value }))} style={inputStyle}>
                  <option value="">Select committee...</option>
                  {COMMITTEES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Study Type</label>
                <select value={draft.study_type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDraft(d => ({ ...d, study_type: e.target.value }))} style={inputStyle}>
                  <option value="">Select type...</option>
                  {STUDY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Risk Level</label>
                <select value={draft.risk_level} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDraft(d => ({ ...d, risk_level: e.target.value as Submission['risk_level'] }))} style={inputStyle}>
                  <option value="minimal">Minimal risk</option>
                  <option value="low">Low risk</option>
                  <option value="moderate">Moderate risk</option>
                  <option value="high">High risk</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Principal Investigator</label>
                <input value={draft.pi_name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(d => ({ ...d, pi_name: e.target.value }))}
                  placeholder="Dr. Jane Smith" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Institution</label>
                <input value={draft.institution} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(d => ({ ...d, institution: e.target.value }))}
                  placeholder="University / Hospital" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Country</label>
                <input value={draft.country} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(d => ({ ...d, country: e.target.value }))}
                  placeholder="e.g. Kenya" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Submission Date</label>
                <input type="date" value={draft.submitted_date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(d => ({ ...d, submitted_date: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Initial Status</label>
                <select value={draft.status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDraft(d => ({ ...d, status: e.target.value as Submission['status'] }))} style={inputStyle}>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button className="btn btn-primary" onClick={createSubmission} disabled={!draft.title}>
                Create Submission
              </button>
              <button className="btn" style={{ background: '#eee', color: '#444' }} onClick={() => { setShowCreate(false); setDraft(emptySubmission()); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AMENDMENT MODAL */}
      {showAmendment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: 520, maxWidth: '95vw' }}>
            <h2>Submit Amendment</h2>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={labelStyle}>Amendment Title *</label>
              <input value={newAmend.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAmend(a => ({ ...a, title: e.target.value }))}
                placeholder="e.g. Protocol v2.1 – Expanded eligibility criteria" style={inputStyle} />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={labelStyle}>Reason for Amendment</label>
              <textarea value={newAmend.reason} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewAmend(a => ({ ...a, reason: e.target.value }))}
                placeholder="Describe what changed and why..." rows={3}
                style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Submission Date</label>
              <input type="date" value={newAmend.submitted_date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAmend(a => ({ ...a, submitted_date: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={addAmendment} disabled={!newAmend.title}>Add Amendment</button>
              <button className="btn" style={{ background: '#eee', color: '#444' }} onClick={() => setShowAmendment(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT MODAL */}
      {showDocument && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: 520, maxWidth: '95vw' }}>
            <h2>Add Document</h2>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={labelStyle}>Document Name *</label>
              <select value={newDoc.name} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewDoc(d => ({ ...d, name: e.target.value }))} style={inputStyle}>
                <option value="">Select template or type below...</option>
                {DOC_TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input value={newDoc.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDoc(d => ({ ...d, name: e.target.value }))}
                placeholder="Or type custom document name" style={{ ...inputStyle, marginTop: 6 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={newDoc.status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewDoc(d => ({ ...d, status: e.target.value as Document['status'] }))} style={inputStyle}>
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Reference / Version</label>
                <input value={newDoc.reference} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDoc(d => ({ ...d, reference: e.target.value }))}
                  placeholder="e.g. v2.1" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Submitted Date</label>
                <input type="date" value={newDoc.submitted_date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDoc(d => ({ ...d, submitted_date: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Approved Date</label>
                <input type="date" value={newDoc.approved_date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDoc(d => ({ ...d, approved_date: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Expiry Date</label>
                <input type="date" value={newDoc.expiry_date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDoc(d => ({ ...d, expiry_date: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Notes</label>
                <input value={newDoc.notes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDoc(d => ({ ...d, notes: e.target.value }))}
                  placeholder="Any notes..." style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={addDocument} disabled={!newDoc.name}>Add Document</button>
              <button className="btn" style={{ background: '#eee', color: '#444' }} onClick={() => setShowDocument(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>

        {/* SIDEBAR */}
        <div>
          <div className="card" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '0.82rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.75rem' }}>
              Submissions ({submissions.length})
            </h3>

            {submissions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem 0.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏛️</div>
                <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: '1rem' }}>
                  No submissions yet. Create your first ethics application.
                </p>
              </div>
            )}

            {submissions.map(s => {
              const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.draft;
              const expiryDays = daysUntil(s.decision_date);
              return (
                <div key={s.id} onClick={() => { setActiveId(s.id); setActiveTab('overview'); }}
                  style={{
                    padding: '0.75rem', borderRadius: 8, cursor: 'pointer', marginBottom: '0.5rem',
                    background: activeId === s.id ? '#fff5f3' : '#f8f7f4',
                    border: '1px solid ' + (activeId === s.id ? '#C0533A' : 'transparent'),
                    transition: 'all 0.15s',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: activeId === s.id ? '#C0533A' : '#1C2B3A', lineHeight: 1.3, flex: 1, paddingRight: 6 }}>
                      {s.title}
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: cfg.bg, color: cfg.color, flexShrink: 0 }}>
                      {cfg.label}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: '#888', marginBottom: 2 }}>
                    {s.committee || 'No committee set'} · {s.country || '—'}
                  </p>
                  {expiryDays !== null && expiryDays < 90 && expiryDays > 0 && (
                    <p style={{ fontSize: '0.7rem', color: '#C0533A', fontWeight: 700, marginBottom: 0 }}>
                      ⚠️ Expires in {expiryDays} days
                    </p>
                  )}
                  {expiryDays !== null && expiryDays <= 0 && (
                    <p style={{ fontSize: '0.7rem', color: '#f44336', fontWeight: 700, marginBottom: 0 }}>
                      ⛔ Expired {Math.abs(expiryDays)} days ago
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* DETAIL PANEL */}
        <div>
          {!active && (
            <div className="card" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏛️</div>
              <h2>Ethics Clearance Tracker</h2>
              <p style={{ color: '#888', maxWidth: 400, margin: '0 auto 1.5rem' }}>
                Track ethics committee submissions, approvals, conditions, amendments and supporting documents in one place.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', maxWidth: 500, margin: '0 auto 1.5rem' }}>
                {[
                  { icon: '📋', text: 'Track submission status' },
                  { icon: '📄', text: 'Manage documents' },
                  { icon: '🔄', text: 'Log amendments' },
                ].map(item => (
                  <div key={item.text} style={{ background: '#f8f7f4', borderRadius: 8, padding: '1rem', fontSize: '0.82rem', color: '#555' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{item.icon}</div>
                    {item.text}
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                + Create First Submission
              </button>
            </div>
          )}

          {active && (
            <div>
              {/* Header */}
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: 8 }}>
                      <h2 style={{ marginBottom: 0 }}>{active.title}</h2>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '3px 10px', borderRadius: 12,
                        background: STATUS_CONFIG[active.status]?.bg, color: STATUS_CONFIG[active.status]?.color }}>
                        {STATUS_CONFIG[active.status]?.label}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 12,
                        background: RISK_COLORS[active.risk_level] + '20', color: RISK_COLORS[active.risk_level] }}>
                        {active.risk_level.charAt(0).toUpperCase() + active.risk_level.slice(1)} Risk
                      </span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: 0 }}>
                      {active.committee || 'No committee'} · {active.institution || 'No institution'} · {active.country || 'No country'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <select value={active.status}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateSubmission(active.id, { status: e.target.value as Submission['status'] })}
                      style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.82rem', background: 'white' }}>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    <button className="btn" style={{ background: '#fff5f5', color: '#f44336', fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}
                      onClick={() => deleteSubmission(active.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'overview',   label: '📋 Overview'   },
                  { id: 'documents',  label: '📄 Documents'  },
                  { id: 'amendments', label: '🔄 Amendments' },
                  { id: 'conditions', label: '⚠️ Conditions' },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="btn" style={{
                    background: activeTab === tab.id ? '#1C2B3A' : '#eee',
                    color: activeTab === tab.id ? 'white' : '#444',
                    fontSize: '0.82rem', padding: '0.4rem 0.9rem',
                  }}>
                    {tab.label}
                    {tab.id === 'amendments' && active.amendments.length > 0 && (
                      <span style={{ marginLeft: 5, background: '#C0533A', color: 'white', borderRadius: 10, fontSize: '0.68rem', padding: '1px 5px' }}>
                        {active.amendments.length}
                      </span>
                    )}
                    {tab.id === 'documents' && active.documents.length > 0 && (
                      <span style={{ marginLeft: 5, background: '#5A8A6A', color: 'white', borderRadius: 10, fontSize: '0.68rem', padding: '1px 5px' }}>
                        {active.documents.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Submission Details</h3>
                    {[
                      { label: 'Study Type',        field: 'study_type',    type: 'text' },
                      { label: 'Principal Investigator', field: 'pi_name', type: 'text' },
                      { label: 'Institution',       field: 'institution',   type: 'text' },
                      { label: 'Country',           field: 'country',       type: 'text' },
                      { label: 'Approval Number',   field: 'approval_number', type: 'text' },
                    ].map(({ label, field, type }) => (
                      <div key={field} style={{ marginBottom: '0.6rem' }}>
                        <label style={labelStyle}>{label}</label>
                        <input type={type} value={(active as any)[field] || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSubmission(active.id, { [field]: e.target.value } as Partial<Submission>)}
                          style={inputStyle} />
                      </div>
                    ))}
                  </div>

                  <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Key Dates</h3>
                    {[
                      { label: 'Submitted Date',  field: 'submitted_date' },
                      { label: 'Decision Date / Approval Date', field: 'decision_date' },
                    ].map(({ label, field }) => (
                      <div key={field} style={{ marginBottom: '0.75rem' }}>
                        <label style={labelStyle}>{label}</label>
                        <input type="date" value={(active as any)[field] || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSubmission(active.id, { [field]: e.target.value } as Partial<Submission>)}
                          style={inputStyle} />
                      </div>
                    ))}

                    {active.decision_date && (
                      <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: 8,
                        background: daysUntil(active.decision_date) !== null && (daysUntil(active.decision_date) ?? 0) < 0 ? '#ffebee' :
                          (daysUntil(active.decision_date) ?? 0) < 90 ? '#fff3e0' : '#e8f5e9',
                        border: '1px solid ' + (daysUntil(active.decision_date) !== null && (daysUntil(active.decision_date) ?? 0) < 0 ? '#ffcdd2' : '#c8e6c9'),
                      }}>
                        {daysUntil(active.decision_date) !== null && (daysUntil(active.decision_date) ?? 0) < 0 ? (
                          <p style={{ fontSize: '0.85rem', color: '#f44336', fontWeight: 700, marginBottom: 0 }}>
                            ⛔ Approval expired {Math.abs(daysUntil(active.decision_date) ?? 0)} days ago
                          </p>
                        ) : (
                          <p style={{ fontSize: '0.85rem', color: (daysUntil(active.decision_date) ?? 0) < 90 ? '#ff9800' : '#5A8A6A', fontWeight: 700, marginBottom: 0 }}>
                            {(daysUntil(active.decision_date) ?? 0) < 90 ? '⚠️' : '✅'} {daysUntil(active.decision_date)} days until expiry ({formatDate(active.decision_date)})
                          </p>
                        )}
                      </div>
                    )}

                    <div style={{ marginTop: '1rem' }}>
                      <label style={labelStyle}>Risk Level</label>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {(['minimal', 'low', 'moderate', 'high'] as const).map(r => (
                          <button key={r} onClick={() => updateSubmission(active.id, { risk_level: r })} style={{
                            padding: '0.3rem 0.75rem', borderRadius: 16, fontSize: '0.78rem', fontWeight: 700,
                            cursor: 'pointer', border: '2px solid ' + RISK_COLORS[r],
                            background: active.risk_level === r ? RISK_COLORS[r] : 'white',
                            color: active.risk_level === r ? 'white' : RISK_COLORS[r],
                          }}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="card" style={{ gridColumn: '1/-1' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Application Timeline</h3>
                    <div style={{ display: 'flex', gap: 0, alignItems: 'center', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                      {(['draft', 'submitted', 'under_review', 'approved'] as Submission['status'][]).map((st, i, arr) => {
                        const isActive = active.status === st;
                        const isPast   = arr.indexOf(active.status) > i ||
                          active.status === 'approved_with_conditions' && st !== 'draft' ||
                          active.status === 'approved';
                        const cfg2 = STATUS_CONFIG[st];
                        return (
                          <React.Fragment key={st}>
                            <div style={{ textAlign: 'center', minWidth: 100 }}>
                              <div style={{ width: 36, height: 36, borderRadius: '50%', margin: '0 auto 6px',
                                background: isActive ? '#1C2B3A' : isPast ? '#5A8A6A' : '#eee',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.85rem' }}>
                                {isPast && !isActive ? '✓' : i + 1}
                              </div>
                              <p style={{ fontSize: '0.72rem', fontWeight: isActive ? 700 : 400, color: isActive ? '#1C2B3A' : '#888', marginBottom: 0 }}>
                                {cfg2.label}
                              </p>
                            </div>
                            {i < arr.length - 1 && (
                              <div style={{ flex: 1, height: 2, background: isPast ? '#5A8A6A' : '#eee', minWidth: 30 }} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* DOCUMENTS TAB */}
              {activeTab === 'documents' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ marginBottom: 0 }}>Supporting Documents ({active.documents.length})</h3>
                    <button className="btn btn-sage" onClick={() => setShowDocument(true)} style={{ fontSize: '0.85rem' }}>
                      + Add Document
                    </button>
                  </div>

                  {active.documents.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📄</div>
                      <p style={{ color: '#888' }}>No documents yet. Add your protocol, consent forms and other required documents.</p>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {active.documents.map(doc => {
                      const docCfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.draft;
                      const expDays = daysUntil(doc.expiry_date);
                      return (
                        <div key={doc.id} className="card" style={{ padding: '0.875rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ fontSize: '1.5rem' }}>📄</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: 4 }}>
                              <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{doc.name}</span>
                              {doc.reference && <span style={{ fontSize: '0.72rem', background: '#f0f4f8', padding: '1px 6px', borderRadius: 4, color: '#555' }}>{doc.reference}</span>}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.72rem', color: '#888', flexWrap: 'wrap' }}>
                              {doc.submitted_date && <span>Submitted: {formatDate(doc.submitted_date)}</span>}
                              {doc.approved_date  && <span>Approved: {formatDate(doc.approved_date)}</span>}
                              {doc.expiry_date    && <span style={{ color: expDays !== null && expDays < 60 ? '#C0533A' : '#888' }}>
                                Expires: {formatDate(doc.expiry_date)}{expDays !== null && expDays < 60 ? ` (${expDays}d)` : ''}
                              </span>}
                              {doc.notes && <span>{doc.notes}</span>}
                            </div>
                          </div>
                          <select value={doc.status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateDocStatus(doc.id, e.target.value as Document['status'])}
                            style={{ padding: '0.3rem 0.5rem', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.75rem', background: docCfg.bg, color: docCfg.color, fontWeight: 700 }}>
                            {(['pending', 'submitted', 'approved', 'rejected', 'expired'] as const).map(s => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AMENDMENTS TAB */}
              {activeTab === 'amendments' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ marginBottom: 0 }}>Amendments ({active.amendments.length})</h3>
                    <button className="btn btn-sage" onClick={() => setShowAmendment(true)} style={{ fontSize: '0.85rem' }}>
                      + Submit Amendment
                    </button>
                  </div>

                  {active.amendments.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔄</div>
                      <p style={{ color: '#888' }}>No amendments submitted. Protocol changes must be submitted as amendments to the ethics committee.</p>
                    </div>
                  )}

                  {active.amendments.map((am, i) => {
                    const amCfg = am.status === 'approved' ? { color: '#5A8A6A', bg: '#e8f5e9' }
                      : am.status === 'rejected'  ? { color: '#f44336', bg: '#ffebee' }
                      : { color: '#ff9800', bg: '#fff3e0' };
                    return (
                      <div key={am.id} className="card" style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                              <span style={{ fontWeight: 700 }}>Amendment {i + 1}: {am.title}</span>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: amCfg.bg, color: amCfg.color }}>
                                {am.status.charAt(0).toUpperCase() + am.status.slice(1)}
                              </span>
                            </div>
                            {am.reason && <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: 4 }}>{am.reason}</p>}
                            {am.submitted_date && <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: 0 }}>Submitted: {formatDate(am.submitted_date)}</p>}
                          </div>
                          <select value={am.status}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                              const updated = active.amendments.map(a => a.id === am.id ? { ...a, status: e.target.value as Amendment['status'] } : a);
                              updateSubmission(active.id, { amendments: updated });
                            }}
                            style={{ padding: '0.3rem 0.5rem', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.78rem' }}>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* CONDITIONS TAB */}
              {activeTab === 'conditions' && (
                <div className="card">
                  <h3 style={{ marginBottom: '0.75rem' }}>Ethics Conditions &amp; Requirements</h3>
                  <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.75rem' }}>
                    Document any conditions attached to this ethics approval (e.g. annual reports, data monitoring requirements, consent form updates).
                  </p>
                  <textarea
                    value={active.conditions}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateSubmission(active.id, { conditions: e.target.value })}
                    placeholder={`e.g.\n• Annual progress report due by 31 March each year\n• Consent form must be translated into Swahili before data collection\n• Data Safety Monitoring Board review required at 50% enrolment\n• All serious adverse events must be reported within 24 hours`}
                    style={{ width: '100%', minHeight: 220, padding: '0.875rem', borderRadius: 8, border: '1px solid #ddd', fontSize: '0.88rem', lineHeight: 1.6, resize: 'vertical' }}
                  />
                  {active.conditions && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fff5f3', borderRadius: 8, border: '1px solid #fdd' }}>
                      <p style={{ fontSize: '0.78rem', color: '#C0533A', fontWeight: 700, marginBottom: 6 }}>⚠️ Active Conditions</p>
                      <pre style={{ fontSize: '0.82rem', color: '#555', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{active.conditions}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
