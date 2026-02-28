import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit2, Archive, Clock } from 'lucide-react';
import { NGOProject } from '../context/NGOPlatformContext';
import StatusBadge from './StatusBadge';

interface ProjectCardProps {
  project: NGOProject;
  totalEnrollment: number;
  targetEnrollment: number;
  onEdit?: (project: NGOProject) => void;
  onArchive?: (id: string) => void;
}

function getRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function ProjectCard({ project, totalEnrollment, targetEnrollment, onEdit, onArchive }: ProjectCardProps) {
  const navigate = useNavigate();
  const enrollPct = targetEnrollment > 0 ? Math.min(100, Math.round((totalEnrollment / targetEnrollment) * 100)) : 0;
  const budgetPct = project.budgetTotal > 0 ? Math.min(100, Math.round((project.budgetSpent / project.budgetTotal) * 100)) : 0;
  const daysLeft = getDaysRemaining(project.endDate);
  const budgetColor = budgetPct >= 90 ? '#C0533A' : budgetPct >= 70 ? '#E67E22' : '#27AE60';

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 12,
      padding: '1.25rem',
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      border: '1px solid #E0E4E8',
      transition: 'box-shadow 0.15s',
      cursor: 'pointer',
    }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.11)'}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)'}
      onClick={() => navigate(`/ngo/project/${project.id}`)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1C2B3A', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {project.name}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>
            {project.organization} · {project.principalInvestigator}
          </div>
        </div>
        <StatusBadge status={project.status} variant="project" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginBottom: '0.25rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Enrollment</div>
          <div style={{ height: 6, borderRadius: 3, background: '#E0E4E8', overflow: 'hidden', marginBottom: '0.2rem' }}>
            <div style={{ height: '100%', width: `${enrollPct}%`, background: '#5A8A6A', borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{totalEnrollment} / {targetEnrollment}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginBottom: '0.25rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Budget</div>
          <div style={{ height: 6, borderRadius: 3, background: '#E0E4E8', overflow: 'hidden', marginBottom: '0.2rem' }}>
            <div style={{ height: '100%', width: `${budgetPct}%`, background: budgetColor, borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{budgetPct}% used</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F3F4F6', paddingTop: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: daysLeft < 30 ? '#C0533A' : '#6B7280' }}>
          <Clock size={12} />
          {daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}
        </div>
        <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>Updated {getRelativeTime(project.updatedAt)}</div>
        <div style={{ display: 'flex', gap: '0.25rem' }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/ngo/project/${project.id}`)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '0.2rem' }}
            title="View"
          >
            <Eye size={14} />
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(project)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '0.2rem' }}
              title="Edit"
            >
              <Edit2 size={14} />
            </button>
          )}
          {onArchive && (
            <button
              onClick={() => onArchive(project.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '0.2rem' }}
              title="Archive"
            >
              <Archive size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
