import React, { useState, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './mobile.css';

// ─── Auth ─────────────────────────────────────────────────────────────────────
import Login from './pages/Login';

// ─── Landing Page ─────────────────────────────────────────────────────────────
import LandingPage from './pages/LandingPage';

// ─── Product Landing ──────────────────────────────────────────────────────────
// import ProductLanding from './pages/ProductLanding';

// ─── Layouts ──────────────────────────────────────────────────────────────────
import StudentLayout from './layouts/StudentLayout';
import NGOLayout from './layouts/NGOLayout';
// import JournalLayout from './layouts/JournalLayout'; // blanked out

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
// Journal pages blanked out
// import JournalVerification from './pages/JournalVerification';
// import JournalAssistant from './pages/JournalAssistant';
// import RiskOfBias from './pages/RiskOfBias';
// import AuditTrail from './pages/AuditTrail';

// ─── NGO-specific pages ───────────────────────────────────────────────────────
import StudyDashboard from './pages/StudyDashboard';
import DataVersioning from './pages/DataVersioning';
import { ProjectProvider } from './context/ProjectContext';
import { WorkflowProvider } from './context/WorkflowContext';
import { StudentWizardProvider } from './products/student/context/StudentWizardContext';
import { NGOPlatformProvider } from './products/ngo/context/NGOPlatformContext';
// import { JournalProvider } from './products/journal/context/JournalContext'; // blanked out

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
  // Login bypassed – default user grants direct access to the platform
  const [user,  setUser]  = useState<any>({ id: 'guest', name: 'Guest User', email: 'guest@researchflow.app' });

  async function handleLogout() {
    // no-op when login is blanked out
  }

  return (
    <ErrorBoundary>
    <BrowserRouter>
      <WorkflowProvider>
      <ProjectProvider>
        <Routes>
          {/* ── Landing / Product Hub ── */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login onLogin={setUser} />} />

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
            <Route path="versioning"  element={<DataVersioning />} />
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

          {/* ── Journal Component (blanked out — coming soon) ── */}
          <Route path="/journal" element={
            <div style={{ minHeight: '100vh', background: '#1C2B3A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', maxWidth: 480, padding: '2rem' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(125,60,152,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <span style={{ fontSize: 28 }}>📖</span>
                </div>
                <h1 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.75rem' }}>Journal Verification</h1>
                <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.6, margin: '0 0 2rem' }}>
                  The Journal Verification platform is currently being rebuilt with improved components. Check back soon.
                </p>
                <a href="/" style={{ display: 'inline-block', padding: '0.65rem 1.75rem', background: '#7D3C98', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                  ← Back to ResearchFlow
                </a>
              </div>
            </div>
          } />

          {/* ── Shared utility routes ── */}
          <Route path="/ai-assistant"  element={<AIAssistant />} />
          <Route path="/collaborate"   element={<Collaboration user={user} />} />
          <Route path="/methodology"   element={<MethodologyMemory user={user} />} />
        </Routes>
      </ProjectProvider>
      </WorkflowProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
