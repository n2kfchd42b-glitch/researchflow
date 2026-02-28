import React, { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { BookOpen, Menu, X } from 'lucide-react';
import ProjectSelector from '../components/ProjectSelector';

const NAV_ITEMS = [
  { label: 'Dashboard',     path: '/journal',           end: true  },
  { label: 'New Intake',    path: '/journal/intake',    end: false },
  { label: 'Pipeline View', path: '/journal/pipeline',  end: false },
  { label: 'Settings',      path: '/journal/settings',  end: false },
];

const ACTIVE_COLOR = '#7D3C98';

function SidebarContent({ onClose, user, onLogout }: { onClose?: () => void; user: any; onLogout: () => void }) {
  return (
    <>
      <div style={{
        padding: '1.25rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <BookOpen size={22} color={ACTIVE_COLOR} />
        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'white' }}>Journal Component</span>
        {onClose && (
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        )}
      </div>

      <nav style={{ padding: '0.75rem 0', flex: 1, overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onClose}
            style={({ isActive }) => ({
              display: 'block',
              padding: '0.55rem 1rem',
              color: isActive ? ACTIVE_COLOR : 'rgba(255,255,255,0.8)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              background: isActive ? 'rgba(125,60,152,0.15)' : 'transparent',
              borderRight: isActive ? `3px solid ${ACTIVE_COLOR}` : '3px solid transparent',
              transition: 'background 0.15s',
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

export default function JournalLayout({ user, onLogout }: { user: any; onLogout: () => void }) {
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
