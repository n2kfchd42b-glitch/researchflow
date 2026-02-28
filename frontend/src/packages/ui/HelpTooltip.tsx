import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, ExternalLink } from 'lucide-react';
import { ProductContext, getTheme } from './theme';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface HelpTooltipProps {
  context: ProductContext;
  content: string;
  placement?: TooltipPlacement;
  learnMoreUrl?: string;
  /** Accessible label for the trigger button */
  label?: string;
}

export function HelpTooltip({
  context,
  content,
  placement = 'top',
  learnMoreUrl,
  label = 'Help',
}: HelpTooltipProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const theme = getTheme(context);

  // Close on outside click
  useEffect(() => {
    if (!visible) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [visible]);

  // Close on Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setVisible(false);
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setVisible(v => !v);
    }
  };

  const positionStyle: Record<TooltipPlacement, React.CSSProperties> = {
    top:    { bottom: '120%', left: '50%', transform: 'translateX(-50%)' },
    bottom: { top: '120%',   left: '50%', transform: 'translateX(-50%)' },
    left:   { right: '120%', top: '50%',  transform: 'translateY(-50%)' },
    right:  { left: '120%',  top: '50%',  transform: 'translateY(-50%)' },
  };

  return (
    <div ref={ref} style={{ display: 'inline-flex', position: 'relative', verticalAlign: 'middle' }}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={visible}
        aria-haspopup="true"
        onClick={() => setVisible(v => !v)}
        onKeyDown={handleKeyDown}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.1rem',
          display: 'flex',
          alignItems: 'center',
          color: theme.accent,
          opacity: 0.8,
        }}
      >
        <HelpCircle size={15} />
      </button>

      {visible && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            ...positionStyle[placement],
            zIndex: 100,
            background: '#1C2B3A',
            color: 'white',
            fontSize: '0.78rem',
            lineHeight: 1.5,
            padding: '0.6rem 0.9rem',
            borderRadius: 8,
            width: 220,
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            pointerEvents: 'auto',
          }}
        >
          <p style={{ margin: 0 }}>{content}</p>
          {learnMoreUrl && (
            <a
              href={learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                marginTop: '0.5rem',
                color: theme.accentLight,
                fontSize: '0.75rem',
                textDecoration: 'none',
              }}
            >
              Learn more <ExternalLink size={11} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default HelpTooltip;
