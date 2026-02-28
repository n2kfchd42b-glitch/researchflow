import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import DataPipelineBar from '../components/DataPipelineBar';
import DataUploadSummary from '../components/DataUploadSummary';
import DatasetVersionTimeline from '../components/DatasetVersionTimeline';
import DatasetSizeWarning from '../components/DatasetSizeWarning';
import FieldDataImporter from '../components/FieldDataImporter';
import LoadingOverlay from '../components/LoadingOverlay';
import SuccessToast from '../components/SuccessToast';
import { useNGOPlatform } from '../context/NGOPlatformContext';

const DataManagementPage: React.FC = () => {
  const { datasetId = '' } = useParams<{ datasetId: string }>();
  const { state } = useNGOPlatform();
  const [uploadedDataset, setUploadedDataset] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const pipeline = datasetId ? state.datasetPipelines[datasetId] : [];
  const currentStage = pipeline?.slice(-1)[0]?.stage || 'raw';

  const activeDataset = uploadedDataset || {
    id: datasetId || 'default',
    name: '',
    size: 0,
    rowCount: 0,
    columns: [],
    uploadedAt: '',
    preview: [],
  };

  const handleUpload = (file: File, _detected: any) => {
    setLoading(true);
    setTimeout(() => {
      const dataset = {
        id: datasetId || `ds_${Date.now()}`,
        name: file.name,
        size: file.size,
        rowCount: Math.floor(Math.random() * 900) + 100,
        columns: [
          { name: 'id', type: 'Numeric', missing: 0, unique: 100, tags: ['ID Field'] },
          { name: 'gender', type: 'Categorical', missing: 3, unique: 2, tags: ['Yes/No'] },
          { name: 'age', type: 'Numeric', missing: 8, unique: 45, tags: [] },
          { name: 'district', type: 'Categorical', missing: 0, unique: 10, tags: [] },
        ],
        uploadedAt: new Date().toISOString().slice(0, 10),
        preview: [
          { id: 1, gender: 'Male', age: 34, district: 'Nairobi' },
          { id: 2, gender: 'Female', age: 28, district: 'Mombasa' },
          { id: 3, gender: 'Female', age: 42, district: 'Nairobi' },
          { id: 4, gender: 'Male', age: 55, district: 'Kisumu' },
          { id: 5, gender: 'Female', age: 31, district: 'Eldoret' },
        ],
      };
      setUploadedDataset(dataset);
      setLoading(false);
      setToast('Data file uploaded successfully');
    }, 800);
  };

  return (
    <div style={{ padding: 24, position: 'relative' }}>
      <LoadingOverlay visible={loading} message="Processing data file..." />
      {toast && <SuccessToast message={toast} duration={3000} />}

      <h2 style={{ margin: '0 0 16px', color: '#1C2B3A', fontSize: 20, fontWeight: 700 }}>
        Data Management
      </h2>

      <DataPipelineBar datasetId={activeDataset.id} currentStage={currentStage} />

      <div style={{ marginBottom: 20 }}>
        <FieldDataImporter onUpload={handleUpload} />
      </div>

      <DatasetSizeWarning fileSize={activeDataset.size} rowCount={activeDataset.rowCount} />

      {uploadedDataset && (
        <>
          <DataUploadSummary dataset={uploadedDataset} />
          <DatasetVersionTimeline datasetId={uploadedDataset.id} />
        </>
      )}
    </div>
  );
};

export default DataManagementPage;
