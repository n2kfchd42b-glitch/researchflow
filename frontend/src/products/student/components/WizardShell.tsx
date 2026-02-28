import React from 'react';
import { useStudentWizard } from '../context/StudentWizardContext';
import { StepIndicator, Step } from '../../../packages/ui';

const WIZARD_STEPS: Step[] = [
  { number: 1, label: 'Setup' },
  { number: 2, label: 'Data' },
  { number: 3, label: 'Analysis' },
  { number: 4, label: 'Results' },
  { number: 5, label: 'Report' },
];

interface WizardShellProps {
  children: React.ReactNode;
  /** Message shown when forward navigation is blocked */
  blockedMessage?: string;
}

/**
 * WizardShell wraps the StepIndicator with Student Wizard-specific linear
 * progression enforcement. Students cannot skip ahead to a step they have
 * not unlocked yet.
 */
export function WizardShell({ children }: WizardShellProps) {
  const { state, goToStep, validateStep } = useStudentWizard();
  const [blockMessage, setBlockMessage] = React.useState('');

  const handleStepClick = (step: number) => {
    // Allow going back freely; block forward navigation on validation failure
    if (step <= state.currentStep) {
      goToStep(step);
      return;
    }
    // Validate all intermediate steps
    for (let s = state.currentStep; s < step; s++) {
      const errors = validateStep(s);
      if (errors.length > 0) {
        setBlockMessage(`Complete step ${s} before continuing: ${errors.join('; ')}`);
        setTimeout(() => setBlockMessage(''), 3000);
        return;
      }
    }
    goToStep(step);
  };

  return (
    <div>
      <div style={{
        background: 'white',
        borderBottom: '1px solid #E5E9EF',
        padding: '0.75rem 1.5rem',
        marginBottom: '1.5rem',
      }}>
        <StepIndicator
          steps={WIZARD_STEPS}
          currentStep={state.currentStep}
          maxCompletedStep={state.maxCompletedStep}
          orientation="horizontal"
          onStepClick={handleStepClick}
        />
        {blockMessage && (
          <div
            role="alert"
            aria-live="assertive"
            style={{
              marginTop: '0.5rem',
              textAlign: 'center',
              fontSize: '0.78rem',
              color: '#A93226',
              background: '#FDEDEC',
              borderRadius: 6,
              padding: '0.35rem 0.75rem',
            }}
          >
            {blockMessage}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

export default WizardShell;
