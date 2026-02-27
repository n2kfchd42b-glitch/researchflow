import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import './mobile.css';

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
import JournalVerification from './pages/JournalVerification';
import JournalAssistant from './pages/JournalAssistant';
import RiskOfBias from './pages/RiskOfBias';
import AuditTrail from './pages/AuditTrail';
import MethodologyMemory from './pages/MethodologyMemory';
import Collaboration from './pages/Collaboration';
import AIAssistant from './pages/AIAssistant';

// Shared analysis tools (used in both Student and NGO)
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

// NGO-specific pages
import StudyDashboard from './pages/StudyDashboard';
import InstrumentRecognition from './pages/InstrumentRecognition';
import DataCleaningStudio from './pages/DataCleaningStudio';
import DataVersioning from './pages/DataVersioning';
import BudgetTracker from './pages/BudgetTracker';
import ProgressTracker from './pages/ProgressTracker';
import DataDictionary from './pages/DataDictionary';
import CohortBuilder from './pages/CohortBuilder';
import SyntaxExporter from './pages/SyntaxExporter';

// Advanced analytics
import InterruptedTimeSeries from './pages/analytics/InterruptedTimeSeries';
import DifferenceInDifferences from './pages/analytics/DifferenceInDifferences';
import MixedEffects from './pages/analytics/MixedEffects';
import SpatialAnalysis from './pages/analytics/SpatialAnalysis';
import NetworkMetaAnalysis from './pages/analytics/NetworkMetaAnalysis';


// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser]   = useState<any>(null);
  const [token, setToken] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedUser  = localStorage.getItem('rf_user');
    const savedToken = localStorage.getItem('rf_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    setReady(true);
  }, []);

  function handleLogin(userData: any, userToken: string) {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('rf_user', JSON.stringify(userData));
    localStorage.setItem('rf_token', userToken);
  }

  function handleLogout() {
    setUser(null);
    setToken('');
    localStorage.removeItem('rf_user');
    localStorage.removeItem('rf_token');
  }

  if (!ready) return null;

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
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
  );
}
