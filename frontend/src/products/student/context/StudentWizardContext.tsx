import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudyConfig {
  studyType: 'cross-sectional' | 'cohort' | 'rct' | 'case-control' | 'systematic-review' | '';
  researchQuestion: string;
  primaryOutcome: string;
  secondaryOutcomes: string[];
  exposureVariable: string;
  studyTitle: string;
  sampleSizeTarget: number | null;
}

export interface ColumnInfo {
  name: string;
  type: 'numeric' | 'categorical' | 'date' | 'text' | 'binary';
  role: 'outcome' | 'exposure' | 'covariate' | 'id' | 'time' | 'unassigned';
  missingCount: number;
  missingPercent: number;
  uniqueValues: number;
}

export interface DatasetInfo {
  fileName: string;
  rowCount: number;
  columnCount: number;
  columns: ColumnInfo[];
  uploadedAt: string;
  fileId: string;
}

export interface AnalysisResult {
  id: string;
  type: string;
  title: string;
  completedAt: string;
  status: 'success' | 'warning' | 'error';
  summary: string;
  data: any;
}

export interface WizardState {
  currentStep: 1 | 2 | 3 | 4 | 5;
  maxCompletedStep: 0 | 1 | 2 | 3 | 4 | 5;
  studyConfig: StudyConfig;
  dataset: DatasetInfo | null;
  analyses: AnalysisResult[];
  reportGenerated: boolean;
}

interface StudentWizardContextType {
  state: WizardState;
  updateStudyConfig: (updates: Partial<StudyConfig>) => void;
  setDataset: (dataset: DatasetInfo) => void;
  addAnalysis: (result: AnalysisResult) => void;
  removeAnalysis: (id: string) => void;
  completeStep: (step: number) => void;
  goToStep: (step: number) => void;
  resetWizard: () => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: StudyConfig = {
  studyType: '',
  researchQuestion: '',
  primaryOutcome: '',
  secondaryOutcomes: [],
  exposureVariable: '',
  studyTitle: '',
  sampleSizeTarget: null,
};

const DEFAULT_STATE: WizardState = {
  currentStep: 1,
  maxCompletedStep: 0,
  studyConfig: DEFAULT_CONFIG,
  dataset: null,
  analyses: [],
  reportGenerated: false,
};

const STORAGE_KEY = 'rf_student_wizard';

const STEP_PATHS: Record<number, string> = {
  1: '/student/setup',
  2: '/student/upload',
  3: '/student/analysis',
  4: '/student/results',
  5: '/student/report',
};

// ─── Context ──────────────────────────────────────────────────────────────────

const StudentWizardContext = createContext<StudentWizardContextType | undefined>(undefined);

export function useStudentWizard() {
  const ctx = useContext(StudentWizardContext);
  if (!ctx) throw new Error('useStudentWizard must be used within StudentWizardProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StudentWizardProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [state, setState] = useState<WizardState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved) as WizardState;
    } catch {}
    return DEFAULT_STATE;
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const updateStudyConfig = useCallback((updates: Partial<StudyConfig>) => {
    setState(prev => ({
      ...prev,
      studyConfig: { ...prev.studyConfig, ...updates },
    }));
  }, []);

  const setDataset = useCallback((dataset: DatasetInfo) => {
    setState(prev => ({ ...prev, dataset }));
  }, []);

  const addAnalysis = useCallback((result: AnalysisResult) => {
    setState(prev => ({
      ...prev,
      analyses: [...prev.analyses.filter(a => a.id !== result.id), result],
    }));
  }, []);

  const removeAnalysis = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      analyses: prev.analyses.filter(a => a.id !== id),
    }));
  }, []);

  const completeStep = useCallback((step: number) => {
    setState(prev => {
      const newMax = Math.max(prev.maxCompletedStep, step) as WizardState['maxCompletedStep'];
      const nextStep = Math.min(step + 1, 5) as WizardState['currentStep'];
      return {
        ...prev,
        maxCompletedStep: newMax,
        currentStep: nextStep,
      };
    });
    const nextStep = Math.min(step + 1, 5);
    if (STEP_PATHS[nextStep]) {
      navigate(STEP_PATHS[nextStep]);
    }
  }, [navigate]);

  const goToStep = useCallback((step: number) => {
    setState(prev => {
      if (step <= prev.maxCompletedStep + 1) {
        return { ...prev, currentStep: step as WizardState['currentStep'] };
      }
      return prev;
    });
    if (state.maxCompletedStep + 1 >= step && STEP_PATHS[step]) {
      navigate(STEP_PATHS[step]);
    }
  }, [navigate, state.maxCompletedStep]);

  const resetWizard = useCallback(() => {
    setState(DEFAULT_STATE);
    localStorage.removeItem(STORAGE_KEY);
    navigate('/student/setup');
  }, [navigate]);

  return (
    <StudentWizardContext.Provider value={{
      state,
      updateStudyConfig,
      setDataset,
      addAnalysis,
      removeAnalysis,
      completeStep,
      goToStep,
      resetWizard,
    }}>
      {children}
    </StudentWizardContext.Provider>
  );
}
