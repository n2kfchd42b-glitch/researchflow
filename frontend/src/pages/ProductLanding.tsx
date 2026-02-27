import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Building2, BookOpen, CheckCircle } from 'lucide-react';

const PRODUCTS = [
  {
    icon: GraduationCap,
    title: 'Student Wizard',
    subtitle: 'Guided research analysis for students & trainees',
    features: ['Study Setup', 'Guided Analysis', 'Auto Reports', 'Syntax Export'],
    buttonLabel: 'Start Learning',
    path: '/student',
    accentColor: '#2E86C1',
    iconBg: '#EBF5FB',
  },
  {
    icon: Building2,
    title: 'NGO Platform',
    subtitle: 'Field research operations & advanced analytics',
    features: ['Project Management', 'Field Forms', 'Budget & Ethics', 'Advanced Analysis'],
    buttonLabel: 'Open Platform',
    path: '/ngo',
    accentColor: '#5A8A6A',
    iconBg: '#EAF4EE',
  },
  {
    icon: BookOpen,
    title: 'Journal Component',
    subtitle: 'Analysis verification & reproducibility',
    features: ['Dataset Verification', 'Risk of Bias', 'Audit Trail', 'Verification Reports'],
    buttonLabel: 'Start Verifying',
    path: '/journal',
    accentColor: '#7D3C98',
    iconBg: '#F5EEF8',
  },
];

export default function ProductLanding() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F4F7FA',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '3rem 1.5rem',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          fontWeight: 800,
          color: '#1C2B3A',
          margin: 0,
          letterSpacing: '-0.5px',
        }}>
          ResearchFlow
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#5A6B7A',
          marginTop: '0.5rem',
          fontWeight: 400,
        }}>
          Global Health Research Platform
        </p>
        <div style={{
          width: 60,
          height: 4,
          background: '#C0533A',
          borderRadius: 2,
          margin: '1rem auto 0',
        }} />
      </div>

      {/* Product Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        width: '100%',
        maxWidth: 1100,
      }}>
        {PRODUCTS.map((product) => {
          const Icon = product.icon;
          return (
            <div
              key={product.path}
              style={{
                background: 'white',
                borderRadius: 12,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                borderLeft: `4px solid ${product.accentColor}`,
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
              }}
            >
              {/* Icon */}
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: product.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon size={28} color={product.accentColor} />
              </div>

              {/* Title & Subtitle */}
              <div>
                <h2 style={{
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: '#1C2B3A',
                  margin: '0 0 0.25rem',
                }}>
                  {product.title}
                </h2>
                <p style={{
                  fontSize: '0.9rem',
                  color: '#5A6B7A',
                  margin: 0,
                  lineHeight: 1.4,
                }}>
                  {product.subtitle}
                </p>
              </div>

              {/* Features */}
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {product.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#444' }}>
                    <CheckCircle size={14} color={product.accentColor} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Button */}
              <button
                onClick={() => navigate(product.path)}
                style={{
                  marginTop: 'auto',
                  padding: '0.75rem 1.25rem',
                  background: product.accentColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {product.buttonLabel}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p style={{ marginTop: '3rem', color: '#999', fontSize: '0.8rem' }}>
        ResearchFlow v2.0 &mdash; Global Health Research Platform
      </p>
    </div>
  );
}
