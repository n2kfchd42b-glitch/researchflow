import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function DescriptiveStatsCard() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Detect product context from current path
  const context = location.pathname.startsWith('/ngo') ? 'ngo' : 'student';
  const targetPath = context === 'ngo' ? '/ngo/descriptive' : '/student/descriptive';

  return (
    <div style={{
      background: 'white',
      border: '2px solid #2E86C1',
      borderRadius: 12,
      padding: '1rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      marginBottom: '0.75rem',
      boxShadow: '0 2px 8px rgba(46,134,193,0.1)',
    }}>
      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', flex: 1 }}>
        <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>📊</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1C2B3A', marginBottom: '0.2rem' }}>
            Descriptive Statistics
          </div>
          <div style={{ fontSize: '0.82rem', color: '#555', lineHeight: 1.45 }}>
            Explore your variables, check distributions, and build Table 1 for your manuscript.
          </div>
          <div style={{ fontSize: '0.75rem', color: '#2E86C1', fontWeight: 600, marginTop: '0.3rem' }}>
            Recommended for ALL study designs.
          </div>
        </div>
      </div>
      <button
        onClick={() => navigate(targetPath)}
        style={{
          background: '#2E86C1',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          padding: '0.55rem 1.1rem',
          fontWeight: 700,
          fontSize: '0.85rem',
          cursor: 'pointer',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        Start →
      </button>
    </div>
  );
}
