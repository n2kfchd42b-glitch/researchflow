import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'success';

export interface AlertAction {
  label: string;
  onClick: () => void;
}

export interface AlertBannerProps {
  severity: AlertSeverity;
  message: string;
  dismissible?: boolean;
  actions?: AlertAction[];
  onDismiss?: () => void;
}

const SEVERITY_CONFIG: Record<AlertSeverity, {
  bg: string; border: string; color: string; icon: React.ElementType;
}> = {
  info:    { bg: '#EBF5FB', border: '#2E86C1', color: '#1a5276', icon: Info },
  warning: { bg: '#FEF9E7', border: '#F9E79F', color: '#7D6608', icon: AlertTriangle },
  error:   { bg: '#FDEDEC', border: '#FADBD8', color: '#922B21', icon: AlertCircle },
  success: { bg: '#E9F7EF', border: '#A9DFBF', color: '#1E8449', icon: CheckCircle },
};

export function AlertBanner({
  severity,
  message,
  dismissible = true,
  actions = [],
  onDismiss,
}: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const cfg = SEVERITY_CONFIG[severity];
  const Icon = cfg.icon;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        background: cfg.bg,
        borderLeft: `5px solid ${cfg.border}`,
        borderRadius: 8,
        padding: '0.65rem 1rem',
        marginBottom: 8,
        color: cfg.color,
        fontSize: '0.875rem',
      }}
    >
      <Icon size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{message}</span>

      {actions.map((action, idx) => (
        <button
          key={idx}
          onClick={action.onClick}
          style={{
            background: cfg.border,
            color: 'white',
            border: 'none',
            borderRadius: 6,
            padding: '0.3rem 0.75rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {action.label}
        </button>
      ))}

      {dismissible && (
        <button
          onClick={handleDismiss}
          aria-label="Dismiss alert"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: cfg.color,
            padding: '0.15rem',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            opacity: 0.7,
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export default AlertBanner;
