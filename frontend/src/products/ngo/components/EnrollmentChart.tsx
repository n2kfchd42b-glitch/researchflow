import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SiteInfo } from '../context/NGOPlatformContext';

interface EnrollmentChartProps {
  sites: SiteInfo[];
}

export default function EnrollmentChart({ sites }: EnrollmentChartProps) {
  if (sites.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem', fontSize: '0.85rem' }}>
        No sites added yet
      </div>
    );
  }

  const data = sites.map(s => ({
    name: s.name.length > 14 ? s.name.slice(0, 14) + '…' : s.name,
    fullName: s.name,
    actual: s.enrollmentActual,
    target: s.enrollmentTarget,
    pct: s.enrollmentTarget > 0 ? Math.round((s.enrollmentActual / s.enrollmentTarget) * 100) : 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(120, sites.length * 50 + 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, left: 10, bottom: 4 }}>
        <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={((value: any, name: any) => [value, name === 'actual' ? 'Enrolled' : 'Target']) as any}
          labelFormatter={(label) => data.find(d => d.name === label)?.fullName || label}
        />
        <Bar dataKey="target" fill="#E0E4E8" radius={[0, 4, 4, 0]} barSize={14} />
        <Bar dataKey="actual" fill="#5A8A6A" radius={[0, 4, 4, 0]} barSize={14}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.pct >= 90 ? '#27AE60' : entry.pct >= 60 ? '#5A8A6A' : entry.pct >= 30 ? '#E67E22' : '#C0533A'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
