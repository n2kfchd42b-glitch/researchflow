import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AssumptionCheck } from '../context/StudentWizardContext';

interface AssumptionCheckPanelProps {
  analysisType: string;
  data?: any;
  rowCount?: number;
  covariateCount?: number;
  outcomeSkewness?: number;
  outcomeBinaryMinClass?: number;
  censoredPercent?: number;
  heterogeneityI2?: number;
}

function buildAssumptions(
  analysisType: string,
  rowCount = 0,
  covariateCount = 0,
  outcomeSkewness?: number,
  outcomeBinaryMinClass?: number,
  censoredPercent?: number,
  heterogeneityI2?: number,
): AssumptionCheck[] {
  const type = analysisType.toLowerCase();

  if (type.includes('linear') || type.includes('ancova')) {
    const normStatus: AssumptionCheck['status'] = !outcomeSkewness ? 'not-checked' : Math.abs(outcomeSkewness) < 2 ? 'pass' : Math.abs(outcomeSkewness) < 3 ? 'review' : 'fail';
    const samplePerPredictor = covariateCount > 0 ? rowCount / covariateCount : rowCount;
    const sampleStatus: AssumptionCheck['status'] = samplePerPredictor > 10 ? 'pass' : samplePerPredictor >= 5 ? 'review' : 'fail';
    return [
      { name: 'Normality of residuals', status: normStatus, description: 'The outcome variable should be approximately normally distributed.', detail: `Skewness: ${outcomeSkewness?.toFixed(2) ?? 'unknown'}. Acceptable if |skewness| < 2.` },
      { name: 'Sample size adequacy', status: sampleStatus, description: 'Generally need at least 10 observations per variable in the model.', detail: `${samplePerPredictor.toFixed(0)} observations per predictor (${rowCount} rows, ${covariateCount} covariates).` },
      { name: 'Homoscedasticity', status: 'not-checked', description: 'The spread of data should be similar across groups.', detail: 'Review residual plots after running the model.' },
    ];
  }

  if (type.includes('logistic') || type.includes('logit')) {
    const balanceStatus: AssumptionCheck['status'] = !outcomeBinaryMinClass ? 'not-checked' : outcomeBinaryMinClass > 0.1 ? 'pass' : outcomeBinaryMinClass >= 0.05 ? 'review' : 'fail';
    const eventsPerVar = covariateCount > 0 && outcomeBinaryMinClass ? (rowCount * outcomeBinaryMinClass) / covariateCount : null;
    const epvStatus: AssumptionCheck['status'] = !eventsPerVar ? 'not-checked' : eventsPerVar > 10 ? 'pass' : eventsPerVar >= 5 ? 'review' : 'fail';
    return [
      { name: 'Outcome balance', status: balanceStatus, description: 'The outcome should not be extremely rare or extremely common.', detail: `Minority class: ${outcomeBinaryMinClass ? (outcomeBinaryMinClass * 100).toFixed(1) : '?'}%. Acceptable if > 10%.` },
      { name: 'Events per variable (EPV)', status: epvStatus, description: 'Need at least 10 events per variable to avoid overfitting.', detail: `EPV: ${eventsPerVar?.toFixed(1) ?? 'unknown'}.` },
    ];
  }

  if (type.includes('cox') || type.includes('survival') || type.includes('kaplan')) {
    const censorStatus: AssumptionCheck['status'] = !censoredPercent ? 'not-checked' : censoredPercent >= 20 && censoredPercent <= 80 ? 'pass' : 'review';
    return [
      { name: 'Proportional hazards', status: 'review', description: 'The effect of exposure should be constant over time.', detail: 'Check KM curves — if they cross, this assumption may be violated.' },
      { name: 'Censoring pattern', status: censorStatus, description: 'Very high or very low censoring can affect reliability.', detail: `Censored: ${censoredPercent?.toFixed(1) ?? '?'}%. Acceptable: 20–80%.` },
    ];
  }

  if (type.includes('meta') || type.includes('forest')) {
    const i2Status: AssumptionCheck['status'] = !heterogeneityI2 ? 'not-checked' : heterogeneityI2 < 50 ? 'pass' : heterogeneityI2 < 75 ? 'review' : 'fail';
    return [
      { name: 'Heterogeneity (I²)', status: i2Status, description: 'High heterogeneity (I² > 75%) suggests studies may be too different to combine.', detail: `I²: ${heterogeneityI2?.toFixed(1) ?? 'unknown'}%.` },
      { name: 'Publication bias', status: 'review', description: 'Consider whether studies with negative results might be missing.', detail: 'Check funnel plot asymmetry and consider Egger\'s test.' },
    ];
  }

  return [
    { name: 'Assumptions', status: 'not-checked', description: 'Review assumptions for this analysis type.', detail: 'Check the documentation for specific assumptions.' },
  ];
}

const STATUS_DOT: Record<AssumptionCheck['status'], { color: string; label: string }> = {
  pass:        { color: '#27AE60', label: 'Pass ✓' },
  review:      { color: '#E67E22', label: 'Review ⚠' },
  fail:        { color: '#E74C3C', label: 'Fail ✗' },
  'not-checked': { color: '#D5D8DC', label: 'Not checked' },
};

export default function AssumptionCheckPanel({
  analysisType,
  rowCount = 0,
  covariateCount = 0,
  outcomeSkewness,
  outcomeBinaryMinClass,
  censoredPercent,
  heterogeneityI2,
}: AssumptionCheckPanelProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const assumptions = buildAssumptions(analysisType, rowCount, covariateCount, outcomeSkewness, outcomeBinaryMinClass, censoredPercent, heterogeneityI2);

  return (
    <div style={{ background: '#FAFBFC', borderRadius: 8, border: '1px solid #E5E9EF', padding: '0.75rem', marginTop: '0.5rem' }}>
      <div style={{ fontWeight: 700, color: '#1C2B3A', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
        Assumption Checks
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {assumptions.map((a, i) => {
          const { color, label } = STATUS_DOT[a.status];
          return (
            <div key={i}>
              <button
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  padding: '0.2rem 0',
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
                <span style={{ fontSize: '0.8rem', color: '#333', flex: 1 }}>{a.name}</span>
                <span style={{ fontSize: '0.72rem', color, fontWeight: 600 }}>{label}</span>
                {expandedIdx === i ? <ChevronUp size={12} color="#888" /> : <ChevronDown size={12} color="#888" />}
              </button>
              {expandedIdx === i && (
                <div style={{ padding: '0.4rem 1.2rem', background: 'white', borderRadius: 6, marginTop: 2, fontSize: '0.78rem', color: '#555', lineHeight: 1.5, border: '1px solid #EEF1F5' }}>
                  <div style={{ marginBottom: '0.2rem' }}>{a.description}</div>
                  <div style={{ color: '#888' }}>{a.detail}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
