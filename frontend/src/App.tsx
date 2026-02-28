import React, { useState, useEffect } from 'react';
import { ProjectProvider } from './context/ProjectContext';
import './mobile.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layouts
import StudentLayout from './layouts/StudentLayout';
import NGOLayout from './layouts/NGOLayout';
import JournalLayout from './layouts/JournalLayout';

// Pages
import ProductLanding from './pages/ProductLanding';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentWizard from './pages/StudentWizard';
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
import AuditTrail from './pages/AuditTrail';
import DataCleaningStudio from './pages/DataCleaningStudio';
import GuidedAnalysis from './pages/GuidedAnalysis';
import JournalAssistant from './pages/JournalAssistant';
import InstrumentRecognition from './pages/InstrumentRecognition';
import PropensityMatching from './pages/PropensityMatching';
import DescriptiveStats from './pages/DescriptiveStats';
import VisualisationStudio from './pages/VisualisationStudio';
import Collaboration from './pages/Collaboration';
import ForestPlot from './pages/ForestPlot';
import SampleDatasets from './pages/SampleDatasets';
import SyntaxExporter from './pages/SyntaxExporter';
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
import InterruptedTimeSeries from './pages/analytics/InterruptedTimeSeries';
import DifferenceInDifferences from './pages/analytics/DifferenceInDifferences';
import MixedEffects from './pages/analytics/MixedEffects';
import SpatialAnalysis from './pages/analytics/SpatialAnalysis';
import NetworkMetaAnalysis from './pages/analytics/NetworkMetaAnalysis';

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
    <ProjectProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing / Product Selector */}
          <Route path="/" element={<ProductLanding />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />

          {/* Student Wizard — sidebar layout */}
          <Route path="/student" element={<StudentLayout user={user} onLogout={handleLogout} />}>
            <Route index element={<StudentWizard />} />
            <Route path="setup"       element={<StudentWizard />} />
            <Route path="upload"      element={<DataCleaningStudio />} />
            <Route path="analysis"    element={<GuidedAnalysis />} />
            <Route path="results"     element={<Dashboard user={user} />} />
            <Route path="report"      element={<SyntaxExporter />} />
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

          {/* NGO Platform — sidebar layout */}
          <Route path="/ngo" element={<NGOLayout user={user} onLogout={handleLogout} />}>
            <Route index element={<NGOPipeline />} />
            <Route path="projects"  element={<StudyDashboard />} />
            <Route path="forms"     element={<InstrumentRecognition />} />
            <Route path="clean"     element={<DataCleaningStudio />} />
            <Route path="versioning" element={<DataVersioning />} />
            <Route path="budget"    element={<BudgetTracker />} />
            <Route path="ethics"    element={<ProgressTracker />} />
            <Route path="analysis/survival"     element={<SurvivalAnalysis />} />
            <Route path="analysis/psm"          element={<PropensityMatching />} />
            <Route path="analysis/subgroup"     element={<SubgroupAnalysis />} />
            <Route path="analysis/sensitivity"  element={<SensitivityAnalysis />} />
            <Route path="analysis/meta"         element={<ForestPlot />} />
            <Route path="analysis/its"          element={<InterruptedTimeSeries />} />
            <Route path="analysis/did"          element={<DifferenceInDifferences />} />
            <Route path="analysis/mixed"        element={<MixedEffects />} />
            <Route path="analysis/spatial"      element={<SpatialAnalysis />} />
            <Route path="analysis/network-meta" element={<NetworkMetaAnalysis />} />
            <Route path="prisma"    element={<PRISMADiagram />} />
            <Route path="reports"   element={<SyntaxExporter />} />
            <Route path="studies"   element={<StudyDashboard />} />
            <Route path="dictionary" element={<DataDictionary />} />
            <Route path="cohort"    element={<CohortBuilder />} />
          </Route>

          {/* Journal Component — sidebar layout */}
          <Route path="/journal" element={<JournalLayout user={user} onLogout={handleLogout} />}>
            <Route index        element={<JournalVerification />} />
            <Route path="submissions" element={<JournalAssistant />} />
            <Route path="verify"      element={<JournalVerification />} />
            <Route path="rob"         element={<RiskOfBias />} />
            <Route path="audit"       element={<AuditTrail user={user} />} />
            <Route path="reports"     element={<JournalAssistant />} />
          </Route>

          {/* Shared / utility routes */}
          <Route path="/landing"      element={<Landing user={user} />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/collaborate"  element={<Collaboration user={user} />} />
          <Route path="/methodology"  element={<MethodologyMemory user={user} />} />
        </Routes>
      </ProjectProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
