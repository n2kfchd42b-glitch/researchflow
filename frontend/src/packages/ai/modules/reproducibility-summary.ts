// ─── Module 7: ReproducibilitySummaryGenerator ───────────────────────────────
// Generates an audit narrative from consistency check output.
// Suitable for reviewer notes, funder reports, and badge display.
//
// Trigger: post consistency check
// Caches: yes — per submission
// Used by: Journal Component (Reproducibility Badge), NGO Platform (funder reports)

import { callLLM, deriveConfidence, hashInput } from '../client';
import type {
  ReproducibilitySummaryInput,
  ReproducibilitySummaryOutput,
} from '../types';

const SYSTEM_PROMPT = `You are a research integrity auditor. Given a consistency check result,
produce a professional audit narrative and a short badge-ready verification statement.

Respond ONLY with valid JSON — no explanation, no markdown fences.

The JSON must match this schema:
{
  "auditNarrative": "<professional audit narrative in markdown, 2–4 paragraphs>",
  "verificationStatement": "<one-sentence badge-ready summary>",
  "recommendedActions": ["<action 1>", ...],
  "warnings": ["<string>", ...],
  "confidence": "high" | "medium" | "low"
}

verificationStatement examples:
- "Analysis independently verified: results reproduce with 98/100 reproducibility score (2026-02-28)."
- "Submission flagged: 2 major inconsistencies found between reported and actual results."

recommendedActions should be concrete steps for the authors or reviewers.`;

function buildUserPrompt(input: ReproducibilitySummaryInput): string {
  const check = input.consistencyCheck;
  const { studyMeta } = input;

  return `Study: ${studyMeta.title ?? 'Untitled'} (${studyMeta.design}, ${studyMeta.population})

Consistency check result:
- Passed: ${check.passed}
- Reproducibility score: ${check.reproducibilityScore}/100
- Total inconsistencies: ${check.inconsistencies.length}
  - Critical: ${check.inconsistencies.filter((i) => i.severity === 'critical').length}
  - Major: ${check.inconsistencies.filter((i) => i.severity === 'major').length}
  - Minor: ${check.inconsistencies.filter((i) => i.severity === 'minor').length}

Consistency check summary:
${check.summary}

Inconsistencies:
${
  check.inconsistencies.length > 0
    ? check.inconsistencies
        .map(
          (i) =>
            `  [${i.severity}] ${i.field}: reported "${i.reported}" vs actual "${i.actual}"`,
        )
        .join('\n')
    : '  None'
}

Generate an audit narrative suitable for a peer-review or funder context,
a one-sentence badge-ready verification statement,
and a list of concrete recommended actions.`;
}

export async function runReproducibilitySummaryGenerator(
  input: ReproducibilitySummaryInput,
): Promise<ReproducibilitySummaryOutput> {
  const response = await callLLM({
    system: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(input),
    jsonMode: true,
    maxTokens: 2048,
  });

  const raw = response.json ?? {};

  const auditNarrative =
    typeof raw.auditNarrative === 'string' ? raw.auditNarrative : response.text;
  const verificationStatement =
    typeof raw.verificationStatement === 'string'
      ? raw.verificationStatement
      : input.consistencyCheck.passed
      ? `Analysis verified with reproducibility score ${input.consistencyCheck.reproducibilityScore}/100.`
      : `Analysis flagged: ${input.consistencyCheck.inconsistencies.length} inconsistencies found.`;
  const recommendedActions = (raw.recommendedActions as string[]) ?? [];
  const warnings = (raw.warnings as string[]) ?? [];
  const confidence =
    (raw.confidence as ReproducibilitySummaryOutput['confidence']) ??
    deriveConfidence(warnings, input.consistencyCheck.reproducibilityScore);

  const structured = { auditNarrative, verificationStatement, recommendedActions };

  const formatted = [
    `## Reproducibility Audit`,
    `> ${verificationStatement}`,
    '',
    auditNarrative,
    recommendedActions.length
      ? `\n### Recommended Actions\n${recommendedActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}`
      : '',
  ]
    .filter((s) => s !== '')
    .join('\n');

  return {
    structured,
    formatted,
    confidence,
    warnings,
    auditNarrative,
    verificationStatement,
    recommendedActions,
  };
}

export function reproducibilitySummaryHash(input: ReproducibilitySummaryInput): string {
  return hashInput({
    score: input.consistencyCheck.reproducibilityScore,
    inconsistencyCount: input.consistencyCheck.inconsistencies.length,
    studyTitle: input.studyMeta.title,
  });
}
