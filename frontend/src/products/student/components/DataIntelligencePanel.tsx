import React from 'react';
import { Users, AlertCircle } from 'lucide-react';
import { ColumnIntelligence } from '../context/StudentWizardContext';

interface DataIntelligencePanelProps {
  columns: ColumnIntelligence[];
  rowCount: number;
}

const ROLE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  outcome:    { bg: '#EBF5FB', color: '#2E86C1', label: 'Outcome' },
  exposure:   { bg: '#FDEDEC', color: '#C0533A', label: 'Exposure' },
  covariate:  { bg: '#E9F7EF', color: '#5A8A6A', label: 'Covariate' },
  id:         { bg: '#F2F3F4', color: '#666',    label: 'ID' },
  time:       { bg: '#F5EEF8', color: '#7D3C98', label: 'Time' },
  unassigned: { bg: 'transparent', color: '#aaa', label: 'Unassigned' },
};

const TYPE_COLORS: Record<string, string> = {
  numeric:     '#2E86C1',
  categorical: '#5A8A6A',
  binary:      '#E67E22',
  date:        '#7D3C98',
  text:        '#888',
  ordinal:     '#E67E22',
};

function ConfidenceBar({ confidence }: { confidence: number }) {
  const color = confidence >= 80 ? '#27AE60' : confidence >= 50 ? '#E67E22' : '#E74C3C';
  return (
    <div style={{ height: 4, background: '#EEF1F5', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${confidence}%`, background: color, borderRadius: 2, transition: 'width 0.4s' }} />
    </div>
  );
}

export default function DataIntelligencePanel({ columns, rowCount }: DataIntelligencePanelProps) {
  const numericCount = columns.filter(c => c.detectedType === 'numeric').length;
  const catCount = columns.filter(c => c.detectedType === 'categorical' || c.detectedType === 'ordinal').length;
  const binaryCount = columns.filter(c => c.detectedType === 'binary').length;
  const overallMissingPct = columns.length > 0
    ? columns.reduce((s, c) => s + c.stats.missingPercent, 0) / columns.length
    : 0;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Dataset overview bar */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        background: 'white',
        border: '1px solid #E5E9EF',
        borderRadius: 10,
        padding: '0.875rem 1.25rem',
        marginBottom: '1rem',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#1C2B3A', fontWeight: 600 }}>
          <Users size={15} color="#2E86C1" />
          {rowCount.toLocaleString()} rows
        </div>
        <div style={{ fontSize: '0.85rem', color: '#1C2B3A', fontWeight: 600 }}>
          {columns.length} columns
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: overallMissingPct > 10 ? '#E74C3C' : '#555', fontWeight: 600 }}>
          <AlertCircle size={14} color={overallMissingPct > 10 ? '#E74C3C' : '#888'} />
          {overallMissingPct.toFixed(1)}% missing
        </div>
        {numericCount > 0 && (
          <span style={{ padding: '2px 10px', background: '#EBF5FB', color: '#1A6EA6', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600 }}>
            {numericCount} numeric
          </span>
        )}
        {catCount > 0 && (
          <span style={{ padding: '2px 10px', background: '#E9F7EF', color: '#1E8449', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600 }}>
            {catCount} categorical
          </span>
        )}
        {binaryCount > 0 && (
          <span style={{ padding: '2px 10px', background: '#FEF5E7', color: '#D35400', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600 }}>
            {binaryCount} binary
          </span>
        )}
      </div>

      {/* Column intelligence cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
        {columns.map(col => {
          const roleCfg = ROLE_COLORS[col.suggestedRole] ?? ROLE_COLORS.unassigned;
          const typeColor = TYPE_COLORS[col.detectedType] ?? '#888';
          return (
            <div
              key={col.name}
              style={{
                background: 'white',
                border: '1px solid #E5E9EF',
                borderRadius: 8,
                padding: '0.875rem',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ fontWeight: 700, color: '#1C2B3A', marginBottom: '0.4rem', wordBreak: 'break-word' }}>
                {col.name}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ color: typeColor, fontWeight: 600 }}>
                  {col.detectedType.charAt(0).toUpperCase() + col.detectedType.slice(1)} ({col.typeConfidence}%)
                </span>
              </div>
              <ConfidenceBar confidence={col.typeConfidence} />

              {col.suggestedRole !== 'unassigned' && (
                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{
                    padding: '1px 8px',
                    background: roleCfg.bg,
                    color: roleCfg.color,
                    borderRadius: 99,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    border: `1px solid ${roleCfg.color}30`,
                  }}>
                    {roleCfg.label}
                  </span>
                  <span style={{ color: '#888', fontSize: '0.72rem' }}>{col.roleMatchReason}</span>
                </div>
              )}

              {col.stats.missingPercent > 0 && (
                <div style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: col.stats.missingPercent > 20 ? '#E74C3C' : '#888' }}>
                  {col.stats.missingPercent.toFixed(1)}% missing
                </div>
              )}

              {col.warnings.length > 0 && (
                <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {col.warnings.map((w, i) => (
                    <span
                      key={i}
                      title={w.suggestion}
                      style={{
                        padding: '1px 6px',
                        borderRadius: 99,
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        background: w.severity === 'error' ? '#FDEDEC' : w.severity === 'warning' ? '#FEF9E7' : '#EBF5FB',
                        color: w.severity === 'error' ? '#A93226' : w.severity === 'warning' ? '#B7950B' : '#1A6EA6',
                        cursor: 'default',
                      }}
                    >
                      {w.type === 'high-missing' ? 'High Missing' :
                       w.type === 'skewed' ? 'Skewed' :
                       w.type === 'binary-outcome' ? 'Binary' :
                       w.type === 'low-variance' ? 'Low Variance' :
                       w.type === 'possible-id' ? 'Possible ID' :
                       w.type === 'constant' ? 'Constant' : w.type}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
