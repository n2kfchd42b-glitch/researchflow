import React from 'react';
import { Calendar, User } from 'lucide-react';
import { Submission } from '../context/JournalContext';
import VerificationStatusBadge from './VerificationStatusBadge';
import VerificationProgress from './VerificationProgress';

interface Props {
  submission: Submission;
  onClick: () => void;
  variant?: 'list' | 'kanban';
}

function getDaysRemaining(deadline: string | null): number | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

function DeadlineBadge({ deadline }: { deadline: string | null }) {
  const days = getDaysRemaining(deadline);
  if (days === null) return null;
  const color = days < 0 ? '#EF4444' : days <= 7 ? '#F59E0B' : '#6B7280';
  const label = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`;
  return (
    <span style={{
      fontSize: '0.72rem',
      fontWeight: 600,
      color,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.2rem',
    }}>
      <Calendar size={11} />
      {label}
    </span>
  );
}

function PriorityDot({ priority }: { priority: Submission['priority'] }) {
  if (priority === 'normal') return null;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      fontSize: '0.7rem',
      fontWeight: 700,
      color: priority === 'urgent' ? '#EF4444' : '#F59E0B',
    }}>
      <span style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: priority === 'urgent' ? '#EF4444' : '#F59E0B',
      }} />
      {priority === 'urgent' ? 'URGENT' : 'HIGH'}
    </span>
  );
}

export default function SubmissionCard({ submission, onClick, variant = 'list' }: Props) {
  const verified = submission.verificationResults.filter(r => r.match === 'exact').length;
  const discrepant = submission.verificationResults.filter(r => r.match !== 'exact' && r.match !== 'cannot-reproduce').length;
  const pending = submission.reportedAnalyses.length - submission.verificationResults.length;
  const total = submission.reportedAnalyses.length;
  const firstAuthor = submission.authors[0]?.name ?? 'Unknown';

  if (variant === 'kanban') {
    return (
      <div
        onClick={onClick}
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 8,
          padding: '0.75rem',
          cursor: 'pointer',
          transition: 'box-shadow 0.15s, transform 0.15s',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.72rem', color: '#7D3C98', fontWeight: 600 }}>{submission.manuscriptId}</span>
          <PriorityDot priority={submission.priority} />
        </div>
        <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#1C2B3A', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {submission.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#6B7280' }}>
          <User size={11} />
          {firstAuthor}
        </div>
        {total > 0 && (
          <VerificationProgress total={total} verified={verified} discrepant={discrepant} pending={Math.max(0, pending)} compact />
        )}
        <DeadlineBadge deadline={submission.deadline} />
      </div>
    );
  }

  // List variant — horizontal card
  return (
    <div
      onClick={onClick}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 8,
        padding: '0.75rem 1rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', color: '#7D3C98', fontWeight: 600 }}>{submission.manuscriptId}</span>
          <PriorityDot priority={submission.priority} />
          <DeadlineBadge deadline={submission.deadline} />
        </div>
        <p style={{ margin: '0.2rem 0 0', fontSize: '0.875rem', fontWeight: 600, color: '#1C2B3A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {submission.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#6B7280', marginTop: '0.2rem' }}>
          <User size={11} />
          {firstAuthor}
          {submission.authors.length > 1 && ` +${submission.authors.length - 1}`}
        </div>
      </div>
      {total > 0 && (
        <div style={{ width: 120, flexShrink: 0 }}>
          <VerificationProgress total={total} verified={verified} discrepant={discrepant} pending={Math.max(0, pending)} compact />
        </div>
      )}
      <VerificationStatusBadge status={submission.status} size="sm" />
    </div>
  );
}
