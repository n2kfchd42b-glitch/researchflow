import React, { useState } from 'react';
import { Save, Download, Trash2, AlertTriangle, HardDrive } from 'lucide-react';
import { useJournal, JournalSettings } from '../context/JournalContext';

const JOURNAL_PRIMARY = '#7D3C98';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.55rem 0.75rem',
  border: '1px solid #D1D5DB',
  borderRadius: 8,
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const sectionStyle: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: 12,
  border: '1px solid #E5E7EB',
  padding: '1.5rem',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#374151',
  marginBottom: 4,
};

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
      <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1C2B3A' }}>{title}</h2>
      {subtitle && <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#6B7280' }}>{subtitle}</p>}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          background: checked ? JOURNAL_PRIMARY : '#D1D5DB',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute',
          top: 3,
          left: checked ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: 'white',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
      <span style={{ fontSize: '0.875rem', color: '#374151' }}>{label}</span>
    </label>
  );
}

function RadioGroup({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; description?: string }[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {options.map(opt => (
        <label key={opt.value} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', padding: '0.5rem', borderRadius: 8, background: value === opt.value ? '#F5EEF8' : 'transparent', border: `1px solid ${value === opt.value ? JOURNAL_PRIMARY : 'transparent'}` }}>
          <input type="radio" value={opt.value} checked={value === opt.value} onChange={() => onChange(opt.value)} style={{ marginTop: 2, accentColor: JOURNAL_PRIMARY }} />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: value === opt.value ? 600 : 400, color: '#1C2B3A' }}>{opt.label}</div>
            {opt.description && <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: 1 }}>{opt.description}</div>}
          </div>
        </label>
      ))}
    </div>
  );
}

// ─── Clear Data Modal ─────────────────────────────────────────────────────────

function ClearDataModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [confirmText, setConfirmText] = useState('');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 14, padding: '1.75rem', maxWidth: 440, width: '100%' }}>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <AlertTriangle size={22} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1C2B3A' }}>Clear All Data</h3>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: '#6B7280' }}>
              This will permanently delete all submissions, verification results, risk of bias assessments, and audit logs. This action cannot be undone.
            </p>
          </div>
        </div>
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={labelStyle}>Type <strong>DELETE</strong> to confirm:</label>
          <input
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            style={{ ...inputStyle, borderColor: confirmText === 'DELETE' ? '#EF4444' : '#D1D5DB' }}
            placeholder="DELETE"
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '0.55rem 1.2rem', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem', color: '#374151' }}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmText !== 'DELETE'}
            style={{ padding: '0.55rem 1.2rem', background: confirmText === 'DELETE' ? '#EF4444' : '#FCA5A5', border: 'none', borderRadius: 8, cursor: confirmText === 'DELETE' ? 'pointer' : 'not-allowed', fontSize: '0.875rem', color: 'white', fontWeight: 600 }}
          >
            Delete All Data
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function JournalSettingsPage() {
  const { state, updateSettings } = useJournal();
  const settings = state.settings;

  const [local, setLocal] = useState<JournalSettings>({ ...settings });
  const [saved, setSaved] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const update = (field: keyof JournalSettings, value: any) => {
    setLocal(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    updateSettings(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const exportAllData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `journal-data-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const clearAllData = () => {
    localStorage.removeItem('rf_journal_component');
    window.location.reload();
  };

  const storageSize = useMemo(() => {
    try {
      const item = localStorage.getItem('rf_journal_component');
      return item ? (new Blob([item]).size / 1024).toFixed(1) : '0';
    } catch { return '0'; }
  }, [state]);

  function useMemo<T>(factory: () => T, deps: any[]): T {
    return React.useMemo(factory, deps);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 760 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1C2B3A' }}>Journal Settings</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#6B7280' }}>Configure the Journal Component behaviour and defaults</p>
        </div>
        <button
          onClick={handleSave}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.3rem', background: saved ? '#10B981' : JOURNAL_PRIMARY, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem', color: 'white', fontWeight: 600, transition: 'background 0.3s' }}
        >
          <Save size={15} />
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      {/* Journal Information */}
      <div style={sectionStyle}>
        <SectionHeader title="Journal Information" subtitle="Basic information about your journal" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Journal Name</label>
            <input value={local.journalName} onChange={e => update('journalName', e.target.value)} style={inputStyle} placeholder="e.g. Global Health Journal" />
          </div>
          <div>
            <label style={labelStyle}>Default Reviewer Name</label>
            <input value={local.defaultReviewerName} onChange={e => update('defaultReviewerName', e.target.value)} style={inputStyle} placeholder="Reviewer name" />
          </div>
          <div>
            <label style={labelStyle}>Editor-in-Chief</label>
            <input value={local.editorInChiefName} onChange={e => update('editorInChiefName', e.target.value)} style={inputStyle} placeholder="EIC name" />
          </div>
        </div>
      </div>

      {/* Verification Settings */}
      <div style={sectionStyle}>
        <SectionHeader title="Verification Settings" subtitle="Control how the verification workflow operates" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={labelStyle}>Default Risk of Bias Tool</label>
            <RadioGroup
              value={local.defaultRoBTool}
              onChange={v => update('defaultRoBTool', v)}
              options={[
                { value: 'rob2', label: 'RoB 2', description: 'Recommended for randomized controlled trials' },
                { value: 'robins-i', label: 'ROBINS-I', description: 'For non-randomized studies of interventions' },
                { value: 'newcastle-ottawa', label: 'Newcastle-Ottawa Scale', description: 'For observational cohort and case-control studies' },
                { value: 'custom', label: 'Custom', description: 'Define your own domain structure' },
              ]}
            />
          </div>

          <div>
            <Toggle
              checked={local.requireDatasetHash}
              onChange={v => update('requireDatasetHash', v)}
              label="Require dataset hash verification before completing review"
            />
          </div>

          <div>
            <label style={labelStyle}>Auto-Flag Threshold</label>
            <p style={{ margin: '0 0 0.65rem', fontSize: '0.78rem', color: '#6B7280' }}>
              Automatically flag submissions as "flagged" when discrepancies are found:
            </p>
            <RadioGroup
              value={local.autoFlagThreshold}
              onChange={v => update('autoFlagThreshold', v)}
              options={[
                { value: 'any-discrepancy', label: 'Any Discrepancy', description: 'Flag on any non-exact match' },
                { value: 'major-only', label: 'Major Discrepancies Only', description: 'Flag only on major discrepancies (>5%)' },
                { value: 'critical-only', label: 'Critical Severity Only', description: 'Flag only when critical severity issues are found' },
              ]}
            />
          </div>

          <div>
            <label style={labelStyle}>Deadline Warning Threshold</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <input
                type="number"
                min={1}
                max={90}
                value={local.deadlineWarningDays}
                onChange={e => update('deadlineWarningDays', parseInt(e.target.value) || 7)}
                style={{ ...inputStyle, width: 80 }}
              />
              <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>days before deadline</span>
            </div>
          </div>
        </div>
      </div>

      {/* Report Settings */}
      <div style={sectionStyle}>
        <SectionHeader title="Report Customization" subtitle="Configure default report generation settings" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={labelStyle}>Default Report Format</label>
            <RadioGroup
              value={local.reportFormat}
              onChange={v => update('reportFormat', v)}
              options={[
                { value: 'detailed', label: 'Detailed Report', description: 'All sections including full audit trail and appendix' },
                { value: 'summary', label: 'Summary Report', description: 'Executive summary and key findings only' },
              ]}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Toggle checked={local.includeAppendix} onChange={v => update('includeAppendix', v)} label="Include appendix by default" />
            <Toggle checked={local.includeAuditTrail} onChange={v => update('includeAuditTrail', v)} label="Include full audit trail in reports" />
          </div>

          <div>
            <label style={labelStyle}>Report Header Text</label>
            <textarea
              value={local.reportHeaderText}
              onChange={e => update('reportHeaderText', e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Text that appears at the top of all generated reports..."
            />
          </div>

          <div>
            <label style={labelStyle}>Report Footer Text</label>
            <textarea
              value={local.reportFooterText}
              onChange={e => update('reportFooterText', e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Text that appears at the bottom of all generated reports..."
            />
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div style={sectionStyle}>
        <SectionHeader title="Data Management" subtitle="Export or clear your journal verification data" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Storage indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
            <HardDrive size={18} color="#6B7280" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>Local Storage Usage</div>
              <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>{storageSize} KB used — {state.submissions.length} submission{state.submissions.length !== 1 ? 's' : ''} stored</div>
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: JOURNAL_PRIMARY }}>{storageSize} KB</div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={exportAllData}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem', color: '#1E40AF', fontWeight: 600 }}
            >
              <Download size={15} /> Export All Data (JSON)
            </button>
            <button
              onClick={() => setShowClearModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem', color: '#991B1B', fontWeight: 600 }}
            >
              <Trash2 size={15} /> Clear All Data
            </button>
          </div>

          <p style={{ margin: 0, fontSize: '0.78rem', color: '#9CA3AF' }}>
            ⚠ All data is stored in your browser's local storage. Clearing browser data or using a different browser will result in data loss. Use "Export All Data" regularly to back up your verification records.
          </p>
        </div>
      </div>

      {showClearModal && (
        <ClearDataModal
          onClose={() => setShowClearModal(false)}
          onConfirm={() => { clearAllData(); setShowClearModal(false); }}
        />
      )}
    </div>
  );
}
