/**
 * NGO Platform — AlertsBanner wrapper
 *
 * Thin wrapper around the shared <AlertBanner /> component that pulls
 * alerts from NGOPlatformContext and maps them to the shared props shape.
 */
import React from 'react';
import { AlertBanner, AlertSeverity } from '../../../packages/ui';
import { useNGOPlatform } from '../context/NGOPlatformContext';

const NGO_SEVERITY_MAP: Record<string, AlertSeverity> = {
  info:     'info',
  warning:  'warning',
  critical: 'error',
};

const AlertsBanner: React.FC<{ projectId?: string }> = ({ projectId }) => {
  const { generateAlerts, dismissAlert } = useNGOPlatform();

  let alerts = generateAlerts();
  if (projectId) alerts = alerts.filter((a: any) => a.projectId === projectId);
  alerts = alerts.filter((a: any) => !a.dismissed);

  const visible = alerts.slice(0, 5);
  const moreCount = alerts.length - visible.length;

  return (
    <div style={{ marginBottom: 16 }}>
      {visible.map((a: any) => (
        <AlertBanner
          key={a.id}
          severity={NGO_SEVERITY_MAP[a.severity] ?? 'info'}
          message={a.message}
          dismissible={a.severity !== 'critical'}
          onDismiss={() => dismissAlert(a.id)}
          actions={a.actionLabel ? [{
            label: a.actionLabel,
            onClick: () => { window.location.href = a.actionRoute; },
          }] : []}
        />
      ))}
      {moreCount > 0 && (
        <div style={{ color: '#2E86C1', fontSize: 13, marginTop: 4 }}>
          {moreCount} more alert{moreCount > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default AlertsBanner;
