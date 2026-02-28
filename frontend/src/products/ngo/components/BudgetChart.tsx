import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BudgetItem } from '../context/NGOPlatformContext';

interface BudgetChartProps {
  budgetItems: BudgetItem[];
  totalBudget: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  personnel: '#2E86C1',
  travel:    '#E67E22',
  equipment: '#8E44AD',
  supplies:  '#27AE60',
  services:  '#C0533A',
  overhead:  '#95A5A6',
  other:     '#34495E',
};

const CATEGORY_LABELS: Record<string, string> = {
  personnel: 'Personnel',
  travel:    'Travel',
  equipment: 'Equipment',
  supplies:  'Supplies',
  services:  'Services',
  overhead:  'Overhead',
  other:     'Other',
};

export default function BudgetChart({ budgetItems, totalBudget }: BudgetChartProps) {
  const totalSpent = budgetItems.reduce((s, b) => s + b.spent, 0);
  const utilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const byCategory: Record<string, number> = {};
  budgetItems.forEach(item => {
    byCategory[item.category] = (byCategory[item.category] || 0) + item.spent;
  });

  const pieData = Object.entries(byCategory)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: CATEGORY_LABELS[k] || k, value: v, key: k }));

  const barColor = utilization >= 90 ? '#C0533A' : utilization >= 70 ? '#E67E22' : '#27AE60';

  return (
    <div>
      {/* Utilization bar */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#6B7280', marginBottom: '0.35rem' }}>
          <span>Budget Utilized</span>
          <span style={{ fontWeight: 700, color: barColor }}>{utilization}%</span>
        </div>
        <div style={{ height: 10, borderRadius: 5, background: '#E0E4E8', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(utilization, 100)}%`, background: barColor, borderRadius: 5, transition: 'width 0.5s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
          <span>${totalSpent.toLocaleString()} spent</span>
          <span>${totalBudget.toLocaleString()} total</span>
        </div>
      </div>

      {/* Pie chart */}
      {pieData.length > 0 && (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={index} fill={CATEGORY_COLORS[entry.key] || '#95A5A6'} />
              ))}
            </Pie>
            <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
            <Legend formatter={(v) => <span style={{ fontSize: '0.75rem' }}>{v}</span>} />
          </PieChart>
        </ResponsiveContainer>
      )}

      {pieData.length === 0 && (
        <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '0.85rem', padding: '1rem' }}>
          No expenses recorded yet
        </div>
      )}
    </div>
  );
}
