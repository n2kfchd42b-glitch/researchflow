import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { API_URL } from '../../config';
import { useDescriptiveStatsStore, ColumnMeta, CategoricalStats, ContinuousStats } from '../../store/descriptiveStatsStore';

const API_BASE = API_URL ?? '';

interface Props {
  column: ColumnMeta;
  datasetId: string;
}


export default function VariableStatsPanel({ column, datasetId }: Props) {
  const { variableStats, cacheVariableStats } = useDescriptiveStatsStore();
  const cached = variableStats[column.name];

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showAllCats, setShowAllCats] = useState(false);

  useEffect(() => {
    if (cached || loading || column.type === 'date') return;
    let cancelled = false;
    setLoading(true);
    setError('');

    fetch(`${API_BASE}/api/descriptive-stats/variable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataset_id: datasetId,
        variable_name: column.name,
        variable_type: column.type,
      }),
    })
      .then((r) => { if (!r.ok) throw new Error(`Server error ${r.status}`); return r.json(); })
      .then((data) => {
        if (!cancelled) cacheVariableStats(column.name, data);
      })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [column.name, column.type, datasetId]);

  if (column.type === 'date') {
    return (
      <div style={panelStyle}>
        <p style={{ color: '#888', fontSize: '0.85rem' }}>
          Date variable — excluded from statistical summary and Table 1.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={panelStyle}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#888' }}>
          <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
          <span>Computing statistics…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={panelStyle}>
        <p style={{ color: '#c0392b', fontSize: '0.85rem' }}>Failed to load stats: {error}</p>
      </div>
    );
  }

  if (!cached) return null;

  if (cached.type === 'categorical') {
    return <CategoricalPanel stats={cached} showAll={showAllCats} setShowAll={setShowAllCats} />;
  }

  return <ContinuousPanel stats={cached as ContinuousStats} />;
}

// ---------------------------------------------------------------------------
// Categorical panel
// ---------------------------------------------------------------------------

function CategoricalPanel({
  stats, showAll, setShowAll,
}: {
  stats: CategoricalStats;
  showAll: boolean;
  setShowAll: (v: boolean) => void;
}) {
  const visibleFreqs = showAll ? stats.frequencies : stats.frequencies.slice(0, 10);
  const hasMore = stats.frequencies.length > 10;

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <StatPill label="Unique" value={String(stats.n_unique)} />
        <StatPill label="Mode" value={stats.mode || '—'} />
        <StatPill label="Missing" value={`${stats.n_missing} (${stats.pct_missing}%)`} color={stats.pct_missing > 0 ? '#d68910' : '#27ae60'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'start' }}>
        {/* Frequency table */}
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#f0f4f8' }}>
                <th style={thStyle}>Category</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>n</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>%</th>
              </tr>
            </thead>
            <tbody>
              {visibleFreqs.map((row, i) => (
                <tr key={row.category} style={{ background: i % 2 === 0 ? 'white' : '#fafbfc' }}>
                  <td style={tdStyle}>{row.category}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{row.n}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#1A5276', fontWeight: 600 }}>{row.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {hasMore && (
            <button onClick={() => setShowAll(!showAll)} style={toggleBtnStyle}>
              {showAll ? 'Show top 10 ▲' : `Show all ${stats.frequencies.length} categories ▼`}
            </button>
          )}
        </div>

        {/* Horizontal bar chart */}
        <div style={{ height: Math.min(visibleFreqs.length * 28 + 20, 300) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={visibleFreqs.map((f) => ({ name: f.category.length > 14 ? f.category.slice(0, 14) + '…' : f.category, pct: f.pct }))}
              layout="vertical"
              margin={{ left: 0, right: 20, top: 4, bottom: 4 }}
            >
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number | undefined) => [`${v ?? 0}%`, 'Proportion']} />
              <Bar dataKey="pct" radius={[0, 3, 3, 0]}>
                {visibleFreqs.map((_, idx) => (
                  <Cell key={idx} fill="#2E86C1" fillOpacity={0.75} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Continuous panel
// ---------------------------------------------------------------------------

function ContinuousPanel({ stats }: { stats: ContinuousStats }) {
  const skewed = stats.skewness !== null && Math.abs(stats.skewness) > 1;

  return (
    <div style={panelStyle}>
      {skewed && (
        <div style={{ marginBottom: '0.75rem', padding: '0.45rem 0.75rem', background: '#FEF9E7', borderRadius: 6, fontSize: '0.78rem', color: '#9A7D0A', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <span>⚠</span>
          <span>Skewed distribution — consider Median [IQR] for Table 1</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <StatPill label="Mean ± SD" value={`${stats.mean ?? '—'} ± ${stats.sd ?? '—'}`} />
        <StatPill label="Median [IQR]" value={`${stats.median ?? '—'} [${stats.q1 ?? '—'}–${stats.q3 ?? '—'}]`} />
        <StatPill label="Min / Max" value={`${stats.min ?? '—'} / ${stats.max ?? '—'}`} />
        <StatPill label="Skewness" value={String(stats.skewness ?? '—')} color={skewed ? '#d68910' : undefined} />
        <StatPill label="Kurtosis" value={String(stats.kurtosis ?? '—')} />
        <StatPill label="Missing" value={`${stats.n_missing} (${stats.pct_missing}%)`} color={stats.pct_missing > 0 ? '#d68910' : '#27ae60'} />
      </div>

      {/* Histogram */}
      {stats.histogram_bins.length > 0 && (
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stats.histogram_bins.map((b) => ({ name: b.bin_start.toFixed(1), count: b.count }))}
              margin={{ left: 0, right: 8, top: 4, bottom: 4 }}
            >
              <XAxis dataKey="name" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip formatter={(v: number | undefined) => [v ?? 0, 'Count']} labelFormatter={(l) => `≥ ${l}`} />
              <Bar dataKey="count" fill="#27ae60" fillOpacity={0.75} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function StatPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: '#f4f7fa', borderRadius: 8, padding: '0.4rem 0.75rem', minWidth: 80 }}>
      <div style={{ fontSize: '0.67rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: color ?? '#1C2B3A' }}>{value}</div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: '#f8fbff',
  border: '1px solid #dce8f5',
  borderRadius: '0 0 10px 10px',
  padding: '1rem',
  marginTop: -2,
};

const thStyle: React.CSSProperties = {
  padding: '5px 8px',
  textAlign: 'left',
  fontSize: '0.72rem',
  color: '#555',
  fontWeight: 700,
};

const tdStyle: React.CSSProperties = {
  padding: '5px 8px',
  fontSize: '0.8rem',
  borderBottom: '1px solid #f0f0f0',
};

const toggleBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#2E86C1',
  cursor: 'pointer',
  fontSize: '0.78rem',
  padding: '0.3rem 0',
  marginTop: '0.25rem',
};
