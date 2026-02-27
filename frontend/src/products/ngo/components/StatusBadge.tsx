import React from 'react';

type ProjectStatus = 'planning' | 'active' | 'data-collection' | 'analysis' | 'reporting' | 'completed';
type EthicsStatus = 'not-submitted' | 'pending' | 'approved' | 'revision-required' | 'expired';
type DatasetStatus = 'raw' | 'cleaning' | 'clean' | 'analysis-ready';
type FormStatus = 'draft' | 'active' | 'closed';

interface StatusBadgeProps {
  status: string;
  variant?: 'project' | 'ethics' | 'dataset' | 'form';
}

const PROJECT_COLORS: Record<ProjectStatus, { bg: string; color: string; label: string }> = {
  planning:        { bg: '#F3F4F6', color: '#6B7280', label: 'Planning' },
  active:          { bg: '#DBEAFE', color: '#1D4ED8', label: 'Active' },
  'data-collection': { bg: '#D1FAE5', color: '#065F46', label: 'Data Collection' },
  analysis:        { bg: '#FEF3C7', color: '#92400E', label: 'Analysis' },
  reporting:       { bg: '#EDE9FE', color: '#5B21B6', label: 'Reporting' },
  completed:       { bg: '#D1FAE5', color: '#065F46', label: 'Completed' },
};

const ETHICS_COLORS: Record<EthicsStatus, { bg: string; color: string; label: string }> = {
  'not-submitted':    { bg: '#F3F4F6', color: '#6B7280', label: 'Not Submitted' },
  pending:            { bg: '#FEF3C7', color: '#92400E', label: 'Pending Review' },
  approved:           { bg: '#D1FAE5', color: '#065F46', label: 'Approved' },
  'revision-required':{ bg: '#FEE2E2', color: '#991B1B', label: 'Revision Required' },
  expired:            { bg: '#FEE2E2', color: '#991B1B', label: 'Expired' },
};

const DATASET_COLORS: Record<DatasetStatus, { bg: string; color: string; label: string }> = {
  raw:              { bg: '#F3F4F6', color: '#6B7280', label: 'Raw' },
  cleaning:         { bg: '#FEF3C7', color: '#92400E', label: 'Cleaning' },
  clean:            { bg: '#DBEAFE', color: '#1D4ED8', label: 'Clean' },
  'analysis-ready': { bg: '#D1FAE5', color: '#065F46', label: 'Analysis Ready' },
};

const FORM_COLORS: Record<FormStatus, { bg: string; color: string; label: string }> = {
  draft:  { bg: '#F3F4F6', color: '#6B7280', label: 'Draft' },
  active: { bg: '#D1FAE5', color: '#065F46', label: 'Active' },
  closed: { bg: '#FEE2E2', color: '#991B1B', label: 'Closed' },
};

export default function StatusBadge({ status, variant = 'project' }: StatusBadgeProps) {
  let colorMap: Record<string, { bg: string; color: string; label: string }>;
  switch (variant) {
    case 'ethics':  colorMap = ETHICS_COLORS; break;
    case 'dataset': colorMap = DATASET_COLORS; break;
    case 'form':    colorMap = FORM_COLORS; break;
    default:        colorMap = PROJECT_COLORS; break;
  }

  const config = colorMap[status] || { bg: '#F3F4F6', color: '#6B7280', label: status };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.2rem 0.6rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      background: config.bg,
      color: config.color,
      whiteSpace: 'nowrap',
    }}>
      {config.label}
    </span>
  );
}
