// ─── ResearchFlow Shared API Service ─────────────────────────────────────────
// Single source of truth for all backend calls.
// All three product frontends (Student, NGO, Journal) import from here.
//
// Consolidated endpoints:
//  1. uploadDataset    → POST /upload            (previously duplicated across products)
//  2. runAnalysis      → POST /run-analysis       (single endpoint with studyType + context)
//  3. generateReport   → POST /generate-report    (single endpoint with templateId + context)
//  4. exportAudit      → POST /export-audit       (single reproducibility/audit package)

import type { ProductContext } from '../ui/theme';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

// ─── 1. Dataset Upload ────────────────────────────────────────────────────────

export interface UploadResult {
  dataset_id: string;
  rows: number;
  columns: number;
  column_types: Record<string, string>;
  missing_percentage: Record<string, number>;
  numeric_summary: Record<string, { unique: number; mean?: number; std?: number }>;
  [key: string]: unknown;
}

/**
 * Upload a dataset file. The `context` param routes to the correct storage
 * bucket on the backend (student → academia, ngo → program-data, journal → submissions).
 */
export async function uploadDataset(
  file: File,
  context: ProductContext = 'student',
): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('context', context);
  const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Upload failed'));
  return res.json();
}

// ─── 2. Analysis Execution ────────────────────────────────────────────────────

export interface RunAnalysisParams {
  datasetId: string;
  studyType: string;
  context: ProductContext;
  outcomeVariable?: string;
  exposureVariable?: string;
  covariates?: string[];
  [key: string]: unknown;
}

export interface AnalysisResult {
  analysisId: string;
  type: string;
  title: string;
  summary: string;
  tables?: unknown[];
  figures?: unknown[];
  interpretation?: string;
  [key: string]: unknown;
}

/**
 * Run a statistical analysis. Single endpoint regardless of product context.
 */
export async function runAnalysis(params: RunAnalysisParams): Promise<AnalysisResult> {
  const res = await fetch(`${API_URL}/run-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Analysis failed'));
  return res.json();
}

// ─── 3. Report Generation ─────────────────────────────────────────────────────

export interface GenerateReportParams {
  templateId: string;
  context: ProductContext;
  format?: 'pdf' | 'docx' | 'csv' | 'json' | 'xlsx';
  [key: string]: unknown;
}

/**
 * Generate a report. `templateId` selects the template; `context` applies
 * product-specific styling and section logic on the backend.
 *
 * Returns a Blob (file download).
 */
export async function generateReport(params: GenerateReportParams): Promise<Blob> {
  const res = await fetch(`${API_URL}/generate-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Report generation failed'));
  return res.blob();
}

/**
 * Convenience helper: generate and trigger browser download.
 */
export async function downloadReport(
  params: GenerateReportParams,
  filename?: string,
): Promise<void> {
  const blob = await generateReport(params);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `${params.templateId}_report.${params.format ?? 'pdf'}`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── 4. Audit / Reproducibility Package ─────────────────────────────────────

export interface ExportAuditParams {
  studyId?: string;
  submissionId?: string;
  context: ProductContext;
  format?: 'json' | 'csv' | 'zip';
}

/**
 * Export a reproducibility / audit package. Routes to the correct data source
 * depending on context: student studies, NGO programs, or journal submissions.
 */
export async function exportAudit(params: ExportAuditParams): Promise<Blob> {
  const res = await fetch(`${API_URL}/export-audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Audit export failed'));
  return res.blob();
}

// ─── Legacy re-exports (backwards compat while products migrate) ──────────────
// These wrap the old api.ts functions so existing callers keep working.

export { api, methodologyApi, cohortApi, survivalApi } from '../../services/api';
