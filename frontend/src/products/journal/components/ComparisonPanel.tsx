import React from 'react';
import MatchIndicator from './MatchIndicator';

type MatchType = 'exact' | 'minor-discrepancy' | 'major-discrepancy' | 'cannot-reproduce';

interface Props {
  reported: string;
  reproduced: string;
  match: MatchType;
  discrepancyDetails?: string;
}

const matchBorderColor: Record<MatchType, string> = {
  'exact': '#10B981',
  'minor-discrepancy': '#F59E0B',
  'major-discrepancy': '#EF4444',
  'cannot-reproduce': '#9CA3AF',
};

const discrepancyBg: Record<MatchType, string> = {
  'exact': '#D1FAE5',
  'minor-discrepancy': '#FEF3C7',
  'major-discrepancy': '#FEE2E2',
  'cannot-reproduce': '#F3F4F6',
};

export default function ComparisonPanel({ reported, reproduced, match, discrepancyDetails }: Props) {
  const borderColor = matchBorderColor[match];
  const isExact = match === 'exact';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Side-by-side columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: '0.75rem',
        alignItems: 'start',
      }} className="comparison-grid">
        {/* Reported column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#6B7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Reported (Manuscript)
          </div>
          <div style={{
            background: '#F9FAFB',
            border: `2px solid ${isExact ? borderColor : '#E5E7EB'}`,
            borderRadius: 8,
            padding: '0.75rem',
            fontSize: '0.875rem',
            color: '#1C2B3A',
            lineHeight: 1.6,
            minHeight: 80,
            whiteSpace: 'pre-wrap',
          }}>
            {reported || <span style={{ color: '#9CA3AF' }}>No reported results</span>}
          </div>
        </div>

        {/* Match indicator center */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '1.8rem' }}>
          <MatchIndicator match={match} />
        </div>

        {/* Reproduced column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#2E86C1',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Reproduced (Verification)
          </div>
          <div style={{
            background: '#EFF6FF',
            border: `2px solid ${borderColor}`,
            borderRadius: 8,
            padding: '0.75rem',
            fontSize: '0.875rem',
            color: '#1C2B3A',
            lineHeight: 1.6,
            minHeight: 80,
            whiteSpace: 'pre-wrap',
          }}>
            {reproduced || <span style={{ color: '#9CA3AF' }}>Not yet verified</span>}
          </div>
        </div>
      </div>

      {/* Discrepancy details */}
      {!isExact && discrepancyDetails && (
        <div style={{
          background: discrepancyBg[match],
          border: `1px solid ${borderColor}`,
          borderRadius: 8,
          padding: '0.75rem',
          fontSize: '0.85rem',
          color: '#1C2B3A',
        }}>
          <strong style={{ display: 'block', marginBottom: '0.3rem', color: borderColor }}>
            Discrepancy Details:
          </strong>
          {discrepancyDetails}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .comparison-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
