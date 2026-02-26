import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { GraduationCap, Menu } from 'lucide-react';
import ProjectSelector from '../components/ProjectSelector';

interface Props {
  user?: any;
  onLogout?: () => void;
}

const STEPS = [
  { label: 'Study Setup',        path: '/student/setup',     step: 1 },
  { label: 'Data Upload',        path: '/student/upload',    step: 2 },
  { label: 'Guided Analysis',    path: '/student/analysis',  step: 3 },
  { label: 'Results Review',     path: '/student/results',   step: 4 },
  { label: 'Report Generation',  path: '/student/report',    step: 5 },
];

const TOOLS = [
  { label: 'Table 1',            path: '/student/table1' },
  { label: 'Descriptive Stats',  path: '/student/descriptive' },
  { label: 'Survival Analysis',  path: '/student/survival' },
  { label: 'Sample Size',        path: '/student/samplesize' },
  { label: 'Codebook',           path: '/student/codebook' },
  { label: 'Literature Review',  path: '/student/literature' },
  { label: 'PRISMA',             path: '/student/prisma' },
];

const ACCENT  = '#C0533A';
const NAV_BG  = '#1C2B3A';

const StudentLayout: React.FC<Props> = ({ user, onLogout }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName =
    user?.name ??
    (() => { try { return JSON.parse(localStorage.getItem('rf_user') || '{}').name; } catch { return null; } })() ??
    'User';

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('rf_user');
      localStorage.removeItem('rf_token');
      window.location.reload();
    }
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const sidebarContent = (
    <div style={{ width: 260, background: NAV_BG, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {/* Brand header */}
      <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <GraduationCap size={22} color={ACCENT} />
          <span style={{ color: 'white', fontWeight: 700, fontSize: '1.05rem' }}>Student Wizard</span>
        </div>
        <Link to="/" style={{ color: '#7a9ab3', fontSize: '0.75rem', textDecoration: 'none' }}>
          ← ResearchFlow
        </Link>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '1rem' }}>
        {/* Wizard Steps */}
        <p style={{ color: '#506070', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '1rem 1.25rem 0.4rem', margin: 0 }}>
          Wizard Steps
        </p>
        {STEPS.map(s => {
          const active = isActive(s.path);
          return (
            <Link key={s.path} to={s.path} onClick={() => setSidebarOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.6rem 1.25rem', textDecoration: 'none',
              background: active ? `${ACCENT}18` : 'transparent',
              borderLeft: `3px solid ${active ? ACCENT : 'transparent'}`,
              color: active ? ACCENT : '#b0bec5',
              fontSize: '0.875rem',
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: active ? ACCENT : 'rgba(255,255,255,0.1)',
                color: active ? 'white' : '#6a8090',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.68rem', fontWeight: 700,
              }}>{s.step}</span>
              {s.label}
            </Link>
          );
        })}

        {/* Tools */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '0.5rem' }}>
          <p style={{ color: '#506070', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '1rem 1.25rem 0.4rem', margin: 0 }}>
            Tools
          </p>
          {TOOLS.map(t => {
            const active = isActive(t.path);
            return (
              <Link key={t.path} to={t.path} onClick={() => setSidebarOpen(false)} style={{
                display: 'block', padding: '0.52rem 1.25rem', textDecoration: 'none',
                background: active ? `${ACCENT}18` : 'transparent',
                borderLeft: `3px solid ${active ? ACCENT : 'transparent'}`,
                color: active ? ACCENT : '#b0bec5',
                fontSize: '0.855rem',
              }}>
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Desktop sidebar */}
      <div className="layout-sidebar">{sidebarContent}</div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 299 }}
            onClick={() => setSidebarOpen(false)}
          />
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 300 }}>
            {sidebarContent}
          </div>
        </>
      )}

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          background: 'white', borderBottom: '1px solid #e5e7eb',
          padding: '0 1.25rem', height: 56, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="layout-hamburger" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} color={NAV_BG} />
            </button>
            <Link to="/" style={{ color: ACCENT, fontWeight: 700, textDecoration: 'none' }}>
              ResearchFlow
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ProjectSelector />
            <span style={{ color: '#777', fontSize: '0.83rem' }}>{displayName}</span>
            <button onClick={handleLogout} style={{
              background: 'transparent', border: '1px solid #ddd',
              color: '#555', padding: '0.3rem 0.75rem', borderRadius: 6,
              cursor: 'pointer', fontSize: '0.8rem',
            }}>Sign Out</button>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', background: '#F4F7FA' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
