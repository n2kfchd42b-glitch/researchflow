import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,

} from 'recharts';

const COLORS = ['#C0533A','#5A8A6A','#1C2B3A','#ff9800','#9c27b0','#2196f3','#e91e63','#00897b','#ff5722','#607d8b'];

const CHART_TYPES = [
  { id: 'bar',       label: 'Bar Chart',       icon: '📊' },
  { id: 'grouped',   label: 'Grouped Bar',      icon: '📊' },
  { id: 'line',      label: 'Line Chart',       icon: '📈' },
  { id: 'area',      label: 'Area Chart',       icon: '🏔️' },
  { id: 'scatter',   label: 'Scatter Plot',     icon: '⚡' },
  { id: 'pie',       label: 'Pie Chart',        icon: '🥧' },
  { id: 'histogram', label: 'Histogram',        icon: '📉' },
];

function buildChartData(df: any[], xCol: string, yCol: string, chartType: string) {
  if (!df || !xCol || !yCol) return [];
  if (chartType === 'histogram') {
    const values = df.map(r => parseFloat(r[yCol])).filter(v => !isNaN(v));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const bins = 10;
    const binSize = (max - min) / bins;
    const counts = Array(bins).fill(0);
    values.forEach(v => {
      const idx = Math.min(Math.floor((v - min) / binSize), bins - 1);
      counts[idx]++;
    });
    return counts.map((count, i) => ({
      bin: `${(min + i * binSize).toFixed(1)}–${(min + (i+1) * binSize).toFixed(1)}`,
      count,
    }));
  }
  if (chartType === 'scatter') {
    return df.slice(0, 500).map(r => ({
      x: parseFloat(r[xCol]),
      y: parseFloat(r[yCol]),
    })).filter(r => !isNaN(r.x) && !isNaN(r.y));
  }
  const grouped: Record<string, number[]> = {};
  df.forEach(r => {
    const key = String(r[xCol]);
    const val = parseFloat(r[yCol]);
    if (!isNaN(val)) {
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(val);
    }
  });
  return Object.entries(grouped).slice(0, 30).map(([key, vals]) => ({
    name: key,
    value: Math.round(vals.reduce((a,b) => a+b, 0) / vals.length * 100) / 100,
    total: vals.reduce((a,b) => a+b, 0),
    count: vals.length,
  }));
}

export default function VisualisationStudio() {
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [rawData, setRawData]           = useState<any[]>([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  const [chartType, setChartType]       = useState('bar');
  const [xCol, setXCol]                 = useState('');
  const [yCol, setYCol]                 = useState('');
  const [colorCol, setColorCol]         = useState('');

  const [title, setTitle]               = useState('My Chart');
  const [xLabel, setXLabel]             = useState('');
  const [yLabel, setYLabel]             = useState('');
  const [showGrid, setShowGrid]         = useState(true);
  const [showLegend, setShowLegend]     = useState(true);
  const [chartColor, setChartColor]     = useState('#C0533A');
  const [bgColor, setBgColor]           = useState('#ffffff');
  const [fontSize, setFontSize]         = useState(12);
  const [chartHeight, setChartHeight]   = useState(400);
  const [barRadius, setBarRadius]       = useState(4);
  const [opacity, setOpacity]           = useState(0.85);
  const [showValues, setShowValues]     = useState(false);
  const [colorPalette, setColorPalette] = useState(0);

  const chartRef = useRef<HTMLDivElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.upload(file);
      setUploadResult(data);
      const text = await file.text();
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map((line: string) => {
        const vals = line.split(',');
        const obj: any = {};
        headers.forEach((h: string, i: number) => { obj[h] = vals[i]?.trim().replace(/"/g, '') || ''; });
        return obj;
      });
      setRawData(rows);
      if (headers.length > 0) setXCol(headers[0]);
      if (headers.length > 1) setYCol(headers[1]);
    } catch (err: any) {
      setError('Upload failed: ' + err.message);
    }
    setLoading(false);
  }

  function exportPNG() {
    alert("To save your chart: right-click on the chart and select Save Image As.");
  }

  const columns  = uploadResult ? Object.keys(uploadResult.column_types) : [];
  const chartData = buildChartData(rawData, xCol, yCol, chartType);
  const palette   = COLORS.slice(colorPalette, colorPalette + 6).concat(COLORS.slice(0, colorPalette));

  const commonProps = {
    margin: { top: 20, right: 30, left: 20, bottom: 60 },
  };

  const axisStyle = { fontSize, fill: '#555' };

  function renderChart() {
    if (chartData.length === 0) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: chartHeight, color: '#aaa', fontSize: '1rem' }}>
        Select X and Y columns to render chart
      </div>
    );

    if (chartType === 'bar' || chartType === 'histogram') {
      const dataKey = chartType === 'histogram' ? 'count' : 'value';
      const nameKey = chartType === 'histogram' ? 'bin' : 'name';
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={chartData} {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis dataKey={nameKey} tick={{ ...axisStyle }} angle={-35} textAnchor="end" label={{ value: xLabel, position: 'insideBottom', offset: -45, style: axisStyle }} />
            <YAxis tick={{ ...axisStyle }} label={{ value: yLabel, angle: -90, position: 'insideLeft', style: axisStyle }} />
            <Tooltip />
            {showLegend && <Legend />}
            <Bar dataKey={dataKey} fill={chartColor} radius={[barRadius, barRadius, 0, 0]} opacity={opacity}
              label={showValues ? { position: 'top', fontSize: fontSize - 2 } : false} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'grouped') {
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={chartData} {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis dataKey="name" tick={{ ...axisStyle }} angle={-35} textAnchor="end" />
            <YAxis tick={{ ...axisStyle }} />
            <Tooltip />
            {showLegend && <Legend />}
            <Bar dataKey="value" name={yCol} fill={chartColor} radius={[barRadius, barRadius, 0, 0]} opacity={opacity} />
            <Bar dataKey="count" name="Count" fill={palette[1]} radius={[barRadius, barRadius, 0, 0]} opacity={opacity} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={chartData} {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis dataKey="name" tick={{ ...axisStyle }} angle={-35} textAnchor="end" label={{ value: xLabel, position: 'insideBottom', offset: -45, style: axisStyle }} />
            <YAxis tick={{ ...axisStyle }} label={{ value: yLabel, angle: -90, position: 'insideLeft', style: axisStyle }} />
            <Tooltip />
            {showLegend && <Legend />}
            <Line type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2} dot={{ fill: chartColor, r: 4 }} opacity={opacity} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <AreaChart data={chartData} {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis dataKey="name" tick={{ ...axisStyle }} angle={-35} textAnchor="end" />
            <YAxis tick={{ ...axisStyle }} />
            <Tooltip />
            {showLegend && <Legend />}
            <Area type="monotone" dataKey="value" stroke={chartColor} fill={chartColor} fillOpacity={0.3} opacity={opacity} />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'scatter') {
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ScatterChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis dataKey="x" name={xCol} tick={{ ...axisStyle }} label={{ value: xLabel || xCol, position: 'insideBottom', offset: -45, style: axisStyle }} />
            <YAxis dataKey="y" name={yCol} tick={{ ...axisStyle }} label={{ value: yLabel || yCol, angle: -90, position: 'insideLeft', style: axisStyle }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            {showLegend && <Legend />}
            <Scatter data={chartData} fill={chartColor} opacity={opacity} />
          </ScatterChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%"
              outerRadius={chartHeight / 3} label={showValues ? ({ name, percent }: { name: string, percent?: number }) => `${name} ${((percent || 0) * 100).toFixed(1)}%` : undefined}
              opacity={opacity}>
              {chartData.map((_: any, index: number) => (
                <Cell key={index} fill={palette[index % palette.length]} />
              ))}
            </Pie>
            <Tooltip />
            {showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return null;
  }

  return (
    <div className="page">
      <h1 style={{ color: '#1C2B3A' }}>Visualisation Studio</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        Build publication-ready charts with full customisation — better than Excel.
      </p>

      {error && <div className="alert alert-critical">{error}</div>}

      {!uploadResult ? (
        <div className="card" style={{ maxWidth: 500 }}>
          <h2>Upload Dataset</h2>
          <label className="upload-zone" style={{ display: 'block', cursor: 'pointer' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📂</div>
            <p style={{ fontWeight: 600, color: '#1C2B3A' }}>Upload your dataset (CSV)</p>
            <p style={{ fontSize: '0.85rem' }}>CSV files for instant visualisation</p>
            <input type="file" accept=".csv" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>

          {/* CONTROLS PANEL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            <div className="card" style={{ padding: '1rem' }}>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Chart Type</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {CHART_TYPES.map(ct => (
                  <button key={ct.id} onClick={() => setChartType(ct.id)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 0.75rem', borderRadius: 6, cursor: 'pointer',
                    background: chartType === ct.id ? '#1C2B3A' : 'transparent',
                    color: chartType === ct.id ? 'white' : '#444',
                    border: '1px solid ' + (chartType === ct.id ? '#1C2B3A' : '#eee'),
                    fontSize: '0.85rem', textAlign: 'left',
                  }}>
                    <span>{ct.icon}</span> {ct.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: '1rem' }}>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Data</h3>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>X Axis</label>
                <select value={xCol} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setXCol(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.85rem' }}>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Y Axis</label>
                <select value={yCol} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setYCol(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.85rem' }}>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="card" style={{ padding: '1rem' }}>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Labels</h3>
              {[
                { label: 'Chart Title', value: title, set: setTitle },
                { label: 'X Axis Label', value: xLabel, set: setXLabel },
                { label: 'Y Axis Label', value: yLabel, set: setYLabel },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: '0.6rem' }}>
                  <label style={{ fontSize: '0.78rem', color: '#888', display: 'block', marginBottom: 3 }}>{item.label}</label>
                  <input value={item.value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => item.set(e.target.value)}
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.82rem' }} />
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: '1rem' }}>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Style</h3>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.78rem', color: '#888', display: 'block', marginBottom: 4 }}>Primary Color</label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => setChartColor(c)} style={{
                      width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer',
                      border: chartColor === c ? '3px solid #333' : '2px solid transparent',
                    }} />
                  ))}
                  <input type="color" value={chartColor} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChartColor(e.target.value)}
                    style={{ width: 24, height: 24, borderRadius: '50%', cursor: 'pointer', border: 'none', padding: 0 }} />
                </div>
              </div>

              <div style={{ marginBottom: '0.6rem' }}>
                <label style={{ fontSize: '0.78rem', color: '#888', display: 'block', marginBottom: 3 }}>Background</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {['#ffffff', '#f8f7f4', '#1C2B3A', '#f0f4f8'].map(c => (
                    <div key={c} onClick={() => setBgColor(c)} style={{
                      width: 24, height: 24, borderRadius: 4, background: c, cursor: 'pointer',
                      border: bgColor === c ? '3px solid #C0533A' : '1px solid #ccc',
                    }} />
                  ))}
                </div>
              </div>

              {[
                { label: 'Font Size',     value: fontSize,     set: setFontSize,     min: 8,  max: 20, step: 1 },
                { label: 'Chart Height',  value: chartHeight,  set: setChartHeight,  min: 200, max: 700, step: 50 },
                { label: 'Bar Radius',    value: barRadius,    set: setBarRadius,    min: 0,  max: 20, step: 1 },
                { label: 'Opacity',       value: opacity,      set: setOpacity,      min: 0.1, max: 1, step: 0.05 },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <label style={{ fontSize: '0.78rem', color: '#888' }}>{item.label}</label>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{item.value}</span>
                  </div>
                  <input type="range" min={item.min} max={item.max} step={item.step}
                    value={item.value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => item.set(parseFloat(e.target.value))}
                    style={{ width: '100%' }} />
                </div>
              ))}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                {[
                  { label: 'Show Grid',   value: showGrid,   set: setShowGrid   },
                  { label: 'Show Legend', value: showLegend, set: setShowLegend },
                  { label: 'Show Values', value: showValues, set: setShowValues },
                ].map(item => (
                  <label key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={item.value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => item.set(e.target.checked)} />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <button className="btn btn-primary" onClick={exportPNG}>
              💾 Export PNG
            </button>
          </div>

          {/* CHART CANVAS */}
          <div>
            <div ref={chartRef} style={{ background: bgColor, borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', border: '1px solid #eee' }}>
              <h2 style={{ textAlign: 'center', color: bgColor === '#1C2B3A' ? 'white' : '#1C2B3A', fontSize: fontSize + 4, marginBottom: '1.5rem' }}>
                {title}
              </h2>
              {renderChart()}
            </div>

            <div className="card" style={{ marginTop: '1rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Data Preview</h3>
              <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: '0.5rem' }}>
                {chartData.length} data points · {rawData.length} total rows
              </p>
              <div style={{ overflowX: 'auto', maxHeight: 150, overflowY: 'auto' }}>
                <table style={{ fontSize: '0.78rem', borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr style={{ background: '#f8f7f4' }}>
                      {Object.keys(chartData[0] || {}).map(k => (
                        <th key={k} style={{ padding: '4px 8px', textAlign: 'left', color: '#888' }}>{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.slice(0, 10).map((row: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        {Object.values(row).map((v: any, j: number) => (
                          <td key={j} style={{ padding: '4px 8px' }}>{typeof v === 'number' ? v.toFixed(2) : String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
