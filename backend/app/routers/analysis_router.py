from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db

from app.analysis import dataset_loader, its, did, mixed_models, spatial, network_meta
from app.analysis.validation import validate_not_empty
from app.utils.logger import log_analysis
from datetime import datetime

router = APIRouter(prefix="/analysis", tags=["analysis"])

def require_project_and_dataset(payload: dict):
    if 'project_id' not in payload or 'dataset_version_id' not in payload:
        raise HTTPException(status_code=400, detail="project_id and dataset_version_id required.")


@router.post("/its")
def interrupted_time_series(payload: dict, db: Session = Depends(get_db)):
    require_project_and_dataset(payload)
    analysis_type = "ITS"
    try:
        ds = dataset_loader.load_dataset(db, payload['project_id'], payload['dataset_version_id'])
        df = ds['df']
        warning = ds['warning']
        schema_summary = ds['schema_summary']
        missing_summary = ds['missing_summary']
        err = validate_not_empty(df)
        if err:
            log_analysis(payload['project_id'], payload['dataset_version_id'], analysis_type, "error", err['error'])
            return err
        result = its.run_analysis(df, payload)
        # Add reproducibility metadata
        result['metadata'] = {
            "project_id": payload['project_id'],
            "dataset_version_id": payload['dataset_version_id'],
            "analysis_type": analysis_type,
            "timestamp": datetime.utcnow().isoformat()
        }
        result['schema_summary'] = schema_summary
        result['missing_summary'] = missing_summary
        if warning:
            result['warning'] = warning
        log_analysis(payload['project_id'], payload['dataset_version_id'], analysis_type, "success")
        return result
    except Exception as e:
        log_analysis(payload.get('project_id'), payload.get('dataset_version_id'), analysis_type, "error", str(e))
        return {"error": "Analysis failed", "details": str(e)}


@router.post("/did")
def difference_in_differences(payload: dict, db: Session = Depends(get_db)):
    require_project_and_dataset(payload)
    analysis_type = "DiD"
    try:
        ds = dataset_loader.load_dataset(db, payload['project_id'], payload['dataset_version_id'])
        df = ds['df']
        warning = ds['warning']
        schema_summary = ds['schema_summary']
        missing_summary = ds['missing_summary']
        err = validate_not_empty(df)
        if err:
            log_analysis(payload['project_id'], payload['dataset_version_id'], analysis_type, "error", err['error'])
            return err
        result = did.run_analysis(df, payload)
        result['metadata'] = {
            "project_id": payload['project_id'],
            "dataset_version_id": payload['dataset_version_id'],
            "analysis_type": analysis_type,
            "timestamp": datetime.utcnow().isoformat()
        }
        result['schema_summary'] = schema_summary
        result['missing_summary'] = missing_summary
        if warning:
            result['warning'] = warning
        log_analysis(payload['project_id'], payload['dataset_version_id'], analysis_type, "success")
        return result
    except Exception as e:
        log_analysis(payload.get('project_id'), payload.get('dataset_version_id'), analysis_type, "error", str(e))
        return {"error": "Analysis failed", "details": str(e)}

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
