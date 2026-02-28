import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Type, Hash, ChevronDown, CheckSquare, Calendar, MapPin, Camera,
  Star, ToggleLeft, AlignLeft, GripVertical, Trash2, Edit2, Eye, EyeOff, Save, Plus, X, Check
} from 'lucide-react';
import { useNGO, FieldForm, FormField } from '../context/NGOPlatformContext';

const FIELD_TYPES: { type: FormField['type']; label: string; icon: React.ReactNode; description: string }[] = [
  { type: 'text',         label: 'Text Input',    icon: <Type size={16} />,        description: 'Short text answer' },
  { type: 'number',       label: 'Number',        icon: <Hash size={16} />,        description: 'Numeric value' },
  { type: 'select',       label: 'Dropdown',      icon: <ChevronDown size={16} />, description: 'Single choice' },
  { type: 'multi-select', label: 'Multi-Select',  icon: <CheckSquare size={16} />, description: 'Multiple choices' },
  { type: 'date',         label: 'Date Picker',   icon: <Calendar size={16} />,    description: 'Date selection' },
  { type: 'location',     label: 'GPS Location',  icon: <MapPin size={16} />,      description: 'Geographic coords' },
  { type: 'photo',        label: 'Photo Capture', icon: <Camera size={16} />,      description: 'Image upload' },
  { type: 'scale',        label: 'Scale / Rating',icon: <Star size={16} />,        description: 'Rating scale' },
  { type: 'yes-no',       label: 'Yes / No',      icon: <ToggleLeft size={16} />,  description: 'Boolean toggle' },
  { type: 'long-text',    label: 'Long Text',     icon: <AlignLeft size={16} />,   description: 'Multi-line text' },
];

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #E0E4E8', borderRadius: 8, fontSize: '0.875rem', color: '#1C2B3A', background: 'white', boxSizing: 'border-box' };

function generateId(): string {
  return `fld-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function FieldFormBuilderPage() {
  const navigate = useNavigate();
  const { addForm, activeProject } = useNGO();

  const [formName, setFormName] = useState('New Data Collection Form');
  const [formDesc, setFormDesc] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  function addField(type: FormField['type']) {
    const defaultLabel = FIELD_TYPES.find(ft => ft.type === type)?.label || 'New Field';
    const newField: FormField = {
      id: generateId(),
      label: defaultLabel,
      type,
      required: false,
      options: (type === 'select' || type === 'multi-select') ? ['Option 1', 'Option 2'] : undefined,
      section: 'General',
      helpText: '',
    };
    setFields(prev => [...prev, newField]);
    setExpandedFieldId(newField.id);
  }

  function updateField(id: string, updates: Partial<FormField>) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }

  function deleteField(id: string) {
    setFields(prev => prev.filter(f => f.id !== id));
    if (expandedFieldId === id) setExpandedFieldId(null);
  }

  function moveField(fromIdx: number, toIdx: number) {
    setFields(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }

  function handleSaveDraft() {
    const form: FieldForm = {
      id: `form-${Date.now()}`,
      name: formName,
      description: formDesc,
      fields,
      status: 'draft',
      responsesCount: 0,
      createdAt: new Date().toISOString(),
    };
    addForm(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleActivate() {
    const form: FieldForm = {
      id: `form-${Date.now()}`,
      name: formName,
      description: formDesc,
      fields,
      status: 'active',
      responsesCount: 0,
      createdAt: new Date().toISOString(),
    };
    addForm(form);
    navigate(-1);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: 1200, margin: '0 auto' }}>
      {/* Top bar */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E4E8', padding: '0.875rem 1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A8A6A', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', padding: 0 }}>
          <ArrowLeft size={15} /> Back
        </button>
        <div style={{ flex: 1, minWidth: 200 }}>
          <input
            value={formName}
            onChange={e => setFormName(e.target.value)}
            style={{ border: 'none', fontSize: '1rem', fontWeight: 700, color: '#1C2B3A', background: 'transparent', outline: 'none', width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: showPreview ? '#F3F4F6' : 'white', border: '1px solid #E0E4E8', borderRadius: 8, padding: '0.4rem 0.875rem', cursor: 'pointer', fontSize: '0.82rem', color: '#6B7280' }}
          >
            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPreview ? 'Hide Preview' : 'Preview'}
          </button>
          <button
            onClick={handleSaveDraft}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: saved ? '#27AE60' : 'white', border: '1px solid #E0E4E8', borderRadius: 8, padding: '0.4rem 0.875rem', cursor: 'pointer', fontSize: '0.82rem', color: saved ? 'white' : '#6B7280', transition: 'all 0.2s' }}
          >
            {saved ? <Check size={14} /> : <Save size={14} />}
            {saved ? 'Saved!' : 'Save Draft'}
          </button>
          <button
            onClick={handleActivate}
            style={{ background: '#5A8A6A', color: 'white', border: 'none', borderRadius: 8, padding: '0.4rem 0.875rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
          >
            Activate Form
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: 0 }}>
        {/* Left panel: Field palette */}
        <div style={{ width: 220, flexShrink: 0, background: 'white', borderRadius: 12, border: '1px solid #E0E4E8', padding: '1rem', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
            Field Types
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {FIELD_TYPES.map(ft => (
              <button
                key={ft.type}
                onClick={() => addField(ft.type)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  background: '#F9FAFB', border: '1px solid #E0E4E8', borderRadius: 8,
                  padding: '0.55rem 0.75rem', cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#E8F5E9'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#5A8A6A'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F9FAFB'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#E0E4E8'; }}
              >
                <span style={{ color: '#5A8A6A', flexShrink: 0 }}>{ft.icon}</span>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1C2B3A' }}>{ft.label}</div>
                  <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>{ft.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Center panel: Form canvas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', minWidth: 0 }}>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E4E8', padding: '1.25rem' }}>
            <input
              value={formName}
              onChange={e => setFormName(e.target.value)}
              style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1C2B3A', border: 'none', outline: 'none', background: 'transparent', width: '100%', marginBottom: '0.5rem' }}
              placeholder="Form title..."
            />
            <textarea
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
              style={{ fontSize: '0.875rem', color: '#6B7280', border: 'none', outline: 'none', background: 'transparent', width: '100%', resize: 'none', fontFamily: 'inherit' }}
              placeholder="Form description (optional)..."
              rows={2}
            />
          </div>

          {fields.length === 0 && (
            <div style={{ background: 'white', borderRadius: 12, border: '2px dashed #E0E4E8', padding: '3rem', textAlign: 'center' }}>
              <Plus size={36} color="#D1D5DB" style={{ marginBottom: '0.75rem' }} />
              <div style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>Click a field type on the left to add it to your form</div>
            </div>
          )}

          {fields.map((field, index) => (
            <FieldCard
              key={field.id}
              field={field}
              index={index}
              total={fields.length}
              expanded={expandedFieldId === field.id}
              onToggleExpand={() => setExpandedFieldId(expandedFieldId === field.id ? null : field.id)}
              onUpdate={(updates) => updateField(field.id, updates)}
              onDelete={() => deleteField(field.id)}
              onMoveUp={() => index > 0 && moveField(index, index - 1)}
              onMoveDown={() => index < fields.length - 1 && moveField(index, index + 1)}
            />
          ))}
        </div>

        {/* Right panel: Preview */}
        {showPreview && (
          <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
              Mobile Preview
            </div>
            <div style={{
              width: 300, background: '#1C2B3A', borderRadius: 28, padding: 8,
              boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
            }}>
              <div style={{ background: 'white', borderRadius: 22, overflow: 'hidden', maxHeight: 600, overflowY: 'auto' }}>
                <div style={{ background: '#5A8A6A', padding: '1rem', textAlign: 'center', color: 'white' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{formName || 'Untitled Form'}</div>
                  {formDesc && <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.2rem' }}>{formDesc}</div>}
                </div>
                <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {fields.map(field => (
                    <FormFieldPreview key={field.id} field={field} />
                  ))}
                  {fields.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '0.8rem', padding: '1rem' }}>
                      Add fields to preview
                    </div>
                  )}
                  {fields.length > 0 && (
                    <button style={{ background: '#5A8A6A', color: 'white', border: 'none', borderRadius: 8, padding: '0.65rem', fontWeight: 700, width: '100%', fontSize: '0.875rem', cursor: 'default' }}>
                      Submit
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Field Card ───────────────────────────────────────────────────────────────
function FieldCard({ field, index, total, expanded, onToggleExpand, onUpdate, onDelete, onMoveUp, onMoveDown }: {
  field: FormField;
  index: number;
  total: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<FormField>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const ft = FIELD_TYPES.find(f => f.type === field.type);
  const [newOption, setNewOption] = useState('');

  function addOption() {
    if (!newOption.trim()) return;
    onUpdate({ options: [...(field.options || []), newOption.trim()] });
    setNewOption('');
  }

  function removeOption(idx: number) {
    onUpdate({ options: (field.options || []).filter((_, i) => i !== idx) });
  }

  return (
    <div style={{ background: 'white', borderRadius: 12, border: `1px solid ${expanded ? '#5A8A6A' : '#E0E4E8'}`, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', cursor: 'pointer' }} onClick={onToggleExpand}>
        <div style={{ color: '#9CA3AF', cursor: 'grab', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <GripVertical size={16} />
        </div>
        <div style={{ color: '#5A8A6A', flexShrink: 0 }}>{ft?.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1C2B3A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {field.label}
            {field.required && <span style={{ color: '#C0533A', marginLeft: '0.25rem' }}>*</span>}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>{ft?.label} · Section: {field.section}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} onClick={e => e.stopPropagation()}>
          <button onClick={onMoveUp} disabled={index === 0} style={{ background: 'none', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', color: index === 0 ? '#D1D5DB' : '#6B7280', padding: '0.2rem' }}>↑</button>
          <button onClick={onMoveDown} disabled={index === total - 1} style={{ background: 'none', border: 'none', cursor: index === total - 1 ? 'not-allowed' : 'pointer', color: index === total - 1 ? '#D1D5DB' : '#6B7280', padding: '0.2rem' }}>↓</button>
          <button onClick={onToggleExpand} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '0.2rem' }}>
            <Edit2 size={13} />
          </button>
          <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0533A', padding: '0.2rem' }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '1rem', borderTop: '1px solid #E8F5E9', background: '#F9FAFB', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          <div>
            <label style={labelStyle}>Field Label</label>
            <input style={inputStyle} value={field.label} onChange={e => onUpdate({ label: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Section</label>
            <input style={inputStyle} value={field.section} onChange={e => onUpdate({ section: e.target.value })} placeholder="e.g. Demographics" />
          </div>
          <div>
            <label style={labelStyle}>Help Text</label>
            <input style={inputStyle} value={field.helpText || ''} onChange={e => onUpdate({ helpText: e.target.value })} placeholder="Guidance for respondent..." />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', cursor: 'pointer', color: '#374151', fontWeight: 600 }}>
              <input type="checkbox" checked={field.required} onChange={e => onUpdate({ required: e.target.checked })} /> Required field
            </label>
          </div>

          {(field.type === 'select' || field.type === 'multi-select') && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Options</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
                {(field.options || []).map((opt, oi) => (
                  <span key={oi} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#E8F5E9', color: '#3D6B4F', borderRadius: 20, padding: '0.2rem 0.6rem', fontSize: '0.78rem' }}>
                    {opt}
                    <button onClick={() => removeOption(oi)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A8A6A', padding: 0, display: 'flex' }}><X size={11} /></button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input style={{ ...inputStyle, flex: 1 }} value={newOption} onChange={e => setNewOption(e.target.value)} onKeyDown={e => e.key === 'Enter' && addOption()} placeholder="Add option..." />
                <button onClick={addOption} style={{ background: '#5A8A6A', color: 'white', border: 'none', borderRadius: 8, padding: '0.5rem 0.75rem', cursor: 'pointer' }}><Plus size={14} /></button>
              </div>
            </div>
          )}

          {field.type === 'number' && (
            <>
              <div>
                <label style={labelStyle}>Min Value</label>
                <input type="number" style={inputStyle} value={field.validation?.min ?? ''} onChange={e => onUpdate({ validation: { ...field.validation, min: e.target.value ? +e.target.value : undefined } })} />
              </div>
              <div>
                <label style={labelStyle}>Max Value</label>
                <input type="number" style={inputStyle} value={field.validation?.max ?? ''} onChange={e => onUpdate({ validation: { ...field.validation, max: e.target.value ? +e.target.value : undefined } })} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Form Field Preview ───────────────────────────────────────────────────────
function FormFieldPreview({ field }: { field: FormField }) {
  const previewInput = () => {
    switch (field.type) {
      case 'text':
        return <input disabled placeholder="Type answer..." style={{ width: '100%', padding: '0.45rem', border: '1px solid #E0E4E8', borderRadius: 6, fontSize: '0.8rem', boxSizing: 'border-box', background: '#F9FAFB' }} />;
      case 'number':
        return <input type="number" disabled placeholder="0" style={{ width: '100%', padding: '0.45rem', border: '1px solid #E0E4E8', borderRadius: 6, fontSize: '0.8rem', boxSizing: 'border-box', background: '#F9FAFB' }} />;
      case 'long-text':
        return <textarea disabled rows={3} placeholder="Type your answer..." style={{ width: '100%', padding: '0.45rem', border: '1px solid #E0E4E8', borderRadius: 6, fontSize: '0.8rem', boxSizing: 'border-box', background: '#F9FAFB', resize: 'none', fontFamily: 'inherit' }} />;
      case 'select':
        return (
          <select disabled style={{ width: '100%', padding: '0.45rem', border: '1px solid #E0E4E8', borderRadius: 6, fontSize: '0.8rem', background: '#F9FAFB' }}>
            <option>Select...</option>
            {(field.options || []).map((o, i) => <option key={i}>{o}</option>)}
          </select>
        );
      case 'multi-select':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {(field.options || []).map((o, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'not-allowed' }}>
                <input type="checkbox" disabled /> {o}
              </label>
            ))}
          </div>
        );
      case 'date':
        return <input type="date" disabled style={{ width: '100%', padding: '0.45rem', border: '1px solid #E0E4E8', borderRadius: 6, fontSize: '0.8rem', boxSizing: 'border-box', background: '#F9FAFB' }} />;
      case 'yes-no':
        return (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button disabled style={{ flex: 1, padding: '0.45rem', border: '1px solid #E0E4E8', borderRadius: 6, background: '#F9FAFB', fontSize: '0.8rem', cursor: 'not-allowed' }}>Yes</button>
            <button disabled style={{ flex: 1, padding: '0.45rem', border: '1px solid #E0E4E8', borderRadius: 6, background: '#F9FAFB', fontSize: '0.8rem', cursor: 'not-allowed' }}>No</button>
          </div>
        );
      case 'scale':
        return (
          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'space-between' }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} disabled style={{ flex: 1, padding: '0.4rem', border: '1px solid #E0E4E8', borderRadius: 6, background: '#F9FAFB', fontSize: '0.8rem', cursor: 'not-allowed' }}>{n}</button>
            ))}
          </div>
        );
      case 'location':
        return <button disabled style={{ width: '100%', padding: '0.45rem', border: '1px dashed #5A8A6A', borderRadius: 6, background: '#F9FAFB', fontSize: '0.8rem', color: '#5A8A6A', cursor: 'not-allowed' }}>📍 Capture Location</button>;
      case 'photo':
        return <button disabled style={{ width: '100%', padding: '0.45rem', border: '1px dashed #5A8A6A', borderRadius: 6, background: '#F9FAFB', fontSize: '0.8rem', color: '#5A8A6A', cursor: 'not-allowed' }}>📷 Take Photo</button>;
      default:
        return <input disabled style={{ width: '100%', padding: '0.45rem', border: '1px solid #E0E4E8', borderRadius: 6, fontSize: '0.8rem', boxSizing: 'border-box', background: '#F9FAFB' }} />;
    }
  };

  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#1C2B3A', marginBottom: '0.3rem' }}>
        {field.label}
        {field.required && <span style={{ color: '#C0533A' }}> *</span>}
      </label>
      {field.helpText && <div style={{ fontSize: '0.72rem', color: '#6B7280', marginBottom: '0.3rem' }}>{field.helpText}</div>}
      {previewInput()}
    </div>
  );
}
