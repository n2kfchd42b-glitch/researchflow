import React from 'react';
import { LucideIcon } from 'lucide-react';

interface WizardEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function WizardEmptyState({ icon: Icon, title, description, actionLabel, onAction }: WizardEmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 2rem',
      textAlign: 'center',
      background: 'white',
      borderRadius: 12,
      border: '1px dashed #D5D8DC',
    }}>
      <Icon size={48} color="#D5D8DC" style={{ marginBottom: '1rem' }} />
      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1C2B3A', marginBottom: '0.5rem' }}>{title}</div>
      <div style={{ fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.5, maxWidth: 340, marginBottom: actionLabel ? '1.25rem' : 0 }}>
        {description}
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '0.6rem 1.25rem',
            background: '#2E86C1',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
