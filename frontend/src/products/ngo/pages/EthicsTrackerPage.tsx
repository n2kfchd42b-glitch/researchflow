import React, { useState } from 'react';
import { Shield, Plus, AlertTriangle, CheckCircle, Clock, FileText, X, Upload } from 'lucide-react';
import { useNGO, EthicsSubmission } from '../context/NGOPlatformContext';
import StatusBadge from '../components/StatusBadge';

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #E0E4E8', borderRadius: 8, fontSize: '0.875rem', color: '#1C2B3A', background: 'white', boxSizing: 'border-box' };

const SUBMISSION_TYPES = ['Initial', 'Amendment', 'Renewal', 'Continuing Review'] as const;
const DOCS_CHECKLIST = [
  'Protocol document',
  'Informed consent form(s)',
  'Data collection instruments',
  'Investigator CVs',
  'Institutional authorization',
] as const;

interface ComplianceItem {
  id: string;
  label: string;
  done: boolean;
  date: string;
  person: string;
}

const DEFAULT_COMPLIANCE: ComplianceItem[] = [
  { id: 'c1', label: 'All team members have ethics training certificates', done: false, date: '', person: '' },
  { id: 'c2', label: 'Informed consent process documented', done: false, date: '', person: '' },
  { id: 'c3', label: 'Data storage plan approved', done: false, date: '', person: '' },
  { id: 'c4', label: 'Adverse event reporting plan in place', done: false, date: '', person: '' },
  { id: 'c5', label: 'Data sharing agreements signed', done: false, date: '', person: '' },
  { id: 'c6', label: 'Community engagement plan documented', done: false, date: '', person: '' },
];

export default function EthicsTrackerPage() {
  const { state, activeProject, addEthicsSubmission, updateProject } = useNGO();
  const project = activeProject;
  const submissions = state.ethicsSubmissions.filter(e => e.projectId === (project?.id || ''));
  const sorted = [...submissions].sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
  const latest = sorted[0];

  const [showForm, setShowForm] = useState(false);
  const [compliance, setCompliance] = useState<ComplianceItem[]>(DEFAULT_COMPLIANCE);
  const [expandedCompliance, setExpandedCompliance] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<{ name: string; type: string; date: string }[]>([]);
  const [checkedDocs, setCheckedDocs] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    board: '',
    type: 'Initial' as typeof SUBMISSION_TYPES[number],
    protocolVersion: '',
    submissionDate: new Date().toISOString().split('T')[0],
    status: 'pending' as 'pending' | 'approved' | 'revision-required' | 'rejected',
    approvalDate: '',
    expiryDate: '',
    comments: '',
  });

  // Days to expiry
  const expiryDays = latest?.expiryDate
    ? Math.ceil((new Date(latest.expiryDate).getTime() - Date.now()) / 86400000)
    : null;

  const currentStatus = project?.ethicsStatus || 'not-submitted';

  function handleSubmit() {
    if (!form.board.trim()) return;
    const sub: EthicsSubmission = {
      id: `es-${Date.now()}`,
      projectId: project?.id || '',
      board: form.board,
      submissionDate: form.submissionDate,
      status: form.status,
      approvalDate: form.approvalDate || null,
      expiryDate: form.expiryDate || null,
      protocolVersion: form.protocolVersion,
      comments: form.comments,
      documents: Array.from(checkedDocs),
    };
    addEthicsSubmission(sub);
    if (project) {
      if (form.status === 'approved') {
        updateProject(project.id, { ethicsStatus: 'approved', ethicsApprovalDate: form.approvalDate || null, ethicsExpiryDate: form.expiryDate || null });
      } else if (form.status === 'pending') {
        updateProject(project.id, { ethicsStatus: 'pending' });
      } else if (form.status === 'revision-required') {
        updateProject(project.id, { ethicsStatus: 'revision-required' });
      }
    }
    setShowForm(false);
    setForm({ board: '', type: 'Initial', protocolVersion: '', submissionDate: new Date().toISOString().split('T')[0], status: 'pending', approvalDate: '', expiryDate: '', comments: '' });
    setCheckedDocs(new Set());
  }

  function toggleCompliance(id: string) {
    setCompliance(c => c.map(item => item.id === id ? { ...item, done: !item.done, date: !item.done ? new Date().toISOString().split('T')[0] : '' } : item));
  }

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    'not-submitted':    { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' },
    pending:            { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
    approved:           { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' },
    'revision-required':{ bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
    expired:            { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
  };
  const sc = statusColors[currentStatus] || statusColors['not-submitted'];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1C2B3A', margin: 0 }}>Ethics & IRB Tracker</h1>
        <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>{project?.name || 'No active project'}</p>
      </div>

      {/* Status header */}
      <div style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 12, padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <Shield size={28} color={sc.text} />
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: sc.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current Status</div>
              <StatusBadge status={currentStatus} variant="ethics" />
              {latest?.approvalDate && currentStatus === 'approved' && (
                <div style={{ fontSize: '0.78rem', color: sc.text, marginTop: '0.25rem' }}>Approved by {latest.board}</div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
            {expiryDays !== null && expiryDays > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: sc.text }}>
                <Clock size={14} /> Valid for {expiryDays} days (expires {latest?.expiryDate})
              </div>
            )}
            {expiryDays !== null && expiryDays <= 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: '#991B1B', fontWeight: 600 }}>
                <AlertTriangle size={14} /> Approval has expired
              </div>
            )}
            {expiryDays !== null && expiryDays > 0 && expiryDays <= 30 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: '#92400E', fontWeight: 600, background: '#FEF3C7', padding: '0.3rem 0.6rem', borderRadius: 6 }}>
                <AlertTriangle size={13} /> Renewal due in {expiryDays} days
              </div>
            )}
            <button
              onClick={() => setShowForm(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#5A8A6A', color: 'white', border: 'none', borderRadius: 8, padding: '0.45rem 0.875rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
            >
              <Plus size={14} /> New Submission
            </button>
          </div>
        </div>
      </div>

      {/* Banners */}
      {expiryDays !== null && expiryDays > 0 && expiryDays <= 30 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FEF3C7', borderRadius: 8, padding: '0.75rem 1rem', border: '1px solid #FDE68A', marginBottom: '1rem', fontSize: '0.85rem', color: '#92400E' }}>
          <AlertTriangle size={16} /> Ethics approval expiring soon — submit renewal before {latest?.expiryDate}
        </div>
      )}
      {currentStatus === 'expired' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FEE2E2', borderRadius: 8, padding: '0.75rem 1rem', border: '1px solid #FECACA', marginBottom: '1rem', fontSize: '0.85rem', color: '#991B1B' }}>
          <AlertTriangle size={16} /> Ethics approval has expired — data collection must pause until renewal is approved
        </div>
      )}
      {currentStatus === 'revision-required' && latest?.comments && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: '#FEE2E2', borderRadius: 8, padding: '0.875rem 1rem', border: '1px solid #FECACA', marginBottom: '1rem', fontSize: '0.85rem', color: '#991B1B' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>Revision Required</div>
            <div>{latest.comments}</div>
            <button onClick={() => setShowForm(true)} style={{ marginTop: '0.5rem', background: '#C0533A', color: 'white', border: 'none', borderRadius: 6, padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Resubmit</button>
          </div>
        </div>
      )}

      {/* New submission form */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E4E8', padding: '1.25rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontWeight: 700, color: '#1C2B3A', fontSize: '0.95rem' }}>New Ethics Submission</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={18} /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.875rem' }}>
            <div>
              <label style={labelStyle}>Ethics Board / IRB</label>
              <input style={inputStyle} value={form.board} onChange={e => setForm(f => ({ ...f, board: e.target.value }))} placeholder="Board name" />
            </div>
            <div>
              <label style={labelStyle}>Submission Type</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {SUBMISSION_TYPES.map(t => (
                  <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', cursor: 'pointer', padding: '0.3rem 0.6rem', borderRadius: 20, background: form.type === t ? '#E8F5E9' : '#F3F4F6', border: `1px solid ${form.type === t ? '#5A8A6A' : '#E0E4E8'}`, color: form.type === t ? '#3D6B4F' : '#6B7280' }}>
                    <input type="radio" name="subType" value={t} checked={form.type === t} onChange={() => setForm(f => ({ ...f, type: t }))} style={{ display: 'none' }} />
                    {t}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Protocol Version</label>
              <input style={inputStyle} value={form.protocolVersion} onChange={e => setForm(f => ({ ...f, protocolVersion: e.target.value }))} placeholder="e.g. 1.2" />
            </div>
            <div>
              <label style={labelStyle}>Submission Date</label>
              <input type="date" style={inputStyle} value={form.submissionDate} onChange={e => setForm(f => ({ ...f, submissionDate: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="revision-required">Revision Required</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            {form.status === 'approved' && (
              <>
                <div>
                  <label style={labelStyle}>Approval Date</label>
                  <input type="date" style={inputStyle} value={form.approvalDate} onChange={e => setForm(f => ({ ...f, approvalDate: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Expiry Date</label>
                  <input type="date" style={inputStyle} value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
                </div>
              </>
            )}
          </div>

          {/* Documents checklist */}
          <div style={{ marginBottom: '0.875rem' }}>
            <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>Key Documents</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.35rem' }}>
              {DOCS_CHECKLIST.map(doc => (
                <label key={doc} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer', color: '#374151' }}>
                  <input type="checkbox" checked={checkedDocs.has(doc)} onChange={e => {
                    const next = new Set(checkedDocs);
                    e.target.checked ? next.add(doc) : next.delete(doc);
                    setCheckedDocs(next);
                  }} /> {doc}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '0.875rem' }}>
            <label style={labelStyle}>Comments / Notes</label>
            <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical', fontFamily: 'inherit' }} value={form.comments} onChange={e => setForm(f => ({ ...f, comments: e.target.value }))} placeholder="Board comments, conditions, notes..." />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleSubmit} disabled={!form.board.trim()} style={{ background: form.board.trim() ? '#5A8A6A' : '#E0E4E8', color: form.board.trim() ? 'white' : '#9CA3AF', border: 'none', borderRadius: 8, padding: '0.5rem 1.25rem', cursor: form.board.trim() ? 'pointer' : 'not-allowed', fontSize: '0.875rem', fontWeight: 600 }}>
              Submit
            </button>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: '1px solid #E0E4E8', borderRadius: 8, padding: '0.5rem 0.875rem', cursor: 'pointer', fontSize: '0.875rem', color: '#6B7280' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Submission Timeline */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E4E8', padding: '1.25rem', marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontWeight: 700, color: '#1C2B3A', fontSize: '0.95rem' }}>Submission Timeline</h3>
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem', border: '1px dashed #E0E4E8', borderRadius: 10, fontSize: '0.875rem' }}>
            No submissions yet. Click "New Submission" to record your first ethics submission.
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: '1.75rem' }}>
            <div style={{ position: 'absolute', left: 9, top: 10, bottom: 10, width: 2, background: '#E0E4E8' }} />
            {sorted.map((sub, i) => {
              const dotColor = sub.status === 'approved' ? '#27AE60' : sub.status === 'pending' ? '#E67E22' : sub.status === 'revision-required' ? '#C0533A' : '#6B7280';
              return (
                <div key={sub.id} style={{ position: 'relative', marginBottom: '1rem', paddingLeft: '0.75rem' }}>
                  <div style={{ position: 'absolute', left: -22, top: 8, width: 14, height: 14, borderRadius: '50%', background: dotColor, border: '2px solid white', boxShadow: `0 0 0 2px ${dotColor}` }} />
                  <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '1rem', border: '1px solid #E0E4E8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1C2B3A' }}>{sub.board}</span>
                          <StatusBadge status={sub.status} variant="ethics" />
                          {i === 0 && <span style={{ fontSize: '0.7rem', background: '#E8F5E9', color: '#3D6B4F', padding: '0.1rem 0.45rem', borderRadius: 10, fontWeight: 600 }}>Latest</span>}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '0.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <span>Submitted: {sub.submissionDate}</span>
                          {sub.protocolVersion && <span>Protocol v{sub.protocolVersion}</span>}
                          {sub.approvalDate && <span style={{ color: '#27AE60' }}>✓ Approved: {sub.approvalDate}</span>}
                          {sub.expiryDate && <span>Expires: {sub.expiryDate}</span>}
                        </div>
                        {sub.comments && (
                          <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '0.35rem', fontStyle: 'italic', padding: '0.4rem 0.6rem', background: '#F3F4F6', borderRadius: 6 }}>
                            "{sub.comments}"
                          </div>
                        )}
                        {sub.documents.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                            {sub.documents.map(d => (
                              <span key={d} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', padding: '0.15rem 0.45rem', background: '#EFF6FF', color: '#1D4ED8', borderRadius: 4 }}>
                                <FileText size={10} /> {d}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Document Library */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E4E8', padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
          <h3 style={{ margin: 0, fontWeight: 700, color: '#1C2B3A', fontSize: '0.95rem' }}>Document Library</h3>
          <button
            onClick={() => setUploadedDocs(d => [...d, { name: `Protocol_v${d.length + 1}.pdf`, type: 'Protocol', date: new Date().toISOString().split('T')[0] }])}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: '1px solid #E0E4E8', borderRadius: 8, padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', color: '#6B7280' }}
          >
            <Upload size={13} /> Upload Document
          </button>
        </div>

        {(() => {
          const allDocs: { name: string; type: string; date: string; source: string }[] = [
            ...submissions.flatMap(s => s.documents.map(d => ({ name: d, type: 'Submission', date: s.submissionDate, source: s.board }))),
            ...uploadedDocs.map(d => ({ ...d, source: 'Manual upload' })),
          ];
          if (allDocs.length === 0) {
            return <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '1.5rem', border: '1px dashed #E0E4E8', borderRadius: 10, fontSize: '0.85rem' }}>No documents yet</div>;
          }
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {allDocs.map((doc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.875rem', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E0E4E8' }}>
                  <FileText size={16} color="#2E86C1" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1C2B3A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{doc.type} · {doc.date} · {doc.source}</div>
                  </div>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2E86C1', fontSize: '0.78rem' }}>Download</button>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Compliance Checklist */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E4E8', padding: '1.25rem' }}>
        <h3 style={{ margin: '0 0 0.875rem 0', fontWeight: 700, color: '#1C2B3A', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <CheckCircle size={16} color="#27AE60" /> Compliance Checklist
          <span style={{ fontSize: '0.78rem', fontWeight: 500, color: '#6B7280', marginLeft: '0.25rem' }}>
            ({compliance.filter(c => c.done).length}/{compliance.length} complete)
          </span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {compliance.map(item => (
            <div key={item.id}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.875rem', background: item.done ? '#F0FFF4' : '#F9FAFB', borderRadius: 10, border: `1px solid ${item.done ? '#A7F3D0' : '#E0E4E8'}`, cursor: 'pointer' }}
                onClick={() => {
                  toggleCompliance(item.id);
                  setExpandedCompliance(expandedCompliance === item.id ? null : item.id);
                }}
              >
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${item.done ? '#27AE60' : '#D1D5DB'}`, background: item.done ? '#27AE60' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.done && <CheckCircle size={12} color="white" strokeWidth={3} />}
                </div>
                <div style={{ flex: 1, fontSize: '0.85rem', color: item.done ? '#065F46' : '#1C2B3A', fontWeight: item.done ? 500 : 400, textDecoration: item.done ? 'none' : 'none' }}>
                  {item.label}
                </div>
                {item.done && item.date && (
                  <span style={{ fontSize: '0.72rem', color: '#27AE60', flexShrink: 0 }}>✓ {item.date}</span>
                )}
              </div>
              {expandedCompliance === item.id && item.done && (
                <div style={{ padding: '0.6rem 0.875rem', background: '#F0FFF4', borderRadius: '0 0 10px 10px', border: '1px solid #A7F3D0', borderTop: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={labelStyle}>Date Completed</label>
                    <input type="date" style={inputStyle} value={item.date} onChange={e => setCompliance(c => c.map(cc => cc.id === item.id ? { ...cc, date: e.target.value } : cc))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Responsible Person</label>
                    <input style={inputStyle} value={item.person} onChange={e => setCompliance(c => c.map(cc => cc.id === item.id ? { ...cc, person: e.target.value } : cc))} placeholder="Name" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
