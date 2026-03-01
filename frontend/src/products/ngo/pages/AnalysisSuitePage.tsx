import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, TrendingUp, GitMerge, Layers, Filter, AlertCircle,
  FileText, MapPin, LineChart as LineChartIcon, History, ChevronRight
} from 'lucide-react';
import { useNGO } from '../context/NGOPlatformContext';

interface AnalysisTool {
  name: string;
  desc: string;
  icon: React.ReactNode;
  path: string;
  category: 'core' | 'advanced';
  badge?: string;
}

const ANALYSIS_TOOLS: AnalysisTool[] = [
  // Core
  { name: 'Table 1 Generator', desc: 'Baseline characteristics table with statistical tests', icon: <FileText size={24} />, path: '/ngo/table1', category: 'core' },
  { name: 'Descriptive Statistics', desc: 'Summary statistics, distributions, and histograms', icon: <BarChart3 size={24} />, path: '/ngo/descriptive', category: 'core' },
  { name: 'Survival Analysis', desc: 'Kaplan-Meier curves and Cox proportional hazards regression', icon: <TrendingUp size={24} />, path: '/ngo/analysis/survival', category: 'core' },
  { name: 'Propensity Score Matching', desc: 'Match treated and control groups for causal inference', icon: <GitMerge size={24} />, path: '/ngo/analysis/psm', category: 'core' },
  { name: 'Meta-Analysis', desc: 'Pool effect sizes across studies with heterogeneity assessment', icon: <Layers size={24} />, path: '/ngo/analysis/meta', category: 'core' },
  { name: 'Subgroup Analysis', desc: 'Stratified analysis with interaction testing by subgroups', icon: <Filter size={24} />, path: '/ngo/analysis/subgroup', category: 'core' },
  // Advanced
  { name: 'Sensitivity Analysis', desc: 'Test result robustness under assumption violations', icon: <AlertCircle size={24} />, path: '/ngo/analysis/sensitivity', category: 'advanced' },
  { name: 'Interrupted Time Series', desc: 'Evaluate impact of policy changes on longitudinal data', icon: <LineChartIcon size={24} />, path: '/ngo/analysis/its', category: 'advanced' },
  { name: 'Difference-in-Differences', desc: 'Quasi-experimental design for program evaluation', icon: <BarChart3 size={24} />, path: '/ngo/analysis/did', category: 'advanced' },
  { name: 'Mixed Effects Models', desc: 'Hierarchical and multilevel models for clustered data', icon: <Layers size={24} />, path: '/ngo/analysis/mixed', category: 'advanced' },
  { name: 'Spatial Analysis', desc: 'Geographic mapping and spatial clustering of outcomes', icon: <MapPin size={24} />, path: '/ngo/analysis/spatial', category: 'advanced' },
  { name: 'Network Meta-Analysis', desc: 'Indirect comparisons across a network of interventions', icon: <GitMerge size={24} />, path: '/ngo/analysis/network-meta', category: 'advanced' },
  { name: 'Forest Plot', desc: 'Visualize effect sizes and confidence intervals across studies', icon: <BarChart3 size={24} />, path: '/ngo/analysis/forest-plot', category: 'advanced' },
];

// Mock analysis history
const ANALYSIS_HISTORY = [
  { id: 'ah-001', date: '2025-11-02', type: 'Survival Analysis', dataset: 'Baseline Survey v2', results: 'HR 0.68 (95% CI 0.49–0.94), p=0.019', status: 'completed' },
  { id: 'ah-002', date: '2025-10-28', type: 'Table 1 Generator', dataset: 'Baseline Survey v2', results: 'N=255, balanced baseline characteristics', status: 'completed' },
  { id: 'ah-003', date: '2025-10-25', type: 'Descriptive Statistics', dataset: 'Baseline Survey v1', results: 'Mean age 34.2 (SD 8.7); 54% female', status: 'completed' },
];

export default function AnalysisSuitePage() {
  const navigate = useNavigate();
  const { activeProject } = useNGO();
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(activeProject?.datasets[0]?.id || '');

  const datasets = activeProject?.datasets || [];

  const coreTools = ANALYSIS_TOOLS.filter(t => t.category === 'core');
  const advancedTools = ANALYSIS_TOOLS.filter(t => t.category === 'advanced');

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1C2B3A', margin: 0 }}>Analysis Suite</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {activeProject ? activeProject.name : 'Select a project'} · {datasets.length} dataset{datasets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {datasets.length > 0 && (
            <select
              value={selectedDataset}
              onChange={e => setSelectedDataset(e.target.value)}
              style={{ padding: '0.45rem 0.75rem', border: '1px solid #E0E4E8', borderRadius: 8, fontSize: '0.85rem', color: '#1C2B3A', background: 'white' }}
            >
              {datasets.map(d => <option key={d.id} value={d.id}>{d.name} (v{d.version})</option>)}
            </select>
          )}
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: showHistory ? '#E8F5E9' : 'white', border: '1px solid #E0E4E8', borderRadius: 8, padding: '0.45rem 0.875rem', cursor: 'pointer', fontSize: '0.82rem', color: showHistory ? '#3D6B4F' : '#6B7280', fontWeight: showHistory ? 600 : 400 }}
          >
            <History size={14} /> Analysis History
          </button>
        </div>
      </div>

      {/* Analysis History panel */}
      {showHistory && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E4E8', padding: '1.25rem', marginBottom: '1rem' }}>
          <h3 style={{ margin: '0 0 0.875rem 0', fontWeight: 700, color: '#1C2B3A', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <History size={15} /> Recent Analyses
          </h3>
          {ANALYSIS_HISTORY.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '1.5rem', fontSize: '0.85rem' }}>No analyses run yet</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    {['Date', 'Analysis Type', 'Dataset', 'Key Results', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: '0.75rem', borderBottom: '1px solid #E0E4E8' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ANALYSIS_HISTORY.map((a, idx) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #F3F4F6', background: idx % 2 === 0 ? 'white' : '#FAFAFA' }}>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#6B7280', whiteSpace: 'nowrap' }}>{a.date}</td>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: '#1C2B3A' }}>{a.type}</td>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#6B7280' }}>{a.dataset}</td>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#1C2B3A', fontFamily: 'monospace', fontSize: '0.78rem' }}>{a.results}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => navigate(ANALYSIS_TOOLS.find(t => t.name === a.type)?.path || '/ngo/analysis')}
                            style={{ background: '#E8F5E9', color: '#3D6B4F', border: 'none', borderRadius: 6, padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            Re-run
                          </button>
                          <button style={{ background: 'none', border: '1px solid #E0E4E8', borderRadius: 6, padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', color: '#6B7280' }}>Export</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Core Analyses */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1C2B3A' }}>Core Analyses</h2>
          <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', background: '#E8F5E9', color: '#3D6B4F', borderRadius: 10, fontWeight: 600 }}>{coreTools.length} tools</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.875rem' }}>
          {coreTools.map(tool => (
            <ToolCard
              key={tool.name}
              tool={tool}
              completedCount={ANALYSIS_HISTORY.filter(h => h.type === tool.name).length}
              onClick={() => navigate(tool.path)}
            />
          ))}
        </div>
      </div>

      {/* Advanced Analytics */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1C2B3A' }}>Advanced Analytics</h2>
          <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', background: '#EDE9FE', color: '#5B21B6', borderRadius: 10, fontWeight: 600 }}>{advancedTools.length} tools</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {advancedTools.map(tool => (
            <ToolCard
              key={tool.name}
              tool={tool}
              completedCount={ANALYSIS_HISTORY.filter(h => h.type === tool.name).length}
              onClick={() => navigate(tool.path)}
              compact
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolCard({ tool, completedCount, onClick, compact = false }: { tool: AnalysisTool; completedCount: number; onClick: () => void; compact?: boolean }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        borderRadius: 12,
        padding: compact ? '0.875rem' : '1.1rem',
        border: '1px solid #E0E4E8',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'flex',
        flexDirection: compact ? 'row' : 'column',
        alignItems: compact ? 'center' : 'flex-start',
        gap: compact ? '0.75rem' : '0.75rem',
        position: 'relative',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = '0 4px 12px rgba(90,138,106,0.15)';
        el.style.borderColor = '#5A8A6A';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = 'none';
        el.style.borderColor = '#E0E4E8';
      }}
    >
      {completedCount > 0 && (
        <span style={{ position: 'absolute', top: compact ? 8 : 10, right: compact ? 8 : 10, background: '#E8F5E9', color: '#3D6B4F', borderRadius: 10, fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.45rem' }}>
          {completedCount} run{completedCount !== 1 ? 's' : ''}
        </span>
      )}
      <div style={{ color: '#5A8A6A', flexShrink: 0 }}>{tool.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: compact ? '0.85rem' : '0.95rem', color: '#1C2B3A', marginBottom: '0.2rem' }}>{tool.name}</div>
        {!compact && <div style={{ fontSize: '0.78rem', color: '#6B7280', lineHeight: 1.4 }}>{tool.desc}</div>}
        {compact && <div style={{ fontSize: '0.72rem', color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tool.desc}</div>}
      </div>
      {!compact && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.82rem', fontWeight: 600, color: '#5A8A6A' }}>
            Run <ChevronRight size={14} />
          </span>
        </div>
      )}
    </div>
  );
}
