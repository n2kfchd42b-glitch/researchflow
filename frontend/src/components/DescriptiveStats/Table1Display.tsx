import React, { useState } from 'react';
import { Table1Response, Table1Entry } from '../../store/descriptiveStatsStore';

interface Props {
  result: Table1Response;
  onExportDocx: () => void;
}

export default function Table1Display({ result, onExportDocx }: Props) {
  const [copied, setCopied] = useState(false);

  function buildTsvText(): string {
    const lines: string[] = [`Characteristic\tOverall (N=${result.n_total})`];
    for (const entry of result.table) {
      if (entry.type === 'continuous') {
        for (const row of entry.rows) {
          lines.push(`${row.label}\t${row.value}`);
        }
      } else {
        lines.push(`${entry.variable}\t`);
        for (const row of entry.rows) {
          lines.push(`  ${row.label}\t${row.value}`);
        }
      }
    }
    return lines.join('\n');
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildTsvText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleCsvDownload() {
    const csv = buildTsvText().replace(/\t/g, ',');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'table1.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ margin: 0, color: '#1C2B3A', fontSize: '1rem' }}>
          Table 1 — Overall (N={result.n_total})
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={handleCopy} style={exportBtnStyle}>
            {copied ? '✓ Copied!' : '📋 Copy for Word'}
          </button>
          <button onClick={handleCsvDownload} style={exportBtnStyle}>
            ⬇ CSV
          </button>
          <button onClick={onExportDocx} style={{ ...exportBtnStyle, background: '#1C2B3A', color: 'white' }}>
            📄 Download DOCX
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#1C2B3A', color: 'white' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Characteristic</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>Overall (N={result.n_total})</th>
            </tr>
          </thead>
          <tbody>
            {result.table.map((entry: Table1Entry) => renderEntry(entry))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: '0.72rem', color: '#aaa', marginTop: '0.75rem', marginBottom: 0 }}>
        Continuous variables: mean ± SD or median [IQR] per variable. Categorical variables: n (%).
      </p>
    </div>
  );
}

function renderEntry(entry: Table1Entry): React.ReactNode {
  if (entry.type === 'continuous') {
    return entry.rows.map((row, i) => (
      <tr key={`${entry.variable}-${i}`} style={{ borderBottom: '1px solid #f0f0f0' }}>
        <td style={{ padding: '7px 12px', color: '#333' }}>{row.label}</td>
        <td style={{ padding: '7px 12px', textAlign: 'right', color: '#1C2B3A', fontWeight: 600 }}>{row.value}</td>
      </tr>
    ));
  }

  // Categorical: label row + indented category rows
  return (
    <React.Fragment key={entry.variable}>
      <tr style={{ background: '#f8f7f4' }}>
        <td colSpan={2} style={{ padding: '7px 12px', fontWeight: 700, color: '#1C2B3A' }}>
          {entry.variable}
        </td>
      </tr>
      {entry.rows.map((row, i) => (
        <tr key={`${entry.variable}-cat-${i}`} style={{ borderBottom: '1px solid #f0f0f0' }}>
          <td style={{ padding: '6px 12px 6px 28px', color: '#555' }}>{row.label}</td>
          <td style={{ padding: '6px 12px', textAlign: 'right', color: '#333' }}>{row.value}</td>
        </tr>
      ))}
    </React.Fragment>
  );
}

const exportBtnStyle: React.CSSProperties = {
  background: '#f0f4f8',
  color: '#333',
  border: '1px solid #dde4ea',
  borderRadius: 7,
  padding: '0.4rem 0.85rem',
  fontSize: '0.8rem',
  cursor: 'pointer',
  fontWeight: 600,
};
