import React, { useState } from 'react';
import { CheckCircle, Circle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStudentWizard } from '../context/StudentWizardContext';
import '../student.css';

// ─── Analysis plan per study type ────────────────────────────────────────────

interface ChecklistItem {
  id: string;
  label: string;
  why: string;
  path: string;
}

const STUDY_PLANS: Record<string, ChecklistItem[]> = {
  'cross-sectional': [
    { id: 'table1', label: 'Table 1: Descriptive statistics by group', why: 'Summarizes your sample characteristics and shows the distribution of key variables — essential for every paper.', path: '/student/table1' },
    { id: 'bivariate', label: 'Chi-square / t-tests for bivariate analysis', why: 'Tests whether there is an association between each predictor and your outcome without adjustment.', path: '/student/descriptive' },
    { id: 'regression', label: 'Logistic or linear regression', why: 'Multivariable regression adjusts for confounders to give an independent estimate of the exposure-outcome association.', path: '/student/descriptive' },
    { id: 'subgroup', label: 'Subgroup analysis', why: 'Tests whether the effect varies across key subgroups (e.g., by age, sex, or setting).', path: '/student/subgroup' },
  ],
  'cohort': [
    { id: 'table1', label: 'Table 1: Baseline characteristics', why: 'Shows whether the exposed and unexposed groups were similar at baseline — crucial for cohort studies.', path: '/student/table1' },
    { id: 'km', label: 'Kaplan-Meier survival curves', why: 'Visualizes time-to-event outcomes and compares survival between groups with log-rank test.', path: '/student/survival' },
    { id: 'cox', label: 'Cox proportional hazards regression', why: 'Provides adjusted hazard ratios for the exposure-outcome relationship, accounting for confounders and time.', path: '/student/survival' },
    { id: 'sensitivity', label: 'Sensitivity analysis', why: 'Tests robustness of your main findings to alternative assumptions or analytical choices.', path: '/student/sensitivity' },
  ],
  'rct': [
    { id: 'table1', label: 'Table 1: Baseline by arm', why: 'Demonstrates successful randomization by showing balance across trial arms at baseline.', path: '/student/table1' },
    { id: 'itt', label: 'Primary outcome analysis (ITT)', why: 'Intention-to-treat analysis preserves randomization and is the pre-specified primary analysis for most RCTs.', path: '/student/descriptive' },
    { id: 'pp', label: 'Per-protocol analysis', why: 'Assesses efficacy among those who adhered to the protocol — a sensitivity check for ITT.', path: '/student/descriptive' },
    { id: 'subgroup', label: 'Subgroup analysis', why: 'Pre-specified subgroup analyses can identify which patient populations benefit most from the intervention.', path: '/student/subgroup' },
  ],
  'case-control': [
    { id: 'table1', label: 'Table 1: Cases vs Controls', why: 'Describes and compares baseline characteristics to check matching quality and identify confounders.', path: '/student/table1' },
    { id: 'or', label: 'Odds ratios with 95% CIs', why: 'The primary measure of association in case-control studies — how much more likely cases were exposed.', path: '/student/descriptive' },
    { id: 'logistic', label: 'Adjusted logistic regression', why: 'Controls for potential confounders to give an independent estimate of the exposure-outcome OR.', path: '/student/descriptive' },
    { id: 'psm', label: 'Propensity score matching', why: 'Alternative approach to adjust for confounding, mimicking randomization to balance baseline characteristics.', path: '/student/survival' },
  ],
  'systematic-review': [
    { id: 'prisma', label: 'PRISMA flow diagram', why: 'Documents the study selection process transparently — required by all major journals for systematic reviews.', path: '/student/prisma' },
    { id: 'rob', label: 'Risk of bias assessment', why: 'Evaluates methodological quality of included studies and identifies potential sources of bias.', path: '/student/descriptive' },
    { id: 'forest', label: 'Meta-analysis (forest plot)', why: 'Quantitatively synthesizes results across studies to give a pooled effect estimate with precision.', path: '/student/forest-plot' },
    { id: 'sensitivity', label: 'Sensitivity analysis', why: 'Tests whether findings are robust by excluding low-quality studies or using different analytical models.', path: '/student/sensitivity' },
  ],
};

const ADDITIONAL_TOOLS = [
  { label: 'Sample Size Calculator', path: '/student/samplesize', icon: '🔢' },
  { label: 'Codebook Generator',     path: '/student/codebook',  icon: '📋' },
  { label: 'Literature Review',      path: '/student/literature', icon: '📚' },
  { label: 'Forest Plot',            path: '/student/forest-plot', icon: '🌲' },
  { label: 'Visualization Studio',   path: '/student/visualise', icon: '📊' },
  { label: 'Sample Datasets',        path: '/student/samples',   icon: '🗃️' },
];

export default function GuidedAnalysisPage() {
  const { state, completeStep } = useStudentWizard();
  const navigate = useNavigate();
  const [expandedWhy, setExpandedWhy] = useState<string | null>(null);

  const studyType = state.studyConfig.studyType || 'cross-sectional';
  const plan = STUDY_PLANS[studyType] ?? STUDY_PLANS['cross-sectional'];

  const completedIds = new Set(state.analyses.map(a => a.type));
  const hasAnyComplete = state.analyses.length > 0;

  const getStatus = (id: string): 'complete' | 'not-started' => {
    return completedIds.has(id) ? 'complete' : 'not-started';
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1C2B3A', marginBottom: '0.25rem' }}>
        Step 3: Guided Analysis
      </h2>
      <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Your recommended analysis plan for a <strong>{studyType.replace('-', ' ')}</strong> study.
        Run each analysis and return here to check them off.
      </p>

      {/* Recommended plan */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1C2B3A', marginBottom: '0.75rem' }}>
          Recommended Analysis Plan
        </h3>
        {plan.map(item => {
          const status = getStatus(item.id);
          const isExpanded = expandedWhy === item.id;
          return (
            <div key={item.id} className={`analysis-card ${status}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {status === 'complete'
                  ? <CheckCircle size={20} color="#5A8A6A" />
                  : <Circle size={20} color="#D5D8DC" />
                }
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1C2B3A' }}>{item.label}</div>
                  {status === 'complete' && (
                    <div style={{ fontSize: '0.78rem', color: '#27AE60', marginTop: 2 }}>Completed</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={() => setExpandedWhy(isExpanded ? null : item.id)}
                    style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    Why? {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  <button
                    onClick={() => navigate(item.path)}
                    style={{
                      padding: '0.35rem 0.85rem',
                      background: '#2E86C1',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    Run Analysis <ExternalLink size={12} />
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #F0F4FA', fontSize: '0.85rem', color: '#555', lineHeight: 1.5 }}>
                  {item.why}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Additional tools */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1C2B3A', marginBottom: '0.75rem' }}>
          Additional Tools
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
          {ADDITIONAL_TOOLS.map(tool => (
            <button
              key={tool.path}
              onClick={() => navigate(tool.path)}
              style={{
                padding: '0.75rem 1rem',
                background: 'white',
                border: '1px solid #E5E9EF',
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                transition: 'box-shadow 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
            >
              <span style={{ fontSize: '1.2rem' }}>{tool.icon}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1C2B3A' }}>{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="action-bar">
        <button className="btn-secondary" onClick={() => navigate('/student/upload')}>
          ← Back to Data
        </button>
        <button
          className="btn-primary"
          onClick={() => { if (hasAnyComplete) completeStep(3); else navigate('/student/results'); }}
        >
          Continue to Results →
        </button>
      </div>
    </div>
  );
}
