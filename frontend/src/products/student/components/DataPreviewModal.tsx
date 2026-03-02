import React, { useState, useMemo } from 'react';
import { X, Search, ArrowUp, ArrowDown, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface DataPreviewModalProps {
  open: boolean;
  onClose: () => void;
  headers: string[];
  data: Record<string, string>[];
  title?: string;
}

const PAGE_SIZE = 50;

export default function DataPreviewModal({ open, onClose, headers, data, title }: DataPreviewModalProps) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      headers.some(h => String(row[h] ?? '').toLowerCase().includes(q))
    );
  }, [data, headers, search]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortCol] ?? '';
      const bv = b[sortCol] ?? '';
      const an = parseFloat(av);
      const bn = parseFloat(bv);
      if (!isNaN(an) && !isNaN(bn)) {
        return sortDir === 'asc' ? an - bn : bn - an;
      }
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
    setPage(0);
  };

  const handleExportCSV = () => {
    const csvRows = [headers.join(',')];
    data.forEach(row => {
      csvRows.push(headers.map(h => {
        const val = row[h] ?? '';
        return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dataset_preview.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 14,
          width: '95vw', maxWidth: 1400,
          height: '85vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #E5E9EF',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#1C2B3A' }}>
              {title || 'Data Preview'}
            </h2>
            <span style={{ fontSize: '0.82rem', color: '#888' }}>
              {data.length} rows · {headers.length} columns
              {search && ` · ${filtered.length} matching`}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: '#F4F7FA', borderRadius: 8, padding: '0.4rem 0.75rem',
              border: '1px solid #E5E9EF',
            }}>
              <Search size={14} color="#888" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                placeholder="Search all columns..."
                style={{
                  border: 'none', background: 'transparent', outline: 'none',
                  fontSize: '0.85rem', width: 200, color: '#333',
                }}
              />
            </div>
            <button onClick={handleExportCSV} style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.4rem 0.85rem', background: '#F4F7FA',
              border: '1px solid #E5E9EF', borderRadius: 8,
              cursor: 'pointer', fontSize: '0.82rem', color: '#555',
            }}>
              <Download size={14} /> Export CSV
            </button>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0.3rem', color: '#888', display: 'flex',
            }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr>
                <th style={{
                  position: 'sticky', top: 0, background: '#F4F7FA',
                  padding: '0.55rem 0.75rem', borderBottom: '2px solid #E5E9EF',
                  textAlign: 'center', color: '#999', fontWeight: 600,
                  fontSize: '0.75rem', width: 50, zIndex: 2,
                }}>#</th>
                {headers.map(h => (
                  <th
                    key={h}
                    onClick={() => handleSort(h)}
                    style={{
                      position: 'sticky', top: 0, background: '#F4F7FA',
                      padding: '0.55rem 0.75rem', borderBottom: '2px solid #E5E9EF',
                      textAlign: 'left', color: '#555', fontWeight: 600,
                      cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none',
                      zIndex: 2,
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {h}
                      {sortCol === h && (
                        sortDir === 'asc'
                          ? <ArrowUp size={12} color="#2E86C1" />
                          : <ArrowDown size={12} color="#2E86C1" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.map((row, ri) => (
                <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                  <td style={{
                    padding: '0.4rem 0.75rem', borderBottom: '1px solid #F0F4FA',
                    color: '#bbb', textAlign: 'center', fontSize: '0.75rem',
                  }}>{page * PAGE_SIZE + ri + 1}</td>
                  {headers.map(h => {
                    const val = row[h] ?? '';
                    const isEmpty = val === '' || val === 'NA' || val === 'null' || val === 'NaN';
                    return (
                      <td key={h} style={{
                        padding: '0.4rem 0.75rem',
                        borderBottom: '1px solid #F0F4FA',
                        color: isEmpty ? '#ccc' : '#333',
                        fontStyle: isEmpty ? 'italic' : 'normal',
                        maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {isEmpty ? (val || '—') : val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{
          padding: '0.6rem 1.5rem',
          borderTop: '1px solid #E5E9EF',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, background: '#FAFBFC',
        }}>
          <span style={{ fontSize: '0.82rem', color: '#888' }}>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              style={{
                display: 'flex', alignItems: 'center', padding: '0.3rem 0.6rem',
                background: page === 0 ? '#F4F7FA' : '#fff',
                border: '1px solid #E5E9EF', borderRadius: 6,
                cursor: page === 0 ? 'default' : 'pointer',
                opacity: page === 0 ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.82rem', color: '#555', fontWeight: 600 }}>
              Page {page + 1} of {totalPages || 1}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              style={{
                display: 'flex', alignItems: 'center', padding: '0.3rem 0.6rem',
                background: page >= totalPages - 1 ? '#F4F7FA' : '#fff',
                border: '1px solid #E5E9EF', borderRadius: 6,
                cursor: page >= totalPages - 1 ? 'default' : 'pointer',
                opacity: page >= totalPages - 1 ? 0.5 : 1,
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
