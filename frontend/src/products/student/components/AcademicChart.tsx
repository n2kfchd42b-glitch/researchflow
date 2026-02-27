import React from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

interface AcademicChartProps {
  type: 'bar' | 'line' | 'km' | 'forest';
  data: any[];
  title: string;
  figureNumber: number;
  xLabel: string;
  yLabel: string;
  dataKeys?: string[];
}

const BRAND_COLORS = ['#2E86C1', '#C0533A', '#5A8A6A', '#7D3C98'];

const AXIS_STYLE = { fontSize: 11, fill: '#555', fontFamily: 'system-ui, sans-serif' };

export default function AcademicChart({ type, data, title, figureNumber, xLabel, yLabel, dataKeys = [] }: AcademicChartProps) {
  const keys = dataKeys.length > 0 ? dataKeys : (data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'name' && k !== 'x') : []);

  const renderChart = () => {
    if (type === 'bar') {
      return (
        <BarChart data={data} margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" vertical={false} />
          <XAxis dataKey="name" tick={AXIS_STYLE} label={{ value: xLabel, position: 'insideBottom', offset: -15, style: AXIS_STYLE }} />
          <YAxis tick={AXIS_STYLE} label={{ value: yLabel, angle: -90, position: 'insideLeft', style: AXIS_STYLE }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          {keys.map((k, i) => <Bar key={k} dataKey={k} fill={BRAND_COLORS[i % BRAND_COLORS.length]} radius={[3, 3, 0, 0]} />)}
        </BarChart>
      );
    }
    if (type === 'forest') {
      return (
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 40, bottom: 10, left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" horizontal={false} />
          <XAxis type="number" tick={AXIS_STYLE} label={{ value: xLabel, position: 'insideBottom', offset: -5, style: AXIS_STYLE }} />
          <YAxis dataKey="name" type="category" tick={AXIS_STYLE} width={80} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
          <ReferenceLine x={1} stroke="#C0533A" strokeDasharray="4 2" label={{ value: 'No effect', position: 'top', fontSize: 10, fill: '#C0533A' }} />
          {keys.map((k, i) => <Bar key={k} dataKey={k} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />)}
        </BarChart>
      );
    }
    // line / km
    return (
      <LineChart data={data} margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" vertical={false} />
        <XAxis dataKey="name" tick={AXIS_STYLE} label={{ value: xLabel, position: 'insideBottom', offset: -15, style: AXIS_STYLE }} />
        <YAxis tick={AXIS_STYLE} label={{ value: yLabel, angle: -90, position: 'insideLeft', style: AXIS_STYLE }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        {keys.map((k, i) => (
          <Line
            key={k}
            type={type === 'km' ? 'stepAfter' : 'monotone'}
            dataKey={k}
            stroke={BRAND_COLORS[i % BRAND_COLORS.length]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    );
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #E5E9EF', padding: '1rem' }}>
        <ResponsiveContainer width="100%" height={280}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
      <div style={{ fontSize: '0.8rem', color: '#555', fontStyle: 'italic', textAlign: 'center', marginTop: '0.4rem' }}>
        Figure {figureNumber}. {title}
      </div>
    </div>
  );
}
