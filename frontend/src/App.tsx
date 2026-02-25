import React, { useState, useEffect } from 'react';
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
import AIAssistant from './pages/AIAssistant';
import ProgressTracker from './pages/ProgressTracker';
import Dashboard from './pages/Dashboard';

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
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        {links.map(l => (
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
      </Routes>
    </BrowserRouter>
  );
}
