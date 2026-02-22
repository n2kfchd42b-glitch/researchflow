import React from 'react';
import { useNavigate } from 'react-router-dom';

const cards = [
  { role: 'Student Researcher', sub: 'Guided analysis wizard', desc: 'Step-by-step methodology guidance. Upload your data, we guide every decision. Learn while you analyse.', btn: 'Start Analysis', path: '/student', color: '#C0533A', bg: '#fff5f3' },
  { role: 'NGO & Programme Evaluator', sub: 'Full evaluation pipeline', desc: 'From raw data to donor-ready evaluation report. Automated, verified, and reproducible.', btn: 'Run Evaluation', path: '/ngo', color: '#5A8A6A', bg: '#f3faf5' },
  { role: 'Journal & Peer Reviewer', sub: 'Verification portal', desc: 'Verify statistical integrity of submitted research. CONSORT and STROBE compliant automated checking.', btn: 'Verify Submission', path: '/journal', color: '#1C2B3A', bg: '#f0f4f8' },
];

const steps = [
  { n: '1', label: 'Upload Data', desc: 'CSV, Excel, SPSS, Stata' },
  { n: '2', label: 'Configure Study', desc: 'Design and population' },
  { n: '3', label: 'Engine Analyses', desc: 'Stats, assumptions, rigor' },
  { n: '4', label: 'Verified Output', desc: 'Report ready to share' },
];

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="page">
      <div style={{ textAlign: 'center', padding: '3rem 0 2rem' }}>
        <h1 style={{ fontSize: '2.2rem', color: '#1C2B3A' }}>
          Research you can trust.
        </h1>
        <p style={{ fontSize: '1.1rem', maxWidth: 560, margin: '0 auto' }}>
          ResearchFlow automates the entire health research analytics
          pipeline — from raw data to verified, reproducible output.
        </p>
      </div>

      <div className="grid-3" style={{ marginBottom: '3rem' }}>
        {cards.map(c => (
          <div key={c.role} className="card" style={{ borderTop: `4px solid ${c.color}`, background: c.bg }}>
            <h2 style={{ color: c.color }}>{c.role}</h2>
            <p style={{ fontSize: '0.85rem', color: c.color, fontWeight: 600, marginBottom: '0.5rem' }}>{c.sub}</p>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>{c.desc}</p>
            <button className="btn btn-full" style={{ background: c.color, color: 'white' }} onClick={() => navigate(c.path)}>
              {c.btn}
            </button>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>How It Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#C0533A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700, margin: '0 auto 0.75rem' }}>{s.n}</div>
              <h3>{s.label}</h3>
              <p style={{ fontSize: '0.85rem' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '2rem', color: '#888', fontSize: '0.85rem' }}>
        Built for global health research · Idea stage · February 2026
      </div>
    </div>
  );
}