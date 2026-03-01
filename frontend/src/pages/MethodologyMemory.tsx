import React, { useState, useEffect } from 'react';
import { methodologyApi } from '../services/api';

const STUDY_TYPES: Record<string, string> = {
  retrospective_cohort: 'Retrospective Cohort',
  case_control:         'Case Control',
  cross_sectional:      'Cross Sectional',
  rct:                  'Randomised Controlled Trial',
  observational:        'Observational Study',
};

export default function MethodologyMemory({ user }: { user: any }) {
  const [templates, setTemplates]        = useState<any[]>([]);
  const [community, setCommunity]        = useState<any[]>([]);
  const [activeTab, setActiveTab]        = useState('my');
  const [loading, setLoading]            = useState(false);
  const [error, setError]                = useState('');
  const [showForm, setShowForm]          = useState(false);
  const [selectedTemplate, setSelected] = useState<any>(null);

  const [form, setForm] = useState({
    name:              '',
    description:       '',
    study_type:        'retrospective_cohort',
    outcome_column:    '',
    predictor_columns: '',
    research_question: '',
    is_public:         false,
  });

  useEffect(() => {
    loadTemplates();
    loadCommunity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTemplates() {
    setLoading(true);
    try {
      const data = await methodologyApi.getTemplates(user.email);
      setTemplates(data);
    } catch (err: any) {
      setError('Failed to load templates');
    }
    setLoading(false);
  }

  async function loadCommunity() {
    try {
      const data = await methodologyApi.getCommunityTemplates();
      setCommunity(data);
    } catch (err: any) {
      console.error('Failed to load community templates');
    }
  }

  async function handleSave() {
    if (!form.name || !form.outcome_column) {
      setError('Name and outcome column are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await methodologyApi.saveTemplate({
        ...form,
        predictor_columns: form.predictor_columns.split(',').map((s: string) => s.trim()).filter(Boolean),
        user_email:   user.email,
        organisation: user.organisation || '',
      });
      setShowForm(false);
      setForm({
        name: '', description: '', study_type: 'retrospective_cohort',
        outcome_column: '', predictor_columns: '', research_question: '', is_public: false,
      });
      loadTemplates();
    } catch (err: any) {
      setError('Failed to save template');
    }
    setLoading(false);
  }

  async function handleDelete(templateId: string) {
    try {
      await methodologyApi.deleteTemplate(templateId, user.email);
      loadTemplates();
    } catch (err: any) {
      setError('Failed to delete template');
    }
  }

  async function handleLoad(templateId: string) {
    try {
      const template = await methodologyApi.loadTemplate(templateId);
      setSelected(template);
    } catch (err: any) {
      setError('Failed to load template');
    }
  }

  const displayTemplates = activeTab === 'my' ? templates : community;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ color: '#1C2B3A', marginBottom: 0 }}>Methodology Memory</h1>
          <p style={{ marginBottom: 0 }}>Save, reuse and share study designs across projects.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Save New Template'}
        </button>
      </div>

      {error && <div className="alert alert-critical">{error}</div>}

      {selectedTemplate && (
        <div className="card" style={{ borderTop: '4px solid #5A8A6A', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ marginBottom: 0 }}>Template Loaded: {selectedTemplate.name}</h2>
            <button className="btn btn-navy" onClick={() => setSelected(null)}>Dismiss</button>
          </div>
          <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Study Type</p>
              <p style={{ color: '#555' }}>{STUDY_TYPES[selectedTemplate.study_type] || selectedTemplate.study_type}</p>
            </div>
            <div>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Outcome Column</p>
              <p style={{ color: '#C0533A' }}>{selectedTemplate.outcome_column}</p>
            </div>
            <div>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Predictor Columns</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {selectedTemplate.predictor_columns.map((p: string) => (
                  <span key={p} className="badge badge-blue">{p}</span>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Research Question</p>
              <p style={{ color: '#555', fontSize: '0.9rem' }}>{selectedTemplate.research_question || 'Not specified'}</p>
            </div>
          </div>
          <div className="alert alert-success" style={{ marginTop: '1rem' }}>
            Use these settings in the Student Wizard or NGO Pipeline to replicate this study design.
          </div>
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem', borderTop: '4px solid #C0533A' }}>
          <h2>Save Study Design as Template</h2>
          <div className="grid-2">
            <div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Template Name *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                placeholder="e.g. CHW Intervention Evaluation"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }} />
            </div>
            <div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Study Type</label>
              <select value={form.study_type} onChange={e => setForm({...form, study_type: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }}>
                {Object.entries(STUDY_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Outcome Column *</label>
              <input value={form.outcome_column} onChange={e => setForm({...form, outcome_column: e.target.value})}
                placeholder="e.g. outcome, mortality, recovered"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }} />
            </div>
            <div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Predictor Columns</label>
              <input value={form.predictor_columns} onChange={e => setForm({...form, predictor_columns: e.target.value})}
                placeholder="age, sex, treatment, district (comma separated)"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }} />
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Research Question</label>
            <textarea value={form.research_question} onChange={e => setForm({...form, research_question: e.target.value})}
              placeholder="e.g. Does the CHW intervention reduce child mortality in rural Tanzania?"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem', minHeight: 70 }} />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Brief description of this study design"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem', minHeight: 60 }} />
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input type="checkbox" id="isPublic" checked={form.is_public}
              onChange={e => setForm({...form, is_public: e.target.checked})} />
            <label htmlFor="isPublic" style={{ fontWeight: 600 }}>
              Share with community (visible to all ResearchFlow users)
            </label>
          </div>
          <button className="btn btn-primary btn-full" style={{ marginTop: '1.5rem' }}
            onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { id: 'my',        label: 'My Templates',        count: templates.length },
          { id: 'community', label: 'Community Templates', count: community.length },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="btn" style={{
              background: activeTab === tab.id ? '#1C2B3A' : '#eee',
              color: activeTab === tab.id ? 'white' : '#444',
              padding: '0.5rem 1.2rem'
            }}>
            {tab.label}
            <span style={{
              marginLeft: '0.5rem',
              background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : '#ddd',
              padding: '0.1rem 0.5rem', borderRadius: 10, fontSize: '0.8rem'
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading && <p style={{ textAlign: 'center', color: '#888' }}>Loading templates...</p>}

      {!loading && displayTemplates.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧬</div>
          <h2>{activeTab === 'my' ? 'No saved templates yet' : 'No community templates yet'}</h2>
          <p>
            {activeTab === 'my'
              ? 'Save a study design as a template to reuse it across projects.'
              : 'Be the first to share a study design with the community.'}
          </p>
          {activeTab === 'my' && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              Save First Template
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {displayTemplates.map((t: any) => (
          <div key={t.id} className="card" style={{ borderLeft: '4px solid #C0533A' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: '#1C2B3A', marginBottom: 4 }}>{t.name}</h3>
                <span className="badge badge-blue" style={{ marginBottom: 8 }}>
                  {STUDY_TYPES[t.study_type] || t.study_type}
                </span>
              </div>
              {t.is_public && (
                <span className="badge badge-green" style={{ marginLeft: 8 }}>Public</span>
              )}
            </div>
            {t.description && (
              <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: 8 }}>{t.description}</p>
            )}
            {t.research_question && (
              <p style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic', marginBottom: 8 }}>
                "{t.research_question}"
              </p>
            )}
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>Outcome</p>
              <span style={{ color: '#C0533A', fontWeight: 600 }}>{t.outcome_column}</span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>Predictors</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {t.predictor_columns.map((p: string) => (
                  <span key={p} className="badge badge-blue" style={{ fontSize: '0.78rem' }}>{p}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button className="btn" style={{ flex: 1, background: '#5A8A6A', color: 'white' }}
                onClick={() => handleLoad(t.id)}>
                Load Template
              </button>
              {t.user_email === user.email && (
                <button onClick={() => handleDelete(t.id)} style={{
                  background: 'transparent', border: '1px solid #f44336',
                  color: '#f44336', padding: '0.4rem 0.8rem', borderRadius: 6, cursor: 'pointer'
                }}>
                  Delete
                </button>
              )}
              <span style={{ fontSize: '0.75rem', color: '#aaa', marginLeft: 'auto' }}>
                Used {t.use_count}x
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
