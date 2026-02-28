import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Existing Types ───────────────────────────────────────────────────────────

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

// ─── New Types ────────────────────────────────────────────────────────────────

export interface ResearchStructure {
  population: string;
  exposure: string;
  outcome: string;
  timeframe: string;
  generatedQuestion: string;
  reportingGuideline: 'CONSORT' | 'STROBE' | 'PRISMA' | 'MOOSE' | 'ARRIVE' | '';
  suggestedTests: string[];
  designDescription: string;
}

export interface ColumnWarning {
  type: 'high-missing' | 'skewed' | 'binary-outcome' | 'low-variance' | 'possible-id' | 'constant';
  severity: 'info' | 'warning' | 'error';
  message: string;
  suggestion: string;
}

export interface ColumnIntelligence {
  name: string;
  detectedType: 'numeric' | 'categorical' | 'binary' | 'date' | 'text' | 'ordinal';
  typeConfidence: number;
  suggestedRole: 'outcome' | 'exposure' | 'covariate' | 'id' | 'time' | 'unassigned';
  roleMatchReason: string;
  warnings: ColumnWarning[];
  stats: {
    missing: number;
    missingPercent: number;
    unique: number;
    skewness: number | null;
    mean: number | null;
    median: number | null;
    sd: number | null;
    min: number | null;
    max: number | null;
    mode: string | null;
    frequencies: Record<string, number> | null;
  };
}

export interface AssumptionCheck {
  name: string;
  status: 'pass' | 'review' | 'fail' | 'not-checked';
  description: string;
  detail: string;
}

export interface AnalysisPipeline {
  outcomeType: 'binary' | 'continuous' | 'time-to-event' | 'count' | 'ordinal' | '';
  suggestedPrimary: string;
  suggestedSecondary: string[];
  reasoning: string;
  assumptions: AssumptionCheck[];
}

export interface AnalysisInterpretation {
  analysisId: string;
  plainLanguage: string;
  statisticalSummary: string;
  academicSentence: string;
  effectDirection: 'positive' | 'negative' | 'null' | 'unclear';
  warnings: string[];
  assumptions: AssumptionCheck[];
}

export interface LearningTipData {
  id: string;
  context: string;
  title: string;
  explanation: string;
  relatedConcepts: string[];
}

export interface ValidationError {
  step: number;
  field: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  suggestion: string;
}

// ─── Wizard State ─────────────────────────────────────────────────────────────

export interface WizardState {
  currentStep: 1 | 2 | 3 | 4 | 5;
  maxCompletedStep: 0 | 1 | 2 | 3 | 4 | 5;
  studyConfig: StudyConfig;
  dataset: DatasetInfo | null;
  analyses: AnalysisResult[];
  reportGenerated: boolean;
  researchStructure: ResearchStructure;
  columnIntelligence: ColumnIntelligence[];
  analysisPipeline: AnalysisPipeline;
  interpretations: AnalysisInterpretation[];
  learningMode: boolean;
  validationErrors: ValidationError[];
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
  updateResearchStructure: (updates: Partial<ResearchStructure>) => void;
  setColumnIntelligence: (columns: ColumnIntelligence[]) => void;
  updateColumnRole: (columnName: string, role: ColumnInfo['role']) => void;
  generateAnalysisPipeline: () => AnalysisPipeline;
  addInterpretation: (interp: AnalysisInterpretation) => void;
  toggleLearningMode: () => void;
  validateStep: (step: number) => ValidationError[];
  generateResearchQuestion: () => string;
  detectReportingGuideline: (studyType: string) => string;
  suggestStatisticalTests: (studyType: string, outcomeType: string) => string[];
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

const DEFAULT_RESEARCH_STRUCTURE: ResearchStructure = {
  population: '',
  exposure: '',
  outcome: '',
  timeframe: '',
  generatedQuestion: '',
  reportingGuideline: '',
  suggestedTests: [],
  designDescription: '',
};

const DEFAULT_ANALYSIS_PIPELINE: AnalysisPipeline = {
  outcomeType: '',
  suggestedPrimary: '',
  suggestedSecondary: [],
  reasoning: '',
  assumptions: [],
};

const DEFAULT_STATE: WizardState = {
  currentStep: 1,
  maxCompletedStep: 0,
  studyConfig: DEFAULT_CONFIG,
  dataset: null,
  analyses: [],
  reportGenerated: false,
  researchStructure: DEFAULT_RESEARCH_STRUCTURE,
  columnIntelligence: [],
  analysisPipeline: DEFAULT_ANALYSIS_PIPELINE,
  interpretations: [],
  learningMode: true,
  validationErrors: [],
};

const STORAGE_KEY = 'rf_student_wizard';

const STEP_PATHS: Record<number, string> = {
  1: '/student/setup',
  2: '/student/upload',
  3: '/student/analysis',
  4: '/student/results',
  5: '/student/report',
};

// ─── Helper functions ─────────────────────────────────────────────────────────

function detectReportingGuidelineHelper(studyType: string): 'CONSORT' | 'STROBE' | 'PRISMA' | 'MOOSE' | 'ARRIVE' | '' {
  switch (studyType) {
    case 'rct': return 'CONSORT';
    case 'cohort':
    case 'cross-sectional':
    case 'case-control': return 'STROBE';
    case 'systematic-review': return 'PRISMA';
    default: return '';
  }
}

function suggestStatisticalTestsHelper(studyType: string, _outcomeType: string): string[] {
  const tests: Record<string, string[]> = {
    'cross-sectional': ['Table 1', 'Chi-square/t-tests', 'Logistic or Linear Regression'],
    'cohort': ['Table 1', 'Kaplan-Meier Curves', 'Cox Regression', 'Sensitivity Analysis'],
    'rct': ['Table 1', 'Primary Outcome Analysis', 'Per-Protocol Analysis', 'Subgroup Analysis'],
    'case-control': ['Table 1', 'Odds Ratios', 'Adjusted Logistic Regression'],
    'systematic-review': ['PRISMA Flow', 'Risk of Bias', 'Meta-Analysis', 'Sensitivity Analysis'],
  };
  return tests[studyType] ?? ['Descriptive Statistics', 'Regression Analysis'];
}

export function generateResearchQuestionFromStructure(structure: ResearchStructure, studyType: string): string {
  const { population, exposure, outcome, timeframe } = structure;
  const pop = population || '[Population]';
  const exp = exposure || '[Exposure]';
  const out = outcome || '[Outcome]';
  const tf = timeframe || '[Timeframe]';
  switch (studyType) {
    case 'cross-sectional': return `What is the association between ${exp} and ${out} among ${pop}?`;
    case 'cohort': return `Is ${exp} associated with ${out} among ${pop} over ${tf}?`;
    case 'rct': return `Does ${exp} improve ${out} compared to standard care among ${pop} over ${tf}?`;
    case 'case-control': return `Is ${exp} a risk factor for ${out} among ${pop}?`;
    case 'systematic-review': return `What is the effect of ${exp} on ${out} in ${pop}?`;
    default: return `What is the association between ${exp} and ${out} among ${pop}?`;
  }
}

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
      if (saved) {
        const parsed = JSON.parse(saved) as WizardState;
        return {
          ...DEFAULT_STATE,
          ...parsed,
          researchStructure: parsed.researchStructure ?? DEFAULT_RESEARCH_STRUCTURE,
          columnIntelligence: parsed.columnIntelligence ?? [],
          analysisPipeline: parsed.analysisPipeline ?? DEFAULT_ANALYSIS_PIPELINE,
          interpretations: parsed.interpretations ?? [],
          learningMode: parsed.learningMode ?? true,
          validationErrors: parsed.validationErrors ?? [],
        };
      }
    } catch {}
    return DEFAULT_STATE;
  });

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
      return { ...prev, maxCompletedStep: newMax, currentStep: nextStep };
    });
    const nextStep = Math.min(step + 1, 5);
    if (STEP_PATHS[nextStep]) navigate(STEP_PATHS[nextStep]);
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

  const updateResearchStructure = useCallback((updates: Partial<ResearchStructure>) => {
    setState(prev => ({
      ...prev,
      researchStructure: { ...prev.researchStructure, ...updates },
    }));
  }, []);

  const setColumnIntelligence = useCallback((columns: ColumnIntelligence[]) => {
    setState(prev => ({ ...prev, columnIntelligence: columns }));
  }, []);

  const updateColumnRole = useCallback((columnName: string, role: ColumnInfo['role']) => {
    setState(prev => ({
      ...prev,
      columnIntelligence: prev.columnIntelligence.map(c =>
        c.name === columnName ? { ...c, suggestedRole: role } : c
      ),
    }));
  }, []);

  const generateAnalysisPipeline = useCallback((): AnalysisPipeline => {
    const { studyType } = state.studyConfig;
    const outcomeCol = state.dataset?.columns.find(c => c.role === 'outcome');
    const covariates = state.dataset?.columns.filter(c => c.role === 'covariate').map(c => c.name) ?? [];

    let outcomeType: AnalysisPipeline['outcomeType'] = '';
    if (outcomeCol) {
      if (outcomeCol.uniqueValues === 2 || outcomeCol.type === 'binary') outcomeType = 'binary';
      else if (outcomeCol.type === 'numeric' && outcomeCol.uniqueValues > 10) outcomeType = 'continuous';
      else if (outcomeCol.type === 'date') outcomeType = 'time-to-event';
      else outcomeType = 'count';
    }

    const primaryMap: Record<string, Record<string, string>> = {
      binary: {
        'cross-sectional': 'Logistic Regression',
        cohort: 'Cox Regression / Logistic Regression',
        rct: 'Logistic Regression (ITT)',
        'case-control': 'Conditional Logistic Regression',
        'systematic-review': 'Meta-Analysis',
      },
      continuous: {
        'cross-sectional': 'Linear Regression',
        cohort: 'Linear Regression',
        rct: 'ANCOVA',
        'case-control': 'Linear Regression',
        'systematic-review': 'Meta-Analysis',
      },
      'time-to-event': { default: 'Kaplan-Meier + Cox Regression' },
      count: { default: 'Poisson Regression' },
    };

    const primary =
      primaryMap[outcomeType]?.[studyType] ??
      primaryMap[outcomeType]?.['default'] ??
      'Descriptive Analysis';

    const reasoning = `For a ${studyType.replace('-', ' ')} study with a ${outcomeType || 'undefined'} outcome, ${primary} is the recommended primary analysis.${covariates.length > 0 ? ` The analysis will be adjusted for ${covariates.join(', ')}.` : ' Consider adding covariates for an adjusted analysis.'}`;

    const pipeline: AnalysisPipeline = {
      outcomeType,
      suggestedPrimary: primary,
      suggestedSecondary: suggestStatisticalTestsHelper(studyType, outcomeType).filter(t => t !== primary),
      reasoning,
      assumptions: [],
    };

    setState(prev => ({ ...prev, analysisPipeline: pipeline }));
    return pipeline;
  }, [state.studyConfig, state.dataset]);

  const addInterpretation = useCallback((interp: AnalysisInterpretation) => {
    setState(prev => ({
      ...prev,
      interpretations: [
        ...prev.interpretations.filter(i => i.analysisId !== interp.analysisId),
        interp,
      ],
    }));
  }, []);

  const toggleLearningMode = useCallback(() => {
    setState(prev => ({ ...prev, learningMode: !prev.learningMode }));
  }, []);

  const validateStep = useCallback((step: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    if (step === 1) {
      if (!state.studyConfig.studyType)
        errors.push({ step: 1, field: 'studyType', type: 'error', message: 'Study type is required', suggestion: 'Select a study type to continue' });
      if (!state.studyConfig.researchQuestion)
        errors.push({ step: 1, field: 'researchQuestion', type: 'error', message: 'Research question is required', suggestion: 'Enter your research question' });
      if (!state.studyConfig.primaryOutcome)
        errors.push({ step: 1, field: 'primaryOutcome', type: 'error', message: 'Primary outcome is required', suggestion: 'Specify your primary outcome variable' });
    }
    if (step === 2) {
      if (!state.dataset)
        errors.push({ step: 2, field: 'dataset', type: 'error', message: 'No dataset uploaded', suggestion: 'Upload your data file to continue' });
      if (state.dataset && !state.dataset.columns.some(c => c.role === 'outcome'))
        errors.push({ step: 2, field: 'outcome', type: 'error', message: 'No outcome variable assigned', suggestion: 'Assign at least one variable as the outcome' });
      if (state.dataset && !state.dataset.columns.some(c => c.role === 'exposure'))
        errors.push({ step: 2, field: 'exposure', type: 'warning', message: 'No exposure variable assigned', suggestion: 'Assign your exposure or intervention variable' });
      if (state.dataset && state.dataset.rowCount < 30)
        errors.push({ step: 2, field: 'dataset', type: 'warning', message: 'Small dataset (< 30 rows)', suggestion: 'Results may not be statistically reliable with fewer than 30 observations' });
    }
    setState(prev => ({ ...prev, validationErrors: errors }));
    return errors;
  }, [state]);

  const generateResearchQuestion = useCallback((): string => {
    return generateResearchQuestionFromStructure(state.researchStructure, state.studyConfig.studyType);
  }, [state.researchStructure, state.studyConfig.studyType]);

  const detectReportingGuideline = useCallback((studyType: string): string => {
    return detectReportingGuidelineHelper(studyType);
  }, []);

  const suggestStatisticalTests = useCallback((studyType: string, outcomeType: string): string[] => {
    return suggestStatisticalTestsHelper(studyType, outcomeType);
  }, []);

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
      updateResearchStructure,
      setColumnIntelligence,
      updateColumnRole,
      generateAnalysisPipeline,
      addInterpretation,
      toggleLearningMode,
      validateStep,
      generateResearchQuestion,
      detectReportingGuideline,
      suggestStatisticalTests,
    }}>
      {children}
    </StudentWizardContext.Provider>
  );
}
