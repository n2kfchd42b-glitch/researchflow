import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit2, X, Plus, Save, Trash2, CheckCircle, AlertCircle,
  Database, FileText, BarChart3, DollarSign, Shield, Users, FileOutput,
  TrendingUp, GitMerge, Layers, Filter, Clock, MapPin
} from 'lucide-react';
import { useNGO, BudgetItem, EthicsSubmission, TeamMember, SiteInfo, DatasetRef } from '../context/NGOPlatformContext';
import StatusBadge from '../components/StatusBadge';
import BudgetChart from '../components/BudgetChart';

type Tab = 'overview' | 'data' | 'forms' | 'analysis' | 'budget' | 'ethics' | 'team' | 'reports';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <BarChart3 size={14} /> },
  { key: 'data',     label: 'Data',     icon: <Database size={14} /> },
  { key: 'forms',    label: 'Forms',    icon: <FileText size={14} /> },
  { key: 'analysis', label: 'Analysis', icon: <TrendingUp size={14} /> },
  { key: 'budget',   label: 'Budget',   icon: <DollarSign size={14} /> },
  { key: 'ethics',   label: 'Ethics',   icon: <Shield size={14} /> },
  { key: 'team',     label: 'Team',     icon: <Users size={14} /> },
  { key: 'reports',  label: 'Reports',  icon: <FileOutput size={14} /> },
];

const ANALYSIS_TOOLS = [
  { name: 'Table 1 Generator', icon: <FileText size={22} />, desc: 'Baseline characteristics table', path: '/ngo/table1' },
  { name: 'Descriptive Stats', icon: <BarChart3 size={22} />, desc: 'Summary statistics & distributions', path: '/ngo/descriptive' },
  { name: 'Survival Analysis', icon: <TrendingUp size={22} />, desc: 'Kaplan-Meier & Cox regression', path: '/ngo/analysis/survival' },
  { name: 'Propensity Score', icon: <GitMerge size={22} />, desc: 'Match treated & control groups', path: '/ngo/analysis/psm' },
  { name: 'Meta-Analysis', icon: <Layers size={22} />, desc: 'Pool effects across studies', path: '/ngo/analysis/meta' },
  { name: 'Subgroup Analysis', icon: <Filter size={22} />, desc: 'Stratified analysis by subgroups', path: '/ngo/analysis/subgroup' },
  { name: 'Sensitivity', icon: <AlertCircle size={22} />, desc: 'Test result robustness', path: '/ngo/analysis/sensitivity' },
  { name: 'ITS', icon: <TrendingUp size={22} />, desc: 'Interrupted time series', path: '/ngo/analysis/its' },
  { name: 'DiD', icon: <BarChart3 size={22} />, desc: 'Difference-in-differences', path: '/ngo/analysis/did' },
  { name: 'Mixed Effects', icon: <Layers size={22} />, desc: 'Hierarchical/mixed models', path: '/ngo/analysis/mixed' },
  { name: 'Spatial Analysis', icon: <MapPin size={22} />, desc: 'Geographic data analysis', path: '/ngo/analysis/spatial' },
  { name: 'Network Meta', icon: <GitMerge size={22} />, desc: 'Network meta-analysis', path: '/ngo/analysis/network-meta' },
];

const BUDGET_CATEGORIES = ['personnel', 'travel', 'equipment', 'supplies', 'services', 'overhead', 'other'] as const;
const ROLE_LABELS: Record<string, string> = {
  'pi': 'Principal Investigator',
  'co-pi': 'Co-PI',
  'research-assistant': 'Research Assistant',
  'data-manager': 'Data Manager',
  'field-coordinator': 'Field Coordinator',
  'statistician': 'Statistician',
};

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #E0E4E8', borderRadius: 8, fontSize: '0.875rem', color: '#1C2B3A', background: 'white', boxSizing: 'border-box' };

export default function ProjectWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, updateProject, addBudgetItem, updateBudgetItem, deleteBudgetItem, addEthicsSubmission, addActivity } = useNGO();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');

  const project = state.projects.find(p => p.id === id);
  const projectBudgetItems = state.budgetItems.filter(b => b.projectId === id);
  const projectEthics = state.ethicsSubmissions.filter(e => e.projectId === id);

  if (!project) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ color: '#6B7280', marginBottom: '1rem' }}>Project not found</div>
        <button onClick={() => navigate('/ngo')} style={{ color: '#5A8A6A', background: 'none', border: 'none', cursor: 'pointer' }}>← Back to Dashboard</button>
      </div>
    );
  }

  const totalEnrollment = project.sites.reduce((s, site) => s + site.enrollmentActual, 0);
  const targetEnrollment = project.sites.reduce((s, site) => s + site.enrollmentTarget, 0);
  const enrollPct = targetEnrollment > 0 ? Math.round((totalEnrollment / targetEnrollment) * 100) : 0;
  const totalSpent = projectBudgetItems.reduce((s, b) => s + b.spent, 0);
  const budgetPct = project.budgetTotal > 0 ? Math.round((totalSpent / project.budgetTotal) * 100) : 0;
  const daysRemaining = project.endDate ? Math.max(0, Math.ceil((new Date(project.endDate).getTime() - Date.now()) / 86400000)) : 0;
  const budgetColor = budgetPct >= 90 ? '#C0533A' : budgetPct >= 70 ? '#E67E22' : '#27AE60';

  function saveProjectName() {
    if (editName.trim()) updateProject(project!.id, { name: editName.trim() });
    setEditingName(false);
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => navigate('/ngo')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A8A6A', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.75rem', padding: 0 }}>
          <ArrowLeft size={15} /> Back to Dashboard
        </button>

        <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem 1.5rem', border: '1px solid #E0E4E8' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {editingName ? (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveProjectName(); if (e.key === 'Escape') setEditingName(false); }}
                    style={{ ...inputStyle, fontSize: '1.25rem', fontWeight: 700, flex: 1 }}
                  />
                  <button onClick={saveProjectName} style={{ background: '#5A8A6A', color: 'white', border: 'none', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer' }}><Save size={16} /></button>
                  <button onClick={() => setEditingName(false)} style={{ background: 'none', border: '1px solid #E0E4E8', borderRadius: 8, padding: '0.5rem', cursor: 'pointer', color: '#6B7280' }}><X size={16} /></button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#1C2B3A' }}>{project.name}</h1>
                  <button onClick={() => { setEditName(project.name); setEditingName(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><Edit2 size={14} /></button>
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem', fontSize: '0.82rem', color: '#6B7280' }}>
                <span>{project.organization}</span>
                <span>·</span>
                <span>PI: {project.principalInvestigator}</span>
                {project.endDate && (
                  <>
                    <span>·</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: daysRemaining < 30 ? '#C0533A' : '#6B7280' }}>
                      <Clock size={12} /> {daysRemaining} days remaining
                    </span>
                  </>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <select
                value={project.status}
                onChange={e => updateProject(project.id, { status: e.target.value as any })}
                style={{ ...inputStyle, width: 'auto', fontSize: '0.8rem' }}
              >
                {['planning', 'active', 'data-collection', 'analysis', 'reporting', 'completed'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>
                ))}
              </select>
              <StatusBadge status={project.status} variant="project" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E4E8', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #E0E4E8', overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.85rem 1.1rem',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: activeTab === tab.key ? 700 : 400,
                color: activeTab === tab.key ? '#5A8A6A' : '#6B7280',
                borderBottom: activeTab === tab.key ? '2px solid #5A8A6A' : '2px solid transparent',
                marginBottom: -1, whiteSpace: 'nowrap',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '1.5rem' }}>
          {activeTab === 'overview' && <OverviewTab project={project} totalEnrollment={totalEnrollment} targetEnrollment={targetEnrollment} enrollPct={enrollPct} budgetPct={budgetPct} budgetColor={budgetColor} totalSpent={totalSpent} projectBudgetItems={projectBudgetItems} updateProject={updateProject} />}
          {activeTab === 'data' && <DataTab project={project} updateProject={updateProject} addActivity={addActivity} />}
          {activeTab === 'forms' && <FormsTab project={project} navigate={navigate} updateProject={updateProject} />}
          {activeTab === 'analysis' && <AnalysisTab navigate={navigate} />}
          {activeTab === 'budget' && <BudgetTab project={project} projectBudgetItems={projectBudgetItems} addBudgetItem={addBudgetItem} updateBudgetItem={updateBudgetItem} deleteBudgetItem={deleteBudgetItem} totalSpent={totalSpent} budgetPct={budgetPct} budgetColor={budgetColor} />}
          {activeTab === 'ethics' && <EthicsTab project={project} projectEthics={projectEthics} addEthicsSubmission={addEthicsSubmission} updateProject={updateProject} />}
          {activeTab === 'team' && <TeamTab project={project} updateProject={updateProject} addActivity={addActivity} />}
          {activeTab === 'reports' && <ReportsTab project={project} />}
        </div>
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ project, totalEnrollment, targetEnrollment, enrollPct, budgetPct, budgetColor, totalSpent, projectBudgetItems, updateProject }: any) {
  const [showAddSite, setShowAddSite] = useState(false);
  const [newSite, setNewSite] = useState({ name: '', location: '', enrollmentTarget: '' });

  function addSite() {
    if (!newSite.name.trim()) return;
    const site: SiteInfo = {
      id: `site-${Date.now()}`,
      name: newSite.name,
      location: newSite.location,
      enrollmentTarget: parseInt(newSite.enrollmentTarget) || 0,
      enrollmentActual: 0,
      status: 'active',
    };
    updateProject(project.id, { sites: [...project.sites, site] });
    setNewSite({ name: '', location: '', enrollmentTarget: '' });
    setShowAddSite(false);
  }

  const metrics = [
    { label: 'Enrollment', value: `${totalEnrollment}/${targetEnrollment}`, sub: `${enrollPct}%`, color: '#5A8A6A' },
    { label: 'Datasets', value: project.datasets.length, sub: `${project.datasets.filter((d: DatasetRef) => d.status === 'analysis-ready').length} ready`, color: '#2E86C1' },
    { label: 'Forms', value: project.forms.length, sub: `${project.forms.filter((f: any) => f.status === 'active').length} active`, color: '#E67E22' },
    { label: 'Budget Used', value: `${budgetPct}%`, sub: `$${totalSpent.toLocaleString()} spent`, color: budgetColor },
    { label: 'Ethics', value: project.ethicsStatus.replace('-', ' '), sub: project.ethicsApprovalDate ? `Since ${project.ethicsApprovalDate}` : '', color: project.ethicsStatus === 'approved' ? '#27AE60' : '#E67E22' },
    { label: 'Sites', value: project.sites.length, sub: `${project.sites.filter((s: SiteInfo) => s.status === 'active').length} active`, color: '#8E44AD' },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {metrics.map(m => (
          <div key={m.label} style={{ background: '#F9FAFB', borderRadius: 10, padding: '0.875rem 1rem', border: '1px solid #E0E4E8' }}>
            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: m.color, marginTop: '0.2rem' }}>{m.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Enrollment progress */}
      <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#1C2B3A' }}>
        <span>Overall Enrollment Progress</span>
        <span style={{ color: '#5A8A6A' }}>{enrollPct}%</span>
      </div>
      <div style={{ height: 10, borderRadius: 5, background: '#E0E4E8', marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${enrollPct}%`, background: '#5A8A6A', borderRadius: 5 }} />
      </div>

      {/* Sites table */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1C2B3A' }}>Research Sites</h3>
        <button onClick={() => setShowAddSite(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#5A8A6A', color: 'white', border: 'none', borderRadius: 8, padding: '0.4rem 0.875rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
          <Plus size={13} /> Add Site
        </button>
      </div>

      {showAddSite && (
        <div style={{ background: '#F9FAFB', border: '1px solid #E0E4E8', borderRadius: 10, padding: '1rem', marginBottom: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '0.5rem', alignItems: 'end' }}>
          <div>
            <label style={labelStyle}>Site Name</label>
            <input style={inputStyle} value={newSite.name} onChange={e => setNewSite(n => ({ ...n, name: e.target.value }))} placeholder="Site name" />
          </div>
          <div>
            <label style={labelStyle}>Location</label>
            <input style={inputStyle} value={newSite.location} onChange={e => setNewSite(n => ({ ...n, location: e.target.value }))} placeholder="City, Country" />
          </div>
          <div>
            <label style={labelStyle}>Target</label>
            <input type="number" style={{ ...inputStyle, width: 90 }} value={newSite.enrollmentTarget} onChange={e => setNewSite(n => ({ ...n, enrollmentTarget: e.target.value }))} placeholder="0" />
          </div>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button onClick={addSite} style={{ background: '#5A8A6A', color: 'white', border: 'none', borderRadius: 8, padding: '0.55rem 0.875rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Add</button>
            <button onClick={() => setShowAddSite(false)} style={{ background: 'none', border: '1px solid #E0E4E8', borderRadius: 8, padding: '0.55rem', cursor: 'pointer', color: '#6B7280' }}><X size={15} /></button>
          </div>
        </div>
      )}

      {project.sites.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Site Name', 'Location', 'Target', 'Actual', '%', 'Status'].map(h => (
                  <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: '0.75rem', borderBottom: '1px solid #E0E4E8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {project.sites.map((site: SiteInfo) => {
                const pct = site.enrollmentTarget > 0 ? Math.round((site.enrollmentActual / site.enrollmentTarget) * 100) : 0;
                return (
                  <tr key={site.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: '#1C2B3A' }}>{site.name}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#6B7280' }}>{site.location}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>{site.enrollmentTarget}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>{site.enrollmentActual}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 48, height: 6, borderRadius: 3, background: '#E0E4E8', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct >= 90 ? '#27AE60' : pct >= 60 ? '#5A8A6A' : '#E67E22', borderRadius: 3 }} />
                        </div>
                        <span style={{ color: '#6B7280', fontSize: '0.75rem' }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <StatusBadge status={site.status} variant="form" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem', border: '1px dashed #E0E4E8', borderRadius: 10 }}>
          No sites added yet. Click "Add Site" to get started.
        </div>
      )}
    </div>
  );
}

// ─── Data Tab ─────────────────────────────────────────────────────────────────
function DataTab({ project, updateProject, addActivity }: any) {
  function advanceStatus(datasetId: string) {
    const statusOrder = ['raw', 'cleaning', 'clean', 'analysis-ready'];
    const updated = project.datasets.map((d: DatasetRef) => {
      if (d.id !== datasetId) return d;
      const idx = statusOrder.indexOf(d.status);
      const next = statusOrder[Math.min(idx + 1, statusOrder.length - 1)];
      return { ...d, status: next };
    });
    updateProject(project.id, { datasets: updated });
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1C2B3A' }}>Datasets ({project.datasets.length})</h3>
        <button style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#2E86C1', color: 'white', border: 'none', borderRadius: 8, padding: '0.45rem 0.875rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
          <Plus size={13} /> Upload Dataset
        </button>
      </div>

      {project.datasets.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '3rem', border: '1px dashed #E0E4E8', borderRadius: 10 }}>
          No datasets uploaded. Upload a dataset to begin data management.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {project.datasets.map((d: DatasetRef) => (
            <div key={d.id} style={{ background: '#F9FAFB', borderRadius: 10, padding: '1rem', border: '1px solid #E0E4E8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1C2B3A' }}>{d.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '0.15rem' }}>
                    v{d.version} · {d.rowCount.toLocaleString()} rows × {d.columnCount} cols · Uploaded {new Date(d.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <StatusBadge status={d.status} variant="dataset" />
                  {d.status !== 'analysis-ready' && (
                    <button onClick={() => advanceStatus(d.id)} style={{ background: '#5A8A6A', color: 'white', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>
                      Advance →
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button style={{ background: 'none', border: '1px solid #E0E4E8', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.78rem', color: '#2E86C1' }}>View</button>
                <button style={{ background: 'none', border: '1px solid #E0E4E8', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.78rem', color: '#5A8A6A' }}>Clean</button>
                <button style={{ background: 'none', border: '1px solid #E0E4E8', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.78rem', color: '#6B7280' }}>Version History</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Forms Tab ────────────────────────────────────────────────────────────────
function FormsTab({ project, navigate, updateProject }: any) {
  function toggleFormStatus(formId: string) {
    const updated = project.forms.map((f: any) => {
      if (f.id !== formId) return f;
      return { ...f, status: f.status === 'active' ? 'closed' : 'active' };
    });
    updateProject(project.id, { forms: updated });
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1C2B3A' }}>Field Forms ({project.forms.length})</h3>
        <button onClick={() => navigate('/ngo/forms')} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#5A8A6A', color: 'white', border: 'none', borderRadius: 8, padding: '0.45rem 0.875rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
          <Plus size={13} /> Create Form
        </button>
      </div>

      {project.forms.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '3rem', border: '1px dashed #E0E4E8', borderRadius: 10 }}>
          No forms yet. Create a data collection form to get started.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {project.forms.map((form: any) => (
            <div key={form.id} style={{ background: '#F9FAFB', borderRadius: 10, padding: '1rem', border: '1px solid #E0E4E8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1C2B3A' }}>{form.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '0.15rem' }}>
                    {form.description} · {form.responsesCount} responses · {form.fields.length} fields
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '0.1rem' }}>Created {new Date(form.createdAt).toLocaleDateString()}</div>
                </div>
                <StatusBadge status={form.status} variant="form" />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button onClick={() => navigate('/ngo/forms')} style={{ background: 'none', border: '1px solid #E0E4E8', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.78rem', color: '#2E86C1' }}>Edit</button>
                <button style={{ background: 'none', border: '1px solid #E0E4E8', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.78rem', color: '#5A8A6A' }}>Preview</button>
                <button style={{ background: 'none', border: '1px solid #E0E4E8', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.78rem', color: '#6B7280' }}>Export CSV</button>
                <button onClick={() => toggleFormStatus(form.id)} style={{ background: 'none', border: '1px solid #E0E4E8', borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.78rem', color: form.status === 'active' ? '#C0533A' : '#27AE60' }}>
                  {form.status === 'active' ? 'Close Form' : 'Reopen Form'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Analysis Tab ─────────────────────────────────────────────────────────────
function AnalysisTab({ navigate }: any) {
  return (
    <div>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#1C2B3A' }}>Available Analysis Tools</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
        {ANALYSIS_TOOLS.map(tool => (
          <div
            key={tool.name}
            onClick={() => navigate(tool.path)}
            style={{ background: '#F9FAFB', borderRadius: 10, padding: '1rem', border: '1px solid #E0E4E8', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'}
          >
            <div style={{ color: '#5A8A6A', marginBottom: '0.5rem' }}>{tool.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1C2B3A', marginBottom: '0.2rem' }}>{tool.name}</div>
            <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>{tool.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Budget Tab ───────────────────────────────────────────────────────────────
function BudgetTab({ project, projectBudgetItems, addBudgetItem, updateBudgetItem, deleteBudgetItem, totalSpent, budgetPct, budgetColor }: any) {
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ category: 'personnel', description: '', spent: '', date: new Date().toISOString().split('T')[0], site: '', receipt: false, notes: '' });

  function handleAdd() {
    if (!newItem.description.trim() || !newItem.spent) return;
    const item: BudgetItem = {
      id: `bi-${Date.now()}`,
      projectId: project.id,
      category: newItem.category as any,
      description: newItem.description,
      budgeted: parseFloat(newItem.spent) || 0,
      spent: parseFloat(newItem.spent) || 0,
      date: newItem.date,
      site: newItem.site,
      receipt: newItem.receipt,
      notes: newItem.notes,
    };
    addBudgetItem(item);
    setNewItem({ category: 'personnel', description: '', spent: '', date: new Date().toISOString().split('T')[0], site: '', receipt: false, notes: '' });
    setShowAdd(false);
  }

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Total Budget', value: `$${project.budgetTotal.toLocaleString()}`, color: '#1C2B3A' },
          { label: 'Spent', value: `$${totalSpent.toLocaleString()}`, color: budgetColor },
          { label: 'Remaining', value: `$${(project.budgetTotal - totalSpent).toLocaleString()}`, color: '#27AE60' },
          { label: 'Utilization', value: `${budgetPct}%`, color: budgetColor },
        ].map(m => (
          <div key={m.label} style={{ background: '#F9FAFB', borderRadius: 10, padding: '0.875rem', border: '1px solid #E0E4E8' }}>
            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>{m.label}</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: m.color, marginTop: '0.2rem' }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ height: 10, borderRadius: 5, background: '#E0E4E8', marginBottom: '1.25rem', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(budgetPct, 100)}%`, background: budgetColor, borderRadius: 5 }} />
      </div>

      <BudgetChart budgetItems={projectBudgetItems} totalBudget={project.budgetTotal} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.25rem 0 0.75rem' }}>
        <h4 style={{ margin: 0, fontWeight: 700, color: '#1C2B3A' }}>Expense Log</h4>
        <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#5A8A6A', color: 'white', border: 'none', borderRadius: 8, padding: '0.4rem 0.875rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
          <Plus size={13} /> Add Expense
        </button>
      </div>

      {showAdd && (
        <div style={{ background: '#F9FAFB', border: '1px solid #E0E4E8', borderRadius: 10, padding: '1rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.6rem', marginBottom: '0.6rem' }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select style={inputStyle} value={newItem.category} onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))}>
                {BUDGET_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <input style={inputStyle} value={newItem.description} onChange={e => setNewItem(n => ({ ...n, description: e.target.value }))} placeholder="Description" />
            </div>
            <div>
              <label style={labelStyle}>Amount ($)</label>
              <input type="number" style={inputStyle} value={newItem.spent} onChange={e => setNewItem(n => ({ ...n, spent: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" style={inputStyle} value={newItem.date} onChange={e => setNewItem(n => ({ ...n, date: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Site</label>
              <select style={inputStyle} value={newItem.site} onChange={e => setNewItem(n => ({ ...n, site: e.target.value }))}>
                <option value="">All Sites</option>
                {project.sites.map((s: SiteInfo) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={newItem.receipt} onChange={e => setNewItem(n => ({ ...n, receipt: e.target.checked }))} /> Receipt attached
            </label>
            <button onClick={handleAdd} style={{ background: '#5A8A6A', color: 'white', border: 'none', borderRadius: 8, padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>Add</button>
            <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: '1px solid #E0E4E8', borderRadius: 8, padding: '0.45rem 0.75rem', cursor: 'pointer', fontSize: '0.82rem', color: '#6B7280' }}>Cancel</button>
          </div>
        </div>
      )}

      {projectBudgetItems.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Date', 'Category', 'Description', 'Amount', 'Site', 'Receipt', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: '0.75rem', borderBottom: '1px solid #E0E4E8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projectBudgetItems.map((item: BudgetItem) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '0.6rem 0.75rem', color: '#6B7280' }}>{item.date}</td>
                  <td style={{ padding: '0.6rem 0.75rem', textTransform: 'capitalize' }}>{item.category}</td>
                  <td style={{ padding: '0.6rem 0.75rem', color: '#1C2B3A' }}>{item.description}</td>
                  <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>${item.spent.toLocaleString()}</td>
                  <td style={{ padding: '0.6rem 0.75rem', color: '#6B7280' }}>{item.site || 'All'}</td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>{item.receipt ? <CheckCircle size={14} color="#27AE60" /> : '—'}</td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <button onClick={() => deleteBudgetItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0533A' }}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem', border: '1px dashed #E0E4E8', borderRadius: 10 }}>No expenses recorded yet.</div>
      )}
    </div>
  );
}

// ─── Ethics Tab ───────────────────────────────────────────────────────────────
function EthicsTab({ project, projectEthics, addEthicsSubmission, updateProject }: any) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ board: '', submissionDate: new Date().toISOString().split('T')[0], protocolVersion: '', status: 'pending', approvalDate: '', expiryDate: '', comments: '' });

  function handleSubmit() {
    if (!form.board.trim()) return;
    const submission: EthicsSubmission = {
      id: `es-${Date.now()}`,
      projectId: project.id,
      board: form.board,
      submissionDate: form.submissionDate,
      status: form.status as any,
      approvalDate: form.approvalDate || null,
      expiryDate: form.expiryDate || null,
      protocolVersion: form.protocolVersion,
      comments: form.comments,
      documents: [],
    };
    addEthicsSubmission(submission);
    if (form.status === 'approved') {
      updateProject(project.id, { ethicsStatus: 'approved', ethicsApprovalDate: form.approvalDate || null, ethicsExpiryDate: form.expiryDate || null });
    } else if (form.status === 'pending') {
      updateProject(project.id, { ethicsStatus: 'pending' });
    }
    setShowForm(false);
    setForm({ board: '', submissionDate: new Date().toISOString().split('T')[0], protocolVersion: '', status: 'pending', approvalDate: '', expiryDate: '', comments: '' });
  }

  const latest = projectEthics.sort((a: EthicsSubmission, b: EthicsSubmission) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())[0];
  const expiryDays = latest?.expiryDate ? Math.ceil((new Date(latest.expiryDate).getTime() - Date.now()) / 86400000) : null;

  return (
    <div>
      {/* Status */}
      <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem', border: '1px solid #E0E4E8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Current Ethics Status</div>
            <StatusBadge status={project.ethicsStatus} variant="ethics" />
          </div>
          {expiryDays !== null && expiryDays > 0 && (
            <div style={{ background: expiryDays < 30 ? '#FEF3C7' : '#D1FAE5', borderRadius: 8, padding: '0.5rem 0.875rem', fontSize: '0.82rem', color: expiryDays < 30 ? '#92400E' : '#065F46' }}>
              Valid for {expiryDays} more days (expires {latest.expiryDate})
            </div>
          )}
          {expiryDays !== null && expiryDays <= 0 && (
            <div style={{ background: '#FEE2E2', borderRadius: 8, padding: '0.5rem 0.875rem', fontSize: '0.82rem', color: '#991B1B' }}>
              Ethics approval has expired
            </div>
          )}
          <button onClick={() => setShowForm(true)} style={{ background: '#5A8A6A', color: 'white', border: 'none', borderRadius: 8, padding: '0.45rem 0.875rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
            + New Submission
          </button>
        </div>
      </div>

      {/* Submission form */}
      {showForm && (
        <div style={{ background: '#F9FAFB', border: '1px solid #E0E4E8', borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#1C2B3A' }}>New Ethics Submission</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Ethics Board / IRB</label>
              <input style={inputStyle} value={form.board} onChange={e => setForm(f => ({ ...f, board: e.target.value }))} placeholder="Board name" />
            </div>
            <div>
              <label style={labelStyle}>Protocol Version</label>
              <input style={inputStyle} value={form.protocolVersion} onChange={e => setForm(f => ({ ...f, protocolVersion: e.target.value }))} placeholder="e.g. 1.2" />
            </div>
            <div>
              <label style={labelStyle}>Submission Date</label>
              <input type="date" style={inputStyle} value={form.submissionDate} onChange={e => setForm(f => ({ ...f, submissionDate: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="revision-required">Revision Required</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            {form.status === 'approved' && (
              <>
                <div>
                  <label style={labelStyle}>Approval Date</label>
                  <input type="date" style={inputStyle} value={form.approvalDate} onChange={e => setForm(f => ({ ...f, approvalDate: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Expiry Date</label>
                  <input type="date" style={inputStyle} value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
                </div>
              </>
            )}
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={labelStyle}>Comments</label>
            <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={form.comments} onChange={e => setForm(f => ({ ...f, comments: e.target.value }))} placeholder="Board comments..." />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleSubmit} style={{ background: '#5A8A6A', color: 'white', border: 'none', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Submit</button>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: '1px solid #E0E4E8', borderRadius: 8, padding: '0.5rem 0.875rem', cursor: 'pointer', fontSize: '0.85rem', color: '#6B7280' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <h4 style={{ margin: '0 0 0.75rem 0', color: '#1C2B3A', fontWeight: 700 }}>Submission Timeline</h4>
      {projectEthics.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem', border: '1px dashed #E0E4E8', borderRadius: 10 }}>No submissions yet</div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
          <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: '#E0E4E8' }} />
          {[...projectEthics].sort((a: EthicsSubmission, b: EthicsSubmission) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()).map((sub: EthicsSubmission) => {
            const dotColor = sub.status === 'approved' ? '#27AE60' : sub.status === 'pending' ? '#E67E22' : sub.status === 'revision-required' ? '#C0533A' : '#6B7280';
            return (
              <div key={sub.id} style={{ position: 'relative', marginBottom: '1rem', paddingLeft: '1rem' }}>
                <div style={{ position: 'absolute', left: -19, top: 4, width: 12, height: 12, borderRadius: '50%', background: dotColor, border: '2px solid white', boxShadow: `0 0 0 2px ${dotColor}` }} />
                <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '0.875rem', border: '1px solid #E0E4E8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1C2B3A' }}>{sub.board}</div>
                      <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '0.15rem' }}>Submitted {sub.submissionDate} · Protocol v{sub.protocolVersion}</div>
                      {sub.comments && <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '0.25rem', fontStyle: 'italic' }}>{sub.comments}</div>}
                    </div>
                    <StatusBadge status={sub.status} variant="ethics" />
                  </div>
                  {sub.approvalDate && <div style={{ fontSize: '0.75rem', color: '#27AE60', marginTop: '0.35rem' }}>✓ Approved {sub.approvalDate} {sub.expiryDate ? `· Expires ${sub.expiryDate}` : ''}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Team Tab ─────────────────────────────────────────────────────────────────
function TeamTab({ project, updateProject, addActivity }: any) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'research-assistant', site: '' });

  function addMember() {
    if (!form.name.trim()) return;
    const member: TeamMember = { id: `tm-${Date.now()}`, name: form.name, email: form.email, role: form.role as any, site: form.site || 'All' };
    updateProject(project.id, { teamMembers: [...project.teamMembers, member] });
    addActivity({ type: 'team-change', description: `Added ${form.name} as ${ROLE_LABELS[form.role]}`, projectId: project.id, user: 'You' });
    setForm({ name: '', email: '', role: 'research-assistant', site: '' });
    setShowForm(false);
  }

  function removeMember(memberId: string) {
    const member = project.teamMembers.find((m: TeamMember) => m.id === memberId);
    updateProject(project.id, { teamMembers: project.teamMembers.filter((m: TeamMember) => m.id !== memberId) });
    if (member) addActivity({ type: 'team-change', description: `Removed ${member.name} from team`, projectId: project.id, user: 'You' });
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1C2B3A' }}>Team Members ({project.teamMembers.length})</h3>
        <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#5A8A6A', color: 'white', border: 'none', borderRadius: 8, padding: '0.45rem 0.875rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
          <Plus size={13} /> Add Member
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#F9FAFB', border: '1px solid #E0E4E8', borderRadius: 10, padding: '1rem', marginBottom: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.6rem', alignItems: 'end' }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@org.org" />
          </div>
          <div>
            <label style={labelStyle}>Role</label>
            <select style={inputStyle} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Site</label>
            <select style={inputStyle} value={form.site} onChange={e => setForm(f => ({ ...f, site: e.target.value }))}>
              <option value="">All Sites</option>
              {project.sites.map((s: SiteInfo) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button onClick={addMember} style={{ background: '#5A8A6A', color: 'white', border: 'none', borderRadius: 8, padding: '0.55rem 0.875rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Add</button>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: '1px solid #E0E4E8', borderRadius: 8, padding: '0.55rem', cursor: 'pointer', color: '#6B7280' }}><X size={15} /></button>
          </div>
        </div>
      )}

      {project.teamMembers.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem', border: '1px dashed #E0E4E8', borderRadius: 10 }}>No team members added yet.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Name', 'Email', 'Role', 'Site', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: '0.75rem', borderBottom: '1px solid #E0E4E8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {project.teamMembers.map((m: TeamMember) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: '#1C2B3A' }}>{m.name}</td>
                  <td style={{ padding: '0.6rem 0.75rem', color: '#6B7280' }}>{m.email}</td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>{ROLE_LABELS[m.role] || m.role}</td>
                  <td style={{ padding: '0.6rem 0.75rem', color: '#6B7280' }}>{m.site}</td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <button onClick={() => removeMember(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0533A' }}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────
function ReportsTab({ project }: any) {
  const templates = [
    { name: 'Progress Report', desc: 'Enrollment, activities, achievements to date', sections: ['Project Overview', 'Enrollment Status', 'Site Performance', 'Budget Summary', 'Next Steps'] },
    { name: 'Final Report', desc: 'Comprehensive project completion summary', sections: ['Executive Summary', 'Methods', 'Results', 'Budget', 'Recommendations'] },
    { name: 'Donor Report', desc: 'Formatted for donor/funder reporting requirements', sections: ['Project Impact', 'Beneficiaries Reached', 'Budget Utilization', 'Case Studies'] },
    { name: 'Data Summary', desc: 'Technical data quality and analysis overview', sections: ['Dataset Summary', 'Data Quality', 'Analysis Results', 'Data Dictionary'] },
  ];

  return (
    <div>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#1C2B3A' }}>Report Templates</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {templates.map(t => (
          <div key={t.name} style={{ background: '#F9FAFB', borderRadius: 10, padding: '1rem', border: '1px solid #E0E4E8' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1C2B3A', marginBottom: '0.3rem' }}>{t.name}</div>
            <div style={{ fontSize: '0.78rem', color: '#6B7280', marginBottom: '0.6rem' }}>{t.desc}</div>
            <div style={{ marginBottom: '0.75rem' }}>
              {t.sections.map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.15rem' }}>
                  <CheckCircle size={11} color="#5A8A6A" /> {s}
                </div>
              ))}
            </div>
            <button style={{ background: '#5A8A6A', color: 'white', border: 'none', borderRadius: 7, padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, width: '100%' }}>
              Generate Report
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button style={{ background: 'white', border: '1px solid #E0E4E8', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem', color: '#2E86C1' }}>Export All Data</button>
        <button style={{ background: 'white', border: '1px solid #E0E4E8', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem', color: '#6B7280' }}>Download Project Summary</button>
      </div>
    </div>
  );
}
