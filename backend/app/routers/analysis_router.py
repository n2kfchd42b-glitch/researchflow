from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.analysis import dataset_loader, its, did, mixed_models, spatial, network_meta

router = APIRouter(prefix="/analysis", tags=["analysis"])

def require_project_and_dataset(payload: dict):
    if 'project_id' not in payload or 'dataset_version_id' not in payload:
        raise HTTPException(status_code=400, detail="project_id and dataset_version_id required.")

@router.post("/its")
def interrupted_time_series(payload: dict, db: Session = Depends(get_db)):
    require_project_and_dataset(payload)
    df = dataset_loader.load_dataset(db, payload['project_id'], payload['dataset_version_id'])
    result = its.run_analysis(df, payload)
    return result

@router.post("/did")
def difference_in_differences(payload: dict, db: Session = Depends(get_db)):
    require_project_and_dataset(payload)
    df = dataset_loader.load_dataset(db, payload['project_id'], payload['dataset_version_id'])
    result = did.run_analysis(df, payload)
    return result

@router.post("/mixed")
def mixed_effects(payload: dict, db: Session = Depends(get_db)):
    require_project_and_dataset(payload)
    df = dataset_loader.load_dataset(db, payload['project_id'], payload['dataset_version_id'])
    result = mixed_models.run_analysis(df, payload)
    return result

@router.post("/spatial")
def spatial_analysis(payload: dict, db: Session = Depends(get_db)):
    require_project_and_dataset(payload)
    df = dataset_loader.load_dataset(db, payload['project_id'], payload['dataset_version_id'])
    result = spatial.run_analysis(df, payload)
    return result

@router.post("/network-meta")
def network_meta_analysis(payload: dict, db: Session = Depends(get_db)):
    require_project_and_dataset(payload)
    df = dataset_loader.load_dataset(db, payload['project_id'], payload['dataset_version_id'])
    result = network_meta.run_analysis(df, payload)
    return result
