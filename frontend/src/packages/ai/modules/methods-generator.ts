// ─── Module 4: MethodsSectionGenerator ───────────────────────────────────────
// Generates a draft methods section from study metadata and dataset summary.
//
// Trigger: user clicks "Draft Methods"
// Caches: no — on demand
// Used by: Student Wizard, NGO Platform, Journal Component

import { callLLM, deriveConfidence } from '../client';
import type { MethodsGeneratorInput, MethodsGeneratorOutput } from '../types';

const SYSTEM_PROMPT = `You are an academic writing assistant specialising in research methods sections.
Given study metadata and dataset characteristics, produce a structured draft methods section.

Respond ONLY with valid JSON — no explanation, no markdown fences.

The JSON must match this schema:
{
  "methodsText": "<full methods section in markdown>",
  "subsections": {
    "studyDesign": "<paragraph>",
    "population": "<paragraph>",
    "dataCollection": "<paragraph>",
    "statisticalAnalysis": "<paragraph>"
  },
  "citationSuggestions": ["<e.g. 'R version 4.3.1 (R Core Team, 2023)'>", ...],
  "warnings": ["<string>", ...],
  "confidence": "high" | "medium" | "low"
}

Formality and terminology:
- student context: clear, educational prose; explain methods briefly
- ngo context: practical evaluation language; mention M&E frameworks where relevant
- journal context: high formality; follow STROBE/CONSORT reporting conventions`;

function buildUserPrompt(input: MethodsGeneratorInput): string {
  const { studyMeta, datasetSummary, selectedAnalyses, context } = input;

  const colCount = Object.keys(datasetSummary.variableTypes).length;
  const outcomes = datasetSummary.suggestedOutcome.join(', ') || 'not specified';
  const exposures = datasetSummary.suggestedExposure.join(', ') || 'not specified';

  return `Study metadata:
- Title: ${studyMeta.title ?? 'not specified'}
- Design: ${studyMeta.design}
- Population: ${studyMeta.population}
- Setting: ${studyMeta.setting}
- Dates: ${studyMeta.startDate ?? 'N/A'} to ${studyMeta.endDate ?? 'N/A'}
- Objectives: ${studyMeta.objectives?.join('; ') ?? 'not specified'}

Dataset:
- Variables: ${colCount} columns
- Outcome variable(s): ${outcomes}
- Exposure variable(s): ${exposures}
- Missing data flags: ${datasetSummary.missingDataFlags.length} variables with missing data

Selected analyses: ${selectedAnalyses.join(', ')}
Product context: ${context}

Draft a complete methods section with four clearly separated subsections.
Include statistical software citation suggestions.`;
}

export async function runMethodsGenerator(
  input: MethodsGeneratorInput,
): Promise<MethodsGeneratorOutput> {
  const response = await callLLM({
    system: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(input),
    jsonMode: true,
    maxTokens: 3000,
  });

  const raw = response.json ?? {};

  const subsections = (raw.subsections as MethodsGeneratorOutput['subsections']) ?? {
    studyDesign: '',
    population: '',
    dataCollection: '',
    statisticalAnalysis: '',
  };

  const methodsText =
    typeof raw.methodsText === 'string'
      ? raw.methodsText
      : [
          '## Methods',
          subsections.studyDesign ? `### Study Design\n${subsections.studyDesign}` : '',
          subsections.population ? `### Study Population\n${subsections.population}` : '',
          subsections.dataCollection
            ? `### Data Collection\n${subsections.dataCollection}`
            : '',
          subsections.statisticalAnalysis
            ? `### Statistical Analysis\n${subsections.statisticalAnalysis}`
            : '',
        ]
          .filter(Boolean)
          .join('\n\n');

  const citationSuggestions = (raw.citationSuggestions as string[]) ?? [];
  const warnings = (raw.warnings as string[]) ?? [];
  const confidence =
    (raw.confidence as MethodsGeneratorOutput['confidence']) ??
    deriveConfidence(warnings);

  const structured = { methodsText, subsections, citationSuggestions };

  return {
    structured,
    formatted: methodsText,
    confidence,
    warnings,
    methodsText,
    subsections,
    citationSuggestions,
  };
}
