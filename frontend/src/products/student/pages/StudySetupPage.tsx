import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Shuffle, GitCompare, Search, Lightbulb, HelpCircle, X, Sparkles, ToggleLeft, ToggleRight, ChevronRight } from 'lucide-react';
import { useStudentWizard, generateResearchQuestionFromStructure } from '../context/StudentWizardContext';
import LearningTip from '../components/LearningTip';
import StepSuccessMessage from '../components/StepSuccessMessage';
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
    designDescription: 'A cross-sectional study measures variables at a single point in time. It can assess prevalence and associations but cannot determine causation or temporal relationships.',
    guideline: 'STROBE' as const,
    guidelineExplanation: 'Observational studies should follow STROBE guidelines for transparent reporting.',
    suggestedAnalyses: 'Table 1, Chi-square/t-tests, Logistic or Linear Regression',
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
    designDescription: 'A cohort study follows groups of participants over time to compare outcomes between exposed and unexposed groups. It can estimate incidence and relative risk.',
    guideline: 'STROBE' as const,
    guidelineExplanation: 'Observational cohort studies should follow STROBE guidelines for transparent reporting.',
    suggestedAnalyses: 'Table 1, Kaplan-Meier Curves, Cox Regression, Sensitivity Analysis',
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
    designDescription: 'A randomized controlled trial randomly assigns participants to intervention or control groups. It is the gold standard for establishing causation.',
    guideline: 'CONSORT' as const,
    guidelineExplanation: 'Your RCT should follow CONSORT reporting guidelines. This ensures transparent reporting of trial design, conduct, and results.',
    suggestedAnalyses: 'Table 1, Primary Outcome Analysis, Per-Protocol Analysis, Subgroup Analysis',
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
    designDescription: 'A case-control study compares participants with a condition (cases) to those without (controls) to identify risk factors retrospectively.',
    guideline: 'STROBE' as const,
    guidelineExplanation: 'Observational case-control studies should follow STROBE guidelines for transparent reporting.',
    suggestedAnalyses: 'Table 1, Odds Ratios, Adjusted Logistic Regression',
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
    designDescription: 'A systematic review synthesizes evidence from multiple studies using a structured search and quality assessment process.',
    guideline: 'PRISMA' as const,
    guidelineExplanation: 'Systematic reviews should follow PRISMA guidelines for transparent reporting.',
    suggestedAnalyses: 'PRISMA Flow, Risk of Bias, Meta-Analysis, Sensitivity Analysis',
  },
] as const;

type StudyTypeValue = typeof STUDY_TYPES[number]['value'];

const PLACEHOLDERS: Record<StudyTypeValue, string> = {
  'cross-sectional': 'What is the prevalence of X among Y population?',
  cohort: 'Is exposure to X associated with outcome Y over time?',
  rct: 'Does intervention X improve outcome Y compared to control?',
  'case-control': 'Is X a risk factor for Y when comparing cases and controls?',
  'systematic-review': 'What is the effect of X on Y across published studies?',
};

const GUIDELINE_COLORS: Record<string, { bg: string; color: string }> = {
  CONSORT: { bg: '#EBF5FB', color: '#2E86C1' },
  STROBE:  { bg: '#E9F7EF', color: '#1E8449' },
  PRISMA:  { bg: '#F5EEF8', color: '#7D3C98' },
  MOOSE:   { bg: '#FEF9E7', color: '#B7950B' },
  ARRIVE:  { bg: '#FEF5E7', color: '#D35400' },
};

// ─── Enhanced Tooltip ─────────────────────────────────────────────────────────

function InfoTooltip({ content }: { content: string }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 4 }}>
      <HelpCircle
        size={14}
        color="#aaa"
        style={{ cursor: 'pointer' }}
        onClick={() => setShow(s => !s)}
      />
      {show && (
        <div style={{
          position: 'absolute',
          bottom: '130%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'white',
          color: '#1C2B3A',
          padding: '0.75rem',
          borderRadius: 8,
          fontSize: '0.8rem',
          width: 300,
          lineHeight: 1.5,
          zIndex: 200,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          border: '1px solid #E5E9EF',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <div />
            <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 0 }}>
              <X size={13} />
            </button>
          </div>
          {content}
        </div>
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

// ─── Research Structure Panel ─────────────────────────────────────────────────

function ResearchStructurePanel({ studyTypeValue }: { studyTypeValue: StudyTypeValue }) {
  const st = STUDY_TYPES.find(t => t.value === studyTypeValue);
  if (!st) return null;
  const gColors = GUIDELINE_COLORS[st.guideline] ?? { bg: '#F4F7FA', color: '#555' };

  return (
    <div style={{
      background: '#F0F4F8',
      borderRadius: 10,
      padding: '1.25rem',
      borderLeft: '4px solid #2E86C1',
      border: '1px solid #D5E3F0',
      marginTop: '1rem',
    }}>
      <div style={{ fontWeight: 700, color: '#1C2B3A', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
        Study Design Overview
      </div>

      <p style={{ fontSize: '0.83rem', color: '#444', lineHeight: 1.6, margin: '0 0 1rem' }}>
        {st.designDescription}
      </p>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
          Reporting Guideline
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ padding: '3px 12px', background: gColors.bg, color: gColors.color, borderRadius: 99, fontWeight: 700, fontSize: '0.82rem', border: `1px solid ${gColors.color}40` }}>
            {st.guideline}
          </span>
          <span style={{ fontSize: '0.78rem', color: '#555' }}>{st.guidelineExplanation}</span>
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={12} color="#E67E22" /> Analyses we'll guide you through
        </div>
        <div style={{ fontSize: '0.82rem', color: '#444', lineHeight: 1.7 }}>
          {st.suggestedAnalyses}
        </div>
      </div>
    </div>
  );
}

// ─── Research Question Builder ────────────────────────────────────────────────

function ResearchQuestionBuilder({ studyTypeValue }: { studyTypeValue: StudyTypeValue }) {
  const { state, updateResearchStructure, updateStudyConfig } = useStudentWizard();
  const rs = state.researchStructure;
  const generatedQ = generateResearchQuestionFromStructure(rs, studyTypeValue);

  return (
    <div style={{ background: 'white', borderRadius: 10, border: '1px solid #E5E9EF', padding: '1.25rem', marginTop: '1rem' }}>
      <div style={{ fontWeight: 700, color: '#1C2B3A', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
        Research Question Builder
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
        {([
          { key: 'population', label: 'Population', placeholder: 'e.g., pregnant women in rural Ghana' },
          { key: 'exposure',   label: 'Exposure / Intervention', placeholder: 'e.g., mobile health reminders' },
          { key: 'outcome',    label: 'Outcome', placeholder: 'e.g., antenatal care attendance' },
          { key: 'timeframe',  label: 'Timeframe', placeholder: 'e.g., during pregnancy' },
        ] as const).map(({ key, label, placeholder }) => (
          <div key={key}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#555', marginBottom: '0.3rem' }}>
              {label}
            </label>
            <input
              type="text"
              className="rf-input"
              placeholder={placeholder}
              value={(rs as any)[key] ?? ''}
              onChange={e => updateResearchStructure({ [key]: e.target.value })}
            />
          </div>
        ))}
      </div>
      {(rs.population || rs.exposure || rs.outcome) && (
        <div style={{ marginTop: '1rem', background: '#F0F4F8', borderRadius: 8, padding: '0.875rem', border: '1px solid #D5E3F0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
            Generated Research Question
          </div>
          <p style={{ margin: '0 0 0.6rem', fontSize: '0.875rem', color: '#1C2B3A', lineHeight: 1.6, fontStyle: 'italic' }}>
            "{generatedQ}"
          </p>
          <button
            onClick={() => updateStudyConfig({ researchQuestion: generatedQ })}
            style={{
              padding: '0.35rem 0.85rem',
              background: '#2E86C1',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Use this question <ChevronRight size={12} style={{ display: 'inline' }} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudySetupPage() {
  const { state, updateStudyConfig, completeStep } = useStudentWizard();
  const cfg = state.studyConfig;
  const [expandedType, setExpandedType] = useState<StudyTypeValue | null>(null);
  const [showQBuilder, setShowQBuilder] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Show success if coming from a step completion
    if (state.maxCompletedStep >= 5) setShowSuccess(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      {showSuccess && <StepSuccessMessage step={5} onDismiss={() => setShowSuccess(false)} />}

      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1C2B3A', marginBottom: '0.25rem' }}>
        Step 1: Study Setup
      </h2>
      <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Define your study design and research question.
      </p>

      <LearningTip
        visible={state.learningMode}
        title="Getting started with research design"
        explanation="Your study design determines everything — which analyses you'll run, which reporting guidelines to follow, and how you interpret your results. Take time to choose the right design for your research question."
        relatedConcepts={['Study design', 'Research question', 'PICO framework']}
      />

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

          {/* Study Design Description Panel — shown after type selected */}
          {cfg.studyType && (
            <ResearchStructurePanel studyTypeValue={cfg.studyType as StudyTypeValue} />
          )}

          {cfg.studyType && (
            <LearningTip
              visible={state.learningMode}
              title={`What is a ${selectedType?.label}?`}
              explanation={selectedType?.detail ?? ''}
              relatedConcepts={['Study design', 'Epidemiology', 'Research methods']}
            />
          )}

          {/* Section B: Research Question (shown after type selected) */}
          {cfg.studyType && (
            <div style={{ background: 'white', borderRadius: 10, padding: '1.5rem', border: '1px solid #E5E9EF', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1C2B3A', margin: 0 }}>
                  Define your research question
                </h3>
                <button
                  onClick={() => setShowQBuilder(b => !b)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: '1px solid #D5D8DC', borderRadius: 20, padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.78rem', color: '#555' }}
                >
                  {showQBuilder ? <ToggleRight size={14} color="#2E86C1" /> : <ToggleLeft size={14} />}
                  Help me write my question
                </button>
              </div>

              {showQBuilder && <ResearchQuestionBuilder studyTypeValue={cfg.studyType as StudyTypeValue} />}

              {/* Research Question */}
              <div>
                <label className="rf-label">
                  Research Question *
                  <InfoTooltip content="The central question your study aims to answer. Use PICO (Population, Intervention, Comparison, Outcome) framework. Be specific and measurable." />
                </label>
                <input
                  type="text"
                  className="rf-input"
                  placeholder={PLACEHOLDERS[cfg.studyType as StudyTypeValue]}
                  value={cfg.researchQuestion}
                  onChange={e => updateStudyConfig({ researchQuestion: e.target.value })}
                />
              </div>

              <LearningTip
                visible={state.learningMode}
                title="Writing a good research question"
                explanation="A good research question is specific, measurable, and answerable with data. Use the PICO framework: Population (who?), Intervention/Exposure (what?), Comparison (compared to what?), and Outcome (what outcome?)."
                relatedConcepts={['PICO', 'Research question', 'Hypothesis']}
              />

              {/* Study Title */}
              <div>
                <label className="rf-label">
                  Study Title
                  <InfoTooltip content="A concise, descriptive title for your study. A good title includes the study design, population, and main outcome." />
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
                  <InfoTooltip content="The main result you want to measure. Choose ONE specific, measurable outcome. Example: 'Number of antenatal care visits' or 'Mortality at 30 days'. Your entire analysis will be designed around this outcome." />
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
                  <InfoTooltip content="Additional results you'll measure alongside your primary outcome. These are important but not the main focus. Example: 'Patient satisfaction' or 'Length of hospital stay'. Type and press Enter to add each one." />
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
                  <InfoTooltip content="The factor you think might influence the outcome. This is what you're investigating. Example: 'Treatment group' or 'Smoking status'. For RCTs, this is the intervention." />
                </label>
                <input
                  type="text"
                  className="rf-input"
                  placeholder="e.g., antiretroviral therapy initiation"
                  value={cfg.exposureVariable}
                  onChange={e => updateStudyConfig({ exposureVariable: e.target.value })}
                />
              </div>

              {/* Covariates info */}
              <div style={{ background: '#F4F7FA', borderRadius: 8, padding: '0.75rem', fontSize: '0.82rem', color: '#555', lineHeight: 1.5, display: 'flex', gap: '0.5rem' }}>
                <InfoTooltip content="Variables that might affect both your exposure and outcome. You'll want to adjust for these in your analysis. Common examples: age, sex, socioeconomic status, BMI, region." />
                <span><strong>Covariates/Confounders</strong> — You'll assign these in Step 2 when you upload your data. They are variables that might affect both your exposure and outcome.</span>
              </div>

              {/* Sample Size */}
              <div>
                <label className="rf-label">
                  Target Sample Size (optional)
                  <InfoTooltip content="Your planned or available sample size. Used to assess statistical power. Smaller samples may not detect true effects." />
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
