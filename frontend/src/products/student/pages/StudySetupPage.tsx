import React, { useState } from 'react';
import { BarChart3, Users, Shuffle, GitCompare, Search, Lightbulb, HelpCircle, X } from 'lucide-react';
import { useStudentWizard } from '../context/StudentWizardContext';
import '../student.css';

// ─── Study type data ──────────────────────────────────────────────────────────

const STUDY_TYPES = [
  {
    value: 'cross-sectional' as const,
    label: 'Cross-Sectional',
    Icon: BarChart3,
    desc: 'Measure variables at a single point in time',
    detail: 'Cross-sectional studies capture a "snapshot" of a population. They are ideal for measuring disease prevalence and exploring associations, but cannot establish causality.',
    analyses: ['Prevalence estimates', 'Chi-square tests', 'Logistic regression', 'Subgroup analysis'],
    reporting: ['STROBE checklist', 'Prevalence confidence intervals'],
    pitfalls: ['Cannot establish temporality', 'Selection bias', 'Recall bias'],
  },
  {
    value: 'cohort' as const,
    label: 'Cohort Study',
    Icon: Users,
    desc: 'Follow groups over time to compare outcomes',
    detail: 'Cohort studies follow exposed and unexposed groups over time to compare incidence of outcomes. They can establish temporality but are prone to loss to follow-up.',
    analyses: ['Kaplan-Meier curves', 'Cox proportional hazards', 'Incidence rate ratios', 'Sensitivity analysis'],
    reporting: ['STROBE cohort checklist', 'Time-to-event reporting'],
    pitfalls: ['Loss to follow-up bias', 'Confounding', 'Long follow-up required'],
  },
  {
    value: 'rct' as const,
    label: 'Randomized Controlled Trial',
    Icon: Shuffle,
    desc: 'Randomly assign interventions',
    detail: 'RCTs are the gold standard for causal inference. Randomization balances known and unknown confounders. Requires careful allocation concealment and blinding.',
    analyses: ['ITT primary analysis', 'Per-protocol analysis', 'Subgroup analysis', 'ANCOVA for continuous outcomes'],
    reporting: ['CONSORT checklist', 'SPIRIT protocol', 'Trial registration number'],
    pitfalls: ['Attrition bias', 'Performance bias', 'Open-label contamination'],
  },
  {
    value: 'case-control' as const,
    label: 'Case-Control',
    Icon: GitCompare,
    desc: 'Compare cases with controls retrospectively',
    detail: 'Case-control studies identify individuals with an outcome (cases) and compare their past exposures to matched controls. Efficient for rare diseases.',
    analyses: ['Odds ratios with 95% CIs', 'Adjusted logistic regression', 'Propensity score matching', 'Sensitivity analysis'],
    reporting: ['STROBE case-control checklist', 'Matching criteria description'],
    pitfalls: ['Recall bias', 'Selection bias in controls', 'Cannot calculate incidence'],
  },
  {
    value: 'systematic-review' as const,
    label: 'Systematic Review',
    Icon: Search,
    desc: 'Synthesize evidence from multiple studies',
    detail: 'Systematic reviews pool evidence from multiple studies using predefined search strategies. Meta-analysis can quantitatively synthesize results when studies are sufficiently homogeneous.',
    analyses: ['PRISMA flow diagram', 'Risk of bias assessment', 'Forest plot (meta-analysis)', 'Sensitivity analysis', 'Funnel plot for publication bias'],
    reporting: ['PRISMA 2020 checklist', 'PROSPERO registration', 'GRADE evidence table'],
    pitfalls: ['Publication bias', 'Heterogeneity (I²)', 'Language bias'],
  },
] as const;

type StudyTypeValue = typeof STUDY_TYPES[number]['value'];

const PLACEHOLDERS: Record<StudyTypeValue, string> = {
  'cross-sectional': 'What is the prevalence of X among Y population?',
  'cohort': 'Is exposure to X associated with outcome Y over time?',
  'rct': 'Does intervention X improve outcome Y compared to control?',
  'case-control': 'Is X a risk factor for Y when comparing cases and controls?',
  'systematic-review': 'What is the effect of X on Y across published studies?',
};

// ─── Tooltip component ────────────────────────────────────────────────────────

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 4 }}>
      <HelpCircle
        size={14}
        color="#aaa"
        style={{ cursor: 'help' }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <span style={{
          position: 'absolute',
          bottom: '130%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1C2B3A',
          color: 'white',
          padding: '0.5rem 0.75rem',
          borderRadius: 6,
          fontSize: '0.78rem',
          width: 220,
          lineHeight: 1.4,
          zIndex: 99,
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

// ─── Chip input ───────────────────────────────────────────────────────────────

function ChipInput({ values, onChange }: { values: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      if (!values.includes(input.trim())) onChange([...values, input.trim()]);
      setInput('');
    }
  };
  return (
    <div className="chip-container">
      {values.map(v => (
        <span key={v} className="chip">
          {v}
          <button className="chip-remove" onClick={() => onChange(values.filter(x => x !== v))}>×</button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder={values.length === 0 ? 'Type and press Enter…' : ''}
        style={{ border: 'none', outline: 'none', flex: 1, minWidth: 120, fontSize: '0.875rem', padding: '0.15rem 0.25rem' }}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudySetupPage() {
  const { state, updateStudyConfig, completeStep } = useStudentWizard();
  const cfg = state.studyConfig;
  const [expandedType, setExpandedType] = useState<StudyTypeValue | null>(null);

  const selectedType = STUDY_TYPES.find(t => t.value === cfg.studyType);
  const canContinue = cfg.studyType !== '' && cfg.researchQuestion.trim() !== '' && cfg.primaryOutcome.trim() !== '';

  const handleTypeSelect = (val: StudyTypeValue) => {
    updateStudyConfig({ studyType: val });
  };

  const handleSave = () => {
    if (canContinue) completeStep(1);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1C2B3A', marginBottom: '0.25rem' }}>
        Step 1: Study Setup
      </h2>
      <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Define your study design and research question.
      </p>

      <div className="two-col-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
        {/* Left column */}
        <div>
          {/* Section A: Study Type */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1C2B3A', marginBottom: '1rem' }}>
              What type of study are you conducting?
            </h3>
            <div className="study-type-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {STUDY_TYPES.map(({ value, label, Icon, desc, detail }) => (
                <div
                  key={value}
                  className={`study-type-card${cfg.studyType === value ? ' selected' : ''}`}
                  onClick={() => handleTypeSelect(value)}
                >
                  <Icon size={22} color={cfg.studyType === value ? '#2E86C1' : '#888'} />
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1C2B3A' }}>{label}</div>
                  <div style={{ fontSize: '0.78rem', color: '#666', lineHeight: 1.4 }}>{desc}</div>
                  <button
                    onClick={e => { e.stopPropagation(); setExpandedType(expandedType === value ? null : value); }}
                    style={{ background: 'none', border: 'none', color: '#2E86C1', fontSize: '0.78rem', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                  >
                    {expandedType === value ? '↑ Less' : '↓ Learn more'}
                  </button>
                  {expandedType === value && (
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#444', lineHeight: 1.5 }}>{detail}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Research Question (shown after type selected) */}
          {cfg.studyType && (
            <div style={{ background: 'white', borderRadius: 10, padding: '1.5rem', border: '1px solid #E5E9EF', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1C2B3A', margin: 0 }}>
                Define your research question
              </h3>

              {/* Research Question */}
              <div>
                <label className="rf-label">
                  Research Question *
                  <Tooltip text="The central question your study aims to answer. Use PICO (Population, Intervention, Comparison, Outcome) framework." />
                </label>
                <input
                  type="text"
                  className="rf-input"
                  placeholder={PLACEHOLDERS[cfg.studyType as StudyTypeValue]}
                  value={cfg.researchQuestion}
                  onChange={e => updateStudyConfig({ researchQuestion: e.target.value })}
                />
              </div>

              {/* Study Title */}
              <div>
                <label className="rf-label">
                  Study Title
                  <Tooltip text="A concise, descriptive title for your study or analysis session." />
                </label>
                <input
                  type="text"
                  className="rf-input"
                  placeholder="e.g., Risk factors for malaria in rural Kenya: a cohort study"
                  value={cfg.studyTitle}
                  onChange={e => updateStudyConfig({ studyTitle: e.target.value })}
                />
              </div>

              {/* Primary Outcome */}
              <div>
                <label className="rf-label">
                  Primary Outcome Variable *
                  <Tooltip text="The main variable you are measuring to answer your research question (e.g., mortality, HIV status, blood pressure)." />
                </label>
                <input
                  type="text"
                  className="rf-input"
                  placeholder="e.g., all-cause mortality at 12 months"
                  value={cfg.primaryOutcome}
                  onChange={e => updateStudyConfig({ primaryOutcome: e.target.value })}
                />
              </div>

              {/* Secondary Outcomes */}
              <div>
                <label className="rf-label">
                  Secondary Outcomes
                  <Tooltip text="Additional outcomes you will measure. Type and press Enter to add each one." />
                </label>
                <ChipInput
                  values={cfg.secondaryOutcomes}
                  onChange={v => updateStudyConfig({ secondaryOutcomes: v })}
                />
                <p className="rf-help-text">Type and press Enter to add outcomes</p>
              </div>

              {/* Exposure Variable */}
              <div>
                <label className="rf-label">
                  Exposure / Intervention Variable
                  <Tooltip text="The main exposure, treatment, or intervention of interest (e.g., malaria bed net use, antiretroviral therapy)." />
                </label>
                <input
                  type="text"
                  className="rf-input"
                  placeholder="e.g., antiretroviral therapy initiation"
                  value={cfg.exposureVariable}
                  onChange={e => updateStudyConfig({ exposureVariable: e.target.value })}
                />
              </div>

              {/* Sample Size */}
              <div>
                <label className="rf-label">
                  Target Sample Size (optional)
                  <Tooltip text="Your planned or available sample size. Used to assess statistical power." />
                </label>
                <input
                  type="number"
                  className="rf-input"
                  placeholder="e.g., 500"
                  min={1}
                  value={cfg.sampleSizeTarget ?? ''}
                  onChange={e => updateStudyConfig({ sampleSizeTarget: e.target.value ? parseInt(e.target.value) : null })}
                  style={{ width: 200 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right column — smart recommendations */}
        {selectedType && (
          <div>
            <div className="rec-panel" style={{ position: 'sticky', top: 80 }}>
              <div className="rec-panel-header">
                <Lightbulb size={18} color="#7D4E1A" />
                Study Guidance
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7D4E1A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                  Recommended Analyses
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {selectedType.analyses.map(a => (
                    <li key={a} style={{ fontSize: '0.82rem', color: '#5A4A1A', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                      <span style={{ color: '#E67E22', marginTop: 2 }}>•</span> {a}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7D4E1A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                  Required Reporting
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {selectedType.reporting.map(r => (
                    <li key={r} style={{ fontSize: '0.82rem', color: '#5A4A1A', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                      <span style={{ color: '#27AE60', marginTop: 2 }}>✓</span> {r}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#A93226', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                  Common Pitfalls
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {selectedType.pitfalls.map(p => (
                    <li key={p} style={{ fontSize: '0.82rem', color: '#7B241C', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                      <span style={{ color: '#C0392B', marginTop: 2 }}>⚠</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="action-bar">
        <span style={{ fontSize: '0.875rem', color: '#888' }}>
          {!canContinue && 'Fill in study type, research question, and primary outcome to continue.'}
        </span>
        <button className="btn-primary" onClick={handleSave} disabled={!canContinue}>
          Save &amp; Continue →
        </button>
      </div>
    </div>
  );
}
