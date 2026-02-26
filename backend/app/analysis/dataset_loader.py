import pandas as pd
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.database import DatasetVersion


def load_dataset(db: Session, project_id: int, dataset_version_id: int):
    dataset_version = db.query(DatasetVersion).filter_by(id=dataset_version_id, project_id=project_id).first()
    if not dataset_version:
        raise ValueError("Dataset version not found or does not belong to project.")
    df = pd.read_csv(dataset_version.path)
    # Schema enforcement
    schema_summary = {}
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            df[col] = pd.to_numeric(df[col], errors='coerce')
            schema_summary[col] = 'numeric'
        elif pd.api.types.is_categorical_dtype(df[col]):
            df[col] = df[col].astype('category')
            schema_summary[col] = 'category'
        elif pd.api.types.is_object_dtype(df[col]):
            # Try to convert to category if few unique values
            if df[col].nunique() < 20:
                df[col] = df[col].astype('category')
                schema_summary[col] = 'category'
            else:
                schema_summary[col] = 'object'
        else:
            schema_summary[col] = str(df[col].dtype)
    # Missingness summary
    missing_summary = df.isnull().sum().to_dict()
    # Performance guardrail
    warning = None
    if len(df) > 500_000:
        warning = "Large dataset may impact performance"
    return {
        "df": df,
        "schema_summary": schema_summary,
        "missing_summary": missing_summary,
        "warning": warning
    }
