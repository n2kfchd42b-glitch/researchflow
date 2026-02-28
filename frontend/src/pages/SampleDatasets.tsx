import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8004';

const DATASETS = [
  {
    id:          'health_dataset',
    name:        'CHW Tanzania',
    file:        'health_dataset.csv',
    icon:        '🧑‍⚕️',
    color:       '#C0533A',
    description: 'Community health worker intervention study examining child mortality outcomes in rural Tanzania.',
    n:           500,
    design:      'Retrospective Cohort',
    country:     'Tanzania',
    outcome:     'Child mortality (binary)',
    tags:        ['Student Wizard', 'Guided Analysis', 'PSM', 'Descriptive Stats', 'Visualise'],
    features:    ['/student', '/guided', '/psm', '/descriptive', '/visualise'],
    variables:   ['age', 'sex', 'treatment', 'district', 'education', 'income', 'weight', 'outcome', 'follow_up', 'chw_visits'],
    highlight:   'Best for beginners — covers all core features',
  },
  {
    id:          'malaria_rct',
    name:        'Malaria RCT Kenya',
    file:        'malaria_rct_kenya.csv',
    icon:        '🦟',
    color:       '#5A8A6A',
    description: 'Randomised controlled trial of bed net intervention on malaria episodes in children under 15 in western Kenya.',
    n:           500,
    design:      'Randomised Controlled Trial',
    country:     'Kenya',
    outcome:     'Malaria episode (binary)',
    tags:        ['Student Wizard', 'PSM', 'Descriptive Stats', 'Journal Assistant', 'Visualise'],
    features:    ['/student', '/psm', '/descriptive', '/journal-assistant', '/visualise'],
    variables:   ['age', 'sex', 'district', 'treatment', 'bed_net_use', 'malaria_episode', 'weight_kg', 'fever', 'wealth_index'],
    highlight:   'Best for RCT analysis and CONSORT reporting',
  },
  {
    id:          'hiv_cohort',
    name:        'HIV Cohort Uganda',
    file:        'hiv_cohort_uganda.csv',
    icon:        '🩺',
    color:       '#1C2B3A',
    description: 'Prospective cohort of HIV-positive patients on ART in Uganda. Includes survival time, CD4 counts and viral load.',
    n:           500,
    design:      'Prospective Cohort',
    country:     'Uganda',
    outcome:     'Mortality (time-to-event)',
    tags:        ['Survival Analysis', 'Descriptive Stats', 'Guided Analysis', 'Visualise'],
    features:    ['/survival', '/descriptive', '/guided', '/visualise'],
    variables:   ['age', 'sex', 'cd4_baseline', 'art_regimen', 'time_months', 'died', 'who_stage', 'bmi'],
    highlight:   'Best for Kaplan-Meier survival analysis',
  },
  {
    id:          'ncd_steps',
    name:        'NCD STEPS Survey',
    file:        'ncd_steps_survey.csv',
    icon:        '❤️',
    color:       '#9c27b0',
    description: 'WHO STEPwise NCD risk factor survey with blood pressure, BMI, tobacco, alcohol and metabolic data.',
    n:           500,
    design:      'Cross-sectional',
    country:     'Sub-Saharan Africa',
    outcome:     'Hypertension / Diabetes',
    tags:        ['Instrument Recognition', 'Descriptive Stats', 'Visualise', 'Guided Analysis'],
    features:    ['/instrument', '/descriptive', '/visualise', '/guided'],
    variables:   ['age', 'sex', 'bmi', 'systolic_bp', 'hypertension', 'diabetes', 'tobacco_use', 'alcohol_use'],
    highlight:   'Best for NCD research and WHO STEPS instrument recognition',
  },
  {
    id:          'maternal_dhs',
    name:        'Maternal Health DHS',
    file:        'maternal_health_dhs.csv',
    icon:        '👶',
    color:       '#ff9800',
    description: 'DHS-format maternal and child health dataset with standard DHS variable codes (v001, v012, hw70 etc.).',
    n:           500,
    design:      'Cross-sectional Survey',
    country:     'Sub-Saharan Africa',
    outcome:     'Child survival (b5)',
    tags:        ['Instrument Recognition', 'Descriptive Stats', 'Cohort Builder', 'Visualise'],
    features:    ['/instrument', '/descriptive', '/cohort', '/visualise'],
    variables:   ['v012', 'v025', 'v106', 'v190', 'v313', 'b5', 'hw70', 'hw71', 'anc_visits', 'skilled_birth'],
    highlight:   'Best for DHS instrument recognition and maternal health analysis',
  },
];

export default function SampleDatasets() {
  const navigate                      = useNavigate();
  const [loading, setLoading]         = useState<string|null>(null);
  const [loaded, setLoaded]           = useState<Record<string, any>>({});
  const [error, setError]             = useState('');
  const [expanded, setExpanded]       = useState<string|null>(null);

  async function loadDataset(dataset: typeof DATASETS[0]) {
    setLoading(dataset.id);
    setError('');
    try {
      const url = `${window.location.origin}/samples/${dataset.file}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Could not fetch sample file');
      const blob = await res.blob();
      const file = new File([blob], dataset.file, { type: 'text/csv' });

      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const data = await uploadRes.json();
      setLoaded(prev => ({ ...prev, [dataset.id]: data }));
    } catch (err: any) {
      setError(`Failed to load ${dataset.name}: ${err.message}`);
    }
    setLoading(null);
  }

  function applyDataset(dataset: typeof DATASETS[0], feature: string) {
    const loadedData = loaded[dataset.id];
    if (!loadedData) return;
    sessionStorage.setItem('preloaded_dataset', JSON.stringify(loadedData));
    navigate(feature);
  }

  return (
    <div className="page">
      <h1 style={{ color: '#1C2B3A' }}>Sample Datasets</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        Explore ResearchFlow with real-world global health datasets — no upload required.
      </p>

      {error && <div className="alert alert-critical">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {DATASETS.map(dataset => {
          const isLoaded   = !!loaded[dataset.id];
          const isLoading  = loading === dataset.id;
          const isExpanded = expanded === dataset.id;

          return (
            <div key={dataset.id} className="card" style={{ borderTop: `4px solid ${dataset.color}`, transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '2.5rem' }}>{dataset.icon}</span>
                  <div>
                    <h2 style={{ color: dataset.color, marginBottom: 2 }}>{dataset.name}</h2>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-blue">{dataset.country}</span>
                      <span style={{ padding: '0.15rem 0.5rem', background: '#f0f0f0', borderRadius: 10, fontSize: '0.72rem', color: '#555' }}>
                        {dataset.design}
                      </span>
                      <span style={{ padding: '0.15rem 0.5rem', background: '#f0f0f0', borderRadius: 10, fontSize: '0.72rem', color: '#555' }}>
                        n = {dataset.n}
                      </span>
                    </div>
                  </div>
                </div>
                {isLoaded && (
                  <span style={{ fontSize: '1.2rem' }}>✅</span>
                )}
              </div>

              <p style={{ fontSize: '0.88rem', color: '#555', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                {dataset.description}
              </p>

              <div style={{ background: dataset.color + '11', borderRadius: 6, padding: '0.5rem 0.75rem', marginBottom: '0.75rem' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: dataset.color, marginBottom: 0 }}>
                  💡 {dataset.highlight}
                </p>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.4rem', fontWeight: 600 }}>WORKS WITH:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {dataset.tags.map(tag => (
                    <span key={tag} style={{ padding: '0.2rem 0.6rem', background: '#f0f0f0', borderRadius: 10, fontSize: '0.72rem', color: '#555', fontWeight: 600 }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.4rem', fontWeight: 600 }}>KEY VARIABLES:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {dataset.variables.map(v => (
                      <span key={v} style={{ padding: '0.2rem 0.6rem', background: '#fff5f3', border: '1px solid #C0533A33', borderRadius: 10, fontSize: '0.72rem', color: '#C0533A', fontWeight: 600 }}>
                        {v}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.5rem', marginBottom: 0 }}>
                    <strong>Outcome:</strong> {dataset.outcome}
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {!isLoaded ? (
                  <button className="btn btn-primary" onClick={() => loadDataset(dataset)}
                    disabled={isLoading} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                    {isLoading ? 'Loading...' : '⬇️ Load Dataset'}
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
                    {dataset.features.slice(0, 3).map((feature, i) => (
                      <button key={feature} onClick={() => applyDataset(dataset, feature)}
                        className="btn" style={{
                          fontSize: '0.78rem', padding: '0.4rem 0.8rem',
                          background: i === 0 ? dataset.color : '#eee',
                          color: i === 0 ? 'white' : '#444',
                        }}>
                        {dataset.tags[i]} →
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => setExpanded(isExpanded ? null : dataset.id)}
                  className="btn" style={{ background: 'transparent', color: '#888', fontSize: '0.78rem', padding: '0.4rem 0.6rem' }}>
                  {isExpanded ? '▲ Less' : '▼ Details'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: '1.5rem', borderLeft: '4px solid #5A8A6A' }}>
        <h2>📥 CSV Format for Meta-Analysis</h2>
        <p style={{ fontSize: '0.88rem', color: '#555', marginBottom: '1rem' }}>
          To use the Forest Plot feature, upload a CSV with these columns:
        </p>
        <div style={{ background: '#f8f7f4', borderRadius: 8, padding: '1rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
          name, year, effect_size, se, n<br/>
          Smith 2018, 2018, 0.45, 0.18, 245<br/>
          Jones 2019, 2019, 0.62, 0.21, 189<br/>
          Patel 2020, 2020, 0.38, 0.15, 412
        </div>
        <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.75rem', marginBottom: 0 }}>
          effect_size should be in log scale for OR, RR and HR. se = standard error.
        </p>
      </div>
    </div>
  );
}
