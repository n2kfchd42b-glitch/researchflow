// ─── Module 1: DatasetIntelligenceEngine ──────────────────────────────────────
// Scans dataset metadata on upload and returns a structured variable summary.
//
// Trigger: post-upload success
// Caches: yes — in project context, invalidated on dataset change
// Used by: Student Wizard (Step 2), NGO Platform (Dataset Onboarding)

import { callLLM, deriveConfidence, hashInput } from '../client';
import type {
  DatasetIntelligenceInput,
  DatasetIntelligenceOutput,
  MissingDataFlag,
} from '../types';

const SYSTEM_PROMPT = `You are a biostatistics and data science expert embedded in a research platform.
Your job is to analyse dataset metadata (column names, types, sample values, missing counts) and return a structured JSON object.

Respond ONLY with valid JSON — no explanation, no markdown fences.

The JSON must match this exact schema:
{
  "variableTypes": {
    "<columnName>": "continuous" | "binary" | "categorical" | "date" | "id"
  },
  "suggestedOutcome": ["<columnName>", ...],
  "suggestedExposure": ["<columnName>", ...],
  "missingDataFlags": [
    {
      "column": "<name>",
      "nullCount": <number>,
      "nullPercent": <number>,
      "severity": "low" | "medium" | "high",
      "recommendation": "<string>"
    }
  ],
  "categoricalGroupings": {
    "<columnName>": ["<value1>", "<value2>", ...]
  },
  "warnings": ["<string>", ...],
  "confidence": "high" | "medium" | "low",
  "summaryPanel": "<markdown string for display>"
}

Classification rules:
- continuous: numeric with >10 unique values
- binary: exactly 2 unique values or boolean-like
- categorical: non-numeric or numeric with ≤10 unique values (not binary)
- date: ISO date-like strings or datetime dtype
- id: high cardinality (>80% unique) and appears to be an identifier

Missing severity:
- low: <5% null
- medium: 5–20% null
- high: >20% null

summaryPanel should be a concise markdown table/list for the UI, tailored to the product context provided.`;

function buildUserPrompt(input: DatasetIntelligenceInput): string {
  const contextNote =
    input.context === 'student'
      ? 'Write the summaryPanel in plain language suitable for graduate students.'
      : input.context === 'ngo'
      ? 'Write the summaryPanel using program evaluation terminology (indicators, beneficiaries, M&E).'
      : 'Write the summaryPanel using academic/journal terminology (covariates, confounders, outcomes).';

  return `Dataset metadata:
- Row count: ${input.rowCount}
- Study design: ${input.studyDesign ?? 'not specified'}
- Product context: ${input.context}
- ${contextNote}

Columns:
${input.columns
  .map(
    (c) =>
      `  • ${c.name} [${c.dtype}] — nulls: ${c.nullCount}, sample: ${JSON.stringify(c.sampleValues.slice(0, 5))}`,
  )
  .join('\n')}

Classify every column, identify likely outcome and exposure candidates, flag missing data issues, and produce a summaryPanel markdown string.`;
}

export async function runDatasetIntelligence(
  input: DatasetIntelligenceInput,
): Promise<DatasetIntelligenceOutput> {
  const response = await callLLM({
    system: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(input),
    jsonMode: true,
    maxTokens: 2048,
  });

  const raw = response.json ?? {};

  const variableTypes =
    (raw.variableTypes as DatasetIntelligenceOutput['variableTypes']) ?? {};
  const suggestedOutcome = (raw.suggestedOutcome as string[]) ?? [];
  const suggestedExposure = (raw.suggestedExposure as string[]) ?? [];
  const missingDataFlags = (raw.missingDataFlags as MissingDataFlag[]) ?? [];
  const categoricalGroupings =
    (raw.categoricalGroupings as Record<string, string[]>) ?? {};
  const warnings = (raw.warnings as string[]) ?? [];
  const confidence =
    (raw.confidence as DatasetIntelligenceOutput['confidence']) ??
    deriveConfidence(warnings);
  const summaryPanel =
    typeof raw.summaryPanel === 'string'
      ? raw.summaryPanel
      : response.text;

  const structured = {
    variableTypes,
    suggestedOutcome,
    suggestedExposure,
    missingDataFlags,
    categoricalGroupings,
  };

  return {
    structured,
    formatted: summaryPanel,
    confidence,
    warnings,
    variableTypes,
    suggestedOutcome,
    suggestedExposure,
    missingDataFlags,
    categoricalGroupings,
    summaryPanel,
  };
}

/** Compute source hash for cache invalidation. */
export function datasetIntelligenceHash(input: DatasetIntelligenceInput): string {
  return hashInput({
    columns: input.columns.map((c) => ({ name: c.name, dtype: c.dtype, nullCount: c.nullCount })),
    rowCount: input.rowCount,
    studyDesign: input.studyDesign,
  });
}
