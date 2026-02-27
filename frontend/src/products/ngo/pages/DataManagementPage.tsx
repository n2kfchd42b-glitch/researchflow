import React from 'react';
import DataPipelineBar from '../components/DataPipelineBar';
import DataUploadSummary from '../components/DataUploadSummary';
import DatasetVersionTimeline from '../components/DatasetVersionTimeline';
import DatasetSizeWarning from '../components/DatasetSizeWarning';
import FieldDataImporter from '../components/FieldDataImporter';
import { useNGOPlatform } from '../context/NGOPlatformContext';

const DataManagementPage: React.FC<{ datasetId: string }> = ({ datasetId }) => {
  const { state } = useNGOPlatform();
  const dataset = state.datasets?.find((d: any) => d.id === datasetId) || { id: datasetId, name: '', size: 0, rowCount: 0, columns: [], uploadedAt: '', preview: [] };

  return (
    <div style={{ padding: 24 }}>
      <DataPipelineBar datasetId={datasetId} currentStage={state.datasetPipelines[datasetId]?.slice(-1)[0]?.stage || 'raw'} />
      <FieldDataImporter onUpload={() => {}} />
      <DatasetSizeWarning fileSize={dataset.size} rowCount={dataset.rowCount} />
      <DataUploadSummary dataset={dataset} />
      <DatasetVersionTimeline datasetId={datasetId} />
      {/* Add more data quality and management features as needed */}
    </div>
  );
};

export default DataManagementPage;
