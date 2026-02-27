import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2, Clock, AlertTriangle, TrendingUp, Send, Calendar,
  Download, FileText
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useJournal, Submission } from '../context/JournalContext';
import VerificationStatusBadge from '../components/VerificationStatusBadge';
import SubmissionCard from '../components/SubmissionCard';

const JOURNAL_PRIMARY = '#7D3C98';

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, bg, suffix = '' }: {
  label: string; value: number | string; icon: React.ElementType;
  color: string; bg: string; suffix?: string;
}) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.1rem', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1C2B3A', lineHeight: 1 }}>{value}{suffix}</div>
        <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

const STATUS_ORDER: Submission['status'][] = ['pending', 'in-review', 'verified', 'flagged', 'rejected'];

const COL_CONFIG: Record<Submission['status'], { label: string; color: string; bg: string }> = {
  'pending':   { label: 'Pending',   color: '#6B7280', bg: '#F3F4F6' },
  'in-review': { label: 'In Review', color: '#1E40AF', bg: '#DBEAFE' },
  'verified':  { label: 'Verified',  color: '#065F46', bg: '#D1FAE5' },
  'flagged':   { label: 'Flagged',   color: '#9A3412', bg: '#FED7AA' },
  'rejected':  { label: 'Rejected',  color: '#991B1B', bg: '#FECACA' },
};

function KanbanColumn({ status, submissions, onCardClick, onDrop }: {
  status: Submission['status'];
  submissions: Submission[];
  onCardClick: (id: string) => void;
  onDrop: (submissionId: string, newStatus: Submission['status']) => void;
}) {
  const cfg = COL_CONFIG[status];
  const [over, setOver] = useState(false);

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 220, flex: '1 1 220px' }}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData('submissionId');
        if (id) onDrop(id, status);
      }}
    >
      {/* Column header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.65rem 0.85rem', background: cfg.bg, borderRadius: '10px 10px 0 0',
        border: `2px solid ${over ? cfg.color : 'transparent'}`,
        transition: 'border-color 0.2s',
      }}>
        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: cfg.color }}>{cfg.label}</span>
        <span style={{
          fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.5rem',
          borderRadius: 9999, background: cfg.color, color: 'white',
        }}>
          {submissions.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '0.5rem',
        padding: '0.5rem', background: over ? '#F9FAFB' : '#F3F4F6',
        borderRadius: '0 0 10px 10px', minHeight: 200,
        border: `2px solid ${over ? cfg.color : 'transparent'}`, borderTop: 'none',
        transition: 'background 0.2s, border-color 0.2s',
      }}>
        {submissions.map(sub => (
          <div
            key={sub.id}
            draggable
            onDragStart={e => e.dataTransfer.setData('submissionId', sub.id)}
            style={{ cursor: 'grab' }}
          >
            <SubmissionCard submission={sub} onClick={() => onCardClick(sub.id)} variant="kanban" />
          </div>
        ))}
        {submissions.length === 0 && (
          <div style={{ textAlign: 'center', color: '#D1D5DB', padding: '1.5rem 0.5rem', fontSize: '0.8rem' }}>
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Deadline Tracker ─────────────────────────────────────────────────────────

function getDaysRemaining(deadline: string | null): number | null {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BatchVerificationPage() {
  const { state, updateSubmission, getSubmissionStats } = useJournal();
  const navigate = useNavigate();
  const stats = getSubmissionStats();

  const handleCardClick = (id: string) => {
    navigate(`/journal/submission/${id}`);
  };

  const handleDrop = (submissionId: string, newStatus: Submission['status']) => {
    updateSubmission(submissionId, { status: newStatus });
  };

  const exportAllReports = () => {
    const verified = state.submissions.filter(s => s.verificationReport);
    const data = verified.map(s => ({
      manuscriptId: s.manuscriptId,
      title: s.title,
      verdict: s.verificationReport?.overallVerdict,
      verified: s.verificationReport?.verified,
      discrepant: s.verificationReport?.discrepant,
      cannotVerify: s.verificationReport?.cannotVerify,
      recommendations: s.verificationReport?.recommendations,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'all-reports.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportSummaryCSV = () => {
    const header = 'MS ID,Title,Status,Priority,Deadline,Reviewer,Analyses,Verified,Discrepancies\n';
    const rows = state.submissions.map(s =>
      `"${s.manuscriptId}","${s.title.replace(/"/g, '""')}","${s.status}","${s.priority}","${s.deadline ?? ''}","${s.assignedReviewer ?? ''}",${s.reportedAnalyses.length},${s.verificationResults.filter(r => r.match === 'exact').length},${s.verificationResults.filter(r => r.match !== 'exact').length}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'submission-summary.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // Statistics
  const avgTurnaround = useMemo(() => {
    const completed = state.submissions.filter(s => s.verificationReport && s.status !== 'pending');
    if (completed.length === 0) return null;
    const total = completed.reduce((sum, s) => {
      const submitted = new Date(s.submittedAt).getTime();
      const reported = new Date(s.verificationReport!.generatedAt).getTime();
      return sum + (reported - submitted) / 86400000;
    }, 0);
    return Math.round(total / completed.length);
  }, [state.submissions]);

  const discrepancyRate = useMemo(() => {
    const withReports = state.submissions.filter(s => s.verificationReport);
    if (withReports.length === 0) return 0;
    const withDisc = withReports.filter(s => s.verificationReport!.discrepant > 0);
    return Math.round((withDisc.length / withReports.length) * 100);
  }, [state.submissions]);

  // Reviewer workload
  const reviewerWorkload = useMemo(() => {
    const map: Record<string, number> = {};
    state.submissions.forEach(s => {
      const r = s.assignedReviewer ?? 'Unassigned';
      map[r] = (map[r] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [state.submissions]);

  const priorityDist = useMemo(() => ([
    { name: 'Normal', value: state.submissions.filter(s => s.priority === 'normal').length, color: '#9CA3AF' },
    { name: 'High', value: state.submissions.filter(s => s.priority === 'high').length, color: '#F59E0B' },
    { name: 'Urgent', value: state.submissions.filter(s => s.priority === 'urgent').length, color: '#EF4444' },
  ].filter(d => d.value > 0)), [state.submissions]);

  // Deadlines
  const withDeadlines = useMemo(() => {
    return state.submissions
      .filter(s => s.deadline && s.status !== 'verified' && s.status !== 'rejected')
      .map(s => ({ ...s, days: getDaysRemaining(s.deadline) }))
      .sort((a, b) => (a.days ?? 999) - (b.days ?? 999));
  }, [state.submissions]);

  const submissionsByStatus = STATUS_ORDER.reduce((acc, st) => {
    acc[st] = state.submissions.filter(s => s.status === st);
    return acc;
  }, {} as Record<Submission['status'], Submission[]>);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: 1400 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1C2B3A' }}>Pipeline View</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#6B7280' }}>
            Kanban workflow — drag submissions between stages
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={exportSummaryCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', color: '#374151' }}>
            <Download size={14} /> Export Summary
          </button>
          <button onClick={exportAllReports} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', background: JOURNAL_PRIMARY, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', color: 'white', fontWeight: 600 }}>
            <FileText size={14} /> Export All Reports
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
        <StatCard label="Avg. Turnaround" value={avgTurnaround ?? '—'} icon={Clock} color="#2E86C1" bg="#EFF6FF" suffix={avgTurnaround !== null ? 'd' : ''} />
        <StatCard label="Discrepancy Rate" value={discrepancyRate} icon={AlertTriangle} color="#9A3412" bg="#FED7AA" suffix="%" />
        <StatCard label="Total Submissions" value={stats.total} icon={BarChart2} color={JOURNAL_PRIMARY} bg="#F5EEF8" />
        <StatCard label="Awaiting Review" value={stats.pending + stats.inReview} icon={TrendingUp} color="#065F46" bg="#D1FAE5" />
      </div>

      {/* Kanban board */}
      <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', padding: '1.25rem' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#1C2B3A' }}>Submission Pipeline</h2>
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {STATUS_ORDER.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              submissions={submissionsByStatus[status]}
              onCardClick={handleCardClick}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {reviewerWorkload.length > 0 && (
          <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: '#1C2B3A' }}>
              Reviewer Workload
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={reviewerWorkload} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Submissions" fill={JOURNAL_PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {priorityDist.length > 0 && (
          <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: '#1C2B3A' }}>
              Priority Distribution
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={priorityDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, value }) => `${name}: ${value}`} fontSize={11}>
                  {priorityDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Deadline tracker */}
      {withDeadlines.length > 0 && (
        <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1C2B3A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} color="#F59E0B" /> Deadline Tracker
            </h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['MS ID', 'Title', 'Deadline', 'Days Remaining', 'Status', 'Reviewer', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.75rem', fontSize: '0.72rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', background: '#F9FAFB', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withDeadlines.map(sub => {
                  const days = sub.days;
                  const isOverdue = days !== null && days < 0;
                  const isWarning = days !== null && days >= 0 && days <= 7;
                  const rowBg = isOverdue ? '#FFF5F5' : isWarning ? '#FFFBEB' : 'white';
                  const daysColor = isOverdue ? '#EF4444' : isWarning ? '#F59E0B' : '#6B7280';
                  return (
                    <tr key={sub.id} style={{ background: rowBg, borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.82rem', fontWeight: 600, color: JOURNAL_PRIMARY }}>{sub.manuscriptId}</td>
                      <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.82rem', color: '#1C2B3A', maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.title}</div>
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.82rem', color: '#374151', whiteSpace: 'nowrap' }}>
                        {sub.deadline ? new Date(sub.deadline).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.82rem', fontWeight: 700, color: daysColor, whiteSpace: 'nowrap' }}>
                        {days === null ? '—' : days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d`}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <VerificationStatusBadge status={sub.status} size="sm" />
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.82rem', color: '#6B7280' }}>
                        {sub.assignedReviewer ?? '—'}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => navigate(`/journal/submission/${sub.id}`)}
                            style={{ padding: '0.3rem 0.7rem', background: JOURNAL_PRIMARY, color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            Review
                          </button>
                          {sub.assignedReviewer && (
                            <a
                              href={`mailto:?subject=Reminder: ${encodeURIComponent(sub.manuscriptId)} due ${sub.deadline}&body=${encodeURIComponent(`This is a reminder that manuscript "${sub.title}" (${sub.manuscriptId}) is due for verification review on ${sub.deadline}.`)}`}
                              style={{ padding: '0.3rem 0.7rem', background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Send size={11} /> Remind
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {state.submissions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF', background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB' }}>
          <FileText size={40} color="#D1D5DB" style={{ marginBottom: '0.75rem' }} />
          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>No submissions yet</p>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.82rem' }}>Create your first submission from the Dashboard</p>
        </div>
      )}
    </div>
  );
}
