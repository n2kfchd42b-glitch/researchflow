import React, { useState } from 'react';
import { FileUploader } from '../../../packages/ui';
import { uploadDataset } from '../../../packages/api';

interface FieldDataImporterProps {
  onUpload: (file: File, detected: any) => void;
}

const detectFieldDataFormat = (columns: string[], sheets?: string[]) => {
  const detections: any[] = [];
  // KoboToolbox
  if (columns.some(c => c.includes('_uuid') || c.includes('_submission_time') || c.includes('_index') || c.includes('formhub/uuid')) || columns.some(c => c.includes('/'))) {
    detections.push({ type: 'kobo', message: 'KoboToolbox export detected', action: 'Flatten grouped column names' });
  }
  // ODK
  if (columns.some(c => c === 'meta-instanceID' || c === 'KEY' || c === 'SubmissionDate' || c === 'start' || c === 'end')) {
    detections.push({ type: 'odk', message: 'ODK/ODK Collect export detected', action: 'Drop meta columns, parse date fields' });
  }
  // Excel survey template
  if (sheets && sheets.length > 1) {
    detections.push({ type: 'excel', message: 'Survey template detected — headers may not be in row 1', action: 'Select header row' });
  }
  // GPS fields
  const gpsCols = columns.filter(c => /latitude|longitude|lat|lon|lng|gps|_gps_latitude|_gps_longitude|geo_point/i.test(c));
  if (gpsCols.length) {
    detections.push({ type: 'gps', message: `GPS coordinates detected in: ${gpsCols.join(', ')}`, action: 'Auto-tag as location' });
  }
  // Multi-select fields
  const multiCols = columns.filter(c => c.includes('select_multiple_'));
  if (multiCols.length) {
    detections.push({ type: 'multi', message: `Multi-select fields detected: ${multiCols.join(', ')}`, action: 'Split into binary columns' });
  }
  return detections;
};

const FieldDataImporter: React.FC<FieldDataImporterProps> = ({ onUpload }) => {
  const [detections, setDetections] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const handleUpload = async (file: File) => {
    // Use consolidated uploadDataset from packages/api
    await uploadDataset(file, 'ngo');
    // Mock: parse columns from file name hints (real impl would read response)
    const columns = ['_uuid', 'latitude', 'gender', 'select_multiple_symptoms'];
    const sheets = ['Sheet1'];
    const detected = detectFieldDataFormat(columns, sheets);
    setDetections(detected);
    onUpload(file, detected);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Shared FileUploader replaces raw <input type="file"> */}
      <FileUploader
        context="ngo"
        acceptedTypes={['.csv', '.xlsx']}
        maxSizeMB={50}
        onUpload={handleUpload}
        label="Import field data"
        hint="Supports KoboToolbox, ODK, and standard CSV/Excel exports"
      />
      {detections.length > 0 && (
        <div style={{ marginTop: 12, background: '#F8F9F9', borderRadius: 8, padding: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#1C2B3A', marginBottom: 8 }}>Import Intelligence</div>
          {detections.filter((_, idx) => !dismissed.has(idx)).map((d, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ marginRight: 8 }}>{d.type === 'kobo' ? '🟢' : d.type === 'odk' ? '🟡' : d.type === 'excel' ? '📄' : d.type === 'gps' ? '📍' : '🔀'}</span>
              <span style={{ color: '#2E86C1', fontWeight: 500 }}>{d.message}</span>
              <button style={{ marginLeft: 12, background: '#5A8A6A', color: '#fff', borderRadius: 4, border: 'none', padding: '2px 8px', fontSize: 13 }}>{d.action}</button>
              <button style={{ marginLeft: 8, background: '#e0e0e0', color: '#1C2B3A', borderRadius: 4, border: 'none', padding: '2px 8px', fontSize: 13 }} onClick={() => setDismissed(prev => new Set(Array.from(prev).concat([idx])))}>Dismiss</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FieldDataImporter;
