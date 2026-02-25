import numpy as np
from typing import Dict, Any, List

def compute_meta_analysis(studies: List[Dict]) -> Dict[str, Any]:
    """
    Each study should have:
    - name: str
    - effect_size: float (log OR, log RR, or MD)
    - se: float (standard error)
    - year: int (optional)
    - weight: float (optional, will be computed)
    """
    n = len(studies)
    if n == 0:
        return {"error": "No studies provided"}

    effects = np.array([s['effect_size'] for s in studies])
    ses     = np.array([s['se'] for s in studies])
    vars_   = ses ** 2

    # Fixed effects (inverse variance)
    w_fixed  = 1 / vars_
    pooled_fixed = np.sum(w_fixed * effects) / np.sum(w_fixed)
    se_fixed     = np.sqrt(1 / np.sum(w_fixed))
    ci_low_fixed = pooled_fixed - 1.96 * se_fixed
    ci_high_fixed= pooled_fixed + 1.96 * se_fixed
    z_fixed      = pooled_fixed / se_fixed
    p_fixed      = 2 * (1 - _normal_cdf(abs(z_fixed)))

    # Heterogeneity (Q statistic)
    Q   = np.sum(w_fixed * (effects - pooled_fixed) ** 2)
    df  = n - 1
    p_Q = 1 - _chi2_cdf(Q, df)
    I2  = max(0, (Q - df) / Q * 100) if Q > 0 else 0

    # DerSimonian-Laird tau2
    C    = np.sum(w_fixed) - np.sum(w_fixed**2) / np.sum(w_fixed)
    tau2 = max(0, (Q - df) / C) if C > 0 else 0

    # Random effects
    w_random  = 1 / (vars_ + tau2)
    pooled_random = np.sum(w_random * effects) / np.sum(w_random)
    se_random     = np.sqrt(1 / np.sum(w_random))
    ci_low_random = pooled_random - 1.96 * se_random
    ci_high_random= pooled_random + 1.96 * se_random
    z_random      = pooled_random / se_random
    p_random      = 2 * (1 - _normal_cdf(abs(z_random)))

    # Study weights (%)
    w_pct_fixed  = (w_fixed  / np.sum(w_fixed))  * 100
    w_pct_random = (w_random / np.sum(w_random)) * 100

    # Egger's test (simple linear regression of effect/se on 1/se)
    egger_p = None
    if n >= 3:
        try:
            x = 1 / ses
            y = effects / ses
            x_mean = np.mean(x)
            y_mean = np.mean(y)
            slope  = np.sum((x - x_mean) * (y - y_mean)) / np.sum((x - x_mean)**2)
            intercept = y_mean - slope * x_mean
            residuals = y - (slope * x + intercept)
            se_intercept = np.sqrt(np.sum(residuals**2) / (n-2) / np.sum((x-x_mean)**2))
            t_stat = intercept / se_intercept if se_intercept > 0 else 0
            egger_p = round(float(2 * (1 - _t_cdf(abs(t_stat), n-2))), 4)
        except Exception:
            egger_p = None

    studies_out = []
    for i, s in enumerate(studies):
        ci_low  = s['effect_size'] - 1.96 * s['se']
        ci_high = s['effect_size'] + 1.96 * s['se']
        studies_out.append({
            'name':          s.get('name', f'Study {i+1}'),
            'year':          s.get('year', ''),
            'effect_size':   round(float(s['effect_size']), 3),
            'se':            round(float(s['se']), 3),
            'ci_low':        round(float(ci_low), 3),
            'ci_high':       round(float(ci_high), 3),
            'weight_fixed':  round(float(w_pct_fixed[i]), 1),
            'weight_random': round(float(w_pct_random[i]), 1),
            'n':             s.get('n', ''),
        })

    heterogeneity_interpretation = (
        'Low' if I2 < 25 else
        'Moderate' if I2 < 50 else
        'Substantial' if I2 < 75 else
        'Considerable'
    )

    return {
        'n_studies':     n,
        'fixed': {
            'pooled':   round(float(pooled_fixed), 3),
            'se':       round(float(se_fixed), 3),
            'ci_low':   round(float(ci_low_fixed), 3),
            'ci_high':  round(float(ci_high_fixed), 3),
            'z':        round(float(z_fixed), 3),
            'p':        round(float(p_fixed), 4),
        },
        'random': {
            'pooled':   round(float(pooled_random), 3),
            'se':       round(float(se_random), 3),
            'ci_low':   round(float(ci_low_random), 3),
            'ci_high':  round(float(ci_high_random), 3),
            'z':        round(float(z_random), 3),
            'p':        round(float(p_random), 4),
        },
        'heterogeneity': {
            'Q':            round(float(Q), 3),
            'df':           int(df),
            'p_Q':          round(float(p_Q), 4),
            'I2':           round(float(I2), 1),
            'tau2':         round(float(tau2), 4),
            'interpretation': heterogeneity_interpretation,
        },
        'egger_p':   egger_p,
        'studies':   studies_out,
    }

def _normal_cdf(z: float) -> float:
    import math
    return 0.5 * (1 + math.erf(z / math.sqrt(2)))

def _chi2_cdf(x: float, df: int) -> float:
    from math import gamma, exp, inf
    if x <= 0:
        return 0.0
    try:
        import scipy.stats
        return float(scipy.stats.chi2.cdf(x, df))
    except Exception:
        return 0.5

def _t_cdf(t: float, df: int) -> float:
    try:
        import scipy.stats
        return float(scipy.stats.t.cdf(t, df))
    except Exception:
        return _normal_cdf(t)
