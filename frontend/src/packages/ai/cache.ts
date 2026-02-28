// ─── ResearchFlow AI Output Cache ─────────────────────────────────────────────
// Stores AI outputs keyed by (moduleId, studyId).
// Outputs are only re-generated when the source data hash changes.
//
// This is an in-memory + localStorage store for the frontend.
// Backend persistence goes through projectContext.setAIOutput() on the API layer.

import type { AIModuleId, AIModuleOutput, CachedAIOutput } from './types';

const STORAGE_PREFIX = 'rf_ai_';

// ─── In-memory layer (fastest) ────────────────────────────────────────────────

const memoryCache = new Map<string, CachedAIOutput>();

function cacheKey(moduleId: AIModuleId, studyId: string): string {
  return `${moduleId}::${studyId}`;
}

// ─── localStorage layer (persists across page reload) ─────────────────────────

function readFromStorage<T extends AIModuleOutput>(
  key: string,
): CachedAIOutput<T> | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as CachedAIOutput<T>;
  } catch {
    return null;
  }
}

function writeToStorage(key: string, entry: CachedAIOutput): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Quota exceeded or private browsing — silently skip persistence
  }
}

function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // ignore
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Retrieve a cached output. Returns null if not cached or if the source data
 * hash has changed (meaning the data was updated and the cache is stale).
 */
export function getCached<T extends AIModuleOutput>(
  moduleId: AIModuleId,
  studyId: string,
  currentSourceHash: string,
): CachedAIOutput<T> | null {
  const key = cacheKey(moduleId, studyId);

  // 1. Check memory first
  let entry = memoryCache.get(key) as CachedAIOutput<T> | undefined;

  // 2. Fall back to localStorage
  if (!entry) {
    const stored = readFromStorage<T>(key);
    if (stored) {
      memoryCache.set(key, stored);
      entry = stored;
    }
  }

  if (!entry) return null;

  // Invalidate if source data changed
  if (entry.sourceHash !== currentSourceHash) {
    memoryCache.delete(key);
    removeFromStorage(key);
    return null;
  }

  return entry;
}

/**
 * Store an AI output. Call this immediately after every successful module run.
 */
export function setCached<T extends AIModuleOutput>(
  moduleId: AIModuleId,
  studyId: string,
  output: T,
  sourceHash: string,
): CachedAIOutput<T> {
  const key = cacheKey(moduleId, studyId);
  const entry: CachedAIOutput<T> = {
    moduleId,
    studyId,
    output,
    generatedAt: new Date().toISOString(),
    sourceHash,
  };
  memoryCache.set(key, entry);
  writeToStorage(key, entry);
  return entry;
}

/**
 * Manually invalidate a cached output (e.g., user explicitly requests re-run).
 */
export function invalidateCache(moduleId: AIModuleId, studyId: string): void {
  const key = cacheKey(moduleId, studyId);
  memoryCache.delete(key);
  removeFromStorage(key);
}

/**
 * Invalidate all cached outputs for a study (e.g., dataset replaced).
 */
export function invalidateStudyCache(studyId: string): void {
  const prefix = `::${studyId}`;
  for (const key of Array.from(memoryCache.keys())) {
    if (key.endsWith(prefix)) {
      memoryCache.delete(key);
      removeFromStorage(key);
    }
  }
  // Also scan localStorage for any entries not yet in memory
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const lsKey = localStorage.key(i);
      if (lsKey?.startsWith(STORAGE_PREFIX) && lsKey.endsWith(prefix)) {
        localStorage.removeItem(lsKey);
      }
    }
  } catch {
    // ignore
  }
}
