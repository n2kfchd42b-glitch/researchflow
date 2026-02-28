// ─── ResearchFlow AI Client ───────────────────────────────────────────────────
// Single entry point for all LLM calls.
// UI components and route handlers must NEVER import this file directly.
// All calls must go through service functions in src/services/ai-service.ts.
//
// Call chain:
//   User action → UI dispatches intent
//   → Service function (src/services/ai-service.ts)
//   → Module (packages/ai/modules/*.ts)
//   → client.callLLM()
//   → Anthropic Messages API
//   → Result stored via cache
//   → UI reads from store

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 4096;

export interface LLMCallOptions {
  system: string;
  userPrompt: string;
  maxTokens?: number;
  /** When true, client expects the model to return valid JSON. */
  jsonMode?: boolean;
}

export interface LLMResponse {
  text: string;
  /** Parsed JSON when jsonMode was true and parsing succeeded. */
  json?: Record<string, unknown>;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Make a single-turn call to the Anthropic Messages API.
 *
 * Reads REACT_APP_ANTHROPIC_API_KEY from the environment.
 * Throws if the key is missing or the request fails.
 *
 * @internal — Call via service functions, never directly from components.
 */
export async function callLLM(options: LLMCallOptions): Promise<LLMResponse> {
  const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'REACT_APP_ANTHROPIC_API_KEY is not set. AI features require a valid API key.',
    );
  }

  const body = {
    model: MODEL,
    max_tokens: options.maxTokens ?? MAX_TOKENS,
    system: options.system,
    messages: [{ role: 'user', content: options.userPrompt }],
  };

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(`AI client error ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? '';

  let json: Record<string, unknown> | undefined;
  if (options.jsonMode) {
    try {
      // Strip markdown code fences if the model wraps the JSON
      const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      json = JSON.parse(cleaned);
    } catch {
      // Non-fatal — caller can check json === undefined and fall back to text
    }
  }

  return {
    text,
    json,
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
  };
}

/**
 * Derive a deterministic confidence rating from a reproducibility score or
 * presence of warnings. Used by modules that don't have a direct confidence signal.
 */
export function deriveConfidence(
  warnings: string[],
  scoreOrHeuristic?: number,
): 'high' | 'medium' | 'low' {
  if (scoreOrHeuristic !== undefined) {
    if (scoreOrHeuristic >= 80) return 'high';
    if (scoreOrHeuristic >= 50) return 'medium';
    return 'low';
  }
  if (warnings.length === 0) return 'high';
  if (warnings.length <= 2) return 'medium';
  return 'low';
}

/**
 * Build a lightweight hash of an input object for cache invalidation.
 * Not cryptographic — used only to detect data changes.
 */
export function hashInput(input: unknown): string {
  const str = JSON.stringify(input);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
