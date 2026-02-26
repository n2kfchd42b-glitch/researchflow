import pandas as pd
import statsmodels.api as sm

def run_analysis(df: pd.DataFrame, params: dict) -> dict:
    time_col = params['time_column']
    outcome_col = params['outcome_column']
    intervention_point = params['intervention_point']

    df = df.sort_values(time_col).reset_index(drop=True)
    df['time_index'] = range(len(df))
    df['intervention'] = (df['time_index'] >= intervention_point).astype(int)
    df['post_time'] = (df['time_index'] - intervention_point).clip(lower=0)

    X = df[['time_index', 'intervention', 'post_time']]
    X = sm.add_constant(X)
    y = df[outcome_col]

    model = sm.OLS(y, X).fit()
    preds = model.predict(X)

    result = {
        "slope_pre": model.params['time_index'],
        "level_change": model.params['intervention'],
        "slope_change": model.params['post_time'],
        "p_values": model.pvalues.to_dict(),
        "confidence_intervals": model.conf_int().to_dict(),
        "predictions": preds.tolist()
    }
    return result
