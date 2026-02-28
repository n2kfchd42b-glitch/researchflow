/**
 * Journal Component — IntakeStepIndicator wrapper
 *
 * Thin wrapper around the shared <StepIndicator /> that supplies
 * journal-specific intake steps. The previous standalone implementation
 * has been replaced — all rendering logic now lives in packages/ui.
 */
import React from 'react';
import { StepIndicator as SharedStepIndicator, Step } from '../../../packages/ui';

const INTAKE_STEPS: Step[] = [
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
  return (
    <SharedStepIndicator
      steps={INTAKE_STEPS}
      currentStep={currentStep}
      maxCompletedStep={maxCompletedStep}
      orientation="horizontal"
      onStepClick={onStepClick}
    />
  );
}
