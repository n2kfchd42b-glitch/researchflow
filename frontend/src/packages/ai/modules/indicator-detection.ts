// ─── Module 8: IndicatorDetectionEngine ──────────────────────────────────────
// Scans survey/program datasets to identify candidate indicators, formulas,
// and tracking configurations aligned with donor frameworks.
//
// Trigger: on project dataset finalisation
// Caches: yes — in project context
// Used by: NGO Platform only (Indicator Setup step)

import { callLLM, deriveConfidence, hashInput } from '../client';
import type {
  IndicatorDetectionInput,
  IndicatorDetectionOutput,
  IndicatorCandidate,
  IndicatorDashboardConfig,
} from '../types';

const SYSTEM_PROMPT = `You are an M&E (monitoring and evaluation) expert with deep knowledge of
international development donor frameworks (USAID, UN SDGs, WHO) and program indicator design.

Given dataset variable summaries and program objectives, identify candidate program indicators.

Respond ONLY with valid JSON — no explanation, no markdown fences.

The JSON must match this schema:
{
  "candidateIndicators": [
    {
      "name": "<indicator name>",
      "formula": "<e.g. '(beneficiaries_reached / target_population) * 100'>",
      "sourceColumns": ["<col1>", "<col2>"],
      "rationale": "<why this indicator is relevant>"
    }
  ],
  "suggestedTargets": {
    "<indicatorName>": <numeric target>
  },
  "alignedFrameworkIndicators": ["<e.g. 'SDG 3.1.1 — Maternal mortality ratio'>", ...],
  "dashboardConfig": {
    "primaryIndicators": ["<name>", ...],
    "trackingFrequency": "monthly" | "quarterly" | "annual",
    "visualizationType": "trend" | "target-vs-actual" | "disaggregated",
    "alertThresholds": {
      "<indicatorName>": <threshold number>
    }
  },
  "warnings": ["<string>", ...],
  "confidence": "high" | "medium" | "low"
}`;

function buildUserPrompt(input: IndicatorDetectionInput): string {
  const { datasetSummary, programObjectives, donorFramework } = input;

  const varList = Object.entries(datasetSummary.variableTypes)
    .map(([col, type]) => `  ${col} [${type}]`)
    .join('\n');

  const categoricalSummary = Object.entries(datasetSummary.categoricalGroupings)
    .slice(0, 10)
    .map(([col, vals]) => `  ${col}: ${vals.join(', ')}`)
    .join('\n');

  return `Program objectives:
${programObjectives.map((o, i) => `  ${i + 1}. ${o}`).join('\n')}

Donor framework: ${donorFramework ?? 'not specified'}

Dataset variables:
${varList}

Categorical value groupings:
${categoricalSummary || '  None'}

Suggested outcome columns: ${datasetSummary.suggestedOutcome.join(', ') || 'not identified'}
Missing data flags: ${datasetSummary.missingDataFlags.length} columns affected

Identify candidate M&E indicators derivable from this dataset, suggest formulas, targets,
and dashboard configuration. Align with the specified donor framework where applicable.`;
}

export async function runIndicatorDetection(
  input: IndicatorDetectionInput,
): Promise<IndicatorDetectionOutput> {
  const response = await callLLM({
    system: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(input),
    jsonMode: true,
    maxTokens: 2048,
  });

  const raw = response.json ?? {};

  const candidateIndicators = (raw.candidateIndicators as IndicatorCandidate[]) ?? [];
  const suggestedTargets = (raw.suggestedTargets as Record<string, number>) ?? {};
  const alignedFrameworkIndicators = (raw.alignedFrameworkIndicators as string[]) ?? [];
  const dashboardConfig = (raw.dashboardConfig as IndicatorDashboardConfig) ?? {
    primaryIndicators: candidateIndicators.slice(0, 3).map((i) => i.name),
    trackingFrequency: 'quarterly',
    visualizationType: 'target-vs-actual',
    alertThresholds: {},
  };
  const warnings = (raw.warnings as string[]) ?? [];
  const confidence =
    (raw.confidence as IndicatorDetectionOutput['confidence']) ??
    deriveConfidence(warnings);

  const structured = {
    candidateIndicators,
    suggestedTargets,
    alignedFrameworkIndicators,
    dashboardConfig,
  };

  const formatted = [
    `## Candidate Indicators (${candidateIndicators.length} found)`,
    ...candidateIndicators.map(
      (c) =>
        `\n### ${c.name}\n- **Formula:** \`${c.formula}\`\n- **Source columns:** ${c.sourceColumns.join(', ')}\n- **Rationale:** ${c.rationale}`,
    ),
    alignedFrameworkIndicators.length
      ? `\n## Framework Alignment\n${alignedFrameworkIndicators.map((a) => `- ${a}`).join('\n')}`
      : '',
    warnings.length
      ? `\n## Warnings\n${warnings.map((w) => `- ⚠️ ${w}`).join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    structured,
    formatted,
    confidence,
    warnings,
    candidateIndicators,
    suggestedTargets,
    alignedFrameworkIndicators,
    dashboardConfig,
  };
}

export function indicatorDetectionHash(input: IndicatorDetectionInput): string {
  return hashInput({
    columnNames: Object.keys(input.datasetSummary.variableTypes).sort(),
    programObjectives: input.programObjectives,
    donorFramework: input.donorFramework,
  });
}
