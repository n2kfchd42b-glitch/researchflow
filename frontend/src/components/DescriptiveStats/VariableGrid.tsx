import React, { useMemo, useState } from 'react';
import { useDescriptiveStatsStore, ColumnMeta } from '../../store/descriptiveStatsStore';
import { useStudyStore } from '../../store/studyStore';
import VariableCard from './VariableCard';
import VariableStatsPanel from './VariableStatsPanel';

type FilterPill = 'all' | 'categorical' | 'continuous' | 'exposure' | 'outcome';

interface Props {
  datasetId: string;
}

export default function VariableGrid({ datasetId }: Props) {
  const { loadedDataset, expandedVariable } = useDescriptiveStatsStore();
  const { exposureVariable, outcomeVariable } = useStudyStore();
  const [search, setSearch]             = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterPill>('all');

  const columns: ColumnMeta[] = loadedDataset?.columns ?? [];

  const filtered: ColumnMeta[] = useMemo(() => {
    return columns.filter((col) => {
      const matchesSearch = col.name.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      if (activeFilter === 'categorical') return col.type === 'categorical';
      if (activeFilter === 'continuous')  return col.type === 'continuous';
      if (activeFilter === 'exposure')    return exposureVariable?.name === col.name;
      if (activeFilter === 'outcome')     return outcomeVariable?.name === col.name;
      return true;
    });
  }, [columns, search, activeFilter, exposureVariable, outcomeVariable]);

  const pills: { id: FilterPill; label: string; count: number }[] = [
    { id: 'all',         label: 'All',         count: columns.length },
    { id: 'categorical', label: 'Categorical', count: columns.filter((c) => c.type === 'categorical').length },
    { id: 'continuous',  label: 'Continuous',  count: columns.filter((c) => c.type === 'continuous').length },
    { id: 'exposure',    label: 'Exposure',    count: exposureVariable ? 1 : 0 },
    { id: 'outcome',     label: 'Outcome',     count: outcomeVariable  ? 1 : 0 },
  ];

  if (columns.length === 0) return null;

  return (
    <div>
      {/* Search + filter pills */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Search variables…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '0.45rem 0.85rem',
            border: '1px solid #ddd',
            borderRadius: 8,
            fontSize: '0.85rem',
            outline: 'none',
            width: 220,
          }}
        />
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {pills.map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveFilter(pill.id)}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: 20,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 600,
                background: activeFilter === pill.id ? '#1C2B3A' : '#f0f4f8',
                color: activeFilter === pill.id ? 'white' : '#555',
              }}
            >
              {pill.label}
              {pill.count > 0 && (
                <span style={{ marginLeft: 5, opacity: 0.7, fontWeight: 400 }}>
                  ({pill.count})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive variable card grid */}
      <div className="variable-grid">
        {filtered.map((col) => (
          <div key={col.name}>
            <VariableCard column={col} />
            {expandedVariable === col.name && (
              <VariableStatsPanel column={col} datasetId={datasetId} />
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>
          No variables match your filter.
        </div>
      )}

      <style>{`
        .variable-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }
        @media (max-width: 900px) {
          .variable-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .variable-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
