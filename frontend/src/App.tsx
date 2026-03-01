import React, { useState, useEffect, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './mobile.css';
import { API_URL } from './config';

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
import MethodologyMemory from './pages/MethodologyMemory';
import Collaboration from './pages/Collaboration';
import AIAssistant from './pages/AIAssistant';

// ─── Journal Component Pages ──────────────────────────────────────────────────

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

// ─── Analytics pages ──────────────────────────────────────────────────────────
import InterruptedTimeSeries from './pages/analytics/InterruptedTimeSeries';
import DifferenceInDifferences from './pages/analytics/DifferenceInDifferences';
import MixedEffects from './pages/analytics/MixedEffects';
import SpatialAnalysis from './pages/analytics/SpatialAnalysis';
import NetworkMetaAnalysis from './pages/analytics/NetworkMetaAnalysis';

// ─── Other missing pages ──────────────────────────────────────────────────────
import SyntaxExporter from './pages/SyntaxExporter';
import DataDictionary from './pages/DataDictionary';
import CohortBuilder from './pages/CohortBuilder';
import JournalVerification from './pages/JournalVerification';
import JournalAssistant from './pages/JournalAssistant';
import RiskOfBias from './pages/RiskOfBias';
import AuditTrail from './pages/AuditTrail';

// ─── NGO-specific pages ───────────────────────────────────────────────────────
import StudyDashboard from './pages/StudyDashboard';
import DataVersioning from './pages/DataVersioning';
import { ProjectProvider } from './context/ProjectContext';
import { StudentWizardProvider } from './products/student/context/StudentWizardContext';
import { NGOPlatformProvider } from './products/ngo/context/NGOPlatformContext';
import { JournalProvider } from './products/journal/context/JournalContext';

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
          <Route path="/student" element={<StudentWizardProvider><StudentLayout user={user} onLogout={handleLogout} /></StudentWizardProvider>}>
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
          <Route path="/ngo" element={<NGOPlatformProvider><NGOLayout user={user} onLogout={handleLogout} /></NGOPlatformProvider>}>
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
          <Route path="/journal" element={<JournalProvider><JournalLayout user={user} onLogout={handleLogout} /></JournalProvider>}>
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
