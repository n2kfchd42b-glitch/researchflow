import pandas as pd
import numpy as np
from typing import Dict, Any, List

def compute_descriptive(df: pd.DataFrame) -> Dict[str, Any]:
    numeric_cols     = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()

    numeric_summary = []
    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) == 0:
            continue
        q1  = float(series.quantile(0.25))
        q3  = float(series.quantile(0.75))
        row = {
            'variable':  col,
            'n':         int(series.count()),
            'missing':   int(df[col].isna().sum()),
            'missing_pct': round(float(df[col].isna().mean() * 100), 1),
            'mean':      round(float(series.mean()), 2),
            'sd':        round(float(series.std()), 2),
            'median':    round(float(series.median()), 2),
            'q1':        round(q1, 2),
            'q3':        round(q3, 2),
            'iqr':       round(q3 - q1, 2),
            'min':       round(float(series.min()), 2),
            'max':       round(float(series.max()), 2),
            'skewness':  round(float(series.skew()), 3),
            'kurtosis':  round(float(series.kurtosis()), 3),
        }
        try:
            from scipy import stats as scipy_stats
            if len(series) >= 3 and len(series) <= 5000:
                stat, p = scipy_stats.shapiro(series[:5000])
                row['shapiro_p']  = round(float(p), 4)
                row['normal']     = p > 0.05
            else:
                row['shapiro_p']  = None
                row['normal']     = None
        except Exception:
            row['shapiro_p'] = None
            row['normal']    = None
        numeric_summary.append(row)

    categorical_summary = []
    for col in categorical_cols:
        series   = df[col].dropna()
        vc       = series.value_counts()
        pct      = series.value_counts(normalize=True) * 100
        freq_table = [
            {'value': str(k), 'n': int(v), 'pct': round(float(pct[k]), 1)}
            for k, v in vc.items()
        ]
        categorical_summary.append({
            'variable':   col,
            'n':          int(series.count()),
            'missing':    int(df[col].isna().sum()),
            'missing_pct':round(float(df[col].isna().mean() * 100), 1),
            'n_unique':   int(series.nunique()),
            'mode':       str(series.mode()[0]) if len(series.mode()) > 0 else '',
            'freq_table': freq_table[:20],
        })

    correlation = {}
    if len(numeric_cols) > 1:
        corr_matrix = df[numeric_cols].corr().round(3)
        correlation = {
            'columns': numeric_cols,
            'matrix':  corr_matrix.values.tolist(),
        }

    return {
        'n_rows':               len(df),
        'n_cols':               len(df.columns),
        'numeric_summary':      numeric_summary,
        'categorical_summary':  categorical_summary,
        'correlation':          correlation,
        'numeric_cols':         numeric_cols,
        'categorical_cols':     categorical_cols,
    }
