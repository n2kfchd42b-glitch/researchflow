import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
}

export default function MetricCard({ title, value, icon, color = '#5A8A6A', subtitle, trend, onClick }: MetricCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#FFFFFF',
        borderRadius: 12,
        padding: '1.25rem 1.5rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s',
        border: '1px solid #E0E4E8',
      }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; }}
      onMouseLeave={e => { if (onClick) (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'; }}
    >
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: color + '18',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1C2B3A', lineHeight: 1 }}>
            {value}
          </span>
          {trend && (
            <span style={{ color: trend === 'up' ? '#27AE60' : trend === 'down' ? '#C0533A' : '#6B7280' }}>
              {trend === 'up' ? <TrendingUp size={16} /> : trend === 'down' ? <TrendingDown size={16} /> : <Minus size={16} />}
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.2rem', fontWeight: 500 }}>{title}</div>
        {subtitle && <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.15rem' }}>{subtitle}</div>}
      </div>
    </div>
  );
}
