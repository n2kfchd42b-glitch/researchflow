import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

export default function Login({ onLogin }: { onLogin: (user: any, token: string) => void }) {
  const [mode, setMode]           = useState<'login' | 'register'>('login');
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [role, setRole]           = useState('student');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login'
        ? { email, password }
        : { name, email, password, role };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Something went wrong');
      }

      const data = await res.json();
      localStorage.setItem('rf_token', data.token);
      localStorage.setItem('rf_user', JSON.stringify(data.user));
      onLogin(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
    setLoading(false);
  }

  const ROLES = [
    { id: 'student', label: 'Student', icon: '🎓', desc: 'Guided research analysis for dissertations' },
    { id: 'ngo',     label: 'NGO',     icon: '🌍', desc: 'Programme evaluation for donor reporting' },
    { id: 'journal', label: 'Journal', icon: '📄', desc: 'Statistical verification for submissions' },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: '#1C2B3A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#C0533A', fontSize: '2rem', marginBottom: '0.5rem' }}>
            ResearchFlow
          </h1>
          <p style={{ color: '#aaa', fontSize: '1rem' }}>
            Automated research analytics for global health
          </p>
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: '2rem' }}>

          <div style={{ display: 'flex', marginBottom: '1.5rem', background: '#f0f0f0', borderRadius: 8, padding: 4 }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m as any); setError(''); }}
                style={{
                  flex: 1, padding: '0.6rem', borderRadius: 6,
                  border: 'none', cursor: 'pointer', fontWeight: 600,
                  background: mode === m ? 'white' : 'transparent',
                  color: mode === m ? '#C0533A' : '#888',
                  boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  fontSize: '0.95rem'
                }}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {error && (
            <div style={{
              background: '#ffebee', color: '#c62828', padding: '0.75rem',
              borderRadius: 6, marginBottom: '1rem', fontSize: '0.9rem',
              borderLeft: '4px solid #f44336'
            }}>
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: '#1C2B3A' }}>
                Full Name
              </label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.95rem' }} />
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: '#1C2B3A' }}>
              Email Address
            </label>
            <input value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@organisation.org" type="email"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.95rem' }} />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: '#1C2B3A' }}>
              Password
            </label>
            <input value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Min 8 characters" type="password"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.95rem' }} />
          </div>

          {mode === 'register' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 8, color: '#1C2B3A' }}>
                I am a...
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {ROLES.map(r => (
                  <div key={r.id} onClick={() => setRole(r.id)} style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '0.75rem', borderRadius: 8, cursor: 'pointer',
                    border: '2px solid ' + (role === r.id ? '#C0533A' : '#eee'),
                    background: role === r.id ? '#fff5f3' : 'white'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>{r.icon}</span>
                    <div>
                      <p style={{ fontWeight: 700, marginBottom: 0, color: '#1C2B3A' }}>{r.label}</p>
                      <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: 0 }}>{r.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            style={{
              width: '100%', padding: '0.9rem', borderRadius: 8,
              background: '#C0533A', color: 'white', border: 'none',
              fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
              opacity: (!email || !password) ? 0.6 : 1
            }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: '#888' }}>
            By continuing you agree to our terms of service.
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#666', fontSize: '0.8rem' }}>
          ResearchFlow v0.1.0 · Built for global health research
        </p>
      </div>
    </div>
  );
}
