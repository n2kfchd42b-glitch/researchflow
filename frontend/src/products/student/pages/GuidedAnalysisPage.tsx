import React, { useState } from 'react';
import { CheckCircle, Circle, ChevronDown, ChevronUp, ExternalLink, AlertCircle, AlertTriangle, Info, RotateCcw, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStudentWizard } from '../context/StudentWizardContext';
import AnalysisPipelineVisual from '../components/AnalysisPipelineVisual';
import LearningTip from '../components/LearningTip';
import AnalysisLoadingState from '../components/AnalysisLoadingState';
import WizardEmptyState from '../components/WizardEmptyState';
import StepSuccessMessage from '../components/StepSuccessMessage';
import '../student.css';

// ─── Analysis plan per study type ────────────────────────────────────────────

interface ChecklistItem {
  id: string;
  label: string;
  why: string;
  path: string;
  learningTip: string;
}

const STUDY_PLANS: Record<string, ChecklistItem[]> = {
  'cross-sectional': [
    { id: 'table1', label: 'Table 1: Descriptive statistics by group', why: 'Summarizes your sample characteristics and shows the distribution of key variables — essential for every paper.', path: '/student/table1', learningTip: 'A Table 1 summarizes your participants\' characteristics. It\'s the first table in almost every published study, helping readers understand who was studied.' },
    { id: 'bivariate', label: 'Chi-square / t-tests for bivariate analysis', why: 'Tests whether there is an association between each predictor and your outcome without adjustment.', path: '/student/descriptive', learningTip: 'Chi-square tests compare categorical variables. T-tests compare means between two groups. These are your unadjusted (crude) analyses.' },
    { id: 'regression', label: 'Logistic or linear regression', why: 'Multivariable regression adjusts for confounders to give an independent estimate of the exposure-outcome association.', path: '/student/descriptive', learningTip: 'Logistic regression estimates the odds of an outcome occurring. Use it when your outcome is yes/no (binary). Linear regression is for continuous outcomes.' },
    { id: 'subgroup', label: 'Subgroup analysis', why: 'Tests whether the effect varies across key subgroups (e.g., by age, sex, or setting).', path: '/student/subgroup', learningTip: 'Subgroup analysis checks whether the exposure-outcome relationship differs in different groups. Pre-specify subgroups before analysis to avoid bias.' },
  ],
  cohort: [
    { id: 'table1', label: 'Table 1: Baseline characteristics', why: 'Shows whether the exposed and unexposed groups were similar at baseline — crucial for cohort studies.', path: '/student/table1', learningTip: 'A Table 1 summarizes your participants\' characteristics. It\'s the first table in almost every published study.' },
    { id: 'km', label: 'Kaplan-Meier survival curves', why: 'Visualizes time-to-event outcomes and compares survival between groups with log-rank test.', path: '/student/survival', learningTip: 'Survival analysis examines time until an event occurs. The Kaplan-Meier curve shows the probability of not experiencing the event over time.' },
    { id: 'cox', label: 'Cox proportional hazards regression', why: 'Provides adjusted hazard ratios for the exposure-outcome relationship, accounting for confounders and time.', path: '/student/survival', learningTip: 'Cox regression provides hazard ratios — the ratio of the rate of event occurrence between exposed and unexposed groups, adjusted for confounders.' },
    { id: 'sensitivity', label: 'Sensitivity analysis', why: 'Tests robustness of your main findings to alternative assumptions or analytical choices.', path: '/student/sensitivity', learningTip: 'Sensitivity analyses test whether your results hold up under different assumptions. They strengthen confidence in your findings.' },
  ],
  rct: [
    { id: 'table1', label: 'Table 1: Baseline by arm', why: 'Demonstrates successful randomization by showing balance across trial arms at baseline.', path: '/student/table1', learningTip: 'A Table 1 in an RCT checks that randomization worked — groups should be similar at baseline. Significant p-values here may indicate randomization failure.' },
    { id: 'itt', label: 'Primary outcome analysis (ITT)', why: 'Intention-to-treat analysis preserves randomization and is the pre-specified primary analysis for most RCTs.', path: '/student/descriptive', learningTip: 'Intention-to-treat (ITT) analysis includes all randomized participants regardless of whether they completed the intervention. This preserves the benefits of randomization.' },
    { id: 'pp', label: 'Per-protocol analysis', why: 'Assesses efficacy among those who adhered to the protocol — a sensitivity check for ITT.', path: '/student/descriptive', learningTip: 'Per-protocol analysis includes only participants who followed the study protocol. It estimates efficacy (how well the treatment works if taken correctly).' },
    { id: 'subgroup', label: 'Subgroup analysis', why: 'Pre-specified subgroup analyses can identify which patient populations benefit most from the intervention.', path: '/student/subgroup', learningTip: 'Subgroup analyses should be pre-specified to avoid data dredging. Report all pre-specified subgroups, not just those with significant results.' },
  ],
  'case-control': [
    { id: 'table1', label: 'Table 1: Cases vs Controls', why: 'Describes and compares baseline characteristics to check matching quality and identify confounders.', path: '/student/table1', learningTip: 'A Table 1 in a case-control study compares cases and controls. Large differences in baseline characteristics may indicate matching problems.' },
    { id: 'or', label: 'Odds ratios with 95% CIs', why: 'The primary measure of association in case-control studies — how much more likely cases were exposed.', path: '/student/descriptive', learningTip: 'The odds ratio is the main result in case-control studies. It tells you how much more likely cases were exposed to the risk factor compared to controls.' },
    { id: 'logistic', label: 'Adjusted logistic regression', why: 'Controls for potential confounders to give an independent estimate of the exposure-outcome OR.', path: '/student/descriptive', learningTip: 'Adjusted logistic regression controls for confounders, giving a more accurate estimate of the true exposure-outcome relationship.' },
    { id: 'psm', label: 'Propensity score matching', why: 'Alternative approach to adjust for confounding, mimicking randomization to balance baseline characteristics.', path: '/student/survival', learningTip: 'Propensity score matching creates matched pairs of cases and controls based on their probability of exposure, reducing confounding.' },
  ],
  'systematic-review': [
    { id: 'prisma', label: 'PRISMA flow diagram', why: 'Documents the study selection process transparently — required by all major journals for systematic reviews.', path: '/student/prisma', learningTip: 'The PRISMA flow diagram documents how you searched for studies and why you included or excluded them. It\'s required by most journals.' },
    { id: 'rob', label: 'Risk of bias assessment', why: 'Evaluates methodological quality of included studies and identifies potential sources of bias.', path: '/student/descriptive', learningTip: 'Risk of bias assessment evaluates the methodological quality of each included study. It helps readers understand how much to trust the results.' },
    { id: 'forest', label: 'Meta-analysis (forest plot)', why: 'Quantitatively synthesizes results across studies to give a pooled effect estimate with precision.', path: '/student/forest-plot', learningTip: 'Meta-analysis combines results from multiple studies to get a more precise estimate of an effect. The forest plot visualizes each study\'s result and the pooled estimate.' },
    { id: 'sensitivity', label: 'Sensitivity analysis', why: 'Tests whether findings are robust by excluding low-quality studies or using different analytical models.', path: '/student/sensitivity', learningTip: 'Sensitivity analyses in systematic reviews test whether excluding certain studies changes your conclusions. This assesses robustness of findings.' },
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

type RunStatus = 'not-started' | 'running' | 'completed' | 'needs-review';

export default function GuidedAnalysisPage() {
  const { state, completeStep } = useStudentWizard();
  const navigate = useNavigate();
  const [expandedWhy, setExpandedWhy] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<Record<string, RunStatus>>({});
  const [confirmRerun, setConfirmRerun] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(state.maxCompletedStep === 2);

  const studyType = state.studyConfig.studyType || 'cross-sectional';
  const plan = STUDY_PLANS[studyType] ?? STUDY_PLANS['cross-sectional'];

  const completedIds = new Set(state.analyses.map(a => a.type));
  const hasAnyComplete = state.analyses.length > 0;
  const hasOutcome = state.dataset?.columns.some(c => c.role === 'outcome') ?? false;
  const hasDataset = state.dataset !== null;

  const getStatus = (id: string): 'complete' | 'not-started' => {
    return completedIds.has(id) ? 'complete' : 'not-started';
  };

  const getRunStatus = (id: string): RunStatus => {
    if (completedIds.has(id)) return 'completed';
    return runStatus[id] ?? 'not-started';
  };

  const handleRunAnalysis = (item: ChecklistItem) => {
    if (!hasOutcome) return;
    const status = getStatus(item.id);
    if (status === 'complete') {
      setConfirmRerun(item.id);
      return;
    }
    setRunStatus(prev => ({ ...prev, [item.id]: 'running' }));
    setTimeout(() => {
      setRunStatus(prev => ({ ...prev, [item.id]: 'not-started' }));
      navigate(item.path);
    }, 800);
  };

  const getValidationMessages = (item: ChecklistItem) => {
    const msgs: Array<{ type: 'error' | 'warning' | 'info'; text: string }> = [];
    if (!hasDataset) msgs.push({ type: 'error', text: 'Upload a dataset in Step 2 first' });
    if (hasDataset && !hasOutcome) msgs.push({ type: 'error', text: 'Assign an outcome variable in Step 2 first' });
    if (hasDataset && state.dataset && state.dataset.rowCount < 30) msgs.push({ type: 'warning', text: `Your dataset has only ${state.dataset.rowCount} rows — results may not be statistically reliable` });
    const outcomeMissing = state.dataset?.columns.find(c => c.role === 'outcome')?.missingPercent ?? 0;
    if (outcomeMissing > 15) msgs.push({ type: 'warning', text: `Your outcome variable has ${outcomeMissing.toFixed(1)}% missing data — consider addressing this first` });
    const hasCovariates = state.dataset?.columns.some(c => c.role === 'covariate') ?? false;
    if ((item.id === 'regression' || item.id === 'cox' || item.id === 'logistic') && !hasCovariates) {
      msgs.push({ type: 'info', text: 'Running unadjusted analysis. Consider adding covariates in Step 2 for a more rigorous result.' });
    }
    return msgs;
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {showSuccess && <StepSuccessMessage step={2} onDismiss={() => setShowSuccess(false)} />}

      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1C2B3A', marginBottom: '0.25rem' }}>
        Step 3: Guided Analysis
      </h2>
      <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Your recommended analysis plan for a <strong>{studyType.replace('-', ' ')}</strong> study.
        Run each analysis and return here to check them off.
      </p>

      <LearningTip
        visible={state.learningMode}
        title="Why does study design determine which analysis to use?"
        explanation="Different study designs answer different questions and have different assumptions. A cross-sectional study can't give hazard ratios (that requires time data). An RCT's randomization allows for stronger causal claims than an observational study. Your statistical approach must match your design."
        relatedConcepts={['Study design', 'Statistical methods', 'Causal inference']}
      />

      {/* Analysis Pipeline Visual */}
      {hasDataset && <AnalysisPipelineVisual state={state} />}

      {!hasDataset && (
        <WizardEmptyState
          icon={BarChart3}
          title="Run your first analysis to see results"
          description="Upload your dataset in Step 2 first, then come back to run your analyses."
          actionLabel="Go to Data Upload"
          onAction={() => navigate('/student/upload')}
        />
      )}

      {/* Recommended plan */}
      {hasDataset && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1C2B3A', marginBottom: '0.75rem' }}>
            Recommended Analysis Plan
          </h3>
          {plan.map(item => {
            const status = getStatus(item.id);
            const rStatus = getRunStatus(item.id);
            const isExpanded = expandedWhy === item.id;
            const validations = getValidationMessages(item);
            const canRun = hasOutcome && hasDataset;

            return (
              <div key={item.id} className={`analysis-card ${status}`} style={{ position: 'relative', overflow: 'hidden' }}>
                {rStatus === 'running' && <AnalysisLoadingState analysisName={item.label} />}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {status === 'complete'
                    ? <CheckCircle size={20} color="#5A8A6A" />
                    : <Circle size={20} color="#D5D8DC" />
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1C2B3A' }}>{item.label}</div>
                    {status === 'complete' && (
                      <div style={{ fontSize: '0.78rem', color: '#27AE60', marginTop: 2 }}>Completed ✓</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                    <button
                      onClick={() => setExpandedWhy(isExpanded ? null : item.id)}
                      style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      Why? {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>

                    {confirmRerun === item.id ? (
                      <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', fontSize: '0.78rem' }}>
                        <span style={{ color: '#888' }}>Run again?</span>
                        <button
                          onClick={() => { setConfirmRerun(null); navigate(item.path); }}
                          style={{ padding: '0.25rem 0.6rem', background: '#E67E22', color: 'white', border: 'none', borderRadius: 5, fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                        >Yes</button>
                        <button
                          onClick={() => setConfirmRerun(null)}
                          style={{ padding: '0.25rem 0.6rem', background: '#F4F7FA', color: '#555', border: '1px solid #ddd', borderRadius: 5, fontSize: '0.78rem', cursor: 'pointer' }}
                        >No</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRunAnalysis(item)}
                        disabled={!canRun || rStatus === 'running'}
                        style={{
                          padding: '0.35rem 0.85rem',
                          background: canRun ? '#2E86C1' : '#D5D8DC',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: canRun ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          opacity: rStatus === 'running' ? 0.6 : 1,
                        }}
                      >
                        {status === 'complete' ? <><RotateCcw size={12} /> Re-run</> : <>Run Analysis <ExternalLink size={12} /></>}
                      </button>
                    )}
                  </div>
                </div>

                {/* Validation messages */}
                {validations.length > 0 && (
                  <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {validations.map((v, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: '0.4rem', alignItems: 'flex-start',
                        fontSize: '0.78rem', padding: '0.35rem 0.6rem', borderRadius: 6,
                        background: v.type === 'error' ? '#FDEDEC' : v.type === 'warning' ? '#FEF9E7' : '#EBF5FB',
                        color: v.type === 'error' ? '#A93226' : v.type === 'warning' ? '#B7950B' : '#1A6EA6',
                      }}>
                        {v.type === 'error' && <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />}
                        {v.type === 'warning' && <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />}
                        {v.type === 'info' && <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />}
                        {v.text}
                      </div>
                    ))}
                  </div>
                )}

                {isExpanded && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #F0F4FA', fontSize: '0.85rem', color: '#555', lineHeight: 1.5 }}>
                    {item.why}
                    {state.learningMode && (
                      <div style={{ marginTop: '0.5rem', padding: '0.6rem 0.75rem', background: '#FFF9E6', borderRadius: 6, fontSize: '0.8rem', color: '#7D4E1A', borderLeft: '3px solid #E67E22' }}>
                        💡 {item.learningTip}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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

