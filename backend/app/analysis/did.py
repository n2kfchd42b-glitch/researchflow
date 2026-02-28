import pandas as pd
import statsmodels.api as sm

def run_analysis(df: pd.DataFrame, params: dict) -> dict:
    outcome = params['outcome_column']
    group = params['group_column']
    period = params['period_column']

    df['did'] = df[group] * df[period]
    X = df[[group, period, 'did']]
    X = sm.add_constant(X)
    y = df[outcome]

    model = sm.OLS(y, X).fit()

    group_means = df.groupby([group, period])[outcome].mean().unstack().to_dict()

    result = {
        "did_effect": model.params['did'],
        "coefficients": model.params.to_dict(),
        "p_values": model.pvalues.to_dict(),
        "confidence_intervals": model.conf_int().to_dict(),
        "group_means": group_means
    }
    return result
