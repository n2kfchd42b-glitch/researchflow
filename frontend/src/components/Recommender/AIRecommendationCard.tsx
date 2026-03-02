import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getFeatureRoute, isKnownFeatureKey, ProductContext } from '../../config/featureRoutes';

export interface AIRecommendation {
  analysis_name: string;
  priority: 'essential' | 'supplementary';
  reason: string;
  assumptions: string[];
  warnings: string[];
  feature_key: string;
}

interface Props {
  rec: AIRecommendation;
}

export default function AIRecommendationCard({ rec }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [showFullReason,  setShowFullReason]  = useState(false);

  const context: ProductContext = location.pathname.startsWith('/ngo') ? 'ngo' : 'student';
  const route   = isKnownFeatureKey(rec.feature_key) ? getFeatureRoute(rec.feature_key, context) : '';
  const isEssential = rec.priority === 'essential';

  const reasonLines = rec.reason;
  const isLongReason = rec.reason.length > 160;

  return (
    <div style={{
      background: 'white',
      border: `1px solid ${isEssential ? '#FADBD8' : '#e8ecf0'}`,
      borderRadius: 12,
      padding: '1rem 1.25rem',
      marginBottom: '0.75rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '0.5rem' }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1C2B3A', flex: 1 }}>
          {rec.analysis_name}
        </span>
        <span style={{
          padding: '0.2rem 0.65rem',
          borderRadius: 20,
          fontSize: '0.72rem',
          fontWeight: 700,
          background: isEssential ? '#FADBD8' : '#f0f4f8',
          color: isEssential ? '#922B21' : '#555',
          flexShrink: 0,
          border: isEssential ? '1px solid #F1948A' : '1px solid #dde4ea',
        }}>
          {isEssential ? 'Essential' : 'Supplementary'}
        </span>
      </div>

      {/* Reason */}
      <p style={{ fontSize: '0.83rem', color: '#444', lineHeight: 1.5, marginBottom: '0.6rem' }}>
        {isLongReason && !showFullReason ? `${rec.reason.slice(0, 160)}… ` : reasonLines}
        {isLongReason && (
          <button onClick={() => setShowFullReason(!showFullReason)} style={inlineLinkStyle}>
            {showFullReason ? 'less' : 'more'}
          </button>
        )}
      </p>

      {/* Warnings */}
      {rec.warnings.length > 0 && (
        <div style={{ marginBottom: '0.6rem' }}>
          {rec.warnings.map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.35rem', alignItems: 'flex-start', fontSize: '0.78rem', color: '#9A7D0A', background: '#FEF9E7', padding: '0.3rem 0.6rem', borderRadius: 6, marginBottom: 3 }}>
              <span>⚠</span><span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Assumptions toggle */}
      {rec.assumptions.length > 0 && (
        <div style={{ marginBottom: '0.6rem' }}>
          <button onClick={() => setShowAssumptions(!showAssumptions)} style={toggleBtnStyle}>
            Assumptions ({rec.assumptions.length}) {showAssumptions ? '▲' : '▼'}
          </button>
          {showAssumptions && (
            <ul style={{ margin: '0.4rem 0 0 1rem', padding: 0, fontSize: '0.78rem', color: '#555' }}>
              {rec.assumptions.map((a, i) => (
                <li key={i} style={{ marginBottom: 2 }}>{a}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Open feature button */}
      <button
        onClick={() => { if (route) navigate(route); }}
        disabled={!route}
        title={!route ? 'Coming soon' : `Open ${rec.analysis_name}`}
        style={{
          background: route ? '#1C2B3A' : '#e8ecf0',
          color: route ? 'white' : '#aaa',
          border: 'none',
          borderRadius: 7,
          padding: '0.45rem 1rem',
          fontSize: '0.82rem',
          fontWeight: 600,
          cursor: route ? 'pointer' : 'not-allowed',
        }}
      >
        {route ? 'Open Feature →' : 'Coming soon'}
      </button>
    </div>
  );
}

const inlineLinkStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: '#2E86C1', cursor: 'pointer',
  fontSize: '0.83rem', padding: 0, fontWeight: 600,
};

const toggleBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: '#555', cursor: 'pointer',
  fontSize: '0.78rem', padding: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem',
};
