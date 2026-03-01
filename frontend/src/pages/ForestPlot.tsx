import React, { useState, useRef } from 'react';
import { API_URL } from '../config';

const EFFECT_TYPES = [
  { id: 'OR',  label: 'Odds Ratio (OR)',         hint: 'Logistic regression, case-control' },
  { id: 'RR',  label: 'Risk Ratio (RR)',          hint: 'Cohort studies, RCTs' },
  { id: 'HR',  label: 'Hazard Ratio (HR)',        hint: 'Survival analyses' },
  { id: 'MD',  label: 'Mean Difference (MD)',     hint: 'Continuous outcomes' },
  { id: 'SMD', label: 'Std Mean Difference (SMD)',hint: 'Different scales' },
];

const SAMPLE_STUDIES = [
  { name: 'Smith 2018',   year: 2018, effect_size: 0.45,  se: 0.18, n: 245  },
  { name: 'Jones 2019',   year: 2019, effect_size: 0.62,  se: 0.21, n: 189  },
  { name: 'Patel 2020',   year: 2020, effect_size: 0.38,  se: 0.15, n: 412  },
  { name: 'Müller 2020',  year: 2020, effect_size: 0.71,  se: 0.24, n: 156  },
  { name: 'Okonkwo 2021', year: 2021, effect_size: 0.52,  se: 0.19, n: 298  },
  { name: 'Chen 2022',    year: 2022, effect_size: 0.44,  se: 0.16, n: 334  },
];

export default function ForestPlot() {
  const [effectType, setEffectType]   = useState('OR');
  const [studies, setStudies]         = useState<any[]>(SAMPLE_STUDIES);
  const [result, setResult]           = useState<any>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [useLog]                      = useState(true);
  const [model, setModel]             = useState<'fixed'|'random'>('random');
  const plotRef                        = useRef<HTMLDivElement>(null);

  const [newStudy, setNewStudy] = useState({
    name: '', year: new Date().getFullYear(), effect_size: 0, se: 0.2, n: 100
  });

  function addStudy() {
    if (!newStudy.name) return;
    setStudies(prev => [...prev, { ...newStudy }]);
    setNewStudy({ name: '', year: new Date().getFullYear(), effect_size: 0, se: 0.2, n: 100 });
  }

  function removeStudy(i: number) {
    setStudies(prev => prev.filter((_, idx) => idx !== i));
  }

  function loadSample() {
    setStudies(SAMPLE_STUDIES);
    setResult(null);
  }

  async function runAnalysis() {
    if (studies.length < 2) {
      setError('Need at least 2 studies for meta-analysis.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/meta/analyse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studies, effect_type: effectType })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError('Analysis failed: ' + err.message);
    }
    setLoading(false);
  }

  function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      const parsed = lines.slice(1).map(line => {
        const vals = line.split(',');
        const obj: any = {};
        headers.forEach((h, i) => { obj[h] = vals[i]?.trim().replace(/"/g, '') || ''; });
        return {
          name:        obj['name'] || obj['study'] || `Study`,
          year:        parseInt(obj['year']) || 2020,
          effect_size: parseFloat(obj['effect_size'] || obj['effect'] || obj['log_or'] || obj['or']) || 0,
          se:          parseFloat(obj['se'] || obj['standard_error']) || 0.2,
          n:           parseInt(obj['n'] || obj['sample_size']) || 0,
        };
      }).filter(s => s.name && !isNaN(s.effect_size));
      setStudies(parsed);
    };
    reader.readAsText(file);
  }

  const pooledResult = result ? result[model] : null;
  const isRatio = ['OR', 'RR', 'HR'].includes(effectType);

  function displayEffect(val: number) {
    if (isRatio && useLog) return Math.exp(val).toFixed(2);
    return val.toFixed(3);
  }

  function displayCI(low: number, high: number) {
    if (isRatio && useLog) return `${Math.exp(low).toFixed(2)}–${Math.exp(high).toFixed(2)}`;
    return `${low.toFixed(3)}–${high.toFixed(3)}`;
  }

  // SVG Forest Plot
  function renderForestPlot() {
    if (!result) return null;
    const svgWidth  = 700;
    const rowHeight = 28;
    const topPad    = 40;
    const leftPad   = 180;
    const rightPad  = 160;
    const plotWidth = svgWidth - leftPad - rightPad;
    const n         = result.studies.length;
    const svgHeight = topPad + (n + 3) * rowHeight + 60;

    const allEffects = result.studies.map((s: any) =>
      isRatio && useLog ? Math.exp(s.ci_low) : s.ci_low
    ).concat(result.studies.map((s: any) =>
      isRatio && useLog ? Math.exp(s.ci_high) : s.ci_high
    ));
    const xMin = Math.max(0.05, Math.min(...allEffects) * 0.8);
    const xMax = Math.max(...allEffects) * 1.2;
    const nullLine = isRatio ? 1.0 : 0.0;

    function xScale(val: number) {
      const logMin = Math.log(xMin);
      const logMax = Math.log(xMax);
      const frac   = isRatio
        ? (Math.log(val) - logMin) / (logMax - logMin)
        : (val - xMin) / (xMax - xMin);
      return leftPad + frac * plotWidth;
    }

    const pooled = result[model];

    return (
      <svg width="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ fontFamily: 'Georgia, serif', background: 'white' }}>
        {/* Title */}
        <text x={svgWidth/2} y={20} textAnchor="middle" fontSize={13} fontWeight="bold" fill="#1C2B3A">
          Forest Plot — {effectType} ({model === 'random' ? 'Random' : 'Fixed'} Effects)
        </text>

        {/* Column headers */}
        <text x={10}            y={topPad - 6} fontSize={10} fill="#888">Study</text>
        <text x={leftPad + plotWidth/2} y={topPad - 6} textAnchor="middle" fontSize={10} fill="#888">{effectType}</text>
        <text x={svgWidth - rightPad + 10} y={topPad - 6} fontSize={10} fill="#888">{effectType} (95% CI)</text>
        <text x={svgWidth - 40}  y={topPad - 6} textAnchor="middle" fontSize={10} fill="#888">Weight</text>

        {/* Null line */}
        <line x1={xScale(nullLine)} y1={topPad - 10} x2={xScale(nullLine)} y2={svgHeight - 50}
          stroke="#ccc" strokeWidth={1} strokeDasharray="4 3" />

        {/* Studies */}
        {result.studies.map((s: any, i: number) => {
          const y      = topPad + i * rowHeight + rowHeight / 2;
          const xEff   = xScale(isRatio && useLog ? Math.exp(s.effect_size) : s.effect_size);
          const xLow   = xScale(isRatio && useLog ? Math.exp(s.ci_low)  : s.ci_low);
          const xHigh  = xScale(isRatio && useLog ? Math.exp(s.ci_high) : s.ci_high);
          const wt     = model === 'random' ? s.weight_random : s.weight_fixed;
          const boxSize = Math.max(4, Math.min(12, wt / 4));

          return (
            <g key={i}>
              <text x={leftPad - 5} y={y + 4} textAnchor="end" fontSize={10} fill="#333">
                {s.name}{s.year ? ` (${s.year})` : ''}
              </text>
              <line x1={xLow} y1={y} x2={xHigh} y2={y} stroke="#1C2B3A" strokeWidth={1.5} />
              <line x1={xLow}  y1={y-4} x2={xLow}  y2={y+4} stroke="#1C2B3A" strokeWidth={1.5} />
              <line x1={xHigh} y1={y-4} x2={xHigh} y2={y+4} stroke="#1C2B3A" strokeWidth={1.5} />
              <rect x={xEff - boxSize/2} y={y - boxSize/2} width={boxSize} height={boxSize}
                fill="#C0533A" stroke="#C0533A" />
              <text x={svgWidth - rightPad + 10} y={y + 4} fontSize={10} fill="#333">
                {displayEffect(s.effect_size)} ({displayCI(s.ci_low, s.ci_high)})
              </text>
              <text x={svgWidth - 40} y={y + 4} textAnchor="middle" fontSize={10} fill="#888">
                {wt.toFixed(1)}%
              </text>
            </g>
          );
        })}

        {/* Separator */}
        <line x1={leftPad} y1={topPad + n * rowHeight + 8}
          x2={svgWidth - rightPad} y2={topPad + n * rowHeight + 8}
          stroke="#ccc" strokeWidth={1} />

        {/* Pooled diamond */}
        {pooled && (() => {
          const yP     = topPad + (n + 1.5) * rowHeight;
          const xPE    = xScale(isRatio && useLog ? Math.exp(pooled.pooled) : pooled.pooled);
          const xPLow  = xScale(isRatio && useLog ? Math.exp(pooled.ci_low)  : pooled.ci_low);
          const xPHigh = xScale(isRatio && useLog ? Math.exp(pooled.ci_high) : pooled.ci_high);
          return (
            <g>
              <text x={leftPad - 5} y={yP + 4} textAnchor="end" fontSize={11} fontWeight="bold" fill="#1C2B3A">
                Pooled ({model})
              </text>
              <polygon
                points={`${xPLow},${yP} ${xPE},${yP-10} ${xPHigh},${yP} ${xPE},${yP+10}`}
                fill="#5A8A6A" stroke="#5A8A6A" opacity={0.85} />
              <text x={svgWidth - rightPad + 10} y={yP + 4} fontSize={11} fontWeight="bold" fill="#1C2B3A">
                {displayEffect(pooled.pooled)} ({displayCI(pooled.ci_low, pooled.ci_high)})
              </text>
              <text x={svgWidth - 40} y={yP + 4} textAnchor="middle" fontSize={10} fontWeight="bold" fill="#1C2B3A">
                100%
              </text>
            </g>
          );
        })()}

        {/* Heterogeneity footer */}
        <text x={leftPad} y={svgHeight - 20} fontSize={9} fill="#888">
          {`Heterogeneity: I² = ${result.heterogeneity.I2}%, Q = ${result.heterogeneity.Q} (p = ${result.heterogeneity.p_Q}), τ² = ${result.heterogeneity.tau2}`}
        </text>
        <text x={leftPad} y={svgHeight - 8} fontSize={9} fill="#888">
          {`Test for overall effect: Z = ${pooled?.z}, p = ${pooled?.p}`}
        </text>

        {/* X axis */}
        {[xMin, nullLine, xMax].map((val, i) => (
          <g key={i}>
            <line x1={xScale(val)} y1={svgHeight - 45} x2={xScale(val)} y2={svgHeight - 40} stroke="#888" strokeWidth={1} />
            <text x={xScale(val)} y={svgHeight - 30} textAnchor="middle" fontSize={9} fill="#888">
              {isRatio ? val.toFixed(2) : val.toFixed(1)}
            </text>
          </g>
        ))}
        <text x={xScale(nullLine) - 40} y={svgHeight - 15} fontSize={9} fill="#888">
          Favours control
        </text>
        <text x={xScale(nullLine) + 10} y={svgHeight - 15} fontSize={9} fill="#888">
          Favours treatment
        </text>
      </svg>
    );
  }

  return (
    <div className="page">
      <h1 style={{ color: '#1C2B3A' }}>Forest Plot — Meta-Analysis</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        Pool effect sizes across studies, assess heterogeneity and generate publication-ready forest plots.
      </p>

      {error && <div className="alert alert-critical">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>
        <div>
          <div className="card">
            <h2>Effect Measure</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
              {EFFECT_TYPES.map(et => (
                <label key={et.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 6, cursor: 'pointer', background: effectType === et.id ? '#fff5f3' : 'transparent', border: '1px solid ' + (effectType === et.id ? '#C0533A' : 'transparent') }}>
                  <input type="radio" name="effect" value={et.id} checked={effectType === et.id} onChange={() => setEffectType(et.id)} />
                  <div>
                    <p style={{ fontWeight: 700, marginBottom: 0, fontSize: '0.85rem', color: effectType === et.id ? '#C0533A' : '#1C2B3A' }}>{et.label}</p>
                    <p style={{ fontSize: '0.72rem', color: '#888', marginBottom: 0 }}>{et.hint}</p>
                  </div>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={model === 'random'} onChange={e => setModel(e.target.checked ? 'random' : 'fixed')} />
                Random effects model
              </label>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ marginBottom: 0 }}>Studies ({studies.length})</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn" style={{ background: '#eee', color: '#444', padding: '0.3rem 0.7rem', fontSize: '0.78rem' }} onClick={loadSample}>
                  Load Sample
                </button>
                <label className="btn" style={{ background: '#eee', color: '#444', padding: '0.3rem 0.7rem', fontSize: '0.78rem', cursor: 'pointer' }}>
                  Upload CSV
                  <input type="file" accept=".csv" onChange={handleCSV} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: '1rem' }}>
              {studies.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.5rem', background: i % 2 === 0 ? '#f8f7f4' : 'white', borderRadius: 4, marginBottom: 2 }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{s.name}</span>
                    <span style={{ fontSize: '0.72rem', color: '#888', marginLeft: 6 }}>
                      ES={s.effect_size} SE={s.se}
                    </span>
                  </div>
                  <button onClick={() => removeStudy(i)} style={{ background: 'none', border: 'none', color: '#f44336', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}>×</button>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '0.75rem' }}>
              <p style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.5rem' }}>Add Study</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <input value={newStudy.name} onChange={e => setNewStudy(p => ({ ...p, name: e.target.value }))}
                  placeholder="Author Year" style={{ padding: '0.4rem', borderRadius: 4, border: '1px solid #ccc', fontSize: '0.82rem' }} />
                <input type="number" value={newStudy.year} onChange={e => setNewStudy(p => ({ ...p, year: parseInt(e.target.value) }))}
                  placeholder="Year" style={{ padding: '0.4rem', borderRadius: 4, border: '1px solid #ccc', fontSize: '0.82rem' }} />
                <input type="number" step="0.01" value={newStudy.effect_size} onChange={e => setNewStudy(p => ({ ...p, effect_size: parseFloat(e.target.value) }))}
                  placeholder="Effect (log)" style={{ padding: '0.4rem', borderRadius: 4, border: '1px solid #ccc', fontSize: '0.82rem' }} />
                <input type="number" step="0.01" value={newStudy.se} onChange={e => setNewStudy(p => ({ ...p, se: parseFloat(e.target.value) }))}
                  placeholder="SE" style={{ padding: '0.4rem', borderRadius: 4, border: '1px solid #ccc', fontSize: '0.82rem' }} />
                <input type="number" value={newStudy.n} onChange={e => setNewStudy(p => ({ ...p, n: parseInt(e.target.value) }))}
                  placeholder="N" style={{ padding: '0.4rem', borderRadius: 4, border: '1px solid #ccc', fontSize: '0.82rem' }} />
              </div>
              <button className="btn btn-sage" onClick={addStudy} disabled={!newStudy.name}
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}>
                + Add Study
              </button>
            </div>
          </div>

          <button className="btn btn-primary btn-full" onClick={runAnalysis}
            disabled={studies.length < 2 || loading}>
            {loading ? 'Computing...' : '🌲 Generate Forest Plot'}
          </button>
        </div>

        <div>
          {!result && (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌲</div>
              <h2>Forest Plot</h2>
              <p>Add your studies on the left and tap Generate Forest Plot.</p>
              <div className="alert alert-success" style={{ textAlign: 'left', marginTop: '1.5rem' }}>
                <strong>CSV format:</strong> Upload a CSV with columns: name, year, effect_size, se, n
              </div>
            </div>
          )}

          {result && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                {[
                  { label: 'Studies',      value: result.n_studies,                           color: '#1C2B3A' },
                  { label: `Pooled ${effectType}`, value: pooledResult ? displayEffect(pooledResult.pooled) : '—', color: '#5A8A6A' },
                  { label: 'I² (heterogeneity)', value: result.heterogeneity.I2 + '%',        color: result.heterogeneity.I2 > 50 ? '#f44336' : '#5A8A6A' },
                ].map(item => (
                  <div key={item.label} className="card" style={{ textAlign: 'center', padding: '0.75rem' }}>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: item.color, marginBottom: 2 }}>{item.value}</p>
                    <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: 0 }}>{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="card" style={{ marginBottom: '1rem', overflowX: 'auto' }} ref={plotRef}>
                {renderForestPlot()}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="card">
                  <h2>Pooled Effects</h2>
                  {['fixed', 'random'].map(m => {
                    const r = result[m];
                    return (
                      <div key={m} style={{ padding: '0.75rem', background: model === m ? '#f0f4f8' : '#f8f7f4', borderRadius: 8, marginBottom: '0.5rem', border: model === m ? '2px solid #1C2B3A' : '1px solid #eee' }}>
                        <p style={{ fontWeight: 700, marginBottom: 4, textTransform: 'capitalize' }}>
                          {m} Effects {model === m && '✓'}
                        </p>
                        <p style={{ fontSize: '0.85rem', marginBottom: 2 }}>
                          {effectType}: <strong>{displayEffect(r.pooled)}</strong> ({displayCI(r.ci_low, r.ci_high)})
                        </p>
                        <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: 0 }}>
                          Z = {r.z}, p = {r.p < 0.001 ? '<0.001' : r.p}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="card">
                  <h2>Heterogeneity</h2>
                  {[
                    { label: 'I²',             value: result.heterogeneity.I2 + '%',   color: result.heterogeneity.I2 > 50 ? '#f44336' : '#5A8A6A' },
                    { label: 'Q statistic',    value: result.heterogeneity.Q,           color: '#1C2B3A' },
                    { label: 'p (Q)',          value: result.heterogeneity.p_Q,         color: result.heterogeneity.p_Q < 0.05 ? '#f44336' : '#5A8A6A' },
                    { label: 'τ²',             value: result.heterogeneity.tau2,        color: '#1C2B3A' },
                    { label: 'Interpretation', value: result.heterogeneity.interpretation, color: '#1C2B3A' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ fontSize: '0.85rem', color: '#888' }}>{item.label}</span>
                      <span style={{ fontWeight: 700, color: item.color, fontSize: '0.85rem' }}>{item.value}</span>
                    </div>
                  ))}
                  {result.egger_p !== null && (
                    <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#f8f7f4', borderRadius: 6 }}>
                      <p style={{ fontSize: '0.82rem', marginBottom: 0 }}>
                        Egger's test: p = <strong style={{ color: result.egger_p < 0.05 ? '#f44336' : '#5A8A6A' }}>{result.egger_p}</strong>
                        {result.egger_p < 0.05 ? ' — possible publication bias' : ' — no publication bias detected'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="card" style={{ marginTop: '1rem' }}>
                <h2>Methods Text</h2>
                <div style={{ background: '#f8f7f4', borderRadius: 8, padding: '1rem', fontSize: '0.88rem', lineHeight: 1.8, color: '#333' }}>
                  A meta-analysis of {result.n_studies} studies was conducted using {model} effects model
                  with inverse variance weighting (DerSimonian-Laird method).
                  The pooled {effectType} was {displayEffect(pooledResult?.pooled || 0)}
                  (95% CI: {displayCI(pooledResult?.ci_low || 0, pooledResult?.ci_high || 0)},
                  p = {pooledResult?.p < 0.001 ? '<0.001' : pooledResult?.p}).
                  Heterogeneity was {result.heterogeneity.interpretation.toLowerCase()}
                  (I² = {result.heterogeneity.I2}%, Q = {result.heterogeneity.Q},
                  p = {result.heterogeneity.p_Q}).
                  {result.egger_p !== null && ` Publication bias was assessed using Egger's test (p = ${result.egger_p}).`}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
