import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Images ──────────────────────────────────────────────────────────────────
import heroImg from '../assets/images/team-hero.jpg.PNG';
import globalImg from '../assets/images/global-map.jpg.PNG';
import growthImg from '../assets/images/growth-arrow.jpg.PNG';
import researchImg from '../assets/images/research-docs.jpg.PNG';

const IMAGES = {
  hero:     heroImg,
  global:   globalImg,
  growth:   growthImg,
  research: researchImg,
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface LandingPageProps {
  onNavigate?: (path: string) => void;
}

// ─── Data ────────────────────────────────────────────────────────────────────
const PRODUCTS = [
  {
    title: 'Student Wizard',
    subtitle: 'Guided 5-step research workflow — from study setup to polished report.',
    description:
      'Perfect for students and trainees running their first health-research project. Set up your study, upload data, run guided analyses, review results, and export a publication-ready report.',
    features: ['Study Setup', 'Guided Analysis', 'Auto Reports', 'Syntax Export'],
    path: '/student',
    bg: IMAGES.growth,
    accent: '#5A8A6A',
    cta: 'Start Learning',
  },
  {
    title: 'NGO Platform',
    subtitle: 'End-to-end field-research operations and advanced analytics.',
    description:
      'Built for NGOs running multi-site studies in LMICs. Manage projects, build field forms, track budgets and ethics approvals, clean data, and run advanced statistical analyses.',
    features: ['Project Management', 'Field Forms', 'Budget & Ethics', 'Advanced Analysis'],
    path: '/ngo',
    bg: IMAGES.global,
    accent: '#2E86C1',
    cta: 'Open Platform',
  },
  {
    title: 'Journal Component',
    subtitle: 'Analysis verification and reproducibility checking for reviewers.',
    description:
      'Designed for journal editors and peer reviewers. Verify datasets, assess risk of bias, trace analysis decisions, and generate structured audit reports.',
    features: ['Dataset Verification', 'Risk of Bias', 'Audit Trail', 'Verification Reports'],
    path: '/journal',
    bg: IMAGES.research,
    accent: '#7D3C98',
    cta: 'Start Verifying',
  },
];

const STATS = [
  { value: '50+', label: 'Features' },
  { value: '3',   label: 'Products' },
  { value: 'LMIC', label: 'Focus' },
  { value: 'Open', label: 'Access' },
];

// ─── Component ───────────────────────────────────────────────────────────────
const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail]         = useState('');
  const [submitted, setSubmitted] = useState(false);

  const go = (path: string) => {
    setMenuOpen(false);
    if (onNavigate) onNavigate(path);
    else navigate(path);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", color: '#1C2B3A', overflowX: 'hidden' }}>

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#1C2B3A', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem',
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <button onClick={() => go('/')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.6rem', padding: 0,
          }}>
            <span style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #C0533A, #e07060)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: '1rem', flexShrink: 0,
            }}>R</span>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.3px' }}>
              ResearchFlow
            </span>
          </button>

          {/* Desktop nav links */}
          <div className="rf-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {PRODUCTS.map(p => (
              <button key={p.title} onClick={() => go(p.path)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#a8bfcf', fontSize: '0.88rem', fontWeight: 500,
                padding: '0.5rem 0.85rem', borderRadius: 6,
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = '#a8bfcf'; }}>
                {p.title}
              </button>
            ))}
          </div>

          {/* Desktop CTA buttons */}
          <div className="rf-nav-cta" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button onClick={() => go('/login')} style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.25)',
              color: '#d0dde8', padding: '0.45rem 1.1rem', borderRadius: 6,
              fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.6)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.25)'; (e.currentTarget as HTMLButtonElement).style.color = '#d0dde8'; }}>
              Log in
            </button>
            <button onClick={() => setModalOpen(true)} style={{
              background: '#C0533A', border: 'none',
              color: '#fff', padding: '0.45rem 1.1rem', borderRadius: 6,
              fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#a8442d'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#C0533A'; }}>
              Get Started
            </button>
          </div>

          {/* Hamburger (mobile) */}
          <button
            className="rf-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            style={{
              display: 'none', background: 'none', border: 'none',
              cursor: 'pointer', padding: '0.4rem', color: '#fff',
            }}
            aria-label="Toggle menu">
            <span style={{
              display: 'block', width: 22, height: 2, background: '#fff',
              marginBottom: 5, transition: 'transform 0.2s',
              transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none',
            }} />
            <span style={{
              display: 'block', width: 22, height: 2, background: '#fff',
              marginBottom: 5, opacity: menuOpen ? 0 : 1, transition: 'opacity 0.2s',
            }} />
            <span style={{
              display: 'block', width: 22, height: 2, background: '#fff',
              transition: 'transform 0.2s',
              transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none',
            }} />
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div style={{
            background: '#152233', borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '1rem 1.5rem',
          }}>
            {PRODUCTS.map(p => (
              <button key={p.title} onClick={() => go(p.path)} style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#a8bfcf', fontSize: '0.95rem', padding: '0.65rem 0',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                {p.title}
              </button>
            ))}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button onClick={() => go('/login')} style={{
                flex: 1, background: 'none', border: '1px solid rgba(255,255,255,0.3)',
                color: '#d0dde8', padding: '0.6rem', borderRadius: 6,
                fontSize: '0.9rem', cursor: 'pointer',
              }}>Log in</button>
              <button onClick={() => { setMenuOpen(false); setModalOpen(true); }} style={{
                flex: 1, background: '#C0533A', border: 'none',
                color: '#fff', padding: '0.6rem', borderRadius: 6,
                fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
              }}>Get Started</button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '92vh', display: 'flex', alignItems: 'center',
        backgroundImage: `linear-gradient(rgba(13,27,42,0.75), rgba(28,43,58,0.85)), url(${IMAGES.hero})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -120, right: -120,
          width: 500, height: 500, borderRadius: '50%',
          background: 'rgba(192,83,58,0.08)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -80,
          width: 350, height: 350, borderRadius: '50%',
          background: 'rgba(46,134,193,0.07)', pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '5rem 1.5rem', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 680 }}>
            <div style={{
              display: 'inline-block', background: 'rgba(192,83,58,0.18)',
              border: '1px solid rgba(192,83,58,0.35)',
              borderRadius: 20, padding: '0.3rem 0.9rem', marginBottom: '1.5rem',
            }}>
              <span style={{ color: '#e07060', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.5px' }}>
                GLOBAL HEALTH RESEARCH PLATFORM
              </span>
            </div>

            <h1 style={{
              color: '#fff', fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
              fontWeight: 800, lineHeight: 1.15, marginBottom: '1.25rem',
              letterSpacing: '-0.5px',
            }}>
              Democratising <span style={{ color: '#C0533A' }}>Research</span>{' '}
              in Low- &amp; Middle-Income Countries
            </h1>

            <p style={{
              color: '#8ca0b3', fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              lineHeight: 1.7, marginBottom: '2.25rem', maxWidth: 560,
            }}>
              ResearchFlow gives students, NGOs, and journal editors professional-grade tools
              to run rigorous, reproducible health research — no expensive software or expert
              statisticians required.
            </p>

            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
              <button onClick={() => setModalOpen(true)} style={{
                background: '#C0533A', color: '#fff', border: 'none',
                padding: '0.85rem 2rem', borderRadius: 8,
                fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(192,83,58,0.4)',
                transition: 'background 0.15s, transform 0.1s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#a8442d'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#C0533A'; }}>
                Get Started Free
              </button>
              <button onClick={() => go('/login')} style={{
                background: 'rgba(255,255,255,0.08)', color: '#d0dde8',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '0.85rem 2rem', borderRadius: 8,
                fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.13)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Products section ────────────────────────────────────────────────── */}
      <section style={{ background: '#F4F7FA', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, marginBottom: '0.75rem' }}>
              Three tools. One platform.
            </h2>
            <p style={{ color: '#5a7080', fontSize: '1.05rem', maxWidth: 560, margin: '0 auto' }}>
              Whether you're a student analysing your first dataset, an NGO managing field studies,
              or a journal editor checking reproducibility — ResearchFlow has you covered.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.75rem',
          }}>
            {PRODUCTS.map(p => (
              <div key={p.title} style={{
                background: '#fff', borderRadius: 14,
                boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)'; }}>

                {/* Card image area */}
                <div style={{
                  height: 160,
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.45)), url(${p.bg})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  display: 'flex', alignItems: 'flex-end', padding: '1rem 1.5rem',
                }}>
                  <span style={{
                    background: 'rgba(0,0,0,0.35)', color: '#fff',
                    fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px',
                    padding: '0.25rem 0.7rem', borderRadius: 12,
                    textTransform: 'uppercase',
                  }}>{p.title}</span>
                </div>

                {/* Card body */}
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    {p.title}
                  </h3>
                  <p style={{ color: '#5a7080', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    {p.description}
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', flex: 1 }}>
                    {p.features.map(f => (
                      <li key={f} style={{
                        fontSize: '0.85rem', color: '#4a6070',
                        padding: '0.3rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem',
                      }}>
                        <span style={{ color: p.accent, fontWeight: 700, fontSize: '0.9rem' }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => go(p.path)} style={{
                    width: '100%', padding: '0.7rem',
                    background: p.accent, color: '#fff', border: 'none',
                    borderRadius: 8, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}>
                    {p.cta} →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission strip ───────────────────────────────────────────────────── */}
      <section style={{
        background: '#1C2B3A',
        padding: '4.5rem 1.5rem',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <p style={{
            color: '#C0533A', fontSize: '0.8rem', fontWeight: 700,
            letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '1rem',
          }}>OUR MISSION</p>
          <h2 style={{
            color: '#fff', fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
            fontWeight: 800, lineHeight: 1.25, marginBottom: '1.25rem',
          }}>
            Levelling the research playing field for the{' '}
            <span style={{ color: '#C0533A' }}>Global South</span>
          </h2>
          <p style={{
            color: '#8ca0b3', fontSize: '1.05rem', lineHeight: 1.8, marginBottom: '2.25rem',
          }}>
            High-quality health research tools have historically been accessible only to well-funded
            institutions in high-income countries. ResearchFlow changes that. We build open-access,
            context-appropriate tools that empower researchers wherever they are — so evidence from
            every corner of the world can inform global health decisions.
          </p>
          <button onClick={() => setModalOpen(true)} style={{
            background: '#C0533A', color: '#fff', border: 'none',
            padding: '0.8rem 2rem', borderRadius: 8,
            fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#a8442d'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#C0533A'; }}>
            Join the Movement
          </button>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────────────────── */}
      <section style={{
        background: '#F4F7FA',
        borderTop: '1px solid #e0e8ef', borderBottom: '1px solid #e0e8ef',
        padding: '2.75rem 1.5rem',
      }}>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1.5rem', textAlign: 'center',
        }}>
          {STATS.map(s => (
            <div key={s.label}>
              <div style={{
                fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800,
                color: '#1C2B3A', lineHeight: 1, marginBottom: '0.35rem',
              }}>{s.value}</div>
              <div style={{ fontSize: '0.88rem', color: '#5a7080', fontWeight: 500 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#0d1b2a', padding: '3rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem', marginBottom: '2.5rem',
          }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                <span style={{
                  width: 30, height: 30, borderRadius: 7,
                  background: 'linear-gradient(135deg, #C0533A, #e07060)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: '0.95rem',
                }}>R</span>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>ResearchFlow</span>
              </div>
              <p style={{ color: '#5a7080', fontSize: '0.85rem', lineHeight: 1.6, maxWidth: 220 }}>
                Open-access research tools for the Global South.
              </p>
            </div>

            {/* Products */}
            <div>
              <h4 style={{ color: '#8ca0b3', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem' }}>
                Products
              </h4>
              {PRODUCTS.map(p => (
                <button key={p.title} onClick={() => go(p.path)} style={{
                  display: 'block', background: 'none', border: 'none',
                  color: '#5a7080', fontSize: '0.88rem', cursor: 'pointer',
                  padding: '0.3rem 0', textAlign: 'left',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#d0dde8'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#5a7080'; }}>
                  {p.title}
                </button>
              ))}
            </div>

            {/* Resources */}
            <div>
              <h4 style={{ color: '#8ca0b3', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem' }}>
                Resources
              </h4>
              {[
                { label: 'Log In', path: '/login' },
                { label: 'GitHub', path: 'https://github.com/researchflow' },
              ].map(link => (
                link.path.startsWith('http') ? (
                  <a key={link.label} href={link.path} target="_blank" rel="noreferrer" style={{
                    display: 'block', color: '#5a7080', fontSize: '0.88rem',
                    padding: '0.3rem 0', textDecoration: 'none', transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#d0dde8'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#5a7080'; }}>
                    {link.label}
                  </a>
                ) : (
                  <button key={link.label} onClick={() => go(link.path)} style={{
                    display: 'block', background: 'none', border: 'none',
                    color: '#5a7080', fontSize: '0.88rem', cursor: 'pointer',
                    padding: '0.3rem 0', textAlign: 'left', transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#d0dde8'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#5a7080'; }}>
                    {link.label}
                  </button>
                )
              ))}
            </div>
          </div>

          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: '1.5rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '0.75rem',
          }}>
            <p style={{ color: '#3a5060', fontSize: '0.8rem', margin: 0 }}>
              © {new Date().getFullYear()} ResearchFlow. Open Access.
            </p>
            <p style={{ color: '#3a5060', fontSize: '0.8rem', margin: 0 }}>
              Built for researchers in LMICs
            </p>
          </div>
        </div>
      </footer>

      {/* ── Get Started Modal ────────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          onClick={() => { setModalOpen(false); setSubmitted(false); setEmail(''); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(13,27,42,0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 16,
              padding: '2.5rem', maxWidth: 440, width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}>
            {!submitted ? (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    Get Started
                  </h2>
                  <p style={{ color: '#5a7080', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    Enter your email to create your free account and start using ResearchFlow today.
                  </p>
                </div>
                <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{
                      padding: '0.75rem 1rem', borderRadius: 8,
                      border: '1.5px solid #d0dde8', fontSize: '0.95rem',
                      outline: 'none', transition: 'border-color 0.15s',
                    }}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#C0533A'; }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = '#d0dde8'; }}
                  />
                  <button type="submit" style={{
                    background: '#C0533A', color: '#fff', border: 'none',
                    padding: '0.8rem', borderRadius: 8,
                    fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#a8442d'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#C0533A'; }}>
                    Create Free Account
                  </button>
                  <button type="button" onClick={() => go('/login')} style={{
                    background: 'none', border: '1.5px solid #d0dde8', color: '#5a7080',
                    padding: '0.75rem', borderRadius: 8,
                    fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer',
                  }}>
                    Already have an account? Log in
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #C0533A, #e07060)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.25rem', fontSize: '1.8rem',
                }}>✓</div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.6rem' }}>
                  You're on the list!
                </h2>
                <p style={{ color: '#5a7080', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  Thanks for your interest in ResearchFlow. We'll be in touch at <strong>{email}</strong>.
                  In the meantime, explore the project on GitHub.
                </p>
                <a
                  href="https://github.com/researchflow"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-block',
                    background: '#1C2B3A', color: '#fff',
                    padding: '0.7rem 1.6rem', borderRadius: 8,
                    textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem',
                    marginBottom: '0.75rem',
                  }}>
                  View on GitHub
                </a>
                <br />
                <button onClick={() => { setModalOpen(false); setSubmitted(false); setEmail(''); }} style={{
                  background: 'none', border: 'none', color: '#8ca0b3',
                  fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.5rem',
                }}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Responsive styles ───────────────────────────────────────────────── */}
      <style>{`
        @media (max-width: 700px) {
          .rf-nav-links { display: none !important; }
          .rf-nav-cta   { display: none !important; }
          .rf-hamburger { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
