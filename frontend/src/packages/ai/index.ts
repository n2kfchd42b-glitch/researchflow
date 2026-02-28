// ─── ResearchFlow AI Package ───────────────────────────────────────────────────
// Central export for the shared AI automation layer.
//
// IMPORTANT: These exports are consumed by service functions ONLY.
// UI components must import from src/services/ai-service.ts, not from here.

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  ProductContext,
  AIModuleOutput,
  AIOutputStatus,
  AIModuleId,
  CachedAIOutput,

  // Domain types
  ColumnSchema,
  MissingDataFlag,
  CoefficientRow,
  StudyMetadata,
  AnalysisResultTable,
  ConsistencyFlag,
  IndicatorCandidate,
  IndicatorDashboardConfig,

  // Module 1
  DatasetIntelligenceInput,
  DatasetIntelligenceOutput,

  // Module 2
  AnalysisRecommendationInput,
  AnalysisRecommendationOutput,

  // Module 3
  InterpretationInput,
  InterpretationOutput,

  // Module 4
  MethodsGeneratorInput,
  MethodsGeneratorOutput,

  // Module 5
  ResultsNarrativeInput,
  ResultsNarrativeOutput,

  // Module 6
  ConsistencyCheckerInput,
  ConsistencyCheckerOutput,

  // Module 7
  ReproducibilitySummaryInput,
  ReproducibilitySummaryOutput,

  // Module 8
  IndicatorDetectionInput,
  IndicatorDetectionOutput,
} from './types';

// ─── Client utilities ─────────────────────────────────────────────────────────
export { deriveConfidence, hashInput } from './client';

// ─── Cache ─────────────────────────────────────────────────────────────────────
export {
  getCached,
  setCached,
  invalidateCache,
  invalidateStudyCache,
} from './cache';

// ─── Module 1: DatasetIntelligenceEngine ──────────────────────────────────────
export {
  runDatasetIntelligence,
  datasetIntelligenceHash,
} from './modules/dataset-intelligence';

// ─── Module 2: AnalysisRecommendationEngine ───────────────────────────────────
export {
  runAnalysisRecommendation,
  analysisRecommendationHash,
} from './modules/analysis-recommendation';

// ─── Module 3: InterpretationGenerator ───────────────────────────────────────
export {
  runInterpretationGenerator,
  interpretationHash,
} from './modules/interpretation-generator';

// ─── Module 4: MethodsSectionGenerator ───────────────────────────────────────
export { runMethodsGenerator } from './modules/methods-generator';

// ─── Module 5: ResultsNarrativeGenerator ─────────────────────────────────────
export { runResultsNarrativeGenerator } from './modules/results-narrative';

// ─── Module 6: AnalysisConsistencyChecker ────────────────────────────────────
export {
  runConsistencyChecker,
  consistencyCheckerHash,
} from './modules/consistency-checker';

// ─── Module 7: ReproducibilitySummaryGenerator ───────────────────────────────
export {
  runReproducibilitySummaryGenerator,
  reproducibilitySummaryHash,
} from './modules/reproducibility-summary';

// ─── Module 8: IndicatorDetectionEngine ──────────────────────────────────────
export {
  runIndicatorDetection,
  indicatorDetectionHash,
} from './modules/indicator-detection';
