import pandas as pd

def validate_column_exists(df: pd.DataFrame, column: str):
    if column not in df.columns:
        return {"error": f"Column '{column}' does not exist.", "details": f"Available columns: {list(df.columns)}"}
    return None

def validate_numeric_column(df: pd.DataFrame, column: str):
    err = validate_column_exists(df, column)
    if err:
        return err
    if not pd.api.types.is_numeric_dtype(df[column]):
        return {"error": f"Column '{column}' is not numeric.", "details": str(df[column].dtype)}
    return None

def validate_binary_column(df: pd.DataFrame, column: str):
    err = validate_column_exists(df, column)
    if err:
        return err
    unique_vals = df[column].dropna().unique()
    if len(unique_vals) != 2:
        return {"error": f"Column '{column}' is not binary.", "details": f"Unique values: {unique_vals}"}
    return None

def validate_not_empty(df: pd.DataFrame):
    if df.empty:
        return {"error": "Dataset is empty.", "details": "No rows found."}
    return None
