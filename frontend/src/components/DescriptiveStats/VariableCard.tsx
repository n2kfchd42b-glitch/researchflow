import React from 'react';
import { useDescriptiveStatsStore, ColumnMeta } from '../../store/descriptiveStatsStore';
import { useStudyStore } from '../../store/studyStore';

interface Props {
  column: ColumnMeta;
}

const TYPE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  categorical: { label: 'Categorical', bg: '#EBF5FB', color: '#1A5276' },
  continuous:  { label: 'Continuous',  bg: '#EAFAF1', color: '#1E8449' },
  date:        { label: 'Date',         bg: '#F2F3F4', color: '#566573' },
};

export default function VariableCard({ column }: Props) {
  const { expandedVariable, selectedForTable1, toggleTable1Selection, setExpandedVariable } =
    useDescriptiveStatsStore();
  const { exposureVariable, outcomeVariable } = useStudyStore();

  const isExpanded  = expandedVariable === column.name;
  const isSelected  = selectedForTable1.includes(column.name);
  const isExposure  = exposureVariable?.name === column.name;
  const isOutcome   = outcomeVariable?.name === column.name;
  const canSelect   = column.type !== 'date';

  const badge = TYPE_BADGE[column.type] ?? TYPE_BADGE.categorical;

  function handleCardClick(e: React.MouseEvent) {
    // Don't toggle expand when clicking the checkbox
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    setExpandedVariable(isExpanded ? null : column.name);
  }

  function handleCheckbox(e: React.ChangeEvent<HTMLInputElement>) {
    e.stopPropagation();
    toggleTable1Selection(column.name);
  }

  return (
    <div
      onClick={handleCardClick}
      style={{
        background: 'white',
        border: `2px solid ${isSelected ? '#2E86C1' : '#E8ECF0'}`,
        borderRadius: 10,
        padding: '0.85rem 1rem',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        boxShadow: isExpanded ? '0 4px 16px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.05)',
        position: 'relative',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = isExpanded ? '0 4px 16px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.05)'; }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
        {canSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckbox}
            onClick={(e) => e.stopPropagation()}
            style={{ marginTop: 3, cursor: 'pointer', flexShrink: 0 }}
            title="Select for Table 1"
          />
        )}
        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1C2B3A', flex: 1, wordBreak: 'break-word' }}>
          {column.name}
        </span>
      </div>

      {/* Type badge + special badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: column.pctMissing > 0 ? '0.45rem' : 0 }}>
        <span style={{
          padding: '0.2rem 0.55rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
          background: badge.bg, color: badge.color,
        }}>
          {badge.label}
        </span>
        {isExposure && (
          <span style={{ padding: '0.2rem 0.55rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, background: '#FEF0E7', color: '#A04000' }}>
            Exposure
          </span>
        )}
        {isOutcome && (
          <span style={{ padding: '0.2rem 0.55rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, background: '#F3E5F5', color: '#6A1B9A' }}>
            Outcome
          </span>
        )}
      </div>

      {/* Missing warning */}
      {column.pctMissing > 0 && (
        <div style={{ fontSize: '0.73rem', color: column.pctMissing > 10 ? '#c0392b' : '#d68910', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span>⚠</span>
          <span>{column.nMissing} missing ({column.pctMissing}%)</span>
        </div>
      )}

      {/* Expand indicator */}
      <div style={{ position: 'absolute', bottom: 6, right: 8, fontSize: '0.65rem', color: '#aaa' }}>
        {isExpanded ? '▲ close' : '▼ stats'}
      </div>
    </div>
  );
}
