import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Landing from './pages/Landing';
import StudentWizard from './pages/StudentWizard';
import NGOPipeline from './pages/NGOPipeline';
import JournalVerification from './pages/JournalVerification';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <Link to="/" className="navbar-brand">ResearchFlow</Link>
          <ul className="navbar-links">
            <li><Link to="/student">Student</Link></li>
            <li><Link to="/ngo">NGO</Link></li>
            <li><Link to="/journal">Journal</Link></li>
          </ul>
        </nav>
        <Routes>
          <Route path="/"        element={<Landing />} />
          <Route path="/student" element={<StudentWizard />} />
          <Route path="/ngo"     element={<NGOPipeline />} />
          <Route path="/journal" element={<JournalVerification />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
