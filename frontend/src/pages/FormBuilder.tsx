import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'researchflow_formbuilder';

type FieldType =
  | 'text' | 'number' | 'date' | 'select' | 'multiselect'
  | 'radio' | 'checkbox' | 'textarea' | 'scale' | 'gps' | 'photo' | 'signature';

type Field = {
  id:           string;
  type:         FieldType;
  label:        string;
  variable:     string;
  required:     boolean;
  options:      string[];
  min:          string;
  max:          string;
  placeholder:  string;
  hint:         string;
  skip_logic:   string;
  validation:   string;
  section:      string;
};

type Section = {
  id:    string;
  title: string;
  desc:  string;
};

type Form = {
  id:          string;
  title:       string;
  description: string;
  language:    string;
  version:     string;
  study:       string;
  created_at:  string;
  sections:    Section[];
  fields:      Field[];
};

const FIELD_TYPES: { type: FieldType; label: string; icon: string; desc: string }[] = [
  { type: 'text',        label: 'Text',            icon: '📝', desc: 'Short free-text answer' },
  { type: 'number',      label: 'Number',          icon: '🔢', desc: 'Numeric input with range validation' },
  { type: 'date',        label: 'Date',            icon: '📅', desc: 'Date picker' },
  { type: 'select',      label: 'Dropdown',        icon: '▼',  desc: 'Single choice from list' },
  { type: 'radio',       label: 'Radio Buttons',   icon: '◉',  desc: 'Single choice, all visible' },
  { type: 'multiselect', label: 'Multi-Select',    icon: '☑',  desc: 'Multiple choices allowed' },
  { type: 'checkbox',    label: 'Yes/No',          icon: '✅',  desc: 'Boolean checkbox' },
  { type: 'textarea',    label: 'Long Text',       icon: '📄', desc: 'Multi-line free text' },
  { type: 'scale',       label: 'Likert Scale',    icon: '📊', desc: 'Rating scale (1–5 or 1–10)' },
  { type: 'gps',         label: 'GPS Location',    icon: '📍', desc: 'Capture latitude/longitude' },
  { type: 'photo',       label: 'Photo',           icon: '📷', desc: 'Camera / file upload' },
  { type: 'signature',   label: 'Signature',       icon: '✍️', desc: 'Digital consent signature' },
];

const LANGUAGES = [
  'English', 'French', 'Swahili', 'Amharic', 'Hausa', 'Yoruba',
  'Igbo', 'Zulu', 'Xhosa', 'Portuguese', 'Arabic', 'Hindi',
];

const COMMON_FIELDS: Partial<Field>[] = [
  { label: 'Participant ID',      type: 'text',   variable: 'participant_id', required: true },
  { label: 'Date of Interview',   type: 'date',   variable: 'interview_date', required: true },
  { label: 'Interviewer Name',    type: 'text',   variable: 'interviewer_name', required: true },
  { label: 'Site / Facility',     type: 'text',   variable: 'site_name', required: true },
  { label: 'GPS Coordinates',     type: 'gps',    variable: 'gps_location', required: false },
  { label: 'Age',                 type: 'number', variable: 'age', required: true, min: '0', max: '120' },
  { label: 'Sex',                 type: 'radio',  variable: 'sex', required: true, options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
  { label: 'Informed Consent Obtained', type: 'checkbox', variable: 'consent_obtained', required: true },
];

function emptyField(section: string): Field {
  return {
    id: Date.now().toString(),
    type: 'text',
    label: '',
    variable: '',
    required: false,
    options: ['Option 1', 'Option 2'],
    min: '',
    max: '',
    placeholder: '',
    hint: '',
    skip_logic: '',
    validation: '',
    section,
  };
}

function toVariable(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function emptyForm(): Form {
  const sectionId = 'sec_' + Date.now();
  return {
    id:          Date.now().toString(),
    title:       'New Data Collection Form',
    description: '',
    language:    'English',
    version:     '1.0',
    study:       '',
    created_at:  new Date().toISOString(),
    sections:    [{ id: sectionId, title: 'Section 1', desc: '' }],
    fields:      [],
  };
}

export default function FormBuilder() {
  const [forms, setForms]               = useState<Form[]>([]);
  const [activeId, setActiveId]         = useState<string | null>(null);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const [activeTab, setActiveTab]       = useState<'build' | 'preview' | 'export'>('build');
  const [showCreate, setShowCreate]     = useState(false);
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormStudy, setNewFormStudy] = useState('');
  const [dragOver, setDragOver]         = useState<string | null>(null);
  const [saved, setSaved]               = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) setForms(JSON.parse(s));
    } catch (_) {}
  }, []);

  function persist(updated: Form[]) {
    setForms(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  function getActive(): Form | undefined {
    return forms.find(f => f.id === activeId);
  }

  function updateForm(changes: Partial<Form>) {
    if (!activeId) return;
    persist(forms.map(f => f.id === activeId ? { ...f, ...changes } : f));
  }

  function createForm() {
    if (!newFormTitle) return;
    const f = { ...emptyForm(), title: newFormTitle, study: newFormStudy };
    const updated = [...forms, f];
    persist(updated);
    setActiveId(f.id);
    setActiveSection(f.sections[0].id);
    setShowCreate(false);
    setNewFormTitle('');
    setNewFormStudy('');
    setActiveTab('build');
  }

  function deleteForm(id: string) {
    if (!window.confirm('Delete this form? This cannot be undone.')) return;
    persist(forms.filter(f => f.id !== id));
    if (activeId === id) setActiveId(null);
  }

  function addSection() {
    const f = getActive();
    if (!f) return;
    const sec: Section = { id: 'sec_' + Date.now(), title: `Section ${f.sections.length + 1}`, desc: '' };
    updateForm({ sections: [...f.sections, sec] });
    setActiveSection(sec.id);
  }

  function addField(type: FieldType) {
    const f = getActive();
    if (!f) return;
    const sec = activeSection || f.sections[0]?.id || '';
    const field = { ...emptyField(sec), type };
    updateForm({ fields: [...f.fields, field] });
    setEditingField(field);
  }

  function addCommonField(template: Partial<Field>) {
    const f = getActive();
    if (!f) return;
    const sec = activeSection || f.sections[0]?.id || '';
    const field: Field = {
      ...emptyField(sec),
      ...template,
      id: Date.now().toString(),
      options: template.options || [],
      min: template.min || '',
      max: template.max || '',
    };
    updateForm({ fields: [...f.fields, field] });
  }

  function saveField(field: Field) {
    const f = getActive();
    if (!f) return;
    const exists = f.fields.find(ff => ff.id === field.id);
    if (exists) {
      updateForm({ fields: f.fields.map(ff => ff.id === field.id ? field : ff) });
    } else {
      updateForm({ fields: [...f.fields, field] });
    }
    setEditingField(null);
  }

  function deleteField(id: string) {
    const f = getActive();
    if (!f) return;
    updateForm({ fields: f.fields.filter(ff => ff.id !== id) });
    if (editingField?.id === id) setEditingField(null);
  }

  function moveField(id: string, dir: -1 | 1) {
    const f = getActive();
    if (!f) return;
    const idx = f.fields.findIndex(ff => ff.id === id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= f.fields.length) return;
    const arr = [...f.fields];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    updateForm({ fields: arr });
  }

  function exportXLSForm() {
    const f = getActive();
    if (!f) return;
    const rows: string[] = [];
    rows.push('type,name,label,hint,required,constraint,constraint_message,appearance,choice_filter');

    f.fields.forEach(field => {
      let type = field.type;
      if (field.type === 'radio' || field.type === 'select') type = `select_one ${field.variable}_choices`;
      if (field.type === 'multiselect') type = `select_multiple ${field.variable}_choices`;
      if (field.type === 'scale') type = 'integer';
      if (field.type === 'gps') type = 'geopoint';
      if (field.type === 'photo') type = 'image';
      if (field.type === 'signature') type = 'image';
      if (field.type === 'checkbox') type = 'select_one yes_no';
      const req = field.required ? 'yes' : 'no';
      const constraint = field.min || field.max
        ? `.>=${field.min || 0} and .<=${field.max || 999}`
        : '';
      rows.push(`${type},${field.variable},"${field.label}","${field.hint}",${req},${constraint},,`);
    });

    rows.push('');
    rows.push('list_name,name,label');
    rows.push('yes_no,yes,Yes');
    rows.push('yes_no,no,No');

    f.fields.filter(ff => ['radio', 'select', 'multiselect'].includes(ff.type)).forEach(field => {
      field.options.forEach(opt => {
        rows.push(`${field.variable}_choices,${toVariable(opt)},"${opt}"`);
      });
    });

    const content = rows.join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `${f.title.replace(/\s+/g, '_')}_XLSForm.csv`;
    a.click();
  }

  function exportJSON() {
    const f = getActive();
    if (!f) return;
    const blob = new Blob([JSON.stringify(f, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `${f.title.replace(/\s+/g, '_')}.json`;
    a.click();
  }

  function exportCodebook() {
    const f = getActive();
    if (!f) return;
    const rows = ['Variable Name,Label,Type,Required,Options/Range,Hint'];
    f.fields.forEach(field => {
      const opts = field.options.length ? field.options.join('; ') : (field.min || field.max ? `${field.min || ''}–${field.max || ''}` : '');
      rows.push(`${field.variable},"${field.label}",${field.type},${field.required ? 'Yes' : 'No'},"${opts}","${field.hint}"`);
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `${f.title.replace(/\s+/g, '_')}_Codebook.csv`;
    a.click();
  }

  const active = getActive();
  const activeSectionFields = active?.fields.filter(f => f.section === (activeSection || active.sections[0]?.id)) || [];

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.65rem', borderRadius: 6,
    border: '1px solid #ddd', fontSize: '0.85rem', outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '0.72rem', fontWeight: 700, color: '#888',
    textTransform: 'uppercase', letterSpacing: 0.5,
    display: 'block', marginBottom: 3,
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ color: '#1C2B3A', marginBottom: 4 }}>Form Builder</h1>
          <p style={{ color: '#888', fontSize: '0.88rem', marginBottom: 0 }}>
            Design field data collection tools — exports to ODK/KoboToolbox XLSForm format
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {saved && <span style={{ color: '#5A8A6A', fontSize: '0.82rem', fontWeight: 600 }}>✓ Saved</span>}
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Form</button>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: 480, maxWidth: '95vw' }}>
            <h2>Create New Form</h2>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={labelStyle}>Form Title *</label>
              <input value={newFormTitle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFormTitle(e.target.value)}
                placeholder="e.g. Malaria Household Survey Form" style={inputStyle} autoFocus />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Study / Project</label>
              <input value={newFormStudy} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFormStudy(e.target.value)}
                placeholder="e.g. KEMRI Malaria RCT 2024" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={createForm} disabled={!newFormTitle}>Create Form</button>
              <button className="btn" style={{ background: '#eee', color: '#444' }} onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem' }}>

        {/* FORM LIST */}
        <div>
          <div className="card" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '0.82rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.75rem' }}>
              My Forms ({forms.length})
            </h3>
            {forms.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
                <p style={{ fontSize: '0.82rem', color: '#888' }}>No forms yet. Create your first data collection form.</p>
              </div>
            )}
            {forms.map(f => (
              <div key={f.id} onClick={() => { setActiveId(f.id); setActiveSection(f.sections[0]?.id || ''); setActiveTab('build'); }}
                style={{
                  padding: '0.75rem', borderRadius: 8, cursor: 'pointer', marginBottom: '0.5rem',
                  background: activeId === f.id ? '#fff5f3' : '#f8f7f4',
                  border: '1px solid ' + (activeId === f.id ? '#C0533A' : 'transparent'),
                }}>
                <p style={{ fontWeight: 700, fontSize: '0.85rem', color: activeId === f.id ? '#C0533A' : '#1C2B3A', marginBottom: 2 }}>
                  {f.title}
                </p>
                <p style={{ fontSize: '0.72rem', color: '#888', marginBottom: 0 }}>
                  {f.fields.length} fields · v{f.version} · {f.language}
                </p>
                {f.study && <p style={{ fontSize: '0.7rem', color: '#aaa', marginBottom: 0 }}>{f.study}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* BUILDER PANEL */}
        <div>
          {!active && (
            <div className="card" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
              <h2>Field Data Collection Form Builder</h2>
              <p style={{ color: '#888', maxWidth: 440, margin: '0 auto 1.5rem' }}>
                Design structured data collection forms for community health workers, field researchers and enumerators.
                Export to ODK/KoboToolbox XLSForm or JSON.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', maxWidth: 480, margin: '0 auto 1.5rem' }}>
                {[
                  { icon: '🧩', title: '12 Field Types',  text: 'Text, GPS, photo, Likert scales & more' },
                  { icon: '📱', title: 'ODK Compatible',  text: 'Export to XLSForm for KoboToolbox or ODK' },
                  { icon: '📖', title: 'Auto Codebook',   text: 'Generate variable codebook instantly' },
                ].map(item => (
                  <div key={item.title} style={{ background: '#f8f7f4', borderRadius: 8, padding: '0.875rem', textAlign: 'left' }}>
                    <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{item.icon}</div>
                    <p style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 2 }}>{item.title}</p>
                    <p style={{ fontSize: '0.72rem', color: '#888', marginBottom: 0 }}>{item.text}</p>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create Your First Form</button>
            </div>
          )}

          {active && (
            <div>
              {/* Form Header */}
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{ gridColumn: '1/3' }}>
                    <label style={labelStyle}>Form Title</label>
                    <input value={active.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateForm({ title: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Language</label>
                    <select value={active.language} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateForm({ language: e.target.value })} style={inputStyle}>
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Version</label>
                    <input value={active.version} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateForm({ version: e.target.value })} style={inputStyle} placeholder="1.0" />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <input value={active.description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateForm({ description: e.target.value })}
                    placeholder="Brief description of this form and its purpose" style={inputStyle} />
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
                {([
                  { id: 'build',   label: '🔧 Build'   },
                  { id: 'preview', label: '👁 Preview'  },
                  { id: 'export',  label: '⬇️ Export'  },
                ] as const).map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="btn" style={{
                    background: activeTab === tab.id ? '#1C2B3A' : '#eee',
                    color: activeTab === tab.id ? 'white' : '#444',
                    fontSize: '0.85rem', padding: '0.4rem 1rem',
                  }}>
                    {tab.label}
                  </button>
                ))}
                <button className="btn" style={{ background: '#fff5f5', color: '#f44336', fontSize: '0.82rem', padding: '0.4rem 0.75rem', marginLeft: 'auto' }}
                  onClick={() => deleteForm(active.id)}>
                  Delete Form
                </button>
              </div>

              {/* BUILD TAB */}
              {activeTab === 'build' && (
                <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 280px', gap: '1rem' }}>

                  {/* LEFT: Field types */}
                  <div>
                    <div className="card" style={{ padding: '0.875rem', marginBottom: '0.75rem' }}>
                      <h3 style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.625rem' }}>
                        Add Field
                      </h3>
                      {FIELD_TYPES.map(ft => (
                        <button key={ft.type} onClick={() => addField(ft.type)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.45rem 0.6rem', borderRadius: 5, border: '1px solid #eee', background: 'white', cursor: 'pointer', marginBottom: 3, fontSize: '0.8rem', textAlign: 'left' }}
                          title={ft.desc}>
                          <span>{ft.icon}</span>
                          <span style={{ fontWeight: 500, color: '#333' }}>{ft.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="card" style={{ padding: '0.875rem' }}>
                      <h3 style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.625rem' }}>
                        Common Fields
                      </h3>
                      {COMMON_FIELDS.map((cf, i) => (
                        <button key={i} onClick={() => addCommonField(cf)}
                          style={{ display: 'block', width: '100%', padding: '0.4rem 0.6rem', borderRadius: 5, border: '1px solid #eee', background: '#f8f7f4', cursor: 'pointer', marginBottom: 3, fontSize: '0.78rem', textAlign: 'left', color: '#333' }}>
                          + {cf.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CENTRE: Form canvas */}
                  <div>
                    {/* Section tabs */}
                    <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {active.sections.map(sec => (
                        <button key={sec.id} onClick={() => setActiveSection(sec.id)} className="btn" style={{
                          background: activeSection === sec.id ? '#1C2B3A' : '#eee',
                          color: activeSection === sec.id ? 'white' : '#444',
                          fontSize: '0.78rem', padding: '0.3rem 0.8rem',
                        }}>
                          {sec.title}
                          <span style={{ marginLeft: 4, opacity: 0.7, fontSize: '0.7rem' }}>
                            ({active.fields.filter(f => f.section === sec.id).length})
                          </span>
                        </button>
                      ))}
                      <button onClick={addSection} style={{ padding: '0.3rem 0.6rem', borderRadius: 5, border: '1px dashed #ccc', background: 'white', cursor: 'pointer', fontSize: '0.78rem', color: '#888' }}>
                        + Section
                      </button>
                    </div>

                    {/* Section name editor */}
                    {active.sections.find(s => s.id === activeSection) && (
                      <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                        <input
                          value={active.sections.find(s => s.id === activeSection)?.title || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            updateForm({ sections: active.sections.map(s => s.id === activeSection ? { ...s, title: e.target.value } : s) });
                          }}
                          placeholder="Section title..."
                          style={{ ...inputStyle, fontWeight: 700, fontSize: '1rem', flex: 1 }}
                        />
                      </div>
                    )}

                    {/* Fields */}
                    {activeSectionFields.length === 0 && (
                      <div style={{ border: '2px dashed #ddd', borderRadius: 10, padding: '3rem', textAlign: 'center', color: '#aaa', background: dragOver === activeSection ? '#f0f4f8' : 'white' }}
                        onDragOver={(e: React.DragEvent) => { e.preventDefault(); setDragOver(activeSection); }}
                        onDrop={() => setDragOver(null)}
                        onDragLeave={() => setDragOver(null)}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>➕</div>
                        <p style={{ fontSize: '0.88rem' }}>Click a field type on the left to add it here</p>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {activeSectionFields.map((field, i) => (
                        <div key={field.id}
                          onClick={() => setEditingField({ ...field })}
                          style={{
                            border: '1px solid ' + (editingField?.id === field.id ? '#C0533A' : '#eee'),
                            borderRadius: 8, padding: '0.875rem', cursor: 'pointer', background: 'white',
                            boxShadow: editingField?.id === field.id ? '0 0 0 2px #C0533A33' : 'none',
                            transition: 'all 0.15s',
                          }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                                <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: '#f0f4f8', color: '#1C2B3A' }}>
                                  {FIELD_TYPES.find(ft => ft.type === field.type)?.icon} {field.type}
                                </span>
                                {field.required && <span style={{ fontSize: '0.68rem', color: '#C0533A', fontWeight: 700 }}>REQUIRED</span>}
                              </div>
                              <p style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 2, color: field.label ? '#1C2B3A' : '#bbb' }}>
                                {field.label || 'Untitled field'}
                              </p>
                              <p style={{ fontSize: '0.72rem', color: '#888', marginBottom: 0 }}>
                                {field.variable ? `var: ${field.variable}` : 'No variable name'}
                                {field.options.length > 0 && ['select','radio','multiselect'].includes(field.type) && ` · ${field.options.length} options`}
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.3rem' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                              <button onClick={() => moveField(field.id, -1)} disabled={i === 0}
                                style={{ padding: '0.25rem 0.45rem', border: '1px solid #eee', borderRadius: 4, background: 'white', cursor: 'pointer', fontSize: '0.8rem', opacity: i === 0 ? 0.3 : 1 }}>↑</button>
                              <button onClick={() => moveField(field.id, 1)} disabled={i === activeSectionFields.length - 1}
                                style={{ padding: '0.25rem 0.45rem', border: '1px solid #eee', borderRadius: 4, background: 'white', cursor: 'pointer', fontSize: '0.8rem', opacity: i === activeSectionFields.length - 1 ? 0.3 : 1 }}>↓</button>
                              <button onClick={() => deleteField(field.id)}
                                style={{ padding: '0.25rem 0.45rem', border: '1px solid #fcc', borderRadius: 4, background: '#fff5f5', cursor: 'pointer', fontSize: '0.8rem', color: '#f44336' }}>×</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#aaa', textAlign: 'center' }}>
                      {active.fields.length} total fields across {active.sections.length} section{active.sections.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* RIGHT: Field editor */}
                  <div>
                    {!editingField && (
                      <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem', color: '#aaa' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👆</div>
                        <p style={{ fontSize: '0.82rem' }}>Click a field to edit its properties</p>
                      </div>
                    )}

                    {editingField && (
                      <div className="card" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                          <h3 style={{ margin: 0, fontSize: '0.9rem' }}>
                            {FIELD_TYPES.find(ft => ft.type === editingField.type)?.icon} Edit Field
                          </h3>
                          <button onClick={() => setEditingField(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#aaa' }}>×</button>
                        </div>

                        <div style={{ marginBottom: '0.6rem' }}>
                          <label style={labelStyle}>Field Type</label>
                          <select value={editingField.type}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditingField(ef => ef ? { ...ef, type: e.target.value as FieldType } : ef)}
                            style={inputStyle}>
                            {FIELD_TYPES.map(ft => <option key={ft.type} value={ft.type}>{ft.icon} {ft.label}</option>)}
                          </select>
                        </div>

                        <div style={{ marginBottom: '0.6rem' }}>
                          <label style={labelStyle}>Question Label *</label>
                          <input value={editingField.label}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingField(ef => ef ? { ...ef, label: e.target.value, variable: ef.variable || toVariable(e.target.value) } : ef)}
                            placeholder="e.g. What is the patient's age?" style={inputStyle} />
                        </div>

                        <div style={{ marginBottom: '0.6rem' }}>
                          <label style={labelStyle}>Variable Name</label>
                          <input value={editingField.variable}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingField(ef => ef ? { ...ef, variable: e.target.value.toLowerCase().replace(/\s+/g, '_') } : ef)}
                            placeholder="age" style={inputStyle} />
                          <p style={{ fontSize: '0.68rem', color: '#aaa', marginTop: 3, marginBottom: 0 }}>Lowercase, underscores only. Used in dataset.</p>
                        </div>

                        <div style={{ marginBottom: '0.6rem' }}>
                          <label style={labelStyle}>Hint / Instructions</label>
                          <input value={editingField.hint}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingField(ef => ef ? { ...ef, hint: e.target.value } : ef)}
                            placeholder="e.g. Enter age in years" style={inputStyle} />
                        </div>

                        <div style={{ marginBottom: '0.75rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={editingField.required}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingField(ef => ef ? { ...ef, required: e.target.checked } : ef)} />
                            Required field
                          </label>
                        </div>

                        {['number', 'scale'].includes(editingField.type) && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.6rem' }}>
                            <div>
                              <label style={labelStyle}>Min</label>
                              <input type="number" value={editingField.min}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingField(ef => ef ? { ...ef, min: e.target.value } : ef)}
                                placeholder="0" style={inputStyle} />
                            </div>
                            <div>
                              <label style={labelStyle}>Max</label>
                              <input type="number" value={editingField.max}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingField(ef => ef ? { ...ef, max: e.target.value } : ef)}
                                placeholder="999" style={inputStyle} />
                            </div>
                          </div>
                        )}

                        {['select', 'radio', 'multiselect'].includes(editingField.type) && (
                          <div style={{ marginBottom: '0.75rem' }}>
                            <label style={labelStyle}>Options (one per line)</label>
                            <textarea
                              value={editingField.options.join('\n')}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingField(ef => ef ? { ...ef, options: e.target.value.split('\n').filter(Boolean) } : ef)}
                              rows={5}
                              placeholder={'Option 1\nOption 2\nOption 3'}
                              style={{ ...inputStyle, resize: 'vertical' }}
                            />
                            <p style={{ fontSize: '0.68rem', color: '#aaa', marginTop: 3, marginBottom: 0 }}>
                              {editingField.options.length} options defined
                            </p>
                          </div>
                        )}

                        {editingField.type === 'scale' && (
                          <div style={{ marginBottom: '0.6rem' }}>
                            <label style={labelStyle}>Scale Label</label>
                            <input value={editingField.placeholder}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingField(ef => ef ? { ...ef, placeholder: e.target.value } : ef)}
                              placeholder="e.g. 1=Strongly Disagree, 5=Strongly Agree" style={inputStyle} />
                          </div>
                        )}

                        <div style={{ marginBottom: '0.75rem' }}>
                          <label style={labelStyle}>Skip Logic (ODK)</label>
                          <input value={editingField.skip_logic}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingField(ef => ef ? { ...ef, skip_logic: e.target.value } : ef)}
                            placeholder="${sex} = 'Female'" style={inputStyle} />
                          <p style={{ fontSize: '0.68rem', color: '#aaa', marginTop: 3, marginBottom: 0 }}>XLSForm relevant expression</p>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-primary" onClick={() => editingField && saveField(editingField)} style={{ flex: 1, fontSize: '0.85rem' }}>
                            ✓ Save Field
                          </button>
                          <button className="btn" style={{ background: '#fff5f5', color: '#f44336', fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                            onClick={() => editingField && deleteField(editingField.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PREVIEW TAB */}
              {activeTab === 'preview' && (
                <div style={{ maxWidth: 600 }}>
                  <div style={{ background: '#1C2B3A', color: 'white', borderRadius: '10px 10px 0 0', padding: '1rem 1.5rem' }}>
                    <h2 style={{ color: 'white', marginBottom: 4 }}>{active.title}</h2>
                    <p style={{ fontSize: '0.82rem', opacity: 0.7, marginBottom: 0 }}>{active.description}</p>
                  </div>
                  <div style={{ border: '1px solid #ddd', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '1.5rem', background: 'white' }}>
                    {active.sections.map(sec => {
                      const secFields = active.fields.filter(f => f.section === sec.id);
                      if (secFields.length === 0) return null;
                      return (
                        <div key={sec.id} style={{ marginBottom: '2rem' }}>
                          <h3 style={{ color: '#1C2B3A', borderBottom: '2px solid #C0533A', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
                            {sec.title}
                          </h3>
                          {secFields.map(field => (
                            <div key={field.id} style={{ marginBottom: '1.25rem' }}>
                              <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: '0.9rem' }}>
                                {field.label}
                                {field.required && <span style={{ color: '#C0533A', marginLeft: 4 }}>*</span>}
                              </label>
                              {field.hint && <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 6 }}>{field.hint}</p>}

                              {field.type === 'text' && <input placeholder={field.placeholder || 'Enter text...'} style={{ ...inputStyle, background: '#f8f7f4' }} readOnly />}
                              {field.type === 'number' && <input type="number" placeholder={`${field.min || ''}–${field.max || ''}`} style={{ ...inputStyle, background: '#f8f7f4' }} readOnly />}
                              {field.type === 'date' && <input type="date" style={{ ...inputStyle, background: '#f8f7f4' }} readOnly />}
                              {field.type === 'textarea' && <textarea rows={3} placeholder="Enter long text..." style={{ ...inputStyle, resize: 'none', background: '#f8f7f4' }} readOnly />}
                              {field.type === 'checkbox' && (
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'default' }}>
                                  <input type="checkbox" disabled /> Yes
                                </label>
                              )}
                              {field.type === 'gps' && (
                                <div style={{ padding: '0.75rem', background: '#f0f4f8', borderRadius: 6, fontSize: '0.85rem', color: '#888' }}>
                                  📍 GPS coordinates will be captured automatically
                                </div>
                              )}
                              {field.type === 'photo' && (
                                <div style={{ padding: '0.75rem', background: '#f0f4f8', borderRadius: 6, fontSize: '0.85rem', color: '#888' }}>
                                  📷 Photo / image upload
                                </div>
                              )}
                              {field.type === 'signature' && (
                                <div style={{ padding: '0.75rem', background: '#f0f4f8', borderRadius: 6, fontSize: '0.85rem', color: '#888', height: 80 }}>
                                  ✍️ Signature capture area
                                </div>
                              )}
                              {['select'].includes(field.type) && (
                                <select style={{ ...inputStyle, background: '#f8f7f4' }} disabled>
                                  <option value="">Select...</option>
                                  {field.options.map(o => <option key={o}>{o}</option>)}
                                </select>
                              )}
                              {['radio'].includes(field.type) && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                  {field.options.map(o => (
                                    <label key={o} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'default', fontSize: '0.88rem' }}>
                                      <input type="radio" name={field.id} disabled /> {o}
                                    </label>
                                  ))}
                                </div>
                              )}
                              {['multiselect'].includes(field.type) && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                  {field.options.map(o => (
                                    <label key={o} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'default', fontSize: '0.88rem' }}>
                                      <input type="checkbox" disabled /> {o}
                                    </label>
                                  ))}
                                </div>
                              )}
                              {field.type === 'scale' && (
                                <div>
                                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: 4 }}>
                                    {Array.from({ length: parseInt(field.max || '5') - parseInt(field.min || '1') + 1 }, (_, i) => parseInt(field.min || '1') + i).map(n => (
                                      <button key={n} style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #ddd', background: 'white', cursor: 'default', fontWeight: 700, fontSize: '0.82rem' }}>
                                        {n}
                                      </button>
                                    ))}
                                  </div>
                                  {field.placeholder && <p style={{ fontSize: '0.72rem', color: '#888', marginBottom: 0 }}>{field.placeholder}</p>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* EXPORT TAB */}
              {activeTab === 'export' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  {[
                    {
                      icon: '📱', title: 'XLSForm (ODK/KoboToolbox)',
                      desc: 'Export as XLSForm CSV compatible with ODK Collect, KoboToolbox, and SurveyCTO. Load directly into your mobile data collection app.',
                      action: exportXLSForm,
                      label: 'Download XLSForm',
                      color: '#1C2B3A',
                    },
                    {
                      icon: '📋', title: 'Variable Codebook',
                      desc: 'Export a variable-level codebook CSV with field names, labels, types, valid ranges and response options — ready for your data dictionary.',
                      action: exportCodebook,
                      label: 'Download Codebook',
                      color: '#5A8A6A',
                    },
                    {
                      icon: '💻', title: 'JSON Schema',
                      desc: 'Export the complete form definition as JSON. Useful for programmatic integration, version control, or importing into another system.',
                      action: exportJSON,
                      label: 'Download JSON',
                      color: '#C0533A',
                    },
                  ].map(exp => (
                    <div key={exp.title} className="card" style={{ textAlign: 'center', borderTop: `3px solid ${exp.color}` }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{exp.icon}</div>
                      <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: exp.color }}>{exp.title}</h3>
                      <p style={{ fontSize: '0.82rem', color: '#666', marginBottom: '1.25rem', lineHeight: 1.5 }}>{exp.desc}</p>
                      <button className="btn btn-primary" onClick={exp.action}
                        style={{ width: '100%', background: exp.color, fontSize: '0.85rem' }}>
                        ⬇️ {exp.label}
                      </button>
                    </div>
                  ))}

                  <div className="card" style={{ gridColumn: '1/-1', background: '#f8f7f4' }}>
                    <h3 style={{ marginBottom: '0.75rem' }}>Form Summary</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
                      {[
                        { label: 'Total Fields',  value: active.fields.length },
                        { label: 'Required',      value: active.fields.filter(f => f.required).length },
                        { label: 'Sections',      value: active.sections.length },
                        { label: 'Language',      value: active.language },
                      ].map(item => (
                        <div key={item.label} style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1C2B3A', marginBottom: 2 }}>{item.value}</p>
                          <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: 0 }}>{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
