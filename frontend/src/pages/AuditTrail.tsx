import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

const ACTION_COLORS: Record<string, string> = {
  UPLOAD:          '#1C2B3A',
  ANALYSE:         '#C0533A',
  DOWNLOAD_REPORT: '#5A8A6A',
  LOGIN:           '#9c27b0',
  REGISTER:        '#2196f3',
};

const ACTION_ICONS: Record<string, string> = {
  UPLOAD:          '📂',
  ANALYSE:         '🔬',
  DOWNLOAD_REPORT: '📄',
  LOGIN:           '🔑',
  REGISTER:        '👤',
};

export default function AuditTrail({ user }: { user: any }) {
  const [logs, setLogs]       = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [studyId, setStudyId] = useState('');
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadLogs() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/audit?user_email=${user.email}`);
      if (!res.ok) throw new Error('Failed to load audit log');
      const data = await res.json();
      setLogs(data);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function loadStudyAudit() {
    if (!studyId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/audit/study/${studyId}`);
      if (!res.ok) throw new Error('Study not found');
      const data = await res.json();
      setLogs(data.events || []);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  }

  function formatDetails(details: any) {
    if (!details) return '';
    return Object.entries(details)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join(' · ');
  }

  const filtered = filter === 'all' ? logs : logs.filter(l => l.action === filter);
  const actions = Array.from(new Set<string>(logs.map(l => l.action)));

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ color: '#1C2B3A', marginBottom: 0 }}>Audit Trail</h1>
          <p style={{ marginBottom: 0 }}>Complete reproducibility log of all research actions.</p>
        </div>
        <button className="btn btn-primary" onClick={loadLogs}>Refresh</button>
      </div>

      {error && <div className="alert alert-critical">{error}</div>}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Search by Study ID
            </label>
            <input value={studyId} onChange={e => setStudyId(e.target.value)}
              placeholder="e.g. abc12345"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }} />
          </div>
          <button className="btn btn-navy" onClick={loadStudyAudit} disabled={!studyId}>
            Search Study
          </button>
          <button className="btn" style={{ background: '#eee', color: '#444' }} onClick={loadLogs}>
            Show All
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('all')} className="btn" style={{
          background: filter === 'all' ? '#1C2B3A' : '#eee',
          color: filter === 'all' ? 'white' : '#444', padding: '0.4rem 0.9rem'
        }}>
          All ({logs.length})
        </button>
        {actions.map(a => (
          <button key={a} onClick={() => setFilter(a)} className="btn" style={{
            background: filter === a ? ACTION_COLORS[a] || '#1C2B3A' : '#eee',
            color: filter === a ? 'white' : '#444', padding: '0.4rem 0.9rem'
          }}>
            {ACTION_ICONS[a] || '•'} {a} ({logs.filter(l => l.action === a).length})
          </button>
        ))}
      </div>

      {loading && <p style={{ textAlign: 'center', color: '#888' }}>Loading audit log...</p>}

      {!loading && filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <h2>No audit events yet</h2>
          <p>Upload a dataset, run an analysis or download a report to see audit events here.</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <p style={{ fontWeight: 600, color: '#888' }}>{filtered.length} events</p>
            <p style={{ fontSize: '0.8rem', color: '#aaa' }}>
              Reproducibility ID: RF-AUDIT-{user.email.split('@')[0].toUpperCase()}
            </p>
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 20, top: 0, bottom: 0,
              width: 2, background: '#eee', zIndex: 0
            }} />
            {filtered.map((event, i) => (
              <div key={event.id} style={{
                display: 'flex', gap: '1rem', marginBottom: '1rem',
                position: 'relative', zIndex: 1
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: ACTION_COLORS[event.action] || '#1C2B3A',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', color: 'white'
                }}>
                  {ACTION_ICONS[event.action] || '•'}
                </div>
                <div style={{
                  flex: 1, background: 'white', borderRadius: 8,
                  padding: '0.75rem 1rem', border: '1px solid #eee',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{
                      fontWeight: 700, color: ACTION_COLORS[event.action] || '#1C2B3A',
                      fontSize: '0.9rem'
                    }}>
                      {event.action.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#aaa' }}>
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#555', marginBottom: 4 }}>
                    {formatDetails(event.details)}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: '#aaa' }}>ID: {event.id}</span>
                    {event.study_id && (
                      <span style={{ fontSize: '0.72rem', color: '#aaa' }}>
                        Study: {event.study_id.slice(0, 8)}
                      </span>
                    )}
                    {event.dataset_id && (
                      <span style={{ fontSize: '0.72rem', color: '#aaa' }}>
                        Dataset: {event.dataset_id.slice(0, 8)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
