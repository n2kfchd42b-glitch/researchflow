// ─── Module 3: InterpretationGenerator ───────────────────────────────────────
// Converts raw model outputs into plain-language and academic-format interpretations.
//
// Trigger: post-analysis run
// Caches: yes — per analysis result
// Used by: Student Wizard (expandable panel below results), Journal Component (verification panel)
//
// IMPORTANT: Do not auto-insert into editable report fields.
// Return text for the user to explicitly copy or accept.

import { callLLM, deriveConfidence, hashInput } from '../client';
import type { InterpretationInput, InterpretationOutput } from '../types';

const SYSTEM_PROMPT = `You are a biostatistics expert who specialises in communicating statistical results.
Given regression model output, produce plain-language and academic-format interpretations.

Respond ONLY with valid JSON — no explanation, no markdown fences.

The JSON must match this schema:
{
  "plainLanguage": "<string>",
  "academicSentence": "<string>",
  "significanceStatement": "<string>",
  "limitationFlags": ["<string>", ...],
  "warnings": ["<string>", ...],
  "confidence": "high" | "medium" | "low"
}

Guidelines:
- plainLanguage: accessible sentence for a non-statistician (avoid jargon, use concrete numbers)
- academicSentence: APA/Vancouver-compatible reporting sentence including effect size, 95% CI, and p-value
- significanceStatement: one sentence stating whether results are statistically significant and practically meaningful
- limitationFlags: interpretation caveats (wide CI, borderline p-value, small n, etc.)
- Tailor formality to the context parameter`;

function effectLabel(modelType: InterpretationInput['modelType']): string {
  const labels: Record<InterpretationInput['modelType'], string> = {
    logistic: 'odds ratio (OR)',
    linear: 'coefficient (β)',
    cox: 'hazard ratio (HR)',
    poisson: 'incidence rate ratio (IRR)',
    mixed: 'fixed effect estimate',
  };
  return labels[modelType];
}

function buildUserPrompt(input: InterpretationInput): string {
  const effect = effectLabel(input.modelType);
  const primaryCoef = input.coefficients.find(
    (c) => c.variable === input.exposureLabel,
  ) ?? input.coefficients[0];

  const contextNote =
    input.context === 'student'
      ? 'Write the plainLanguage interpretation for a graduate student audience.'
      : input.context === 'ngo'
      ? 'Write the plainLanguage interpretation for a program evaluator audience using practical framing.'
      : 'Write both sentences for a peer-reviewed academic journal audience (high formality).';

  return `Model type: ${input.modelType} regression
Outcome: ${input.outcomeLabel}
Primary exposure: ${input.exposureLabel}
Effect measure: ${effect}
Context: ${input.context}
${contextNote}

Coefficients:
${input.coefficients
  .map(
    (c) =>
      `  ${c.variable}: estimate=${c.estimate}, 95% CI [${c.ci_lower}, ${c.ci_upper}], p=${c.pValue}`,
  )
  .join('\n')}

Primary estimate for interpretation: ${primaryCoef?.variable ?? 'first coefficient'} = ${primaryCoef?.estimate ?? 'N/A'} (95% CI: ${primaryCoef?.ci_lower ?? 'N/A'}–${primaryCoef?.ci_upper ?? 'N/A'}, p=${primaryCoef?.pValue ?? 'N/A'})`;
}

export async function runInterpretationGenerator(
  input: InterpretationInput,
): Promise<InterpretationOutput> {
  const response = await callLLM({
    system: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(input),
    jsonMode: true,
    maxTokens: 1024,
  });

  const raw = response.json ?? {};

  const plainLanguage =
    typeof raw.plainLanguage === 'string' ? raw.plainLanguage : response.text;
  const academicSentence =
    typeof raw.academicSentence === 'string' ? raw.academicSentence : '';
  const significanceStatement =
    typeof raw.significanceStatement === 'string' ? raw.significanceStatement : '';
  const limitationFlags = (raw.limitationFlags as string[]) ?? [];
  const warnings = (raw.warnings as string[]) ?? [];
  const confidence =
    (raw.confidence as InterpretationOutput['confidence']) ??
    deriveConfidence([...warnings, ...limitationFlags]);

  const structured = {
    plainLanguage,
    academicSentence,
    significanceStatement,
    limitationFlags,
  };

  const formatted = [
    `**Plain language:** ${plainLanguage}`,
    `\n**Academic sentence:** ${academicSentence}`,
    `\n**Significance:** ${significanceStatement}`,
    limitationFlags.length
      ? `\n**Caveats:**\n${limitationFlags.map((f) => `- ${f}`).join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    structured,
    formatted,
    confidence,
    warnings,
    plainLanguage,
    academicSentence,
    significanceStatement,
    limitationFlags,
  };
}

export function interpretationHash(input: InterpretationInput): string {
  return hashInput({
    modelType: input.modelType,
    coefficients: input.coefficients,
    outcomeLabel: input.outcomeLabel,
    exposureLabel: input.exposureLabel,
  });
}
