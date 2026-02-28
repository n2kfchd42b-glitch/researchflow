import React, { useState } from 'react';
import { RoBDomain } from '../context/JournalContext';

type OverallRisk = 'low' | 'some-concerns' | 'high';
type Judgment = 'low' | 'some-concerns' | 'high' | 'not-applicable';

interface Props {
  domains: RoBDomain[];
  overallRisk: OverallRisk;
  compact?: boolean;
}

const judgmentColor: Record<Judgment, string> = {
  'low': '#27AE60',
  'some-concerns': '#F1C40F',
  'high': '#E74C3C',
  'not-applicable': '#BDC3C7',
};

const judgmentLabel: Record<Judgment, string> = {
  'low': 'Low Risk',
  'some-concerns': 'Some Concerns',
  'high': 'High Risk',
  'not-applicable': 'N/A',
};

function TrafficDot({ judgment, size = 20, label }: { judgment: Judgment; size?: number; label?: string }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: judgmentColor[judgment],
        cursor: 'help',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
      {showTooltip && label && (
        <div style={{
          position: 'absolute',
          bottom: '120%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1C2B3A',
          color: 'white',
          fontSize: '0.75rem',
          padding: '0.35rem 0.6rem',
          borderRadius: 6,
          whiteSpace: 'nowrap',
          zIndex: 50,
          pointerEvents: 'none',
        }}>
          {label}: {judgmentLabel[judgment]}
        </div>
      )}
    </div>
  );
}

export default function RoBTrafficLight({ domains, overallRisk, compact = false }: Props) {
  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {domains.map(d => (
          <TrafficDot key={d.id} judgment={d.judgment} size={16} label={d.name} />
        ))}
        <div style={{ width: 1, height: 16, background: '#E5E7EB', margin: '0 0.25rem' }} />
        <TrafficDot judgment={overallRisk} size={20} label="Overall" />
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        borderCollapse: 'collapse',
        width: '100%',
        fontSize: '0.85rem',
      }}>
        <thead>
          <tr>
            <th style={{
              textAlign: 'left',
              padding: '0.5rem 0.75rem',
              background: '#F3F4F6',
              fontWeight: 600,
              color: '#374151',
              borderBottom: '2px solid #E5E7EB',
            }}>
              Domain
            </th>
            <th style={{
              textAlign: 'center',
              padding: '0.5rem 0.75rem',
              background: '#F3F4F6',
              fontWeight: 600,
              color: '#374151',
              borderBottom: '2px solid #E5E7EB',
              whiteSpace: 'nowrap',
            }}>
              Judgment
            </th>
          </tr>
        </thead>
        <tbody>
          {domains.map((domain, idx) => (
            <tr key={domain.id} style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
              <td style={{ padding: '0.6rem 0.75rem', color: '#1C2B3A', borderBottom: '1px solid #F3F4F6' }}>
                {domain.name}
              </td>
              <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <TrafficDot judgment={domain.judgment} size={20} label={domain.name} />
                  <span style={{ color: '#6B7280', fontSize: '0.78rem' }}>{judgmentLabel[domain.judgment]}</span>
                </div>
              </td>
            </tr>
          ))}
          <tr style={{ background: '#F3F4F6', fontWeight: 700 }}>
            <td style={{ padding: '0.75rem', color: '#1C2B3A', borderTop: '2px solid #E5E7EB' }}>
              Overall Risk of Bias
            </td>
            <td style={{ padding: '0.75rem', textAlign: 'center', borderTop: '2px solid #E5E7EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <TrafficDot judgment={overallRisk} size={26} label="Overall" />
                <span style={{ color: '#374151', fontSize: '0.85rem', fontWeight: 600 }}>
                  {judgmentLabel[overallRisk]}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
