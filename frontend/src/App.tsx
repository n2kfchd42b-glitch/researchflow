import React, { useState, useEffect, useRef } from 'react';
import './mobile.css';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('App error:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', background: '#1C2B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ color: '#fff', maxWidth: 600, textAlign: 'center' }}>
            <h2 style={{ color: '#C0533A', marginBottom: '1rem' }}>Something went wrong</h2>
            <pre style={{ background: '#0d1b2a', padding: '1rem', borderRadius: 8, textAlign: 'left', fontSize: 13, overflowX: 'auto', color: '#f87171' }}>
              {(this.state.error as Error).message}
            </pre>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }}
              style={{ marginTop: '1.5rem', padding: '0.6rem 1.5rem', background: '#C0533A', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              Clear session &amp; reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
import Login from './pages/Login';

// ─── Product Landing ──────────────────────────────────────────────────────────
import ProductLanding from './pages/ProductLanding';

// ─── Layouts ──────────────────────────────────────────────────────────────────
import StudentLayout from './layouts/StudentLayout';
import NGOLayout from './layouts/NGOLayout';
import JournalLayout from './layouts/JournalLayout';

// ─── Student Wizard Pages (5-step flow) ───────────────────────────────────────
import StudySetupPage from './products/student/pages/StudySetupPage';
import DataUploadPage from './products/student/pages/DataUploadPage';
import GuidedAnalysisPage from './products/student/pages/GuidedAnalysisPage';
import ResultsReviewPage from './products/student/pages/ResultsReviewPage';
import ReportGenerationPage from './products/student/pages/ReportGenerationPage';

// ─── NGO Platform Pages ───────────────────────────────────────────────────────
import NGODashboardPage from './products/ngo/pages/NGODashboardPage';
import ProjectWorkspacePage from './products/ngo/pages/ProjectWorkspacePage';
import FieldFormBuilderPage from './products/ngo/pages/FieldFormBuilderPage';
import DataManagementPage from './products/ngo/pages/DataManagementPage';
import BudgetTrackerPage from './products/ngo/pages/BudgetTrackerPage';
import EthicsTrackerPage from './products/ngo/pages/EthicsTrackerPage';
import AnalysisSuitePage from './products/ngo/pages/AnalysisSuitePage';
import StudyMonitoringPage from './products/ngo/pages/StudyMonitoringPage';

// ─── Existing page components (all preserved) ─────────────────────────────────
import NGOPipeline from './pages/NGOPipeline';
import MethodologyMemory from './pages/MethodologyMemory';
import Collaboration from './pages/Collaboration';
import AIAssistant from './pages/AIAssistant';

// ─── Journal Component Pages ──────────────────────────────────────────────────
import { JournalProvider } from './products/journal/context/JournalContext';
import JournalDashboardPage from './products/journal/pages/JournalDashboardPage';
import SubmissionIntakePage from './products/journal/pages/SubmissionIntakePage';
import SubmissionReviewPage from './products/journal/pages/SubmissionReviewPage';
import BatchVerificationPage from './products/journal/pages/BatchVerificationPage';
import JournalSettingsPage from './products/journal/pages/JournalSettingsPage';

// ─── Shared analysis tools (used in both Student and NGO) ────────────────────
import Table1Generator from './pages/Table1Generator';
import DescriptiveStats from './pages/DescriptiveStats';
import SurvivalAnalysis from './pages/SurvivalAnalysis';
import SampleSize from './pages/SampleSize';
import CodebookGenerator from './pages/CodebookGenerator';
import LiteratureReview from './pages/LiteratureReview';
import PRISMADiagram from './pages/PRISMADiagram';
import SubgroupAnalysis from './pages/SubgroupAnalysis';
import SensitivityAnalysis from './pages/SensitivityAnalysis';
import ForestPlot from './pages/ForestPlot';
import VisualisationStudio from './pages/VisualisationStudio';
import SampleDatasets from './pages/SampleDatasets';
import PropensityMatching from './pages/PropensityMatching';

// ─── NGO-specific pages ───────────────────────────────────────────────────────
import StudyDashboard from './pages/StudyDashboard';
import InstrumentRecognition from './pages/InstrumentRecognition';
import DataCleaningStudio from './pages/DataCleaningStudio';
import DataVersioning from './pages/DataVersioning';
import BudgetTracker from './pages/BudgetTracker';
import Table1Generator from './pages/Table1Generator';
import AIAssistant from './pages/AIAssistant';
import ProgressTracker from './pages/ProgressTracker';
import LiteratureReview from './pages/LiteratureReview';
import CodebookGenerator from './pages/CodebookGenerator';
import DataVersioning from './pages/DataVersioning';
import Dashboard from './pages/Dashboard';

const NAV_LINKS = [
  { to: "/student",           label: "Student" },
  { to: "/ngo",               label: "NGO" },
  { to: "/journal",           label: "Journal" },
  { to: "/methodology",       label: "Methodology" },
  { to: "/cohort",            label: "Cohort" },
  { to: "/survival",          label: "Survival" },
  { to: "/samplesize",        label: "Sample Size" },
  { to: "/audit",             label: "Audit" },
  { to: "/clean",             label: "Clean Data" },
  { to: "/guided",            label: "Guided" },
  { to: "/journal-assistant", label: "J. Assistant" },
  { to: "/instrument",        label: "Instruments" },
  { to: "/psm",               label: "PSM" },
  { to: "/descriptive",       label: "Descriptive" },
  { to: "/visualise",         label: "Visualise" },
  { to: "/collaborate",       label: "Collaborate" },
  { to: "/forest-plot",       label: "Forest Plot" },
  { to: "/samples",           label: "Samples" },
  { to: "/ai-assistant",      label: "AI Assistant" },
  { to: "/progress",          label: "Progress" },
  { to: "/literature",        label: "Literature" },
  { to: "/codebook",          label: "Codebook" },
  { to: "/versioning",        label: "Versioning" },
  { to: "/syntax",            label: "Syntax" },
  { to: "/prisma",            label: "PRISMA" },
  { to: "/studies",           label: "Studies" },
  { to: "/rob",               label: "Risk of Bias" },
  { to: "/dictionary",        label: "Dictionary" },
  { to: "/subgroup",          label: "Subgroup" },
  { to: "/sensitivity",       label: "Sensitivity" },
  { to: "/budget",            label: "Budget" },
  { to: "/table1",            label: "Table 1" },
];

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

const ROLE_ICONS: Record<string, string> = { student: '🎓', ngo: '🌍', journal: '📄' };

// ── Profile modal ─────────────────────────────────────────────────────────────

function ProfileModal({
  user,
  onClose,
  onSave,
}: {
  user: any;
  onClose: () => void;
  onSave: (updated: any) => void;
}) {
  const [name,        setName]        = useState(user.name        || '');
  const [institution, setInstitution] = useState(user.institution || '');
  const [country,     setCountry]     = useState(user.country     || '');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);

  async function handleSave() {
    setSaving(true); setError(''); setSuccess(false);
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method:      'PUT',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ name, institution, country }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || 'Save failed');
      }
      const updated = await res.json();
      onSave(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.85rem', borderRadius: 7,
    border: '1.5px solid #ddd', fontSize: '0.9rem',
  };
  const lbl: React.CSSProperties = {
    fontSize: '0.78rem', fontWeight: 700, color: '#888', display: 'block', marginBottom: 5,
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.55)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 14, padding: '2rem', width: 420, maxWidth: '95vw',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>

        {/* Avatar + header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: '#C0533A', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', fontWeight: 700, flexShrink: 0,
          }}>
            {user.name ? user.name[0].toUpperCase() : '?'}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Your Profile</h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#888' }}>{user.email}</p>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: '#aaa', lineHeight: 1 }}>×</button>
        </div>

        {/* Read-only role badge */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={lbl}>ROLE</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>{ROLE_ICONS[user.role] || '👤'}</span>
            <span style={{
              padding: '0.3rem 0.85rem', borderRadius: 20,
              background: '#f5f0ff', color: '#7c3aed',
              fontWeight: 700, fontSize: '0.85rem', textTransform: 'capitalize',
            }}>{user.role}</span>
            <span style={{ fontSize: '0.75rem', color: '#bbb' }}>(cannot change)</span>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fff5f5', border: '1px solid #fcc', borderRadius: 7, padding: '0.6rem 0.85rem', marginBottom: '1rem', fontSize: '0.82rem', color: '#c00' }}>
            ⚠ {error}
          </div>
        )}
        {success && (
          <div style={{ background: '#f0fff4', border: '1px solid #b2dfdb', borderRadius: 7, padding: '0.6rem 0.85rem', marginBottom: '1rem', fontSize: '0.82rem', color: '#2e7d32', fontWeight: 600 }}>
            ✓ Profile saved!
          </div>
        )}

        {[
          { label: 'FULL NAME',    value: name,        set: setName,        placeholder: 'Your full name'    },
          { label: 'INSTITUTION',  value: institution,  set: setInstitution, placeholder: 'University / NGO'  },
          { label: 'COUNTRY',      value: country,      set: setCountry,     placeholder: 'e.g. Kenya'        },
        ].map(field => (
          <div key={field.label} style={{ marginBottom: '0.85rem' }}>
            <label style={lbl}>{field.label}</label>
            <input value={field.value} onChange={e => field.set(e.target.value)}
              placeholder={field.placeholder} style={inp} />
          </div>
        ))}

        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem' }}>
          <button onClick={handleSave} disabled={saving || !name.trim()} style={{
            flex: 1, padding: '0.75rem', borderRadius: 8,
            background: '#C0533A', color: 'white', border: 'none',
            fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
            opacity: (!name.trim() || saving) ? 0.6 : 1,
          }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button onClick={onClose} style={{
            padding: '0.75rem 1rem', borderRadius: 8,
            background: '#eee', color: '#555', border: 'none',
            fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── NavBar ────────────────────────────────────────────────────────────────────

function NavBar({
  user,
  onLogout,
  onProfileUpdate,
}: {
  user: any;
  onLogout: () => void;
  onProfileUpdate: (u: any) => void;
}) {
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [dropOpen,    setDropOpen]    = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initials = user.name ? user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : '?';

  return (
    <>
      <nav className="navbar" style={{
        background: "#1C2B3A",
        padding: "0.5rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.5rem",
        position: "relative",
      }}>
        {/* Logo + Hamburger row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "nowrap" }}>
          <Link to="/" style={{ color: "#C0533A", fontWeight: 700, fontSize: "1.2rem", textDecoration: "none" }}>
            ResearchFlow
          </Link>

          {/* Desktop links */}
          <div className="navbar-links" style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
            {NAV_LINKS.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} style={{
                color: "white", textDecoration: "none", fontSize: "0.78rem",
                background: "rgba(255,255,255,0.12)", padding: "0.3rem 0.55rem", borderRadius: 4,
                whiteSpace: "nowrap",
              }}>
                {l.label}
              </Link>
            ))}

            {/* User avatar dropdown */}
            <div ref={dropRef} style={{ position: 'relative', marginLeft: '0.25rem' }}>
              <button
                onClick={() => setDropOpen(o => !o)}
                title={`${user.name} · ${user.role}`}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#C0533A', color: 'white',
                  border: 'none', cursor: 'pointer',
                  fontSize: '0.75rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {initials}
              </button>

              {dropOpen && (
                <div style={{
                  position: 'absolute', top: '110%', right: 0, zIndex: 900,
                  background: 'white', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                  minWidth: 220, padding: '0.5rem 0',
                }}>
                  {/* User info */}
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f0f0f0' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#1C2B3A' }}>{user.name}</p>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#888' }}>{user.email}</p>
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', background: '#f5f0ff', color: '#7c3aed', borderRadius: 10, padding: '0.1rem 0.5rem', fontWeight: 700, textTransform: 'capitalize' }}>
                        {ROLE_ICONS[user.role] || '👤'} {user.role}
                      </span>
                      {user.institution && (
                        <span style={{ fontSize: '0.72rem', background: '#f0f8ff', color: '#2196f3', borderRadius: 10, padding: '0.1rem 0.5rem' }}>
                          🏛 {user.institution}
                        </span>
                      )}
                      {user.country && (
                        <span style={{ fontSize: '0.72rem', background: '#f0fff4', color: '#2e7d32', borderRadius: 10, padding: '0.1rem 0.5rem' }}>
                          📍 {user.country}
                        </span>
                      )}
                    </div>
                  </div>

                  <button onClick={() => { setDropOpen(false); setShowProfile(true); }} style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '0.6rem 1rem', background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: '0.88rem', color: '#333',
                  }}>
                    ✏️ Edit Profile
                  </button>
                  <button onClick={() => { setDropOpen(false); onLogout(); }} style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '0.6rem 1rem', background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: '0.88rem', color: '#f44336',
                  }}>
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Hamburger button */}
          <button
            className="hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
            style={{
              display: "none", flexDirection: "column", gap: 5,
              background: "transparent", border: "none", cursor: "pointer", padding: "0.4rem",
            }}
          >
            {[0, 1, 2].map(i => (
              <span key={i} style={{ display: "block", width: 22, height: 2, background: menuOpen ? "#C0533A" : "white", borderRadius: 2 }} />
            ))}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="navbar-links open" style={{
            display: "flex", flexDirection: "column", width: "100%",
            padding: "0.75rem 0", gap: "0.25rem",
            borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: "0.5rem",
          }}>
            {NAV_LINKS.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} style={{
                color: "white", textDecoration: "none", fontSize: "0.9rem",
                padding: "0.6rem 0.75rem", borderRadius: 6,
                background: "rgba(255,255,255,0.06)",
              }}>
                {l.label}
              </Link>
            ))}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: "0.5rem", paddingTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
              <button onClick={() => { setMenuOpen(false); setShowProfile(true); }} style={{
                flex: 1, background: "rgba(255,255,255,0.1)", border: "none",
                color: "white", padding: "0.4rem 0.8rem", borderRadius: 4,
                cursor: "pointer", fontSize: "0.85rem",
              }}>
                ✏️ Profile
              </button>
              <button onClick={() => { setMenuOpen(false); onLogout(); }} style={{
                flex: 1, background: "transparent", border: "1px solid #555",
                color: "#aaa", padding: "0.4rem 0.8rem", borderRadius: 4,
                cursor: "pointer", fontSize: "0.85rem",
              }}>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onSave={updated => { onProfileUpdate(updated); setShowProfile(false); }}
        />
      )}
    </>
  );
}


export default function App() {
  const [user,  setUser]  = useState<any>(null);
  const [ready, setReady] = useState(false);

  // On mount: restore session from httpOnly cookie via /auth/me
  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(u  => { if (u) setUser(u); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  async function handleLogout() {
    await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    setUser(null);
  }

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', background: '#1C2B3A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#C0533A', fontSize: '1.2rem', fontWeight: 700 }}>ResearchFlow…</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <ErrorBoundary>
    <BrowserRouter>
      <ProjectProvider>
        <Routes>
          {/* ── Product Landing ── */}
          <Route path="/" element={<ProductLanding />} />

          {/* ── Student Wizard ── */}
          <Route path="/student" element={<StudentLayout user={user} onLogout={handleLogout} />}>
            <Route index element={<StudySetupPage />} />
            <Route path="setup"       element={<StudySetupPage />} />
            <Route path="upload"      element={<DataUploadPage />} />
            <Route path="analysis"    element={<GuidedAnalysisPage />} />
            <Route path="results"     element={<ResultsReviewPage />} />
            <Route path="report"      element={<ReportGenerationPage />} />
            {/* Existing tools accessible within Student Wizard */}
            <Route path="table1"      element={<Table1Generator />} />
            <Route path="descriptive" element={<DescriptiveStats />} />
            <Route path="survival"    element={<SurvivalAnalysis />} />
            <Route path="samplesize"  element={<SampleSize />} />
            <Route path="codebook"    element={<CodebookGenerator />} />
            <Route path="literature"  element={<LiteratureReview />} />
            <Route path="prisma"      element={<PRISMADiagram />} />
            <Route path="subgroup"    element={<SubgroupAnalysis />} />
            <Route path="sensitivity" element={<SensitivityAnalysis />} />
            <Route path="forest-plot" element={<ForestPlot />} />
            <Route path="visualise"   element={<VisualisationStudio />} />
            <Route path="samples"     element={<SampleDatasets />} />
          </Route>

          {/* ── NGO Platform ── */}
          <Route path="/ngo" element={<NGOLayout user={user} onLogout={handleLogout} />}>
            <Route index                       element={<NGODashboardPage />} />
            <Route path="project/:id"          element={<ProjectWorkspacePage />} />
            <Route path="projects"             element={<StudyDashboard />} />
            <Route path="forms"                element={<FieldFormBuilderPage />} />
            <Route path="clean"                element={<DataManagementPage />} />
            <Route path="versioning"           element={<DataVersioning />} />
            <Route path="budget"               element={<BudgetTrackerPage />} />
            <Route path="ethics"               element={<EthicsTrackerPage />} />
            <Route path="monitoring"           element={<StudyMonitoringPage />} />
            <Route path="analysis"             element={<AnalysisSuitePage />} />
            <Route path="analysis/survival"    element={<SurvivalAnalysis />} />
            <Route path="analysis/psm"         element={<PropensityMatching />} />
            <Route path="analysis/subgroup"    element={<SubgroupAnalysis />} />
            <Route path="analysis/sensitivity" element={<SensitivityAnalysis />} />
            <Route path="analysis/meta"        element={<ForestPlot />} />
            <Route path="analysis/forest-plot" element={<ForestPlot />} />
            <Route path="analysis/its"         element={<InterruptedTimeSeries />} />
            <Route path="analysis/did"         element={<DifferenceInDifferences />} />
            <Route path="analysis/mixed"       element={<MixedEffects />} />
            <Route path="analysis/spatial"     element={<SpatialAnalysis />} />
            <Route path="analysis/network-meta" element={<NetworkMetaAnalysis />} />
            <Route path="prisma"               element={<PRISMADiagram />} />
            <Route path="reports"              element={<SyntaxExporter />} />
            <Route path="studies"              element={<StudyDashboard />} />
            <Route path="dictionary"           element={<DataDictionary />} />
            <Route path="cohort"               element={<CohortBuilder />} />
            <Route path="table1"               element={<Table1Generator />} />
            <Route path="descriptive"          element={<DescriptiveStats />} />
          </Route>

          {/* ── Journal Component ── */}
          <Route path="/journal" element={<JournalLayout user={user} onLogout={handleLogout} />}>
            <Route index               element={<JournalVerification />} />
            <Route path="submissions"  element={<JournalAssistant />} />
            <Route path="verify"       element={<JournalVerification />} />
            <Route path="rob"          element={<RiskOfBias />} />
            <Route path="audit"        element={<AuditTrail user={user} />} />
            <Route path="reports"      element={<JournalAssistant />} />
          </Route>

          {/* ── Shared utility routes ── */}
          <Route path="/ai-assistant"  element={<AIAssistant />} />
          <Route path="/collaborate"   element={<Collaboration user={user} />} />
          <Route path="/methodology"   element={<MethodologyMemory user={user} />} />
        </Routes>
      </ProjectProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
