import React, { useState } from 'react';
import { API_URL } from '../../config';
import { useDescriptiveStatsStore, SummaryFormat } from '../../store/descriptiveStatsStore';
import Table1Display from './Table1Display';

const API_BASE = API_URL ?? '';

interface Props {
  datasetId: string;
}

export default function Table1Builder({ datasetId }: Props) {
  const {
    selectedForTable1,
    loadedDataset,
    summaryFormat,
    table1Result,
    clearTable1Selection,
    setTable1Result,
    setSummaryFormat,
  } = useDescriptiveStatsStore();

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const count = selectedForTable1.length;
  if (count === 0) return null;

  // Build variables list from loadedDataset columns
  const columns = loadedDataset?.columns ?? [];
  const variables = selectedForTable1
    .map((name) => {
      const col = columns.find((c) => c.name === name);
      return col ? { name: col.name, type: col.type === 'date' ? 'categorical' : col.type } : null;
    })
    .filter((v): v is { name: string; type: string } => v !== null);

  async function handleGenerate() {
    setLoading(true);
    setError('');
    setTable1Result(null);
    try {
      const res = await fetch(`${API_BASE}/api/descriptive-stats/table1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_id: datasetId,
          variables,
          summary_type: summaryFormat,
        }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setTable1Result(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleExportDocx() {
    try {
      const res = await fetch(`${API_BASE}/api/descriptive-stats/table1/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset_id: datasetId, variables, summary_type: summaryFormat }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'table1.docx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div>
      {/* Sticky bottom bar */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        background: 'white',
        borderTop: '2px solid #1C2B3A',
        padding: '0.75rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
        zIndex: 100,
        boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
      }}>
        <span style={{ fontWeight: 600, color: '#1C2B3A', fontSize: '0.88rem' }}>
          {count} variable{count !== 1 ? 's' : ''} selected for Table 1
        </span>

        {/* Summary format toggle */}
        <div style={{ display: 'flex', gap: '0.3rem', background: '#f0f4f8', borderRadius: 8, padding: '0.2rem' }}>
          {(['auto', 'mean_sd', 'median_iqr'] as SummaryFormat[]).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setSummaryFormat(fmt)}
              style={{
                padding: '0.3rem 0.65rem', border: 'none', borderRadius: 6, cursor: 'pointer',
                background: summaryFormat === fmt ? '#1C2B3A' : 'transparent',
                color: summaryFormat === fmt ? 'white' : '#555',
                fontSize: '0.78rem', fontWeight: 600,
              }}
            >
              {fmt === 'auto' ? 'Auto' : fmt === 'mean_sd' ? 'Mean±SD' : 'Median[IQR]'}
            </button>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            background: '#1C2B3A', color: 'white', border: 'none',
            borderRadius: 8, padding: '0.5rem 1.25rem', fontWeight: 700,
            fontSize: '0.88rem', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Generating…' : 'Generate Table 1'}
        </button>

        <button
          onClick={clearTable1Selection}
          style={{
            background: 'transparent', color: '#888', border: '1px solid #ddd',
            borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.82rem', cursor: 'pointer',
          }}
        >
          Clear
        </button>
      </div>

      {error && (
        <div style={{ background: '#FDEDEC', border: '1px solid #f5c6cb', borderRadius: 8, padding: '0.75rem 1rem', marginTop: '1rem', color: '#c0392b', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Table 1 display */}
      {table1Result && (
        <div style={{ marginTop: '1.5rem' }}>
          <Table1Display result={table1Result} onExportDocx={handleExportDocx} />
        </div>
      )}
    </div>
  );
}
