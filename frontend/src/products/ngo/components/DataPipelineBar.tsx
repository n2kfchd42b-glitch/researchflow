import React from 'react';
import { useNGO } from '../context/NGOPlatformContext';

interface DataPipelineBarProps {
  datasetId: string;
  currentStage: string;
}

const stages = [
  { key: 'raw', label: 'Raw' },
  { key: 'cleaning', label: 'Cleaning' },
  { key: 'analysis-ready', label: 'Analysis Ready' },
  { key: 'indicators', label: 'Indicators' },
  { key: 'reports', label: 'Reports' },
];

const DataPipelineBar: React.FC<DataPipelineBarProps> = ({ datasetId, currentStage }) => {
  const { getDatasetPipeline } = useNGO();
  const pipeline = getDatasetPipeline(datasetId);
  const currentIdx = stages.findIndex(s => s.key === currentStage);

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: 50, background: '#F8F9F9', borderRadius: 8, marginBottom: 16, padding: '0 16px' }}>
      {stages.map((stage, idx) => {
        const completed = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <React.Fragment key={stage.key}>
            <div
              style={{
                padding: '6px 18px',
                borderRadius: 20,
                background: completed ? '#5A8A6A' : isCurrent ? '#2E86C1' : '#fff',
                color: completed || isCurrent ? '#fff' : '#1C2B3A',
                fontWeight: 600,
                boxShadow: isCurrent ? '0 0 8px #2E86C1' : undefined,
                position: 'relative',
                animation: isCurrent ? 'pulse 1s infinite' : undefined,
                border: !completed && !isCurrent ? '1px solid #e0e0e0' : undefined,
                cursor: completed || isCurrent ? 'pointer' : 'default',
              }}
              onClick={() => {
                // Navigation logic
              }}
            >
              {completed ? '✔ ' : ''}{stage.label}
            </div>
            {idx < stages.length - 1 && (
              <span style={{ margin: '0 8px', color: '#888' }}>→</span>
            )}
          </React.Fragment>
        );
      })}
      <div style={{ marginLeft: 24, fontSize: 13, color: '#1C2B3A' }}>
        Dataset: {datasetId} v{pipeline.length}
      </div>
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 8px #2E86C1; }
          50% { box-shadow: 0 0 16px #2E86C1; }
          100% { box-shadow: 0 0 8px #2E86C1; }
        }
      `}</style>
    </div>
  );
};

export default DataPipelineBar;
