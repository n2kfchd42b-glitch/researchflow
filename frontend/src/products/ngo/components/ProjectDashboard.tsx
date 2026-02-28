import React from 'react';
import { BarChart2, Users, DollarSign, Activity, TrendingUp } from 'lucide-react';
import { MetricCard, ChartCard, ChartDataPoint } from '../../../packages/ui';
import { useNGOPlatform } from '../context/NGOPlatformContext';
import ProgramSelector from './ProgramSelector';

/**
 * ProjectDashboard — NGO-specific grid layout that wraps shared MetricCard
 * and ChartCard components. Supports multi-project switching via ProgramSelector.
 */
export function ProjectDashboard() {
  const { state } = useNGOPlatform();

  const activeProgram = state.activeProgramId
    ? state.programs.find(p => p.id === state.activeProgramId)
    : null;

  const programIndicators = activeProgram
    ? state.indicators.filter(i => activeProgram.projectIds.includes(i.projectId))
    : state.indicators;

  const onTrack = programIndicators.filter(
    i => i.currentValue !== null && i.targetValue !== null && i.currentValue >= i.targetValue
  ).length;

  const totalIndicators    = programIndicators.length;
  const dataQualityScores  = Object.values(state.dataQualityScores);
  const avgQuality = dataQualityScores.length
    ? Math.round(dataQualityScores.reduce((s, v) => s + v, 0) / dataQualityScores.length)
    : 0;

  // Indicator status breakdown for chart
  const statusData: ChartDataPoint[] = [
    { name: 'On Track',    value: onTrack,                           color: '#5A8A6A' },
    { name: 'Off Track',   value: totalIndicators - onTrack,         color: '#E74C3C' },
    { name: 'No Data',     value: programIndicators.filter(i => i.currentValue === null).length, color: '#9CA3AF' },
  ].filter(d => d.value > 0);

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Multi-project switcher */}
      <div style={{ marginBottom: 16 }}>
        <ProgramSelector />
      </div>

      {/* Metric cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.25rem',
      }}>
        <MetricCard
          context="ngo"
          label="Active Programs"
          value={state.programs.length}
          icon={Activity}
        />
        <MetricCard
          context="ngo"
          label="Total Indicators"
          value={totalIndicators}
          icon={TrendingUp}
        />
        <MetricCard
          context="ngo"
          label="On Track"
          value={`${onTrack} / ${totalIndicators}`}
          delta={totalIndicators > 0 ? Math.round((onTrack / totalIndicators) * 100) : 0}
          deltaLabel="of targets"
          icon={BarChart2}
        />
        <MetricCard
          context="ngo"
          label="Avg. Data Quality"
          value={`${avgQuality}%`}
          icon={Users}
        />
        {activeProgram?.totalBudget ? (
          <MetricCard
            context="ngo"
            label="Budget Utilization"
            value="30%"
            delta={-5}
            deltaLabel="vs. planned"
            icon={DollarSign}
          />
        ) : null}
      </div>

      {/* Charts */}
      {totalIndicators > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}>
          <ChartCard
            context="ngo"
            chartType="pie"
            data={statusData}
            title="Indicator Status"
            subtitle={activeProgram ? activeProgram.name : 'All programs'}
            exportable
          />
        </div>
      )}
    </div>
  );
}

export default ProjectDashboard;
