import pandas as pd
import numpy as np
from lifelines import KaplanMeierFitter
from lifelines.statistics import logrank_test

def run_kaplan_meier(df, duration_col, event_col, group_col=None):
    if duration_col not in df.columns:
        raise ValueError(f"Duration column '{duration_col}' not found")
    if event_col not in df.columns:
        raise ValueError(f"Event column '{event_col}' not found")

    df = df[[c for c in [duration_col, event_col, group_col] if c]].dropna()
    df[duration_col] = pd.to_numeric(df[duration_col], errors='coerce')
    df[event_col]    = pd.to_numeric(df[event_col],    errors='coerce')
    df = df.dropna()
    df = df[df[duration_col] >= 0]

    results = {
        'groups':        [],
        'logrank_test':  None,
        'median_survival': {},
        'n':             len(df),
    }

    if group_col and group_col in df.columns:
        groups = df[group_col].unique()
        group_data = []
        for group in groups:
            mask   = df[group_col] == group
            subset = df[mask]
            kmf    = KaplanMeierFitter()
            kmf.fit(subset[duration_col], subset[event_col], label=str(group))
            timeline    = kmf.timeline.tolist()
            survival    = kmf.survival_function_[str(group)].tolist()
            ci_upper    = kmf.confidence_interval_[str(group) + '_upper_0.95'].tolist()
            ci_lower    = kmf.confidence_interval_[str(group) + '_lower_0.95'].tolist()
            median_surv = float(kmf.median_survival_time_)
            group_data.append({
                'group':    str(group),
                'n':        int(mask.sum()),
                'timeline': [round(t, 2) for t in timeline],
                'survival': [round(s, 4) for s in survival],
                'ci_upper': [round(c, 4) for c in ci_upper],
                'ci_lower': [round(c, 4) for c in ci_lower],
                'median':   median_surv if not np.isnan(median_surv) else None,
            })
            results['median_survival'][str(group)] = median_surv if not np.isnan(median_surv) else None

        results['groups'] = group_data

        if len(groups) == 2:
            g1 = df[df[group_col] == groups[0]]
            g2 = df[df[group_col] == groups[1]]
            lr = logrank_test(
                g1[duration_col], g2[duration_col],
                g1[event_col],    g2[event_col]
            )
            results['logrank_test'] = {
                'p_value':    round(float(lr.p_value), 4),
                'test_stat':  round(float(lr.test_statistic), 4),
                'significant': lr.p_value < 0.05,
            }
    else:
        kmf = KaplanMeierFitter()
        kmf.fit(df[duration_col], df[event_col], label='Overall')
        timeline    = kmf.timeline.tolist()
        survival    = kmf.survival_function_['Overall'].tolist()
        ci_upper    = kmf.confidence_interval_['Overall_upper_0.95'].tolist()
        ci_lower    = kmf.confidence_interval_['Overall_lower_0.95'].tolist()
        median_surv = float(kmf.median_survival_time_)
        results['groups'] = [{
            'group':    'Overall',
            'n':        len(df),
            'timeline': [round(t, 2) for t in timeline],
            'survival': [round(s, 4) for s in survival],
            'ci_upper': [round(c, 4) for c in ci_upper],
            'ci_lower': [round(c, 4) for c in ci_lower],
            'median':   median_surv if not np.isnan(median_surv) else None,
        }]
        results['median_survival']['Overall'] = median_surv if not np.isnan(median_surv) else None

    return results
