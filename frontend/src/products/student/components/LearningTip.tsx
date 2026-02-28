import React, { useState } from 'react';
import { Lightbulb, X } from 'lucide-react';

interface LearningTipProps {
  title: string;
  explanation: string;
  relatedConcepts?: string[];
  visible: boolean;
}

export default function LearningTip({ title, explanation, relatedConcepts, visible }: LearningTipProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!visible || dismissed) return null;

  return (
    <div
      className="learning-tip"
      style={{
        background: '#FFF9E6',
        border: '1px solid #F5CBA7',
        borderRadius: 10,
        padding: '0.875rem 1rem',
        marginBottom: '1rem',
        animation: 'slideDown 0.25s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
        <Lightbulb size={16} color="#E67E22" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: '#7D4E1A', fontSize: '0.875rem', marginBottom: '0.35rem' }}>
            {title}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#6E4E1A', lineHeight: 1.6 }}>
            {explanation}
          </div>
          {relatedConcepts && relatedConcepts.length > 0 && (
            <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {relatedConcepts.map(c => (
                <span
                  key={c}
                  style={{
                    padding: '2px 8px',
                    background: '#F5CBA7',
                    color: '#7D4E1A',
                    borderRadius: 99,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'default',
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B7950B', padding: 2, flexShrink: 0 }}
          title="Got it"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
