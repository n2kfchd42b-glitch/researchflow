import React, { useState } from 'react';
import { useNGO } from '../context/NGOPlatformContext';
import { ReportExporter } from '../../../packages/ui';

const templates = [
  {
    id: 'baseline',
    icon: '📄',
    title: 'Baseline Report',
    description: 'Initial assessment before program activities begin',
    sections: ['methodology', 'dataset-summary', 'Table 1', 'indicator baselines'],
  },
  {
    id: 'endline',
    icon: '✅',
    title: 'Endline Report',
    description: 'Final assessment comparing outcomes to baseline',
    sections: ['methodology', 'baseline vs endline', 'indicator achievements', 'conclusions'],
  },
  {
    id: 'donor',
    icon: '💰',
    title: 'Donor Report',
    description: 'Structured report for donor accountability',
    sections: ['executive summary', 'indicator dashboard', 'budget summary', 'timeline', 'challenges'],
  },
  {
    id: 'progress',
    icon: '📈',
    title: 'Progress Report',
    description: 'Periodic update on project implementation',
    sections: ['indicator progress', 'enrollment update', 'activity summary', 'next steps'],
  },
  {
    id: 'data-quality',
    icon: '🛡️',
    title: 'Data Quality Report',
    description: 'Technical report on data integrity and cleaning',
    sections: ['dataset summary', 'quality score', 'cleaning log', 'completeness analysis'],
  },
];

const ReportGeneratorPage: React.FC = () => {
  const { state, generateReport } = useNGO();
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<any>(null);
  const [report, setReport] = useState<any>({});
  const [preview, setPreview] = useState(false);

  // Step 1: Select Template
  if (step === 1) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 18, color: '#1C2B3A', marginBottom: 16 }}>Select Report Template</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {templates.map(t => (
            <div key={t.id} style={{ border: selected === t.id ? '2px solid #5A8A6A' : '1px solid #e0e0e0', borderRadius: 8, padding: 16, background: '#fff', cursor: 'pointer', position: 'relative' }} onClick={() => { setSelected(t.id); setReport({ ...report, type: t.id }); }}>
              <div style={{ fontSize: 32 }}>{t.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 15, color: '#1C2B3A', margin: '8px 0' }}>{t.title}</div>
              <div style={{ color: '#888', fontSize: 13 }}>{t.description}</div>
              {selected === t.id && <span style={{ position: 'absolute', top: 8, right: 8, color: '#5A8A6A', fontWeight: 700 }}>✔</span>}
            </div>
          ))}
        </div>
        <button style={{ marginTop: 24, background: '#5A8A6A', color: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 15 }} disabled={!selected} onClick={() => setStep(2)}>
          Next
        </button>
      </div>
    );
  }

  // Step 2: Configure Report
  if (step === 2) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 18, color: '#1C2B3A', marginBottom: 16 }}>Configure Report</div>
        <input placeholder="Report Title" value={report.title || ''} onChange={e => setReport({ ...report, title: e.target.value })} style={{ width: '100%', marginBottom: 8 }} />
        <input placeholder="Reporting Period (e.g. Jan-Mar 2026)" value={report.period || ''} onChange={e => setReport({ ...report, period: e.target.value })} style={{ width: '100%', marginBottom: 8 }} />
        <input placeholder="Organization Name" value={report.org || ''} onChange={e => setReport({ ...report, org: e.target.value })} style={{ width: '100%', marginBottom: 8 }} />
        <input type="file" accept="image/png,image/jpeg" onChange={e => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = ev => setReport({ ...report, logo: ev.target?.result });
            reader.readAsDataURL(file);
          }
        }} style={{ marginBottom: 8 }} />
        <button style={{ marginTop: 16, background: '#5A8A6A', color: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 15 }} onClick={() => setStep(3)}>
          Preview & Edit
        </button>
      </div>
    );
  }

  // Step 3: Preview & Edit
  if (step === 3) {
    return (
      <div style={{ padding: 24, display: 'flex', gap: 32 }}>
        <div style={{ flex: 1, background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(44,62,80,0.08)', maxHeight: 700, overflowY: 'auto' }}>
          {report.logo && <img src={report.logo} alt="logo" style={{ maxWidth: 80, marginBottom: 12 }} />}
          <div style={{ fontWeight: 700, fontSize: 20, color: '#1C2B3A' }}>{report.title}</div>
          <div style={{ color: '#5A8A6A', fontSize: 15 }}>{report.org}</div>
          <div style={{ color: '#2E86C1', fontSize: 13 }}>{report.period}</div>
          <div style={{ margin: '16px 0', color: '#888', fontSize: 14 }}>
            Executive Summary: This {report.type} covers the period {report.period}. [X] indicators were tracked, with [Y]% meeting or exceeding targets. Total budget utilization stands at [Z]%.
          </div>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#1C2B3A', margin: '12px 0 4px' }}>Indicator Dashboard</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
            <thead>
              <tr>
                <th>Indicator</th>
                <th>Baseline</th>
                <th>Target</th>
                <th>Current</th>
                <th>Achievement %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {state.indicators.map((i: any) => (
                <tr key={i.id}>
                  <td>{i.name}</td>
                  <td>{i.baselineValue}</td>
                  <td>{i.targetValue}</td>
                  <td>{i.currentValue}</td>
                  <td>{i.currentValue && i.targetValue ? Math.round((i.currentValue / i.targetValue) * 100) : 0}%</td>
                  <td>{i.currentValue && i.targetValue && i.currentValue >= i.targetValue ? 'On Track' : 'Behind'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#1C2B3A', margin: '12px 0 4px' }}>Dataset Summary</div>
          <div style={{ color: '#888', fontSize: 13 }}>Row count, column count, quality score, cleaning actions taken</div>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#1C2B3A', margin: '12px 0 4px' }}>Methodology</div>
          <textarea style={{ width: '100%', minHeight: 60, marginBottom: 8 }} defaultValue="[Describe the study design, sampling strategy, data collection methods, and analysis approach used in this assessment.]" />
          <div style={{ fontWeight: 600, fontSize: 15, color: '#1C2B3A', margin: '12px 0 4px' }}>Budget Summary</div>
          <div style={{ color: '#888', fontSize: 13 }}>Category breakdown table + pie chart (mock)</div>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#1C2B3A', margin: '12px 0 4px' }}>Timeline</div>
          <div style={{ color: '#888', fontSize: 13 }}>Project milestones and dates</div>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#1C2B3A', margin: '12px 0 4px' }}>Narrative Sections</div>
          <textarea style={{ width: '100%', minHeight: 40, marginBottom: 8 }} defaultValue="Key Findings" />
          <textarea style={{ width: '100%', minHeight: 40, marginBottom: 8 }} defaultValue="Challenges & Limitations" />
          <textarea style={{ width: '100%', minHeight: 40, marginBottom: 8 }} defaultValue="Recommendations" />
          <textarea style={{ width: '100%', minHeight: 40, marginBottom: 8 }} defaultValue="Next Steps" />
          <div style={{ fontWeight: 600, fontSize: 15, color: '#1C2B3A', margin: '12px 0 4px' }}>Appendix</div>
          <div style={{ color: '#888', fontSize: 13 }}>Data dictionary, cleaning log summary</div>
        </div>
        {/* Export sidebar — uses shared ReportExporter driven by formats[] prop */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 200 }}>
          <ReportExporter
            context="ngo"
            formats={['pdf', 'docx', 'csv']}
            payload={{ ...report, context: 'ngo' }}
            templateId={report.type || 'donor'}
            label="Export Report"
          />
          <button
            style={{ background: '#C0533A', color: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 15 }}
            onClick={() => { generateReport(report); setPreview(true); }}
          >
            Save Report
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Confirmation
  if (preview) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 18, color: '#1C2B3A', marginBottom: 16 }}>Report Saved!</div>
        <button style={{ background: '#5A8A6A', color: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 15 }} onClick={() => setStep(1)}>Generate Another</button>
      </div>
    );
  }

  return null;
};

export default ReportGeneratorPage;
