import pandas as pd
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.database import DatasetVersion

def load_dataset(db: Session, project_id: int, dataset_version_id: int) -> pd.DataFrame:
    dataset_version = db.query(DatasetVersion).filter_by(id=dataset_version_id, project_id=project_id).first()
    if not dataset_version:
        raise ValueError("Dataset version not found or does not belong to project.")
    df = pd.read_csv(dataset_version.path)
    return df
