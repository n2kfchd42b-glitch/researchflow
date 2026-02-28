import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { ProductContext, getTheme } from './theme';

export interface UploadedFile {
  file: File;
  name: string;
  sizeLabel: string;
}

export interface FileUploaderProps {
  context: ProductContext;
  acceptedTypes?: string[];   // e.g. ['.csv', '.xlsx']
  maxSizeMB?: number;
  onUpload: (file: File) => Promise<void>;
  label?: string;
  hint?: string;
  disabled?: boolean;
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

function formatBytes(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

export function FileUploader({
  context,
  acceptedTypes = ['.csv', '.xlsx', '.xls'],
  maxSizeMB = 50,
  onUpload,
  label = 'Upload file',
  hint,
  disabled = false,
}: FileUploaderProps) {
  const theme = getTheme(context);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const validateFile = useCallback((file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(ext)) {
      return `File type not allowed. Accepted: ${acceptedTypes.join(', ')}`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File too large. Maximum size: ${maxSizeMB} MB`;
    }
    return null;
  }, [acceptedTypes, maxSizeMB]);

  const processFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      setUploadState('error');
      return;
    }

    setUploadState('uploading');
    setProgress(0);
    setErrorMessage('');

    // Simulate progress while actual upload runs
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 12, 85));
    }, 150);

    try {
      await onUpload(file);
      clearInterval(interval);
      setProgress(100);
      setUploadedFile({ file, name: file.name, sizeLabel: formatBytes(file.size) });
      setUploadState('success');
    } catch (err: any) {
      clearInterval(interval);
      setErrorMessage(err?.message ?? 'Upload failed. Please try again.');
      setUploadState('error');
      setProgress(0);
    }
  }, [onUpload, validateFile]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleRetry = () => {
    setUploadState('idle');
    setErrorMessage('');
    setProgress(0);
    inputRef.current?.click();
  };

  const handleReplace = () => {
    setUploadState('idle');
    setUploadedFile(null);
    setProgress(0);
    setErrorMessage('');
    inputRef.current?.click();
  };

  const accept = acceptedTypes.join(',');

  // ── Uploaded state ───────────────────────────────────────────────────────────
  if (uploadState === 'success' && uploadedFile) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        background: 'white',
        border: `1px solid ${theme.accent}40`,
        borderRadius: 10,
        padding: '0.85rem 1rem',
      }}>
        <CheckCircle size={22} color={theme.accent} aria-hidden="true" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: '#1C2B3A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {uploadedFile.name}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{uploadedFile.sizeLabel}</div>
        </div>
        <button
          onClick={handleReplace}
          aria-label="Replace file"
          style={{
            background: 'none',
            border: '1px solid #D1D5DB',
            borderRadius: 6,
            padding: '0.3rem 0.7rem',
            cursor: 'pointer',
            fontSize: '0.8rem',
            color: '#6B7280',
          }}
        >
          Replace
        </button>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (uploadState === 'error') {
    return (
      <div style={{
        background: '#FDEDEC',
        border: '1px solid #FADBD8',
        borderRadius: 10,
        padding: '0.85rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <AlertCircle size={20} color="#A93226" aria-hidden="true" />
        <div style={{ flex: 1, fontSize: '0.875rem', color: '#A93226' }}>
          {errorMessage}
        </div>
        <button
          onClick={handleRetry}
          aria-label="Retry upload"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            background: '#A93226',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            padding: '0.35rem 0.75rem',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          <RefreshCw size={12} aria-hidden="true" /> Retry
        </button>
      </div>
    );
  }

  // ── Uploading state ──────────────────────────────────────────────────────────
  if (uploadState === 'uploading') {
    return (
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '1.25rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <FileText size={16} color={theme.accent} aria-hidden="true" />
          <span style={{ fontSize: '0.85rem', color: '#374151' }}>Uploading… {progress}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Upload progress"
          style={{
            height: 6,
            background: '#E5E7EB',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: theme.accent,
            borderRadius: 3,
            transition: 'width 0.15s',
          }} />
        </div>
      </div>
    );
  }

  // ── Idle drop zone ───────────────────────────────────────────────────────────
  return (
    <div
      role="button"
      tabIndex={disabled ? undefined : 0}
      aria-label={`${label}. Drag and drop or click to browse. Accepted file types: ${acceptedTypes.join(', ')}. Maximum size: ${maxSizeMB} MB`}
      aria-disabled={disabled}
      onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && !disabled && inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? theme.accent : '#D1D5DB'}`,
        borderRadius: 10,
        padding: '2rem 1.5rem',
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: dragging ? theme.accentBg : '#FAFAFA',
        transition: 'all 0.2s',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleChange}
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
      />
      <Upload size={32} color={theme.accent} aria-hidden="true" style={{ marginBottom: '0.5rem' }} />
      <div style={{ fontWeight: 600, color: '#1C2B3A', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '0.82rem', color: '#6B7280' }}>
        {hint || `Drag & drop or click to browse · ${acceptedTypes.join(', ')} · max ${maxSizeMB} MB`}
      </div>
    </div>
  );
}

export default FileUploader;
