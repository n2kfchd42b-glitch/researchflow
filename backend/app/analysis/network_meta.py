import pandas as pd
import numpy as np

def run_analysis(df: pd.DataFrame, params: dict) -> dict:
    comparisons = df.groupby(['treatment', 'comparator']).size().reset_index(name='n_studies')
    pooled_effects = []
    network_edges = []
    for _, row in comparisons.iterrows():
        mask = (df['treatment'] == row['treatment']) & (df['comparator'] == row['comparator'])
        subset = df[mask]
        weights = 1 / (subset['standard_error'] ** 2)
        pooled = np.sum(subset['effect_size'] * weights) / np.sum(weights)
        pooled_se = np.sqrt(1 / np.sum(weights))
        pooled_effects.append({
            "treatment": row['treatment'],
            "comparator": row['comparator'],
            "pooled_effect": pooled,
            "pooled_se": pooled_se
        })
        network_edges.append({
            "source": row['treatment'],
            "target": row['comparator'],
            "weight": row['n_studies']
        })
    return {
        "comparisons": comparisons.to_dict(orient='records'),
        "pooled_effects": pooled_effects,
        "network_edges": network_edges
    }
