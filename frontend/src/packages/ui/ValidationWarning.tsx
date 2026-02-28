import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type WarningSeverity = 'error' | 'warning' | 'info';

export interface ValidationWarningProps {
  field?: string;
  message: string;
  suggestion?: string;
  severity?: WarningSeverity;
}

const SEVERITY_STYLES: Record<WarningSeverity, {
  bg: string; color: string; icon: React.ElementType;
}> = {
  error:   { bg: '#FDEDEC', color: '#A93226', icon: AlertCircle },
  warning: { bg: '#FEF9E7', color: '#D68910', icon: AlertTriangle },
  info:    { bg: '#EBF5FB', color: '#1a5276', icon: Info },
};

export function ValidationWarning({
  field,
  message,
  suggestion,
  severity = 'error',
}: ValidationWarningProps) {
  const cfg = SEVERITY_STYLES[severity];
  const Icon = cfg.icon;

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'flex-start',
        background: cfg.bg,
        borderRadius: 6,
        padding: '0.4rem 0.75rem',
        color: cfg.color,
        fontSize: '0.82rem',
      }}
    >
      <Icon size={14} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
      <div>
        {field && <strong style={{ marginRight: '0.25rem' }}>{field}:</strong>}
        {message}
        {suggestion && (
          <div style={{ marginTop: '0.2rem', opacity: 0.85, fontStyle: 'italic' }}>
            Suggestion: {suggestion}
          </div>
        )}
      </div>
    </div>
  );
}

export default ValidationWarning;
