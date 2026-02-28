import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BookOpen, Menu } from 'lucide-react';
import ProjectSelector from '../components/ProjectSelector';

interface Props {
  user?: any;
  onLogout?: () => void;
}

const ACCENT = '#7D3C98';
const NAV_BG = '#1C2B3A';

const NAV_ITEMS = [
  { label: 'Dashboard',    path: '/journal', exact: true },
  { label: 'Submissions',  path: '/journal/submissions' },
  { label: 'Verification', path: '/journal/verify' },
  { label: 'Risk of Bias', path: '/journal/rob' },
  { label: 'Audit Trail',  path: '/journal/audit' },
  { label: 'Reports',      path: '/journal/reports' },
];

const JournalLayout: React.FC<Props> = ({ user, onLogout }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const sidebarContent = (
    <div style={{ width: 260, background: NAV_BG, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {/* Brand header */}
      <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <BookOpen size={22} color={ACCENT} />
          <span style={{ color: 'white', fontWeight: 700, fontSize: '1.05rem' }}>Journal Component</span>
        </div>
        <Link to="/" style={{ color: '#7a9ab3', fontSize: '0.75rem', textDecoration: 'none' }}>
          ← ResearchFlow
        </Link>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '1rem' }}>
        <p style={{ color: '#506070', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '1rem 1.25rem 0.4rem', margin: 0 }}>
          Navigation
        </p>
        {NAV_ITEMS.map(item => {
          const active = isActive(item.path, item.exact);
          return (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} style={{
              display: 'block', padding: '0.55rem 1.25rem', textDecoration: 'none',
              background: active ? `${ACCENT}18` : 'transparent',
              borderLeft: `3px solid ${active ? ACCENT : 'transparent'}`,
              color: active ? ACCENT : '#b0bec5',
              fontSize: '0.875rem',
            }}>
              {item.label}
            </Link>
          );
        })}
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

export default JournalLayout;
