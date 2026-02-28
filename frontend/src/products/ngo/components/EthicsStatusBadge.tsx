import React from 'react';
import { Shield, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';

export type EthicsStatus =
  | 'approved'
  | 'pending'
  | 'expiring-soon'
  | 'expired'
  | 'not-required';

export interface EthicsStatusBadgeProps {
  status: EthicsStatus;
  expiryDate?: string;   // ISO string — shown when status is expiring-soon or expired
  approvalRef?: string;  // ethics committee reference number
  compact?: boolean;
}

const STATUS_CONFIG: Record<EthicsStatus, {
  label: string;
  color: string;
  bg: string;
  icon: React.ElementType;
}> = {
  'approved':       { label: 'Ethics Approved',   color: '#1E8449', bg: '#E9F7EF', icon: CheckCircle },
  'pending':        { label: 'Ethics Pending',     color: '#D68910', bg: '#FEF9E7', icon: Clock },
  'expiring-soon':  { label: 'Expiring Soon',      color: '#E67E22', bg: '#FDEBD0', icon: AlertTriangle },
  'expired':        { label: 'Ethics Expired',     color: '#A93226', bg: '#FDEDEC', icon: XCircle },
  'not-required':   { label: 'Ethics Not Required',color: '#5D6D7E', bg: '#F2F3F4', icon: Shield },
};

/**
 * EthicsStatusBadge — NGO-only component for tracking IRB/ethics approval status.
 * Has no shared equivalent; this is specific to the NGO program management workflow.
 */
export function EthicsStatusBadge({
  status,
  expiryDate,
  approvalRef,
  compact = false,
}: EthicsStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  const daysUntilExpiry = expiryDate
    ? Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000)
    : null;

  if (compact) {
    return (
      <span
        title={`${cfg.label}${approvalRef ? ` — Ref: ${approvalRef}` : ''}${daysUntilExpiry !== null ? ` (${daysUntilExpiry < 0 ? 'expired' : `${daysUntilExpiry}d left`})` : ''}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '2px 8px',
          background: cfg.bg,
          color: cfg.color,
          borderRadius: 99,
          fontSize: '0.72rem',
          fontWeight: 700,
          border: `1px solid ${cfg.color}30`,
        }}
      >
        <Icon size={11} aria-hidden="true" />
        {cfg.label}
      </span>
    );
  }

  return (
    <div
      role="status"
      aria-label={cfg.label}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.65rem',
        background: cfg.bg,
        borderLeft: `4px solid ${cfg.color}`,
        borderRadius: '0 8px 8px 0',
        padding: '0.65rem 1rem',
      }}
    >
      <Icon size={18} color={cfg.color} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: cfg.color }}>
          {cfg.label}
        </div>
        {approvalRef && (
          <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: 1 }}>
            Approval Ref: {approvalRef}
          </div>
        )}
        {daysUntilExpiry !== null && (
          <div style={{ fontSize: '0.78rem', color: cfg.color, marginTop: 1, fontWeight: 600 }}>
            {daysUntilExpiry < 0
              ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
              : `Expires in ${daysUntilExpiry} days (${new Date(expiryDate!).toLocaleDateString()})`}
          </div>
        )}
      </div>
    </div>
  );
}

export default EthicsStatusBadge;
