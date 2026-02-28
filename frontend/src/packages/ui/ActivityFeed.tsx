import React from 'react';
import { ProductContext, getTheme } from './theme';

export interface ActivityEvent {
  id: string;
  actor?: string;
  action: string;
  detail?: string;
  timestamp: string;   // ISO string
  category?: string;
  icon?: string;       // emoji or short label
}

export interface ActivityFeedProps {
  context: ProductContext;
  events: ActivityEvent[];
  showActor?: boolean;
  showTimestamp?: boolean;
  maxItems?: number;
  emptyMessage?: string;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function ActivityFeed({
  context,
  events,
  showActor = true,
  showTimestamp = true,
  maxItems = 50,
  emptyMessage = 'No activity yet',
}: ActivityFeedProps) {
  const theme = getTheme(context);
  const visible = events.slice(0, maxItems);

  if (visible.length === 0) {
    return (
      <div style={{
        padding: '1.5rem',
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: '0.85rem',
      }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <ol
      aria-label="Activity feed"
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {visible.map((event, idx) => (
        <li
          key={event.id}
          style={{
            display: 'flex',
            gap: '0.75rem',
            padding: '0.65rem 0',
            borderBottom: idx < visible.length - 1 ? '1px solid #F3F4F6' : 'none',
          }}
        >
          {/* Timeline dot / icon */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flexShrink: 0,
            paddingTop: 2,
          }}>
            <div
              aria-hidden="true"
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: theme.accentBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
              }}
            >
              {event.icon ?? '•'}
            </div>
            {idx < visible.length - 1 && (
              <div style={{ flex: 1, width: 2, background: '#E5E7EB', marginTop: 4 }} />
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'baseline' }}>
              {showActor && event.actor && (
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: theme.accent }}>
                  {event.actor}
                </span>
              )}
              <span style={{ fontSize: '0.85rem', color: '#374151' }}>{event.action}</span>
              {showTimestamp && (
                <time
                  dateTime={event.timestamp}
                  title={new Date(event.timestamp).toLocaleString()}
                  style={{ fontSize: '0.75rem', color: '#9CA3AF', marginLeft: 'auto', flexShrink: 0 }}
                >
                  {relativeTime(event.timestamp)}
                </time>
              )}
            </div>
            {event.detail && (
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#6B7280' }}>
                {event.detail}
              </p>
            )}
            {event.category && (
              <span style={{
                display: 'inline-block',
                marginTop: '0.25rem',
                padding: '1px 6px',
                background: theme.accentBg,
                color: theme.accent,
                fontSize: '0.7rem',
                fontWeight: 600,
                borderRadius: 4,
              }}>
                {event.category}
              </span>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default ActivityFeed;
