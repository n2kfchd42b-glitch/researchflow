import React, { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import {
  Building2, Menu, X, ChevronDown, ChevronRight,
  LayoutDashboard, FolderOpen, FileText, Database, GitBranch,
  DollarSign, Shield, BarChart3, Activity
} from 'lucide-react';
import ProjectSelector from '../components/ProjectSelector';
import { NGOPlatformProvider, useNGO } from '../products/ngo/context/NGOPlatformContext';
import '../products/ngo/ngo.css';

const ACTIVE_COLOR = '#5A8A6A';

function SidebarContent({ onClose, user, onLogout }: { onClose?: () => void; user: any; onLogout: () => void }) {
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const { state } = useNGO();

  const activeProjects = state.projects.filter(p =>
    ['active', 'data-collection', 'analysis', 'reporting'].includes(p.status)
  ).length;
  const activeForms = state.projects.flatMap(p => p.forms).filter(f => f.status === 'active').length;
  const totalBudget = state.projects.reduce((s, p) => s + p.budgetTotal, 0);
  const totalSpent = state.budgetItems.reduce((s, b) => s + b.spent, 0) +
    state.projects.reduce((s, p) => s + p.budgetSpent, 0);
  const budgetPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const activeProject = state.projects.find(p => p.id === state.activeProjectId);

  const navStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    color: isActive ? ACTIVE_COLOR : 'rgba(255,255,255,0.8)',
    textDecoration: 'none',
    fontSize: '0.875rem',
    background: isActive ? 'rgba(90,138,106,0.15)' : 'transparent',
    borderRight: isActive ? `3px solid ${ACTIVE_COLOR}` : '3px solid transparent',
    transition: 'background 0.15s',
  });

  const MAIN_NAV = [
    { label: 'Dashboard',       path: '/ngo',            icon: <LayoutDashboard size={15} />, end: true,  badge: null },
    { label: 'Projects',        path: '/ngo/projects',   icon: <FolderOpen size={15} />,      end: false, badge: activeProjects > 0 ? String(activeProjects) : null },
    { label: 'Field Forms',     path: '/ngo/forms',      icon: <FileText size={15} />,         end: false, badge: activeForms > 0 ? String(activeForms) : null },
    { label: 'Data Cleaning',   path: '/ngo/clean',      icon: <Database size={15} />,         end: false, badge: null },
    { label: 'Data Versioning', path: '/ngo/versioning', icon: <GitBranch size={15} />,        end: false, badge: null },
    { label: 'Budget Tracker',  path: '/ngo/budget',     icon: <DollarSign size={15} />,       end: false, badge: budgetPct > 0 ? `${budgetPct}%` : null },
    { label: 'Ethics Tracker',  path: '/ngo/ethics',     icon: <Shield size={15} />,            end: false, badge: null },
    { label: 'Monitoring',      path: '/ngo/monitoring', icon: <Activity size={15} />,          end: false, badge: null },
    { label: 'Analysis Suite',  path: '/ngo/analysis',   icon: <BarChart3 size={15} />,         end: true,  badge: null },
  ];

  const ANALYSIS_NAV = [
    { label: 'Survival',      path: '/ngo/analysis/survival' },
    { label: 'PSM',           path: '/ngo/analysis/psm' },
    { label: 'Subgroup',      path: '/ngo/analysis/subgroup' },
    { label: 'Sensitivity',   path: '/ngo/analysis/sensitivity' },
    { label: 'Meta-Analysis', path: '/ngo/analysis/meta' },
    { label: 'Forest Plot',   path: '/ngo/analysis/forest-plot' },
    { label: 'ITS',           path: '/ngo/analysis/its' },
    { label: 'DiD',           path: '/ngo/analysis/did' },
    { label: 'Mixed Effects', path: '/ngo/analysis/mixed' },
    { label: 'Spatial',       path: '/ngo/analysis/spatial' },
    { label: 'Network Meta',  path: '/ngo/analysis/network-meta' },
  ];

  const UTILITY_NAV = [
    { label: 'PRISMA',          path: '/ngo/prisma' },
    { label: 'Reports',         path: '/ngo/reports' },
    { label: 'Study Dashboard', path: '/ngo/studies' },
    { label: 'Data Dictionary', path: '/ngo/dictionary' },
    { label: 'Cohort Builder',  path: '/ngo/cohort' },
    { label: 'Table 1',         path: '/ngo/table1' },
    { label: 'Descriptive',     path: '/ngo/descriptive' },
  ];

  return (
    <>
      {/* Brand header */}
      <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Building2 size={22} color={ACTIVE_COLOR} />
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'white' }}>NGO Platform</span>
          {onClose && (
            <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          )}
        </div>
        {activeProject && (
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.3rem', paddingLeft: '1.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeProject.name}
          </div>
        )}
      </div>

      <nav style={{ padding: '0.5rem 0', flex: 1, overflowY: 'auto' }}>
        {/* Main nav items */}
        {MAIN_NAV.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onClose}
            style={({ isActive }) => navStyle(isActive)}
          >
            <span style={{ flexShrink: 0 }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && (
              <span style={{ background: ACTIVE_COLOR, color: 'white', borderRadius: 10, fontSize: '0.62rem', fontWeight: 700, padding: '0.1rem 0.4rem', flexShrink: 0 }}>
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}

        {/* Analysis expandable */}
        <div style={{ marginTop: '0.25rem' }}>
          <button
            onClick={() => setAnalysisOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '0.5rem', padding: '0.5rem 1rem', background: 'none', border: 'none', color: '#9DB4C9', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            {analysisOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Analysis Tools
          </button>
          {analysisOpen && ANALYSIS_NAV.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center',
                padding: '0.45rem 1rem 0.45rem 1.75rem',
                color: isActive ? ACTIVE_COLOR : 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                fontSize: '0.84rem',
                background: isActive ? 'rgba(90,138,106,0.15)' : 'transparent',
                borderRight: isActive ? `3px solid ${ACTIVE_COLOR}` : '3px solid transparent',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Utilities */}
        <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.4rem' }}>
          <div style={{ padding: '0.35rem 1rem 0.15rem', fontSize: '0.65rem', color: '#9DB4C9', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Utilities
          </div>
          {UTILITY_NAV.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'block',
                padding: '0.45rem 1rem',
                color: isActive ? ACTIVE_COLOR : 'rgba(255,255,255,0.7)',
                textDecoration: 'none',
                fontSize: '0.84rem',
                background: isActive ? 'rgba(90,138,106,0.15)' : 'transparent',
                borderRight: isActive ? `3px solid ${ACTIVE_COLOR}` : '3px solid transparent',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User / logout */}
      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginBottom: '0.4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.name}
        </div>
        <button
          onClick={onLogout}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', width: '100%' }}
        >
          Sign Out
        </button>
      </div>
    </>
  );
}

export default function NGOLayout({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <NGOPlatformProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F7FA' }}>
        {/* Desktop sidebar */}
        <aside
          style={{ width: 260, background: '#1C2B3A', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100, overflowY: 'auto' }}
          className="sidebar-desktop"
        >
          <SidebarContent user={user} onLogout={onLogout} />
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
            <div style={{ width: 260, background: '#1C2B3A', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
              <SidebarContent user={user} onLogout={onLogout} onClose={() => setSidebarOpen(false)} />
            </div>
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} onClick={() => setSidebarOpen(false)} />
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }} className="main-with-sidebar">
          <header style={{ background: 'white', borderBottom: '1px solid #E5E9EF', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 50 }}>
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              style={{ display: 'none', background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '0.3rem 0.5rem', cursor: 'pointer' }}
            >
              <Menu size={18} />
            </button>
            <Link to="/" style={{ fontWeight: 700, color: '#C0533A', textDecoration: 'none', fontSize: '1rem', flexShrink: 0 }}>
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
        `}</style>
      </div>
    </NGOPlatformProvider>
  );
}
