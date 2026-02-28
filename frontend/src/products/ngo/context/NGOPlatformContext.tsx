import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface SiteInfo {
  id: string;
  name: string;
  location: string;
  enrollmentTarget: number;
  enrollmentActual: number;
  status: 'active' | 'paused' | 'closed';
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'pi' | 'co-pi' | 'research-assistant' | 'data-manager' | 'field-coordinator' | 'statistician';
  site: string;
}

export interface DatasetRef {
  id: string;
  name: string;
  version: number;
  rowCount: number;
  columnCount: number;
  uploadedAt: string;
  status: 'raw' | 'cleaning' | 'clean' | 'analysis-ready';
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multi-select' | 'date' | 'location' | 'photo' | 'scale' | 'yes-no' | 'long-text';
  required: boolean;
  options?: string[];
  validation?: { min?: number; max?: number; pattern?: string };
  helpText?: string;
  section: string;
}

export interface FieldForm {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  status: 'draft' | 'active' | 'closed';
  responsesCount: number;
  createdAt: string;
}

export interface NGOProject {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'data-collection' | 'analysis' | 'reporting' | 'completed';
  createdAt: string;
  updatedAt: string;
  organization: string;
  principalInvestigator: string;
  startDate: string;
  endDate: string;
  sites: SiteInfo[];
  teamMembers: TeamMember[];
  datasets: DatasetRef[];
  forms: FieldForm[];
  budgetTotal: number;
  budgetSpent: number;
  ethicsStatus: 'not-submitted' | 'pending' | 'approved' | 'revision-required' | 'expired';
  ethicsApprovalDate: string | null;
  ethicsExpiryDate: string | null;
}

export interface BudgetItem {
  id: string;
  projectId: string;
  category: 'personnel' | 'travel' | 'equipment' | 'supplies' | 'services' | 'overhead' | 'other';
  description: string;
  budgeted: number;
  spent: number;
  date: string;
  site: string;
  receipt: boolean;
  notes: string;
}

export interface EthicsSubmission {
  id: string;
  projectId: string;
  board: string;
  submissionDate: string;
  status: 'pending' | 'approved' | 'revision-required' | 'rejected';
  approvalDate: string | null;
  expiryDate: string | null;
  protocolVersion: string;
  comments: string;
  documents: string[];
}

export interface ActivityItem {
  id: string;
  type: 'data-upload' | 'form-created' | 'analysis-run' | 'budget-entry' | 'ethics-update' | 'team-change' | 'report-generated';
  description: string;
  timestamp: string;
  projectId: string;
  user: string;
}

export interface NGOState {
  projects: NGOProject[];
  activeProjectId: string | null;
  budgetItems: BudgetItem[];
  ethicsSubmissions: EthicsSubmission[];
  recentActivity: ActivityItem[];
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'LOAD_STATE'; payload: NGOState }
  | { type: 'CREATE_PROJECT'; payload: NGOProject }
  | { type: 'UPDATE_PROJECT'; id: string; updates: Partial<NGOProject> }
  | { type: 'SET_ACTIVE_PROJECT'; id: string }
  | { type: 'ADD_DATASET'; dataset: DatasetRef }
  | { type: 'ADD_FORM'; form: FieldForm }
  | { type: 'UPDATE_FORM'; formId: string; updates: Partial<FieldForm> }
  | { type: 'ADD_BUDGET_ITEM'; item: BudgetItem }
  | { type: 'UPDATE_BUDGET_ITEM'; id: string; updates: Partial<BudgetItem> }
  | { type: 'DELETE_BUDGET_ITEM'; id: string }
  | { type: 'ADD_ETHICS_SUBMISSION'; submission: EthicsSubmission }
  | { type: 'ADD_ACTIVITY'; activity: ActivityItem };

// ─── Initial State ────────────────────────────────────────────────────────────

const DEMO_PROJECT: NGOProject = {
  id: 'proj-demo-001',
  name: 'Community Health Intervention Study',
  description: 'A multi-site randomized controlled trial evaluating the effectiveness of community health worker interventions on maternal and child health outcomes in rural settings.',
  status: 'data-collection',
  createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  organization: 'Health Alliance International',
  principalInvestigator: 'Dr. Sarah Kimani',
  startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endDate: new Date(Date.now() + 275 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  sites: [
    { id: 'site-001', name: 'Kisumu North', location: 'Kisumu, Kenya', enrollmentTarget: 150, enrollmentActual: 112, status: 'active' },
    { id: 'site-002', name: 'Mombasa Central', location: 'Mombasa, Kenya', enrollmentTarget: 150, enrollmentActual: 98, status: 'active' },
    { id: 'site-003', name: 'Nakuru West', location: 'Nakuru, Kenya', enrollmentTarget: 100, enrollmentActual: 45, status: 'active' },
  ],
  teamMembers: [
    { id: 'tm-001', name: 'Dr. Sarah Kimani', email: 's.kimani@hai.org', role: 'pi', site: 'All' },
    { id: 'tm-002', name: 'James Ochieng', email: 'j.ochieng@hai.org', role: 'field-coordinator', site: 'Kisumu North' },
    { id: 'tm-003', name: 'Amina Hassan', email: 'a.hassan@hai.org', role: 'data-manager', site: 'All' },
  ],
  datasets: [
    { id: 'ds-001', name: 'Baseline Survey', version: 2, rowCount: 255, columnCount: 48, uploadedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), status: 'clean' },
  ],
  forms: [
    { id: 'form-001', name: 'Household Enrollment Form', description: 'Initial household screening and enrollment', fields: [], status: 'active', responsesCount: 255, createdAt: new Date(Date.now() - 88 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'form-002', name: 'Monthly Follow-up Form', description: 'Monthly health outcome monitoring', fields: [], status: 'active', responsesCount: 510, createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
  ],
  budgetTotal: 250000,
  budgetSpent: 87500,
  ethicsStatus: 'approved',
  ethicsApprovalDate: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  ethicsExpiryDate: new Date(Date.now() + 280 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
};

const INITIAL_STATE: NGOState = {
  projects: [DEMO_PROJECT],
  activeProjectId: 'proj-demo-001',
  budgetItems: [
    { id: 'bi-001', projectId: 'proj-demo-001', category: 'personnel', description: 'Field coordinator salaries (Q1)', budgeted: 30000, spent: 28500, date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], site: 'All', receipt: true, notes: '' },
    { id: 'bi-002', projectId: 'proj-demo-001', category: 'travel', description: 'Site visit transport', budgeted: 5000, spent: 3200, date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], site: 'Kisumu North', receipt: true, notes: 'Fuel and matatu costs' },
    { id: 'bi-003', projectId: 'proj-demo-001', category: 'supplies', description: 'Data collection tablets', budgeted: 8000, spent: 7800, date: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], site: 'All', receipt: true, notes: '10 Samsung tablets' },
    { id: 'bi-004', projectId: 'proj-demo-001', category: 'personnel', description: 'Data manager (Q1-Q2)', budgeted: 20000, spent: 18000, date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], site: 'All', receipt: true, notes: '' },
    { id: 'bi-005', projectId: 'proj-demo-001', category: 'overhead', description: 'Institutional overhead', budgeted: 15000, spent: 15000, date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], site: 'All', receipt: true, notes: '15% overhead rate' },
  ],
  ethicsSubmissions: [
    { id: 'es-001', projectId: 'proj-demo-001', board: 'Kenya Medical Research Institute (KEMRI)', submissionDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'approved', approvalDate: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], expiryDate: new Date(Date.now() + 280 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], protocolVersion: '1.2', comments: 'Approved with minor revisions to consent form language', documents: ['Protocol_v1.2.pdf', 'ConsentForm_EN_v2.pdf', 'ConsentForm_SW_v2.pdf'] },
  ],
  recentActivity: [
    { id: 'act-001', type: 'data-upload', description: 'Uploaded Baseline Survey dataset (255 records)', timestamp: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), projectId: 'proj-demo-001', user: 'Amina Hassan' },
    { id: 'act-002', type: 'form-created', description: 'Created Monthly Follow-up Form', timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), projectId: 'proj-demo-001', user: 'James Ochieng' },
    { id: 'act-003', type: 'ethics-update', description: 'Ethics approval received from KEMRI', timestamp: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString(), projectId: 'proj-demo-001', user: 'Dr. Sarah Kimani' },
    { id: 'act-004', type: 'budget-entry', description: 'Added expense: Field coordinator salaries (Q1) - KES 28,500', timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), projectId: 'proj-demo-001', user: 'Amina Hassan' },
    { id: 'act-005', type: 'team-change', description: 'Added James Ochieng as Field Coordinator (Kisumu North)', timestamp: new Date(Date.now() - 88 * 24 * 60 * 60 * 1000).toISOString(), projectId: 'proj-demo-001', user: 'Dr. Sarah Kimani' },
  ],
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: NGOState, action: Action): NGOState {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload;

    case 'CREATE_PROJECT':
      return { ...state, projects: [...state.projects, action.payload], activeProjectId: action.payload.id };

    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.id ? { ...p, ...action.updates, updatedAt: new Date().toISOString() } : p
        ),
      };

    case 'SET_ACTIVE_PROJECT':
      return { ...state, activeProjectId: action.id };

    case 'ADD_DATASET': {
      const proj = state.projects.find(p => p.id === state.activeProjectId);
      if (!proj) return state;
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === state.activeProjectId
            ? { ...p, datasets: [...p.datasets, action.dataset], updatedAt: new Date().toISOString() }
            : p
        ),
      };
    }

    case 'ADD_FORM': {
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === state.activeProjectId
            ? { ...p, forms: [...p.forms, action.form], updatedAt: new Date().toISOString() }
            : p
        ),
      };
    }

    case 'UPDATE_FORM': {
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === state.activeProjectId
            ? {
                ...p,
                forms: p.forms.map(f => f.id === action.formId ? { ...f, ...action.updates } : f),
                updatedAt: new Date().toISOString(),
              }
            : p
        ),
      };
    }

    case 'ADD_BUDGET_ITEM':
      return { ...state, budgetItems: [...state.budgetItems, action.item] };

    case 'UPDATE_BUDGET_ITEM':
      return {
        ...state,
        budgetItems: state.budgetItems.map(b => b.id === action.id ? { ...b, ...action.updates } : b),
      };

    case 'DELETE_BUDGET_ITEM':
      return { ...state, budgetItems: state.budgetItems.filter(b => b.id !== action.id) };

    case 'ADD_ETHICS_SUBMISSION':
      return { ...state, ethicsSubmissions: [...state.ethicsSubmissions, action.submission] };

    case 'ADD_ACTIVITY':
      return { ...state, recentActivity: [action.activity, ...state.recentActivity].slice(0, 100) };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface NGOContextType {
  state: NGOState;
  activeProject: NGOProject | null;
  createProject: (project: Partial<NGOProject>) => void;
  updateProject: (id: string, updates: Partial<NGOProject>) => void;
  setActiveProject: (id: string) => void;
  addDataset: (dataset: DatasetRef) => void;
  addForm: (form: FieldForm) => void;
  updateForm: (formId: string, updates: Partial<FieldForm>) => void;
  addBudgetItem: (item: BudgetItem) => void;
  updateBudgetItem: (id: string, updates: Partial<BudgetItem>) => void;
  deleteBudgetItem: (id: string) => void;
  addEthicsSubmission: (submission: EthicsSubmission) => void;
  addActivity: (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => void;
  getProjectStats: (id: string) => ProjectStats;
}

interface ProjectStats {
  enrollmentTotal: number;
  enrollmentTarget: number;
  enrollmentPct: number;
  budgetUtilization: number;
  daysRemaining: number;
  burnRate: number;
}

const NGOContext = createContext<NGOContextType | null>(null);

export function NGOPlatformProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rf_ngo_platform');
      if (saved) {
        const parsed = JSON.parse(saved) as NGOState;
        if (parsed.projects && Array.isArray(parsed.projects)) {
          dispatch({ type: 'LOAD_STATE', payload: parsed });
        }
      }
    } catch (e) {
      // ignore parse errors
    }
  }, []);

  // Persist to localStorage on state change
  useEffect(() => {
    localStorage.setItem('rf_ngo_platform', JSON.stringify(state));
  }, [state]);

  const activeProject = state.projects.find(p => p.id === state.activeProjectId) || null;

  function createProject(project: Partial<NGOProject>) {
    const newProject: NGOProject = {
      id: `proj-${Date.now()}`,
      name: project.name || 'Untitled Project',
      description: project.description || '',
      status: 'planning',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      organization: project.organization || '',
      principalInvestigator: project.principalInvestigator || '',
      startDate: project.startDate || new Date().toISOString().split('T')[0],
      endDate: project.endDate || '',
      sites: [],
      teamMembers: [],
      datasets: [],
      forms: [],
      budgetTotal: project.budgetTotal || 0,
      budgetSpent: 0,
      ethicsStatus: 'not-submitted',
      ethicsApprovalDate: null,
      ethicsExpiryDate: null,
    };
    dispatch({ type: 'CREATE_PROJECT', payload: newProject });

    // Try backend
    fetch('/api/v1/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProject),
    }).catch(() => {});

    addActivity({
      type: 'form-created',
      description: `Created project: ${newProject.name}`,
      projectId: newProject.id,
      user: 'You',
    });
  }

  function updateProject(id: string, updates: Partial<NGOProject>) {
    dispatch({ type: 'UPDATE_PROJECT', id, updates });
  }

  function setActiveProject(id: string) {
    dispatch({ type: 'SET_ACTIVE_PROJECT', id });
  }

  function addDataset(dataset: DatasetRef) {
    dispatch({ type: 'ADD_DATASET', dataset });
  }

  function addForm(form: FieldForm) {
    dispatch({ type: 'ADD_FORM', form });
    addActivity({
      type: 'form-created',
      description: `Created form: ${form.name}`,
      projectId: state.activeProjectId || '',
      user: 'You',
    });
  }

  function updateForm(formId: string, updates: Partial<FieldForm>) {
    dispatch({ type: 'UPDATE_FORM', formId, updates });
  }

  function addBudgetItem(item: BudgetItem) {
    dispatch({ type: 'ADD_BUDGET_ITEM', item });
    addActivity({
      type: 'budget-entry',
      description: `Added expense: ${item.description} - $${item.spent.toLocaleString()}`,
      projectId: item.projectId,
      user: 'You',
    });
  }

  function updateBudgetItem(id: string, updates: Partial<BudgetItem>) {
    dispatch({ type: 'UPDATE_BUDGET_ITEM', id, updates });
  }

  function deleteBudgetItem(id: string) {
    dispatch({ type: 'DELETE_BUDGET_ITEM', id });
  }

  function addEthicsSubmission(submission: EthicsSubmission) {
    dispatch({ type: 'ADD_ETHICS_SUBMISSION', submission });
    addActivity({
      type: 'ethics-update',
      description: `Ethics submission to ${submission.board} (${submission.status})`,
      projectId: submission.projectId,
      user: 'You',
    });
  }

  function addActivity(activity: Omit<ActivityItem, 'id' | 'timestamp'>) {
    const full: ActivityItem = {
      ...activity,
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_ACTIVITY', activity: full });
  }

  function getProjectStats(id: string): ProjectStats {
    const project = state.projects.find(p => p.id === id);
    if (!project) return { enrollmentTotal: 0, enrollmentTarget: 0, enrollmentPct: 0, budgetUtilization: 0, daysRemaining: 0, burnRate: 0 };

    const enrollmentTotal = project.sites.reduce((s, site) => s + site.enrollmentActual, 0);
    const enrollmentTarget = project.sites.reduce((s, site) => s + site.enrollmentTarget, 0);
    const enrollmentPct = enrollmentTarget > 0 ? Math.round((enrollmentTotal / enrollmentTarget) * 100) : 0;

    const projectBudgetItems = state.budgetItems.filter(b => b.projectId === id);
    const totalSpent = projectBudgetItems.reduce((s, b) => s + b.spent, 0) + project.budgetSpent;
    const budgetUtilization = project.budgetTotal > 0 ? Math.round((totalSpent / project.budgetTotal) * 100) : 0;

    const end = new Date(project.endDate);
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const start = new Date(project.startDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const elapsed = Math.max(1, totalDays - daysRemaining);
    const burnRate = totalDays > 0 ? Math.round((budgetUtilization / (elapsed / totalDays))) : 0;

    return { enrollmentTotal, enrollmentTarget, enrollmentPct, budgetUtilization, daysRemaining, burnRate };
  }

  return (
    <NGOContext.Provider value={{
      state,
      activeProject,
      createProject,
      updateProject,
      setActiveProject,
      addDataset,
      addForm,
      updateForm,
      addBudgetItem,
      updateBudgetItem,
      deleteBudgetItem,
      addEthicsSubmission,
      addActivity,
      getProjectStats,
    }}>
      {children}
    </NGOContext.Provider>
  );
}

export function useNGO(): NGOContextType {
  const ctx = useContext(NGOContext);
  if (!ctx) throw new Error('useNGO must be used within NGOPlatformProvider');
  return ctx;
}
