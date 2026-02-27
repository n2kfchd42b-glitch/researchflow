import React from 'react';
import { Check } from 'lucide-react';

const JOURNAL_PRIMARY = '#7D3C98';
const JOURNAL_COMPLETED = '#5B2C6F';

const STEPS = [
  { number: 1, label: 'Manuscript' },
  { number: 2, label: 'Dataset' },
  { number: 3, label: 'Analyses' },
  { number: 4, label: 'Review' },
];

interface Props {
  currentStep: number;
  maxCompletedStep: number;
  onStepClick?: (step: number) => void;
}

export default function IntakeStepIndicator({ currentStep, maxCompletedStep, onStepClick }: Props) {
  const getStatus = (step: number): 'completed' | 'current' | 'future' => {
    if (step <= maxCompletedStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'future';
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, padding: '0.5rem 0' }}>
      {STEPS.map((s, idx) => {
        const status = getStatus(s.number);
        const isClickable = onStepClick && s.number <= maxCompletedStep + 1;

        return (
          <React.Fragment key={s.number}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                cursor: isClickable ? 'pointer' : 'default',
              }}
              onClick={() => isClickable && onStepClick && onStepClick(s.number)}
            >
              {/* Circle */}
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.88rem',
                transition: 'all 0.2s',
                background:
                  status === 'completed' ? JOURNAL_COMPLETED :
                  status === 'current'   ? JOURNAL_PRIMARY :
                  'white',
                color: status === 'future' ? '#D1D5DB' : 'white',
                border: status === 'future' ? '2px solid #D1D5DB' : 'none',
                boxShadow: status === 'current' ? `0 0 0 4px rgba(125,60,152,0.2)` : 'none',
                position: 'relative',
                zIndex: 1,
              }}>
                {status === 'completed' ? <Check size={16} strokeWidth={3} /> : s.number}
              </div>

              {/* Label */}
              <span style={{
                marginTop: 6,
                fontSize: '0.72rem',
                fontWeight: status === 'current' ? 700 : 400,
                color:
                  status === 'completed' ? JOURNAL_COMPLETED :
                  status === 'current'   ? JOURNAL_PRIMARY :
                  '#9CA3AF',
                whiteSpace: 'nowrap',
              }}>
                {s.label}
              </span>
            </div>

            {/* Connector */}
            {idx < STEPS.length - 1 && (
              <div style={{
                flex: 1,
                height: 3,
                background: getStatus(s.number) === 'completed' ? JOURNAL_COMPLETED : '#E5E7EB',
                marginBottom: 22,
                minWidth: 20,
                maxWidth: 100,
                transition: 'background 0.3s',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
