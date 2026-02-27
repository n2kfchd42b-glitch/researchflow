import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { Building2, Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import ProjectSelector from '../components/ProjectSelector';

const NAV_SECTIONS = [
  {
    group: null,
    items: [
      { label: 'Dashboard',      path: '/ngo' },
      { label: 'Projects',       path: '/ngo/projects' },
      { label: 'Field Forms',    path: '/ngo/forms' },
      { label: 'Data Cleaning',  path: '/ngo/clean' },
      { label: 'Data Versioning',path: '/ngo/versioning' },
      { label: 'Budget Tracker', path: '/ngo/budget' },
      { label: 'Ethics Tracker', path: '/ngo/ethics' },
    ],
  },
  {
    group: 'Analysis',
    expandable: true,
    items: [
      { label: 'Survival',       path: '/ngo/analysis/survival' },
      { label: 'PSM',            path: '/ngo/analysis/psm' },
      { label: 'Subgroup',       path: '/ngo/analysis/subgroup' },
      { label: 'Sensitivity',    path: '/ngo/analysis/sensitivity' },
      { label: 'Meta-Analysis',  path: '/ngo/analysis/meta' },
      { label: 'Forest Plot',    path: '/ngo/analysis/forest-plot' },
      { label: 'ITS',            path: '/ngo/analysis/its' },
      { label: 'DiD',            path: '/ngo/analysis/did' },
      { label: 'Mixed Effects',  path: '/ngo/analysis/mixed' },
      { label: 'Spatial',        path: '/ngo/analysis/spatial' },
      { label: 'Network Meta',   path: '/ngo/analysis/network-meta' },
    ],
  },
  {
    group: null,
    items: [
      { label: 'PRISMA',         path: '/ngo/prisma' },
      { label: 'Reports',        path: '/ngo/reports' },
      { label: 'Study Dashboard',path: '/ngo/studies' },
      { label: 'Data Dictionary',path: '/ngo/dictionary' },
      { label: 'Cohort Builder', path: '/ngo/cohort' },
    ],
  },
];

const ACTIVE_COLOR = '#5A8A6A';

function SidebarContent({ onClose, user, onLogout }: { onClose?: () => void; user: any; onLogout: () => void }) {
  const [analysisOpen, setAnalysisOpen] = useState(false);

  return (
    <>
      <div style={{
        padding: '1.25rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <Building2 size={22} color={ACTIVE_COLOR} />
        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'white' }}>NGO Platform</span>
        {onClose && (
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        )}
      </div>

      <nav style={{ padding: '0.75rem 0', flex: 1, overflowY: 'auto' }}>
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {section.expandable ? (
              <>
                <button
                  onClick={() => setAnalysisOpen(o => !o)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'none',
                    border: 'none',
                    color: '#9DB4C9',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {analysisOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  {section.group}
                </button>
                {analysisOpen && section.items.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    style={({ isActive }) => ({
                      display: 'block',
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
              </>
            ) : (
              section.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/ngo'}
                  onClick={onClose}
                  style={({ isActive }) => ({
                    display: 'block',
                    padding: '0.5rem 1rem',
                    color: isActive ? ACTIVE_COLOR : 'rgba(255,255,255,0.8)',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    background: isActive ? 'rgba(90,138,106,0.15)' : 'transparent',
                    borderRight: isActive ? `3px solid ${ACTIVE_COLOR}` : '3px solid transparent',
                    transition: 'background 0.15s',
                  })}
                >
                  {item.label}
                </NavLink>
              ))
            )}
          </div>
        ))}
      </nav>
    </>
  );
}

export default function NGOLayout({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F7FA' }}>
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

      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
          <div style={{ width: 260, background: '#1C2B3A', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
            <SidebarContent user={user} onLogout={onLogout} onClose={() => setSidebarOpen(false)} />
          </div>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }} className="main-with-sidebar">
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
  );
}
