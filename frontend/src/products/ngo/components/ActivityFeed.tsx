import React, { useState } from 'react';
import { Upload, FileText, BarChart3, DollarSign, Shield, Users, FileOutput } from 'lucide-react';
import { ActivityItem } from '../context/NGOPlatformContext';

interface ActivityFeedProps {
  activities: ActivityItem[];
  limit?: number;
  projectName?: (id: string) => string;
}

const TYPE_CONFIG: Record<ActivityItem['type'], { icon: React.ReactNode; color: string }> = {
  'data-upload':       { icon: <Upload size={14} />,     color: '#2E86C1' },
  'form-created':      { icon: <FileText size={14} />,   color: '#5A8A6A' },
  'analysis-run':      { icon: <BarChart3 size={14} />,  color: '#E67E22' },
  'budget-entry':      { icon: <DollarSign size={14} />, color: '#8E44AD' },
  'ethics-update':     { icon: <Shield size={14} />,     color: '#27AE60' },
  'team-change':       { icon: <Users size={14} />,      color: '#C0533A' },
  'report-generated':  { icon: <FileOutput size={14} />, color: '#1C2B3A' },
};

function getRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function getDateGroup(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return 'This Week';
  if (days < 30) return 'This Month';
  return 'Earlier';
}

export default function ActivityFeed({ activities, limit = 20, projectName }: ActivityFeedProps) {
  const [showAll, setShowAll] = useState(false);
  const displayed = activities.slice(0, showAll ? activities.length : limit);

  let lastGroup = '';

  return (
    <div>
      {displayed.length === 0 && (
        <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem', fontSize: '0.875rem' }}>
          No recent activity
        </div>
      )}
      {displayed.map(activity => {
        const group = getDateGroup(activity.timestamp);
        const showHeader = group !== lastGroup;
        lastGroup = group;
        const config = TYPE_CONFIG[activity.type] || { icon: <FileText size={14} />, color: '#6B7280' };

        return (
          <React.Fragment key={activity.id}>
            {showHeader && (
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0.75rem 0 0.25rem' }}>
                {group}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: config.color + '18',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: config.color,
                flexShrink: 0,
                marginTop: 1,
              }}>
                {config.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', color: '#1C2B3A', lineHeight: 1.4 }}>{activity.description}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{getRelativeTime(activity.timestamp)}</span>
                  {activity.user && (
                    <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>· {activity.user}</span>
                  )}
                  {projectName && activity.projectId && (
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '0.1rem 0.4rem',
                      borderRadius: 4,
                      background: '#E8F5E9',
                      color: '#3D6B4F',
                      fontWeight: 600,
                    }}>
                      {projectName(activity.projectId)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}
      {activities.length > limit && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: '#5A8A6A', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
        >
          Load more ({activities.length - limit} remaining)
        </button>
      )}
    </div>
  );
}
