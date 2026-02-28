import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { WizardState } from '../context/StudentWizardContext';

interface AnalysisPipelineVisualProps {
  state: WizardState;
}

function detectOutcomeType(state: WizardState): { type: string; label: string; color: string } {
  const outcomeCol = state.dataset?.columns.find(c => c.role === 'outcome');
  const timeCol = state.dataset?.columns.find(c => c.role === 'time');
  if (!outcomeCol) return { type: 'unknown', label: 'Outcome Unknown', color: '#D5D8DC' };
  if (timeCol) return { type: 'time-to-event', label: 'Time-to-Event', color: '#7D3C98' };
  if (outcomeCol.uniqueValues === 2 || outcomeCol.type === 'binary') return { type: 'binary', label: 'Binary Outcome', color: '#C0533A' };
  if (outcomeCol.type === 'numeric' && outcomeCol.uniqueValues > 10) return { type: 'continuous', label: 'Continuous Outcome', color: '#2E86C1' };
  return { type: 'count', label: 'Count Outcome', color: '#E67E22' };
}

function getRecommendedAnalysis(studyType: string, outcomeType: string): string {
  const map: Record<string, Record<string, string>> = {
    binary: {
      'cross-sectional': 'Logistic Regression',
      cohort: 'Cox Regression / Logistic Regression',
      rct: 'Logistic Regression (ITT)',
      'case-control': 'Conditional Logistic Regression',
      'systematic-review': 'Meta-Analysis',
    },
    continuous: {
      'cross-sectional': 'Linear Regression',
      cohort: 'Linear Regression',
      rct: 'ANCOVA',
      'case-control': 'Linear Regression',
      'systematic-review': 'Meta-Analysis',
    },
    'time-to-event': { default: 'Kaplan-Meier + Cox Regression' },
    count: { default: 'Poisson Regression' },
    unknown: { default: 'Descriptive Analysis' },
  };
  return map[outcomeType]?.[studyType] ?? map[outcomeType]?.['default'] ?? 'Descriptive Analysis';
}

function getWhyExplanation(studyType: string, outcomeType: string, recommendedAnalysis: string): string {
  if (outcomeType === 'binary') {
    return `Logistic regression is ideal for binary outcomes because it models the probability of an event occurring. Since your outcome is binary (yes/no), this analysis estimates odds ratios, which quantify how much the exposure changes the odds of the outcome. For a ${studyType.replace('-', ' ')} design, this is the standard primary analysis. Adjusting for covariates gives you an independent estimate of the exposure-outcome relationship.`;
  }
  if (outcomeType === 'continuous') {
    return `Linear regression is used for continuous outcomes because it estimates the mean difference in the outcome between exposed and unexposed groups. For a ${studyType.replace('-', ' ')} design, this is the appropriate choice. The regression coefficient represents the change in the outcome for each unit change in the exposure.`;
  }
  if (outcomeType === 'time-to-event') {
    return `Survival analysis (Kaplan-Meier and Cox regression) is used when you want to measure time until an event occurs. The Kaplan-Meier curve visualizes survival over time for each group. Cox regression provides hazard ratios — the ratio of the rate of event occurrence between exposed and unexposed groups — while adjusting for confounders.`;
  }
  if (outcomeType === 'count') {
    return `Poisson regression is designed for count outcomes (non-negative integers). It models the rate of events occurring and estimates rate ratios between groups. This is more appropriate than linear regression for count data, especially when there are many zeros.`;
  }
  return `${recommendedAnalysis} is recommended for your ${studyType.replace('-', ' ')} study design. This analysis is appropriate given your data structure and research question.`;
}

function Box({ label, sub, color }: { label: string; sub?: string; color: string }) {
  return (
    <div style={{
      padding: '0.6rem 1rem',
      background: color + '15',
      border: `2px solid ${color}`,
      borderRadius: 8,
      textAlign: 'center',
      minWidth: 120,
      flex: '0 0 auto',
    }}>
      <div style={{ fontWeight: 700, color, fontSize: '0.82rem' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: '#555', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Arrow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', color: '#D5D8DC', fontSize: '1.2rem', flexShrink: 0, padding: '0 0.25rem' }}>
      →
    </div>
  );
}

export default function AnalysisPipelineVisual({ state }: AnalysisPipelineVisualProps) {
  const [showWhy, setShowWhy] = useState(false);
  const outcome = detectOutcomeType(state);
  const studyType = state.studyConfig.studyType || 'cross-sectional';
  const recommended = getRecommendedAnalysis(studyType, outcome.type);
  const covariates = state.dataset?.columns.filter(c => c.role === 'covariate').map(c => c.name) ?? [];
  const why = getWhyExplanation(studyType, outcome.type, recommended);

  return (
    <div style={{ background: '#F0F4F8', borderRadius: 10, padding: '1rem 1.25rem', border: '1px solid #D5E3F0', borderLeft: '4px solid #2E86C1', marginBottom: '1.5rem' }}>
      <div style={{ fontWeight: 700, color: '#1C2B3A', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
        Your Analysis Pipeline
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        flexWrap: 'wrap',
        overflowX: 'auto',
      }}>
        <Box
          label="Your Data"
          sub={state.dataset ? `${state.dataset.rowCount} rows` : 'No data yet'}
          color="#1C2B3A"
        />
        <Arrow />
        <Box label={outcome.label} color={outcome.color} />
        <Arrow />
        <Box label={recommended} color="#5A8A6A" />
        {covariates.length > 0 && (
          <>
            <Arrow />
            <Box
              label="Adjusted for"
              sub={covariates.slice(0, 3).join(', ') + (covariates.length > 3 ? ` +${covariates.length - 3}` : '')}
              color="#E67E22"
            />
          </>
        )}
      </div>

      <button
        onClick={() => setShowWhy(s => !s)}
        style={{
          marginTop: '0.75rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#2E86C1',
          fontSize: '0.82rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          padding: 0,
        }}
      >
        Why this analysis? {showWhy ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {showWhy && (
        <div style={{ marginTop: '0.6rem', fontSize: '0.83rem', color: '#444', lineHeight: 1.6, padding: '0.75rem', background: 'white', borderRadius: 8, border: '1px solid #E5E9EF' }}>
          {why}
        </div>
      )}
    </div>
  );
}
