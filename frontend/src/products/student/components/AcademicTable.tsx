import React, { useState } from 'react';
import { Copy, Download, Check } from 'lucide-react';

interface AcademicTableProps {
  title: string;
  caption: string;
  headers: string[];
  rows: (string | number)[][];
  footnotes?: string[];
  tableNumber: number;
}

function formatCell(val: string | number, header: string): string {
  if (typeof val === 'number') {
    if (header.toLowerCase().includes('p') && header.toLowerCase().includes('val')) {
      return val < 0.001 ? '<0.001' : val.toFixed(3);
    }
    if (header.toLowerCase().includes('%') || header.toLowerCase().includes('percent')) {
      return `${val.toFixed(1)}%`;
    }
    return val.toFixed(2);
  }
  return String(val);
}

export default function AcademicTable({ title, caption, headers, rows, footnotes, tableNumber }: AcademicTableProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyTable = () => {
    const lines = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadCSV = () => {
    const lines = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([lines], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table${tableNumber}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontWeight: 700, color: '#1C2B3A', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
        Table {tableNumber}. {title}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', fontFamily: 'Georgia, serif' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #1C2B3A' }}>
              {headers.map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: '0.5rem 0.75rem',
                    textAlign: i === 0 ? 'left' : 'right',
                    fontWeight: 700,
                    color: '#1C2B3A',
                    whiteSpace: 'nowrap',
                    fontSize: '0.82rem',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={ri}
                style={{ background: ri % 2 === 1 ? '#FAFAFA' : 'white', borderBottom: '1px solid #EEF1F5' }}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: '0.45rem 0.75rem',
                      textAlign: ci === 0 ? 'left' : 'right',
                      color: '#333',
                      fontStyle: headers[ci]?.toLowerCase().includes('p') && headers[ci]?.toLowerCase().includes('val') ? 'italic' : 'normal',
                    }}
                  >
                    {formatCell(cell, headers[ci] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && (
        <div style={{ fontSize: '0.78rem', color: '#555', fontStyle: 'italic', marginTop: '0.4rem' }}>
          {caption}
        </div>
      )}
      {footnotes && footnotes.length > 0 && (
        <div style={{ marginTop: '0.4rem' }}>
          {footnotes.map((fn, i) => (
            <div key={i} style={{ fontSize: '0.75rem', color: '#666', fontStyle: 'italic' }}>
              {String.fromCharCode(97 + i)}) {fn}
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button
          onClick={handleCopyTable}
          style={{ padding: '0.3rem 0.7rem', background: '#EBF5FB', color: '#1A6EA6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
        >
          {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Table</>}
        </button>
        <button
          onClick={handleDownloadCSV}
          style={{ padding: '0.3rem 0.7rem', background: '#F4F7FA', color: '#444', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
        >
          <Download size={12} /> Download CSV
        </button>
      </div>
    </div>
  );
}
