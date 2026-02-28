// ─── Module 5: ResultsNarrativeGenerator ─────────────────────────────────────
// Converts analysis result tables into structured narrative paragraphs.
//
// Trigger: user clicks "Draft Results"
// Caches: no — on demand
// Used by: Student Wizard, NGO Platform, Journal Component
// Note: same module across all products — `context` adjusts formality/terminology

import { callLLM, deriveConfidence } from '../client';
import type { ResultsNarrativeInput, ResultsNarrativeOutput } from '../types';

const SYSTEM_PROMPT = `You are an academic writing assistant specialising in research results sections.
Convert statistical analysis tables and interpretations into coherent narrative paragraphs.

Respond ONLY with valid JSON — no explanation, no markdown fences.

The JSON must match this schema:
{
  "narrative": "<full results section in markdown>",
  "paragraphsByTable": {
    "<table title>": "<paragraph for that table>"
  },
  "flaggedGaps": ["<e.g. 'No sensitivity analysis reported'>", ...],
  "warnings": ["<string>", ...],
  "confidence": "high" | "medium" | "low"
}

Context-specific guidance:
- student: clear narrative, explain what each number means
- ngo: practical framing, reference targets/benchmarks where possible, use M&E language
- journal: formal academic prose, follow APA reporting style, include all statistics inline`;

function buildUserPrompt(input: ResultsNarrativeInput): string {
  const tableDescriptions = input.tables
    .map(
      (t) =>
        `Table: ${t.title}\n` +
        `Rows (sample): ${JSON.stringify(t.rows.slice(0, 3))}\n` +
        (t.footnotes ? `Footnotes: ${t.footnotes.join('; ')}` : ''),
    )
    .join('\n\n');

  const interpretationSummaries = input.interpretations
    .map((i) => `- ${i.plainLanguage}`)
    .join('\n');

  return `Context: ${input.context}

Analysis tables:
${tableDescriptions}

Existing interpretations:
${interpretationSummaries || 'None provided'}

Write a results section narrative that integrates the table data and interpretations.
Flag any gaps (missing analyses, unreported sensitivity checks, etc.).`;
}

export async function runResultsNarrativeGenerator(
  input: ResultsNarrativeInput,
): Promise<ResultsNarrativeOutput> {
  const response = await callLLM({
    system: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(input),
    jsonMode: true,
    maxTokens: 3000,
  });

  const raw = response.json ?? {};

  const narrative =
    typeof raw.narrative === 'string' ? raw.narrative : response.text;
  const paragraphsByTable =
    (raw.paragraphsByTable as Record<string, string>) ?? {};
  const flaggedGaps = (raw.flaggedGaps as string[]) ?? [];
  const warnings = (raw.warnings as string[]) ?? [];
  const confidence =
    (raw.confidence as ResultsNarrativeOutput['confidence']) ??
    deriveConfidence(warnings);

  const structured = { narrative, paragraphsByTable, flaggedGaps };

  const formattedGaps = flaggedGaps.length
    ? `\n\n---\n**Flagged gaps:**\n${flaggedGaps.map((g) => `- ⚠️ ${g}`).join('\n')}`
    : '';

  return {
    structured,
    formatted: narrative + formattedGaps,
    confidence,
    warnings,
    narrative,
    paragraphsByTable,
    flaggedGaps,
  };
}
