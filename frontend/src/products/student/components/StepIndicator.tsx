/**
 * Student Wizard — StepIndicator wrapper
 *
 * Thin wrapper around the shared <StepIndicator /> that wires up
 * StudentWizardContext. This file replaces the previous standalone
 * implementation — all rendering logic now lives in packages/ui.
 */
import React from 'react';
import { useStudentWizard } from '../context/StudentWizardContext';
import { StepIndicator as SharedStepIndicator, Step } from '../../../packages/ui';

const STUDENT_STEPS: Step[] = [
  { number: 1, label: 'Setup' },
  { number: 2, label: 'Data' },
  { number: 3, label: 'Analysis' },
  { number: 4, label: 'Results' },
  { number: 5, label: 'Report' },
];

export default function StepIndicator() {
  const { state, goToStep } = useStudentWizard();

  return (
    <SharedStepIndicator
      steps={STUDENT_STEPS}
      currentStep={state.currentStep}
      maxCompletedStep={state.maxCompletedStep}
      orientation="horizontal"
      onStepClick={step => {
        if (step <= state.maxCompletedStep + 1) goToStep(step);
      }}
    />
  );
}
