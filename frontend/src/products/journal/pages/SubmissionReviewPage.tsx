import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, CheckCircle, AlertTriangle, Shield, Clock,
  Download, ChevronDown, ChevronUp, Plus, Save, Trash2, X,
  Database, BarChart2, AlertCircle, RefreshCw
} from 'lucide-react';
import {
  useJournal, ReportedAnalysis, VerificationResult, RoBAssessment,
  RoBDomain, SignalingQuestion
} from '../context/JournalContext';
import VerificationStatusBadge from '../components/VerificationStatusBadge';
import VerificationProgress from '../components/VerificationProgress';
import ComparisonPanel from '../components/ComparisonPanel';
import MatchIndicator from '../components/MatchIndicator';
import RoBTrafficLight from '../components/RoBTrafficLight';
import AuditTimeline from '../components/AuditTimeline';
import { VerificationPanel } from '../components/VerificationPanel';

const JOURNAL_PRIMARY = '#7D3C98';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

const ANALYSIS_TYPE_LABELS: Record<ReportedAnalysis['type'], string> = {
  'table1': 'Table 1 (Descriptive)',
  'regression': 'Logistic/Linear Regression',
  'survival': 'Cox/Survival Analysis',
  'meta-analysis': 'Meta-Analysis',
  'subgroup': 'Subgroup Analysis',
  'sensitivity': 'Sensitivity Analysis',
  'psm': 'Propensity Score Matching',
  'descriptive': 'Descriptive Statistics',
  'forest-plot': 'Forest Plot',
  'other': 'Other',
};

const MATCH_COLORS: Record<VerificationResult['match'], string> = {
  'exact': '#10B981',
  'minor-discrepancy': '#F59E0B',
  'major-discrepancy': '#EF4444',
  'cannot-reproduce': '#9CA3AF',
};

const VERDICT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'fully-verified':          { label: 'Fully Verified',          color: '#065F46', bg: '#D1FAE5' },
  'partially-verified':      { label: 'Partially Verified',      color: '#92400E', bg: '#FEF3C7' },
  'significant-discrepancies': { label: 'Significant Discrepancies', color: '#991B1B', bg: '#FEE2E2' },
  'cannot-verify':           { label: 'Cannot Verify',           color: '#374151', bg: '#F3F4F6' },
};

// ─── Tab bar ──────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'analyses' | 'dataset' | 'rob' | 'report' | 'audit';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview',  label: 'Overview',      icon: BarChart2   },
  { id: 'analyses',  label: 'Analyses',      icon: CheckCircle },
  { id: 'dataset',   label: 'Dataset',       icon: Database    },
  { id: 'rob',       label: 'Risk of Bias',  icon: Shield      },
  { id: 'report',    label: 'Report',        icon: FileText    },
  { id: 'audit',     label: 'Audit Log',     icon: Clock       },
];

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ submission }: { submission: any }) {
  const { updateSubmission } = useJournal();
  const [editNotes, setEditNotes] = useState(false);
  const [notes, setNotes] = useState(submission.notes);

  const verified   = submission.verificationResults.filter((r: any) => r.match === 'exact').length;
  const discrepant = submission.verificationResults.filter((r: any) => r.match === 'minor-discrepancy' || r.match === 'major-discrepancy').length;
  const pending    = submission.reportedAnalyses.length - submission.verificationResults.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Meta row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <InfoCard label="Manuscript ID"    value={submission.manuscriptId} mono />
        <InfoCard label="Journal"          value={submission.journal || '—'} />
        <InfoCard label="Study Type"       value={submission.studyType || '—'} />
        <InfoCard label="Priority"         value={submission.priority}   chip chipColor={submission.priority === 'urgent' ? '#EF4444' : submission.priority === 'high' ? '#F59E0B' : '#9CA3AF'} />
        <InfoCard label="Submitted"        value={new Date(submission.submittedAt).toLocaleDateString()} />
        <InfoCard label="Assigned Reviewer" value={submission.assignedReviewer || 'Unassigned'} />
        {submission.deadline && <InfoCard label="Deadline" value={new Date(submission.deadline).toLocaleDateString()} />}
      </div>

      {/* Authors */}
      {submission.authors.length > 0 && (
        <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E5E7EB', padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700, color: '#1C2B3A' }}>Authors</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {submission.authors.map((a: any, i: number) => (
              <div key={i} style={{
                padding: '0.4rem 0.85rem', background: '#F9FAFB', border: '1px solid #E5E7EB',
                borderRadius: 20, fontSize: '0.82rem', color: '#374151',
              }}>
                {a.name}
                {a.isCorresponding && <span style={{ color: JOURNAL_PRIMARY, fontWeight: 700, marginLeft: 4 }}>*</span>}
                {a.affiliation && <span style={{ color: '#9CA3AF', marginLeft: 4 }}>· {a.affiliation}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification Progress */}
      <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E5E7EB', padding: '1rem' }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700, color: '#1C2B3A' }}>Verification Progress</h3>
        <VerificationProgress
          total={submission.reportedAnalyses.length}
          verified={verified}
          discrepant={discrepant}
          pending={Math.max(pending, 0)}
        />
      </div>

      {/* RoB summary */}
      {submission.riskOfBiasAssessment && (
        <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E5E7EB', padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700, color: '#1C2B3A' }}>Risk of Bias Summary</h3>
          <RoBTrafficLight
            domains={submission.riskOfBiasAssessment.domains}
            overallRisk={submission.riskOfBiasAssessment.overallRisk}
            compact
          />
        </div>
      )}

      {/* Notes */}
      <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E5E7EB', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1C2B3A' }}>Reviewer Notes</h3>
          {!editNotes
            ? <button onClick={() => setEditNotes(true)} style={{ background: 'none', border: '1px solid #D1D5DB', borderRadius: 6, padding: '0.25rem 0.65rem', cursor: 'pointer', fontSize: '0.78rem', color: '#6B7280' }}>Edit</button>
            : <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button onClick={() => { updateSubmission(submission.id, { notes }); setEditNotes(false); }} style={{ background: JOURNAL_PRIMARY, color: 'white', border: 'none', borderRadius: 6, padding: '0.25rem 0.65rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Save</button>
                <button onClick={() => { setNotes(submission.notes); setEditNotes(false); }} style={{ background: 'none', border: '1px solid #D1D5DB', borderRadius: 6, padding: '0.25rem 0.65rem', cursor: 'pointer', fontSize: '0.78rem', color: '#6B7280' }}>Cancel</button>
              </div>
          }
        </div>
        {editNotes
          ? <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
              style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: 8, padding: '0.6rem', fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
          : <p style={{ margin: 0, fontSize: '0.875rem', color: submission.notes ? '#374151' : '#9CA3AF', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {submission.notes || 'No notes yet.'}
            </p>
        }
      </div>
    </div>
  );
}

function InfoCard({ label, value, mono, chip, chipColor }: { label: string; value: string; mono?: boolean; chip?: boolean; chipColor?: string }) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E5E7EB', padding: '0.75rem 1rem' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{label}</div>
      {chip
        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', fontWeight: 700, color: chipColor }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: chipColor, display: 'inline-block' }} />
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        : <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1C2B3A', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</div>
      }
    </div>
  );
}

// ─── Analyses Tab ─────────────────────────────────────────────────────────────

function VerificationForm({ analysis, submissionId, existingResult, onClose }: {
  analysis: ReportedAnalysis;
  submissionId: string;
  existingResult?: VerificationResult;
  onClose: () => void;
}) {
  const { addVerificationResult, state } = useJournal();
  const [match, setMatch] = useState<VerificationResult['match']>(existingResult?.match ?? 'exact');
  const [reproduced, setReproduced] = useState(existingResult?.reproducedResults ?? '');
  const [details, setDetails] = useState(existingResult?.discrepancyDetails ?? '');
  const [severity, setSeverity] = useState<VerificationResult['severity']>(existingResult?.severity ?? 'none');
  const [notes, setNotes] = useState(existingResult?.notes ?? '');
  const [engine, setEngine] = useState(existingResult?.engineModule ?? '');
  const reviewer = state.settings.defaultReviewerName || 'Reviewer';

  const handleSave = () => {
    const result: VerificationResult = {
      id: existingResult?.id ?? generateId(),
      analysisId: analysis.id,
      reproducedResults: reproduced,
      match,
      discrepancyDetails: details,
      severity,
      reproducedAt: new Date().toISOString(),
      reproducedBy: reviewer,
      engineModule: engine,
      parameters: {},
      rawOutput: null,
      notes,
    };
    addVerificationResult(submissionId, result);
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.7rem', border: '1px solid #D1D5DB', borderRadius: 7,
    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };

  const MATCH_OPTIONS: { value: VerificationResult['match']; label: string; color: string }[] = [
    { value: 'exact',             label: 'Exact Match',         color: '#10B981' },
    { value: 'minor-discrepancy', label: 'Minor Discrepancy',   color: '#F59E0B' },
    { value: 'major-discrepancy', label: 'Major Discrepancy',   color: '#EF4444' },
    { value: 'cannot-reproduce',  label: 'Cannot Reproduce',    color: '#9CA3AF' },
  ];

  return (
    <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1C2B3A' }}>
          {existingResult ? 'Edit' : 'Record'} Verification Result
        </h4>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={16} /></button>
      </div>

      {/* Comparison */}
      <ComparisonPanel
        reported={analysis.reportedResults}
        reproduced={reproduced}
        match={match}
        discrepancyDetails={details}
      />

      {/* Reproduced results */}
      <div>
        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 3 }}>Reproduced Results</label>
        <textarea value={reproduced} onChange={e => setReproduced(e.target.value)} rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
          placeholder="Enter independently reproduced results here..." />
      </div>

      {/* Match */}
      <div>
        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>Match Assessment</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {MATCH_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setMatch(opt.value)}
              style={{
                padding: '0.4rem 0.85rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                background: match === opt.value ? opt.color : '#F3F4F6',
                color: match === opt.value ? 'white' : '#374151',
                border: `2px solid ${match === opt.value ? opt.color : '#E5E7EB'}`,
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {match !== 'exact' && (
        <>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 3 }}>Discrepancy Details</label>
            <textarea value={details} onChange={e => setDetails(e.target.value)} rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Describe the discrepancy in detail..." />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 3 }}>Severity</label>
            <select value={severity} onChange={e => setSeverity(e.target.value as any)} style={{ ...inputStyle, background: 'white', cursor: 'pointer' }}>
              <option value="none">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 3 }}>Analysis Engine / Module</label>
          <input value={engine} onChange={e => setEngine(e.target.value)} style={inputStyle} placeholder="e.g. R / Stata / Python" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 3 }}>Notes</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} style={inputStyle} placeholder="Optional additional notes" />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <button onClick={onClose} style={{ padding: '0.5rem 1rem', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 7, cursor: 'pointer', fontSize: '0.85rem', color: '#374151' }}>Cancel</button>
        <button onClick={handleSave} style={{ padding: '0.5rem 1.1rem', background: JOURNAL_PRIMARY, border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.85rem', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Save size={14} /> Save Result
        </button>
      </div>
    </div>
  );
}

function AnalysisRow({ analysis, submissionId, result }: {
  analysis: ReportedAnalysis;
  submissionId: string;
  result?: VerificationResult;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const statusColor = {
    'pending': '#9CA3AF', 'verified': '#10B981', 'discrepant': '#F59E0B', 'cannot-verify': '#6B7280',
  }[analysis.status];

  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', background: '#FFFFFF' }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer', background: expanded ? '#FAFAFA' : '#FFFFFF' }}
      >
        {/* Status dot */}
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1C2B3A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {analysis.description || '(No description)'}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', background: '#F5EEF8', color: JOURNAL_PRIMARY, padding: '0.1rem 0.45rem', borderRadius: 9999, fontWeight: 600 }}>
              {ANALYSIS_TYPE_LABELS[analysis.type]}
            </span>
            {analysis.tableOrFigureRef && (
              <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>Ref: {analysis.tableOrFigureRef}</span>
            )}
            {result && (
              <MatchIndicator match={result.match} />
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {!result && (
            <button
              onClick={e => { e.stopPropagation(); setShowForm(true); setExpanded(true); }}
              style={{ padding: '0.3rem 0.7rem', background: JOURNAL_PRIMARY, color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <Plus size={12} /> Verify
            </button>
          )}
          {result && (
            <button
              onClick={e => { e.stopPropagation(); setShowForm(true); setExpanded(true); }}
              style={{ padding: '0.3rem 0.7rem', background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem' }}
            >
              Edit
            </button>
          )}
          {expanded ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0.85rem 1rem', borderTop: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {analysis.reportedResults && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Reported Results</div>
              <div style={{ background: '#F9FAFB', borderRadius: 7, padding: '0.6rem 0.75rem', fontSize: '0.875rem', color: '#1C2B3A', whiteSpace: 'pre-wrap' }}>
                {analysis.reportedResults}
              </div>
            </div>
          )}

          {result && !showForm && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Verification Result</div>
              <ComparisonPanel
                reported={analysis.reportedResults}
                reproduced={result.reproducedResults}
                match={result.match}
                discrepancyDetails={result.discrepancyDetails}
              />
              {result.notes && (
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: '#6B7280' }}>Notes: {result.notes}</p>
              )}
            </div>
          )}

          {showForm && (
            <VerificationForm
              analysis={analysis}
              submissionId={submissionId}
              existingResult={result}
              onClose={() => setShowForm(false)}
            />
          )}

          {!showForm && !result && (
            <button
              onClick={() => setShowForm(true)}
              style={{ alignSelf: 'flex-start', padding: '0.45rem 1rem', background: JOURNAL_PRIMARY, color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Plus size={14} /> Record Verification Result
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AnalysesTab({ submission }: { submission: any }) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'discrepant'>('all');

  const filtered = submission.reportedAnalyses.filter((a: ReportedAnalysis) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return a.status === 'pending';
    if (filter === 'verified') return a.status === 'verified';
    if (filter === 'discrepant') return a.status === 'discrepant' || a.status === 'cannot-verify';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {(['all', 'pending', 'verified', 'discrepant'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.3rem 0.85rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              background: filter === f ? JOURNAL_PRIMARY : '#F3F4F6',
              color: filter === f ? 'white' : '#374151',
              border: `1px solid ${filter === f ? JOURNAL_PRIMARY : '#E5E7EB'}`,
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span style={{ fontSize: '0.82rem', color: '#9CA3AF', alignSelf: 'center', marginLeft: 4 }}>
          {filtered.length} of {submission.reportedAnalyses.length}
        </span>
      </div>

      {/* Analyses */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF', border: '1px dashed #E5E7EB', borderRadius: 10 }}>
          <CheckCircle size={32} color="#D1D5DB" style={{ marginBottom: '0.75rem' }} />
          <p style={{ margin: 0, fontWeight: 600 }}>No analyses match this filter</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {filtered.map((analysis: ReportedAnalysis) => {
            const result = submission.verificationResults.find((r: VerificationResult) => r.analysisId === analysis.id);
            return (
              <AnalysisRow
                key={analysis.id}
                analysis={analysis}
                submissionId={submission.id}
                result={result}
              />
            );
          })}
        </div>
      )}

      {submission.reportedAnalyses.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF', border: '1px dashed #E5E7EB', borderRadius: 10 }}>
          <FileText size={32} color="#D1D5DB" style={{ marginBottom: '0.75rem' }} />
          <p style={{ margin: 0, fontWeight: 600 }}>No analyses catalogued</p>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem' }}>Use Submission Intake to add reported analyses</p>
        </div>
      )}
    </div>
  );
}

// ─── Dataset Tab ──────────────────────────────────────────────────────────────

function DatasetTab({ submission }: { submission: any }) {
  const ds = submission.dataset;

  if (!ds) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF', border: '1px dashed #E5E7EB', borderRadius: 10, background: '#FFFFFF' }}>
        <Database size={36} color="#D1D5DB" style={{ marginBottom: '0.75rem' }} />
        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>No dataset uploaded</p>
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.82rem' }}>Upload via the Submission Intake form, or attach one here.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Dataset overview */}
      <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E5E7EB', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={18} color="#10B981" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1C2B3A' }}>{ds.fileName}</div>
            <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>Uploaded {new Date(ds.uploadedAt).toLocaleDateString()}</div>
          </div>
          {ds.integrityVerified && (
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#065F46', background: '#D1FAE5', padding: '0.25rem 0.65rem', borderRadius: 20, fontWeight: 600 }}>
              <CheckCircle size={13} /> Integrity Verified
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
          <MetricPill label="Rows"    value={ds.rowCount.toLocaleString()} />
          <MetricPill label="Columns" value={ds.columnCount.toLocaleString()} />
        </div>

        <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.85rem', background: '#F9FAFB', borderRadius: 7 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6B7280', marginBottom: 3 }}>SHA-256 Hash</div>
          <code style={{ fontSize: '0.75rem', color: '#374151', wordBreak: 'break-all', fontFamily: 'monospace' }}>{ds.sha256Hash}</code>
        </div>
      </div>

      {/* Columns */}
      {ds.columns.length > 0 && (
        <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #E5E7EB' }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1C2B3A' }}>Variable Manifest ({ds.columns.length})</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr>
                  {['Variable', 'Type', 'Missing', 'Unique'].map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.75rem', fontSize: '0.72rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', background: '#F9FAFB', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ds.columns.map((col: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: '#1C2B3A', fontFamily: 'monospace', fontSize: '0.8rem' }}>{col.name}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <span style={{ fontSize: '0.72rem', background: '#EFF6FF', color: '#1E40AF', padding: '0.1rem 0.4rem', borderRadius: 4, fontWeight: 600 }}>{col.type}</span>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', color: col.missingPercent > 10 ? '#EF4444' : '#6B7280' }}>
                      {col.missingCount} ({col.missingPercent.toFixed(1)}%)
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', color: '#6B7280' }}>{col.uniqueValues}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '0.6rem 0.85rem', textAlign: 'center' }}>
      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1C2B3A' }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ─── Risk of Bias Tab ─────────────────────────────────────────────────────────

const ROB2_DOMAINS: { id: string; name: string; questions: string[] }[] = [
  {
    id: 'd1', name: 'Randomisation process',
    questions: [
      'Was the allocation sequence random?',
      'Was the allocation sequence concealed until participants were enrolled?',
      'Were there baseline imbalances that suggest a problem with the randomisation process?',
    ],
  },
  {
    id: 'd2', name: 'Deviations from intended interventions',
    questions: [
      'Were participants aware of their assigned intervention during the trial?',
      'Were carers and people delivering the interventions aware of assigned interventions?',
      'Were there deviations from intended intervention that arose because of the experimental context?',
    ],
  },
  {
    id: 'd3', name: 'Missing outcome data',
    questions: [
      'Were data for this outcome available for all participants?',
      'Are the proportions of missing outcome data and the reasons for missing data similar across intervention groups?',
    ],
  },
  {
    id: 'd4', name: 'Measurement of the outcome',
    questions: [
      'Was the method of measuring the outcome inappropriate?',
      'Could measurement or ascertainment of the outcome have differed between intervention groups?',
      'Were outcome assessors aware of the intervention received by study participants?',
    ],
  },
  {
    id: 'd5', name: 'Selection of the reported result',
    questions: [
      'Were the trial results selected from multiple eligible outcome measurements?',
      'Were the trial results selected from multiple eligible analyses of the data?',
    ],
  },
];

type SignalingAnswer = SignalingQuestion['answer'];

function RoBTab({ submission }: { submission: any }) {
  const { setRoBAssessment, state } = useJournal();
  const existing = submission.riskOfBiasAssessment;

  const [tool] = useState<RoBAssessment['tool']>('rob2');
  const [overallRisk, setOverallRisk] = useState<RoBAssessment['overallRisk']>(existing?.overallRisk ?? 'low');
  const [justification, setJustification] = useState(existing?.justification ?? '');
  const [domains, setDomains] = useState<RoBDomain[]>(() => {
    if (existing?.domains?.length) return existing.domains;
    return ROB2_DOMAINS.map(d => ({
      id: d.id,
      name: d.name,
      judgment: 'low' as RoBDomain['judgment'],
      rationale: '',
      supportingQuotes: [],
      signalingQuestions: d.questions.map((q, i) => ({
        id: `${d.id}-q${i}`,
        question: q,
        answer: 'no-information' as SignalingAnswer,
        comment: '',
      })),
    }));
  });

  const updateDomain = (domainId: string, updates: Partial<RoBDomain>) => {
    setDomains(prev => prev.map(d => d.id === domainId ? { ...d, ...updates } : d));
  };

  const updateQuestion = (domainId: string, qId: string, updates: Partial<SignalingQuestion>) => {
    setDomains(prev => prev.map(d => {
      if (d.id !== domainId) return d;
      return { ...d, signalingQuestions: d.signalingQuestions.map(q => q.id === qId ? { ...q, ...updates } : q) };
    }));
  };

  const handleSave = () => {
    const assessment: RoBAssessment = {
      id: existing?.id ?? generateId(),
      tool,
      assessedAt: new Date().toISOString(),
      assessedBy: state.settings.defaultReviewerName || 'Reviewer',
      overallRisk,
      domains,
      justification,
      supportingInfo: '',
    };
    setRoBAssessment(submission.id, assessment);
  };

  const RISK_OPTIONS: { value: RoBAssessment['overallRisk']; label: string; color: string }[] = [
    { value: 'low',           label: 'Low Risk',      color: '#10B981' },
    { value: 'some-concerns', label: 'Some Concerns', color: '#F59E0B' },
    { value: 'high',          label: 'High Risk',     color: '#EF4444' },
  ];

  const JUDGMENT_OPTIONS: { value: RoBDomain['judgment']; label: string; color: string }[] = [
    { value: 'low',           label: 'Low',     color: '#10B981' },
    { value: 'some-concerns', label: 'Concerns',color: '#F59E0B' },
    { value: 'high',          label: 'High',    color: '#EF4444' },
    { value: 'not-applicable',label: 'N/A',     color: '#9CA3AF' },
  ];

  const ANSWER_OPTIONS: { value: SignalingAnswer; label: string }[] = [
    { value: 'yes',            label: 'Yes' },
    { value: 'probably-yes',   label: 'Prob. Yes' },
    { value: 'no',             label: 'No' },
    { value: 'probably-no',    label: 'Prob. No' },
    { value: 'no-information', label: 'No Info' },
    { value: 'not-applicable', label: 'N/A' },
  ];

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.7rem', border: '1px solid #D1D5DB', borderRadius: 7,
    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Current summary */}
      {existing && (
        <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E5E7EB', padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700, color: '#1C2B3A' }}>Current Assessment</h3>
          <RoBTrafficLight domains={existing.domains} overallRisk={existing.overallRisk} />
        </div>
      )}

      {/* Domain assessments */}
      <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E5E7EB', padding: '1rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#1C2B3A' }}>
          Domain-level Assessments (RoB 2)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {domains.map(domain => {
            const domainDef = ROB2_DOMAINS.find(d => d.id === domain.id);
            return (
              <details key={domain.id} style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
                <summary style={{ padding: '0.7rem 1rem', cursor: 'pointer', background: '#F9FAFB', display: 'flex', alignItems: 'center', gap: '0.75rem', listStyle: 'none', fontWeight: 600, fontSize: '0.875rem', color: '#1C2B3A' }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: JUDGMENT_OPTIONS.find(j => j.value === domain.judgment)?.color ?? '#9CA3AF', flexShrink: 0 }} />
                  {domain.name}
                  <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#9CA3AF' }}>▼</span>
                </summary>
                <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Signaling questions */}
                  {domain.signalingQuestions.map(sq => (
                    <div key={sq.id}>
                      <div style={{ fontSize: '0.82rem', color: '#374151', marginBottom: 4 }}>{sq.question}</div>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {ANSWER_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => updateQuestion(domain.id, sq.id, { answer: opt.value })}
                            style={{
                              padding: '0.2rem 0.55rem', borderRadius: 5, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                              background: sq.answer === opt.value ? '#1C2B3A' : '#F3F4F6',
                              color: sq.answer === opt.value ? 'white' : '#374151',
                              border: `1px solid ${sq.answer === opt.value ? '#1C2B3A' : '#E5E7EB'}`,
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Domain judgment */}
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Domain Judgment</div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {JUDGMENT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => updateDomain(domain.id, { judgment: opt.value })}
                          style={{
                            padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                            background: domain.judgment === opt.value ? opt.color : '#F3F4F6',
                            color: domain.judgment === opt.value ? 'white' : '#374151',
                            border: `2px solid ${domain.judgment === opt.value ? opt.color : '#E5E7EB'}`,
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rationale */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 3 }}>Rationale</label>
                    <textarea
                      value={domain.rationale}
                      onChange={e => updateDomain(domain.id, { rationale: e.target.value })}
                      rows={2}
                      style={{ ...inputStyle, resize: 'vertical' }}
                      placeholder="Explain your judgment for this domain..."
                    />
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </div>

      {/* Overall judgment */}
      <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E5E7EB', padding: '1rem' }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700, color: '#1C2B3A' }}>Overall Risk Judgment</h3>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          {RISK_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setOverallRisk(opt.value)}
              style={{
                padding: '0.45rem 1.1rem', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                background: overallRisk === opt.value ? opt.color : '#F3F4F6',
                color: overallRisk === opt.value ? 'white' : '#374151',
                border: `2px solid ${overallRisk === opt.value ? opt.color : '#E5E7EB'}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 3 }}>Justification</label>
        <textarea
          value={justification}
          onChange={e => setJustification(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
          placeholder="Overall justification for risk judgment..."
        />
      </div>

      <button
        onClick={handleSave}
        style={{ alignSelf: 'flex-end', padding: '0.6rem 1.4rem', background: JOURNAL_PRIMARY, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
      >
        <Save size={15} /> Save Assessment
      </button>
    </div>
  );
}

// ─── Report Tab ───────────────────────────────────────────────────────────────

function ReportTab({ submission }: { submission: any }) {
  const { generateVerificationReport, exportAuditLog } = useJournal();
  const report = submission.verificationReport;

  const exportReport = () => {
    const content = JSON.stringify(report, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification-report-${submission.manuscriptId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const STATUS_ICONS: Record<string, React.ReactNode> = {
    pass: <CheckCircle size={16} color="#10B981" />,
    warning: <AlertTriangle size={16} color="#F59E0B" />,
    fail: <AlertCircle size={16} color="#EF4444" />,
    info: <BarChart2 size={16} color="#3B82F6" />,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Shared VerificationPanel — links outputs to original dataset + audit trail */}
      <VerificationPanel submissionId={submission.id} />

      {/* Generate button */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {report && (
          <button onClick={exportReport} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', color: '#374151' }}>
            <Download size={14} /> Export JSON
          </button>
        )}
        <button
          onClick={() => generateVerificationReport(submission.id)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.1rem', background: JOURNAL_PRIMARY, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', color: 'white', fontWeight: 600 }}
        >
          <RefreshCw size={14} /> {report ? 'Regenerate Report' : 'Generate Report'}
        </button>
      </div>

      {!report && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF', border: '1px dashed #E5E7EB', borderRadius: 10, background: '#FFFFFF' }}>
          <FileText size={36} color="#D1D5DB" style={{ marginBottom: '0.75rem' }} />
          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>No report generated yet</p>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.82rem' }}>Click "Generate Report" to create a verification report from the analysis results.</p>
        </div>
      )}

      {report && (
        <>
          {/* Verdict banner */}
          {(() => {
            const v = VERDICT_CONFIG[report.overallVerdict] ?? VERDICT_CONFIG['cannot-verify'];
            return (
              <div style={{ background: v.bg, border: `2px solid ${v.color}22`, borderRadius: 12, padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: v.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Overall Verdict</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: v.color }}>{v.label}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>{report.verified}</div>
                      <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>Verified</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F59E0B' }}>{report.discrepant}</div>
                      <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>Discrepant</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#9CA3AF' }}>{report.cannotVerify}</div>
                      <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>Cannot Verify</div>
                    </div>
                  </div>
                </div>
                <p style={{ margin: '0.75rem 0 0', fontSize: '0.875rem', color: v.color, lineHeight: 1.6 }}>{report.summary}</p>
              </div>
            );
          })()}

          {/* Sections */}
          <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #E5E7EB' }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1C2B3A' }}>Report Sections</h3>
            </div>
            {report.sections.map((section: any, i: number) => (
              <div key={i} style={{ padding: '0.85rem 1rem', borderBottom: i < report.sections.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                  {STATUS_ICONS[section.status]}
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1C2B3A' }}>{section.title}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#374151' }}>{section.content}</p>
                {section.details && <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#6B7280' }}>{section.details}</p>}
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E5E7EB', padding: '1rem' }}>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700, color: '#1C2B3A' }}>Recommendations</h3>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {report.recommendations.map((rec: string, i: number) => (
                  <li key={i} style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ fontSize: '0.78rem', color: '#9CA3AF', textAlign: 'right' }}>
            Generated {new Date(report.generatedAt).toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Audit Tab ────────────────────────────────────────────────────────────────

function AuditTab({ submission }: { submission: any }) {
  const { exportAuditLog } = useJournal();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <button onClick={() => exportAuditLog(submission.id, 'csv')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 7, cursor: 'pointer', fontSize: '0.8rem', color: '#374151' }}>
          <Download size={13} /> CSV
        </button>
        <button onClick={() => exportAuditLog(submission.id, 'json')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 7, cursor: 'pointer', fontSize: '0.8rem', color: '#374151' }}>
          <Download size={13} /> JSON
        </button>
      </div>
      <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E5E7EB', padding: '1rem' }}>
        <AuditTimeline entries={submission.auditLog} />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SubmissionReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, updateSubmission } = useJournal();

  const submission = state.submissions.find(s => s.id === id);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  if (!submission) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#9CA3AF' }}>
        <FileText size={48} color="#D1D5DB" style={{ marginBottom: '1rem' }} />
        <h2 style={{ margin: '0 0 0.5rem', color: '#374151' }}>Submission not found</h2>
        <p style={{ margin: '0 0 1.5rem' }}>The submission you are looking for does not exist or has been removed.</p>
        <button onClick={() => navigate('/journal')} style={{ padding: '0.6rem 1.5rem', background: JOURNAL_PRIMARY, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const STATUS_OPTIONS: { value: typeof submission.status; label: string }[] = [
    { value: 'pending',   label: 'Pending'   },
    { value: 'in-review', label: 'In Review' },
    { value: 'verified',  label: 'Verified'  },
    { value: 'flagged',   label: 'Flagged'   },
    { value: 'rejected',  label: 'Rejected'  },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 1200 }}>
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/journal')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '0.85rem', padding: 0, marginBottom: '0.75rem' }}
        >
          <ArrowLeft size={15} /> Back to Dashboard
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: JOURNAL_PRIMARY, background: '#F5EEF8', padding: '0.2rem 0.6rem', borderRadius: 6 }}>
                {submission.manuscriptId}
              </span>
              <VerificationStatusBadge status={submission.status} size="md" />
              {submission.priority !== 'normal' && (
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: submission.priority === 'urgent' ? '#EF4444' : '#F59E0B', textTransform: 'uppercase' }}>
                  ● {submission.priority}
                </span>
              )}
            </div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#1C2B3A', lineHeight: 1.3 }}>
              {submission.title}
            </h1>
            {submission.authors.length > 0 && (
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', color: '#6B7280' }}>
                {submission.authors.map((a: any) => a.name).filter(Boolean).join(', ')}
              </p>
            )}
          </div>

          {/* Status quick-update */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
            <select
              value={submission.status}
              onChange={e => updateSubmission(submission.id, { status: e.target.value as any })}
              style={{ padding: '0.45rem 0.85rem', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: '0.85rem', background: 'white', cursor: 'pointer', outline: 'none' }}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: 0, background: '#FFFFFF', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                padding: '0.7rem 0.5rem',
                background: isActive ? JOURNAL_PRIMARY : 'transparent',
                color: isActive ? 'white' : '#6B7280',
                border: 'none',
                borderRight: '1px solid #E5E7EB',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: isActive ? 700 : 400,
                transition: 'background 0.15s, color 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={14} />
              <span className="tab-label">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'overview'  && <OverviewTab  submission={submission} />}
      {activeTab === 'analyses'  && <AnalysesTab  submission={submission} />}
      {activeTab === 'dataset'   && <DatasetTab   submission={submission} />}
      {activeTab === 'rob'       && <RoBTab       submission={submission} />}
      {activeTab === 'report'    && <ReportTab    submission={submission} />}
      {activeTab === 'audit'     && <AuditTab     submission={submission} />}

      <style>{`
        @media (max-width: 640px) {
          .tab-label { display: none; }
        }
      `}</style>
    </div>
  );
}
