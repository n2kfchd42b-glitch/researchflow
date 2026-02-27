import React, { useEffect, useState } from 'react';
import { CheckCircle, Database, BarChart3, Eye, Trophy, X } from 'lucide-react';

interface StepSuccessMessageProps {
  step: number;
  onDismiss: () => void;
}

const STEP_MESSAGES: Record<number, { text: string; sub: string; icon: React.ElementType; color: string; bg: string }> = {
  1: { text: "Great! Your study is set up.", sub: "Let's upload your data.", icon: CheckCircle, color: '#5A8A6A', bg: '#E9F7EF' },
  2: { text: "Dataset ready! Your variables are assigned.", sub: "Time for analysis.", icon: Database, color: '#5A8A6A', bg: '#E9F7EF' },
  3: { text: "Analyses complete!", sub: "Let's review your results.", icon: BarChart3, color: '#5A8A6A', bg: '#E9F7EF' },
  4: { text: "Results reviewed!", sub: "Ready to generate your report.", icon: Eye, color: '#5A8A6A', bg: '#E9F7EF' },
  5: { text: "Report generated! You did it!", sub: "Your research analysis is complete.", icon: Trophy, color: '#C0533A', bg: '#FDEDEC' },
};

export default function StepSuccessMessage({ step, onDismiss }: StepSuccessMessageProps) {
  const [visible, setVisible] = useState(true);
  const cfg = STEP_MESSAGES[step];

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!cfg) return null;
  const Icon = cfg.icon;

  return (
    <div
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.color}40`,
        borderRadius: 10,
        padding: '0.875rem 1.25rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      {step === 5 && (
        <span style={{ fontSize: '1.4rem', marginRight: 2 }}>🎉</span>
      )}
      <Icon size={20} color={cfg.color} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: cfg.color, fontSize: '0.9rem' }}>{cfg.text}</div>
        <div style={{ fontSize: '0.82rem', color: cfg.color, opacity: 0.8 }}>{cfg.sub}</div>
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: cfg.color, opacity: 0.6, padding: 4 }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
