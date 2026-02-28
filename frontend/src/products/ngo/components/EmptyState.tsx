import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, actionLabel, onAction }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200 }}>
    <div style={{ color: '#D5D8DC', fontSize: 48, marginBottom: 16 }}>{icon}</div>
    <div style={{ color: '#1C2B3A', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{title}</div>
    <div style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>{description}</div>
    <button
      style={{ background: '#5A8A6A', color: '#fff', borderRadius: 8, padding: '8px 20px', fontWeight: 500, border: 'none', fontSize: 14 }}
      onClick={onAction}
    >
      {actionLabel}
    </button>
  </div>
);

export default EmptyState;
