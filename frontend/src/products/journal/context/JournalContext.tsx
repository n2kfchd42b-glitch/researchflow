import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Author {
  name: string;
  affiliation: string;
  email: string;
  isCorresponding: boolean;
}

export interface DatasetColumn {
  name: string;
  type: 'numeric' | 'categorical' | 'date' | 'text' | 'binary';
  missingCount: number;
  missingPercent: number;
  uniqueValues: number;
  summary: {
    mean?: number;
    median?: number;
    sd?: number;
    min?: number;
    max?: number;
    mode?: string;
    frequencies?: Record<string, number>;
  };
}

export interface SubmissionDataset {
  id: string;
  fileName: string;
  rowCount: number;
  columnCount: number;
  columns: DatasetColumn[];
  uploadedAt: string;
  sha256Hash: string;
  integrityVerified: boolean;
}

export interface ReportedAnalysis {
  id: string;
  type: 'table1' | 'regression' | 'survival' | 'meta-analysis' | 'subgroup' | 'sensitivity' | 'psm' | 'descriptive' | 'forest-plot' | 'other';
  description: string;
  reportedResults: string;
  tableOrFigureRef: string;
  pageNumber: number | null;
  parameters: Record<string, any>;
  status: 'pending' | 'verified' | 'discrepant' | 'cannot-verify';
}

export interface VerificationResult {
  id: string;
  analysisId: string;
  reproducedResults: string;
  match: 'exact' | 'minor-discrepancy' | 'major-discrepancy' | 'cannot-reproduce';
  discrepancyDetails: string;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  reproducedAt: string;
  reproducedBy: string;
  engineModule: string;
  parameters: Record<string, any>;
  rawOutput: any;
  notes: string;
}

export interface ReportSection {
  title: string;
  content: string;
  status: 'pass' | 'warning' | 'fail' | 'info';
  details: string;
}

export interface VerificationReport {
  id: string;
  generatedAt: string;
  overallVerdict: 'fully-verified' | 'partially-verified' | 'significant-discrepancies' | 'cannot-verify';
  summary: string;
  totalAnalyses: number;
  verified: number;
  discrepant: number;
  cannotVerify: number;
  recommendations: string[];
  sections: ReportSection[];
}

export interface SignalingQuestion {
  id: string;
  question: string;
  answer: 'yes' | 'probably-yes' | 'no' | 'probably-no' | 'no-information' | 'not-applicable';
  comment: string;
}

export interface RoBDomain {
  id: string;
  name: string;
  judgment: 'low' | 'some-concerns' | 'high' | 'not-applicable';
  rationale: string;
  supportingQuotes: string[];
  signalingQuestions: SignalingQuestion[];
}

export interface RoBAssessment {
  id: string;
  tool: 'rob2' | 'robins-i' | 'newcastle-ottawa' | 'custom';
  assessedAt: string;
  assessedBy: string;
  overallRisk: 'low' | 'some-concerns' | 'high';
  domains: RoBDomain[];
  justification: string;
  supportingInfo: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  details: string;
  category: 'submission' | 'verification' | 'assessment' | 'report' | 'system';
  metadata: Record<string, any>;
}

export interface Submission {
  id: string;
  manuscriptId: string;
  title: string;
  authors: Author[];
  journal: string;
  submittedAt: string;
  status: 'pending' | 'in-review' | 'verified' | 'flagged' | 'rejected';
  assignedReviewer: string | null;
  dataset: SubmissionDataset | null;
  reportedAnalyses: ReportedAnalysis[];
  verificationResults: VerificationResult[];
  verificationReport: VerificationReport | null;
  auditLog: AuditEntry[];
  riskOfBiasAssessment: RoBAssessment | null;
  notes: string;
  deadline: string | null;
  priority: 'normal' | 'high' | 'urgent';
  studyType?: string;
}

export interface JournalSettings {
  defaultRoBTool: 'rob2' | 'robins-i' | 'newcastle-ottawa' | 'custom';
  requireDatasetHash: boolean;
  autoFlagThreshold: 'any-discrepancy' | 'major-only' | 'critical-only';
  reportFormat: 'detailed' | 'summary';
  deadlineWarningDays: number;
  journalName: string;
  defaultReviewerName: string;
  editorInChiefName: string;
  reportHeaderText: string;
  reportFooterText: string;
  includeAppendix: boolean;
  includeAuditTrail: boolean;
}

export interface JournalState {
  submissions: Submission[];
  activeSubmissionId: string | null;
  reviewerName: string;
  journalName: string;
  settings: JournalSettings;
}

interface JournalContextType {
  state: JournalState;
  activeSubmission: Submission | null;
  createSubmission: (submission: Partial<Submission>) => string;
  updateSubmission: (id: string, updates: Partial<Submission>) => void;
  setActiveSubmission: (id: string | null) => void;
  addReportedAnalysis: (submissionId: string, analysis: ReportedAnalysis) => void;
  updateReportedAnalysis: (submissionId: string, analysisId: string, updates: Partial<ReportedAnalysis>) => void;
  deleteReportedAnalysis: (submissionId: string, analysisId: string) => void;
  addVerificationResult: (submissionId: string, result: VerificationResult) => void;
  generateVerificationReport: (submissionId: string) => void;
  setRoBAssessment: (submissionId: string, assessment: RoBAssessment) => void;
  addAuditEntry: (submissionId: string, entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  updateSettings: (updates: Partial<JournalSettings>) => void;
  getSubmissionStats: () => { total: number; pending: number; inReview: number; verified: number; flagged: number; rejected: number };
  exportAuditLog: (submissionId: string, format: 'json' | 'csv') => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: JournalSettings = {
  defaultRoBTool: 'rob2',
  requireDatasetHash: true,
  autoFlagThreshold: 'major-only',
  reportFormat: 'detailed',
  deadlineWarningDays: 7,
  journalName: '',
  defaultReviewerName: '',
  editorInChiefName: '',
  reportHeaderText: '',
  reportFooterText: '',
  includeAppendix: true,
  includeAuditTrail: true,
};

const DEFAULT_STATE: JournalState = {
  submissions: [],
  activeSubmissionId: null,
  reviewerName: '',
  journalName: '',
  settings: DEFAULT_SETTINGS,
};

const STORAGE_KEY = 'rf_journal_component';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function computeVerdict(results: VerificationResult[]): VerificationReport['overallVerdict'] {
  if (results.length === 0) return 'cannot-verify';
  const cannotReproduce = results.filter(r => r.match === 'cannot-reproduce').length;
  const major = results.filter(r => r.match === 'major-discrepancy').length;
  const minor = results.filter(r => r.match === 'minor-discrepancy').length;
  const exact = results.filter(r => r.match === 'exact').length;
  if (cannotReproduce > 0 && exact === 0) return 'cannot-verify';
  if (major > 0) return 'significant-discrepancies';
  if (minor > 0 || cannotReproduce > 0) return 'partially-verified';
  return 'fully-verified';
}

function generateRecommendations(verdict: VerificationReport['overallVerdict'], results: VerificationResult[]): string[] {
  const recs: string[] = [];
  const cannotCount = results.filter(r => r.match === 'cannot-reproduce').length;
  const majorCount = results.filter(r => r.match === 'major-discrepancy').length;
  const minorCount = results.filter(r => r.match === 'minor-discrepancy').length;

  if (verdict === 'fully-verified') {
    recs.push('All analyses are independently reproducible. Recommend proceeding with peer review.');
  } else if (verdict === 'partially-verified') {
    if (minorCount > 0) recs.push(`Minor numerical differences found in ${minorCount} analysis(es) (likely due to rounding or software version differences). Recommend authors provide clarification.`);
    if (cannotCount > 0) recs.push(`Unable to reproduce ${cannotCount} analysis(es). Recommend requesting the authors' analysis code and complete analytical dataset.`);
  } else if (verdict === 'significant-discrepancies') {
    recs.push(`Significant discrepancies detected in ${majorCount} analysis(es). Recommend requesting authors' analysis code and re-verification before proceeding.`);
    recs.push('Consider requiring authors to share a reproducible analysis script (R, Stata, Python) as a supplementary file.');
  } else if (verdict === 'cannot-verify') {
    recs.push('Unable to reproduce the reported analyses. Recommend requesting complete analytical dataset and detailed analysis code.');
    recs.push('Consider rejecting the submission until reproducibility can be established.');
  }
  return recs;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const JournalContext = createContext<JournalContextType | undefined>(undefined);

export function useJournal(): JournalContextType {
  const ctx = useContext(JournalContext);
  if (!ctx) throw new Error('useJournal must be used within JournalProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function JournalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<JournalState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved) as JournalState;
    } catch {}
    return DEFAULT_STATE;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const activeSubmission = state.submissions.find(s => s.id === state.activeSubmissionId) ?? null;

  const createSubmission = useCallback((partial: Partial<Submission>): string => {
    const id = generateId();
    const now = new Date().toISOString();
    const submission: Submission = {
      id,
      manuscriptId: partial.manuscriptId ?? '',
      title: partial.title ?? '',
      authors: partial.authors ?? [],
      journal: partial.journal ?? '',
      submittedAt: partial.submittedAt ?? now,
      status: partial.status ?? 'pending',
      assignedReviewer: partial.assignedReviewer ?? null,
      dataset: partial.dataset ?? null,
      reportedAnalyses: partial.reportedAnalyses ?? [],
      verificationResults: partial.verificationResults ?? [],
      verificationReport: null,
      auditLog: [],
      riskOfBiasAssessment: null,
      notes: partial.notes ?? '',
      deadline: partial.deadline ?? null,
      priority: partial.priority ?? 'normal',
      studyType: partial.studyType ?? '',
    };

    const auditEntry: AuditEntry = {
      id: generateId(),
      timestamp: now,
      action: 'Submission created',
      performedBy: partial.assignedReviewer ?? 'System',
      details: `Manuscript "${submission.title}" (${submission.manuscriptId}) added to the review queue.`,
      category: 'submission',
      metadata: { manuscriptId: submission.manuscriptId, title: submission.title },
    };

    setState(prev => ({
      ...prev,
      submissions: [...prev.submissions, { ...submission, auditLog: [auditEntry] }],
      activeSubmissionId: id,
    }));
    return id;
  }, []);

  const updateSubmission = useCallback((id: string, updates: Partial<Submission>) => {
    setState(prev => {
      const sub = prev.submissions.find(s => s.id === id);
      if (!sub) return prev;
      const oldStatus = sub.status;
      const newStatus = updates.status;
      const updated: Submission = { ...sub, ...updates };

      let auditEntries = [...sub.auditLog];
      if (newStatus && newStatus !== oldStatus) {
        auditEntries = [{
          id: generateId(),
          timestamp: new Date().toISOString(),
          action: `Status changed to "${newStatus}"`,
          performedBy: prev.settings.defaultReviewerName || 'Reviewer',
          details: `Submission status changed from "${oldStatus}" to "${newStatus}".`,
          category: 'submission',
          metadata: { oldStatus, newStatus },
        }, ...auditEntries];
      }
      return {
        ...prev,
        submissions: prev.submissions.map(s => s.id === id ? { ...updated, auditLog: auditEntries } : s),
      };
    });
  }, []);

  const setActiveSubmission = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, activeSubmissionId: id }));
  }, []);

  const addReportedAnalysis = useCallback((submissionId: string, analysis: ReportedAnalysis) => {
    const auditEntry: AuditEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      action: 'Reported analysis added',
      performedBy: '',
      details: `Analysis "${analysis.description}" (${analysis.type}) added. Reference: ${analysis.tableOrFigureRef}`,
      category: 'verification',
      metadata: { analysisId: analysis.id, type: analysis.type, ref: analysis.tableOrFigureRef },
    };
    setState(prev => ({
      ...prev,
      submissions: prev.submissions.map(s =>
        s.id === submissionId
          ? { ...s, reportedAnalyses: [...s.reportedAnalyses, analysis], auditLog: [auditEntry, ...s.auditLog] }
          : s
      ),
    }));
  }, []);

  const updateReportedAnalysis = useCallback((submissionId: string, analysisId: string, updates: Partial<ReportedAnalysis>) => {
    setState(prev => ({
      ...prev,
      submissions: prev.submissions.map(s =>
        s.id === submissionId
          ? { ...s, reportedAnalyses: s.reportedAnalyses.map(a => a.id === analysisId ? { ...a, ...updates } : a) }
          : s
      ),
    }));
  }, []);

  const deleteReportedAnalysis = useCallback((submissionId: string, analysisId: string) => {
    setState(prev => ({
      ...prev,
      submissions: prev.submissions.map(s =>
        s.id === submissionId
          ? { ...s, reportedAnalyses: s.reportedAnalyses.filter(a => a.id !== analysisId) }
          : s
      ),
    }));
  }, []);

  const addVerificationResult = useCallback((submissionId: string, result: VerificationResult) => {
    const auditEntry: AuditEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      action: `Verification recorded: ${result.match}`,
      performedBy: result.reproducedBy,
      details: `Analysis verified. Match: ${result.match}. Severity: ${result.severity}.`,
      category: 'verification',
      metadata: { analysisId: result.analysisId, match: result.match, severity: result.severity },
    };
    setState(prev => ({
      ...prev,
      submissions: prev.submissions.map(s => {
        if (s.id !== submissionId) return s;
        const existingIdx = s.verificationResults.findIndex(r => r.analysisId === result.analysisId);
        const newResults = existingIdx >= 0
          ? s.verificationResults.map((r, i) => i === existingIdx ? result : r)
          : [...s.verificationResults, result];
        // Update corresponding reported analysis status
        const matchToStatus = (m: VerificationResult['match']): ReportedAnalysis['status'] => {
          if (m === 'exact') return 'verified';
          if (m === 'minor-discrepancy' || m === 'major-discrepancy') return 'discrepant';
          return 'cannot-verify';
        };
        const newAnalyses = s.reportedAnalyses.map(a =>
          a.id === result.analysisId ? { ...a, status: matchToStatus(result.match) } : a
        );
        return { ...s, verificationResults: newResults, reportedAnalyses: newAnalyses, auditLog: [auditEntry, ...s.auditLog] };
      }),
    }));
  }, []);

  const generateVerificationReport = useCallback((submissionId: string) => {
    setState(prev => {
      const sub = prev.submissions.find(s => s.id === submissionId);
      if (!sub) return prev;

      const results = sub.verificationResults;
      const verdict = computeVerdict(results);
      const recs = generateRecommendations(verdict, results);

      const verdictLabels: Record<VerificationReport['overallVerdict'], string> = {
        'fully-verified': 'Fully Verified',
        'partially-verified': 'Partially Verified',
        'significant-discrepancies': 'Significant Discrepancies',
        'cannot-verify': 'Cannot Verify',
      };

      const sections: ReportSection[] = [
        {
          title: 'Dataset Verification',
          content: sub.dataset
            ? `Dataset: ${sub.dataset.fileName} (${sub.dataset.rowCount} rows × ${sub.dataset.columnCount} columns)`
            : 'No dataset provided.',
          status: sub.dataset ? (sub.dataset.integrityVerified ? 'pass' : 'warning') : 'fail',
          details: sub.dataset
            ? `SHA-256: ${sub.dataset.sha256Hash}. Integrity: ${sub.dataset.integrityVerified ? 'Verified' : 'Not verified'}.`
            : 'Dataset was not submitted for verification.',
        },
        {
          title: 'Analysis Verification Summary',
          content: `${results.length} of ${sub.reportedAnalyses.length} reported analyses independently verified.`,
          status: verdict === 'fully-verified' ? 'pass' : verdict === 'partially-verified' ? 'warning' : 'fail',
          details: `Exact matches: ${results.filter(r => r.match === 'exact').length}. Minor discrepancies: ${results.filter(r => r.match === 'minor-discrepancy').length}. Major discrepancies: ${results.filter(r => r.match === 'major-discrepancy').length}. Cannot reproduce: ${results.filter(r => r.match === 'cannot-reproduce').length}.`,
        },
        {
          title: 'Risk of Bias Assessment',
          content: sub.riskOfBiasAssessment
            ? `Tool: ${sub.riskOfBiasAssessment.tool.toUpperCase()}. Overall risk: ${sub.riskOfBiasAssessment.overallRisk}.`
            : 'Risk of bias assessment not completed.',
          status: sub.riskOfBiasAssessment
            ? (sub.riskOfBiasAssessment.overallRisk === 'low' ? 'pass' : sub.riskOfBiasAssessment.overallRisk === 'some-concerns' ? 'warning' : 'fail')
            : 'info',
          details: sub.riskOfBiasAssessment?.justification ?? '',
        },
      ];

      const summaryMap: Record<VerificationReport['overallVerdict'], string> = {
        'fully-verified': `All ${results.length} reported analyses were independently reproduced with exact matching results. The manuscript's statistical analyses are fully reproducible.`,
        'partially-verified': `${results.filter(r => r.match === 'exact').length} of ${sub.reportedAnalyses.length} analyses were exactly reproduced. Minor discrepancies or reproducibility issues were identified in the remaining analyses.`,
        'significant-discrepancies': `Significant discrepancies were found in ${results.filter(r => r.match === 'major-discrepancy').length} analyses. The reported results do not match the independently reproduced results and require author response.`,
        'cannot-verify': `Independent verification could not be completed for the reported analyses. Insufficient information or missing data prevented reproduction.`,
      };

      const report: VerificationReport = {
        id: generateId(),
        generatedAt: new Date().toISOString(),
        overallVerdict: verdict,
        summary: summaryMap[verdict],
        totalAnalyses: sub.reportedAnalyses.length,
        verified: results.filter(r => r.match === 'exact').length,
        discrepant: results.filter(r => r.match === 'minor-discrepancy' || r.match === 'major-discrepancy').length,
        cannotVerify: results.filter(r => r.match === 'cannot-reproduce').length,
        recommendations: recs,
        sections,
      };

      const auditEntry: AuditEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        action: `Verification report generated: ${verdictLabels[verdict]}`,
        performedBy: prev.settings.defaultReviewerName || 'Reviewer',
        details: `Overall verdict: ${verdictLabels[verdict]}. ${results.length} analyses checked.`,
        category: 'report',
        metadata: { verdict, totalAnalyses: sub.reportedAnalyses.length },
      };

      // Auto-flag if discrepancies found
      let newStatus = sub.status;
      const threshold = prev.settings.autoFlagThreshold;
      const hasCritical = results.some(r => r.severity === 'critical');
      const hasMajor = results.some(r => r.match === 'major-discrepancy');
      const hasAny = results.some(r => r.match !== 'exact');
      if (threshold === 'any-discrepancy' && hasAny) newStatus = 'flagged';
      else if (threshold === 'major-only' && hasMajor) newStatus = 'flagged';
      else if (threshold === 'critical-only' && hasCritical) newStatus = 'flagged';
      else if (verdict === 'fully-verified') newStatus = 'verified';

      return {
        ...prev,
        submissions: prev.submissions.map(s =>
          s.id === submissionId
            ? { ...s, verificationReport: report, status: newStatus, auditLog: [auditEntry, ...s.auditLog] }
            : s
        ),
      };
    });
  }, []);

  const setRoBAssessment = useCallback((submissionId: string, assessment: RoBAssessment) => {
    const auditEntry: AuditEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      action: `Risk of Bias assessment saved (${assessment.tool.toUpperCase()})`,
      performedBy: assessment.assessedBy,
      details: `Overall risk: ${assessment.overallRisk}. Tool: ${assessment.tool}.`,
      category: 'assessment',
      metadata: { tool: assessment.tool, overallRisk: assessment.overallRisk },
    };
    setState(prev => ({
      ...prev,
      submissions: prev.submissions.map(s =>
        s.id === submissionId
          ? { ...s, riskOfBiasAssessment: assessment, auditLog: [auditEntry, ...s.auditLog] }
          : s
      ),
    }));
  }, []);

  const addAuditEntry = useCallback((submissionId: string, entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    const auditEntry: AuditEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    setState(prev => ({
      ...prev,
      submissions: prev.submissions.map(s =>
        s.id === submissionId
          ? { ...s, auditLog: [auditEntry, ...s.auditLog] }
          : s
      ),
    }));
  }, []);

  const updateSettings = useCallback((updates: Partial<JournalSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
      journalName: updates.journalName ?? prev.journalName,
      reviewerName: updates.defaultReviewerName ?? prev.reviewerName,
    }));
  }, []);

  const getSubmissionStats = useCallback(() => {
    const counts = { total: 0, pending: 0, inReview: 0, verified: 0, flagged: 0, rejected: 0 };
    state.submissions.forEach(s => {
      counts.total++;
      if (s.status === 'pending') counts.pending++;
      else if (s.status === 'in-review') counts.inReview++;
      else if (s.status === 'verified') counts.verified++;
      else if (s.status === 'flagged') counts.flagged++;
      else if (s.status === 'rejected') counts.rejected++;
    });
    return counts;
  }, [state.submissions]);

  const exportAuditLog = useCallback((submissionId: string, format: 'json' | 'csv') => {
    const sub = state.submissions.find(s => s.id === submissionId);
    if (!sub) return;
    const entries = sub.auditLog;
    let content = '';
    let filename = '';
    if (format === 'json') {
      content = JSON.stringify(entries, null, 2);
      filename = `audit-log-${sub.manuscriptId}-${Date.now()}.json`;
    } else {
      const header = 'Timestamp,Action,Performed By,Category,Details\n';
      const rows = entries.map(e =>
        `"${e.timestamp}","${e.action.replace(/"/g, '""')}","${e.performedBy.replace(/"/g, '""')}","${e.category}","${e.details.replace(/"/g, '""')}"`
      ).join('\n');
      content = header + rows;
      filename = `audit-log-${sub.manuscriptId}-${Date.now()}.csv`;
    }
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.submissions]);

  return (
    <JournalContext.Provider value={{
      state,
      activeSubmission,
      createSubmission,
      updateSubmission,
      setActiveSubmission,
      addReportedAnalysis,
      updateReportedAnalysis,
      deleteReportedAnalysis,
      addVerificationResult,
      generateVerificationReport,
      setRoBAssessment,
      addAuditEntry,
      updateSettings,
      getSubmissionStats,
      exportAuditLog,
    }}>
      {children}
    </JournalContext.Provider>
  );
}
