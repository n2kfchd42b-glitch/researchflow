import pandas as pd

def run_analysis(df: pd.DataFrame, params: dict) -> dict:
    points = df[['latitude', 'longitude', 'outcome']].dropna().to_dict(orient='records')
    summary_stats = df['outcome'].describe().to_dict()
    region_means = None
    if 'region' in df.columns:
        region_means = df.groupby('region')['outcome'].mean().to_dict()
    return {
        "points": points,
        "summary_stats": summary_stats,
        "region_means": region_means
    }
