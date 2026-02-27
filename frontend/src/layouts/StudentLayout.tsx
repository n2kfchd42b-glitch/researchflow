import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Menu, X, CheckCircle, Circle, Lock } from 'lucide-react';
import ProjectSelector from '../components/ProjectSelector';
import StepIndicator from '../products/student/components/StepIndicator';
import { StudentWizardProvider, useStudentWizard } from '../products/student/context/StudentWizardContext';

const WORKFLOW_STEPS = [
  { label: 'Study Setup',      path: '/student/setup',    step: 1 },
  { label: 'Data Upload',      path: '/student/upload',   step: 2 },
  { label: 'Guided Analysis',  path: '/student/analysis', step: 3 },
  { label: 'Results Review',   path: '/student/results',  step: 4 },
  { label: 'Report Generation',path: '/student/report',   step: 5 },
];

const TOOLS = [
  { label: 'Table 1',          path: '/student/table1' },
  { label: 'Descriptive Stats',path: '/student/descriptive' },
  { label: 'Survival Analysis',path: '/student/survival' },
  { label: 'Sample Size',      path: '/student/samplesize' },
  { label: 'Codebook',         path: '/student/codebook' },
  { label: 'Literature Review',path: '/student/literature' },
  { label: 'PRISMA',           path: '/student/prisma' },
  { label: 'Subgroup',         path: '/student/subgroup' },
  { label: 'Sensitivity',      path: '/student/sensitivity' },
  { label: 'Forest Plot',      path: '/student/forest-plot' },
  { label: 'Visualization',    path: '/student/visualise' },
  { label: 'Sample Datasets',  path: '/student/samples' },
];

function SidebarContent({ onClose, user, onLogout }: { onClose?: () => void; user: any; onLogout: () => void }) {
  const { state } = useStudentWizard();
  const navigate = useNavigate();

  const getStepStatus = (step: number) => {
    if (step <= state.maxCompletedStep) return 'completed';
    if (step === state.currentStep) return 'current';
    return 'locked';
  };

  return (
    <>
      {/* Sidebar header */}
      <div style={{
        padding: '1.25rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <GraduationCap size={22} color="#2E86C1" />
        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'white' }}>Student Wizard</span>
        {onClose && (
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav content */}
      <nav style={{ padding: '0.75rem 0', flex: 1, overflowY: 'auto' }}>
        {/* WORKFLOW group */}
        <div style={{ padding: '0.5rem 1rem 0.25rem', fontSize: '0.7rem', color: '#6B8099', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Workflow
        </div>
        {WORKFLOW_STEPS.map(({ label, path, step }) => {
          const status = getStepStatus(step);
          const isLocked = status === 'locked';
          return (
            <div
              key={path}
              onClick={() => {
                if (!isLocked) {
                  navigate(path);
                  onClose?.();
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.55rem 1rem',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                opacity: isLocked ? 0.5 : 1,
                color: 'white',
                fontSize: '0.875rem',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!isLocked) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
            >
              {status === 'completed' && <CheckCircle size={14} color="#5A8A6A" />}
              {status === 'current' && (
                <span style={{
                  width: 10, height: 10, borderRadius: '50%', background: '#2E86C1',
                  animation: 'pulse 1.5s infinite', display: 'inline-block', flexShrink: 0,
                }} />
              )}
              {status === 'locked' && <Lock size={12} color="#6B8099" />}
              {label}
            </div>
          );
        })}

        {/* TOOLS group */}
        <div style={{ padding: '1rem 1rem 0.25rem', fontSize: '0.7rem', color: '#6B8099', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Tools
        </div>
        {TOOLS.map(({ label, path }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onClose}
            style={({ isActive }) => ({
              display: 'block',
              padding: '0.5rem 1rem',
              color: isActive ? '#C0533A' : 'rgba(255,255,255,0.8)',
              textDecoration: 'none',
              fontSize: '0.85rem',
              background: isActive ? 'rgba(192,83,58,0.12)' : 'transparent',
              borderRight: isActive ? '3px solid #C0533A' : '3px solid transparent',
              transition: 'background 0.15s',
            })}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

function StudentLayoutInner({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F7FA' }}>
      {/* Desktop Sidebar */}
      <aside style={{
        width: 260,
        background: '#1C2B3A',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: 100,
        overflowY: 'auto',
      }} className="sidebar-desktop">
        <SidebarContent user={user} onLogout={onLogout} />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
          <div style={{ width: 260, background: '#1C2B3A', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
            <SidebarContent user={user} onLogout={onLogout} onClose={() => setSidebarOpen(false)} />
          </div>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content area */}
      <div style={{ marginLeft: 0, flex: 1, display: 'flex', flexDirection: 'column' }} className="main-with-sidebar">
        {/* Top bar */}
        <header style={{
          background: 'white',
          borderBottom: '1px solid #E5E9EF',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            style={{ display: 'none', background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '0.3rem 0.5rem', cursor: 'pointer' }}
          >
            <Menu size={18} />
          </button>
          <Link to="/" style={{ fontWeight: 700, color: '#C0533A', textDecoration: 'none', fontSize: '1rem' }}>
            ResearchFlow
          </Link>
          <div style={{ flex: 1 }}>
            <ProjectSelector />
          </div>
          <span style={{ fontSize: '0.85rem', color: '#666' }}>{user?.name}</span>
          <button
            onClick={onLogout}
            style={{ background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', color: '#555' }}
          >
            Sign Out
          </button>
        </header>

        {/* Step indicator */}
        <div style={{ background: 'white', borderBottom: '1px solid #E5E9EF', padding: '1rem 1.5rem' }}>
          <StepIndicator />
        </div>

        {/* Page content */}
        <main style={{ flex: 1, padding: '1.5rem', overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .hamburger-btn { display: flex !important; }
          .main-with-sidebar { margin-left: 0 !important; }
        }
        @media (min-width: 769px) {
          .main-with-sidebar { margin-left: 260px !important; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}

export default function StudentLayout({ user, onLogout }: { user: any; onLogout: () => void }) {
  return (
    <StudentWizardProvider>
      <StudentLayoutInner user={user} onLogout={onLogout} />
    </StudentWizardProvider>
  );
}
