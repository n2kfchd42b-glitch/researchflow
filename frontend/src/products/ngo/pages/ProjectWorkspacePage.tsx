import React from 'react';
import AlertsBanner from '../components/AlertsBanner';
import DataPipelineBar from '../components/DataPipelineBar';
import DataUploadSummary from '../components/DataUploadSummary';
import DatasetVersionTimeline from '../components/DatasetVersionTimeline';
import ReproducibilityPackage from '../components/ReproducibilityPackage';
import EmptyState from '../components/EmptyState';
import { useNGOPlatform } from '../context/NGOPlatformContext';

const ProjectWorkspacePage: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { state } = useNGOPlatform();
  const project = state.projects?.find((p: any) => p.id === projectId);
  const datasetId = project?.datasetId || '';

  return (
    <div style={{ padding: 24 }}>
      <AlertsBanner projectId={projectId} />
      <div style={{ margin: '16px 0' }}>
        <DataPipelineBar datasetId={datasetId} currentStage={state.datasetPipelines[datasetId]?.slice(-1)[0]?.stage || 'raw'} />
      </div>
      <div style={{ margin: '16px 0' }}>
        <DataUploadSummary dataset={{ id: datasetId, name: 'Sample.csv', size: 12345, rowCount: 100, columns: [], uploadedAt: '2026-02-27', preview: [] }} />
      </div>
      <div style={{ margin: '16px 0' }}>
        <DatasetVersionTimeline datasetId={datasetId} />
      </div>
      <div style={{ margin: '16px 0' }}>
        <ReproducibilityPackage projectId={projectId} />
      </div>
      {/* Add more tabs and content as needed */}
      <div style={{ margin: '16px 0' }}>
        <EmptyState icon={<span>📊</span>} title="No data" description="No data available for this project." actionLabel="Upload Data" onAction={() => {}} />
      </div>
    </div>
  );
};

export default ProjectWorkspacePage;
