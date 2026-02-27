import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp, BarChart2, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStudentWizard, AnalysisResult } from '../context/StudentWizardContext';
import '../student.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  success: { icon: CheckCircle, color: '#27AE60', bg: '#E9F7EF', label: 'Strong', badgeClass: 'badge-success' },
  warning: { icon: AlertTriangle, color: '#D4AC0D', bg: '#FEF9E7', label: 'Review Needed', badgeClass: 'badge-warning' },
  error:   { icon: XCircle,      color: '#A93226', bg: '#FDEDEC', label: 'Issue',          badgeClass: 'badge-error' },
};

const PLAIN_LANGUAGE: Record<string, string> = {
  table1:  "Your Table 1 shows the distribution of key variables. Check that groups are balanced on important baseline characteristics. Significant p-values in Table 1 of an RCT may indicate randomization problems.",
  km:      "The Kaplan-Meier curves show time to event for each group. The log-rank p-value tests whether survival differs between groups. Crossing curves may indicate non-proportional hazards.",
  cox:     "The Cox regression hazard ratio tells you how much faster (or slower) the event occurs in the exposed group, after adjusting for confounders. HR > 1 means higher risk.",
  default: "Review these results carefully before proceeding to report generation. Ensure assumptions are checked and p-values are interpreted in context of clinical significance.",
};

const QUALITY_ITEMS = [
  { id: 'sample',    label: 'Sample size adequate',         key: 'sampleSizeTarget' },
  { id: 'missing',   label: 'Missing data addressed',       key: 'dataset' },
  { id: 'assump',    label: 'Assumptions checked',          key: 'analyses' },
  { id: 'multiple',  label: 'Multiple comparisons considered', key: '' },
  { id: 'effect',    label: 'Effect sizes reported',        key: '' },
];

function AnalysisCard({ analysis }: { analysis: AnalysisResult }) {
  const [expanded, setExpanded] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { removeAnalysis } = useStudentWizard();

  const cfg = STATUS_CONFIG[analysis.status] ?? STATUS_CONFIG.warning;
  const Icon = cfg.icon;
  const interpretation = PLAIN_LANGUAGE[analysis.type] ?? PLAIN_LANGUAGE.default;

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
            <BookOpen size={13} /> Interpretation Help
          </button>
          <button
            onClick={() => removeAnalysis(analysis.id)}
            style={{ padding: '0.35rem 0.75rem', background: '#FDEDEC', color: '#A93226', border: 'none', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer' }}
          >
            Remove
          </button>
        </div>

        {showHelp && (
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#FFF9E6', borderRadius: 8, border: '1px solid #F5CBA7', fontSize: '0.85rem', color: '#6E4E1A', lineHeight: 1.6 }}>
            {interpretation}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ResultsReviewPage() {
  const { state, completeStep } = useStudentWizard();
  const navigate = useNavigate();

  const hasAnalyses = state.analyses.length > 0;

  const qualityStatus = (id: string): 'green' | 'yellow' | 'gray' => {
    if (id === 'sample') return state.studyConfig.sampleSizeTarget ? 'green' : 'yellow';
    if (id === 'missing') return state.dataset ? 'green' : 'gray';
    if (id === 'assump') return state.analyses.length >= 2 ? 'green' : 'yellow';
    return 'gray';
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1C2B3A', marginBottom: '0.25rem' }}>
        Step 4: Results Review
      </h2>
      <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Review your completed analyses before generating a report.
      </p>

      <div className="two-col-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '1.5rem' }}>
        {/* Left — analysis cards */}
        <div>
          {hasAnalyses ? (
            state.analyses.map(a => <AnalysisCard key={a.id} analysis={a} />)
          ) : (
            <div style={{ background: 'white', borderRadius: 10, border: '1px dashed #D5D8DC', padding: '3rem 2rem', textAlign: 'center' }}>
              <BarChart2 size={40} color="#ccc" style={{ marginBottom: '0.75rem' }} />
              <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>
                No analyses completed yet. Go back to Step 3 and run at least one analysis.
              </p>
              <button
                onClick={() => navigate('/student/analysis')}
                style={{ marginTop: '1rem', padding: '0.6rem 1.25rem', background: '#2E86C1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
              >
                ← Go to Analysis
              </button>
            </div>
          )}
        </div>

        {/* Right — quality checklist */}
        <div>
          <div style={{ background: 'white', borderRadius: 10, border: '1px solid #E5E9EF', padding: '1.25rem', position: 'sticky', top: 80 }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: '#1C2B3A' }}>
              Quality Checklist
            </h4>
            {QUALITY_ITEMS.map(item => {
              const status = qualityStatus(item.id);
              const color = status === 'green' ? '#27AE60' : status === 'yellow' ? '#D4AC0D' : '#ccc';
              return (
                <div key={item.id} className="quality-item">
                  {status === 'green'  && <CheckCircle   size={16} color={color} style={{ flexShrink: 0 }} />}
                  {status === 'yellow' && <AlertTriangle size={16} color={color} style={{ flexShrink: 0 }} />}
                  {status === 'gray'   && <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #ccc', display: 'inline-block', flexShrink: 0 }} />}
                  <span style={{ color: '#444' }}>{item.label}</span>
                </div>
              );
            })}

            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#F4F7FA', borderRadius: 8, fontSize: '0.8rem', color: '#666', lineHeight: 1.5 }}>
              Complete all checklist items before generating your final report.
            </div>
          </div>
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

