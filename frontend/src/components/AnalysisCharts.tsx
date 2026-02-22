import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ScatterChart, Scatter,
  Cell, PieChart, Pie
} from 'recharts';

const TERRA = '#C0533A';
const SAGE  = '#5A8A6A';
const NAVY  = '#1C2B3A';
const COLORS = [TERRA, SAGE, NAVY, '#E8A87C', '#7FADA0', '#4A6FA5'];

// ── Descriptive Statistics Table ──────────────────────────
export function DescriptiveStats({ uploadResult }: { uploadResult: any }) {
  if (!uploadResult) return null;
  const { numeric_summary, column_types, missing_percentage } = uploadResult;

  return (
    <div className="card">
      <h2>Descriptive Statistics</h2>
      <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
        Summary of all variables in your dataset.
      </p>

      {/* Numeric Variables */}
      {Object.keys(numeric_summary).length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: TERRA, marginBottom: '0.75rem' }}>
            Continuous Variables
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: NAVY, color: 'white' }}>
                  {['Variable','Mean','Std Dev','Min','Median','Max','Missing %'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(numeric_summary).map(([col, stats]: any, i) => (
                  <tr key={col} style={{ background: i % 2 === 0 ? '#f8f7f4' : 'white' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: NAVY }}>{col}</td>
                    <td style={{ padding: '8px 12px' }}>{stats.mean}</td>
                    <td style={{ padding: '8px 12px' }}>{stats.std}</td>
                    <td style={{ padding: '8px 12px' }}>{stats.min}</td>
                    <td style={{ padding: '8px 12px' }}>{stats.median}</td>
                    <td style={{ padding: '8px 12px' }}>{stats.max}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className={`badge badge-${
                        (missing_percentage[col] || 0) > 20 ? 'red' :
                        (missing_percentage[col] || 0) > 5  ? 'orange' : 'green'
                      }`}>
                        {missing_percentage[col] || 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Categorical Variables */}
      <div>
        <h3 style={{ color: TERRA, marginBottom: '0.75rem' }}>
          Variable Types Detected
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {Object.entries(column_types).map(([col, type]: any) => (
            <span key={col} style={{
              padding: '0.3rem 0.8rem',
              borderRadius: 20,
              fontSize: '0.8rem',
              background:
                type === 'outcome'                ? '#ffebee' :
                type === 'identifier'             ? '#e3f2fd' :
                type === 'clinical_continuous'    ? '#e8f5e9' :
                type === 'demographic_categorical'? '#fff3e0' :
                type === 'date'                   ? '#f3e5f5' : '#f5f5f5',
              color: NAVY,
              fontWeight: 600,
              border: '1px solid #ddd'
            }}>
              {col}
              <span style={{ opacity: 0.6, marginLeft: 4 }}>({type})</span>
            </span>
          ))}
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {[
            { type: 'outcome', label: 'Outcome', color: '#ffebee' },
            { type: 'identifier', label: 'Identifier', color: '#e3f2fd' },
            { type: 'clinical_continuous', label: 'Clinical', color: '#e8f5e9' },
            { type: 'demographic_categorical', label: 'Demographic', color: '#fff3e0' },
            { type: 'date', label: 'Date', color: '#f3e5f5' },
          ].map(l => (
            <span key={l.type} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 12, height: 12, borderRadius: 2, background: l.color, border: '1px solid #ddd', display: 'inline-block' }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Bivariate Analysis Charts ──────────────────────────────
export function BivariateCharts({
  uploadResult,
  outcome,
  predictors
}: {
  uploadResult: any,
  outcome: string,
  predictors: string[]
}) {
  if (!uploadResult || !outcome) return null;
  const { numeric_summary, missing_percentage } = uploadResult;

  // Missing data chart
  const missingData = Object.entries(missing_percentage)
    .map(([col, pct]: any) => ({ name: col, missing: pct, present: 100 - pct }))
    .filter(d => d.missing > 0)
    .sort((a, b) => b.missing - a.missing);

  // Numeric predictors for distribution display
  const numericPredictors = predictors.filter(p => numeric_summary[p]);

  return (
    <div>
      {/* Missing Data Overview */}
      {missingData.length > 0 && (
        <div className="card">
          <h2>Missing Data Overview</h2>
          <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
            Variables with missing values. High missingness may affect analysis quality.
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={missingData} layout="vertical"
              margin={{ top: 0, right: 30, left: 80, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]}
                tickFormatter={v => `${v}%`} fontSize={11} />
              <YAxis type="category" dataKey="name" fontSize={11} />
              <Tooltip formatter={(v: any) => `${v}%`} />
              <Bar dataKey="missing" fill={TERRA} radius={[0, 4, 4, 0]}>
                {missingData.map((_, i) => (
                  <Cell key={i} fill={_.missing > 20 ? '#f44336' : _.missing > 5 ? '#ff9800' : TERRA} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Numeric Variable Distributions */}
      {numericPredictors.length > 0 && (
        <div className="card">
          <h2>Numeric Variable Ranges</h2>
          <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
            Distribution summary for selected continuous predictors.
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={numericPredictors.map(p => ({
                name: p,
                mean:   numeric_summary[p]?.mean   || 0,
                min:    numeric_summary[p]?.min    || 0,
                max:    numeric_summary[p]?.max    || 0,
                median: numeric_summary[p]?.median || 0,
              }))}
              margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Bar dataKey="mean"   fill={TERRA} name="Mean"   radius={[4,4,0,0]} />
              <Bar dataKey="median" fill={SAGE}  name="Median" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Selected Predictors Summary */}
      <div className="card">
        <h2>Selected Variables for Analysis</h2>
        <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
          Outcome: <strong style={{ color: TERRA }}>{outcome}</strong> · 
          Predictors: <strong style={{ color: SAGE }}>{predictors.join(', ')}</strong>
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
          {predictors.map(p => (
            <div key={p} style={{
              padding: '0.75rem', borderRadius: 8,
              background: numeric_summary[p] ? '#fff5f3' : '#f3faf5',
              border: `1px solid ${numeric_summary[p] ? '#C0533A33' : '#5A8A6A33'}`
            }}>
              <p style={{ fontWeight: 700, color: NAVY, marginBottom: 4, fontSize: '0.9rem' }}>{p}</p>
              {numeric_summary[p] ? (
                <p style={{ fontSize: '0.78rem', color: '#666', marginBottom: 0 }}>
                  Mean: {numeric_summary[p].mean} · SD: {numeric_summary[p].std}
                </p>
              ) : (
                <p style={{ fontSize: '0.78rem', color: '#666', marginBottom: 0 }}>
                  Categorical variable
                </p>
              )}
              <p style={{ fontSize: '0.75rem', color: missing_percentage[p] > 10 ? '#f44336' : '#888', marginBottom: 0 }}>
                Missing: {missing_percentage[p] || 0}%
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Results Charts ─────────────────────────────────────────
export function ResultsCharts({
  results,
  rigor
}: {
  results: any,
  rigor: any
}) {
  if (!results || !rigor) return null;

  // Forest plot data from odds ratios
  const forestData = results.odds_ratios
    ? Object.entries(results.odds_ratios)
        .map(([name, vals]: any) => ({
          name,
          OR:       vals.OR,
          CI_low:   vals.CI_low,
          CI_high:  vals.CI_high,
          p_value:  vals.p_value,
          significant: vals.significant,
        }))
        .slice(0, 8)
    : [];

  // Rigor breakdown for radar-style bar chart
  const rigorData = Object.entries(rigor.breakdown).map(([key, val]: any) => ({
    name: key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    score: val.score,
    max: val.max,
    pct: Math.round((val.score / val.max) * 100),
  }));

  // Assumption checks
  const assumptions = results.assumptions
    ? Object.entries(results.assumptions).map(([name, check]: any) => ({
        name: name.replace(/_/g, ' '),
        status: check.passed === true ? 1 : check.passed === false ? 0 : 0.5,
        label: check.passed === true ? 'Passed' : check.passed === false ? 'Failed' : 'Unknown',
        detail: check.detail || '',
      }))
    : [];

  return (
    <div>
      {/* Forest Plot */}
      {forestData.length > 0 && (
        <div className="card">
          <h2>Odds Ratios — Forest Plot</h2>
          <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
            OR &gt; 1 increases odds of outcome. OR &lt; 1 decreases odds. 
            Bars crossing 1.0 are not statistically significant.
          </p>
          <ResponsiveContainer width="100%" height={Math.max(200, forestData.length * 45)}>
            <BarChart
              data={forestData}
              layout="vertical"
              margin={{ top: 0, right: 60, left: 120, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={['auto', 'auto']}
                tickFormatter={v => v.toFixed(1)} fontSize={11}
                label={{ value: 'Odds Ratio', position: 'insideBottom', offset: -5, fontSize: 11 }} />
              <YAxis type="category" dataKey="name" fontSize={11} width={110} />
              <Tooltip
                formatter={(val: any, name: string, props: any) => [
                  `OR: ${props.payload.OR} (95% CI: ${props.payload.CI_low}–${props.payload.CI_high})`,
                  `p = ${props.payload.p_value}`
                ]}
              />
              <Bar dataKey="OR" radius={[0, 4, 4, 0]}>
                {forestData.map((entry, i) => (
                  <Cell key={i} fill={entry.significant ? TERRA : '#cccccc'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 12, height: 12, background: TERRA, borderRadius: 2, display: 'inline-block' }} />
              Statistically significant (p &lt; 0.05)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 12, height: 12, background: '#ccc', borderRadius: 2, display: 'inline-block' }} />
              Not significant
            </span>
          </div>
        </div>
      )}

      {/* Rigor Score Breakdown Chart */}
      <div className="card">
        <h2>Rigor Score Breakdown</h2>
        <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
          Each component scored out of 25. Total score out of 100.
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={rigorData}
            margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={10} angle={-10} textAnchor="end" />
            <YAxis domain={[0, 25]} fontSize={11} />
            <Tooltip formatter={(v: any) => [`${v}/25`, 'Score']} />
            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
              {rigorData.map((entry, i) => (
                <Cell key={i} fill={
                  entry.pct >= 70 ? SAGE :
                  entry.pct >= 50 ? '#ff9800' : '#f44336'
                } />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Assumption Checks */}
      {assumptions.length > 0 && (
        <div className="card">
          <h2>Statistical Assumption Checks</h2>
          <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
            These checks verify that the chosen statistical model is valid for your data.
          </p>
          {assumptions.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start',
              gap: '1rem', padding: '0.75rem',
              borderRadius: 8, marginBottom: 8,
              background: a.label === 'Passed' ? '#e8f5e9' :
                          a.label === 'Failed' ? '#ffebee' : '#fff3e0',
              border: `1px solid ${
                a.label === 'Passed' ? '#a5d6a7' :
                a.label === 'Failed' ? '#ef9a9a' : '#ffcc02'
              }`
            }}>
              <span style={{ fontSize: '1.3rem', marginTop: 2 }}>
                {a.label === 'Passed' ? '✅' : a.label === 'Failed' ? '❌' : '⚠️'}
              </span>
              <div>
                <p style={{ fontWeight: 700, marginBottom: 2, color: NAVY, textTransform: 'capitalize' }}>
                  {a.name}
                </p>
                <p style={{ fontSize: '0.82rem', color: '#555', marginBottom: 0 }}>
                  {a.detail}
                </p>
              </div>
              <span className={`badge badge-${a.label === 'Passed' ? 'green' : a.label === 'Failed' ? 'red' : 'orange'}`}
                style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                {a.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Model Fit Statistics */}
      {results.model_fit && (
        <div className="card">
          <h2>Model Fit Statistics</h2>
          <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
            These statistics describe how well the model fits your data.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.75rem' }}>
            {Object.entries(results.model_fit).map(([key, val]: any) => (
              <div key={key} style={{
                padding: '1rem', borderRadius: 8,
                background: '#f8f7f4', border: '1px solid #eee'
              }}>
                <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {key.replace(/_/g, ' ')}
                </p>
                <p style={{ fontSize: '1.4rem', fontWeight: 700, color: NAVY, marginBottom: 0 }}>
                  {typeof val === 'number' ? val.toFixed(3) : val}
                </p>
              </div>
            ))}
          </div>
          <div className="alert alert-success" style={{ marginTop: '1rem' }}>
            <strong>What this means:</strong> Pseudo R² measures how much variation in the outcome 
            your predictors explain. Values above 0.2 indicate good explanatory power. 
            Lower AIC/BIC values indicate better model fit.
          </div>
        </div>
      )}
    </div>
  );
}
