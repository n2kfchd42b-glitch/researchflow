import pandas as pd
import numpy as np
from statsmodels.stats.outliers_influence import variance_inflation_factor
from statsmodels.stats.diagnostic import het_breuschpagan
from statsmodels.stats.stattools import durbin_watson
from scipy.stats import shapiro

def check_normality(residuals):
    try:
        stat, p = shapiro(residuals)
        return {"statistic": stat, "p_value": p, "normal": p > 0.05}
    except Exception:
        return {"error": "Normality check failed"}

def check_heteroskedasticity(residuals, exog):
    try:
        stat, p, _, _ = het_breuschpagan(residuals, exog)
        return {"statistic": stat, "p_value": p, "heteroskedastic": p < 0.05}
    except Exception:
        return {"error": "Heteroskedasticity check failed"}

def check_multicollinearity(X):
    try:
        vif = [variance_inflation_factor(X.values, i) for i in range(X.shape[1])]
        return {"vif": vif, "high_vif": any(v > 5 for v in vif)}
    except Exception:
        return {"error": "Multicollinearity check failed"}

def check_autocorrelation(residuals):
    try:
        dw = durbin_watson(residuals)
        return {"durbin_watson": dw, "autocorrelation": dw < 1.5 or dw > 2.5}
    except Exception:
        return {"error": "Autocorrelation check failed"}
