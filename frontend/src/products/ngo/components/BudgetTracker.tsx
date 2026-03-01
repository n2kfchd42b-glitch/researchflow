import React from 'react';
import { DollarSign, AlertTriangle } from 'lucide-react';

export interface BudgetLine {
  category: string;
  budgeted: number;
  spent: number;
}

export interface BudgetTrackerProps {
  totalBudget: number;
  totalSpent: number;
  lines?: BudgetLine[];
  currency?: string;
}

function fmt(n: number, currency: string) {
  return n.toLocaleString('en-US', { style: 'currency', currency, maximumFractionDigits: 0 });
}

/**
 * BudgetTracker — NGO-only component for tracking program budget utilization.
 * Has no shared equivalent; lives exclusively in the NGO product.
 */
export function BudgetTracker({
  totalBudget,
  totalSpent,
  lines = [],
  currency = 'USD',
}: BudgetTrackerProps) {
  const utilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const overspend   = totalSpent > totalBudget;
  const barColor    = overspend ? '#E74C3C' : utilization > 80 ? '#E67E22' : '#5A8A6A';

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      border: '1px solid #E5E7EB',
      padding: '1.25rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <DollarSign size={18} color="#c8793a" aria-hidden="true" />
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1C2B3A' }}>
          Budget Tracker
        </h3>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.82rem', color: '#6B7280' }}>Total Spent</span>
        <span style={{ fontWeight: 700, color: overspend ? '#E74C3C' : '#1C2B3A', fontSize: '0.9rem' }}>
          {fmt(totalSpent, currency)} / {fmt(totalBudget, currency)}
        </span>
      </div>

      {/* Bar */}
      <div
        role="progressbar"
        aria-valuenow={utilization}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Budget utilization: ${utilization}%`}
        style={{
          height: 8,
          background: '#E5E7EB',
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: '0.4rem',
        }}
      >
        <div style={{
          height: '100%',
          width: `${Math.min(utilization, 100)}%`,
          background: barColor,
          borderRadius: 4,
          transition: 'width 0.4s',
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#6B7280', marginBottom: '1rem' }}>
        <span>{utilization}% utilized</span>
        {overspend && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#E74C3C', fontWeight: 600 }}>
            <AlertTriangle size={12} aria-hidden="true" /> Overspend
          </span>
        )}
      </div>

      {/* Line items */}
      {lines.length > 0 && (
        <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '0.75rem' }}>
          {lines.map(line => {
            const lineUtil = line.budgeted > 0 ? Math.round((line.spent / line.budgeted) * 100) : 0;
            return (
              <div key={line.category} style={{ marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                  <span style={{ color: '#374151' }}>{line.category}</span>
                  <span style={{ color: line.spent > line.budgeted ? '#E74C3C' : '#6B7280' }}>
                    {fmt(line.spent, currency)} / {fmt(line.budgeted, currency)}
                  </span>
                </div>
                <div style={{ height: 4, background: '#E5E7EB', borderRadius: 2 }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(lineUtil, 100)}%`,
                    background: line.spent > line.budgeted ? '#E74C3C' : '#c8793a',
                    borderRadius: 2,
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BudgetTracker;
