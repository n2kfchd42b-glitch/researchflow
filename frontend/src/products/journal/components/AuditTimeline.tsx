import React, { useState } from 'react';
import { FileText, CheckCircle, Shield, FileOutput, Settings } from 'lucide-react';
import { AuditEntry } from '../context/JournalContext';

interface Props {
  entries: AuditEntry[];
  limit?: number;
}

type Category = AuditEntry['category'];

const CATEGORY_CONFIG: Record<Category, { Icon: React.ElementType; color: string; label: string }> = {
  'submission':   { Icon: FileText,    color: '#7D3C98', label: 'Submission'   },
  'verification': { Icon: CheckCircle, color: '#2E86C1', label: 'Verification' },
  'assessment':   { Icon: Shield,      color: '#F39C12', label: 'Assessment'   },
  'report':       { Icon: FileOutput,  color: '#27AE60', label: 'Report'       },
  'system':       { Icon: Settings,    color: '#6B7280', label: 'System'       },
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatAbsoluteTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

function groupByDate(entries: AuditEntry[]): Map<string, AuditEntry[]> {
  const groups = new Map<string, AuditEntry[]>();
  for (const entry of entries) {
    const dateKey = new Date(entry.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey)!.push(entry);
  }
  return groups;
}

export default function AuditTimeline({ entries, limit = 50 }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const displayed = showAll ? entries : entries.slice(0, limit);
  const grouped = groupByDate(displayed);
  const hasMore = entries.length > limit && !showAll;

  return (
    <div style={{ position: 'relative' }}>
      {Array.from(grouped.entries()).map(([dateLabel, dayEntries]) => (
        <div key={dateLabel} style={{ marginBottom: '1.5rem' }}>
          {/* Date separator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.75rem',
          }}>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
              {dateLabel}
            </span>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
          </div>

          {/* Entries */}
          {dayEntries.map((entry, idx) => {
            const cfg = CATEGORY_CONFIG[entry.category];
            const { Icon } = cfg;
            const isLast = idx === dayEntries.length - 1;
            const isExpanded = expandedId === entry.id;

            return (
              <div key={entry.id} style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
                {/* Timeline line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: cfg.color + '22',
                    border: `2px solid ${cfg.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={14} color={cfg.color} />
                  </div>
                  {!isLast && (
                    <div style={{ width: 2, flex: 1, background: '#E5E7EB', minHeight: 8, margin: '2px 0' }} />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, paddingBottom: isLast ? 0 : '0.75rem' }}>
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: 8,
                      padding: '0.6rem 0.75rem',
                      cursor: 'pointer',
                      transition: 'box-shadow 0.15s',
                      boxShadow: hoveredId === entry.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    }}
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    onMouseEnter={() => setHoveredId(entry.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1C2B3A' }}>{entry.action}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          title={formatAbsoluteTime(entry.timestamp)}
                          style={{ fontSize: '0.75rem', color: '#9CA3AF', cursor: 'help' }}
                        >
                          {formatRelativeTime(entry.timestamp)}
                        </span>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '0.1rem 0.4rem',
                          borderRadius: 9999,
                          background: cfg.color + '22',
                          color: cfg.color,
                        }}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>

                    {entry.details && (
                      <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#6B7280', lineHeight: 1.5 }}>
                        {entry.details}
                      </p>
                    )}

                    {entry.performedBy && (
                      <span style={{ display: 'inline-block', marginTop: '0.3rem', fontSize: '0.72rem', color: '#9CA3AF' }}>
                        By: {entry.performedBy}
                      </span>
                    )}

                    {isExpanded && Object.keys(entry.metadata).length > 0 && (
                      <pre style={{
                        marginTop: '0.5rem',
                        background: '#F3F4F6',
                        borderRadius: 6,
                        padding: '0.5rem',
                        fontSize: '0.72rem',
                        overflow: 'auto',
                        color: '#374151',
                      }}>
                        {JSON.stringify(entry.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {hasMore && (
        <button
          onClick={() => setShowAll(true)}
          style={{
            display: 'block',
            width: '100%',
            padding: '0.6rem',
            background: '#F3F4F6',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            fontSize: '0.85rem',
            color: '#6B7280',
            cursor: 'pointer',
            marginTop: '0.5rem',
          }}
        >
          Show {entries.length - limit} more entries
        </button>
      )}

      {entries.length === 0 && (
        <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem', fontSize: '0.875rem' }}>
          No audit entries yet.
        </div>
      )}
    </div>
  );
}
