import React, { useState } from 'react';
import { api, survivalApi } from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

const COLORS = ['#C0533A', '#5A8A6A', '#1C2B3A', '#ff9800', '#9c27b0'];

export default function SurvivalAnalysis() {
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [datasetId, setDatasetId]       = useState('');
  const [durationCol, setDurationCol]   = useState('');
  const [eventCol, setEventCol]         = useState('');
  const [groupCol, setGroupCol]         = useState('');
  const [results, setResults]           = useState<any>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.upload(file);
      setUploadResult(data);
      setDatasetId(data.dataset_id);
    } catch (err: any) {
      setError('Upload failed: ' + err.message);
    }
    setLoading(false);
  }

  async function runAnalysis() {
    setLoading(true);
    setError('');
    try {
      console.log('Survival request:', { datasetId, durationCol, eventCol, groupCol });
      const result = await survivalApi.kaplanMeier(
        datasetId, durationCol, eventCol, groupCol || undefined
      );
      setResults(result);
    } catch (err: any) {
      setError('Analysis failed: ' + err.message);
    }
    setLoading(false);
  }

  const columns = uploadResult ? Object.keys(uploadResult.column_types) : [];

  function buildChartData() {
    if (!results || !results.groups) return [];
    const allTimelines = results.groups.flatMap((g: any) => g.timeline);
    const uniqueTimes  = Array.from(new Set<number>(allTimelines)).sort((a: any, b: any) => a - b);
    return uniqueTimes.map((t: any) => {
      const point: any = { time: t };
      results.groups.forEach((g: any) => {
        const idx = g.timeline.indexOf(t);
        point[g.group] = idx >= 0 ? g.survival[idx] : null;
      });
      return point;
    });
  }

  const chartData = buildChartData();

  return (
    <div className="page">
      <h1 style={{ color: '#1C2B3A' }}>Survival Analysis</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        Kaplan-Meier survival curves for time-to-event data.
      </p>

      {error && <div className="alert alert-critical">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
        <div>
          <div className="card">
            <h2>Upload Dataset</h2>
            <label className="upload-zone" style={{ display: 'block', cursor: 'pointer' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📂</div>
              <p style={{ fontWeight: 600, color: '#1C2B3A' }}>Upload time-to-event dataset</p>
              <p style={{ fontSize: '0.85rem' }}>CSV, XLSX, SAV, DTA</p>
              <input type="file" accept=".csv,.xlsx,.xls,.sav,.dta"
                onChange={handleUpload} style={{ display: 'none' }} />
            </label>
            {uploadResult && (
              <>
                <div className="alert alert-success" style={{ marginTop: '1rem' }}>
                  {uploadResult.rows} records, {uploadResult.columns} variables
                </div>
                {datasetId && (
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: 6 }}>
                    <span style={{ fontSize: '0.75rem', color: '#888', background: '#f0f0f0', padding: '0.5rem 0.75rem', borderRadius: 4 }}>
                      Dataset ID: {datasetId}
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(datasetId)}
                      style={{
                        marginLeft: 8,
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        border: 'none',
                        borderRadius: 4,
                        background: '#e0e0e0',
                        color: '#333',
                        cursor: 'pointer'
                      }}
                      title="Copy Dataset ID"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {uploadResult && (
            <div className="card">
              <h2>Configure Analysis</h2>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Duration Column *
                  <span style={{ fontWeight: 400, color: '#888', fontSize: '0.8rem' }}> (time to event or censoring)</span>
                </label>
                <select value={durationCol} onChange={e => setDurationCol(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }}>
                  <option value="">Select duration column...</option>
                  {columns.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Event Column *
                  <span style={{ fontWeight: 400, color: '#888', fontSize: '0.8rem' }}> (1=event occurred, 0=censored)</span>
                </label>
                <select value={eventCol} onChange={e => setEventCol(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }}>
                  <option value="">Select event column...</option>
                  {columns.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Group Column
                  <span style={{ fontWeight: 400, color: '#888', fontSize: '0.8rem' }}> (optional — compare groups)</span>
                </label>
                <select value={groupCol} onChange={e => setGroupCol(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.95rem' }}>
                  <option value="">No grouping — overall curve only</option>
                  {columns.filter(c => c !== durationCol && c !== eventCol).map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              <button className="btn btn-full btn-navy"
                onClick={runAnalysis}
                disabled={!durationCol || !eventCol || loading}
                style={{ opacity: (!durationCol || !eventCol) ? 0.5 : 1 }}>
                {loading ? 'Running Analysis...' : 'Plot Survival Curves'}
              </button>
            </div>
          )}

          {results && (
            <div className="card">
              <h2>Median Survival Times</h2>
              {Object.entries(results.median_survival).map(([group, median]: any, i) => (
                <div key={group} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.75rem', background: '#f8f7f4', borderRadius: 8, marginBottom: 8,
                  borderLeft: '4px solid ' + COLORS[i % COLORS.length]
                }}>
                  <span style={{ fontWeight: 600 }}>{group}</span>
                  <span style={{ fontWeight: 700, color: COLORS[i % COLORS.length] }}>
                    {median ? median.toFixed(1) + ' units' : 'Not reached'}
                  </span>
                </div>
              ))}
              {results.logrank_test && (
                <div className={'alert alert-' + (results.logrank_test.significant ? 'success' : 'warning')}
                  style={{ marginTop: '1rem' }}>
                  <strong>Log-rank test:</strong> p = {results.logrank_test.p_value}
                  {results.logrank_test.significant
                    ? ' — Groups differ significantly (p < 0.05)'
                    : ' — No significant difference between groups (p ≥ 0.05)'}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          {!results && (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📈</div>
              <h2>Kaplan-Meier Curve</h2>
              <p>Upload a dataset with time-to-event data and configure the analysis to plot survival curves here.</p>
              <div className="alert alert-success" style={{ textAlign: 'left', marginTop: '1.5rem' }}>
                <strong>What you need:</strong> A dataset with at least two columns —
                one for time (days, months, years until event or last follow-up)
                and one for event status (1 = event occurred, 0 = censored/lost to follow-up).
              </div>
            </div>
          )}

          {results && chartData.length > 0 && (
            <div>
              <div className="card">
                <h2>Kaplan-Meier Survival Curves</h2>
                <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>
                  n = {results.n} participants
                  {groupCol ? ` · Grouped by ${groupCol}` : ' · Overall survival'}
                </p>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="time" fontSize={11}
                      label={{ value: 'Time', position: 'insideBottom', offset: -10, fontSize: 12 }} />
                    <YAxis domain={[0, 1]} tickFormatter={(v: any) => (v * 100).toFixed(0) + '%'} fontSize={11}
                      label={{ value: 'Survival Probability', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                    <Tooltip
                      formatter={(val: any) => [(val * 100).toFixed(1) + '%', 'Survival']}
                      labelFormatter={(label: any) => `Time: ${label}`}
                    />
                    <Legend />
                    <ReferenceLine y={0.5} stroke="#888" strokeDasharray="5 5"
                      label={{ value: '50%', position: 'right', fontSize: 11 }} />
                    {results.groups.map((g: any, i: number) => (
                      <Line key={g.group} type="stepAfter" dataKey={g.group}
                        stroke={COLORS[i % COLORS.length]} strokeWidth={2.5}
                        dot={false} connectNulls={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <h2>Group Summary</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: '#1C2B3A', color: 'white' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Group</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>N</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Median Survival</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Final Survival %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.groups.map((g: any, i: number) => (
                        <tr key={g.group} style={{ background: i % 2 === 0 ? '#f8f7f4' : 'white' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: COLORS[i % COLORS.length] }}>
                            {g.group}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>{g.n}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            {g.median ? g.median.toFixed(1) : 'Not reached'}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            {g.survival.length > 0
                              ? (g.survival[g.survival.length - 1] * 100).toFixed(1) + '%'
                              : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card" style={{ background: '#f0f4f8' }}>
                <h2>How to Interpret</h2>
                <p style={{ fontSize: '0.9rem', color: '#555' }}>
                  The y-axis shows the probability of surviving beyond a given time point.
                  A value of 0.8 means 80% of participants had not yet experienced the event.
                  The curve steps down each time an event occurs.
                  Censored observations (participants lost to follow-up) are not shown as steps.
                </p>
                {results.logrank_test && (
                  <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: 0 }}>
                    The log-rank test compares survival curves between groups.
                    p = {results.logrank_test.p_value} — 
                    {results.logrank_test.significant
                      ? ' the difference between groups is statistically significant.'
                      : ' no statistically significant difference was found between groups.'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
