import React, { useState } from 'react';
import { useNGO } from '../context/NGOPlatformContext';
import EmptyState from '../components/EmptyState';

const IndicatorBuilderPage: React.FC = () => {
  const { state, createIndicator, updateIndicator, deleteIndicator, recalculateIndicator } = useNGO();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    definition: '',
    datasetId: '',
    variable: '',
    calculationMethod: 'percentage',
    disaggregateBy: [],
    baselineValue: 0,
    targetValue: 0,
    reportingFrequency: 'monthly',
    projectId: '',
  });
  const indicators = state.indicators;

  // Overview metrics
  const total = indicators.length;
  const onTrack = indicators.filter((i: any) => i.currentValue && i.targetValue && i.currentValue >= i.targetValue).length;
  const behind = indicators.filter((i: any) => i.currentValue && i.targetValue && i.currentValue < i.targetValue && i.currentValue >= 0.5 * i.targetValue).length;
  const critical = indicators.filter((i: any) => i.currentValue && i.targetValue && i.currentValue < 0.5 * i.targetValue).length;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, background: '#F8F9F9', borderRadius: 8, padding: 16 }}>
          <div style={{ color: '#1C2B3A', fontWeight: 600 }}>Total Indicators</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{total}</div>
        </div>
        <div style={{ flex: 1, background: '#F8F9F9', borderRadius: 8, padding: 16 }}>
          <div style={{ color: '#5A8A6A', fontWeight: 600 }}>On Track</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{onTrack}</div>
        </div>
        <div style={{ flex: 1, background: '#F8F9F9', borderRadius: 8, padding: 16 }}>
          <div style={{ color: '#F9E79F', fontWeight: 600 }}>Behind</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{behind}</div>
        </div>
        <div style={{ flex: 1, background: '#F8F9F9', borderRadius: 8, padding: 16 }}>
          <div style={{ color: '#C0533A', fontWeight: 600 }}>Critical</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{critical}</div>
        </div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <button style={{ background: '#5A8A6A', color: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 15 }} onClick={() => setShowForm(!showForm)}>
          + New Indicator
        </button>
      </div>
      {showForm && (
        <div style={{ background: '#F8F9F9', borderRadius: 8, padding: 16, marginBottom: 24 }}>
          <input placeholder="Indicator Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: '100%', marginBottom: 8 }} />
          <textarea placeholder="Definition" value={form.definition} onChange={e => setForm({ ...form, definition: e.target.value })} style={{ width: '100%', marginBottom: 8 }} />
          <input placeholder="Dataset Source" value={form.datasetId} onChange={e => setForm({ ...form, datasetId: e.target.value })} style={{ width: '100%', marginBottom: 8 }} />
          <input placeholder="Field / Column" value={form.variable} onChange={e => setForm({ ...form, variable: e.target.value })} style={{ width: '100%', marginBottom: 8 }} />
          <select value={form.calculationMethod} onChange={e => setForm({ ...form, calculationMethod: e.target.value })} style={{ width: '100%', marginBottom: 8 }}>
            <option value="percentage">Percentage</option>
            <option value="mean">Mean</option>
            <option value="count">Count</option>
            <option value="sum">Sum</option>
            <option value="ratio">Ratio</option>
            <option value="median">Median</option>
          </select>
          <input placeholder="Baseline Value" type="number" value={form.baselineValue} onChange={e => setForm({ ...form, baselineValue: Number(e.target.value) })} style={{ width: '100%', marginBottom: 8 }} />
          <input placeholder="Target Value" type="number" value={form.targetValue} onChange={e => setForm({ ...form, targetValue: Number(e.target.value) })} style={{ width: '100%', marginBottom: 8 }} />
          <select value={form.reportingFrequency} onChange={e => setForm({ ...form, reportingFrequency: e.target.value })} style={{ width: '100%', marginBottom: 8 }}>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="semi-annual">Semi-Annual</option>
            <option value="annual">Annual</option>
          </select>
          <button style={{ background: '#5A8A6A', color: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 15 }} onClick={() => { createIndicator(form); setShowForm(false); }}>
            Save Indicator
          </button>
        </div>
      )}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 16, color: '#1C2B3A', marginBottom: 8 }}>Indicator List</div>
        {indicators.length === 0 ? (
          <EmptyState icon={<span>🎯</span>} title="No indicators yet" description="Create indicators to track progress." actionLabel="Add Indicator" onAction={() => setShowForm(true)} />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Definition</th>
                <th>Current Value</th>
                <th>Target</th>
                <th>Progress %</th>
                <th>Trend</th>
                <th>Frequency</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((i: any) => (
                <tr key={i.id}>
                  <td>{i.name}</td>
                  <td>{i.definition}</td>
                  <td>{i.currentValue}</td>
                  <td>{i.targetValue}</td>
                  <td>
                    <div style={{ width: 80, height: 8, background: '#e0e0e0', borderRadius: 4, position: 'relative' }}>
                      <div style={{ width: `${i.currentValue && i.targetValue ? Math.min(100, (i.currentValue / i.targetValue) * 100) : 0}%`, height: 8, borderRadius: 4, background: i.currentValue && i.targetValue && i.currentValue >= 0.8 * i.targetValue ? '#5A8A6A' : i.currentValue && i.targetValue && i.currentValue >= 0.5 * i.targetValue ? '#F9E79F' : '#C0533A' }} />
                    </div>
                  </td>
                  <td>
                    {/* Sparkline: replace with recharts LineChart */}
                    <svg width={80} height={16}>
                      <polyline points={i.trend.map((v: number, idx: number) => `${idx * 10},${16 - v % 16}`).join(' ')} fill="none" stroke="#2E86C1" strokeWidth={2} />
                    </svg>
                  </td>
                  <td>{i.reportingFrequency}</td>
                  <td>
                    <button style={{ background: '#2E86C1', color: '#fff', borderRadius: 4, border: 'none', padding: '2px 8px', fontSize: 13, marginRight: 4 }} onClick={() => updateIndicator(i.id, { name: i.name })}>Edit</button>
                    <button style={{ background: '#5A8A6A', color: '#fff', borderRadius: 4, border: 'none', padding: '2px 8px', fontSize: 13, marginRight: 4 }} onClick={() => recalculateIndicator(i.id)}>Recalculate</button>
                    <button style={{ background: '#C0533A', color: '#fff', borderRadius: 4, border: 'none', padding: '2px 8px', fontSize: 13 }} onClick={() => deleteIndicator(i.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default IndicatorBuilderPage;
