import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8004';

const ROLE_COLORS: Record<string, string> = {
  pi:       '#C0533A',
  analyst:  '#1C2B3A',
  student:  '#5A8A6A',
  reviewer: '#9c27b0',
};

const ROLE_ICONS: Record<string, string> = {
  pi:       '👨‍🔬',
  analyst:  '📊',
  student:  '🎓',
  reviewer: '🔍',
};

const STATUS_COLORS: Record<string, string> = {
  active:      '#5A8A6A',
  pending:     '#ff9800',
  in_progress: '#2196f3',
  completed:   '#5A8A6A',
  approved:    '#4caf50',
  rejected:    '#f44336',
};

export default function Collaboration({ user }: { user: any }) {
  const [workspaces, setWorkspaces]   = useState<any[]>([]);
  const [activeWS, setActiveWS]       = useState<any>(null);
  const [activeTab, setActiveTab]     = useState('activity');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [showCreate, setShowCreate]   = useState(false);
  const [showInvite, setShowInvite]   = useState(false);
  const [comment, setComment]         = useState('');

  const [newWS, setNewWS]             = useState({ name: '', description: '' });
  const [invite, setInvite]           = useState({ email: '', name: '', role: 'analyst' });

  useEffect(() => { loadWorkspaces(); }, []);

  async function loadWorkspaces() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/workspace/user/${user.email}`);
      const data = await res.json();
      setWorkspaces(Array.isArray(data) ? data : []);
      if (data.length > 0 && !activeWS) setActiveWS(data[0]);
    } catch (e) {}
    setLoading(false);
  }

  async function createWorkspace() {
    if (!newWS.name) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/workspace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        newWS.name,
          description: newWS.description,
          owner_email: user.email,
          owner_name:  user.name,
        })
      });
      const data = await res.json();
      setWorkspaces(prev => [...prev, data]);
      setActiveWS(data);
      setShowCreate(false);
      setNewWS({ name: '', description: '' });
      setSuccess('Workspace created successfully!');
    } catch (e: any) {
      setError('Failed to create workspace');
    }
    setLoading(false);
  }

  async function inviteMember() {
    if (!invite.email || !activeWS) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/workspace/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id:  activeWS.id,
          invitee_email: invite.email,
          invitee_name:  invite.name || invite.email,
          role:          invite.role,
          inviter_email: user.email,
        })
      });
      if (!res.ok) throw new Error(await res.text());
      await refreshWorkspace();
      setShowInvite(false);
      setInvite({ email: '', name: '', role: 'analyst' });
      setSuccess(`Invitation sent to ${invite.email}`);
    } catch (e: any) {
      setError('Failed to send invitation');
    }
    setLoading(false);
  }

  async function postComment() {
    if (!comment || !activeWS) return;
    try {
      await fetch(`${API_URL}/workspace/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: activeWS.id,
          study_id:     'general',
          user_email:   user.email,
          user_name:    user.name,
          comment,
        })
      });
      setComment('');
      await refreshWorkspace();
    } catch (e) {}
  }

  async function updateStudyStatus(studyId: string, status: string) {
    if (!activeWS) return;
    try {
      await fetch(`${API_URL}/workspace/${activeWS.id}/study/${studyId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, user_email: user.email })
      });
      await refreshWorkspace();
    } catch (e) {}
  }

  async function refreshWorkspace() {
    if (!activeWS) return;
    try {
      const res = await fetch(`${API_URL}/workspace/${activeWS.id}`);
      const data = await res.json();
      setActiveWS(data);
      setWorkspaces(prev => prev.map(w => w.id === data.id ? data : w));
    } catch (e) {}
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ color: '#1C2B3A', marginBottom: 0 }}>Collaboration</h1>
          <p style={{ marginBottom: 0 }}>Work together on research studies with your team.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + New Workspace
        </button>
      </div>

      {error   && <div className="alert alert-critical">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showCreate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: 480, maxWidth: '90vw' }}>
            <h2>Create Workspace</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Workspace Name</label>
              <input value={newWS.name} onChange={e => setNewWS(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. CHW Study Tanzania 2024"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Description</label>
              <textarea value={newWS.description} onChange={e => setNewWS(p => ({ ...p, description: e.target.value }))}
                placeholder="Brief description of the study or project"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem', minHeight: 70 }} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={createWorkspace} disabled={!newWS.name || loading}>
                Create Workspace
              </button>
              <button className="btn" style={{ background: '#eee', color: '#444' }} onClick={() => setShowCreate(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showInvite && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: 480, maxWidth: '90vw' }}>
            <h2>Invite Team Member</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Email</label>
              <input value={invite.email} onChange={e => setInvite(p => ({ ...p, email: e.target.value }))}
                placeholder="colleague@university.ac"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Name</label>
              <input value={invite.name} onChange={e => setInvite(p => ({ ...p, name: e.target.value }))}
                placeholder="Dr. Jane Smith"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Role</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['pi', 'analyst', 'student', 'reviewer'].map(role => (
                  <button key={role} onClick={() => setInvite(p => ({ ...p, role }))} style={{
                    flex: 1, padding: '0.5rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                    background: invite.role === role ? ROLE_COLORS[role] : '#eee',
                    color: invite.role === role ? 'white' : '#444',
                    border: 'none', textTransform: 'capitalize',
                  }}>
                    {ROLE_ICONS[role]} {role.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={inviteMember} disabled={!invite.email || loading}>
                Send Invitation
              </button>
              <button className="btn" style={{ background: '#eee', color: '#444' }} onClick={() => setShowInvite(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem' }}>
        <div>
          <div className="card" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.75rem' }}>
              Your Workspaces
            </h3>
            {workspaces.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                <p style={{ fontSize: '0.82rem', color: '#888' }}>No workspaces yet. Create one to collaborate.</p>
              </div>
            )}
            {workspaces.map(ws => (
              <div key={ws.id} onClick={() => setActiveWS(ws)} style={{
                padding: '0.75rem', borderRadius: 8, cursor: 'pointer', marginBottom: '0.5rem',
                background: activeWS?.id === ws.id ? '#fff5f3' : 'transparent',
                border: '1px solid ' + (activeWS?.id === ws.id ? '#C0533A' : '#eee'),
              }}>
                <p style={{ fontWeight: 700, color: activeWS?.id === ws.id ? '#C0533A' : '#1C2B3A', marginBottom: 2, fontSize: '0.9rem' }}>
                  {ws.name}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: 0 }}>
                  {ws.members?.length || 0} members · {ws.studies?.length || 0} studies
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          {!activeWS && (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👥</div>
              <h2>No Workspace Selected</h2>
              <p>Create a workspace to start collaborating with your team.</p>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ marginTop: '1rem' }}>
                + Create Workspace
              </button>
            </div>
          )}

          {activeWS && (
            <div>
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ marginBottom: 4 }}>{activeWS.name}</h2>
                    {activeWS.description && <p style={{ color: '#888', fontSize: '0.88rem', marginBottom: 4 }}>{activeWS.description}</p>}
                    <p style={{ fontSize: '0.78rem', color: '#aaa', marginBottom: 0 }}>
                      ID: {activeWS.id} · Created {new Date(activeWS.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="btn btn-primary" onClick={() => setShowInvite(true)} style={{ fontSize: '0.85rem' }}>
                    + Invite
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'activity', label: '📋 Activity'  },
                  { id: 'members',  label: '👥 Members'   },
                  { id: 'studies',  label: '🔬 Studies'   },
                  { id: 'comments', label: '💬 Comments'  },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="btn" style={{
                    background: activeTab === tab.id ? '#1C2B3A' : '#eee',
                    color: activeTab === tab.id ? 'white' : '#444',
                    padding: '0.5rem 1rem', fontSize: '0.85rem'
                  }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'activity' && (
                <div className="card">
                  <h2>Activity Feed</h2>
                  {activeWS.activity?.length === 0 && <p style={{ color: '#888' }}>No activity yet.</p>}
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, width: 2, background: '#eee' }} />
                    {activeWS.activity?.slice(0, 20).map((event: any) => (
                      <div key={event.id} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1C2B3A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>
                          {event.user?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div style={{ flex: 1, background: '#f8f7f4', borderRadius: 8, padding: '0.6rem 0.9rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{event.user}</span>
                            <span style={{ fontSize: '0.72rem', color: '#aaa' }}>{formatTime(event.timestamp)}</span>
                          </div>
                          <p style={{ fontSize: '0.82rem', color: '#555', marginBottom: 0 }}>
                            {event.action} — {event.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'members' && (
                <div className="card">
                  <h2>Team Members ({activeWS.members?.length || 0})</h2>
                  {activeWS.members?.map((member: any) => (
                    <div key={member.email} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid #eee' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: ROLE_COLORS[member.role] || '#888', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
                        {member.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, marginBottom: 2 }}>{member.name}</p>
                        <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 0 }}>{member.email}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, background: (ROLE_COLORS[member.role] || '#888') + '22', color: ROLE_COLORS[member.role] || '#888' }}>
                          {ROLE_ICONS[member.role]} {member.role?.toUpperCase()}
                        </span>
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: 10, fontSize: '0.72rem', background: (STATUS_COLORS[member.status] || '#888') + '22', color: STATUS_COLORS[member.status] || '#888' }}>
                          {member.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'studies' && (
                <div>
                  {activeWS.studies?.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔬</div>
                      <h3>No studies yet</h3>
                      <p style={{ color: '#888', fontSize: '0.88rem' }}>Studies added through the Student Wizard or NGO Pipeline will appear here.</p>
                    </div>
                  ) : (
                    activeWS.studies?.map((study: any) => (
                      <div key={study.id} className="card" style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h3 style={{ marginBottom: 4 }}>{study.title}</h3>
                            <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 0 }}>
                              Added by {study.added_by} · {new Date(study.added_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span style={{ padding: '0.3rem 0.75rem', borderRadius: 10, fontSize: '0.78rem', fontWeight: 700, background: (STATUS_COLORS[study.status] || '#888') + '22', color: STATUS_COLORS[study.status] || '#888' }}>
                              {study.status?.replace(/_/g, ' ')}
                            </span>
                            {activeWS.owner_email === user.email && (
                              <select onChange={e => updateStudyStatus(study.id, e.target.value)}
                                style={{ padding: '0.3rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.78rem' }}>
                                <option value="">Change status</option>
                                {['in_progress', 'completed', 'approved', 'rejected'].map(s => (
                                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'comments' && (
                <div>
                  <div className="card" style={{ marginBottom: '1rem' }}>
                    <h2>Discussion</h2>
                    {activeWS.comments?.length === 0 && (
                      <p style={{ color: '#888', marginBottom: '1rem' }}>No comments yet. Start the discussion.</p>
                    )}
                    {activeWS.comments?.map((c: any) => (
                      <div key={c.id} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#5A8A6A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                          {c.user_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div style={{ flex: 1, background: '#f8f7f4', borderRadius: 8, padding: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{c.user_name}</span>
                            <span style={{ fontSize: '0.72rem', color: '#aaa' }}>{formatTime(c.created_at)}</span>
                          </div>
                          <p style={{ fontSize: '0.88rem', marginBottom: 0 }}>{c.comment}</p>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                      <input value={comment} onChange={e => setComment(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && postComment()}
                        placeholder="Add a comment..."
                        style={{ flex: 1, padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
                      <button className="btn btn-primary" onClick={postComment} disabled={!comment}>
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
