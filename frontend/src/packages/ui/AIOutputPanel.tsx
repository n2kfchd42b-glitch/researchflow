// ─── AIOutputPanel ────────────────────────────────────────────────────────────
// Required wrapper for every AI-generated output surface in the UI.
//
// Every component that displays an AI output MUST use this panel.
// It handles all required states: idle, loading, success, error, stale.
// It also renders confidence level and warnings.
//
// Do NOT call AI service functions from inside this component.
// Data must already be fetched and passed as props.

import React from 'react';
import { RefreshCw, AlertTriangle, Info, CheckCircle, Clock, Loader } from 'lucide-react';
import type { AIOutputStatus } from '../ai/types';
import type { ProductContext } from './theme';
import { getTheme } from './theme';

export interface AIOutputPanelProps {
  /** Current state of the AI output */
  status: AIOutputStatus;
  /** Confidence level from the AI module output */
  confidence?: 'high' | 'medium' | 'low';
  /** Warnings returned by the AI module */
  warnings?: string[];
  /** Called when user clicks "Regenerate" (stale/error states) */
  onRegenerate?: () => void;
  /** The rendered AI content — only shown in success/stale states */
  children?: React.ReactNode;
  /** Error message when status === 'error' */
  errorMessage?: string;
  /** Optional label for the panel header */
  label?: string;
  /** Product context for theming */
  context?: ProductContext;
  /** When true, hide the panel header bar */
  minimal?: boolean;
}

const CONFIDENCE_CONFIG = {
  high:   { color: '#1E8449', bg: '#E9F7EF', label: 'High confidence' },
  medium: { color: '#7D6608', bg: '#FEF9E7', label: 'Medium confidence' },
  low:    { color: '#922B21', bg: '#FDEDEC', label: 'Low confidence' },
};

export function AIOutputPanel({
  status,
  confidence,
  warnings = [],
  onRegenerate,
  children,
  errorMessage,
  label = 'AI Output',
  context = 'student',
  minimal = false,
}: AIOutputPanelProps) {
  const theme = getTheme(context);
  const confCfg = confidence ? CONFIDENCE_CONFIG[confidence] : null;

  // ── Loading state ──────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={`${label} — generating`}
        style={{
          border: `1px solid ${theme.accentLight}`,
          borderRadius: 10,
          padding: '1.5rem',
          background: theme.accentBg,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: theme.accentDark,
          fontSize: '0.9rem',
        }}
      >
        <Loader size={18} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
        <span>Generating {label.toLowerCase()}…</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Idle state ─────────────────────────────────────────────────────────────
  if (status === 'idle') {
    return (
      <div
        style={{
          border: '1px dashed #ccc',
          borderRadius: 10,
          padding: '1.25rem',
          background: '#fafafa',
          color: '#888',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <Info size={16} />
        <span>{label} will appear here once generated.</span>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div
        role="alert"
        style={{
          border: '1px solid #FADBD8',
          borderRadius: 10,
          padding: '1.25rem',
          background: '#FDEDEC',
          color: '#922B21',
          fontSize: '0.875rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <AlertTriangle size={16} />
          <span>Failed to generate {label.toLowerCase()}</span>
        </div>
        {errorMessage && (
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', opacity: 0.85 }}>
            {errorMessage}
          </p>
        )}
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            style={{
              marginTop: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.9rem',
              background: '#922B21',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} />
            Try again
          </button>
        )}
      </div>
    );
  }

  // ── Success + Stale states ─────────────────────────────────────────────────
  const isStale = status === 'stale';

  return (
    <div
      style={{
        border: `1px solid ${isStale ? '#F9E79F' : theme.accentLight}`,
        borderRadius: 10,
        overflow: 'hidden',
        background: 'white',
      }}
    >
      {/* Header bar */}
      {!minimal && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.6rem 1rem',
            background: isStale ? '#FEF9E7' : theme.accentBg,
            borderBottom: `1px solid ${isStale ? '#F9E79F' : theme.accentLight}`,
            fontSize: '0.8rem',
          }}
        >
          {/* Status badge */}
          {isStale ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                color: '#7D6608',
                fontWeight: 600,
              }}
            >
              <Clock size={13} />
              Stale — source data changed
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                color: theme.accentDark,
                fontWeight: 600,
              }}
            >
              <CheckCircle size={13} />
              {label}
            </span>
          )}

          {/* Spacer */}
          <span style={{ flex: 1 }} />

          {/* Confidence badge */}
          {confCfg && (
            <span
              title={confCfg.label}
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '0.15rem 0.5rem',
                borderRadius: 20,
                background: confCfg.bg,
                color: confCfg.color,
              }}
            >
              {confCfg.label}
            </span>
          )}

          {/* Regenerate button */}
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              title={isStale ? 'Source data changed — regenerate' : 'Regenerate'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.25rem 0.65rem',
                background: isStale ? '#7D6608' : theme.accent,
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={12} />
              {isStale ? 'Regenerate' : 'Refresh'}
            </button>
          )}
        </div>
      )}

      {/* Warnings bar */}
      {warnings.length > 0 && (
        <div
          style={{
            padding: '0.5rem 1rem',
            background: '#FEF9E7',
            borderBottom: '1px solid #F9E79F',
            fontSize: '0.78rem',
            color: '#7D6608',
          }}
        >
          {warnings.map((w, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
              <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '1rem' }}>{children}</div>
    </div>
  );
}

export default AIOutputPanel;
