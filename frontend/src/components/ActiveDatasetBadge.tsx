import React from 'react';
import { useWorkflow } from '../context/WorkflowContext';

export default function ActiveDatasetBadge() {
  const { activeDataset, clearActiveDataset } = useWorkflow();

  if (!activeDataset?.datasetId) {
    return (
      <span style={{ fontSize: '0.75rem', color: '#9CA3AF', border: '1px dashed #D1D5DB', borderRadius: 999, padding: '0.2rem 0.6rem' }}>
        No active dataset
      </span>
    );
  }

  const shortId = activeDataset.datasetId.slice(0, 8);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', maxWidth: 320 }}>
      <span
        title={activeDataset.datasetName || activeDataset.datasetId}
        style={{
          fontSize: '0.74rem',
          color: '#374151',
          background: '#EEF2FF',
          border: '1px solid #C7D2FE',
          borderRadius: 999,
          padding: '0.2rem 0.55rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 260,
        }}
      >
        Active: {activeDataset.datasetName || shortId}
        {activeDataset.datasetVersionId ? ` (v${activeDataset.datasetVersionId})` : ''}
      </span>
      <button
        onClick={clearActiveDataset}
        title="Clear active dataset"
        style={{
          border: '1px solid #D1D5DB',
          background: 'white',
          color: '#6B7280',
          borderRadius: 999,
          fontSize: '0.7rem',
          width: 20,
          height: 20,
          lineHeight: '18px',
          textAlign: 'center',
          cursor: 'pointer',
          padding: 0,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}
