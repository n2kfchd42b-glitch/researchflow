import React, { useState } from 'react';
import { useNGO } from '../context/NGOPlatformContext';

interface DatasetVersionTimelineProps {
  datasetId: string;
}

const DatasetVersionTimeline: React.FC<DatasetVersionTimelineProps> = ({ datasetId }) => {
  const { getDatasetVersions, restoreDatasetVersion } = useNGO();
  const versions = getDatasetVersions(datasetId).slice().reverse(); // Latest first
  const [compareIdx, setCompareIdx] = useState<number | null>(null);

  return (
    <div style={{ margin: '24px 0' }}>
      <div style={{ fontWeight: 600, fontSize: 16, color: '#1C2B3A', marginBottom: 12 }}>Dataset Version Timeline</div>
      <button style={{ background: '#5A8A6A', color: '#fff', borderRadius: 8, padding: '6px 16px', fontSize: 14, marginBottom: 16 }}>Create Snapshot</button>
      <div style={{ borderLeft: '3px solid #2E86C1', paddingLeft: 24 }}>
        {versions.map((v: any, idx: number) => (
          <div key={v.version} style={{ marginBottom: 32, position: 'relative' }}>
            <div style={{ position: 'absolute', left: -32, top: 0, width: 32, height: 32, borderRadius: '50%', background: '#2E86C1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, border: v.active ? '3px solid #2E86C1' : 'none' }}>
              v{v.version}
            </div>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#1C2B3A' }}>{v.label}</div>
            <div style={{ fontSize: 13, color: '#888' }}>{v.timestamp} ({new Date(v.timestamp).toLocaleString()})</div>
            <div style={{ fontSize: 13, color: '#5A8A6A' }}>{v.changes}</div>
            <div style={{ fontSize: 13, color: '#888' }}>Rows: {v.rowCount} × Columns: {v.columnCount}</div>
            <button style={{ background: '#2E86C1', color: '#fff', borderRadius: 8, padding: '4px 12px', fontSize: 13, marginTop: 8 }} onClick={() => restoreDatasetVersion(datasetId, v.version)}>
              Restore
            </button>
            <button style={{ background: '#e0e0e0', color: '#1C2B3A', borderRadius: 8, padding: '4px 12px', fontSize: 13, marginLeft: 8 }} onClick={() => setCompareIdx(idx)}>
              Compare with previous
            </button>
            {compareIdx === idx && idx < versions.length - 1 && (
              <div style={{ marginTop: 8, background: '#F8F9F9', borderRadius: 8, padding: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1C2B3A' }}>Diff:</div>
                <div style={{ fontSize: 13, color: '#888' }}>Rows added/removed: {/* mock diff */} +{v.rowCount - versions[idx+1].rowCount}</div>
                <div style={{ fontSize: 13, color: '#888' }}>Columns added/removed: {/* mock diff */} +{v.columnCount - versions[idx+1].columnCount}</div>
                <div style={{ fontSize: 13, color: '#888' }}>Value changes: {/* mock diff */} 0</div>
                <button style={{ marginTop: 8, background: '#e0e0e0', color: '#1C2B3A', borderRadius: 8, padding: '4px 12px', fontSize: 13 }} onClick={() => setCompareIdx(null)}>Close</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DatasetVersionTimeline;
