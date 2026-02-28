// ─── Module 6: AnalysisConsistencyChecker ────────────────────────────────────
// Compares submitted manuscript methods/results against actual dataset and
// analysis outputs to flag inconsistencies.
//
// Trigger: on manuscript submission intake
// Caches: no — always fresh
// Used by: Journal Component (submission intake), NGO Platform (final evaluation)

import { callLLM, deriveConfidence, hashInput } from '../client';
import type {
  ConsistencyCheckerInput,
  ConsistencyCheckerOutput,
  ConsistencyFlag,
} from '../types';

const SYSTEM_PROMPT = `You are a research integrity specialist and biostatistician.
Compare a manuscript's reported methods and results against the actual analysis outputs to identify inconsistencies.

Respond ONLY with valid JSON — no explanation, no markdown fences.

The JSON must match this schema:
{
  "passed": true | false,
  "inconsistencies": [
    {
      "field": "<e.g. 'sample size' | 'odds ratio for exposure' | 'p-value'>",
      "reported": "<what the manuscript states>",
      "actual": "<what the data/analysis shows>",
      "severity": "minor" | "major" | "critical"
    }
  ],
  "summary": "<one-paragraph summary>",
  "reproducibilityScore": <0–100>,
  "warnings": ["<string>", ...],
  "confidence": "high" | "medium" | "low"
}

Severity definitions:
- minor: rounding differences, minor terminology mismatch
- major: directional error, unreported covariate, wrong test reported
- critical: fabricated or significantly altered numbers

reproducibilityScore: 100 = fully reproducible, 0 = cannot reproduce

passed: true only if there are no major or critical inconsistencies`;

function buildUserPrompt(input: ConsistencyCheckerInput): string {
  const actualResults = input.actualAnalysisOutputs
    .map((a) => `  [${a.type}] ${a.title}: ${a.summary}`)
    .join('\n');

  return `Reported methods (from manuscript):
${input.reportedMethods}

Reported results (from manuscript):
${input.reportedResults
  .map(
    (r) =>
      `  ${r.variable}: estimate=${r.estimate}, CI=[${r.ci_lower}, ${r.ci_upper}], p=${r.pValue}`,
  )
  .join('\n')}

Actual analysis outputs:
${actualResults}

Dataset summary:
- Variables with missing data: ${input.datasetSummary.missingDataFlags.length}
- Outcome candidates: ${input.datasetSummary.suggestedOutcome.join(', ')}
- Variable count: ${Object.keys(input.datasetSummary.variableTypes).length}

Identify all inconsistencies between reported and actual values.
Assign a reproducibility score and determine if the submission passes.`;
}

export async function runConsistencyChecker(
  input: ConsistencyCheckerInput,
): Promise<ConsistencyCheckerOutput> {
  const response = await callLLM({
    system: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(input),
    jsonMode: true,
    maxTokens: 2048,
  });

  const raw = response.json ?? {};

  const passed = raw.passed === true;
  const inconsistencies = (raw.inconsistencies as ConsistencyFlag[]) ?? [];
  const summary =
    typeof raw.summary === 'string' ? raw.summary : response.text;
  const reproducibilityScore =
    typeof raw.reproducibilityScore === 'number'
      ? Math.min(100, Math.max(0, raw.reproducibilityScore))
      : passed
      ? 100
      : 0;
  const warnings = (raw.warnings as string[]) ?? [];
  const confidence =
    (raw.confidence as ConsistencyCheckerOutput['confidence']) ??
    deriveConfidence(warnings, reproducibilityScore);

  const structured = { passed, inconsistencies, summary, reproducibilityScore };

  const criticalCount = inconsistencies.filter((i) => i.severity === 'critical').length;
  const majorCount = inconsistencies.filter((i) => i.severity === 'major').length;
  const minorCount = inconsistencies.filter((i) => i.severity === 'minor').length;

  const formatted = [
    `## Consistency Check — ${passed ? '✅ Passed' : '❌ Failed'}`,
    `**Reproducibility Score:** ${reproducibilityScore}/100`,
    `**Issues found:** ${criticalCount} critical · ${majorCount} major · ${minorCount} minor`,
    '',
    summary,
    inconsistencies.length
      ? `\n### Inconsistencies\n` +
        inconsistencies
          .map(
            (i) =>
              `- **[${i.severity.toUpperCase()}]** ${i.field}: reported \`${i.reported}\` vs actual \`${i.actual}\``,
          )
          .join('\n')
      : '',
  ]
    .filter((s) => s !== '')
    .join('\n');

  return {
    structured,
    formatted,
    confidence,
    warnings,
    passed,
    inconsistencies,
    summary,
    reproducibilityScore,
  };
}

export function consistencyCheckerHash(input: ConsistencyCheckerInput): string {
  return hashInput({
    reportedMethods: input.reportedMethods,
    reportedResults: input.reportedResults,
    actualIds: input.actualAnalysisOutputs.map((a) => a.analysisId),
  });
}
