// ─── Module 2: AnalysisRecommendationEngine ───────────────────────────────────
// Recommends appropriate statistical tests based on study design and variable roles.
//
// Trigger: on study design save
// Caches: yes — invalidated on study design change
// Used by: Student Wizard (primary), NGO Platform (suggestion card)

import { callLLM, deriveConfidence, hashInput } from '../client';
import type { AnalysisRecommendationInput, AnalysisRecommendationOutput } from '../types';

const SYSTEM_PROMPT = `You are an expert biostatistician. Given a research study design and variable types,
recommend the most appropriate statistical tests and workflow.

Respond ONLY with valid JSON — no explanation, no markdown fences.

The JSON must match this exact schema:
{
  "primaryTest": "<string>",
  "alternativeTests": ["<string>", ...],
  "workflowOrder": ["<step 1>", "<step 2>", ...],
  "rationale": "<plain-language explanation>",
  "warnings": ["<string>", ...],
  "confidence": "high" | "medium" | "low"
}

workflowOrder should list analysis steps in order of execution (e.g., descriptive statistics, assumption checks, primary analysis, sensitivity analysis).
Tailor terminology and depth to the product context.`;

function buildUserPrompt(input: AnalysisRecommendationInput): string {
  const contextLabels: Record<typeof input.context, string> = {
    student: 'undergraduate/graduate student learning research methods',
    ngo: 'program evaluator at an NGO needing practical monitoring and evaluation',
    journal: 'academic researcher submitting to a peer-reviewed journal',
  };

  return `Study parameters:
- Study design: ${input.studyDesign}
- Outcome type: ${input.outcomeType}
- Exposure type: ${input.exposureType}
- Covariates: ${input.covariates.length > 0 ? input.covariates.join(', ') : 'none specified'}
- User context: ${contextLabels[input.context]}

Recommend the primary statistical test, alternatives, ordered workflow steps, and a plain-language rationale.
Flag any concerns (e.g., sample size considerations, assumption violations to check).`;
}

export async function runAnalysisRecommendation(
  input: AnalysisRecommendationInput,
): Promise<AnalysisRecommendationOutput> {
  const response = await callLLM({
    system: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(input),
    jsonMode: true,
    maxTokens: 1024,
  });

  const raw = response.json ?? {};

  const primaryTest = typeof raw.primaryTest === 'string' ? raw.primaryTest : 'Unknown';
  const alternativeTests = (raw.alternativeTests as string[]) ?? [];
  const workflowOrder = (raw.workflowOrder as string[]) ?? [];
  const rationale = typeof raw.rationale === 'string' ? raw.rationale : response.text;
  const warnings = (raw.warnings as string[]) ?? [];
  const confidence =
    (raw.confidence as AnalysisRecommendationOutput['confidence']) ??
    deriveConfidence(warnings);

  const structured = { primaryTest, alternativeTests, workflowOrder, rationale, warnings };

  const formattedParts = [
    `## Recommended Analysis\n\n**Primary Test:** ${primaryTest}`,
    alternativeTests.length
      ? `**Alternatives:** ${alternativeTests.join(', ')}`
      : '',
    `\n### Workflow\n${workflowOrder.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
    `\n### Rationale\n${rationale}`,
    warnings.length
      ? `\n### Warnings\n${warnings.map((w) => `- ⚠️ ${w}`).join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    structured,
    formatted: formattedParts,
    confidence,
    warnings,
    primaryTest,
    alternativeTests,
    workflowOrder,
    rationale,
  };
}

export function analysisRecommendationHash(input: AnalysisRecommendationInput): string {
  return hashInput({
    studyDesign: input.studyDesign,
    outcomeType: input.outcomeType,
    exposureType: input.exposureType,
    covariates: [...input.covariates].sort(),
  });
}
