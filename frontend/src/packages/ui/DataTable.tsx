import React, { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Download, Square, CheckSquare } from 'lucide-react';
import { ProductContext, getTheme } from './theme';

export interface ColumnDef<T = Record<string, unknown>> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: number | string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface BulkAction {
  label: string;
  onClick: (selectedIds: string[]) => void;
}

export interface DataTableProps<T extends Record<string, unknown> = Record<string, unknown>> {
  context: ProductContext;
  columns: ColumnDef<T>[];
  data: T[];
  /** Key field to uniquely identify rows for selection */
  rowKey?: string;
  selectable?: boolean;
  exportable?: boolean;
  bulkActions?: BulkAction[];
  emptyMessage?: string;
  loading?: boolean;
  onExport?: (rows: T[]) => void;
  caption?: string;
}

type SortDir = 'asc' | 'desc' | null;

function exportCSV<T extends Record<string, unknown>>(columns: ColumnDef<T>[], data: T[], filename = 'export.csv') {
  const header = columns.map(c => `"${c.label}"`).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      const v = row[c.key];
      if (v == null) return '';
      return `"${String(v).replace(/"/g, '""')}"`;
    }).join(',')
  );
  const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function DataTable<T extends Record<string, unknown>>({
  context,
  columns,
  data,
  rowKey = 'id',
  selectable = false,
  exportable = false,
  bulkActions = [],
  emptyMessage = 'No data',
  loading = false,
  onExport,
  caption,
}: DataTableProps<T>) {
  const theme = getTheme(context);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const handleSort = useCallback((key: string) => {
    setSortKey(prev => {
      if (prev !== key) { setSortDir('asc'); return key; }
      setSortDir(d => d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc');
      return key;
    });
  }, []);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const allIds = useMemo(() => sorted.map(r => String(r[rowKey] ?? '')), [sorted, rowKey]);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const someSelected = allIds.some(id => selected.has(id));

  const toggleAll = () => {
    setSelected(prev => {
      if (allSelected) { const s = new Set(prev); allIds.forEach(id => s.delete(id)); return s; }
      return new Set(Array.from(prev).concat(allIds));
    });
  };
  const toggleRow = (id: string) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const selectedIds = Array.from(selected);

  const thStyle: React.CSSProperties = {
    padding: '0.65rem 0.85rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    textAlign: 'left',
    background: '#F9FAFB',
    borderBottom: '2px solid #E5E7EB',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  };
  const tdStyle: React.CSSProperties = {
    padding: '0.65rem 0.85rem',
    fontSize: '0.85rem',
    color: '#1C2B3A',
    borderBottom: '1px solid #F3F4F6',
    verticalAlign: 'middle',
  };

  const SortIcon = ({ k }: { k: string }) => {
    if (sortKey !== k || !sortDir) return <ChevronsUpDown size={12} style={{ marginLeft: 4, color: '#D1D5DB', verticalAlign: 'middle' }} />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} style={{ marginLeft: 4, color: theme.accent, verticalAlign: 'middle' }} />
      : <ChevronDown size={12} style={{ marginLeft: 4, color: theme.accent, verticalAlign: 'middle' }} />;
  };

  return (
    <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      {/* Toolbar */}
      {(exportable || (selectable && bulkActions.length > 0 && selected.size > 0)) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.65rem 1rem',
          borderBottom: '1px solid #E5E7EB',
          background: '#FAFAFA',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}>
          {selectable && bulkActions.length > 0 && selected.size > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', color: '#6B7280' }}>
                {selected.size} selected
              </span>
              {bulkActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => action.onClick(selectedIds)}
                  style={{
                    padding: '0.3rem 0.8rem',
                    background: theme.accent,
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          ) : <div />}

          {exportable && (
            <button
              onClick={() => onExport ? onExport(sorted) : exportCSV(columns, sorted)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.85rem',
                background: '#F3F4F6',
                border: '1px solid #E5E7EB',
                borderRadius: 7,
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: '#374151',
                fontWeight: 500,
              }}
              aria-label="Export table as CSV"
            >
              <Download size={13} aria-hidden="true" /> Export CSV
            </button>
          )}
        </div>
      )}

      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table
          style={{ width: '100%', borderCollapse: 'collapse' }}
          aria-label={caption}
        >
          {caption && <caption style={{ display: 'none' }}>{caption}</caption>}
          <thead>
            <tr>
              {selectable && (
                <th style={{ ...thStyle, width: 40, paddingLeft: '1rem' }}>
                  <button
                    onClick={toggleAll}
                    aria-label={allSelected ? 'Deselect all rows' : 'Select all rows'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: theme.accent }}
                  >
                    {allSelected
                      ? <CheckSquare size={16} aria-hidden="true" />
                      : someSelected
                      ? <CheckSquare size={16} aria-hidden="true" style={{ opacity: 0.5 }} />
                      : <Square size={16} aria-hidden="true" />}
                  </button>
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  scope="col"
                  style={{
                    ...thStyle,
                    width: col.width,
                    cursor: col.sortable ? 'pointer' : 'default',
                  }}
                  onClick={() => col.sortable && handleSort(col.key)}
                  aria-sort={
                    sortKey === col.key
                      ? sortDir === 'asc' ? 'ascending' : sortDir === 'desc' ? 'descending' : 'none'
                      : undefined
                  }
                >
                  {col.label}
                  {col.sortable && <SortIcon k={col.key} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}>
                  {selectable && <td style={tdStyle} />}
                  {columns.map(col => (
                    <td key={col.key} style={tdStyle}>
                      <div style={{ height: 16, background: '#F3F4F6', borderRadius: 4, width: '60%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '2.5rem' }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : sorted.map((row, ri) => {
              const id = String(row[rowKey] ?? ri);
              const isSelected = selected.has(id);
              return (
                <tr
                  key={id}
                  aria-selected={selectable ? isSelected : undefined}
                  style={{
                    background: isSelected ? theme.accentBg : 'white',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSelected ? theme.accentBg : 'white'; }}
                >
                  {selectable && (
                    <td style={{ ...tdStyle, paddingLeft: '1rem' }}>
                      <button
                        onClick={() => toggleRow(id)}
                        aria-label={`${isSelected ? 'Deselect' : 'Select'} row ${ri + 1}`}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: theme.accent }}
                      >
                        {isSelected
                          ? <CheckSquare size={15} aria-hidden="true" />
                          : <Square size={15} aria-hidden="true" />}
                      </button>
                    </td>
                  )}
                  {columns.map(col => (
                    <td key={col.key} style={tdStyle}>
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
