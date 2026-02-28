import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ProductContext, getTheme } from './theme';

export interface MetricCardProps {
  context: ProductContext;
  label: string;
  value: string | number;
  delta?: number;        // positive = up, negative = down, 0 = flat
  deltaLabel?: string;   // e.g. "vs last month"
  icon?: React.ElementType;
  loading?: boolean;
}

export function MetricCard({
  context,
  label,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  loading = false,
}: MetricCardProps) {
  const theme = getTheme(context);

  const deltaIcon =
    delta == null ? null :
    delta > 0  ? <TrendingUp  size={13} aria-hidden="true" /> :
    delta < 0  ? <TrendingDown size={13} aria-hidden="true" /> :
                 <Minus       size={13} aria-hidden="true" />;
  const deltaColor =
    delta == null ? '#6B7280' :
    delta > 0  ? '#059669' :
    delta < 0  ? '#DC2626' : '#6B7280';

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 12,
        padding: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      {Icon && (
        <div
          aria-hidden="true"
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: theme.accentBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={22} color={theme.accent} />
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        {loading ? (
          <div style={{ width: 64, height: 28, background: '#E5E7EB', borderRadius: 6 }} />
        ) : (
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1C2B3A', lineHeight: 1 }}>
            {value}
          </div>
        )}
        <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: 4 }}>{label}</div>
        {delta != null && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.2rem',
            marginTop: 4,
            fontSize: '0.75rem',
            fontWeight: 600,
            color: deltaColor,
          }}>
            {deltaIcon}
            {Math.abs(delta)}%
            {deltaLabel && <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 2 }}>{deltaLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricCard;
