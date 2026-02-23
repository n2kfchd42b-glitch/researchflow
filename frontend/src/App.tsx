import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Landing from './pages/Landing';
import StudentWizard from './pages/StudentWizard';
import NGOPipeline from './pages/NGOPipeline';
import JournalVerification from './pages/JournalVerification';
import MethodologyMemory from './pages/MethodologyMemory';
import CohortBuilder from './pages/CohortBuilder';
import Login from './pages/Login';

function NavBar({ user, onLogout }: { user: any, onLogout: () => void }) {
  return (
    <nav style={{
      background: '#1C2B3A', padding: '0 2rem',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', height: 56
    }}>
      <Link to="/" style={{ color: '#C0533A', fontWeight: 700, fontSize: '1.2rem', textDecoration: 'none' }}>
        ResearchFlow
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link to="/student" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', opacity: 0.8 }}>Student</Link>
        <Link to="/ngo"     style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', opacity: 0.8 }}>NGO</Link>
        <Link to="/journal" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', opacity: 0.8 }}>Journal</Link>
        <Link to="/methodology" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', opacity: 0.8 }}>Methodology</Link>
        <Link to="/cohort" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', opacity: 0.8 }}>Cohort</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: '#aaa', fontSize: '0.85rem' }}>
            {user.name}
          </span>
          <span style={{
            padding: '0.2rem 0.6rem', borderRadius: 4,
            background: '#C0533A', color: 'white', fontSize: '0.75rem', fontWeight: 600
          }}>
            {user.role}
          </span>
          <button onClick={onLogout} style={{
            background: 'transparent', border: '1px solid #555',
            color: '#aaa', padding: '0.3rem 0.8rem', borderRadius: 4,
            cursor: 'pointer', fontSize: '0.8rem'
          }}>
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}

function Dashboard({ user }: { user: any }) {
  const ROUTES = [
    { role: 'student', path: '/student', label: 'Go to Student Wizard', icon: '🎓', color: '#C0533A' },
    { role: 'ngo',     path: '/ngo',     label: 'Go to NGO Pipeline',    icon: '🌍', color: '#5A8A6A' },
    { role: 'journal', path: '/journal', label: 'Go to Journal Portal',  icon: '📄', color: '#1C2B3A' },
    { role: 'student', path: '/methodology', label: 'Methodology Memory', icon: '🧬', color: '#1C2B3A' },
  ];

  return (
    <div style={{ padding: '3rem 2rem', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ color: '#1C2B3A' }}>Welcome back, {user.name}</h1>
      <p style={{ marginBottom: '2rem' }}>Select your workspace to get started.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
        {ROUTES.map(r => (
          <Link key={r.role} to={r.path} style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '2rem', borderRadius: 12, textAlign: 'center',
              background: user.role === r.role ? r.color : '#f8f7f4',
              color: user.role === r.role ? 'white' : '#1C2B3A',
              border: '2px solid ' + (user.role === r.role ? r.color : '#eee'),
              cursor: 'pointer'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{r.icon}</div>
              <p style={{ fontWeight: 700, marginBottom: 0 }}>{r.label}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser]   = useState<any>(null);
  const [token, setToken] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedUser  = localStorage.getItem('rf_user');
    const savedToken = localStorage.getItem('rf_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    setReady(true);
  }, []);

  function handleLogin(userData: any, userToken: string) {
    setUser(userData);
    setToken(userToken);
  }

  function handleLogout() {
    setUser(null);
    setToken('');
    localStorage.removeItem('rf_user');
    localStorage.removeItem('rf_token');
  }

  if (!ready) return null;

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <NavBar user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/"        element={<Dashboard user={user} />} />
        <Route path="/student" element={<StudentWizard />} />
        <Route path="/ngo"     element={<NGOPipeline />} />
        <Route path="/journal" element={<JournalVerification />} />
        <Route path="/methodology" element={<MethodologyMemory user={user} />} />
        <Route path="/cohort" element={<CohortBuilder />} />
      </Routes>
    </BrowserRouter>
  );
}
