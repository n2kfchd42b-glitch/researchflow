import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import AlertsBanner from '../components/AlertsBanner';
import DataPipelineBar from '../components/DataPipelineBar';
import DataUploadSummary from '../components/DataUploadSummary';
import DatasetVersionTimeline from '../components/DatasetVersionTimeline';
import ReproducibilityPackage from '../components/ReproducibilityPackage';
import FieldDataImporter from '../components/FieldDataImporter';
import SuccessToast from '../components/SuccessToast';
import LoadingOverlay from '../components/LoadingOverlay';
import EmptyState from '../components/EmptyState';
import { useNGOPlatform } from '../context/NGOPlatformContext';

const TABS = ['Data', 'Indicators', 'Analysis', 'Budget', 'Reports'];

const ProjectWorkspacePage: React.FC = () => {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const { state } = useNGOPlatform();
  const [activeTab, setActiveTab] = useState('Data');
  const [uploadedDataset, setUploadedDataset] = useState<any>(null);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);

  const pipeline = projectId ? state.datasetPipelines[projectId] : [];
  const currentStage = pipeline?.slice(-1)[0]?.stage || 'raw';
  const datasetId = uploadedDataset?.id || projectId;

  const handleUpload = (file: File, _detected: any) => {
    setLoading(true);
    setTimeout(() => {
      const dataset = {
        id: `ds_${Date.now()}`,
        name: file.name,
        size: file.size,
        rowCount: Math.floor(Math.random() * 900) + 100,
        columns: [
          { name: 'id', type: 'Numeric', missing: 0, unique: 100, tags: ['ID Field'] },
          { name: 'gender', type: 'Categorical', missing: 3, unique: 2, tags: ['Yes/No'] },
          { name: 'age', type: 'Numeric', missing: 8, unique: 45, tags: [] },
          { name: 'site', type: 'Categorical', missing: 0, unique: 5, tags: [] },
        ],
        uploadedAt: new Date().toISOString().slice(0, 10),
        preview: [
          { id: 1, gender: 'Male', age: 34, site: 'Nairobi' },
          { id: 2, gender: 'Female', age: 28, site: 'Mombasa' },
          { id: 3, gender: 'Female', age: 42, site: 'Nairobi' },
          { id: 4, gender: 'Male', age: 55, site: 'Kisumu' },
          { id: 5, gender: 'Female', age: 31, site: 'Eldoret' },
        ],
      };
      setUploadedDataset(dataset);
      setLoading(false);
      setToast('Data file uploaded successfully');
    }, 800);
  };

  return (
    <div style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading} message="Processing data file..." />
      {toast && <SuccessToast message={toast} duration={3000} />}

      <AlertsBanner projectId={projectId} />

      <div style={{ padding: '16px 24px 0' }}>
        <h2 style={{ margin: '0 0 4px', color: '#1C2B3A', fontSize: 20, fontWeight: 700 }}>
          Project Workspace
        </h2>
        <div style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
          Project ID: {projectId || 'None selected'}
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #E5E9EF', marginBottom: 0 }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 18px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #2E86C1' : '2px solid transparent',
                marginBottom: -2,
                color: activeTab === tab ? '#2E86C1' : '#555',
                fontWeight: activeTab === tab ? 700 : 400,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 24 }}>
        {/* ── DATA TAB ── */}
        {activeTab === 'Data' && (
          <div>
            <DataPipelineBar datasetId={datasetId} currentStage={currentStage} />

            <div style={{ marginBottom: 24 }}>
              <FieldDataImporter onUpload={handleUpload} />
            </div>

            {uploadedDataset ? (
              <>
                <DataUploadSummary dataset={uploadedDataset} />
                <DatasetVersionTimeline datasetId={uploadedDataset.id} />
              </>
            ) : (
              <EmptyState
                icon={<span>📂</span>}
                title="No data file uploaded"
                description="Upload a CSV or Excel file to get started with data collection and cleaning."
                actionLabel="Upload Data File"
                onAction={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
              />
            )}
          </div>
        )}

        {/* ── INDICATORS TAB ── */}
        {activeTab === 'Indicators' && (
          <EmptyState
            icon={<span>🎯</span>}
            title="No indicators yet"
            description="Create indicators to track program progress and outcomes."
            actionLabel="Go to Indicator Builder"
            onAction={() => window.location.href = '/ngo/indicators'}
          />
        )}

        {/* ── ANALYSIS TAB ── */}
        {activeTab === 'Analysis' && (
          <EmptyState
            icon={<span>🧮</span>}
            title="No analysis run yet"
            description="Upload a data file first, then choose an analysis method."
            actionLabel="Upload Data File"
            onAction={() => setActiveTab('Data')}
          />
        )}

        {/* ── BUDGET TAB ── */}
        {activeTab === 'Budget' && (
          <EmptyState
            icon={<span>💰</span>}
            title="No budget entries"
            description="Track project expenditure against your approved budget."
            actionLabel="Go to Budget Tracker"
            onAction={() => window.location.href = '/ngo/budget'}
          />
        )}

        {/* ── REPORTS TAB ── */}
        {activeTab === 'Reports' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <ReproducibilityPackage projectId={projectId} />
            </div>
            <EmptyState
              icon={<span>📄</span>}
              title="No reports generated"
              description="Generate baseline, endline, or donor reports from your project data."
              actionLabel="Generate Report"
              onAction={() => window.location.href = '/ngo/reports/generate'}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectWorkspacePage;
