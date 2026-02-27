import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useStudentWizard } from '../context/StudentWizardContext';
import '../student.css';

const STEPS = [
  { number: 1, label: 'Setup' },
  { number: 2, label: 'Data' },
  { number: 3, label: 'Analysis' },
  { number: 4, label: 'Results' },
  { number: 5, label: 'Report' },
];

export default function StepIndicator() {
  const { state, goToStep } = useStudentWizard();
  const [tooltip, setTooltip] = useState<number | null>(null);

  const getStatus = (step: number): 'completed' | 'current' | 'future' => {
    if (step <= state.maxCompletedStep) return 'completed';
    if (step === state.currentStep) return 'current';
    return 'future';
  };

  const handleClick = (step: number) => {
    if (step <= state.maxCompletedStep + 1) {
      goToStep(step);
    } else {
      setTooltip(step);
      setTimeout(() => setTooltip(null), 2000);
    }
  };

  return (
    <div className="step-indicator" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
      {STEPS.map((s, idx) => {
        const status = getStatus(s.number);
        const isClickable = s.number <= state.maxCompletedStep + 1;

        return (
          <React.Fragment key={s.number}>
            {/* Step node */}
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', cursor: isClickable ? 'pointer' : 'default' }}
              onClick={() => handleClick(s.number)}
            >
              {/* Circle */}
              <div
                className={`step-circle step-${status}`}
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
                  background: status === 'completed' ? '#5A8A6A'
                            : status === 'current'   ? '#2E86C1'
                            : 'white',
                  color: status === 'future' ? '#D5D8DC' : 'white',
                  border: status === 'future' ? '2px solid #D5D8DC' : 'none',
                  boxShadow: status === 'current' ? '0 0 0 4px rgba(46,134,193,0.2)' : 'none',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {status === 'completed' ? <Check size={16} strokeWidth={3} /> : s.number}
              </div>

              {/* Label — hidden on very small screens */}
              <span className="step-label" style={{
                marginTop: 6,
                fontSize: '0.72rem',
                fontWeight: status === 'current' ? 700 : 400,
                color: status === 'completed' ? '#5A8A6A'
                     : status === 'current'   ? '#2E86C1'
                     : '#999',
                whiteSpace: 'nowrap',
              }}>
                {s.label}
              </span>

              {/* Tooltip for locked steps */}
              {tooltip === s.number && (
                <div style={{
                  position: 'absolute',
                  bottom: '110%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#1C2B3A',
                  color: 'white',
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.7rem',
                  borderRadius: 6,
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                  pointerEvents: 'none',
                }}>
                  Complete step {s.number - 1} first
                </div>
              )}
            </div>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div style={{
                flex: 1,
                height: 3,
                background: getStatus(s.number) === 'completed' ? '#5A8A6A' : '#E5E9EF',
                marginBottom: 22,
                minWidth: 20,
                maxWidth: 80,
                transition: 'background 0.3s',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
