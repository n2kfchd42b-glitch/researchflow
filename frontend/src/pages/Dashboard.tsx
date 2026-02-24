import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8004';

const FEATURES = [
  {
    icon: '🎓', title: 'Student Wizard',       path: '/student',
    desc: 'Step-by-step guided analysis for students and early researchers.',
    color: '#C0533A', badge: 'Popular',
  },
  {
    icon: '🌍', title: 'NGO Pipeline',          path: '/ngo',
    desc: 'Rapid analysis pipeline for field data and programme evaluations.',
    color: '#5A8A6A', badge: 'Fast',
  },
  {
    icon: '📰', title: 'Journal Verification',  path: '/journal',
    desc: 'Verify submitted datasets and check statistical integrity.',
    color: '#1C2B3A', badge: 'Rigorous',
  },
  {
    icon: '📋', title: 'Protocol Intelligence', path: '/student',
    desc: 'Upload your study protocol — AI extracts objectives and variables.',
    color: '#9c27b0', badge: 'AI',
  },
  {
    icon: '🧹', title: 'Data Cleaning Studio',  path: '/clean',
    desc: 'Detect outliers, impute missing values, remove duplicates.',
    color: '#ff9800', badge: 'New',
  },
  {
    icon: '🔬', title: 'Guided Analysis',        path: '/guided',
    desc: 'AI recommends the right statistical test for your study.',
    color: '#2196f3', badge: 'AI',
  },
  {
    icon: '👥', title: 'Cohort Builder',         path: '/cohort',
    desc: 'Define inclusion/exclusion criteria and generate CONSORT diagrams.',
    color: '#00897b', badge: 'New',
  },
  {
    icon: '⏱️', title: 'Survival Analysis',      path: '/survival',
    desc: 'Kaplan-Meier curves and log-rank tests for time-to-event data.',
    color: '#e91e63', badge: 'New',
  },
  {
    icon: '🔢', title: 'Sample Size Calculator', path: '/samplesize',
    desc: 'Calculate required participants for four study designs.',
    color: '#3f51b5', badge: 'Tool',
  },
  {
    icon: '💾', title: 'Methodology Memory',     path: '/methodology',
    desc: 'Save and reuse study designs. Share with your team.',
    color: '#795548', badge: 'Team',
  },
  {
    icon: '📰', title: 'Journal Assistant',      path: '/journal-assistant',
    desc: 'Auto-generate methods sections and find the right journal.',
    color: '#607d8b', badge: 'AI',
  },
  {
    icon: '🌐', title: 'Instrument Recognition', path: '/instrument',
    desc: 'Auto-detect DHS, MICS and WHO STEPS survey variables.',
    color: '#43a047', badge: 'New',
  },
];

const STATS = [
  { label: 'Study Designs Supported', value: '6',   icon: '📐' },
  { label: 'Statistical Tests',        value: '8',   icon: '📊' },
  { label: 'Survey Instruments',       value: '3',   icon: '🌍' },
  { label: 'Report Templates',         value: '3',   icon: '📄' },
];

const PERSONAS = [
  {
    icon: '🎓', title: 'I am a Student',
    desc: 'Guided step-by-step analysis with plain language explanations.',
    path: '/student', color: '#C0533A',
    steps: ['Upload protocol', 'Clean data', 'Get test recommendation', 'Download PDF report'],
  },
  {
    icon: '🌍', title: 'I work for an NGO',
    desc: 'Rapid field data analysis for programme reporting and donor submissions.',
    path: '/ngo', color: '#5A8A6A',
    steps: ['Upload field data', 'Build cohort', 'Run analysis', 'Export to PDF'],
  },
  {
    icon: '📰', title: 'I am a Journal Editor',
    desc: 'Verify statistical integrity of submitted manuscripts.',
    path: '/journal', color: '#1C2B3A',
    steps: ['Upload dataset', 'Check rigor score', 'Verify statistics', 'Generate report'],
  },
];

export default function Dashboard({ user }: { user: any }) {
  const navigate  = useNavigate();
  const [auditCount, setAuditCount] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/audit`)
      .then(r => r.json())
      .then(data => setAuditCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }, []);

  return (
    <div style={{ background: '#f8f7f4', minHeight: '100vh' }}>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg, #1C2B3A 0%, #2d4a5e 100%)', color: 'white', padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔬</div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', color: 'white' }}>
          ResearchFlow
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#adc8e0', maxWidth: 600, margin: '0 auto 1.5rem' }}>
          The research intelligence platform for global health — from raw data to publication-ready results.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/student" style={{ background: '#C0533A', color: 'white', padding: '0.75rem 2rem', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: '1rem' }}>
            Get Started →
          </Link>
          <Link to="/samplesize" style={{ background: 'transparent', color: 'white', padding: '0.75rem 2rem', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: '1rem', border: '2px solid rgba(255,255,255,0.3)' }}>
            Sample Size Calculator
          </Link>
        </div>
        {auditCount > 0 && (
          <p style={{ marginTop: '1.5rem', color: '#adc8e0', fontSize: '0.9rem' }}>
            {auditCount} analyses completed on this platform
          </p>
        )}
      </div>

      {/* STATS */}
      <div style={{ background: '#C0533A', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
          {STATS.map(stat => (
            <div key={stat.label} style={{ textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{stat.icon}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stat.value}</div>
              <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem' }}>

        {/* PERSONA SELECTOR */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ color: '#1C2B3A', fontSize: '1.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>
            Who are you?
          </h2>
          <p style={{ color: '#888', textAlign: 'center', marginBottom: '1.5rem' }}>
            Choose your role for a tailored experience
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem' }}>
            {PERSONAS.map(persona => (
              <div key={persona.title} onClick={() => navigate(persona.path)}
                style={{ background: 'white', borderRadius: 12, padding: '1.5rem', cursor: 'pointer', border: '2px solid #eee', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                onMouseOver={e => (e.currentTarget.style.borderColor = persona.color)}
                onMouseOut={e  => (e.currentTarget.style.borderColor = '#eee')}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{persona.icon}</div>
                <h3 style={{ color: persona.color, marginBottom: '0.5rem' }}>{persona.title}</h3>
                <p style={{ fontSize: '0.88rem', color: '#666', marginBottom: '1rem', lineHeight: 1.5 }}>{persona.desc}</p>
                <div>
                  {persona.steps.map((step, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 6 }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: persona.color, color: 'white', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {i + 1}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: '#555' }}>{step}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '1rem', color: persona.color, fontWeight: 700, fontSize: '0.88rem' }}>
                  Start here →
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ALL FEATURES */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ color: '#1C2B3A', fontSize: '1.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>
            All Tools
          </h2>
          <p style={{ color: '#888', textAlign: 'center', marginBottom: '1.5rem' }}>
            Everything you need from data to publication
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
            {FEATURES.map(feature => (
              <Link key={feature.path + feature.title} to={feature.path}
                style={{ textDecoration: 'none' }}>
                <div style={{ background: 'white', borderRadius: 10, padding: '1.25rem', border: '1px solid #eee', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', height: '100%', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={e  => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.8rem' }}>{feature.icon}</span>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700, background: feature.color + '22', color: feature.color }}>
                      {feature.badge}
                    </span>
                  </div>
                  <h3 style={{ color: '#1C2B3A', marginBottom: '0.4rem', fontSize: '0.95rem' }}>{feature.title}</h3>
                  <p style={{ fontSize: '0.8rem', color: '#888', lineHeight: 1.5, marginBottom: 0 }}>{feature.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ textAlign: 'center', padding: '2rem 0', borderTop: '1px solid #eee' }}>
          <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: 4 }}>
            ResearchFlow — Built for global health researchers in LMICs
          </p>
          <p style={{ color: '#ccc', fontSize: '0.78rem', marginBottom: 0 }}>
            Powered by Anthropic Claude · Open methodology · Audit trail included
          </p>
        </div>
      </div>
    </div>
  );
}
