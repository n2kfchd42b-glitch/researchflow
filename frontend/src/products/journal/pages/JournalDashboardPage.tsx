import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Clock, CheckCircle, AlertTriangle, Plus, Download, BarChart2,
  Search, ChevronUp, ChevronDown, X, Trash2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useJournal, Submission, Author } from '../context/JournalContext';
import VerificationStatusBadge from '../components/VerificationStatusBadge';

const JOURNAL_PRIMARY = '#7D3C98';

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, bg }: {
  label: string; value: number; icon: React.ElementType; color: string; bg: string;
}) {
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 12,
      padding: '1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      border: '1px solid #E5E7EB',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1C2B3A', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

// ─── New Submission Modal ─────────────────────────────────────────────────────

interface AuthorRow {
  name: string;
  affiliation: string;
  email: string;
  isCorresponding: boolean;
}

function NewSubmissionModal({ onClose }: { onClose: () => void }) {
  const { createSubmission, state } = useJournal();
  const navigate = useNavigate();

  const [manuscriptId, setManuscriptId] = useState('');
  const [title, setTitle] = useState('');
  const [journal, setJournal] = useState(state.settings.journalName || '');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [authors, setAuthors] = useState<AuthorRow[]>([
    { name: '', affiliation: '', email: '', isCorresponding: true },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addAuthor = () => {
    setAuthors(prev => [...prev, { name: '', affiliation: '', email: '', isCorresponding: false }]);
  };

  const removeAuthor = (idx: number) => {
    setAuthors(prev => prev.filter((_, i) => i !== idx));
  };

  const updateAuthor = (idx: number, field: keyof AuthorRow, value: any) => {
    setAuthors(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!manuscriptId.trim()) e.manuscriptId = 'Manuscript ID is required';
    if (!title.trim()) e.title = 'Title is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = () => {
    if (!validate()) return;
    const id = createSubmission({
      manuscriptId: manuscriptId.trim(),
      title: title.trim(),
      authors: authors.filter(a => a.name.trim()) as Author[],
      journal: journal.trim(),
      priority,
      deadline: deadline || null,
      notes: notes.trim(),
      assignedReviewer: state.settings.defaultReviewerName || null,
    });
    navigate(`/journal/submission/${id}`);
    onClose();
  };

  const inputStyle = (field?: string): React.CSSProperties => ({
    width: '100%',
    padding: '0.55rem 0.75rem',
    border: `1px solid ${field && errors[field] ? '#EF4444' : '#D1D5DB'}`,
    borderRadius: 8,
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{
        background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 640,
        maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#1C2B3A' }}>New Submission</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Manuscript ID */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
              Manuscript ID *
            </label>
            <input value={manuscriptId} onChange={e => setManuscriptId(e.target.value)} style={inputStyle('manuscriptId')} placeholder="e.g. MS-2024-0042" />
            {errors.manuscriptId && <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>{errors.manuscriptId}</span>}
          </div>

          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
              Title *
            </label>
            <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle('title')} placeholder="Manuscript title" />
            {errors.title && <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>{errors.title}</span>}
          </div>

          {/* Authors */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Authors
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {authors.map((author, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', gap: '0.4rem', alignItems: 'center' }}>
                  <input value={author.name} onChange={e => updateAuthor(idx, 'name', e.target.value)} style={{ ...inputStyle(), fontSize: '0.8rem', padding: '0.4rem 0.6rem' }} placeholder="Name" />
                  <input value={author.affiliation} onChange={e => updateAuthor(idx, 'affiliation', e.target.value)} style={{ ...inputStyle(), fontSize: '0.8rem', padding: '0.4rem 0.6rem' }} placeholder="Affiliation" />
                  <input value={author.email} onChange={e => updateAuthor(idx, 'email', e.target.value)} style={{ ...inputStyle(), fontSize: '0.8rem', padding: '0.4rem 0.6rem' }} placeholder="Email" type="email" />
                  <label title="Corresponding author" style={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', fontSize: '0.75rem', color: '#6B7280', whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={author.isCorresponding} onChange={e => updateAuthor(idx, 'isCorresponding', e.target.checked)} />
                    Corr.
                  </label>
                  <button onClick={() => removeAuthor(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '0.25rem' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button onClick={addAuthor} style={{ alignSelf: 'flex-start', background: 'none', border: '1px dashed #D1D5DB', borderRadius: 6, padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.78rem', color: '#6B7280' }}>
                + Add Author
              </button>
            </div>
          </div>

          {/* Journal + Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Journal</label>
              <input value={journal} onChange={e => setJournal(e.target.value)} style={inputStyle()} placeholder="Journal name" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as any)} style={{ ...inputStyle(), background: 'white', cursor: 'pointer' }}>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Deadline (optional)</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={inputStyle()} />
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...inputStyle(), resize: 'vertical', fontFamily: 'inherit' }} placeholder="Any notes for the reviewer..." />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '0.55rem 1.25rem', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem', color: '#374151' }}>
            Cancel
          </button>
          <button onClick={handleCreate} style={{ padding: '0.55rem 1.25rem', background: JOURNAL_PRIMARY, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem', color: 'white', fontWeight: 600 }}>
            Create Submission
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

type SortKey = 'submittedAt' | 'title' | 'status' | 'priority' | 'deadline' | 'manuscriptId';
type SortDir = 'asc' | 'desc';

export default function JournalDashboardPage() {
  const { state, getSubmissionStats } = useJournal();
  const navigate = useNavigate();
  const stats = getSubmissionStats();

  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('submittedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    let list = [...state.submissions];
    if (statusFilter !== 'all') list = list.filter(s => s.status === statusFilter);
    if (priorityFilter !== 'all') list = list.filter(s => s.priority === priorityFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.manuscriptId.toLowerCase().includes(q) ||
        s.authors.some(a => a.name.toLowerCase().includes(q))
      );
    }
    if (dateFrom) list = list.filter(s => s.submittedAt >= dateFrom);
    if (dateTo) list = list.filter(s => s.submittedAt <= dateTo + 'T23:59:59');

    list.sort((a, b) => {
      let av: any = a[sortKey] ?? '';
      let bv: any = b[sortKey] ?? '';
      if (sortKey === 'priority') {
        const order = { urgent: 0, high: 1, normal: 2 };
        av = order[a.priority];
        bv = order[b.priority];
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [state.submissions, statusFilter, priorityFilter, searchQuery, sortKey, sortDir, dateFrom, dateTo]);

  const exportCSV = () => {
    const header = 'Manuscript ID,Title,Authors,Journal,Submitted,Status,Priority,Deadline,Reviewer\n';
    const rows = state.submissions.map(s =>
      `"${s.manuscriptId}","${s.title.replace(/"/g, '""')}","${s.authors.map(a => a.name).join('; ')}","${s.journal}","${s.submittedAt.slice(0,10)}","${s.status}","${s.priority}","${s.deadline ?? ''}","${s.assignedReviewer ?? ''}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'submissions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // Chart data
  const statusChartData = [
    { name: 'Pending', value: stats.pending, color: '#9CA3AF' },
    { name: 'In Review', value: stats.inReview, color: '#3B82F6' },
    { name: 'Verified', value: stats.verified, color: '#10B981' },
    { name: 'Flagged', value: stats.flagged, color: '#F97316' },
    { name: 'Rejected', value: stats.rejected, color: '#EF4444' },
  ].filter(d => d.value > 0);

  const verdictData = useMemo(() => {
    const counts = { 'fully-verified': 0, 'partially-verified': 0, 'significant-discrepancies': 0, 'cannot-verify': 0 };
    state.submissions.forEach(s => {
      if (s.verificationReport) counts[s.verificationReport.overallVerdict]++;
    });
    return [
      { name: 'Fully Verified', value: counts['fully-verified'], color: '#10B981' },
      { name: 'Partially', value: counts['partially-verified'], color: '#F59E0B' },
      { name: 'Discrepancies', value: counts['significant-discrepancies'], color: '#EF4444' },
      { name: 'Cannot Verify', value: counts['cannot-verify'], color: '#9CA3AF' },
    ].filter(d => d.value > 0);
  }, [state.submissions]);

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <span style={{ color: '#D1D5DB', marginLeft: 4 }}>↕</span>;
    return sortDir === 'asc' ? <ChevronUp size={12} style={{ marginLeft: 4 }} /> : <ChevronDown size={12} style={{ marginLeft: 4 }} />;
  };

  const thStyle: React.CSSProperties = {
    padding: '0.65rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    textAlign: 'left',
    background: '#F9FAFB',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '0.65rem 0.75rem',
    fontSize: '0.85rem',
    color: '#1C2B3A',
    borderBottom: '1px solid #F3F4F6',
  };

  function getDaysRemaining(deadline: string | null) {
    if (!deadline) return null;
    return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1400 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1C2B3A' }}>Journal Dashboard</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#6B7280' }}>
            Manage manuscript submissions and verification workflows
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', color: '#374151', fontWeight: 500 }}>
            <Download size={15} /> Export Queue
          </button>
          <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', background: JOURNAL_PRIMARY, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem', color: 'white', fontWeight: 600 }}>
            <Plus size={16} /> New Submission
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <StatCard label="Total Submissions" value={stats.total} icon={FileText} color={JOURNAL_PRIMARY} bg="#F5EEF8" />
        <StatCard label="Pending Review" value={stats.pending} icon={Clock} color="#92400E" bg="#FEF3C7" />
        <StatCard label="Verified" value={stats.verified} icon={CheckCircle} color="#065F46" bg="#D1FAE5" />
        <StatCard label="Flagged" value={stats.flagged} icon={AlertTriangle} color="#9A3412" bg="#FED7AA" />
      </div>

      {/* Submissions Queue */}
      <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1C2B3A' }}>Submissions Queue</h2>
          <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>{filtered.length} of {state.submissions.length}</span>
        </div>

        {/* Filters */}
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', background: '#FAFAFA' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'white', border: '1px solid #E5E7EB', borderRadius: 7, padding: '0.35rem 0.65rem', flex: '1 1 160px', minWidth: 140 }}>
            <Search size={14} color="#9CA3AF" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." style={{ border: 'none', outline: 'none', fontSize: '0.82rem', flex: 1, minWidth: 0 }} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.35rem 0.65rem', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: '0.82rem', background: 'white', cursor: 'pointer' }}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-review">In Review</option>
            <option value="verified">Verified</option>
            <option value="flagged">Flagged</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ padding: '0.35rem 0.65rem', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: '0.82rem', background: 'white', cursor: 'pointer' }}>
            <option value="all">All Priority</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '0.35rem 0.65rem', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: '0.82rem', background: 'white' }} placeholder="From" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '0.35rem 0.65rem', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: '0.82rem', background: 'white' }} placeholder="To" />
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {([
                  { key: 'manuscriptId', label: 'MS ID' },
                  { key: 'title', label: 'Title' },
                  { key: null, label: 'Authors' },
                  { key: 'submittedAt', label: 'Submitted' },
                  { key: 'status', label: 'Status' },
                  { key: null, label: 'Reviewer' },
                  { key: 'priority', label: 'Priority' },
                  { key: 'deadline', label: 'Deadline' },
                  { key: null, label: 'Actions' },
                ] as { key: SortKey | null; label: string }[]).map(col => (
                  <th
                    key={col.label}
                    style={thStyle}
                    onClick={() => col.key && handleSort(col.key)}
                  >
                    {col.label}
                    {col.key && <SortIcon k={col.key} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '2.5rem' }}>
                    {state.submissions.length === 0 ? (
                      <div>
                        <FileText size={32} color="#D1D5DB" style={{ marginBottom: '0.5rem' }} />
                        <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>No submissions yet</div>
                        <div style={{ fontSize: '0.8rem' }}>Click "+ New Submission" to get started</div>
                      </div>
                    ) : 'No submissions match your filters'}
                  </td>
                </tr>
              )}
              {filtered.map(sub => {
                const days = getDaysRemaining(sub.deadline);
                const deadlineColor = days === null ? '#9CA3AF' : days < 0 ? '#EF4444' : days <= 7 ? '#F59E0B' : '#6B7280';
                return (
                  <tr key={sub.id} style={{ cursor: 'pointer' }} onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600, color: JOURNAL_PRIMARY, fontSize: '0.8rem' }}>{sub.manuscriptId}</span>
                    </td>
                    <td style={{ ...tdStyle, maxWidth: 220 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                        {sub.title}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                        {sub.authors[0]?.name ?? '—'}
                        {sub.authors.length > 1 && ` +${sub.authors.length - 1}`}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#6B7280' }}>
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </td>
                    <td style={tdStyle}>
                      <VerificationStatusBadge status={sub.status} size="sm" />
                    </td>
                    <td style={{ ...tdStyle, fontSize: '0.8rem', color: '#6B7280' }}>
                      {sub.assignedReviewer ?? '—'}
                    </td>
                    <td style={tdStyle}>
                      {sub.priority !== 'normal' ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700, color: sub.priority === 'urgent' ? '#EF4444' : '#F59E0B' }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: sub.priority === 'urgent' ? '#EF4444' : '#F59E0B', display: 'inline-block' }} />
                          {sub.priority === 'urgent' ? 'URGENT' : 'HIGH'}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>Normal</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap', fontSize: '0.8rem', color: deadlineColor, fontWeight: days !== null && days < 0 ? 700 : 400 }}>
                      {sub.deadline
                        ? days === null ? '—'
                        : days < 0 ? `${Math.abs(days)}d overdue`
                        : days === 0 ? 'Due today'
                        : `${days}d left`
                        : '—'}
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => navigate(`/journal/submission/${sub.id}`)}
                        style={{ padding: '0.35rem 0.8rem', background: JOURNAL_PRIMARY, color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Section */}
      {state.submissions.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {/* Status distribution */}
          <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: '#1C2B3A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BarChart2 size={16} color={JOURNAL_PRIMARY} /> Submissions by Status
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={11}>
                  {statusChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Verification outcomes */}
          <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: '#1C2B3A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle size={16} color="#10B981" /> Verification Outcomes
            </h3>
            {verdictData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={verdictData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Submissions" radius={[4, 4, 0, 0]}>
                    {verdictData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '0.85rem' }}>
                No verified submissions yet
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && <NewSubmissionModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
