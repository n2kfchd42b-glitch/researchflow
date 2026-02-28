import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

type MatchType = 'exact' | 'minor-discrepancy' | 'major-discrepancy' | 'cannot-reproduce';

interface Props {
  match: MatchType;
  showDetails?: boolean;
}

const CONFIG: Record<MatchType, {
  Icon: React.ElementType;
  color: string;
  label: string;
  explanation: string;
}> = {
  'exact': {
    Icon: CheckCircle,
    color: '#10B981',
    label: 'Exact Match',
    explanation: 'The reproduced results exactly match the reported results.',
  },
  'minor-discrepancy': {
    Icon: AlertTriangle,
    color: '#F59E0B',
    label: 'Minor Discrepancy',
    explanation: 'Small numerical differences found (typically <5%), likely due to rounding or software version differences.',
  },
  'major-discrepancy': {
    Icon: XCircle,
    color: '#EF4444',
    label: 'Major Discrepancy',
    explanation: 'Substantial differences found (>5%) that cannot be explained by rounding. Author response required.',
  },
  'cannot-reproduce': {
    Icon: HelpCircle,
    color: '#6B7280',
    label: 'Cannot Reproduce',
    explanation: 'The analysis could not be reproduced with the provided dataset and parameters.',
  },
};

export default function MatchIndicator({ match, showDetails = false }: Props) {
  const cfg = CONFIG[match];
  const { Icon } = cfg;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.35rem' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: cfg.color }}>
        <Icon size={16} strokeWidth={2.5} />
        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{cfg.label}</span>
      </div>
      {showDetails && (
        <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: 0, maxWidth: 300 }}>
          {cfg.explanation}
        </p>
      )}
    </div>
  );
}
