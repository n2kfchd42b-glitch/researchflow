import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Plus, Trash2, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useJournal, Author, ReportedAnalysis } from '../context/JournalContext';
import IntakeStepIndicator from '../components/IntakeStepIndicator';

const JOURNAL_PRIMARY = '#7D3C98';

// ─── Types ────────────────────────────────────────────────────────────────────

type AnalysisType = ReportedAnalysis['type'];
type Priority = 'normal' | 'high' | 'urgent';

const ANALYSIS_TYPES: { value: AnalysisType; label: string }[] = [
  { value: 'table1', label: 'Table 1 (Descriptive)' },
  { value: 'regression', label: 'Logistic/Linear Regression' },
  { value: 'survival', label: 'Cox/Survival Analysis' },
  { value: 'meta-analysis', label: 'Meta-Analysis' },
  { value: 'subgroup', label: 'Subgroup Analysis' },
  { value: 'sensitivity', label: 'Sensitivity Analysis' },
  { value: 'psm', label: 'Propensity Score Matching' },
  { value: 'descriptive', label: 'Descriptive Statistics' },
  { value: 'forest-plot', label: 'Forest Plot' },
  { value: 'other', label: 'Other' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}

async function computeHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function detectAnalysisType(text: string): AnalysisType {
  const t = text.toLowerCase();
  if (t.includes('propensity') || t.includes('psm')) return 'psm';
  if (t.includes('meta-analysis') || t.includes('meta analysis') || t.includes('forest plot')) return 'meta-analysis';
  if (t.includes('cox') || t.includes('kaplan') || t.includes('survival') || t.includes('hazard ratio')) return 'survival';
  if (t.includes('logistic') || t.includes('odds ratio') || t.includes('regression') || t.includes('linear regression')) return 'regression';
  if (t.includes('subgroup')) return 'subgroup';
  if (t.includes('sensitivity')) return 'sensitivity';
  if (t.includes('table 1') || t.includes('table1') || t.includes('baseline characteristics')) return 'table1';
  if (t.includes('chi-square') || t.includes('anova') || t.includes('t-test') || t.includes('descriptive')) return 'descriptive';
  return 'other';
}

function extractAnalysesFromText(text: string): ReportedAnalysis[] {
  const analyses: ReportedAnalysis[] = [];
  const lines = text.split('\n').filter(l => l.trim());

  const keywords = [
    'logistic regression', 'cox regression', 'kaplan-meier', 'odds ratio', 'hazard ratio',
    'relative risk', 'chi-square', 't-test', 'anova', 'meta-analysis', 'forest plot',
    'propensity score', 'sensitivity analysis', 'subgroup analysis', 'table 1', 'table1',
    'baseline characteristics', 'survival analysis', 'linear regression',
  ];
  const tableRef = /\b(table|figure|fig\.?)\s*(\d+[a-z]?)/gi;

  const seen = new Set<string>();
  for (const line of lines) {
    const lower = line.toLowerCase();
    const matched = keywords.find(kw => lower.includes(kw));
    if (!matched) continue;

    const key = matched;
    if (seen.has(key)) continue;
    seen.add(key);

    const refs: string[] = [];
    let m: RegExpExecArray | null;
    const re = new RegExp(tableRef.source, 'gi');
    while ((m = re.exec(line)) !== null) refs.push(m[0]);

    analyses.push({
      id: generateId(),
      type: detectAnalysisType(line),
      description: line.trim().slice(0, 200),
      reportedResults: '',
      tableOrFigureRef: refs.join(', '),
      pageNumber: null,
      parameters: {},
      status: 'pending',
    });
  }
  return analyses;
}

// ─── Shared input style ───────────────────────────────────────────────────────

const inputStyle = (hasError = false): React.CSSProperties => ({
  width: '100%',
  padding: '0.55rem 0.75rem',
  border: `1px solid ${hasError ? '#EF4444' : '#D1D5DB'}`,
  borderRadius: 8,
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
});

// ─── Step 1: Manuscript Info ──────────────────────────────────────────────────

interface Step1Data {
  manuscriptId: string;
  title: string;
  authors: Author[];
  journal: string;
  submissionDate: string;
  studyType: string;
  priority: Priority;
}

function Step1({ data, onChange, errors }: {
  data: Step1Data;
  onChange: (d: Step1Data) => void;
  errors: Record<string, string>;
}) {
  const updateAuthor = (idx: number, field: keyof Author, value: any) => {
    const authors = data.authors.map((a, i) => i === idx ? { ...a, [field]: value } : a);
    onChange({ ...data, authors });
  };

  const addAuthor = () => onChange({ ...data, authors: [...data.authors, { name: '', affiliation: '', email: '', isCorresponding: false }] });
  const removeAuthor = (idx: number) => onChange({ ...data, authors: data.authors.filter((_, i) => i !== idx) });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Manuscript ID *</label>
          <input value={data.manuscriptId} onChange={e => onChange({ ...data, manuscriptId: e.target.value })} style={inputStyle(!!errors.manuscriptId)} placeholder="e.g. MS-2024-0042" />
          {errors.manuscriptId && <span style={{ fontSize: '0.72rem', color: '#EF4444' }}>{errors.manuscriptId}</span>}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Journal</label>
          <input value={data.journal} onChange={e => onChange({ ...data, journal: e.target.value })} style={inputStyle()} placeholder="Journal name" />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Title *</label>
        <input value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} style={inputStyle(!!errors.title)} placeholder="Full manuscript title" />
        {errors.title && <span style={{ fontSize: '0.72rem', color: '#EF4444' }}>{errors.title}</span>}
      </div>

      {/* Authors */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Authors</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {data.authors.map((author, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', gap: '0.5rem', alignItems: 'center' }}>
              <input value={author.name} onChange={e => updateAuthor(idx, 'name', e.target.value)} style={{ ...inputStyle(), fontSize: '0.82rem', padding: '0.4rem 0.6rem' }} placeholder="Name *" />
              <input value={author.affiliation} onChange={e => updateAuthor(idx, 'affiliation', e.target.value)} style={{ ...inputStyle(), fontSize: '0.82rem', padding: '0.4rem 0.6rem' }} placeholder="Affiliation" />
              <input value={author.email} onChange={e => updateAuthor(idx, 'email', e.target.value)} style={{ ...inputStyle(), fontSize: '0.82rem', padding: '0.4rem 0.6rem' }} type="email" placeholder="Email" />
              <label title="Corresponding" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', cursor: 'pointer', fontSize: '0.75rem', color: '#6B7280', whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={author.isCorresponding} onChange={e => updateAuthor(idx, 'isCorresponding', e.target.checked)} />
                Corr.
              </label>
              <button onClick={() => removeAuthor(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button onClick={addAuthor} style={{ alignSelf: 'flex-start', background: 'none', border: '1px dashed #D1D5DB', borderRadius: 6, padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.78rem', color: '#6B7280' }}>
            <Plus size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />Add Author
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Submission Date</label>
          <input type="date" value={data.submissionDate} onChange={e => onChange({ ...data, submissionDate: e.target.value })} style={inputStyle()} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Study Type</label>
          <select value={data.studyType} onChange={e => onChange({ ...data, studyType: e.target.value })} style={{ ...inputStyle(), background: 'white', cursor: 'pointer' }}>
            <option value="">Select...</option>
            <option value="rct">RCT</option>
            <option value="cohort">Cohort</option>
            <option value="cross-sectional">Cross-Sectional</option>
            <option value="case-control">Case-Control</option>
            <option value="systematic-review">Systematic Review</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Priority</label>
          <select value={data.priority} onChange={e => onChange({ ...data, priority: e.target.value as Priority })} style={{ ...inputStyle(), background: 'white', cursor: 'pointer' }}>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Dataset Upload ───────────────────────────────────────────────────

interface DatasetInfo {
  fileName: string;
  fileSize: number;
  hash: string;
  authorHash: string;
  hashMatch: boolean | null;
  pending: boolean;
}

function Step2({ dataset, setDataset }: { dataset: DatasetInfo | null; setDataset: (d: DatasetInfo | null) => void }) {
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState(false);
  const [authorHash, setAuthorHash] = useState('');
  const [hashChecked, setHashChecked] = useState(false);

  const processFile = useCallback(async (file: File) => {
    const text = await file.text();
    const hash = await computeHash(text);
    setDataset({
      fileName: file.name,
      fileSize: file.size,
      hash,
      authorHash: '',
      hashMatch: null,
      pending: false,
    });
  }, [setDataset]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const verifyHash = () => {
    if (!dataset || !authorHash) return;
    setDataset({ ...dataset, authorHash, hashMatch: dataset.hash.toLowerCase() === authorHash.toLowerCase() });
    setHashChecked(true);
  };

  const togglePending = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setPending(true);
      setDataset({ fileName: '', fileSize: 0, hash: '', authorHash: '', hashMatch: null, pending: true });
    } else {
      setPending(false);
      setDataset(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Upload zone */}
      {!dataset?.pending && !dataset?.fileName && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragging ? JOURNAL_PRIMARY : '#D1D5DB'}`,
            borderRadius: 12,
            padding: '3rem 2rem',
            textAlign: 'center',
            background: dragging ? '#F5EEF8' : '#FAFAFA',
            transition: 'all 0.2s',
            cursor: 'pointer',
          }}
          onClick={() => document.getElementById('dataset-file-input')?.click()}
        >
          <Upload size={36} color={dragging ? JOURNAL_PRIMARY : '#9CA3AF'} style={{ marginBottom: '0.75rem' }} />
          <p style={{ margin: 0, fontWeight: 600, color: '#374151', fontSize: '0.95rem' }}>Drop dataset file here</p>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: '#9CA3AF' }}>Accepts .csv, .xlsx, .xls</p>
          <input id="dataset-file-input" type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      )}

      {/* Dataset info */}
      {dataset && !dataset.pending && dataset.fileName && (
        <div style={{ background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 10, padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <FileText size={20} color="#10B981" style={{ marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#065F46' }}>{dataset.fileName}</div>
                <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: 2 }}>{(dataset.fileSize / 1024).toFixed(1)} KB</div>
                <div style={{ fontSize: '0.72rem', color: '#374151', marginTop: 4, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  SHA-256: {dataset.hash}
                </div>
              </div>
            </div>
            <button onClick={() => setDataset(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
              <X size={16} />
            </button>
          </div>

          {/* Hash verification */}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 3 }}>
                Author-reported hash (optional)
              </label>
              <input
                value={authorHash}
                onChange={e => setAuthorHash(e.target.value)}
                style={{ ...inputStyle(), fontFamily: 'monospace', fontSize: '0.78rem' }}
                placeholder="Paste SHA-256 from manuscript/supplementary..."
              />
            </div>
            <button
              onClick={verifyHash}
              disabled={!authorHash}
              style={{ marginTop: '1.4rem', padding: '0.5rem 0.9rem', background: JOURNAL_PRIMARY, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, opacity: authorHash ? 1 : 0.5 }}
            >
              Verify
            </button>
          </div>

          {hashChecked && dataset.hashMatch !== null && (
            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: dataset.hashMatch ? '#065F46' : '#9A3412' }}>
              {dataset.hashMatch ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {dataset.hashMatch ? 'Hash verified — dataset matches author-reported hash.' : 'Hash mismatch — dataset may differ from what the author used.'}
            </div>
          )}
        </div>
      )}

      {/* Pending checkbox */}
      {!dataset?.fileName && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.875rem', color: '#374151' }}>
          <input type="checkbox" checked={pending} onChange={togglePending} />
          Dataset will be provided later — proceed without uploading
        </label>
      )}

      {dataset?.pending && (
        <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#92400E' }}>
          ⚠ Dataset marked as pending. You can upload it later in the Dataset tab of the submission review page.
          <button onClick={() => { setPending(false); setDataset(null); }} style={{ marginLeft: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: '#92400E', textDecoration: 'underline', fontSize: '0.82rem' }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Analyses Extraction ──────────────────────────────────────────────

interface AnalysisFormData {
  id: string;
  type: AnalysisType;
  description: string;
  reportedResults: string;
  tableOrFigureRef: string;
  pageNumber: string;
}

function AnalysisCard({ analysis, onChange, onRemove, idx }: {
  analysis: AnalysisFormData;
  onChange: (a: AnalysisFormData) => void;
  onRemove: () => void;
  idx: number;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', background: '#F9FAFB', cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}
      >
        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>
          #{idx + 1} — {analysis.description.slice(0, 60) || 'New Analysis'}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', background: '#F5EEF8', color: JOURNAL_PRIMARY, padding: '0.15rem 0.5rem', borderRadius: 9999, fontWeight: 600 }}>
            {ANALYSIS_TYPES.find(t => t.value === analysis.type)?.label ?? analysis.type}
          </span>
          <button onClick={e => { e.stopPropagation(); onRemove(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 2 }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: 3 }}>Type</label>
              <select value={analysis.type} onChange={e => onChange({ ...analysis, type: e.target.value as AnalysisType })} style={{ ...inputStyle(), background: 'white', fontSize: '0.82rem', cursor: 'pointer' }}>
                {ANALYSIS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: 3 }}>Table/Figure Ref</label>
              <input value={analysis.tableOrFigureRef} onChange={e => onChange({ ...analysis, tableOrFigureRef: e.target.value })} style={{ ...inputStyle(), fontSize: '0.82rem' }} placeholder="e.g. Table 2" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: 3 }}>Page #</label>
              <input type="number" value={analysis.pageNumber} onChange={e => onChange({ ...analysis, pageNumber: e.target.value })} style={{ ...inputStyle(), fontSize: '0.82rem' }} placeholder="Optional" min={1} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: 3 }}>Description</label>
            <input value={analysis.description} onChange={e => onChange({ ...analysis, description: e.target.value })} style={{ ...inputStyle(), fontSize: '0.82rem' }} placeholder="What does the manuscript say was done?" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: 3 }}>Reported Results (key numbers)</label>
            <textarea value={analysis.reportedResults} onChange={e => onChange({ ...analysis, reportedResults: e.target.value })} rows={2} style={{ ...inputStyle(), resize: 'vertical', fontSize: '0.82rem' }} placeholder="e.g. OR 2.3, 95% CI 1.4–3.8, p=0.001" />
          </div>
        </div>
      )}
    </div>
  );
}

function Step3({ analyses, setAnalyses }: {
  analyses: AnalysisFormData[];
  setAnalyses: (a: AnalysisFormData[]) => void;
}) {
  const [pasteText, setPasteText] = useState('');
  const [extracted, setExtracted] = useState(false);

  const addNew = () => {
    setAnalyses([...analyses, { id: generateId(), type: 'other', description: '', reportedResults: '', tableOrFigureRef: '', pageNumber: '' }]);
  };

  const handleExtract = () => {
    const found = extractAnalysesFromText(pasteText);
    if (found.length > 0) {
      const mapped: AnalysisFormData[] = found.map(a => ({
        id: a.id,
        type: a.type,
        description: a.description,
        reportedResults: a.reportedResults,
        tableOrFigureRef: a.tableOrFigureRef,
        pageNumber: a.pageNumber?.toString() ?? '',
      }));
      setAnalyses([...analyses, ...mapped]);
      setExtracted(true);
      setPasteText('');
    }
  };

  const updateAnalysis = (id: string, updated: AnalysisFormData) => {
    setAnalyses(analyses.map(a => a.id === id ? updated : a));
  };

  const removeAnalysis = (id: string) => {
    setAnalyses(analyses.filter(a => a.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Paste & extract */}
      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '1rem' }}>
        <h3 style={{ margin: '0 0 0.6rem', fontSize: '0.9rem', fontWeight: 700, color: '#374151' }}>
          Extract from Manuscript
        </h3>
        <p style={{ margin: '0 0 0.6rem', fontSize: '0.8rem', color: '#6B7280' }}>
          Paste methods/results sections — the system will detect analysis types automatically.
        </p>
        <textarea
          value={pasteText}
          onChange={e => setPasteText(e.target.value)}
          rows={5}
          style={{ ...inputStyle(), resize: 'vertical', fontSize: '0.82rem', background: 'white' }}
          placeholder="Paste text from manuscript here..."
        />
        <button
          onClick={handleExtract}
          disabled={!pasteText.trim()}
          style={{ marginTop: '0.65rem', padding: '0.5rem 1.1rem', background: pasteText.trim() ? JOURNAL_PRIMARY : '#D1D5DB', color: 'white', border: 'none', borderRadius: 8, cursor: pasteText.trim() ? 'pointer' : 'not-allowed', fontSize: '0.85rem', fontWeight: 600 }}
        >
          Extract Analyses
        </button>
        {extracted && <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>✓ Analyses extracted! Review and edit below.</span>}
      </div>

      {/* Analysis list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {analyses.map((a, idx) => (
          <AnalysisCard
            key={a.id}
            analysis={a}
            idx={idx}
            onChange={updated => updateAnalysis(a.id, updated)}
            onRemove={() => removeAnalysis(a.id)}
          />
        ))}
        <button
          onClick={addNew}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', alignSelf: 'flex-start', background: 'none', border: `1px dashed ${JOURNAL_PRIMARY}`, borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem', color: JOURNAL_PRIMARY, fontWeight: 600 }}
        >
          <Plus size={15} /> Add Analysis Manually
        </button>
      </div>

      {analyses.length === 0 && (
        <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '1.5rem', fontSize: '0.875rem', border: '1px dashed #E5E7EB', borderRadius: 10 }}>
          No analyses added yet. Use "Extract from Manuscript" or "Add Analysis Manually".
        </div>
      )}
    </div>
  );
}

// ─── Step 4: Review & Submit ──────────────────────────────────────────────────

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem', color: done ? '#065F46' : '#374151' }}>
      {done
        ? <CheckCircle size={16} color="#10B981" />
        : <div style={{ width: 16, height: 16, border: '2px solid #D1D5DB', borderRadius: 3 }} />
      }
      {label}
    </div>
  );
}

function Step4({ step1, dataset, analyses, reviewer }: {
  step1: Step1Data;
  dataset: DatasetInfo | null;
  analyses: AnalysisFormData[];
  reviewer: string;
}) {
  const hasManuscriptInfo = !!(step1.manuscriptId && step1.title);
  const hasDataset = !!(dataset?.fileName || dataset?.pending);
  const hasAnalyses = analyses.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '1.25rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: '#1C2B3A' }}>Submission Summary</h3>
        <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.4rem 1rem', fontSize: '0.85rem' }}>
          <dt style={{ fontWeight: 600, color: '#6B7280' }}>Manuscript ID</dt>
          <dd style={{ margin: 0, color: '#1C2B3A' }}>{step1.manuscriptId || '—'}</dd>
          <dt style={{ fontWeight: 600, color: '#6B7280' }}>Title</dt>
          <dd style={{ margin: 0, color: '#1C2B3A' }}>{step1.title || '—'}</dd>
          <dt style={{ fontWeight: 600, color: '#6B7280' }}>Authors</dt>
          <dd style={{ margin: 0, color: '#1C2B3A' }}>{step1.authors.filter(a => a.name).map(a => a.name).join(', ') || '—'}</dd>
          <dt style={{ fontWeight: 600, color: '#6B7280' }}>Journal</dt>
          <dd style={{ margin: 0, color: '#1C2B3A' }}>{step1.journal || '—'}</dd>
          <dt style={{ fontWeight: 600, color: '#6B7280' }}>Study Type</dt>
          <dd style={{ margin: 0, color: '#1C2B3A' }}>{step1.studyType || '—'}</dd>
          <dt style={{ fontWeight: 600, color: '#6B7280' }}>Priority</dt>
          <dd style={{ margin: 0, color: '#1C2B3A', textTransform: 'capitalize' }}>{step1.priority}</dd>
          <dt style={{ fontWeight: 600, color: '#6B7280' }}>Dataset</dt>
          <dd style={{ margin: 0, color: '#1C2B3A' }}>{dataset?.pending ? 'Pending' : dataset?.fileName ? dataset.fileName : 'Not uploaded'}</dd>
          <dt style={{ fontWeight: 600, color: '#6B7280' }}>Analyses</dt>
          <dd style={{ margin: 0, color: '#1C2B3A' }}>{analyses.length} reported analys{analyses.length === 1 ? 'is' : 'es'}</dd>
          <dt style={{ fontWeight: 600, color: '#6B7280' }}>Reviewer</dt>
          <dd style={{ margin: 0, color: '#1C2B3A' }}>{reviewer || 'Not assigned'}</dd>
        </dl>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10, padding: '1.25rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: '#1C2B3A' }}>Submission Checklist</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <CheckItem done={hasManuscriptInfo} label="Manuscript information complete (ID + title required)" />
          <CheckItem done={hasDataset} label="Dataset uploaded or marked as pending" />
          <CheckItem done={hasAnalyses} label="At least one reported analysis cataloged" />
          <CheckItem done={!!reviewer} label="Reviewer assigned (optional)" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SubmissionIntakePage() {
  const { createSubmission, state } = useJournal();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [maxCompleted, setMaxCompleted] = useState(0);

  const [step1, setStep1] = useState<Step1Data>({
    manuscriptId: '',
    title: '',
    authors: [{ name: '', affiliation: '', email: '', isCorresponding: true }],
    journal: state.settings.journalName || '',
    submissionDate: new Date().toISOString().slice(0, 10),
    studyType: '',
    priority: 'normal',
  });
  const [dataset, setDataset] = useState<DatasetInfo | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisFormData[]>([]);
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!step1.manuscriptId.trim()) errors.manuscriptId = 'Required';
    if (!step1.title.trim()) errors.title = 'Required';
    setStep1Errors(errors);
    return Object.keys(errors).length === 0;
  };

  const goToStep = (step: number) => {
    if (step <= maxCompleted + 1) setCurrentStep(step);
  };

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    const next = Math.min(currentStep + 1, 4);
    setMaxCompleted(m => Math.max(m, currentStep));
    setCurrentStep(next);
  };

  const prevStep = () => setCurrentStep(s => Math.max(s - 1, 1));

  const handleSubmit = () => {
    if (!step1.manuscriptId || !step1.title) return;

    const reportedAnalyses: ReportedAnalysis[] = analyses.map(a => ({
      id: a.id,
      type: a.type,
      description: a.description,
      reportedResults: a.reportedResults,
      tableOrFigureRef: a.tableOrFigureRef,
      pageNumber: a.pageNumber ? parseInt(a.pageNumber) : null,
      parameters: {},
      status: 'pending',
    }));

    const id = createSubmission({
      manuscriptId: step1.manuscriptId.trim(),
      title: step1.title.trim(),
      authors: step1.authors.filter(a => a.name.trim()),
      journal: step1.journal.trim(),
      submittedAt: step1.submissionDate ? new Date(step1.submissionDate).toISOString() : new Date().toISOString(),
      studyType: step1.studyType,
      priority: step1.priority,
      reportedAnalyses,
      assignedReviewer: state.settings.defaultReviewerName || null,
    });

    navigate(`/journal/submission/${id}`);
  };

  const btnStyle = (primary?: boolean): React.CSSProperties => ({
    padding: '0.6rem 1.4rem',
    background: primary ? JOURNAL_PRIMARY : '#F3F4F6',
    color: primary ? 'white' : '#374151',
    border: primary ? 'none' : '1px solid #E5E7EB',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 600,
  });

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 0 2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1C2B3A' }}>New Submission Intake</h1>
        <p style={{ margin: '0.3rem 0 0', fontSize: '0.875rem', color: '#6B7280' }}>Enter manuscript details and catalogue reported analyses for verification</p>
      </div>

      {/* Step indicator */}
      <div style={{ marginBottom: '2rem' }}>
        <IntakeStepIndicator currentStep={currentStep} maxCompletedStep={maxCompleted} onStepClick={goToStep} />
      </div>

      {/* Step content */}
      <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E5E7EB', padding: '1.75rem' }}>
        <h2 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 700, color: '#1C2B3A' }}>
          {currentStep === 1 && 'Step 1: Manuscript Information'}
          {currentStep === 2 && 'Step 2: Dataset Upload'}
          {currentStep === 3 && 'Step 3: Reported Analyses'}
          {currentStep === 4 && 'Step 4: Review & Submit'}
        </h2>

        {currentStep === 1 && <Step1 data={step1} onChange={setStep1} errors={step1Errors} />}
        {currentStep === 2 && <Step2 dataset={dataset} setDataset={setDataset} />}
        {currentStep === 3 && <Step3 analyses={analyses} setAnalyses={setAnalyses} />}
        {currentStep === 4 && <Step4 step1={step1} dataset={dataset} analyses={analyses} reviewer={state.settings.defaultReviewerName || ''} />}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem' }}>
        <button onClick={prevStep} disabled={currentStep === 1} style={{ ...btnStyle(), opacity: currentStep === 1 ? 0.4 : 1 }}>
          ← Back
        </button>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => navigate('/journal')} style={btnStyle()}>Cancel</button>
          {currentStep < 4
            ? <button onClick={nextStep} style={btnStyle(true)}>Continue →</button>
            : <button onClick={handleSubmit} style={{ ...btnStyle(true), background: '#065F46' }}>
                <CheckCircle size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Create Submission
              </button>
          }
        </div>
      </div>
    </div>
  );
}
