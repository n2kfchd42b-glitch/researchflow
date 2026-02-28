import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, DollarSign, Shield, Plus, Upload, FileText, BarChart3, X } from 'lucide-react';
import { useNGO, NGOProject } from '../context/NGOPlatformContext';
import MetricCard from '../components/MetricCard';
import ProjectCard from '../components/ProjectCard';
import ActivityFeed from '../components/ActivityFeed';

interface CreateProjectForm {
  name: string;
  description: string;
  organization: string;
  principalInvestigator: string;
  startDate: string;
  endDate: string;
  budgetTotal: string;
}

const EMPTY_FORM: CreateProjectForm = {
  name: '',
  description: '',
  organization: '',
  principalInvestigator: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  budgetTotal: '',
};

export default function NGODashboardPage() {
  const { state, createProject, getProjectStats } = useNGO();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateProjectForm>(EMPTY_FORM);
  const [editProject, setEditProject] = useState<NGOProject | null>(null);

  const { projects, recentActivity } = state;

  // Overview metrics
  const activeProjects = projects.filter(p => ['active', 'data-collection', 'analysis', 'reporting'].includes(p.status));
  const totalEnrollment = projects.reduce((s, p) => s + p.sites.reduce((ss, site) => ss + site.enrollmentActual, 0), 0);
  const totalBudget = projects.reduce((s, p) => s + p.budgetTotal, 0);
  const totalSpent = projects.reduce((s, p) => s + p.budgetSpent, 0);
  const budgetUtilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const ethicsApproved = projects.filter(p => p.ethicsStatus === 'approved').length;
  const ethicsPending = projects.filter(p => p.ethicsStatus === 'pending').length;
  const ethicsExpired = projects.filter(p => p.ethicsStatus === 'expired').length;

  const budgetColor = budgetUtilization >= 90 ? '#C0533A' : budgetUtilization >= 70 ? '#E67E22' : '#27AE60';

  function handleCreate() {
    if (!form.name.trim()) return;
    createProject({
      name: form.name,
      description: form.description,
      organization: form.organization,
      principalInvestigator: form.principalInvestigator,
      startDate: form.startDate,
      endDate: form.endDate,
      budgetTotal: parseFloat(form.budgetTotal) || 0,
    });
    setShowModal(false);
    setForm(EMPTY_FORM);
  }

  function projectName(id: string) {
    return projects.find(p => p.id === id)?.name || id;
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1C2B3A', margin: 0 }}>NGO Platform Dashboard</h1>
        <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Manage field research operations across all projects
        </p>
      </div>

      {/* Overview metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <MetricCard
          title="Active Projects"
          value={activeProjects.length}
          icon={<Briefcase size={20} />}
          color="#5A8A6A"
          subtitle={`${projects.length} total`}
        />
        <MetricCard
          title="Total Enrollment"
          value={totalEnrollment.toLocaleString()}
          icon={<Users size={20} />}
          color="#2E86C1"
          subtitle="across all sites"
        />
        <MetricCard
          title="Budget Utilization"
          value={`${budgetUtilization}%`}
          icon={<DollarSign size={20} />}
          color={budgetColor}
          subtitle={`$${totalSpent.toLocaleString()} of $${totalBudget.toLocaleString()}`}
        />
        <MetricCard
          title="Ethics Status"
          value={`${ethicsApproved} approved`}
          icon={<Shield size={20} />}
          color="#27AE60"
          subtitle={`${ethicsPending} pending · ${ethicsExpired} expired`}
        />
      </div>

      {/* Quick Actions */}
      <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', border: '1px solid #E0E4E8', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6B7280', marginRight: '0.25rem' }}>Quick Actions:</span>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#5A8A6A', color: 'white', border: 'none', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
        >
          <Plus size={15} /> New Project
        </button>
        <button
          onClick={() => navigate('/ngo/clean')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'white', color: '#2E86C1', border: '1px solid #2E86C1', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
        >
          <Upload size={15} /> Upload Data
        </button>
        <button
          onClick={() => navigate('/ngo/forms')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'white', color: '#5A8A6A', border: '1px solid #5A8A6A', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
        >
          <FileText size={15} /> Build Form
        </button>
        <button
          onClick={() => navigate('/ngo/analysis')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'white', color: '#E67E22', border: '1px solid #E67E22', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
        >
          <BarChart3 size={15} /> Run Analysis
        </button>
      </div>

      {/* Projects + Activity grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }} className="ngo-dashboard-grid">

        {/* Active Projects */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1C2B3A', margin: 0 }}>
              All Projects
              <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', fontWeight: 500, color: '#9CA3AF' }}>({projects.length})</span>
            </h2>
            <button
              onClick={() => setShowModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: '1px dashed #9CA3AF', borderRadius: 8, padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', color: '#6B7280' }}
            >
              <Plus size={13} /> New Project
            </button>
          </div>

          {projects.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 12, border: '2px dashed #E0E4E8', padding: '3rem', textAlign: 'center' }}>
              <Briefcase size={36} color="#D1D5DB" style={{ marginBottom: '0.75rem' }} />
              <div style={{ fontSize: '0.95rem', color: '#6B7280', marginBottom: '0.5rem' }}>No projects yet</div>
              <button
                onClick={() => setShowModal(true)}
                style={{ background: '#5A8A6A', color: 'white', border: 'none', borderRadius: 8, padding: '0.5rem 1.25rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
              >
                Create First Project
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {projects.map(project => {
                const stats = getProjectStats(project.id);
                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    totalEnrollment={stats.enrollmentTotal}
                    targetEnrollment={stats.enrollmentTarget}
                    onEdit={() => setEditProject(project)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E4E8', padding: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1C2B3A', margin: '0 0 1rem 0' }}>Recent Activity</h2>
            <ActivityFeed activities={recentActivity} limit={20} projectName={projectName} />
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1C2B3A' }}>Create New Project</h3>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label style={labelStyle}>Project Name *</label>
                <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Community Health Intervention Study" />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of the project..." />
              </div>
              <div>
                <label style={labelStyle}>Organization</label>
                <input style={inputStyle} value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} placeholder="e.g. Health Alliance International" />
              </div>
              <div>
                <label style={labelStyle}>Principal Investigator</label>
                <input style={inputStyle} value={form.principalInvestigator} onChange={e => setForm(f => ({ ...f, principalInvestigator: e.target.value }))} placeholder="e.g. Dr. Sarah Kimani" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Start Date</label>
                  <input type="date" style={inputStyle} value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>End Date</label>
                  <input type="date" style={inputStyle} value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Total Budget ($)</label>
                <input type="number" style={inputStyle} value={form.budgetTotal} onChange={e => setForm(f => ({ ...f, budgetTotal: e.target.value }))} placeholder="0" min="0" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }} style={{ background: 'none', border: '1px solid #E0E4E8', borderRadius: 8, padding: '0.6rem 1.25rem', cursor: 'pointer', fontSize: '0.875rem', color: '#6B7280' }}>
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.name.trim()}
                style={{ background: form.name.trim() ? '#5A8A6A' : '#E0E4E8', color: form.name.trim() ? 'white' : '#9CA3AF', border: 'none', borderRadius: 8, padding: '0.6rem 1.25rem', cursor: form.name.trim() ? 'pointer' : 'not-allowed', fontSize: '0.875rem', fontWeight: 600 }}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) { .ngo-dashboard-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '0.3rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.55rem 0.75rem',
  border: '1px solid #E0E4E8',
  borderRadius: 8,
  fontSize: '0.875rem',
  color: '#1C2B3A',
  background: 'white',
  boxSizing: 'border-box',
  outline: 'none',
};
