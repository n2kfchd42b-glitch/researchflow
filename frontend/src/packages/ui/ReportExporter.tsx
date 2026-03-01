import React, { useState } from 'react';
import { Download, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { ProductContext } from './theme';
import { API_URL } from '../../config';

export type ExportFormat = 'pdf' | 'docx' | 'csv' | 'json' | 'xlsx';

export interface ReportExporterProps {
  context: ProductContext;
  formats: ExportFormat[];
  payload: Record<string, unknown>;
  templateId: string;
  /** Override the default download handler */
  onExport?: (format: ExportFormat, payload: Record<string, unknown>, templateId: string) => Promise<void>;
  label?: string;
  disabled?: boolean;
}

type ExportState = 'idle' | 'exporting' | 'success' | 'error';

const FORMAT_LABELS: Record<ExportFormat, string> = {
  pdf:  'PDF',
  docx: 'Word (DOCX)',
  csv:  'CSV',
  json: 'JSON',
  xlsx: 'Excel (XLSX)',
};

const FORMAT_ICONS: Record<ExportFormat, string> = {
  pdf:  '📄',
  docx: '📝',
  csv:  '📊',
  json: '📋',
  xlsx: '📊',
};

async function defaultExport(
  format: ExportFormat,
  payload: Record<string, unknown>,
  templateId: string,
) {
  const res = await fetch(`${API_URL}/generate-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format, templateId, context: payload.context ?? 'student', ...payload }),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Export failed'));
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${templateId}_report.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportExporter({
  context,
  formats,
  payload,
  templateId,
  onExport,
  label = 'Export Report',
  disabled = false,
}: ReportExporterProps) {
  const [state, setState] = useState<ExportState>('idle');
  const [activeFormat, setActiveFormat] = useState<ExportFormat | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleExport = async (format: ExportFormat) => {
    if (disabled || state === 'exporting') return;
    setState('exporting');
    setActiveFormat(format);
    setErrorMsg('');
    try {
      await (onExport ?? defaultExport)(format, payload, templateId);
      setState('success');
      setTimeout(() => setState('idle'), 2500);
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Export failed');
      setState('error');
      setTimeout(() => setState('idle'), 4000);
    }
  };

  return (
    <div>
      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
        {label}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {formats.map(format => {
          const isActive = activeFormat === format && state !== 'idle';
          return (
            <button
              key={format}
              onClick={() => handleExport(format)}
              disabled={disabled || state === 'exporting'}
              aria-label={`Export as ${FORMAT_LABELS[format]}`}
              aria-busy={isActive && state === 'exporting'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1rem',
                background: isActive && state === 'success' ? '#E9F7EF'
                          : isActive && state === 'error'   ? '#FDEDEC'
                          : '#F3F4F6',
                border: `1px solid ${
                  isActive && state === 'success' ? '#5A8A6A'
                : isActive && state === 'error'   ? '#E74C3C'
                : '#E5E7EB'}`,
                borderRadius: 8,
                cursor: disabled || state === 'exporting' ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: isActive && state === 'success' ? '#1E8449'
                     : isActive && state === 'error'   ? '#A93226'
                     : '#374151',
                opacity: disabled ? 0.6 : 1,
                transition: 'all 0.15s',
              }}
            >
              {isActive && state === 'exporting' ? (
                <Loader size={13} aria-hidden="true" style={{ animation: 'spin 0.8s linear infinite' }} />
              ) : isActive && state === 'success' ? (
                <CheckCircle size={13} aria-hidden="true" />
              ) : isActive && state === 'error' ? (
                <AlertCircle size={13} aria-hidden="true" />
              ) : (
                <Download size={13} aria-hidden="true" />
              )}
              {FORMAT_ICONS[format]} {FORMAT_LABELS[format]}
            </button>
          );
        })}
      </div>

      {state === 'error' && errorMsg && (
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: '#A93226' }}>
          {errorMsg}
        </p>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default ReportExporter;
