import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Download } from 'lucide-react';
import { ProductContext, getTheme } from './theme';

export type ChartType = 'bar' | 'line' | 'pie';

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
  [key: string]: unknown;
}

export interface ChartCardProps {
  context: ProductContext;
  chartType: ChartType;
  data: ChartDataPoint[];
  title: string;
  subtitle?: string;
  exportable?: boolean;
  height?: number;
  /** For bar/line charts with multiple series */
  series?: Array<{ key: string; label: string; color?: string }>;
  onExport?: () => void;
}

const CHART_PALETTE = [
  '#2a4a7a', '#c8793a', '#1a5c3a', '#7D3C98',
  '#10B981', '#F59E0B', '#3B82F6', '#EF4444',
];

export function ChartCard({
  context,
  chartType,
  data,
  title,
  subtitle,
  exportable = false,
  height = 220,
  series,
  onExport,
}: ChartCardProps) {
  const theme = getTheme(context);

  const renderChart = () => {
    if (chartType === 'pie') {
      return (
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={Math.min(height / 2 - 20, 80)}
            label={({ name, value }) => `${name}: ${value}`}
            labelLine={false}
            fontSize={11}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color ?? CHART_PALETTE[i % CHART_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      );
    }

    if (chartType === 'line') {
      const keys = series ?? [{ key: 'value', label: 'Value', color: theme.accent }];
      return (
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          {keys.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {keys.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color ?? CHART_PALETTE[i % CHART_PALETTE.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      );
    }

    // bar (default)
    const keys = series ?? [{ key: 'value', label: 'Value', color: theme.accent }];
    return (
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        {keys.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {keys.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={s.color ?? CHART_PALETTE[i % CHART_PALETTE.length]}
            radius={[4, 4, 0, 0]}
          >
            {!series && data.map((entry, j) => (
              <Cell key={j} fill={entry.color ?? (s.color ?? CHART_PALETTE[i % CHART_PALETTE.length])} />
            ))}
          </Bar>
        ))}
      </BarChart>
    );
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 12,
        border: '1px solid #E5E7EB',
        padding: '1.25rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1rem',
        gap: '0.5rem',
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1C2B3A' }}>{title}</h3>
          {subtitle && <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#6B7280' }}>{subtitle}</p>}
        </div>
        {exportable && (
          <button
            onClick={onExport}
            aria-label={`Export ${title} chart`}
            style={{
              background: 'none',
              border: '1px solid #E5E7EB',
              borderRadius: 6,
              padding: '0.3rem 0.6rem',
              cursor: 'pointer',
              color: '#6B7280',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.78rem',
              flexShrink: 0,
            }}
          >
            <Download size={12} aria-hidden="true" /> Export
          </button>
        )}
      </div>

      {data.length === 0 ? (
        <div style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9CA3AF',
          fontSize: '0.85rem',
        }}>
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default ChartCard;
