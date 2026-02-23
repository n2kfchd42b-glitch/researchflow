import React, { useState } from 'react';

function normalCDF(z: number): number {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-z*z);
  return 0.5 * (1.0 + sign * y);
}

function zScore(p: number): number {
  if (p === 0.95) return 1.645;
  if (p === 0.975) return 1.96;
  if (p === 0.995) return 2.576;
  if (p === 0.80)  return 0.842;
  if (p === 0.85)  return 1.036;
  if (p === 0.90)  return 1.282;
  return 1.96;
}

function calcTwoProportions(p1: number, p2: number, alpha: number, power: number): number {
  const za = zScore(1 - alpha / 2);
  const zb = zScore(power);
  const pbar = (p1 + p2) / 2;
  const n = Math.pow(za * Math.sqrt(2 * pbar * (1 - pbar)) + zb * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2) / Math.pow(p1 - p2, 2);
  return Math.ceil(n);
}

function calcTwoMeans(sd: number, delta: number, alpha: number, power: number): number {
  const za = zScore(1 - alpha / 2);
  const zb = zScore(power);
  const n = Math.pow((za + zb) * sd / delta, 2) * 2;
  return Math.ceil(n);
}

function calcOneProportion(p0: number, p1: number, alpha: number, power: number): number {
  const za = zScore(1 - alpha / 2);
  const zb = zScore(power);
  const n = Math.pow(za * Math.sqrt(p0 * (1 - p0)) + zb * Math.sqrt(p1 * (1 - p1)), 2) / Math.pow(p1 - p0, 2);
  return Math.ceil(n);
}

function calcSurvival(hr: number, alpha: number, power: number, pEvent: number): number {
  const za = zScore(1 - alpha / 2);
  const zb = zScore(power);
  const events = Math.pow(za + zb, 2) / Math.pow(Math.log(hr), 2);
  const n = Math.ceil(events / pEvent);
  return n * 2;
}

const DESIGNS = [
  { id: 'two_proportions', label: 'Two Proportions', icon: '📊', desc: 'Compare binary outcomes between two groups (e.g. mortality rates)' },
  { id: 'two_means',       label: 'Two Means',       icon: '📈', desc: 'Compare continuous outcomes between two groups (e.g. blood pressure)' },
  { id: 'one_proportion',  label: 'One Proportion',  icon: '🎯', desc: 'Test a proportion against a known value' },
  { id: 'survival',        label: 'Survival Study',  icon: '⏱️', desc: 'Time-to-event analysis with hazard ratio' },
];

export default function SampleSize() {
  const [design, setDesign]   = useState('two_proportions');
  const [alpha, setAlpha]     = useState(0.05);
  const [power, setPower]     = useState(0.80);
  const [result, setResult]   = useState<any>(null);

  const [p1, setP1]           = useState(0.30);
  const [p2, setP2]           = useState(0.50);
  const [sd, setSd]           = useState(10);
  const [delta, setDelta]     = useState(5);
  const [p0, setP0]           = useState(0.30);
  const [p1b, setP1b]         = useState(0.50);
  const [hr, setHr]           = useState(0.70);
  const [pEvent, setPEvent]   = useState(0.30);

  function calculate() {
    let n = 0;
    let explanation = '';
    let perGroup = 0;

    if (design === 'two_proportions') {
      perGroup = calcTwoProportions(p1, p2, alpha, power);
      n = perGroup * 2;
      explanation = `To detect a difference between ${(p1*100).toFixed(0)}% and ${(p2*100).toFixed(0)}% with ${(power*100).toFixed(0)}% power at α=${alpha}, you need ${perGroup} participants per group.`;
    } else if (design === 'two_means') {
      perGroup = calcTwoMeans(sd, delta, alpha, power);
      n = perGroup * 2;
      explanation = `To detect a mean difference of ${delta} (SD=${sd}) with ${(power*100).toFixed(0)}% power at α=${alpha}, you need ${perGroup} participants per group.`;
    } else if (design === 'one_proportion') {
      n = calcOneProportion(p0, p1b, alpha, power);
      perGroup = n;
      explanation = `To detect a change from ${(p0*100).toFixed(0)}% to ${(p1b*100).toFixed(0)}% with ${(power*100).toFixed(0)}% power at α=${alpha}, you need ${n} participants.`;
    } else if (design === 'survival') {
      n = calcSurvival(hr, alpha, power, pEvent);
      perGroup = Math.ceil(n / 2);
      explanation = `To detect a hazard ratio of ${hr} with ${(power*100).toFixed(0)}% power at α=${alpha} and ${(pEvent*100).toFixed(0)}% event rate, you need ${perGroup} participants per group.`;
    }

    const dropout = Math.ceil(n * 1.20);
    const attrition15 = Math.ceil(n * 1.15);

    setResult({
      n, perGroup, dropout, attrition15, explanation,
      design, alpha, power,
      feasible: n < 500 ? 'Feasible' : n < 2000 ? 'Challenging' : 'Large study',
      feasibleColor: n < 500 ? '#4caf50' : n < 2000 ? '#ff9800' : '#f44336',
    });
  }

  return (
    <div className="page">
      <h1 style={{ color: '#1C2B3A' }}>Sample Size Calculator</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        Calculate the number of participants needed for your study before data collection.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <div className="card">
            <h2>Study Design</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {DESIGNS.map(d => (
                <div key={d.id} onClick={() => { setDesign(d.id); setResult(null); }} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.75rem', borderRadius: 8, cursor: 'pointer',
                  border: '2px solid ' + (design === d.id ? '#C0533A' : '#eee'),
                  background: design === d.id ? '#fff5f3' : 'white'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>{d.icon}</span>
                  <div>
                    <p style={{ fontWeight: 700, marginBottom: 2, color: design === d.id ? '#C0533A' : '#1C2B3A' }}>{d.label}</p>
                    <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 0 }}>{d.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2>Statistical Parameters</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Significance Level (α)
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[0.01, 0.05, 0.10].map(a => (
                  <button key={a} onClick={() => setAlpha(a)} className="btn" style={{
                    flex: 1, padding: '0.5rem',
                    background: alpha === a ? '#1C2B3A' : '#eee',
                    color: alpha === a ? 'white' : '#444'
                  }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Statistical Power (1-β)
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[0.80, 0.85, 0.90].map(pw => (
                  <button key={pw} onClick={() => setPower(pw)} className="btn" style={{
                    flex: 1, padding: '0.5rem',
                    background: power === pw ? '#1C2B3A' : '#eee',
                    color: power === pw ? 'white' : '#444'
                  }}>
                    {(pw * 100).toFixed(0)}%
                  </button>
                ))}
              </div>
            </div>

            <h2>Effect Size Parameters</h2>

            {design === 'two_proportions' && (
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Proportion in Control Group
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input type="range" min="0.05" max="0.95" step="0.05"
                      value={p1} onChange={e => setP1(parseFloat(e.target.value))}
                      style={{ flex: 1 }} />
                    <span style={{ fontWeight: 700, color: '#C0533A', minWidth: 40 }}>{(p1*100).toFixed(0)}%</span>
                  </div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Proportion in Intervention Group
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input type="range" min="0.05" max="0.95" step="0.05"
                      value={p2} onChange={e => setP2(parseFloat(e.target.value))}
                      style={{ flex: 1 }} />
                    <span style={{ fontWeight: 700, color: '#5A8A6A', minWidth: 40 }}>{(p2*100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            )}

            {design === 'two_means' && (
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Standard Deviation
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input type="range" min="1" max="50" step="1"
                      value={sd} onChange={e => setSd(parseFloat(e.target.value))}
                      style={{ flex: 1 }} />
                    <span style={{ fontWeight: 700, color: '#C0533A', minWidth: 40 }}>{sd}</span>
                  </div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Minimum Detectable Difference
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input type="range" min="1" max="30" step="1"
                      value={delta} onChange={e => setDelta(parseFloat(e.target.value))}
                      style={{ flex: 1 }} />
                    <span style={{ fontWeight: 700, color: '#5A8A6A', minWidth: 40 }}>{delta}</span>
                  </div>
                </div>
              </div>
            )}

            {design === 'one_proportion' && (
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Null Hypothesis Proportion
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input type="range" min="0.05" max="0.95" step="0.05"
                      value={p0} onChange={e => setP0(parseFloat(e.target.value))}
                      style={{ flex: 1 }} />
                    <span style={{ fontWeight: 700, color: '#C0533A', minWidth: 40 }}>{(p0*100).toFixed(0)}%</span>
                  </div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Expected Proportion
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input type="range" min="0.05" max="0.95" step="0.05"
                      value={p1b} onChange={e => setP1b(parseFloat(e.target.value))}
                      style={{ flex: 1 }} />
                    <span style={{ fontWeight: 700, color: '#5A8A6A', minWidth: 40 }}>{(p1b*100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            )}

            {design === 'survival' && (
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Expected Hazard Ratio
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input type="range" min="0.30" max="0.90" step="0.05"
                      value={hr} onChange={e => setHr(parseFloat(e.target.value))}
                      style={{ flex: 1 }} />
                    <span style={{ fontWeight: 700, color: '#C0533A', minWidth: 40 }}>{hr.toFixed(2)}</span>
                  </div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Expected Event Rate
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input type="range" min="0.10" max="0.90" step="0.05"
                      value={pEvent} onChange={e => setPEvent(parseFloat(e.target.value))}
                      style={{ flex: 1 }} />
                    <span style={{ fontWeight: 700, color: '#5A8A6A', minWidth: 40 }}>{(pEvent*100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            )}

            <button className="btn btn-primary btn-full" onClick={calculate}>
              Calculate Sample Size
            </button>
          </div>
        </div>

        <div>
          {!result && (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔢</div>
              <h2>Sample Size Result</h2>
              <p>Configure your study parameters and tap Calculate to see how many participants you need.</p>
              <div className="alert alert-success" style={{ textAlign: 'left', marginTop: '1.5rem' }}>
                <strong>Why this matters:</strong> Studies with too few participants are underpowered and 
                may miss real effects. Studies with too many waste resources. This calculator finds the sweet spot.
              </div>
            </div>
          )}

          {result && (
            <div>
              <div className="card" style={{ textAlign: 'center', borderTop: '4px solid #C0533A' }}>
                <h2>Required Sample Size</h2>
                <div style={{ fontSize: '4rem', fontWeight: 700, color: '#C0533A', margin: '1rem 0' }}>
                  {result.n.toLocaleString()}
                </div>
                <p style={{ fontSize: '1rem', color: '#1C2B3A', marginBottom: '0.5rem' }}>
                  total participants
                </p>
                {result.perGroup !== result.n && (
                  <p style={{ color: '#5A8A6A', fontWeight: 600 }}>
                    {result.perGroup.toLocaleString()} per group
                  </p>
                )}
                <span style={{
                  padding: '0.4rem 1.2rem', borderRadius: 20, fontSize: '0.9rem',
                  fontWeight: 700, background: result.feasibleColor, color: 'white'
                }}>
                  {result.feasible}
                </span>
              </div>

              <div className="card">
                <h2>Accounting for Dropout</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {[
                    { label: 'Minimum (no dropout)',    n: result.n,           color: '#5A8A6A' },
                    { label: 'With 15% attrition',      n: result.attrition15, color: '#ff9800' },
                    { label: 'With 20% dropout',        n: result.dropout,     color: '#C0533A' },
                    { label: 'Per group (20% dropout)', n: Math.ceil(result.dropout/2), color: '#1C2B3A' },
                  ].map(item => (
                    <div key={item.label} style={{
                      padding: '1rem', borderRadius: 8,
                      background: '#f8f7f4', border: '1px solid #eee',
                      textAlign: 'center'
                    }}>
                      <p style={{ fontSize: '1.6rem', fontWeight: 700, color: item.color, marginBottom: 4 }}>
                        {item.n.toLocaleString()}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 0 }}>{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2>Plain Language Explanation</h2>
                <p style={{ fontSize: '0.95rem', color: '#1C2B3A', lineHeight: 1.7 }}>{result.explanation}</p>
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f4f8', borderRadius: 8 }}>
                  <p style={{ fontWeight: 600, marginBottom: 8 }}>Parameters used:</p>
                  <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: 4 }}>
                    Significance level (α): {result.alpha} — probability of false positive
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: 4 }}>
                    Power (1-β): {(result.power*100).toFixed(0)}% — probability of detecting a true effect
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: 0 }}>
                    Two-sided test assumed
                  </p>
                </div>
              </div>

              <div className="card">
                <h2>Recommendations</h2>
                {result.n < 30 && (
                  <div className="alert alert-critical">
                    Very small sample — consider increasing effect size or relaxing power requirements.
                  </div>
                )}
                {result.n >= 30 && result.n < 500 && (
                  <div className="alert alert-success">
                    Feasible sample size for a single-site study in global health.
                  </div>
                )}
                {result.n >= 500 && result.n < 2000 && (
                  <div className="alert alert-warning">
                    Multi-site recruitment likely needed. Consider cluster randomisation.
                  </div>
                )}
                {result.n >= 2000 && (
                  <div className="alert alert-critical">
                    Very large study. Consider whether effect size assumptions are realistic.
                  </div>
                )}
                <div className="alert alert-success" style={{ marginTop: '0.5rem' }}>
                  Always add 15-20% to account for dropout, loss to follow-up, and protocol deviations.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
