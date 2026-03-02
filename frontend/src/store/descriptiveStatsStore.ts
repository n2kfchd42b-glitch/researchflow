import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VariableType = 'categorical' | 'continuous' | 'date';

export interface ColumnMeta {
  name: string;
  type: VariableType;
  nMissing: number;
  pctMissing: number;
}

export interface FrequencyRow {
  category: string;
  n: number;
  pct: number;
}

export interface CategoricalStats {
  type: 'categorical';
  variable: string;
  n_total: number;
  n_missing: number;
  pct_missing: number;
  n_unique: number;
  mode: string;
  frequencies: FrequencyRow[];
}

export interface HistogramBin {
  bin_start: number;
  bin_end: number;
  count: number;
}

export interface ContinuousStats {
  type: 'continuous';
  variable: string;
  n_total: number;
  n_missing: number;
  pct_missing: number;
  mean: number | null;
  sd: number | null;
  median: number | null;
  q1: number | null;
  q3: number | null;
  min: number | null;
  max: number | null;
  skewness: number | null;
  kurtosis: number | null;
  histogram_bins: HistogramBin[];
}

export type VariableStats = CategoricalStats | ContinuousStats;

export interface Table1Row {
  label: string;
  value: string;
}

export interface Table1Entry {
  variable: string;
  type: 'categorical' | 'continuous';
  summary_type: 'mean_sd' | 'median_iqr' | 'n_pct';
  rows: Table1Row[];
}

export interface Table1Response {
  n_total: number;
  table: Table1Entry[];
}

export type SummaryFormat = 'auto' | 'mean_sd' | 'median_iqr';

export interface LoadedDataset {
  id: string;
  name: string;
  columns: ColumnMeta[];
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface DescriptiveStatsState {
  loadedDataset: LoadedDataset | null;
  expandedVariable: string | null;
  variableStats: Record<string, VariableStats>;
  selectedForTable1: string[];
  table1Result: Table1Response | null;
  summaryFormat: SummaryFormat;

  // Actions
  setLoadedDataset: (dataset: LoadedDataset | null) => void;
  setExpandedVariable: (name: string | null) => void;
  cacheVariableStats: (name: string, stats: VariableStats) => void;
  toggleTable1Selection: (name: string) => void;
  clearTable1Selection: () => void;
  setTable1Result: (result: Table1Response | null) => void;
  setSummaryFormat: (format: SummaryFormat) => void;
  reset: () => void;
}

const INITIAL: Pick<
  DescriptiveStatsState,
  | 'loadedDataset'
  | 'expandedVariable'
  | 'variableStats'
  | 'selectedForTable1'
  | 'table1Result'
  | 'summaryFormat'
> = {
  loadedDataset: null,
  expandedVariable: null,
  variableStats: {},
  selectedForTable1: [],
  table1Result: null,
  summaryFormat: 'auto',
};

export const useDescriptiveStatsStore = create<DescriptiveStatsState>((set) => ({
  ...INITIAL,

  setLoadedDataset: (loadedDataset) =>
    set({ loadedDataset, expandedVariable: null, variableStats: {}, selectedForTable1: [], table1Result: null }),

  setExpandedVariable: (expandedVariable) => set({ expandedVariable }),

  cacheVariableStats: (name, stats) =>
    set((state) => ({ variableStats: { ...state.variableStats, [name]: stats } })),

  toggleTable1Selection: (name) =>
    set((state) => ({
      selectedForTable1: state.selectedForTable1.includes(name)
        ? state.selectedForTable1.filter((n) => n !== name)
        : [...state.selectedForTable1, name],
      table1Result: null, // clear stale result on selection change
    })),

  clearTable1Selection: () => set({ selectedForTable1: [], table1Result: null }),

  setTable1Result: (table1Result) => set({ table1Result }),

  setSummaryFormat: (summaryFormat) => set({ summaryFormat }),

  reset: () => set(INITIAL),
}));
