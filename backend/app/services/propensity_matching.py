import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional

def compute_smd(treated: pd.Series, control: pd.Series) -> float:
    mean_diff = treated.mean() - control.mean()
    pooled_sd = np.sqrt((treated.std()**2 + control.std()**2) / 2)
    if pooled_sd == 0:
        return 0.0
    return round(float(mean_diff / pooled_sd), 3)

def run_propensity_matching(
    df: pd.DataFrame,
    treatment_col: str,
    covariate_cols: List[str],
    caliper: float = 0.2,
    ratio: int = 1,
) -> Dict[str, Any]:
    try:
        from sklearn.linear_model import LogisticRegression
        from sklearn.preprocessing import StandardScaler
    except ImportError:
        return {"error": "scikit-learn not installed"}

    df_clean = df[[treatment_col] + covariate_cols].dropna().copy()

    for col in covariate_cols:
        if df_clean[col].dtype == object or df_clean[col].nunique() <= 5:
            dummies = pd.get_dummies(df_clean[col], prefix=col, drop_first=True)
            df_clean = pd.concat([df_clean.drop(columns=[col]), dummies], axis=1)

    feature_cols = [c for c in df_clean.columns if c != treatment_col]
    X = df_clean[feature_cols].values
    y = df_clean[treatment_col].astype(int).values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_scaled, y)
    propensity_scores = model.predict_proba(X_scaled)[:, 1]

    df_clean = df_clean.copy()
    df_clean['propensity_score'] = propensity_scores
    df_clean['original_index']   = df_clean.index

    treated  = df_clean[df_clean[treatment_col] == 1].copy()
    control  = df_clean[df_clean[treatment_col] == 0].copy()

    caliper_value = caliper * propensity_scores.std()

    matched_treated_idx  = []
    matched_control_idx  = []
    used_control         = set()

    for _, t_row in treated.iterrows():
        t_score = t_row['propensity_score']
        available = control[~control.index.isin(used_control)].copy()
        if len(available) == 0:
            break
        available['distance'] = abs(available['propensity_score'] - t_score)
        available = available[available['distance'] <= caliper_value]
        if len(available) == 0:
            continue
        best_matches = available.nsmallest(ratio, 'distance')
        matched_treated_idx.append(t_row['original_index'])
        for idx in best_matches['original_index']:
            matched_control_idx.append(idx)
            used_control.add(best_matches.index[0])

    n_treated_matched = len(matched_treated_idx)
    n_control_matched = len(matched_control_idx)
    n_unmatched       = len(treated) - n_treated_matched

    balance_before = []
    balance_after  = []

    orig_covariate_cols = [c for c in covariate_cols if c in df.columns]

    for col in orig_covariate_cols:
        if df[col].dtype == object:
            continue
        t_vals_before = df[df[treatment_col] == 1][col].dropna()
        c_vals_before = df[df[treatment_col] == 0][col].dropna()
        smd_before    = compute_smd(t_vals_before, c_vals_before)

        if matched_treated_idx and matched_control_idx:
            t_vals_after = df.loc[df.index.isin(matched_treated_idx), col].dropna()
            c_vals_after = df.loc[df.index.isin(matched_control_idx), col].dropna()
            smd_after    = compute_smd(t_vals_after, c_vals_after)
        else:
            smd_after = smd_before

        balance_before.append({
            'covariate':     col,
            'treated_mean':  round(float(t_vals_before.mean()), 3),
            'control_mean':  round(float(c_vals_before.mean()), 3),
            'smd':           abs(smd_before),
            'balanced':      abs(smd_before) < 0.1,
        })
        balance_after.append({
            'covariate':     col,
            'treated_mean':  round(float(t_vals_after.mean()), 3) if matched_treated_idx else 0,
            'control_mean':  round(float(c_vals_after.mean()), 3) if matched_control_idx else 0,
            'smd':           abs(smd_after),
            'balanced':      abs(smd_after) < 0.1,
        })

    imbalanced_before = sum(1 for b in balance_before if not b['balanced'])
    imbalanced_after  = sum(1 for b in balance_after  if not b['balanced'])

    ps_distribution = {
        'treated': {
            'mean':   round(float(treated['propensity_score'].mean()), 3),
            'std':    round(float(treated['propensity_score'].std()), 3),
            'min':    round(float(treated['propensity_score'].min()), 3),
            'max':    round(float(treated['propensity_score'].max()), 3),
        },
        'control': {
            'mean':   round(float(control['propensity_score'].mean()), 3),
            'std':    round(float(control['propensity_score'].std()), 3),
            'min':    round(float(control['propensity_score'].min()), 3),
            'max':    round(float(control['propensity_score'].max()), 3),
        },
    }

    return {
        'n_treated_original': len(treated),
        'n_control_original': len(control),
        'n_treated_matched':  n_treated_matched,
        'n_control_matched':  n_control_matched,
        'n_unmatched':        n_unmatched,
        'match_rate':         round(n_treated_matched / len(treated) * 100, 1) if len(treated) > 0 else 0,
        'caliper':            round(caliper_value, 4),
        'balance_before':     balance_before,
        'balance_after':      balance_after,
        'imbalanced_before':  imbalanced_before,
        'imbalanced_after':   imbalanced_after,
        'ps_distribution':    ps_distribution,
        'matched_treated_ids': matched_treated_idx[:100],
        'matched_control_ids': matched_control_idx[:100],
        'model_auc':          round(float(
            __import__('sklearn.metrics', fromlist=['roc_auc_score'])
            .roc_auc_score(y, propensity_scores)
        ), 3),
    }
