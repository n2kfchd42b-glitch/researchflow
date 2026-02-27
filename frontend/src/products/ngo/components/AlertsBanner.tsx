import React from 'react';
import { useNGOPlatform } from '../context/NGOPlatformContext';

const severityColors = {
  info: '#2E86C1',
  warning: '#F9E79F',
  critical: '#C0533A',
};

const AlertsBanner: React.FC<{ projectId?: string }> = ({ projectId }) => {
  const { state, generateAlerts, dismissAlert } = useNGOPlatform();
  let alerts = generateAlerts();
  if (projectId) alerts = alerts.filter(a => a.projectId === projectId);
  alerts = alerts.filter(a => !a.dismissed);
  const visibleAlerts = alerts.slice(0, 5);
  const moreCount = alerts.length - visibleAlerts.length;

  return (
    <div style={{ marginBottom: 16 }}>
      {visibleAlerts.map(a => (
        <div key={a.id} style={{ display: 'flex', alignItems: 'center', borderLeft: `6px solid ${severityColors[a.severity]}`, background: '#fff', borderRadius: 8, padding: '8px 16px', marginBottom: 8 }}>
          <span style={{ marginRight: 12 }}>{a.severity === 'critical' ? '❗' : a.severity === 'warning' ? '⚠️' : 'ℹ️'}</span>
          <span style={{ fontWeight: 600, color: '#1C2B3A', flex: 1 }}>{a.message}</span>
          <button style={{ background: '#5A8A6A', color: '#fff', borderRadius: 8, padding: '4px 12px', fontSize: 13, marginRight: 8 }} onClick={() => window.location.href = a.actionRoute}>{a.actionLabel}</button>
          {a.severity !== 'critical' && (
            <button style={{ background: '#e0e0e0', color: '#1C2B3A', borderRadius: 8, padding: '4px 12px', fontSize: 13 }} onClick={() => dismissAlert(a.id)}>Dismiss</button>
          )}
        </div>
      ))}
      {moreCount > 0 && (
        <div style={{ color: '#2E86C1', fontSize: 13, marginTop: 4 }}>Show {moreCount} more</div>
      )}
    </div>
  );
};

export default AlertsBanner;
