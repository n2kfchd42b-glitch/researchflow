import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Building2, BookOpen } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

const PRODUCTS = [
  {
    Icon: GraduationCap,
    title: 'Student Wizard',
    subtitle: 'Guided research analysis for students & trainees',
    features: ['Study Setup', 'Guided Analysis', 'Auto Reports', 'Syntax Export'],
    button: 'Start Learning',
    path: '/student',
    accent: '#2E86C1',
  },
  {
    Icon: Building2,
    title: 'NGO Platform',
    subtitle: 'Field research operations & advanced analytics',
    features: ['Project Management', 'Field Forms', 'Budget & Ethics', 'Advanced Analysis'],
    button: 'Open Platform',
    path: '/ngo',
    accent: '#5A8A6A',
  },
  {
    Icon: BookOpen,
    title: 'Journal Component',
    subtitle: 'Analysis verification & reproducibility',
    features: ['Dataset Verification', 'Risk of Bias', 'Audit Trail', 'Verification Reports'],
    button: 'Start Verifying',
    path: '/journal',
    accent: '#7D3C98',
  },
];

const ProductLanding: React.FC = () => {
  const navigate = useNavigate();
  const { projects } = useProject();
  const recentProjects = projects.slice(0, 3);

  return (
    <div style={{ minHeight: '100vh', background: '#F4F7FA' }}>
      {/* Hero header */}
      <div style={{ background: '#1C2B3A', padding: '3rem 2rem 2.5rem', textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          ResearchFlow
        </h1>
        <p style={{ color: '#8ca0b3', fontSize: '1rem', margin: 0 }}>
          Global Health Research Platform
        </p>
      </div>

      {/* Product cards */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem 2rem' }}>
        <div className="product-cards-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.5rem',
        }}>
          {PRODUCTS.map(p => {
            const { Icon } = p;
            return (
              <div key={p.title} style={{
                background: 'white', borderRadius: 12,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                borderLeft: `4px solid ${p.accent}`,
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
              }}>
                <div style={{ padding: '1.75rem 1.5rem 1rem' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 10,
                    background: `${p.accent}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '1rem',
                  }}>
                    <Icon size={26} color={p.accent} />
                  </div>
                  <h2 style={{ color: '#1C2B3A', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    {p.title}
                  </h2>
                  <p style={{ color: '#666', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: 1.55 }}>
                    {p.subtitle}
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem' }}>
                    {p.features.map(f => (
                      <li key={f} style={{
                        fontSize: '0.85rem', color: '#555', padding: '0.3rem 0',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                      }}>
                        <span style={{ color: p.accent, fontWeight: 700 }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ padding: '0 1.5rem 1.5rem', marginTop: 'auto' }}>
                  <button onClick={() => navigate(p.path)} style={{
                    width: '100%', padding: '0.7rem', borderRadius: 8,
                    background: p.accent, color: 'white', border: 'none',
                    fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                  }}>
                    {p.button}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <div style={{ marginTop: '2.5rem' }}>
            <h3 style={{ color: '#1C2B3A', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
              Recent Projects
            </h3>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {recentProjects.map(p => (
                <div key={p.id} style={{
                  background: 'white', borderRadius: 8, padding: '0.75rem 1.25rem',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                  border: '1px solid #e8edf0',
                }}>
                  <p style={{ fontWeight: 600, color: '#1C2B3A', fontSize: '0.9rem', margin: '0 0 0.15rem' }}>
                    {p.name}
                  </p>
                  {p.description && (
                    <p style={{ color: '#888', fontSize: '0.78rem', margin: 0 }}>{p.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductLanding;
