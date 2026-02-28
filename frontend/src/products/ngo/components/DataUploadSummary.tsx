import React from 'react';
import { useNGOPlatform } from '../context/NGOPlatformContext';

interface DataUploadSummaryProps {
  dataset: any;
}

const DataUploadSummary: React.FC<DataUploadSummaryProps> = ({ dataset }) => {
  const { calculateQualityScore, setDataQualityScore } = useNGOPlatform();
  const columns = dataset.columns || [];

  // useMemo prevents recomputing on every render; dataset.id as the only dep
  const qualityScore = React.useMemo(
    () => calculateQualityScore(dataset.id, columns),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataset.id]
  );

  // Persist to context once per dataset (not on every render)
  React.useEffect(() => {
    setDataQualityScore(dataset.id, qualityScore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset.id]);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 16, fontWeight: 600, fontSize: 16, color: '#1C2B3A' }}>
        File: {dataset.name} | Size: {dataset.size} | Rows: {dataset.rowCount} × Columns: {columns.length} | Uploaded: {dataset.uploadedAt}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {columns.map((col: any) => (
          <div key={col.name} style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 12, background: '#fff' }}>
            <div style={{ fontWeight: 600, color: '#2E86C1' }}>{col.name}</div>
            <div style={{ fontSize: 13, color: '#5A8A6A', marginBottom: 4 }}>{col.type}</div>
            {/* Detection tags */}
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
              {col.tags && col.tags.map((tag: string) => <span key={tag} style={{ marginRight: 6, background: '#F9E79F', color: '#C0533A', borderRadius: 4, padding: '2px 6px' }}>{tag}</span>)}
            </div>
            <div style={{ fontSize: 12, color: col.missing > 0.1 * dataset.rowCount ? '#C0533A' : '#888' }}>
              Missing: {col.missing}
            </div>
            <div style={{ fontSize: 12, color: '#888' }}>Unique: {col.unique}</div>
          </div>
        ))}
      </div>
      <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ width: 120, height: 120, borderRadius: '50%', background: qualityScore.overall >= 80 ? '#5A8A6A' : qualityScore.overall >= 60 ? '#F9E79F' : '#C0533A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#fff', fontWeight: 700 }}>
          {qualityScore.overall}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#1C2B3A' }}>Data Quality Score</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {qualityScore.suggestions.slice(0, 3).map((s: any, i: number) => (
              <li key={i} style={{ marginBottom: 4 }}>
                <button style={{ background: '#F9E79F', color: '#C0533A', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 13, marginRight: 8 }}>{s}</button>
                {/* Action buttons can be wired up */}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: '#1C2B3A' }}>Auto-Suggested Cleaning Actions</div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {/* Example suggestions, can be generated from column analysis */}
          <li style={{ marginBottom: 4 }}>
            <span style={{ marginRight: 8 }}>🧹</span> Remove duplicates <button style={{ marginLeft: 8, background: '#5A8A6A', color: '#fff', borderRadius: 4, border: 'none', padding: '2px 8px' }}>Apply</button> <button style={{ marginLeft: 4, background: '#e0e0e0', color: '#1C2B3A', borderRadius: 4, border: 'none', padding: '2px 8px' }}>Dismiss</button>
          </li>
        </ul>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: '#1C2B3A' }}>Quick Preview</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {columns.map((col: any) => <th key={col.name} style={{ borderBottom: '1px solid #e0e0e0', padding: 4 }}>{col.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {dataset.preview && dataset.preview.slice(0, 5).map((row: any, idx: number) => (
              <tr key={idx}>
                {columns.map((col: any) => <td key={col.name} style={{ borderBottom: '1px solid #f0f0f0', padding: 4 }}>{row[col.name]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataUploadSummary;
