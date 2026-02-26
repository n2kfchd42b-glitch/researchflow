export interface ITSResult {
  slope_pre: number;
  level_change: number;
  slope_change: number;
  p_values: Record<string, number>;
  confidence_intervals: Record<string, [number, number]>;
  predictions: number[];
}

export interface DiDResult {
  did_effect: number;
  coefficients: Record<string, number>;
  p_values: Record<string, number>;
  confidence_intervals: Record<string, [number, number]>;
  group_means: Record<string, Record<string, number>>;
}

export interface MixedEffectsResult {
  fixed_effects: Record<string, number>;
  random_variance: number[][];
  p_values: Record<string, number>;
  confidence_intervals: Record<string, [number, number]>;
}

export interface SpatialResult {
  points: { latitude: number; longitude: number; outcome: number }[];
  summary_stats: Record<string, number>;
  region_means?: Record<string, number> | null;
}

export interface NetworkMetaResult {
  comparisons: any[];
  pooled_effects: {
    treatment: string;
    comparator: string;
    pooled_effect: number;
    pooled_se: number;
  }[];
  network_edges: {
    source: string;
    target: string;
    weight: number;
  }[];
}
