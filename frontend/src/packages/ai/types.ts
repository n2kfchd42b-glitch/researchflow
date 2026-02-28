// ─── ResearchFlow AI Layer — Shared TypeScript Interfaces ─────────────────────
// All AI modules share these contracts. No module may introduce types that
// violate the stateless input→output pattern defined here.

import type { ProductContext } from '../ui/theme';

// Re-export for convenience
export type { ProductContext };

// ─── Base Module Contracts ─────────────────────────────────────────────────────

export interface AIModuleOutput {
  structured: Record<string, unknown>;  // machine-readable JSON
  formatted: string;                    // human-readable markdown/text
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
}

// ─── Shared Domain Types ───────────────────────────────────────────────────────

export interface ColumnSchema {
  name: string;
  dtype: string;           // 'int64', 'float64', 'object', 'datetime64', etc.
  sampleValues: unknown[];
  nullCount: number;
}

export interface MissingDataFlag {
  column: string;
  nullCount: number;
  nullPercent: number;
  severity: 'low' | 'medium' | 'high';  // <5%, 5-20%, >20%
  recommendation: string;
}

export interface CoefficientRow {
  variable: string;
  estimate: number;
  ci_lower: number;
  ci_upper: number;
  pValue: number;
}

export interface StudyMetadata {
  design: string;
  population: string;
  setting: string;
  startDate?: string;
  endDate?: string;
  title?: string;
  objectives?: string[];
  [key: string]: unknown;
}

export interface AnalysisResultTable {
  title: string;
  rows: Record<string, unknown>[];
  footnotes?: string[];
}

export interface ConsistencyFlag {
  field: string;
  reported: unknown;
  actual: unknown;
  severity: 'minor' | 'major' | 'critical';
}

export interface IndicatorCandidate {
  name: string;
  formula: string;
  sourceColumns: string[];
  rationale: string;
}

export interface IndicatorDashboardConfig {
  primaryIndicators: string[];
  trackingFrequency: 'monthly' | 'quarterly' | 'annual';
  visualizationType: 'trend' | 'target-vs-actual' | 'disaggregated';
  alertThresholds: Record<string, number>;
}

// ─── Module 1: DatasetIntelligenceEngine ──────────────────────────────────────

export interface DatasetIntelligenceInput {
  columns: ColumnSchema[];
  rowCount: number;
  studyDesign?: string;
  context: ProductContext;
}

export interface DatasetIntelligenceOutput extends AIModuleOutput {
  structured: {
    variableTypes: Record<string, 'continuous' | 'binary' | 'categorical' | 'date' | 'id'>;
    suggestedOutcome: string[];
    suggestedExposure: string[];
    missingDataFlags: MissingDataFlag[];
    categoricalGroupings: Record<string, string[]>;
  };
  variableTypes: Record<string, 'continuous' | 'binary' | 'categorical' | 'date' | 'id'>;
  suggestedOutcome: string[];
  suggestedExposure: string[];
  missingDataFlags: MissingDataFlag[];
  categoricalGroupings: Record<string, string[]>;
  summaryPanel: string;  // formatted markdown
}

// ─── Module 2: AnalysisRecommendationEngine ───────────────────────────────────

export interface AnalysisRecommendationInput {
  studyDesign: 'cross-sectional' | 'cohort' | 'RCT' | 'case-control' | 'mixed-methods';
  outcomeType: 'binary' | 'continuous' | 'time-to-event' | 'count';
  exposureType: 'binary' | 'continuous' | 'categorical';
  covariates: string[];
  context: ProductContext;
}

export interface AnalysisRecommendationOutput extends AIModuleOutput {
  structured: {
    primaryTest: string;
    alternativeTests: string[];
    workflowOrder: string[];
    rationale: string;
    warnings: string[];
  };
  primaryTest: string;
  alternativeTests: string[];
  workflowOrder: string[];
  rationale: string;
}

// ─── Module 3: InterpretationGenerator ───────────────────────────────────────

export interface InterpretationInput {
  modelType: 'logistic' | 'linear' | 'cox' | 'poisson' | 'mixed';
  coefficients: CoefficientRow[];
  outcomeLabel: string;
  exposureLabel: string;
  context: ProductContext;
}

export interface InterpretationOutput extends AIModuleOutput {
  structured: {
    plainLanguage: string;
    academicSentence: string;
    significanceStatement: string;
    limitationFlags: string[];
  };
  plainLanguage: string;
  academicSentence: string;
  significanceStatement: string;
  limitationFlags: string[];
}

// ─── Module 4: MethodsSectionGenerator ───────────────────────────────────────

export interface MethodsGeneratorInput {
  studyMeta: StudyMetadata;
  datasetSummary: DatasetIntelligenceOutput;
  selectedAnalyses: string[];
  context: ProductContext;
}

export interface MethodsGeneratorOutput extends AIModuleOutput {
  structured: {
    methodsText: string;
    subsections: {
      studyDesign: string;
      population: string;
      dataCollection: string;
      statisticalAnalysis: string;
    };
    citationSuggestions: string[];
  };
  methodsText: string;
  subsections: {
    studyDesign: string;
    population: string;
    dataCollection: string;
    statisticalAnalysis: string;
  };
  citationSuggestions: string[];
}

// ─── Module 5: ResultsNarrativeGenerator ─────────────────────────────────────

export interface ResultsNarrativeInput {
  tables: AnalysisResultTable[];
  interpretations: InterpretationOutput[];
  context: ProductContext;
}

export interface ResultsNarrativeOutput extends AIModuleOutput {
  structured: {
    narrative: string;
    paragraphsByTable: Record<string, string>;
    flaggedGaps: string[];
  };
  narrative: string;
  paragraphsByTable: Record<string, string>;
  flaggedGaps: string[];
}

// ─── Module 6: AnalysisConsistencyChecker ────────────────────────────────────

export interface ConsistencyCheckerInput {
  reportedMethods: string;
  reportedResults: CoefficientRow[];
  actualAnalysisOutputs: import('../api/index').AnalysisResult[];
  datasetSummary: DatasetIntelligenceOutput;
}

export interface ConsistencyCheckerOutput extends AIModuleOutput {
  structured: {
    passed: boolean;
    inconsistencies: ConsistencyFlag[];
    summary: string;
    reproducibilityScore: number;
  };
  passed: boolean;
  inconsistencies: ConsistencyFlag[];
  summary: string;
  reproducibilityScore: number;
}

// ─── Module 7: ReproducibilitySummaryGenerator ───────────────────────────────

export interface ReproducibilitySummaryInput {
  consistencyCheck: ConsistencyCheckerOutput;
  studyMeta: StudyMetadata;
}

export interface ReproducibilitySummaryOutput extends AIModuleOutput {
  structured: {
    auditNarrative: string;
    verificationStatement: string;
    recommendedActions: string[];
  };
  auditNarrative: string;
  verificationStatement: string;
  recommendedActions: string[];
}

// ─── Module 8: IndicatorDetectionEngine ──────────────────────────────────────

export interface IndicatorDetectionInput {
  datasetSummary: DatasetIntelligenceOutput;
  programObjectives: string[];
  donorFramework?: 'USAID' | 'UN SDG' | 'WHO' | 'custom';
}

export interface IndicatorDetectionOutput extends AIModuleOutput {
  structured: {
    candidateIndicators: IndicatorCandidate[];
    suggestedTargets: Record<string, number>;
    alignedFrameworkIndicators: string[];
    dashboardConfig: IndicatorDashboardConfig;
  };
  candidateIndicators: IndicatorCandidate[];
  suggestedTargets: Record<string, number>;
  alignedFrameworkIndicators: string[];
  dashboardConfig: IndicatorDashboardConfig;
}

// ─── Cache / Store Types ──────────────────────────────────────────────────────

export type AIModuleId =
  | 'dataset-intelligence'
  | 'analysis-recommendation'
  | 'interpretation'
  | 'methods-section'
  | 'results-narrative'
  | 'consistency-checker'
  | 'reproducibility-summary'
  | 'indicator-detection';

export interface CachedAIOutput<T extends AIModuleOutput = AIModuleOutput> {
  moduleId: AIModuleId;
  studyId: string;
  output: T;
  generatedAt: string;  // ISO timestamp
  sourceHash: string;   // hash of the input data — invalidates when source changes
}

export type AIOutputStatus = 'idle' | 'loading' | 'success' | 'error' | 'stale';
