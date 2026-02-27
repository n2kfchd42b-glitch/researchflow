import React from 'react';
import { useNGOPlatform } from '../context/NGOPlatformContext';

const ProgramDashboard: React.FC = () => {
  const { state } = useNGOPlatform();
  const program = state.programs.find((p: any) => p.id === state.activeProgramId);
  if (!program) return null;

  // Aggregate metrics (mock logic)
  const projects = program.projectIds.length;
  const totalEnrollment = 0; // Replace with real sum
  const budgetSpent = 0; // Replace with real sum
  const indicators = state.indicators.filter((i: any) => program.projectIds.includes(i.projectId));
  const onTrack = indicators.filter((i: any) => i.currentValue && i.targetValue && i.currentValue >= i.targetValue).length;
  const offTrack = indicators.filter((i: any) => i.currentValue && i.targetValue && i.currentValue < i.targetValue).length;

  return (
    <div style={{ background: '#F8F9F9', borderRadius: 8, margin: '16px 0', padding: '16px', boxShadow: '0 2px 8px rgba(44,62,80,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1C2B3A' }}>{program.name}</div>
          <div style={{ color: '#5A8A6A', fontSize: 14 }}>{program.donor} — {program.country}</div>
          <div style={{ color: '#2E86C1', fontSize: 13 }}>Timeline: {program.startDate} to {program.endDate}</div>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <div>
            <div style={{ fontSize: 14, color: '#1C2B3A' }}>Total Enrollment</div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{totalEnrollment}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: '#1C2B3A' }}>Budget Utilization</div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{budgetSpent} / {program.totalBudget}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: '#1C2B3A' }}>Projects</div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{projects}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: '#1C2B3A' }}>Indicators On Track</div>
            <div style={{ fontWeight: 600, fontSize: 16, color: '#5A8A6A' }}>{onTrack}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: '#1C2B3A' }}>Indicators Off Track</div>
            <div style={{ fontWeight: 600, fontSize: 16, color: '#C0533A' }}>{offTrack}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramDashboard;
