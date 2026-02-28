import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AlertsBanner from '../components/AlertsBanner';
import { ProjectDashboard } from '../components/ProjectDashboard';
import SuccessToast from '../components/SuccessToast';
import EmptyState from '../components/EmptyState';
import { useNGOPlatform } from '../context/NGOPlatformContext';

const NGODashboardPage: React.FC = () => {
  const { state, createProgram, setActiveProgram } = useNGOPlatform();
  const [toast, setToast] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', description: '' });

  // When a program is active, show its project IDs; otherwise show all program names
  const activeProgram = state.activeProgramId
    ? state.programs.find(p => p.id === state.activeProgramId)
    : null;

  const programList = state.activeProgramId
    ? state.programs.filter(p => p.id === state.activeProgramId)
    : state.programs;

  const handleCreateProgram = () => {
    if (!projectForm.name.trim()) return;
    createProgram({
      name: projectForm.name,
      description: projectForm.description,
      country: '',
      donor: '',
      totalBudget: 0,
      startDate: '',
      endDate: '',
      projectIds: [],
      logoUrl: null,
    });
    setProjectForm({ name: '', description: '' });
    setShowNewProject(false);
    setToast('Program created successfully');
  };

  return (
    <div style={{ padding: 24 }}>
      {toast && <SuccessToast message={toast} duration={3000} />}

      <AlertsBanner />

      {activeProgram && <ProjectDashboard />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: activeProgram ? 0 : 8 }}>
        <h2 style={{ margin: 0, color: '#1C2B3A', fontSize: 20, fontWeight: 700 }}>
          {activeProgram ? `${activeProgram.name} — Programs` : 'All Programs'}
        </h2>
        <button
          onClick={() => setShowNewProject(true)}
          style={{ background: '#5A8A6A', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          + New Program
        </button>
      </div>

      {showNewProject && (
        <div style={{ background: '#fff', border: '1px solid #E5E9EF', borderRadius: 10, padding: 20, marginBottom: 20, boxShadow: '0 2px 8px rgba(44,62,80,0.07)' }}>
          <h3 style={{ margin: '0 0 12px', color: '#1C2B3A', fontSize: 16 }}>Create New Program</h3>
          <input
            placeholder="Program name (required)"
            value={projectForm.name}
            onChange={e => setProjectForm(f => ({ ...f, name: e.target.value }))}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, marginBottom: 8, boxSizing: 'border-box' }}
          />
          <textarea
            placeholder="Description (optional)"
            value={projectForm.description}
            onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, marginBottom: 12, resize: 'vertical', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleCreateProgram}
              style={{ background: '#5A8A6A', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Create Program
            </button>
            <button
              onClick={() => { setShowNewProject(false); setProjectForm({ name: '', description: '' }); }}
              style={{ background: '#f0f0f0', color: '#444', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 14, cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {programList.length === 0 ? (
        <EmptyState
          icon={<span>📁</span>}
          title="No programs yet"
          description="Create a program to organise your projects, track indicators, and generate reports."
          actionLabel="Create Program"
          onAction={() => setShowNewProject(true)}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {programList.map(program => {
            const progIndicators = state.indicators.filter(i => program.projectIds.includes(i.projectId));
            const onTrack = progIndicators.filter(i => i.currentValue !== null && i.targetValue !== null && i.currentValue >= i.targetValue).length;
            return (
              <div
                key={program.id}
                style={{ background: '#fff', border: '1px solid #E5E9EF', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(44,62,80,0.06)', cursor: 'pointer' }}
                onClick={() => setActiveProgram(program.id)}
              >
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1C2B3A', marginBottom: 4 }}>{program.name}</div>
                {program.donor && <div style={{ fontSize: 13, color: '#5A8A6A', marginBottom: 2 }}>Donor: {program.donor}</div>}
                {program.country && <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>Country: {program.country}</div>}
                <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                  <div>
                    <span style={{ color: '#888' }}>Projects: </span>
                    <span style={{ fontWeight: 600, color: '#1C2B3A' }}>{program.projectIds.length}</span>
                  </div>
                  <div>
                    <span style={{ color: '#888' }}>Indicators on track: </span>
                    <span style={{ fontWeight: 600, color: '#5A8A6A' }}>{onTrack}</span>
                  </div>
                </div>
                {program.totalBudget > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 3 }}>Budget utilization</div>
                    <div style={{ height: 6, background: '#E5E9EF', borderRadius: 3 }}>
                      <div style={{ height: 6, borderRadius: 3, background: '#5A8A6A', width: '30%' }} />
                    </div>
                  </div>
                )}
                <div style={{ marginTop: 12 }}>
                  <Link
                    to={`/ngo/projects`}
                    onClick={e => { e.stopPropagation(); setActiveProgram(program.id); }}
                    style={{ fontSize: 13, color: '#2E86C1', textDecoration: 'none', fontWeight: 500 }}
                  >
                    View Projects →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NGODashboardPage;
