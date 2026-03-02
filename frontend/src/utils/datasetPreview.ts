type PreviewRow = Record<string, unknown>;

function percentile(sortedValues: number[], p: number): number {
  if (!sortedValues.length) return 0;
  const idx = Math.min(sortedValues.length - 1, Math.max(0, Math.floor(sortedValues.length * p)));
  return sortedValues[idx];
}

export function previewToUploadResult(preview: any) {
  const headers: string[] = (preview?.headers || []).map((h: unknown) => String(h));
  const rows: PreviewRow[] = (preview?.rows || []).map((row: PreviewRow) => {
    const normalized: PreviewRow = {};
    headers.forEach((header) => {
      normalized[header] = row?.[header] ?? '';
    });
    return normalized;
  });

  const rowCount = rows.length;
  const column_types: Record<string, string> = preview?.column_types || {};
  const missing_percentage: Record<string, number> = {};
  const numeric_summary: Record<string, { mean: number; std: number; min: number; median: number; max: number; unique: number }> = {};

  headers.forEach((header) => {
    const values = rows.map((r) => (r[header] == null ? '' : String(r[header]).trim()));
    const nonMissing = values.filter((v) => v !== '' && v.toLowerCase() !== 'na' && v.toLowerCase() !== 'null');
    missing_percentage[header] = rowCount > 0 ? Math.round(((rowCount - nonMissing.length) / rowCount) * 1000) / 10 : 0;

    const numericVals = nonMissing
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v));

    if (numericVals.length > 0 && numericVals.length / Math.max(nonMissing.length, 1) > 0.8) {
      const sorted = [...numericVals].sort((a, b) => a - b);
      const mean = numericVals.reduce((sum, n) => sum + n, 0) / numericVals.length;
      const variance = numericVals.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numericVals.length;
      numeric_summary[header] = {
        mean: Math.round(mean * 100) / 100,
        std: Math.round(Math.sqrt(variance) * 100) / 100,
        min: Math.round(sorted[0] * 100) / 100,
        median: Math.round(percentile(sorted, 0.5) * 100) / 100,
        max: Math.round(sorted[sorted.length - 1] * 100) / 100,
        unique: new Set(nonMissing).size,
      };
      if (!column_types[header]) {
        column_types[header] = 'clinical_continuous';
      }
    } else if (!column_types[header]) {
      column_types[header] = 'demographic_categorical';
    }
  });

  return {
    dataset_id: preview?.dataset_id,
    filename: preview?.filename,
    rows: rowCount,
    columns: headers.length,
    column_types,
    missing_percentage,
    numeric_summary,
    issues: [],
  };
}
