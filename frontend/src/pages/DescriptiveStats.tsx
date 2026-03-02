import React, { useEffect, useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { API_URL } from '../config';
import {
  useDescriptiveStatsStore,
  ColumnMeta,
  VariableType,
} from '../store/descriptiveStatsStore';
import { useStudyStore } from '../store/studyStore';
import VariableGrid from '../components/DescriptiveStats/VariableGrid';
import Table1Builder from '../components/DescriptiveStats/Table1Builder';
import RecommendationPanel from '../components/Recommender/RecommendationPanel';

const API_BASE = API_URL ?? '';

// ---------------------------------------------------------------------------
// Client-side type detection (used when columns endpoint is unavailable)
// ---------------------------------------------------------------------------

function detectType(
  colName: string,
  colTypeHint: string,
  rows: Record<string, string>[],
): VariableType {
  const hint = (colTypeHint ?? '').toLowerCase();
  if (hint.includes('datetime') || hint.includes('date')) return 'date';

  const values = rows
    .map((r) => r[colName])
    .filter((v) => v !== '' && v !== null && v !== undefined);

  const uniqueValues = new Set(values);
  const numericCount = values.filter((v) => !isNaN(Number(v)) && String(v).trim() !== '').length;
  const isNumeric = values.length > 0 && numericCount / values.length > 0.8;

  if (isNumeric && uniqueValues.size > 10) return 'continuous';
  return 'categorical';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DescriptiveStats() {
  const { activeDataset, setActiveDataset } = useWorkflow();
  const { loadedDataset, selectedForTable1, setLoadedDataset } =
    useDescriptiveStatsStore();

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [datasetMeta, setDatasetMeta] = useState<{
    nRows: number;
    nCols: number;
    potentialConfounders: string[];
  }>({ nRows: 0, nCols: 0, potentialConfounders: [] });

  // Auto-load when an active dataset is present
  useEffect(() => {
    if (!activeDataset?.datasetId) return;
    if (loadedDataset?.id === activeDataset.datasetId) return;
    loadDataset(activeDataset.datasetId, activeDataset.datasetName ?? 'Dataset');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDataset?.datasetId]);

  // ---------------------------------------------------------------------------
  // Load a dataset by ID
  // ---------------------------------------------------------------------------

  async function loadDataset(datasetId: string, datasetName: string) {
    setLoading(true);
    setError('');
    try {
      let columns: ColumnMeta[] = [];

      // 1. Try the new fast columns endpoint
      const colRes = await fetch(`${API_BASE}/api/descriptive-stats/columns/${datasetId}`);
      if (colRes.ok) {
        const colData = (await colRes.json()) as {
          columns: Array<{ name: string; type: string; n_missing: number; pct_missing: number }>;
        };
        columns = colData.columns.map((c) => ({
          name: c.name,
          type: c.type as VariableType,
          nMissing: c.n_missing,
          pctMissing: c.pct_missing,
        }));
      }

      // 2. Also fetch preview (always — for nRows + fallback typing)
      const previewRes = await fetch(`${API_BASE}/dataset/${datasetId}/preview`);
      if (!previewRes.ok && columns.length === 0) {
        throw new Error('Unable to load dataset. Please try uploading again.');
      }
      const preview = previewRes.ok
        ? ((await previewRes.json()) as {
            row_count: number;
            column_count: number;
            headers: string[];
            rows: Record<string, string>[];
            column_types: Record<string, string>;
          })
        : null;

      // Fallback type detection from preview rows
      if (!colRes.ok && preview) {
        columns = preview.headers.map((h) => {
          const type = detectType(h, preview.column_types?.[h] ?? '', preview.rows);
          const missing = preview.rows.filter(
            (r) => !r[h] || String(r[h]).trim() === '' || r[h] === 'nan'
          ).length;
          const pctMissing =
            preview.rows.length > 0
              ? Math.round((missing / preview.rows.length) * 1000) / 10
              : 0;
          return { name: h, type, nMissing: missing, pctMissing };
        });
      }

      setLoadedDataset({ id: datasetId, name: datasetName, columns });

      // Compute potential confounders for recommender
      const studyState = useStudyStore.getState();
      const excluded = [
        studyState.exposureVariable?.name,
        studyState.outcomeVariable?.name,
      ].filter(Boolean) as string[];
      const confounders = columns
        .filter((c) => !excluded.includes(c.name) && c.type !== 'date')
        .map((c) => c.name)
        .slice(0, 20);

      setDatasetMeta({
        nRows: preview?.row_count ?? 0,
        nCols: preview?.column_count ?? columns.length,
        potentialConfounders: confounders,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // File upload
  // ---------------------------------------------------------------------------

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload failed');
      const data = (await res.json()) as {
        dataset_id: string;
        filename: string;
        rows: number;
        columns: number;
        column_types: Record<string, string>;
      };
      setActiveDataset({
        datasetId: data.dataset_id,
        datasetName: file.name,
        datasetVersionId: null,
        source: 'shared',
        columnTypes: data.column_types,
      });
      await loadDataset(data.dataset_id, file.name);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------

  if (!loadedDataset && !loading) {
    return (
      <div className="page">
        <h1 style={{ color: '#1C2B3A', marginBottom: '0.25rem' }}>Descriptive Statistics</h1>
        <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Explore your variables, check distributions, and build a publication-ready Table 1.
        </p>
        {error && (
          <div className="alert alert-critical" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        <div className="card" style={{ maxWidth: 480 }}>
          <h2 style={{ marginBottom: '1rem' }}>Load your dataset</h2>
          {activeDataset?.datasetId && (
            <button
              className="btn"
              style={{ marginBottom: '0.75rem', background: '#E8F0FE', color: '#1C2B3A', width: '100%' }}
              onClick={() =>
                loadDataset(
                  activeDataset.datasetId,
                  activeDataset.datasetName ?? 'Dataset',
                )
              }
              disabled={loading}
            >
              Use active dataset
              {activeDataset.datasetName ? `: ${activeDataset.datasetName}` : ''}
            </button>
          )}
          <label
            style={{
              display: 'block',
              cursor: 'pointer',
              textAlign: 'center',
              padding: '1.5rem',
              border: '2px dashed #ddd',
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📂</div>
            <p style={{ fontWeight: 600, color: '#1C2B3A', marginBottom: 4 }}>
              Upload your dataset
            </p>
            <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: 0 }}>
              CSV, XLSX, SAV, DTA
            </p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.sav,.dta"
              onChange={handleUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="page">
        <h1 style={{ color: '#1C2B3A' }}>Descriptive Statistics</h1>
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            color: '#888',
            marginTop: '2rem',
          }}
        >
          <span
            style={{
              animation: 'spin 1s linear infinite',
              display: 'inline-block',
            }}
          >
            ⟳
          </span>
          Loading dataset…
        </div>
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main view
  // ---------------------------------------------------------------------------

  const datasetId = loadedDataset!.id;
  const columns = loadedDataset!.columns;

  return (
    <div className="page">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <h1 style={{ color: '#1C2B3A', marginBottom: '0.2rem' }}>
            Descriptive Statistics
          </h1>
          <p style={{ color: '#666', fontSize: '0.88rem', margin: 0 }}>
            {loadedDataset!.name} — {columns.length} variables
            {datasetMeta.nRows > 0 &&
              `, ${datasetMeta.nRows.toLocaleString()} observations`}
          </p>
        </div>
        <label style={{ cursor: 'pointer' }}>
          <span
            style={{
              background: '#f0f4f8',
              border: '1px solid #dde4ea',
              borderRadius: 8,
              padding: '0.45rem 0.9rem',
              fontSize: '0.82rem',
              color: '#555',
              fontWeight: 600,
            }}
          >
            ↑ Load different dataset
          </span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.sav,.dta"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {error && (
        <div className="alert alert-critical" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* ── Summary chips ───────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.6rem',
          marginBottom: '1.5rem',
        }}
        className="ds-chips-grid"
      >
        {[
          {
            label: 'Total Variables',
            value: columns.length,
            color: '#1C2B3A',
          },
          {
            label: 'Continuous',
            value: columns.filter((c) => c.type === 'continuous').length,
            color: '#1E8449',
          },
          {
            label: 'Categorical',
            value: columns.filter((c) => c.type === 'categorical').length,
            color: '#1A5276',
          },
          {
            label: 'With Missing Data',
            value: columns.filter((c) => c.pctMissing > 0).length,
            color: '#d68910',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="card"
            style={{ textAlign: 'center', padding: '0.75rem' }}
          >
            <p
              style={{
                fontSize: '1.6rem',
                fontWeight: 700,
                color: item.color,
                margin: '0 0 2px',
              }}
            >
              {item.value}
            </p>
            <p style={{ fontSize: '0.73rem', color: '#888', margin: 0 }}>
              {item.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Main two-column layout ──────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: '1.25rem',
          alignItems: 'start',
        }}
        className="ds-main-grid"
      >
        {/* Left: Recommendation panel */}
        <div className="card" style={{ padding: '1rem', position: 'sticky', top: '1rem' }}>
          <RecommendationPanel
            datasetId={datasetId}
            datasetNRows={datasetMeta.nRows}
            datasetNCols={datasetMeta.nCols}
            potentialConfounders={datasetMeta.potentialConfounders}
          />
        </div>

        {/* Right: Variable explorer */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1C2B3A', margin: 0 }}>
              Variable Explorer
            </h2>
            {selectedForTable1.length > 0 && (
              <span
                style={{
                  fontSize: '0.78rem',
                  color: '#2E86C1',
                  fontWeight: 600,
                  background: '#EBF5FB',
                  padding: '0.25rem 0.65rem',
                  borderRadius: 20,
                }}
              >
                {selectedForTable1.length} selected for Table 1
              </span>
            )}
          </div>
          <VariableGrid datasetId={datasetId} />
        </div>
      </div>

      {/* ── Table 1 sticky builder ──────────────────────────────────────────── */}
      <Table1Builder datasetId={datasetId} />

      <style>{`
        @media (max-width: 860px) {
          .ds-main-grid   { grid-template-columns: 1fr !important; }
          .ds-chips-grid  { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .ds-chips-grid  { grid-template-columns: 1fr !important; }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
