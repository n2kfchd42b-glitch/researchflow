import React, { useState, useEffect } from 'react';
import { ProjectProvider } from './context/ProjectContext';
import ProjectSelector from './components/ProjectSelector';
import './mobile.css';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Landing from './pages/Landing';
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
import Login from './pages/Login';
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
import Dashboard from './pages/Dashboard';
import InterruptedTimeSeries from "./pages/analytics/InterruptedTimeSeries";
import DifferenceInDifferences from "./pages/analytics/DifferenceInDifferences";
import MixedEffects from "./pages/analytics/MixedEffects";
import SpatialAnalysis from "./pages/analytics/SpatialAnalysis";
import NetworkMetaAnalysis from "./pages/analytics/NetworkMetaAnalysis";

function NavBar({ user, onLogout }: { user: any, onLogout: () => void }) {
  const links = [
    { to: "/student",     label: "Student" },
    { to: "/ngo",         label: "NGO" },
    { to: "/journal",     label: "Journal" },
    { to: "/methodology", label: "Methodology" },
    { to: "/cohort",      label: "Cohort" },
    { to: "/survival",    label: "Survival" },
    { to: "/samplesize",  label: "Sample Size" },
    { to: "/audit",       label: "Audit" },
    { to: "/clean",       label: "Clean Data" },
    { to: "/guided",      label: "Guided" },
    { to: "/journal-assistant", label: "Journal" },
    { to: "/instrument", label: "Instruments" },
    { to: "/psm", label: "PSM" },
        { to: "/descriptive", label: "Descriptive" },
        { to: "/visualise", label: "Visualise" },
        { to: "/collaborate", label: "Collaborate" },
        { to: "/forest-plot", label: "Forest Plot" },
        { to: "/samples", label: "Samples" },
        { to: "/ai-assistant", label: "AI Assistant" },
        { to: "/progress", label: "Progress" },
        { to: "/literature", label: "Literature" },
        { to: "/codebook", label: "Codebook" },
        { to: "/versioning", label: "Versioning" },
        { to: "/syntax", label: "Syntax" },
        { to: "/prisma", label: "PRISMA" },
        { to: "/studies", label: "Studies" },
        { to: "/rob", label: "Risk of Bias" },
        { to: "/dictionary", label: "Dictionary" },
        { to: "/subgroup", label: "Subgroup" },
        { to: "/sensitivity", label: "Sensitivity" },
        { to: "/budget", label: "Budget" },
        { to: "/table1", label: "Table 1" },
    // Advanced Analytics group
    { to: "#", label: "---Advanced Analytics---", groupLabel: true },
    { to: "/its", label: "Interrupted Time Series" },
    { to: "/did", label: "Difference-in-Differences" },
    { to: "/mixed-effects", label: "Mixed Effects" },
    { to: "/spatial", label: "Spatial Analysis" },
    { to: "/network-meta", label: "Network Meta-Analysis" },
  ];
  return (
    <nav style={{
      background: "#1C2B3A", padding: "0.5rem 1.5rem",
      display: "flex", alignItems: "center",
      justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem"
    }}>
      <Link to="/" style={{ color: "#C0533A", fontWeight: 700, fontSize: "1.2rem", textDecoration: "none" }}>
        ResearchFlow
      </Link>
      <ProjectSelector />
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        {links.map(l => l.groupLabel ? (
          <div key={l.label} style={{ color: "#aaa", fontWeight: 700, margin: "0 0.5rem" }}>{l.label.replace(/-/g, " ")}</div>
        ) : (
          <Link key={l.to} to={l.to} style={{
            color: "white", textDecoration: "none", fontSize: "0.82rem",
            background: "rgba(255,255,255,0.12)", padding: "0.3rem 0.65rem", borderRadius: 4
          }}>
            {l.label}
          </Link>
        ))}
        <span style={{ color: "#aaa", fontSize: "0.8rem", marginLeft: "0.5rem" }}>{user.name}</span>
        <button onClick={onLogout} style={{
          background: "transparent", border: "1px solid #555",
          color: "#aaa", padding: "0.3rem 0.8rem", borderRadius: 4,
          cursor: "pointer", fontSize: "0.8rem"
        }}>
          Sign Out
        </button>
      </div>
    </nav>
  );
}


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
        <NavBar user={user} onLogout={handleLogout} />
        <Routes>
          <Route path="/"        element={<Dashboard user={user} />} />
          <Route path="/student" element={<StudentWizard />} />
          <Route path="/ngo"     element={<NGOPipeline />} />
          <Route path="/journal" element={<JournalVerification />} />
          <Route path="/methodology" element={<MethodologyMemory user={user} />} />
          <Route path="/cohort" element={<CohortBuilder />} />
          <Route path="/survival" element={<SurvivalAnalysis />} />
          <Route path="/samplesize" element={<SampleSize />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/progress" element={<ProgressTracker />} />
          <Route path="/literature" element={<LiteratureReview />} />
          <Route path="/codebook" element={<CodebookGenerator />} />
          <Route path="/versioning" element={<DataVersioning />} />
          <Route path="/syntax" element={<SyntaxExporter />} />
          <Route path="/prisma" element={<PRISMADiagram />} />
          <Route path="/studies" element={<StudyDashboard />} />
          <Route path="/rob" element={<RiskOfBias />} />
          <Route path="/dictionary" element={<DataDictionary />} />
          <Route path="/subgroup" element={<SubgroupAnalysis />} />
          <Route path="/sensitivity" element={<SensitivityAnalysis />} />
          <Route path="/sensitivity" element={<SensitivityAnalysis />} />
          <Route path="/table1" element={<Table1Generator />} />
          <Route path="/audit" element={<AuditTrail user={user} />} />
          <Route path="/clean" element={<DataCleaningStudio />} />
          <Route path="/guided" element={<GuidedAnalysis />} />
          <Route path="/journal-assistant" element={<JournalAssistant />} />
          <Route path="/instrument" element={<InstrumentRecognition />} />
          <Route path="/psm" element={<PropensityMatching />} />
          <Route path="/descriptive" element={<DescriptiveStats />} />
          <Route path="/visualise" element={<VisualisationStudio />} />
          <Route path="/collaborate" element={<Collaboration user={user} />} />
          <Route path="/forest-plot" element={<ForestPlot />} />
          <Route path="/samples" element={<SampleDatasets />} />
          <Route path="/its" element={<InterruptedTimeSeries />} />
          <Route path="/did" element={<DifferenceInDifferences />} />
          <Route path="/mixed-effects" element={<MixedEffects />} />
          <Route path="/spatial" element={<SpatialAnalysis />} />
          <Route path="/network-meta" element={<NetworkMetaAnalysis />} />
        </Routes>
      </BrowserRouter>
    </ProjectProvider>
  );
}
