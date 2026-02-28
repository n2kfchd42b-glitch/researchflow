// ─── ResearchFlow Shared UI Component Library ─────────────────────────────────
// Import from this file in all three product codebases.
//
// Usage:
//   import { DataTable, MetricCard, AlertBanner, ... } from '../../../packages/ui';
//   import type { ProductContext } from '../../../packages/ui';

export { default as AlertBanner }      from './AlertBanner';
export { default as ActivityFeed }     from './ActivityFeed';
export { default as ChartCard }        from './ChartCard';
export { default as DataTable }        from './DataTable';
export { default as FileUploader }     from './FileUploader';
export { default as HelpTooltip }      from './HelpTooltip';
export { default as MetricCard }       from './MetricCard';
export { default as ReportExporter }   from './ReportExporter';
export { default as StepIndicator }    from './StepIndicator';
export { default as ValidationWarning } from './ValidationWarning';

// Theme utilities
export { getTheme, THEME_TOKENS }      from './theme';
export type { ProductContext, ThemeToken } from './theme';

// Prop types
export type { AlertBannerProps, AlertSeverity, AlertAction } from './AlertBanner';
export type { ActivityFeedProps, ActivityEvent }             from './ActivityFeed';
export type { ChartCardProps, ChartType, ChartDataPoint }    from './ChartCard';
export type { DataTableProps, ColumnDef, BulkAction }        from './DataTable';
export type { FileUploaderProps }                            from './FileUploader';
export type { HelpTooltipProps, TooltipPlacement }           from './HelpTooltip';
export type { MetricCardProps }                              from './MetricCard';
export type { ReportExporterProps, ExportFormat }            from './ReportExporter';
export type { StepIndicatorProps, Step }                     from './StepIndicator';
export type { ValidationWarningProps, WarningSeverity }      from './ValidationWarning';
