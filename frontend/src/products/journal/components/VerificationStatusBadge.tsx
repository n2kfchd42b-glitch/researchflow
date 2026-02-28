import React from 'react';

type Status = 'pending' | 'in-review' | 'verified' | 'flagged' | 'rejected';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  status: Status;
  size?: Size;
}

const CONFIG: Record<Status, { bg: string; color: string; label: string; dot: string }> = {
  'pending':   { bg: '#F3F4F6', color: '#4B5563', label: 'Pending',   dot: '#9CA3AF' },
  'in-review': { bg: '#DBEAFE', color: '#1E40AF', label: 'In Review', dot: '#3B82F6' },
  'verified':  { bg: '#D1FAE5', color: '#065F46', label: 'Verified',  dot: '#10B981' },
  'flagged':   { bg: '#FED7AA', color: '#9A3412', label: 'Flagged',   dot: '#F97316' },
  'rejected':  { bg: '#FECACA', color: '#991B1B', label: 'Rejected',  dot: '#EF4444' },
};

const SIZE_MAP: Record<Size, { fontSize: string; padding: string; dotSize: number; gap: string }> = {
  sm: { fontSize: '0.7rem',  padding: '0.2rem 0.5rem', dotSize: 6,  gap: '0.3rem' },
  md: { fontSize: '0.8rem',  padding: '0.3rem 0.7rem', dotSize: 7,  gap: '0.35rem' },
  lg: { fontSize: '0.9rem',  padding: '0.4rem 0.9rem', dotSize: 8,  gap: '0.4rem' },
};

export default function VerificationStatusBadge({ status, size = 'md' }: Props) {
  const cfg = CONFIG[status];
  const sz = SIZE_MAP[size];

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: sz.gap,
      backgroundColor: cfg.bg,
      color: cfg.color,
      fontSize: sz.fontSize,
      fontWeight: 600,
      padding: sz.padding,
      borderRadius: 9999,
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: sz.dotSize,
        height: sz.dotSize,
        borderRadius: '50%',
        backgroundColor: cfg.dot,
        flexShrink: 0,
      }} />
      {cfg.label}
    </span>
  );
}
