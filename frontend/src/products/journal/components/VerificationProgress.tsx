import React from 'react';

interface Props {
  total: number;
  verified: number;
  discrepant: number;
  pending: number;
  compact?: boolean;
}

export default function VerificationProgress({ total, verified, discrepant, pending, compact = false }: Props) {
  if (total === 0) {
    return (
      <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
        No analyses
      </div>
    );
  }

  const verifiedPct = total > 0 ? (verified / total) * 100 : 0;
  const discrepantPct = total > 0 ? (discrepant / total) * 100 : 0;
  const pendingPct = total > 0 ? (pending / total) * 100 : 0;

  if (compact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: '#F3F4F6' }}>
          {verifiedPct > 0 && (
            <div style={{ width: `${verifiedPct}%`, background: '#10B981', transition: 'width 0.3s' }} />
          )}
          {discrepantPct > 0 && (
            <div style={{ width: `${discrepantPct}%`, background: '#F59E0B', transition: 'width 0.3s' }} />
          )}
          {pendingPct > 0 && (
            <div style={{ width: `${pendingPct}%`, background: '#E5E7EB', transition: 'width 0.3s' }} />
          )}
        </div>
        <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>
          {verified}/{total} verified
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1C2B3A' }}>
          {verified} of {total} analyses verified
        </span>
        <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
          {Math.round((verified / total) * 100)}%
        </span>
      </div>

      {/* Segmented progress bar */}
      <div style={{
        display: 'flex',
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
        background: '#F3F4F6',
        gap: 1,
      }}>
        {verifiedPct > 0 && (
          <div style={{ width: `${verifiedPct}%`, background: '#10B981', transition: 'width 0.3s', borderRadius: discrepantPct === 0 && pendingPct === 0 ? 5 : 0 }} />
        )}
        {discrepantPct > 0 && (
          <div style={{ width: `${discrepantPct}%`, background: '#F59E0B', transition: 'width 0.3s' }} />
        )}
        {pendingPct > 0 && (
          <div style={{ width: `${pendingPct}%`, background: '#E5E7EB', transition: 'width 0.3s' }} />
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {verified > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10B981', display: 'inline-block' }} />
            <span style={{ color: '#065F46' }}>{verified} verified</span>
          </div>
        )}
        {discrepant > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#F59E0B', display: 'inline-block' }} />
            <span style={{ color: '#92400E' }}>{discrepant} discrepanc{discrepant === 1 ? 'y' : 'ies'}</span>
          </div>
        )}
        {pending > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#E5E7EB', display: 'inline-block' }} />
            <span style={{ color: '#6B7280' }}>{pending} pending</span>
          </div>
        )}
      </div>
    </div>
  );
}
