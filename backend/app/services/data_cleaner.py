import pandas as pd
import numpy as np
from typing import Dict, Any, List

def detect_outliers(df: pd.DataFrame, column: str, method: str = 'iqr') -> Dict[str, Any]:
    if column not in df.columns:
        return {}
    series = pd.to_numeric(df[column], errors='coerce').dropna()
    if len(series) == 0:
        return {}

    if method == 'iqr':
        Q1 = series.quantile(0.25)
        Q3 = series.quantile(0.75)
        IQR = Q3 - Q1
        lower = Q1 - 1.5 * IQR
        upper = Q3 + 1.5 * IQR
    else:  # zscore
        mean = series.mean()
        std  = series.std()
        lower = mean - 3 * std
        upper = mean + 3 * std

    outlier_mask = (series < lower) | (series > upper)
    outlier_indices = series[outlier_mask].index.tolist()

    return {
        'column':          column,
        'method':          method,
        'lower_bound':     round(float(lower), 3),
        'upper_bound':     round(float(upper), 3),
        'outlier_count':   int(outlier_mask.sum()),
        'outlier_pct':     round(float(outlier_mask.mean() * 100), 1),
        'outlier_values':  series[outlier_mask].tolist()[:20],
        'mean':            round(float(series.mean()), 3),
        'std':             round(float(series.std()), 3),
        'min':             round(float(series.min()), 3),
        'max':             round(float(series.max()), 3),
    }

def detect_duplicates(df: pd.DataFrame) -> Dict[str, Any]:
    dup_mask    = df.duplicated()
    dup_count   = int(dup_mask.sum())
    return {
        'duplicate_count': dup_count,
        'duplicate_pct':   round(float(dup_mask.mean() * 100), 1),
        'total_rows':      len(df),
    }

def impute_missing(df: pd.DataFrame, column: str, method: str = 'mean') -> Dict[str, Any]:
    if column not in df.columns:
        return {'error': 'Column not found'}

    missing_before = int(df[column].isna().sum())
    if missing_before == 0:
        return {'message': 'No missing values', 'imputed': 0}

    df_copy = df.copy()
    series  = pd.to_numeric(df_copy[column], errors='coerce')

    if method == 'mean':
        fill_val = series.mean()
    elif method == 'median':
        fill_val = series.median()
    elif method == 'mode':
        mode = df_copy[column].mode()
        fill_val = mode[0] if len(mode) > 0 else None
    elif method == 'zero':
        fill_val = 0
    else:
        fill_val = series.mean()

    if fill_val is not None:
        df_copy[column] = df_copy[column].fillna(fill_val)

    missing_after = int(df_copy[column].isna().sum())

    return {
        'column':         column,
        'method':         method,
        'fill_value':     round(float(fill_val), 3) if isinstance(fill_val, float) else fill_val,
        'imputed_count':  missing_before - missing_after,
        'missing_before': missing_before,
        'missing_after':  missing_after,
    }

def recode_variable(df: pd.DataFrame, column: str, mapping: Dict) -> Dict[str, Any]:
    if column not in df.columns:
        return {'error': 'Column not found'}
    before = df[column].value_counts().to_dict()
    df_copy = df.copy()
    df_copy[column] = df_copy[column].map(mapping).fillna(df_copy[column])
    after = df_copy[column].value_counts().to_dict()
    return {
        'column':       column,
        'before':       {str(k): int(v) for k, v in before.items()},
        'after':        {str(k): int(v) for k, v in after.items()},
        'recoded_count': sum(1 for v in mapping.values() if v is not None),
    }

def get_cleaning_summary(df: pd.DataFrame) -> Dict[str, Any]:
    summary = {
        'total_rows':    len(df),
        'total_columns': len(df.columns),
        'missing':       {},
        'outliers':      {},
        'duplicates':    detect_duplicates(df),
        'recommendations': [],
    }

    for col in df.columns:
        missing_pct = round(float(df[col].isna().mean() * 100), 1)
        if missing_pct > 0:
            summary['missing'][col] = missing_pct

        if pd.api.types.is_numeric_dtype(df[col]):
            outlier_info = detect_outliers(df, col)
            if outlier_info.get('outlier_count', 0) > 0:
                summary['outliers'][col] = outlier_info['outlier_count']

    if summary['duplicates']['duplicate_count'] > 0:
        summary['recommendations'].append(
            f"Remove {summary['duplicates']['duplicate_count']} duplicate rows"
        )
    for col, pct in summary['missing'].items():
        if pct > 30:
            summary['recommendations'].append(f"Consider dropping '{col}' — {pct}% missing")
        elif pct > 5:
            summary['recommendations'].append(f"Impute missing values in '{col}' — {pct}% missing")
    for col, count in summary['outliers'].items():
        if count > 5:
            summary['recommendations'].append(f"Review outliers in '{col}' — {count} detected")

    return summary
