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
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentWizard from './pages/StudentWizard';
import NGOPipeline from './pages/NGOPipeline';
import JournalVerification from './pages/JournalVerification';
import MethodologyMemory from './pages/MethodologyMemory';
import CohortBuilder from './pages/CohortBuilder';
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
import StudyDashboard from './pages/StudyDashboard';
import RiskOfBias from './pages/RiskOfBias';
import DataDictionary from './pages/DataDictionary';
import SubgroupAnalysis from './pages/SubgroupAnalysis';
import SensitivityAnalysis from './pages/SensitivityAnalysis';
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
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/collaborate"  element={<Collaboration user={user} />} />
          <Route path="/methodology"  element={<MethodologyMemory user={user} />} />
        </Routes>
      </BrowserRouter>
    </ProjectProvider>
  );
}
