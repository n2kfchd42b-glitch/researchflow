import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { ProductContext, getTheme } from './theme';

export interface Step {
  number: number;
  label: string;
}

export interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  /** Highest step the user has fully completed */
  maxCompletedStep?: number;
  orientation?: 'horizontal' | 'vertical';
  onStepClick?: (step: number) => void;
}

export function StepIndicator({
  steps,
  currentStep,
  maxCompletedStep = 0,
  orientation = 'horizontal',
  onStepClick,
}: StepIndicatorProps) {
  const [lockedTooltip, setLockedTooltip] = useState<number | null>(null);

  const getStatus = (n: number): 'completed' | 'current' | 'future' => {
    if (n <= maxCompletedStep) return 'completed';
    if (n === currentStep) return 'current';
    return 'future';
  };

  const handleClick = (n: number) => {
    if (!onStepClick) return;
    if (n <= maxCompletedStep + 1) {
      onStepClick(n);
    } else {
      setLockedTooltip(n);
      setTimeout(() => setLockedTooltip(null), 2000);
    }
  };

  const isHorizontal = orientation === 'horizontal';

  // Derive neutral colors so the component works without a ProductContext
  const completedColor = '#5A8A6A';
  const currentColor   = '#2a4a7a';
  const futureColor    = '#D5D8DC';
  const connectorActive = '#5A8A6A';
  const connectorIdle   = '#E5E9EF';

  return (
    <div
      role="list"
      aria-label="Step progress"
      style={{
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        alignItems: isHorizontal ? 'center' : 'flex-start',
        justifyContent: isHorizontal ? 'center' : undefined,
        gap: 0,
      }}
    >
      {steps.map((s, idx) => {
        const status = getStatus(s.number);
        const isClickable = onStepClick != null && s.number <= maxCompletedStep + 1;
        const circleColor =
          status === 'completed' ? completedColor :
          status === 'current'   ? currentColor   : 'white';
        const labelColor  =
          status === 'completed' ? completedColor :
          status === 'current'   ? currentColor   : '#999';

        return (
          <React.Fragment key={s.number}>
            <div
              role="listitem"
              aria-current={status === 'current' ? 'step' : undefined}
              aria-label={`Step ${s.number}: ${s.label} (${status})`}
              style={{
                display: 'flex',
                flexDirection: isHorizontal ? 'column' : 'row',
                alignItems: 'center',
                position: 'relative',
                cursor: isClickable ? 'pointer' : 'default',
                gap: isHorizontal ? 0 : '0.5rem',
              }}
              onClick={() => handleClick(s.number)}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleClick(s.number)}
              tabIndex={isClickable ? 0 : undefined}
            >
              {/* Circle */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                  background: circleColor,
                  color: status === 'future' ? futureColor : 'white',
                  border: status === 'future' ? `2px solid ${futureColor}` : 'none',
                  boxShadow: status === 'current' ? `0 0 0 4px rgba(42,74,122,0.18)` : 'none',
                  position: 'relative',
                  zIndex: 1,
                  flexShrink: 0,
                }}
              >
                {status === 'completed' ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : s.number}
              </div>

              {/* Label */}
              <span style={{
                marginTop: isHorizontal ? 6 : 0,
                fontSize: '0.72rem',
                fontWeight: status === 'current' ? 700 : 400,
                color: labelColor,
                whiteSpace: 'nowrap',
              }}>
                {s.label}
              </span>

              {/* Locked tooltip */}
              {lockedTooltip === s.number && (
                <div
                  role="status"
                  aria-live="polite"
                  style={{
                    position: 'absolute',
                    bottom: isHorizontal ? '110%' : 'auto',
                    left: isHorizontal ? '50%' : '110%',
                    transform: isHorizontal ? 'translateX(-50%)' : 'none',
                    background: '#1C2B3A',
                    color: 'white',
                    fontSize: '0.75rem',
                    padding: '0.35rem 0.7rem',
                    borderRadius: 6,
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    pointerEvents: 'none',
                  }}
                >
                  Complete step {s.number - 1} first
                </div>
              )}
            </div>

            {/* Connector */}
            {idx < steps.length - 1 && (
              <div
                aria-hidden="true"
                style={isHorizontal ? {
                  flex: 1,
                  height: 3,
                  background: getStatus(s.number) === 'completed' ? connectorActive : connectorIdle,
                  marginBottom: 22,
                  minWidth: 20,
                  maxWidth: 80,
                  transition: 'background 0.3s',
                } : {
                  width: 3,
                  height: 24,
                  background: getStatus(s.number) === 'completed' ? connectorActive : connectorIdle,
                  marginLeft: 15,
                  transition: 'background 0.3s',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default StepIndicator;
