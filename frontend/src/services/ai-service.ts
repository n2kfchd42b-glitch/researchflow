// ─── ResearchFlow AI Service Layer ───────────────────────────────────────────
// The ONLY file that UI components and route handlers should import for AI calls.
//
// Architecture:
//   UI dispatches intent → function here → packages/ai module → cached output
//
// Rules:
//   1. All caching is handled here — modules are stateless and cache-agnostic.
//   2. UI reads from stored outputs; these functions are the write path.
//   3. Do NOT call packages/ai/client.ts directly from anywhere except modules.

import {
  // Module runners
  runDatasetIntelligence,
  runAnalysisRecommendation,
  runInterpretationGenerator,
  runMethodsGenerator,
  runResultsNarrativeGenerator,
  runConsistencyChecker,
  runReproducibilitySummaryGenerator,
  runIndicatorDetection,

  // Hash functions (cache invalidation)
  datasetIntelligenceHash,
  analysisRecommendationHash,
  interpretationHash,
  consistencyCheckerHash,
  reproducibilitySummaryHash,
  indicatorDetectionHash,

  // Cache
  getCached,
  setCached,
  invalidateCache,
  invalidateStudyCache,
} from '../packages/ai';

import type {
  DatasetIntelligenceInput,
  DatasetIntelligenceOutput,
  AnalysisRecommendationInput,
  AnalysisRecommendationOutput,
  InterpretationInput,
  InterpretationOutput,
  MethodsGeneratorInput,
  MethodsGeneratorOutput,
  ResultsNarrativeInput,
  ResultsNarrativeOutput,
  ConsistencyCheckerInput,
  ConsistencyCheckerOutput,
  ReproducibilitySummaryInput,
  ReproducibilitySummaryOutput,
  IndicatorDetectionInput,
  IndicatorDetectionOutput,
  CachedAIOutput,
} from '../packages/ai';

// Re-export types UI needs to read from the cache
export type {
  DatasetIntelligenceOutput,
  AnalysisRecommendationOutput,
  InterpretationOutput,
  MethodsGeneratorOutput,
  ResultsNarrativeOutput,
  ConsistencyCheckerOutput,
  ReproducibilitySummaryOutput,
  IndicatorDetectionOutput,
  CachedAIOutput,
};

export { invalidateCache, invalidateStudyCache };

// ─── Module 1: DatasetIntelligenceEngine ──────────────────────────────────────
// Call after dataset upload succeeds. Returns cached output if dataset unchanged.

export async function getDatasetIntelligence(
  studyId: string,
  input: DatasetIntelligenceInput,
): Promise<DatasetIntelligenceOutput> {
  const sourceHash = datasetIntelligenceHash(input);
  const cached = getCached<DatasetIntelligenceOutput>(
    'dataset-intelligence',
    studyId,
    sourceHash,
  );
  if (cached) return cached.output;

  const output = await runDatasetIntelligence(input);
  setCached('dataset-intelligence', studyId, output, sourceHash);
  return output;
}

export function getCachedDatasetIntelligence(
  studyId: string,
  input: DatasetIntelligenceInput,
): CachedAIOutput<DatasetIntelligenceOutput> | null {
  return getCached('dataset-intelligence', studyId, datasetIntelligenceHash(input));
}

// ─── Module 2: AnalysisRecommendationEngine ───────────────────────────────────
// Call on study design save. Cached — invalidated when study design changes.

export async function getAnalysisRecommendation(
  studyId: string,
  input: AnalysisRecommendationInput,
): Promise<AnalysisRecommendationOutput> {
  const sourceHash = analysisRecommendationHash(input);
  const cached = getCached<AnalysisRecommendationOutput>(
    'analysis-recommendation',
    studyId,
    sourceHash,
  );
  if (cached) return cached.output;

  const output = await runAnalysisRecommendation(input);
  setCached('analysis-recommendation', studyId, output, sourceHash);
  return output;
}

export function getCachedAnalysisRecommendation(
  studyId: string,
  input: AnalysisRecommendationInput,
): CachedAIOutput<AnalysisRecommendationOutput> | null {
  return getCached('analysis-recommendation', studyId, analysisRecommendationHash(input));
}

// ─── Module 3: InterpretationGenerator ───────────────────────────────────────
// Call post-analysis run. Cached per analysis result.
// analysisId is used as the studyId dimension here for per-result caching.

export async function getInterpretation(
  analysisId: string,
  input: InterpretationInput,
): Promise<InterpretationOutput> {
  const sourceHash = interpretationHash(input);
  const cached = getCached<InterpretationOutput>('interpretation', analysisId, sourceHash);
  if (cached) return cached.output;

  const output = await runInterpretationGenerator(input);
  setCached('interpretation', analysisId, output, sourceHash);
  return output;
}

export function getCachedInterpretation(
  analysisId: string,
  input: InterpretationInput,
): CachedAIOutput<InterpretationOutput> | null {
  return getCached('interpretation', analysisId, interpretationHash(input));
}

// ─── Module 4: MethodsSectionGenerator ───────────────────────────────────────
// On-demand only — no caching. Called when user clicks "Draft Methods".

export async function draftMethodsSection(
  input: MethodsGeneratorInput,
): Promise<MethodsGeneratorOutput> {
  return runMethodsGenerator(input);
}

// ─── Module 5: ResultsNarrativeGenerator ─────────────────────────────────────
// On-demand only — no caching. Called when user clicks "Draft Results".

export async function draftResultsNarrative(
  input: ResultsNarrativeInput,
): Promise<ResultsNarrativeOutput> {
  return runResultsNarrativeGenerator(input);
}

// ─── Module 6: AnalysisConsistencyChecker ────────────────────────────────────
// Always fresh — no caching. Called on manuscript submission.

export async function checkConsistency(
  input: ConsistencyCheckerInput,
): Promise<ConsistencyCheckerOutput> {
  return runConsistencyChecker(input);
}

// ─── Module 7: ReproducibilitySummaryGenerator ───────────────────────────────
// Cached per submission. submissionId used as studyId dimension.

export async function getReproducibilitySummary(
  submissionId: string,
  input: ReproducibilitySummaryInput,
): Promise<ReproducibilitySummaryOutput> {
  const sourceHash = reproducibilitySummaryHash(input);
  const cached = getCached<ReproducibilitySummaryOutput>(
    'reproducibility-summary',
    submissionId,
    sourceHash,
  );
  if (cached) return cached.output;

  const output = await runReproducibilitySummaryGenerator(input);
  setCached('reproducibility-summary', submissionId, output, sourceHash);
  return output;
}

export function getCachedReproducibilitySummary(
  submissionId: string,
  input: ReproducibilitySummaryInput,
): CachedAIOutput<ReproducibilitySummaryOutput> | null {
  return getCached(
    'reproducibility-summary',
    submissionId,
    reproducibilitySummaryHash(input),
  );
}

// ─── Module 8: IndicatorDetectionEngine ──────────────────────────────────────
// NGO only. Cached in project context; invalidated when dataset changes.

export async function getIndicatorDetection(
  projectId: string,
  input: IndicatorDetectionInput,
): Promise<IndicatorDetectionOutput> {
  const sourceHash = indicatorDetectionHash(input);
  const cached = getCached<IndicatorDetectionOutput>(
    'indicator-detection',
    projectId,
    sourceHash,
  );
  if (cached) return cached.output;

  const output = await runIndicatorDetection(input);
  setCached('indicator-detection', projectId, output, sourceHash);
  return output;
}

export function getCachedIndicatorDetection(
  projectId: string,
  input: IndicatorDetectionInput,
): CachedAIOutput<IndicatorDetectionOutput> | null {
  return getCached('indicator-detection', projectId, indicatorDetectionHash(input));
}
