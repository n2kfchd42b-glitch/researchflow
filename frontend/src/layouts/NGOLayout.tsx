import React, { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { Building2, Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import ProgramSelector from '../products/ngo/components/ProgramSelector';
import RoleSwitcher from '../products/ngo/components/RoleSwitcher';
import { useNGOPlatform } from '../products/ngo/context/NGOPlatformContext';

const SAGE = '#5A8A6A';
const NAVY = '#1C2B3A';

interface NavItem {
  to: string;
  label: string;
  roles: string[];
}

interface NavGroup {
  group: string;
  items: NavItem[];
  roles: string[];
}

const TOP_NAV: NavItem[] = [
  { to: '/ngo',           label: 'Dashboard',       roles: ['program-manager', 'data-analyst', 'field-coordinator'] },
  { to: '/ngo/projects',  label: 'Projects',         roles: ['program-manager', 'data-analyst', 'field-coordinator'] },
  { to: '/ngo/indicators',label: 'Indicators',       roles: ['program-manager', 'data-analyst'] },
  { to: '/ngo/budget',    label: 'Budget Tracker',   roles: ['program-manager'] },
  { to: '/ngo/ethics',    label: 'Ethics Tracker',   roles: ['program-manager'] },
  { to: '/ngo/reports/generate', label: 'Report Generator', roles: ['program-manager', 'data-analyst'] },
  { to: '/ngo/reports',   label: 'Reports',          roles: ['program-manager', 'data-analyst'] },
  { to: '/ngo/monitoring',label: 'Monitoring',       roles: ['program-manager', 'field-coordinator'] },
  { to: '/ngo/clean',     label: 'Data Cleaning',    roles: ['data-analyst'] },
  { to: '/ngo/versioning',label: 'Data Versioning',  roles: ['data-analyst'] },
  { to: '/ngo/prisma',    label: 'PRISMA Diagram',   roles: ['data-analyst'] },
  { to: '/ngo/dictionary',label: 'Data Dictionary',  roles: ['data-analyst'] },
  { to: '/ngo/cohort',    label: 'Cohort Builder',   roles: ['data-analyst'] },
  { to: '/ngo/forms',     label: 'Field Forms',      roles: ['field-coordinator'] },
  { to: '/ngo/studies',   label: 'Study Dashboard',  roles: ['program-manager', 'field-coordinator'] },
];

const ANALYSIS_GROUP: NavGroup = {
  group: 'Analysis Suite',
  roles: ['data-analyst'],
  items: [
    { to: '/ngo/analysis/survival',     label: 'Survival Analysis',    roles: ['data-analyst'] },
    { to: '/ngo/analysis/psm',          label: 'Propensity Matching',  roles: ['data-analyst'] },
    { to: '/ngo/analysis/subgroup',     label: 'Subgroup Analysis',    roles: ['data-analyst'] },
    { to: '/ngo/analysis/sensitivity',  label: 'Sensitivity Analysis', roles: ['data-analyst'] },
    { to: '/ngo/analysis/meta',         label: 'Meta-Analysis',        roles: ['data-analyst'] },
    { to: '/ngo/analysis/forest-plot',  label: 'Forest Plot',          roles: ['data-analyst'] },
    { to: '/ngo/analysis/its',          label: 'Interrupted Time Series', roles: ['data-analyst'] },
    { to: '/ngo/analysis/did',          label: 'Difference-in-Differences', roles: ['data-analyst'] },
    { to: '/ngo/analysis/mixed',        label: 'Mixed Effects',        roles: ['data-analyst'] },
    { to: '/ngo/analysis/spatial',      label: 'Spatial Analysis',     roles: ['data-analyst'] },
    { to: '/ngo/analysis/network-meta', label: 'Network Meta-Analysis',roles: ['data-analyst'] },
  ],
};

const linkStyle = (isActive: boolean): React.CSSProperties => ({
  display: 'block',
  padding: '0.45rem 1rem',
  color: isActive ? SAGE : 'rgba(255,255,255,0.82)',
  textDecoration: 'none',
  fontSize: '0.855rem',
  background: isActive ? 'rgba(90,138,106,0.18)' : 'transparent',
  borderRight: isActive ? `3px solid ${SAGE}` : '3px solid transparent',
  transition: 'background 0.15s',
  borderRadius: '4px 0 0 4px',
});

function SidebarContent({ onClose, showAll }: { onClose?: () => void; showAll: boolean }) {
  const { state } = useNGOPlatform();
  const role = state.userRole;
  const [analysisOpen, setAnalysisOpen] = useState(false);

  const visibleTop = showAll ? TOP_NAV : TOP_NAV.filter(i => i.roles.includes(role));
  const showAnalysis = showAll || ANALYSIS_GROUP.roles.includes(role);

  return (
    <>
      <div style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', padding: '0 0.25rem' }}>
          <Building2 size={18} color={SAGE} />
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>NGO Platform</span>
          {onClose && (
            <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          )}
        </div>
        <ProgramSelector />
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
        {visibleTop.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/ngo'}
            onClick={onClose}
            style={({ isActive }) => linkStyle(isActive)}
          >
            {item.label}
          </NavLink>
        ))}

        {showAnalysis && (
          <div>
            <button
              onClick={() => setAnalysisOpen(o => !o)}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                gap: '0.4rem',
                padding: '0.45rem 1rem',
                background: 'none',
                border: 'none',
                color: '#9DB4C9',
                fontWeight: 700,
                fontSize: '0.7rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                marginTop: '0.25rem',
              }}
            >
              {analysisOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              {ANALYSIS_GROUP.group}
            </button>
            {analysisOpen && ANALYSIS_GROUP.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                style={({ isActive }) => ({
                  ...linkStyle(isActive),
                  paddingLeft: '1.75rem',
                  fontSize: '0.82rem',
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>
    </>
  );
}

export default function NGOLayout({ user, onLogout }: { user?: any; onLogout?: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F7FA' }}>
      {/* ── Desktop Sidebar ── */}
      <aside
        className="sidebar-desktop"
        style={{
          width: 260,
          background: NAVY,
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 100,
          overflowY: 'auto',
        }}
      >
        <SidebarContent showAll={showAll} />

        {/* Show All toggle */}
        <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showAll}
              onChange={e => setShowAll(e.target.checked)}
              style={{ accentColor: SAGE }}
            />
            Show All
          </label>
        </div>

        <RoleSwitcher />
      </aside>

      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
          <div style={{ width: 260, background: NAVY, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
            <SidebarContent showAll={showAll} onClose={() => setSidebarOpen(false)} />
            <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} style={{ accentColor: SAGE }} />
                Show All
              </label>
            </div>
            <RoleSwitcher />
          </div>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* ── Main Area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }} className="main-with-sidebar">
        {/* Header */}
        <header style={{
          background: 'white',
          borderBottom: '1px solid #E5E9EF',
          padding: '0.65rem 1.25rem',
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
          <Link to="/" style={{ fontWeight: 700, color: '#C0533A', textDecoration: 'none', fontSize: '1rem', whiteSpace: 'nowrap' }}>
            ResearchFlow
          </Link>
          <div style={{ flex: 1 }} />
          {user?.name && (
            <span style={{ fontSize: '0.84rem', color: '#666', whiteSpace: 'nowrap' }}>{user.name}</span>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              style={{ background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.8rem', color: '#555', whiteSpace: 'nowrap' }}
            >
              Sign Out
            </button>
          )}
        </header>

        <main style={{ flex: 1, padding: '1.25rem', overflow: 'auto' }}>
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
      `}</style>
    </div>
  );
}
