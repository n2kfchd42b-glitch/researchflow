import pandas as pd
from typing import List, Dict, Any

OPERATORS = {
    'equals':         lambda col, val: col == val,
    'not_equals':     lambda col, val: col != val,
    'greater_than':   lambda col, val: col > float(val),
    'less_than':      lambda col, val: col < float(val),
    'greater_equal':  lambda col, val: col >= float(val),
    'less_equal':     lambda col, val: col <= float(val),
    'contains':       lambda col, val: col.astype(str).str.contains(str(val), case=False, na=False),
    'not_contains':   lambda col, val: ~col.astype(str).str.contains(str(val), case=False, na=False),
    'is_missing':     lambda col, val: col.isna(),
    'is_not_missing': lambda col, val: col.notna(),
}

def apply_criteria(df, criteria):
    mask = pd.Series([True] * len(df), index=df.index)
    for criterion in criteria:
        column   = criterion.get('column')
        operator = criterion.get('operator')
        value    = criterion.get('value', '')
        if column not in df.columns or operator not in OPERATORS:
            continue
        try:
            condition = OPERATORS[operator](df[column], value)
            mask = mask & condition
        except Exception:
            continue
    return df[mask]

def build_cohort(df, inclusion_criteria, exclusion_criteria):
    original_n        = len(df)
    after_inclusion   = apply_criteria(df, inclusion_criteria) if inclusion_criteria else df
    inclusion_n       = len(after_inclusion)

    if exclusion_criteria:
        exclusion_mask = pd.Series([True] * len(after_inclusion), index=after_inclusion.index)
        for criterion in exclusion_criteria:
            column   = criterion.get('column')
            operator = criterion.get('operator')
            value    = criterion.get('value', '')
            if column not in after_inclusion.columns or operator not in OPERATORS:
                continue
            try:
                condition = OPERATORS[operator](after_inclusion[column], value)
                exclusion_mask = exclusion_mask & condition
            except Exception:
                continue
        final_df = after_inclusion[~exclusion_mask]
    else:
        final_df = after_inclusion

    final_n = len(final_df)
    return {
        'original_n':            original_n,
        'after_inclusion_n':     inclusion_n,
        'excluded_by_inclusion': original_n - inclusion_n,
        'excluded_by_exclusion': inclusion_n - final_n,
        'final_n':               final_n,
        'exclusion_rate':        round((1 - final_n / original_n) * 100, 1) if original_n > 0 else 0,
        'final_df':              final_df,
        'consort_flow': [
            {'label': 'Records identified',       'n': original_n},
            {'label': 'After inclusion criteria', 'n': inclusion_n},
            {'label': 'Final analytic cohort',    'n': final_n},
        ]
    }

def get_column_summary(df, column):
    if column not in df.columns:
        return {}
    series = df[column]
    if pd.api.types.is_numeric_dtype(series):
        return {
            'type':    'numeric',
            'min':     round(float(series.min()), 2),
            'max':     round(float(series.max()), 2),
            'mean':    round(float(series.mean()), 2),
            'missing': int(series.isna().sum()),
        }
    else:
        return {
            'type':     'categorical',
            'values':   series.dropna().unique().tolist()[:20],
            'missing':  int(series.isna().sum()),
        }
