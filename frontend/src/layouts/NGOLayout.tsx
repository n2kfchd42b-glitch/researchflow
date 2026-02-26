import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Building2, Menu, ChevronDown, ChevronRight } from 'lucide-react';
import ProjectSelector from '../components/ProjectSelector';

interface Props {
  user?: any;
  onLogout?: () => void;
}

const ACCENT = '#5A8A6A';
const NAV_BG = '#1C2B3A';

const NAV_ITEMS = [
  { label: 'Dashboard',       path: '/ngo',           exact: true },
  { label: 'Projects',        path: '/ngo/projects' },
  { label: 'Field Forms',     path: '/ngo/forms' },
  { label: 'Data Cleaning',   path: '/ngo/clean' },
  { label: 'Data Versioning', path: '/ngo/versioning' },
  { label: 'Budget Tracker',  path: '/ngo/budget' },
  { label: 'Ethics Tracker',  path: '/ngo/ethics' },
];

const ANALYSIS_ITEMS = [
  { label: 'Survival Analysis',    path: '/ngo/analysis/survival' },
  { label: 'PSM',                  path: '/ngo/analysis/psm' },
  { label: 'Subgroup Analysis',    path: '/ngo/analysis/subgroup' },
  { label: 'Sensitivity Analysis', path: '/ngo/analysis/sensitivity' },
  { label: 'Forest Plot',          path: '/ngo/analysis/meta' },
  { label: 'Mixed Effects',        path: '/ngo/analysis/mixed' },
  { label: 'Diff-in-Diff',         path: '/ngo/analysis/did' },
  { label: 'Interrupted TS',       path: '/ngo/analysis/its' },
  { label: 'Spatial Analysis',     path: '/ngo/analysis/spatial' },
  { label: 'Network Meta',         path: '/ngo/analysis/network-meta' },
];

const BOTTOM_ITEMS = [
  { label: 'PRISMA',          path: '/ngo/prisma' },
  { label: 'Reports',         path: '/ngo/reports' },
  { label: 'Study Dashboard', path: '/ngo/studies' },
];

const NGOLayout: React.FC<Props> = ({ user, onLogout }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(
    () => location.pathname.startsWith('/ngo/analysis')
  );

  const displayName =
    user?.name ??
    (() => { try { return JSON.parse(localStorage.getItem('rf_user') || '{}').name; } catch { return null; } })() ??
    'User';

  const handleLogout = () => {
    if (onLogout) onLogout();
    else {
      localStorage.removeItem('rf_user');
      localStorage.removeItem('rf_token');
      window.location.reload();
    }
  };

  const isActive = (path: string, exact = false) =>
    exact ? location.pathname === path
          : location.pathname === path || location.pathname.startsWith(path + '/');

  const analysisActive = location.pathname.startsWith('/ngo/analysis');

  const navLinkStyle = (path: string, exact = false) => ({
    display: 'block' as const,
    padding: '0.55rem 1.25rem',
    textDecoration: 'none' as const,
    background: isActive(path, exact) ? `${ACCENT}18` : 'transparent',
    borderLeft: `3px solid ${isActive(path, exact) ? ACCENT : 'transparent'}`,
    color: isActive(path, exact) ? ACCENT : '#b0bec5',
    fontSize: '0.875rem',
  });

  const sidebarContent = (
    <div style={{ width: 260, background: NAV_BG, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {/* Brand header */}
      <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <Building2 size={22} color={ACCENT} />
          <span style={{ color: 'white', fontWeight: 700, fontSize: '1.05rem' }}>NGO Platform</span>
        </div>
        <Link to="/" style={{ color: '#7a9ab3', fontSize: '0.75rem', textDecoration: 'none' }}>
          ← ResearchFlow
        </Link>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '1rem' }}>
        <p style={{ color: '#506070', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '1rem 1.25rem 0.4rem', margin: 0 }}>
          Navigation
        </p>

        {NAV_ITEMS.map(item => (
          <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
            style={navLinkStyle(item.path, item.exact)}>
            {item.label}
          </Link>
        ))}

        {/* Analysis Suite — expandable */}
        <button
          onClick={() => setAnalysisOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', padding: '0.55rem 1.25rem',
            background: analysisActive ? `${ACCENT}18` : 'transparent',
            border: 'none',
            borderLeft: `3px solid ${analysisActive ? ACCENT : 'transparent'}`,
            color: analysisActive ? ACCENT : '#b0bec5',
            cursor: 'pointer', fontSize: '0.875rem', textAlign: 'left',
          }}
        >
          Analysis Suite
          {analysisOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {analysisOpen && ANALYSIS_ITEMS.map(item => (
          <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} style={{
            display: 'block', padding: '0.45rem 1.25rem 0.45rem 2.25rem', textDecoration: 'none',
            background: isActive(item.path) ? `${ACCENT}18` : 'transparent',
            borderLeft: `3px solid ${isActive(item.path) ? ACCENT : 'transparent'}`,
            color: isActive(item.path) ? ACCENT : '#8da0b0',
            fontSize: '0.82rem',
          }}>
            {item.label}
          </Link>
        ))}

        {BOTTOM_ITEMS.map(item => (
          <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
            style={navLinkStyle(item.path)}>
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div className="layout-sidebar">{sidebarContent}</div>

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

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <header style={{
          background: 'white', borderBottom: '1px solid #e5e7eb',
          padding: '0 1.25rem', height: 56, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="layout-hamburger" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} color={NAV_BG} />
            </button>
            <Link to="/" style={{ color: '#C0533A', fontWeight: 700, textDecoration: 'none' }}>
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

        <main style={{ flex: 1, overflowY: 'auto', background: '#F4F7FA' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default NGOLayout;
