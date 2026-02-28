import React from 'react';

interface DatasetSizeWarningProps {
  fileSize: number;
  rowCount: number;
}

const formatSize = (bytes: number) => {
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes > 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} bytes`;
};

const DatasetSizeWarning: React.FC<DatasetSizeWarningProps> = ({ fileSize, rowCount }) => {
  if (fileSize > 100 * 1e6) {
    return (
      <div style={{ background: '#C0533A', color: '#fff', padding: '12px 20px', borderRadius: 8, marginBottom: 16, fontWeight: 500 }}>
        Very large dataset detected ({formatSize(fileSize)}). Consider filtering or sampling before analysis.
      </div>
    );
  }
  if (fileSize > 50 * 1e6 || rowCount > 100000) {
    return (
      <div style={{ background: '#F9E79F', color: '#C0533A', padding: '12px 20px', borderRadius: 8, marginBottom: 16, fontWeight: 500 }}>
        Large dataset detected ({formatSize(fileSize)}). Some operations may take longer.
      </div>
    );
  }
  return null;
};

export default DatasetSizeWarning;
