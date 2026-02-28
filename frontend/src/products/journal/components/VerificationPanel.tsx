import React from 'react';
import { Link2, ExternalLink, Lock } from 'lucide-react';
import { ReportExporter, ExportFormat, ActivityFeed, ActivityEvent } from '../../../packages/ui';
import { useJournal } from '../context/JournalContext';

interface VerificationPanelProps {
  submissionId: string;
}

/**
 * VerificationPanel — Journal-specific wrapper around ReportExporter.
 * Links exported outputs back to the original submitted dataset and surfaces
 * reviewer audit entries alongside the export controls.
 *
 * All analysis inputs rendered here are read-only (locked).
 */
export function VerificationPanel({ submissionId }: VerificationPanelProps) {
  const { state, generateVerificationReport } = useJournal();
  const submission = state.submissions.find(s => s.id === submissionId);

  if (!submission) return null;

  const auditEvents: ActivityEvent[] = (submission.auditLog ?? []).map(e => ({
    id: e.id,
    actor: e.performedBy,
    action: e.action,
    detail: e.details,
    timestamp: e.timestamp,
    category: e.category,
    icon: e.category === 'submission'   ? '📄'
        : e.category === 'verification' ? '✅'
        : e.category === 'assessment'   ? '🔬'
        : e.category === 'report'       ? '📊'
        : '📋',
  }));

  const datasetHash = submission.dataset?.sha256Hash;
  const payload: Record<string, unknown> = {
    context: 'journal',
    submissionId,
    manuscriptId: submission.manuscriptId,
    title: submission.title,
    datasetHash,
    verificationReport: submission.verificationReport,
  };

  const handleExport = async (format: ExportFormat) => {
    // Ensure a verification report exists before exporting
    if (!submission.verificationReport) {
      generateVerificationReport(submissionId);
    }
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';
    const res = await fetch(`${API_URL}/generate-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, format, templateId: 'verification' }),
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${submission.manuscriptId}_verification.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Dataset provenance link */}
      <div style={{
        background: '#EEF2F9',
        borderRadius: 8,
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        fontSize: '0.82rem',
      }}>
        <Link2 size={14} color="#2a4a7a" aria-hidden="true" />
        <span style={{ color: '#374151' }}>Linked to submitted dataset</span>
        {datasetHash && (
          <code style={{
            marginLeft: 'auto',
            background: '#D8E4F5',
            padding: '1px 6px',
            borderRadius: 4,
            fontSize: '0.7rem',
            color: '#2a4a7a',
            fontFamily: 'monospace',
          }}>
            SHA-256: {datasetHash!.slice(0, 12)}…
          </code>
        )}
      </div>

      {/* Read-only verification state */}
      <div style={{
        background: '#F9FAFB',
        borderRadius: 8,
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.82rem',
        color: '#6B7280',
        border: '1px solid #E5E7EB',
      }}>
        <Lock size={13} aria-hidden="true" />
        Analysis inputs are locked — verification mode is read-only
      </div>

      {/* Report export — driven by formats[] prop */}
      <ReportExporter
        context="journal"
        formats={['pdf', 'docx', 'csv']}
        payload={payload}
        templateId="verification"
        onExport={handleExport}
        label="Export Verification Report"
      />

      {/* Reviewer audit trail */}
      {auditEvents.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: 10,
          border: '1px solid #E5E7EB',
          padding: '0.85rem 1rem',
        }}>
          <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700, color: '#1C2B3A' }}>
            Reviewer Audit Trail
          </h4>
          <ActivityFeed
            context="journal"
            events={auditEvents}
            showActor
            showTimestamp
            maxItems={20}
          />
        </div>
      )}
    </div>
  );
}

export default VerificationPanel;
