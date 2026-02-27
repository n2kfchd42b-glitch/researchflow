import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Info, Activity, Users, Database, TrendingUp, MapPin, RefreshCw } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ReferenceLine, Legend
} from 'recharts';
import { useNGO, SiteInfo } from '../context/NGOPlatformContext';
import StatusBadge from '../components/StatusBadge';
import EnrollmentChart from '../components/EnrollmentChart';

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type: string;
  message: string;
  site?: string;
  action: string;
}

function generateEnrollmentTimeline(sites: SiteInfo[]): { week: string; actual: number; target: number }[] {
  if (sites.length === 0) return [];
  const total = sites.reduce((s, site) => s + site.enrollmentActual, 0);
  const target = sites.reduce((s, site) => s + site.enrollmentTarget, 0);
  const weeks = 12;
  const data = [];
  for (let i = 0; i < weeks; i++) {
    const progress = Math.min(i / (weeks - 1), 1);
    const variance = 1 + (Math.random() - 0.5) * 0.15;
    data.push({
      week: `Wk ${i + 1}`,
      actual: Math.round(total * progress * variance),
      target: Math.round((target / weeks) * (i + 1)),
    });
  }
  data[weeks - 1].actual = total;
  return data;
}

function generateAlerts(project: any): Alert[] {
  const alerts: Alert[] = [];
  if (!project) return alerts;

  const behindSites = project.sites.filter((s: SiteInfo) => {
    const pct = s.enrollmentTarget > 0 ? s.enrollmentActual / s.enrollmentTarget : 0;
    return pct < 0.5 && s.status === 'active';
  });

  behindSites.forEach((s: SiteInfo) => {
    alerts.push({
      id: `alert-${s.id}`,
      severity: 'warning',
      type: 'Enrollment',
      message: `${s.name} is at ${Math.round((s.enrollmentActual / s.enrollmentTarget) * 100)}% of enrollment target`,
      site: s.name,
      action: 'Review site performance',
    });
  });

  if (project.ethicsStatus === 'expired') {
    alerts.push({ id: 'alert-ethics-exp', severity: 'critical', type: 'Ethics', message: 'Ethics approval has expired — data collection must pause', action: 'Renew ethics approval immediately' });
  }

  const ethicsExpiry = project.ethicsExpiryDate ? Math.ceil((new Date(project.ethicsExpiryDate).getTime() - Date.now()) / 86400000) : null;
  if (ethicsExpiry !== null && ethicsExpiry > 0 && ethicsExpiry <= 30) {
    alerts.push({ id: 'alert-ethics-near', severity: 'warning', type: 'Ethics', message: `Ethics approval expires in ${ethicsExpiry} days`, action: 'Submit renewal application' });
  }

  const totalEnroll = project.sites.reduce((s: number, site: SiteInfo) => s + site.enrollmentActual, 0);
  const targetEnroll = project.sites.reduce((s: number, site: SiteInfo) => s + site.enrollmentTarget, 0);
  if (targetEnroll > 0 && totalEnroll / targetEnroll < 0.5 && project.status === 'data-collection') {
    alerts.push({ id: 'alert-enroll-pace', severity: 'warning', type: 'Enrollment', message: `Overall enrollment at ${Math.round((totalEnroll / targetEnroll) * 100)}% — may not meet target`, action: 'Review recruitment strategy' });
  }

  const budgetPct = project.budgetTotal > 0 ? project.budgetSpent / project.budgetTotal : 0;
  if (budgetPct > 0.9) {
    alerts.push({ id: 'alert-budget', severity: 'critical', type: 'Budget', message: `Budget utilization at ${Math.round(budgetPct * 100)}% — review spending`, action: 'Review budget allocations' });
  }

  if (alerts.length === 0) {
    alerts.push({ id: 'alert-ok', severity: 'info', type: 'Status', message: 'All monitored indicators are within acceptable ranges', action: '' });
  }

  return alerts;
}

const SEVERITY_CONFIG = {
  critical: { bg: '#FEE2E2', border: '#FECACA', text: '#991B1B', icon: <AlertTriangle size={16} />, label: 'Critical' },
  warning:  { bg: '#FEF3C7', border: '#FDE68A', text: '#92400E', icon: <AlertTriangle size={16} />, label: 'Warning' },
  info:     { bg: '#DBEAFE', border: '#BFDBFE', text: '#1E40AF', icon: <Info size={16} />,          label: 'Info' },
};

export default function StudyMonitoringPage() {
  const { activeProject } = useNGO();
  const project = activeProject;
  const [expandedSite, setExpandedSite] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const sites = project?.sites || [];
  const totalEnroll = sites.reduce((s, site) => s + site.enrollmentActual, 0);
  const targetEnroll = sites.reduce((s, site) => s + site.enrollmentTarget, 0);
  const enrollPct = targetEnroll > 0 ? Math.round((totalEnroll / targetEnroll) * 100) : 0;

  const enrollTimeline = generateEnrollmentTimeline(sites);
  const alerts = generateAlerts(project);

  const today = new Date();
  const start = project?.startDate ? new Date(project.startDate) : today;
  const end = project?.endDate ? new Date(project.endDate) : today;
  const elapsed = Math.max(0, (today.getTime() - start.getTime()) / 86400000);
  const totalDays = Math.max(1, (end.getTime() - start.getTime()) / 86400000);
  const requiredRate = targetEnroll > 0 ? (targetEnroll / totalDays) * 7 : 0; // per week
  const actualRate = elapsed > 0 ? (totalEnroll / elapsed) * 7 : 0; // per week
  const paceColor = actualRate >= requiredRate * 0.9 ? '#27AE60' : actualRate >= requiredRate * 0.6 ? '#E67E22' : '#C0533A';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1C2B3A', margin: 0 }}>Study Monitoring</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {project?.name || 'No active project'} · Last refreshed {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={() => setLastRefresh(new Date())}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'white', border: '1px solid #E0E4E8', borderRadius: 8, padding: '0.45rem 0.875rem', cursor: 'pointer', fontSize: '0.82rem', color: '#6B7280' }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {alerts.map(alert => {
            const config = SEVERITY_CONFIG[alert.severity];
            return (
              <div key={alert.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.7rem 1rem', background: config.bg, borderRadius: 8, border: `1px solid ${config.border}`, borderLeft: `4px solid ${config.text}` }}>
                <span style={{ color: config.text, flexShrink: 0, marginTop: 1 }}>{config.icon}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: config.text, marginRight: '0.5rem' }}>{alert.type}</span>
                  <span style={{ fontSize: '0.82rem', color: config.text }}>{alert.message}</span>
                  {alert.site && <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', padding: '0.1rem 0.4rem', background: 'rgba(255,255,255,0.5)', borderRadius: 4, color: config.text }}>{alert.site}</span>}
                </div>
                {alert.action && (
                  <button style={{ background: 'none', border: `1px solid ${config.text}`, borderRadius: 6, padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', color: config.text, flexShrink: 0, fontWeight: 600 }}>
                    {alert.action}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Enrollment dashboard */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E4E8', padding: '1.25rem', marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontWeight: 700, color: '#1C2B3A', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Users size={16} /> Enrollment Dashboard
        </h3>

        {/* Summary metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {[
            { label: 'Total Enrolled', value: totalEnroll, color: '#5A8A6A' },
            { label: 'Target', value: targetEnroll, color: '#1C2B3A' },
            { label: 'Completion', value: `${enrollPct}%`, color: paceColor },
            { label: 'Rate/Week', value: `${Math.round(actualRate)}/wk`, color: paceColor },
            { label: 'Required Rate', value: `${Math.round(requiredRate)}/wk`, color: '#6B7280' },
            { label: 'Active Sites', value: sites.filter(s => s.status === 'active').length, color: '#2E86C1' },
          ].map(m => (
            <div key={m.label} style={{ background: '#F9FAFB', borderRadius: 10, padding: '0.75rem', border: '1px solid #E0E4E8' }}>
              <div style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: m.color, marginTop: '0.15rem' }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Overall progress bar */}
        <div style={{ marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
          <span style={{ color: '#6B7280' }}>Overall enrollment progress</span>
          <span style={{ fontWeight: 700, color: paceColor }}>{enrollPct}%</span>
        </div>
        <div style={{ height: 12, borderRadius: 6, background: '#E0E4E8', overflow: 'hidden', marginBottom: '1.25rem' }}>
          <div style={{ height: '100%', width: `${enrollPct}%`, background: paceColor, borderRadius: 6, transition: 'width 0.5s' }} />
        </div>

        {/* Charts grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="monitor-chart-grid">
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Enrollment by Site</div>
            <EnrollmentChart sites={sites} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Cumulative Enrollment Timeline</div>
            {enrollTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={enrollTimeline} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="actual" stroke="#5A8A6A" strokeWidth={2} dot={false} name="Actual" />
                  <Line type="monotone" dataKey="target" stroke="#1C2B3A" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="Target" />
                  <Legend formatter={v => <span style={{ fontSize: '0.75rem' }}>{v}</span>} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem', fontSize: '0.85rem', border: '1px dashed #E0E4E8', borderRadius: 8 }}>No enrollment data</div>
            )}
          </div>
        </div>
      </div>

      {/* Site performance table */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E4E8', padding: '1.25rem', marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 0.875rem 0', fontWeight: 700, color: '#1C2B3A', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <MapPin size={16} /> Site Performance
        </h3>
        {sites.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem', border: '1px dashed #E0E4E8', borderRadius: 10, fontSize: '0.85rem' }}>No sites added to this project yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {sites.map(site => {
              const pct = site.enrollmentTarget > 0 ? Math.round((site.enrollmentActual / site.enrollmentTarget) * 100) : 0;
              const rowColor = pct >= 70 ? '#F0FFF4' : pct >= 40 ? '#FFFBEB' : '#FFF5F5';
              const barColor = pct >= 70 ? '#27AE60' : pct >= 40 ? '#E67E22' : '#C0533A';
              const isExpanded = expandedSite === site.id;

              return (
                <div key={site.id}>
                  <div
                    style={{ background: rowColor, borderRadius: isExpanded ? '10px 10px 0 0' : 10, border: '1px solid #E0E4E8', padding: '0.75rem 1rem', cursor: 'pointer', transition: 'all 0.15s' }}
                    onClick={() => setExpandedSite(isExpanded ? null : site.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1C2B3A' }}>{site.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{site.location}</div>
                      </div>
                      <StatusBadge status={site.status} variant="form" />
                      <div style={{ textAlign: 'right', minWidth: 90 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: barColor }}>{site.enrollmentActual} / {site.enrollmentTarget}</div>
                        <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>enrolled</div>
                      </div>
                      <div style={{ width: 100, minWidth: 80 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6B7280', marginBottom: '0.2rem' }}>
                          <span>Progress</span><span style={{ fontWeight: 700, color: barColor }}>{pct}%</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: '#E0E4E8', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3 }} />
                        </div>
                      </div>
                      <div style={{ color: isExpanded ? '#5A8A6A' : '#9CA3AF', fontSize: '0.8rem' }}>{isExpanded ? '▲' : '▼'}</div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ background: '#F9FAFB', borderRadius: '0 0 10px 10px', border: '1px solid #E0E4E8', borderTop: 'none', padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.6rem', marginBottom: '0.75rem' }}>
                        <div style={{ background: 'white', borderRadius: 8, padding: '0.6rem 0.75rem', border: '1px solid #E0E4E8' }}>
                          <div style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Enrollment Rate</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: barColor, marginTop: '0.1rem' }}>{Math.max(1, Math.round(site.enrollmentActual / Math.max(1, elapsed) * 7))}/wk</div>
                        </div>
                        <div style={{ background: 'white', borderRadius: 8, padding: '0.6rem 0.75rem', border: '1px solid #E0E4E8' }}>
                          <div style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Remaining</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1C2B3A', marginTop: '0.1rem' }}>{Math.max(0, site.enrollmentTarget - site.enrollmentActual)} needed</div>
                        </div>
                        <div style={{ background: 'white', borderRadius: 8, padding: '0.6rem 0.75rem', border: '1px solid #E0E4E8' }}>
                          <div style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Last Activity</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1C2B3A', marginTop: '0.1rem' }}>3 days ago</div>
                        </div>
                        <div style={{ background: 'white', borderRadius: 8, padding: '0.6rem 0.75rem', border: '1px solid #E0E4E8' }}>
                          <div style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Open Issues</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: pct < 50 ? '#C0533A' : '#27AE60', marginTop: '0.1rem' }}>{pct < 50 ? '1' : '0'}</div>
                        </div>
                      </div>
                      {pct < 50 && (
                        <div style={{ padding: '0.5rem 0.75rem', background: '#FEF3C7', borderRadius: 6, fontSize: '0.78rem', color: '#92400E' }}>
                          ⚠ Enrollment pace is below target. Consider reviewing recruitment strategy or requesting additional resources for this site.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Data collection monitoring */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E4E8', padding: '1.25rem', marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 0.875rem 0', fontWeight: 700, color: '#1C2B3A', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Database size={16} /> Data Collection Monitoring
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          {[
            { label: 'Forms Submitted (Week)', value: '47', trend: '+12%', color: '#5A8A6A' },
            { label: 'Forms Submitted (Month)', value: '183', trend: '+5%', color: '#5A8A6A' },
            { label: 'Avg Completion Rate', value: '94%', trend: '+2%', color: '#27AE60' },
            { label: 'Flagged for Review', value: '8', trend: '-3', color: '#E67E22' },
          ].map(m => (
            <div key={m.label} style={{ background: '#F9FAFB', borderRadius: 10, padding: '0.875rem', border: '1px solid #E0E4E8' }}>
              <div style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: m.color, marginTop: '0.15rem' }}>{m.value}</div>
              <div style={{ fontSize: '0.72rem', color: '#27AE60' }}>{m.trend} vs. last period</div>
            </div>
          ))}
        </div>

        {/* Flagged submissions */}
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Flagged Submissions Requiring Review</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {[
              { id: 'sub-042', site: 'Kisumu North', form: 'Monthly Follow-up', issue: 'Missing weight measurement', date: '2025-11-01' },
              { id: 'sub-087', site: 'Mombasa Central', form: 'Household Enrollment', issue: 'Outlier age value (age=2)', date: '2025-10-30' },
              { id: 'sub-113', site: 'Nakuru West', form: 'Monthly Follow-up', issue: 'Incomplete submission (3 required fields empty)', date: '2025-10-29' },
            ].map(sub => (
              <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.875rem', background: '#FEF9EC', borderRadius: 8, border: '1px solid #FDE68A', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', background: '#FDE68A', color: '#92400E', padding: '0.1rem 0.4rem', borderRadius: 4, flexShrink: 0 }}>#{sub.id}</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1C2B3A', flexShrink: 0 }}>{sub.site}</span>
                <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>{sub.form}</span>
                <span style={{ flex: 1, fontSize: '0.78rem', color: '#92400E' }}>⚠ {sub.issue}</span>
                <span style={{ fontSize: '0.72rem', color: '#9CA3AF', flexShrink: 0 }}>{sub.date}</span>
                <button style={{ background: '#E67E22', color: 'white', border: 'none', borderRadius: 6, padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, flexShrink: 0 }}>Review</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .monitor-chart-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
