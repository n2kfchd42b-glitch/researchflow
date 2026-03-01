import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp, BookOpen, FileSearch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStudentWizard, AnalysisResult, AnalysisInterpretation } from '../context/StudentWizardContext';
import InterpretationCard from '../components/InterpretationCard';
import AssumptionCheckPanel from '../components/AssumptionCheckPanel';
import LearningTip from '../components/LearningTip';
import WizardEmptyState from '../components/WizardEmptyState';
import StepSuccessMessage from '../components/StepSuccessMessage';
import '../student.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  success: { icon: CheckCircle, color: '#27AE60', bg: '#E9F7EF', label: 'Strong', badgeClass: 'badge-success' },
  warning: { icon: AlertTriangle, color: '#D4AC0D', bg: '#FEF9E7', label: 'Review Needed', badgeClass: 'badge-warning' },
  error:   { icon: XCircle,      color: '#A93226', bg: '#FDEDEC', label: 'Issue',          badgeClass: 'badge-error' },
};

function buildInterpretation(analysis: AnalysisResult, state: any): AnalysisInterpretation {
  const exposure = state.studyConfig.exposureVariable || 'the exposure';
  const outcome = state.studyConfig.primaryOutcome || 'the outcome';
  const covariates = state.dataset?.columns.filter((c: any) => c.role === 'covariate').map((c: any) => c.name).join(', ') || 'covariates';
  const N = state.dataset?.rowCount ?? 0;
  const type = analysis.type;

  let plainLanguage = '';
  let statisticalSummary = '';
  let academicSentence = '';
  let effectDirection: AnalysisInterpretation['effectDirection'] = 'unclear';
  const warnings: string[] = [];

  if (type === 'table1') {
    plainLanguage = `Your Table 1 shows the baseline characteristics of your study participants. Review whether key variables are balanced across groups. Large differences at baseline may introduce confounding.`;
    statisticalSummary = `Baseline characteristics presented as mean (SD) for continuous variables and n (%) for categorical variables.\n\nReview p-values: values < 0.05 indicate significant differences between groups.`;
    academicSentence = `Baseline characteristics of study participants are presented in Table 1. Variables are reported as mean (standard deviation) for continuous measures and as frequencies (percentages) for categorical variables.`;
    effectDirection = 'null';
  } else if (type === 'km' || type === 'cox') {
    plainLanguage = `The survival analysis examined time until ${outcome} in participants with and without ${exposure}. Compare the curves — a larger gap between groups indicates a stronger association.`;
    statisticalSummary = `Log-rank test p-value from Kaplan-Meier analysis.\n\nCox regression provides hazard ratio (HR) with 95% CI.\nHR > 1: higher rate of event in exposed group\nHR < 1: lower rate of event in exposed group`;
    academicSentence = `Kaplan-Meier survival curves were compared using the log-rank test. Cox proportional hazards regression was used to estimate the adjusted hazard ratio for the association between ${exposure} and ${outcome}, adjusting for ${covariates}.`;
    effectDirection = 'unclear';
  } else if (type === 'regression' || type === 'logistic' || type === 'or' || type === 'itt' || type === 'pp') {
    plainLanguage = `The regression analysis estimated the association between ${exposure} and ${outcome} among ${N} participants. An odds ratio > 1 means higher odds of the outcome in the exposed group.`;
    statisticalSummary = `Odds Ratio (OR) with 95% Confidence Interval (95% CI)\np-value from logistic regression model\nSample size: N = ${N}\n\nOR > 1: increased odds of outcome\nOR < 1: decreased odds of outcome\nOR ≈ 1: no association`;
    academicSentence = `Logistic regression was used to estimate the odds ratio for the association between ${exposure} and ${outcome} (OR [95% CI], p-value), adjusting for ${covariates} among ${N} participants.`;
    effectDirection = 'unclear';
    if (N < 100) warnings.push(`Small sample size (N = ${N}) — interpret results with caution`);
  } else if (type === 'forest' || type === 'prisma' || type === 'rob') {
    plainLanguage = `The meta-analysis pooled results from multiple studies to provide a combined estimate of the association between ${exposure} and ${outcome}. Review heterogeneity (I²) — values > 75% suggest high variability across studies.`;
    statisticalSummary = `Pooled effect estimate with 95% CI from random-effects meta-analysis\nI² statistic for heterogeneity\nNumber of studies: check forest plot`;
    academicSentence = `A random-effects meta-analysis was performed to pool estimates of the association between ${exposure} and ${outcome} from included studies. Heterogeneity was assessed using the I² statistic.`;
    effectDirection = 'unclear';
  } else {
    plainLanguage = `${analysis.summary}`;
    statisticalSummary = `Analysis: ${analysis.title}\nCompleted: ${new Date(analysis.completedAt).toLocaleString()}\n\n${analysis.summary}`;
    academicSentence = `${analysis.title} was performed as part of the statistical analysis plan.`;
  }

  if (N > 0 && N < 30) warnings.push('Very small sample size (N < 30) — results may not be reliable');
  const outcomeMissingPct = state.dataset?.columns.find((c: any) => c.role === 'outcome')?.missingPercent ?? 0;
  if (outcomeMissingPct > 15) warnings.push(`High missing data in outcome variable (${outcomeMissingPct.toFixed(1)}%)`);
  if (analysis.status === 'warning') warnings.push('This analysis returned warnings — review the detailed output');

  return {
    analysisId: analysis.id,
    plainLanguage,
    statisticalSummary,
    academicSentence,
    effectDirection,
    warnings,
    assumptions: [],
  };
}

function AnalysisCard({ analysis }: { analysis: AnalysisResult }) {
  const [expanded, setExpanded] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const { state, removeAnalysis } = useStudentWizard();

  const cfg = STATUS_CONFIG[analysis.status] ?? STATUS_CONFIG.warning;
  const Icon = cfg.icon;

  const interpretation = buildInterpretation(analysis, state);
  const covariateCount = state.dataset?.columns.filter((c: any) => c.role === 'covariate').length ?? 0;
  const rowCount = state.dataset?.rowCount ?? 0;

  return (
    <div className="result-card">
      <div className="result-card-header">
        <Icon size={18} color={cfg.color} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1C2B3A' }}>{analysis.title}</div>
          <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 1 }}>
            Completed {new Date(analysis.completedAt).toLocaleString()}
          </div>
        </div>
        <span className={`badge ${cfg.badgeClass}`}>
          <Icon size={11} /> {cfg.label}
        </span>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center' }}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      <div className="result-card-body">
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: '#444', lineHeight: 1.5 }}>
          {analysis.summary}
        </p>

        {expanded && analysis.data && (
          <div style={{ background: '#F8F9FA', borderRadius: 6, padding: '0.75rem', marginBottom: '0.75rem', fontSize: '0.82rem', fontFamily: 'monospace', color: '#333', maxHeight: 200, overflow: 'auto' }}>
            <pre style={{ margin: 0 }}>{JSON.stringify(analysis.data, null, 2)}</pre>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowHelp(h => !h)}
            style={{ padding: '0.35rem 0.75rem', background: '#EBF5FB', color: '#1A6EA6', border: 'none', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <BookOpen size={13} /> {showHelp ? 'Hide' : 'Show'} Interpretation
          </button>
          <button
            onClick={() => setShowAssumptions(a => !a)}
            style={{ padding: '0.35rem 0.75rem', background: '#F5EEF8', color: '#7D3C98', border: 'none', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            Assumption Checks
          </button>
          <button
            onClick={() => removeAnalysis(analysis.id)}
            style={{ padding: '0.35rem 0.75rem', background: '#FDEDEC', color: '#A93226', border: 'none', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer' }}
          >
            Remove
          </button>
        </div>

        {showHelp && (
          <InterpretationCard interpretation={interpretation} />
        )}

        {showAssumptions && (
          <AssumptionCheckPanel
            analysisType={analysis.type}
            rowCount={rowCount}
            covariateCount={covariateCount}
          />
        )}
      </div>
    </div>
  );
}

// ─── Quality Checklist ─────────────────────────────────────────────────────────

function QualityChecklist() {
  const { state } = useStudentWizard();
  const [expanded, setExpanded] = useState<string | null>(null);

  const N = state.dataset?.rowCount ?? 0;
  const avgMissing = state.dataset
    ? state.dataset.columns.reduce((s: number, c: any) => s + (c.missingPercent || 0), 0) / (state.dataset.columns.length || 1)
    : 0;

  const items = [
    {
      id: 'sample',
      label: 'Sample size adequate',
      status: N === 0 ? 'gray' : N > 100 ? 'green' : N >= 30 ? 'yellow' : 'red',
      detail: N === 0 ? 'No dataset uploaded yet' : `N = ${N}. ${N > 100 ? 'Adequate.' : N >= 30 ? 'Adequate but small. Interpret with caution.' : 'Very small — results may not be reliable.'}`,
      tip: 'Larger samples give more precise estimates and more statistical power to detect true effects.',
    },
    {
      id: 'missing',
      label: 'Missing data addressed',
      status: avgMissing === 0 ? 'gray' : avgMissing < 5 ? 'green' : avgMissing <= 15 ? 'yellow' : 'red',
      detail: `Overall missing: ${avgMissing.toFixed(1)}%. ${avgMissing < 5 ? 'Excellent — minimal missing data.' : avgMissing <= 15 ? 'Moderate missing data — consider imputation.' : 'High missing data — address before analysis.'}`,
      tip: 'Missing data can bias results if not handled properly. Common approaches include complete case analysis, multiple imputation, or sensitivity analyses.',
    },
    {
      id: 'assumptions',
      label: 'Assumptions checked',
      status: state.analyses.length === 0 ? 'gray' : state.analyses.length >= 2 ? 'green' : 'yellow',
      detail: `${state.analyses.length} analysis/analyses completed. Use the "Assumption Checks" button on each result card to review.`,
      tip: 'Statistical tests have assumptions that must be met for results to be valid. Always check assumptions before interpreting results.',
    },
    {
      id: 'multiple',
      label: 'Multiple comparisons considered',
      status: state.analyses.length > 3 ? 'yellow' : 'green',
      detail: state.analyses.length > 3 ? `You've run ${state.analyses.length} analyses — consider Bonferroni correction (alpha = ${(0.05 / state.analyses.length).toFixed(4)}).` : `${state.analyses.length} analyses run — multiple comparisons less of a concern.`,
      tip: 'Running many statistical tests increases the chance of false positives (type I error). The Bonferroni correction divides the significance threshold by the number of tests.',
    },
    {
      id: 'effect',
      label: 'Effect sizes reported',
      status: state.analyses.some(a => a.summary.match(/OR|HR|RR|beta|coefficient|mean diff|effect/i)) ? 'green' : 'yellow',
      detail: 'Make sure to report effect sizes (OR, HR, RR, mean difference) — not just p-values.',
      tip: 'P-values tell you whether an association exists; effect sizes tell you how large it is. Always report both for a complete picture.',
    },
  ];

  const colorMap: Record<string, string> = { green: '#27AE60', yellow: '#D4AC0D', red: '#E74C3C', gray: '#D5D8DC' };

  return (
    <div style={{ background: 'white', borderRadius: 10, border: '1px solid #E5E9EF', padding: '1.25rem', position: 'sticky', top: 80 }}>
      <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: '#1C2B3A' }}>
        Quality Checklist
      </h4>
      {items.map(item => {
        const color = colorMap[item.status] ?? '#D5D8DC';
        const isExpanded = expanded === item.id;
        return (
          <div key={item.id} style={{ marginBottom: '0.25rem' }}>
            <button
              onClick={() => setExpanded(isExpanded ? null : item.id)}
              className="quality-item"
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '0.45rem 0' }}
            >
              {item.status === 'green' && <CheckCircle size={16} color={color} style={{ flexShrink: 0 }} />}
              {item.status === 'yellow' && <AlertTriangle size={16} color={color} style={{ flexShrink: 0 }} />}
              {item.status === 'red' && <XCircle size={16} color={color} style={{ flexShrink: 0 }} />}
              {item.status === 'gray' && <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #ccc', display: 'inline-block', flexShrink: 0 }} />}
              <span style={{ color: '#444', flex: 1, fontSize: '0.875rem' }}>{item.label}</span>
              {isExpanded ? <ChevronUp size={12} color="#888" /> : <ChevronDown size={12} color="#888" />}
            </button>
            {isExpanded && (
              <div style={{ padding: '0.4rem 0 0.4rem 1.5rem', fontSize: '0.78rem', color: '#666', lineHeight: 1.5 }}>
                <div style={{ marginBottom: '0.25rem' }}>{item.detail}</div>
                <div style={{ color: '#888', fontStyle: 'italic' }}>{item.tip}</div>
              </div>
            )}
          </div>
        );
      })}
      <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#F4F7FA', borderRadius: 8, fontSize: '0.8rem', color: '#666', lineHeight: 1.5 }}>
        Complete all checklist items before generating your final report.
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ResultsReviewPage() {
  const { state, completeStep } = useStudentWizard();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(state.maxCompletedStep === 3);

  const hasAnalyses = state.analyses.length > 0;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {showSuccess && <StepSuccessMessage step={3} onDismiss={() => setShowSuccess(false)} />}

      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1C2B3A', marginBottom: '0.25rem' }}>
        Step 4: Results Review
      </h2>
      <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Review your completed analyses before generating a report.
      </p>

      <LearningTip
        visible={state.learningMode}
        title="How to interpret results"
        explanation="Look at three things: (1) Effect size — how big is the effect? (2) Confidence interval — how precise is the estimate? A wide CI means uncertainty. (3) P-value — how likely is this due to chance? A p-value < 0.05 is conventionally 'significant', but always consider clinical relevance alongside statistical significance."
        relatedConcepts={['Effect size', 'Confidence intervals', 'P-values', 'Statistical significance']}
      />

      <div className="two-col-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '1.5rem' }}>
        {/* Left — analysis cards */}
        <div>
          {hasAnalyses ? (
            state.analyses.map(a => <AnalysisCard key={a.id} analysis={a} />)
          ) : (
            <WizardEmptyState
              icon={FileSearch}
              title="No analyses completed yet"
              description="Complete at least one analysis in Step 3 to see your results here."
              actionLabel="Go to Analysis"
              onAction={() => navigate('/student/analysis')}
            />
          )}

          {state.learningMode && hasAnalyses && (
            <LearningTip
              visible={true}
              title="About p-values"
              explanation="A p-value less than 0.05 is conventionally considered 'statistically significant,' but this is just a threshold — it doesn't tell you whether the finding is clinically meaningful. Always consider the effect size and confidence interval alongside the p-value."
              relatedConcepts={['P-values', 'Statistical significance', 'Clinical significance']}
            />
          )}
        </div>

        {/* Right — quality checklist */}
        <div>
          <QualityChecklist />
        </div>
      </div>

      <div className="action-bar">
        <button className="btn-secondary" onClick={() => navigate('/student/analysis')}>
          ← Back to Analysis
        </button>
        <button
          className="btn-primary"
          onClick={() => { if (hasAnalyses) completeStep(4); }}
          disabled={!hasAnalyses}
        >
          Generate Report →
        </button>
      </div>
    </div>
  );
}
