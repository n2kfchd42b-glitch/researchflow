import React from 'react';
import AlertsBanner from '../components/AlertsBanner';
import ProgramDashboard from '../components/ProgramDashboard';
import { useNGOPlatform } from '../context/NGOPlatformContext';
import EmptyState from '../components/EmptyState';

const NGODashboardPage: React.FC = () => {
  const { state } = useNGOPlatform();
  const projects = state.activeProgramId
    ? state.programs.find(p => p.id === state.activeProgramId)?.projectIds || []
    : [];

  return (
    <div style={{ padding: 24 }}>
      <AlertsBanner />
      {state.activeProgramId && <ProgramDashboard />}
      <div style={{ marginTop: 24 }}>
        {projects.length === 0 ? (
          <EmptyState icon={<span>📁</span>} title="No projects" description="No projects found for this program." actionLabel="Create Project" onAction={() => {}} />
        ) : (
          <div>Project list goes here</div>
        )}
      </div>
    </div>
  );
};

export default NGODashboardPage;
