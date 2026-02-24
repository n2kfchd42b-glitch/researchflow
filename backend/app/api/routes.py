
from datetime import datetime, timedelta
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional
import pandas as pd, tempfile, os, uuid, sys, io, threading, time
sys.path.insert(0, '.')
from app.analytics.ingestion import DataIngestionEngine
from app.analytics.statistics import StatisticsEngine
from app.analytics.rigor import RigorScoreEngine
from app.services.report_generator import ReportGenerator
from app.services.auth import register_user, login_user, decode_token
from app.services.methodology_memory import save_template, get_templates, get_template, delete_template, get_community_templates
from app.services.cohort_builder import build_cohort, get_column_summary
from app.services.survival_analysis import run_kaplan_meier
from fastapi.responses import StreamingResponse

router = APIRouter()

# In-memory store for prototype
studies = {}
datasets = {}

def get_dataset_df(dataset_id):
    if dataset_id in datasets and 'df' in datasets[dataset_id]:
        return datasets[dataset_id]['df']
    path = f'/tmp/{dataset_id}.csv'
    if os.path.exists(path):
        df = pd.read_csv(path)
        datasets[dataset_id] = {'df': df}
        return df
    raise HTTPException(status_code=404, detail="Dataset not found")

def get_dataset(dataset_id: str):
    if dataset_id in datasets:
        return datasets[dataset_id]['df']
    csv_path = f'/tmp/{dataset_id}.csv'
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        datasets[dataset_id] = {'df': df, 'created_at': datetime.utcnow().isoformat()}
        return df
    raise HTTPException(status_code=404, detail="Dataset not found")

# --- Models ---
class StudyPayload(BaseModel):
    title: str
    description: Optional[str] = ""
    study_type: Optional[str] = "retrospective_cohort"
    user_role: Optional[str] = "ngo"

class AnalysePayload(BaseModel):
    dataset_id: str
    outcome_column: str
    predictor_columns: list
    duration_column: Optional[str] = None

class RegisterRequest(BaseModel):
    name:     str
    email:    str
    password: str
    role:     str = "student"

class LoginRequest(BaseModel):
    email:    str
    password: str

class SaveTemplateRequest(BaseModel):
    name:              str
    description:       str = ""
    study_type:        str
    outcome_column:    str
    predictor_columns: list
    research_question: str = ""
    user_email:        str
    organisation:      str = ""
    is_public:         bool = False

class CohortRequest(BaseModel):
    dataset_id:          str
    inclusion_criteria:  list = []
    exclusion_criteria:  list = []

class ColumnSummaryRequest(BaseModel):
    dataset_id: str
    column:     str

class SurvivalRequest(BaseModel):
    dataset_id:   str
    duration_col: str
    event_col:    str
    group_col:    str = None

# --- Endpoints ---
@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    try:
        suffix = os.path.splitext(file.filename)[1].lower()
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        engine = DataIngestionEngine()
        df, report = engine.ingest(tmp_path)
        os.unlink(tmp_path)
        dataset_id = str(uuid.uuid4())
        datasets[dataset_id] = {
            "df": df,
            "report": report,
            "filename": file.filename
        }
        df.to_csv(f'/tmp/{dataset_id}.csv', index=False)
        log_event(
            user_email="system",
            action="UPLOAD",
            details={"filename": file.filename, "rows": report["row_count"]},
            dataset_id=dataset_id
        )
        return {
            "dataset_id": dataset_id,
            "filename": file.filename,
            "rows": report["row_count"],
            "columns": report["column_count"],
            "column_types": report["column_types"],
            "issues": report["issues"],
            "missing_percentage": report["missing_percentage"],
            "numeric_summary": report["numeric_summary"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/study")
def create_study(payload: StudyPayload):
    study_id = str(uuid.uuid4())
    studies[study_id] = {
        "id": study_id,
        "title": payload.title,
        "description": payload.description,
        "study_type": payload.study_type,
        "user_role": payload.user_role,
        "status": "draft",
        "results": None,
        "rigor_score": None
    }
    return studies[study_id]

@router.post("/study/{study_id}/analyse")
def analyse_study(study_id: str, payload: AnalysePayload):
    if study_id not in studies:
        raise HTTPException(status_code=404, detail="Study not found")
    df = get_dataset(payload.dataset_id)
    quality_report = datasets[payload.dataset_id].get("report") if payload.dataset_id in datasets else None
    study = studies[study_id]
    stats_engine = StatisticsEngine()
    rigor_engine = RigorScoreEngine()
    try:
        if payload.duration_column:
            result = stats_engine.survival_analysis(
                df,
                payload.duration_column,
                payload.outcome_column,
                payload.predictor_columns[0] if payload.predictor_columns else None
            )
        else:
            result = stats_engine.logistic_regression(
                df,
                payload.outcome_column,
                payload.predictor_columns
            )
        rigor = rigor_engine.score(quality_report, result)
        studies[study_id]["status"] = "complete"
        studies[study_id]["results"] = result
        studies[study_id]["rigor_score"] = rigor
        log_event(
            user_email="system",
            action="ANALYSE",
            details={
                "outcome": payload.outcome_column,
                "predictors": payload.predictor_columns,
                "model": result.get("model")
            },
            study_id=study_id,
            dataset_id=payload.dataset_id
        )
        return {
            "study_id": study_id,
            "status": "complete",
            "results": result,
            "rigor_score": rigor
        }
    except Exception as e:
        studies[study_id]["status"] = "error"
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/study/{study_id}/results")
def get_results(study_id: str):
    if study_id not in studies:
        raise HTTPException(status_code=404, detail="Study not found")
    study = studies[study_id]
    if not study["results"]:
        raise HTTPException(status_code=400, detail="Analysis not yet run")
    return study["results"]

@router.get("/study/{study_id}/rigor")
def get_rigor(study_id: str):
    if study_id not in studies:
        raise HTTPException(status_code=404, detail="Study not found")
    study = studies[study_id]
    if not study["rigor_score"]:
        raise HTTPException(status_code=400, detail="Analysis not yet run")
    return study["rigor_score"]

@router.get("/studies")
def list_studies():
    return [
        {
            "id": s["id"],
            "title": s["title"],
            "status": s["status"],
            "study_type": s["study_type"],
            "user_role": s["user_role"],
            "rigor_score": s["rigor_score"]["overall_score"] if s["rigor_score"] else None
        }
        for s in studies.values()
    ]

@router.post("/study/{study_id}/report")
def generate_report(study_id: str, template: str = "ngo"):
    if study_id not in studies:
        raise HTTPException(status_code=404, detail="Study not found")
    study = studies[study_id]
    if not study["results"]:
        raise HTTPException(status_code=400, detail="Run analysis first")
    log_event(
        user_email="system",
        action="DOWNLOAD_REPORT",
        details={"template": template},
        study_id=study_id
    )
    generator = ReportGenerator()
    pdf_bytes = generator.generate(
        template=template,
        study_info={
            "title": study["title"],
            "organisation": "ResearchFlow",
            "donor": "Funder",
            "study_type": study["study_type"]
        },
        analysis_result=study["results"],
        rigor_score=study["rigor_score"]
    )
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=researchflow_{template}_report.pdf"
        }
    )

@router.post("/auth/register")
def register(req: RegisterRequest):
    try:
        user = register_user(req.name, req.email, req.password, req.role)
        token = login_user(req.email, req.password)
        return token
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/auth/login")
def login(req: LoginRequest):
    try:
        return login_user(req.email, req.password)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.get("/auth/me")
def get_me(authorization: str = None):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload

@router.post("/templates")
def create_template(req: SaveTemplateRequest):
    try:
        template = save_template(
            name=req.name,
            description=req.description,
            study_type=req.study_type,
            outcome_column=req.outcome_column,
            predictor_columns=req.predictor_columns,
            research_question=req.research_question,
            user_email=req.user_email,
            organisation=req.organisation,
            is_public=req.is_public
        )
        return template
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/templates")
def list_templates(user_email: str, organisation: str = ""):
    return get_templates(user_email, organisation)

@router.get("/templates/community")
def community_templates():
    return get_community_templates()

@router.get("/templates/{template_id}")
def load_template(template_id: str):
    try:
        return get_template(template_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/templates/{template_id}")
def remove_template(template_id: str, user_email: str):
    try:
        delete_template(template_id, user_email)
        return {"deleted": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/cohort/build")
def cohort_build(req: CohortRequest):
    df = get_dataset(req.dataset_id)
    result = build_cohort(df, req.inclusion_criteria, req.exclusion_criteria)
    return {
        'original_n':            result['original_n'],
        'after_inclusion_n':     result['after_inclusion_n'],
        'excluded_by_inclusion': result['excluded_by_inclusion'],
        'excluded_by_exclusion': result['excluded_by_exclusion'],
        'final_n':               result['final_n'],
        'exclusion_rate':        result['exclusion_rate'],
        'consort_flow':          result['consort_flow'],
    }

@router.post("/cohort/column-summary")
def column_summary(req: ColumnSummaryRequest):
    df = get_dataset(req.dataset_id)
    return get_column_summary(df, req.column)

@router.post("/survival/kaplan-meier")
def kaplan_meier(req: SurvivalRequest):
    df = get_dataset_df(req.dataset_id)
    try:
        result = run_kaplan_meier(df, req.duration_col, req.event_col, req.group_col)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Utility & Info Endpoints ---
def cleanup_old_data():
    while True:
        time.sleep(3600)
        now = datetime.utcnow()
        to_delete = []
        for did, dataset in list(datasets.items()):
            created = dataset.get('created_at')
            if created:
                age = (now - datetime.fromisoformat(created)).seconds
                if age > 3600:
                    to_delete.append(did)
        for did in to_delete:
            del datasets[did]
        to_delete_studies = []
        for sid, study in list(studies.items()):
            created = study.get('created_at')
            if created:
                age = (now - datetime.fromisoformat(created)).seconds
                if age > 3600:
                    to_delete_studies.append(sid)
        for sid in to_delete_studies:
            del studies[sid]

cleanup_thread = threading.Thread(target=cleanup_old_data, daemon=True)
cleanup_thread.start()

@router.get("/privacy")
def privacy_info():
    return {
        "data_retention": "All uploaded data is stored in memory only and automatically deleted after 1 hour",
        "file_storage": "Uploaded files are deleted immediately after processing",
        "persistent_storage": "No data is written to disk or permanent storage",
        "user_data": "Only email and hashed password are stored in memory for authentication",
        "version": "ResearchFlow v0.1.0"
    }

# In-memory store for prototype
studies = {}
datasets = {}

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    try:
        suffix = os.path.splitext(file.filename)[1].lower()
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=suffix
        ) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        engine = DataIngestionEngine()
        df, report = engine.ingest(tmp_path)
        os.unlink(tmp_path)

        dataset_id = str(uuid.uuid4())
        datasets[dataset_id] = {
            "df": df,
            "report": report,
            "filename": file.filename
        }
        # Save DataFrame to disk as CSV
        df.to_csv(f'/tmp/{dataset_id}.csv', index=False)

        return {
            "dataset_id": dataset_id,
            "filename": file.filename,
            "rows": report["row_count"],
            "columns": report["column_count"],
            "column_types": report["column_types"],
            "issues": report["issues"],
            "missing_percentage": report["missing_percentage"],
            "numeric_summary": report["numeric_summary"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/study")
def create_study(payload: StudyPayload):
    study_id = str(uuid.uuid4())
    studies[study_id] = {
        "id": study_id,
        "title": payload.title,
        "description": payload.description,
        "study_type": payload.study_type,
        "user_role": payload.user_role,
        "status": "draft",
        "results": None,
        "rigor_score": None
    }
    return studies[study_id]

@router.post("/study/{study_id}/analyse")
def analyse_study(study_id: str, payload: AnalysePayload):
    if study_id not in studies:
        raise HTTPException(status_code=404, detail="Study not found")
    if payload.dataset_id not in datasets:
        import os
        csv_path = f'/tmp/{payload.dataset_id}.csv'
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            datasets[payload.dataset_id] = {'df': df, 'created_at': datetime.utcnow().isoformat()}
            quality_report = None
        else:
            raise HTTPException(status_code=404, detail="Dataset not found")
    else:
        df = datasets[payload.dataset_id]["df"]
        quality_report = datasets[payload.dataset_id].get("report")
        df = get_dataset(payload.dataset_id)
        quality_report = datasets[payload.dataset_id].get("report") if payload.dataset_id in datasets else None

    study = studies[study_id]

    stats_engine = StatisticsEngine()
    rigor_engine = RigorScoreEngine()

    try:
        if payload.duration_column:
            result = stats_engine.survival_analysis(
                df,
                payload.duration_column,
                payload.outcome_column,
                payload.predictor_columns[0] 
                if payload.predictor_columns else None
            )
        else:
            result = stats_engine.logistic_regression(
                df,
                payload.outcome_column,
                payload.predictor_columns
            )

        rigor = rigor_engine.score(quality_report, result)

        studies[study_id]["status"] = "complete"
        studies[study_id]["results"] = result
        studies[study_id]["rigor_score"] = rigor

        return {
            "study_id": study_id,
            "status": "complete",
            "results": result,
            "rigor_score": rigor
        }
    except Exception as e:
        studies[study_id]["status"] = "error"
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/study/{study_id}/results")
def get_results(study_id: str):
    if study_id not in studies:
        raise HTTPException(status_code=404, detail="Study not found")
    study = studies[study_id]
    if not study["results"]:
        raise HTTPException(
            status_code=400, 
            detail="Analysis not yet run"
        )
    return study["results"]

@router.get("/study/{study_id}/rigor")
def get_rigor(study_id: str):
    if study_id not in studies:
        raise HTTPException(status_code=404, detail="Study not found")
    study = studies[study_id]
    if not study["rigor_score"]:
        raise HTTPException(
            status_code=400,
            detail="Analysis not yet run"
        )
    return study["rigor_score"]

@router.get("/studies")
def list_studies():
    return [
        {
            "id": s["id"],
            "title": s["title"],
            "status": s["status"],
            "study_type": s["study_type"],
            "user_role": s["user_role"],
            "rigor_score": s["rigor_score"]["overall_score"] 
            if s["rigor_score"] else None
        }
        for s in studies.values()
    ]

@router.post("/study/{study_id}/report")
def generate_report(study_id: str, template: str = "ngo"):
    if study_id not in studies:
        raise HTTPException(status_code=404, detail="Study not found")
    study = studies[study_id]
    if not study["results"]:
        raise HTTPException(status_code=400, detail="Run analysis first")

    generator = ReportGenerator()
    pdf_bytes = generator.generate(
        template=template,
        study_info={
            "title":        study["title"],
            "organisation": "ResearchFlow",
            "donor":        "Funder",
            "study_type":   study["study_type"]
        },
        analysis_result=study["results"],
        rigor_score=study["rigor_score"]
    )

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": 
            f"attachment; filename=researchflow_{template}_report.pdf"
        }
    )
from app.services.report_generator import ReportGenerator
from fastapi.responses import StreamingResponse
import io

@router.post("/study/{study_id}/report")
def generate_report(study_id: str, template: str = "ngo"):
    if study_id not in studies:
        raise HTTPException(status_code=404, detail="Study not found")
    study = studies[study_id]
    if not study["results"]:
        raise HTTPException(status_code=400, detail="Run analysis first")

    generator = ReportGenerator()
    pdf_bytes = generator.generate(
        template=template,
        study_info={
            "title":      study["title"],
            "organisation": "ResearchFlow",
            "donor":      "Funder",
            "study_type": study["study_type"]
        },
        analysis_result=study["results"],
        rigor_score=study["rigor_score"]
    )

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition":
            f"attachment; filename=researchflow_{template}_report.pdf"
        }
    )

from app.services.auth import register_user, login_user, decode_token
from pydantic import BaseModel as PydanticBase

class RegisterRequest(PydanticBase):
    name:     str
    email:    str
    password: str
    role:     str = "student"

class LoginRequest(PydanticBase):
    email:    str
    password: str

@router.post("/auth/register")
def register(req: RegisterRequest):
    try:
        user = register_user(req.name, req.email, req.password, req.role)
        token = login_user(req.email, req.password)
        return token
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/auth/login")
def login(req: LoginRequest):
    try:
        return login_user(req.email, req.password)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.get("/auth/me")
def get_me(authorization: str = None):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload

import threading
import time

def cleanup_old_data():
    while True:
        time.sleep(3600)  # run every hour
        now = datetime.utcnow()
        to_delete = []
        for did, dataset in datasets.items():
            created = dataset.get('created_at')
            if created:
                age = (now - datetime.fromisoformat(created)).seconds
                if age > 3600:
                    to_delete.append(did)
        for did in to_delete:
            del datasets[did]

        to_delete_studies = []
        for sid, study in studies.items():
            created = study.get('created_at')
            if created:
                age = (now - datetime.fromisoformat(created)).seconds
                if age > 3600:
                    to_delete_studies.append(sid)
        for sid in to_delete_studies:
            del studies[sid]

cleanup_thread = threading.Thread(target=cleanup_old_data, daemon=True)
cleanup_thread.start()

@router.get("/privacy")
def privacy_info():
    return {
        "data_retention": "All uploaded data is stored in memory only and automatically deleted after 1 hour",
        "file_storage": "Uploaded files are deleted immediately after processing",
        "persistent_storage": "No data is written to disk or permanent storage",
        "user_data": "Only email and hashed password are stored in memory for authentication",
        "version": "ResearchFlow v0.1.0"
    }

from app.services.methodology_memory import (
    save_template, get_templates, get_template,
    delete_template, get_community_templates
)

class SaveTemplateRequest(BaseModel):
    name:              str
    description:       str = ""
    study_type:        str
    outcome_column:    str
    predictor_columns: list
    research_question: str = ""
    user_email:        str
    organisation:      str = ""
    is_public:         bool = False

@router.post("/templates")
def create_template(req: SaveTemplateRequest):
    try:
        template = save_template(
            name=req.name,
            description=req.description,
            study_type=req.study_type,
            outcome_column=req.outcome_column,
            predictor_columns=req.predictor_columns,
            research_question=req.research_question,
            user_email=req.user_email,
            organisation=req.organisation,
            is_public=req.is_public
        )
        return template
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/templates")
def list_templates(user_email: str, organisation: str = ""):
    return get_templates(user_email, organisation)

@router.get("/templates/community")
def community_templates():
    return get_community_templates()

@router.get("/templates/{template_id}")
def load_template(template_id: str):
    try:
        return get_template(template_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/templates/{template_id}")
def remove_template(template_id: str, user_email: str):
    try:
        delete_template(template_id, user_email)
        return {"deleted": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

from app.services.cohort_builder import build_cohort, get_column_summary

class CohortRequest(BaseModel):
    dataset_id:          str
    inclusion_criteria:  list = []
    exclusion_criteria:  list = []

class ColumnSummaryRequest(BaseModel):
    dataset_id: str
    column:     str

@router.post("/cohort/build")
def cohort_build(req: CohortRequest):
    if req.dataset_id not in datasets:
        import os
        csv_path = f'/tmp/{req.dataset_id}.csv'
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            datasets[req.dataset_id] = {'df': df, 'created_at': datetime.utcnow().isoformat()}
        else:
            raise HTTPException(status_code=404, detail="Dataset not found")
    else:
        df = datasets[req.dataset_id]['df']
        df = get_dataset(req.dataset_id)
    result = build_cohort(df, req.inclusion_criteria, req.exclusion_criteria)
    return {
        'original_n':            result['original_n'],
        'after_inclusion_n':     result['after_inclusion_n'],
        'excluded_by_inclusion': result['excluded_by_inclusion'],
        'excluded_by_exclusion': result['excluded_by_exclusion'],
        'final_n':               result['final_n'],
        'exclusion_rate':        result['exclusion_rate'],
        'consort_flow':          result['consort_flow'],
    }

@router.post("/cohort/column-summary")
def column_summary(req: ColumnSummaryRequest):
    if req.dataset_id not in datasets:
        import os
        csv_path = f'/tmp/{req.dataset_id}.csv'
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            datasets[req.dataset_id] = {'df': df, 'created_at': datetime.utcnow().isoformat()}
        else:
            raise HTTPException(status_code=404, detail="Dataset not found")
    else:
        df = datasets[req.dataset_id]['df']
        df = get_dataset(req.dataset_id)
    return get_column_summary(df, req.column)

from app.services.survival_analysis import run_kaplan_meier

class SurvivalRequest(BaseModel):
    dataset_id:   str
    duration_col: str
    event_col:    str
    group_col:    str = None

@router.post("/survival/kaplan-meier")
def kaplan_meier(req: SurvivalRequest):
    if req.dataset_id not in datasets:
        import os
        csv_path = f'/tmp/{req.dataset_id}.csv'
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            datasets[req.dataset_id] = {'df': df, 'created_at': datetime.utcnow().isoformat()}
        else:
            raise HTTPException(status_code=404, detail="Dataset not found")
    else:
        df = datasets[req.dataset_id]['df']
        df = get_dataset(req.dataset_id)
    try:
        result = run_kaplan_meier(df, req.duration_col, req.event_col, req.group_col)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/survival/km")
def kaplan_meier_v2(req: SurvivalRequest):
    try:
        df = get_dataset(req.dataset_id)
        result = run_kaplan_meier(df, req.duration_col, req.event_col, req.group_col)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")

from app.services.audit_trail import log_event, get_audit_log, get_reproducibility_report

@router.get("/audit")
def list_audit_log():
    return get_audit_log()

@router.get("/audit/study/{study_id}")
def study_audit(study_id: str):
    return get_reproducibility_report(study_id)

from app.services.protocol_intelligence import parse_protocol_file

@router.post("/protocol/extract")
async def extract_protocol(file: UploadFile = File(...)):
    try:
        content = await file.read()
        result = parse_protocol_file(content, file.filename)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from app.services.data_cleaner import (
    detect_outliers, detect_duplicates, impute_missing,
    recode_variable, get_cleaning_summary
)

class ImputeRequest(BaseModel):
    dataset_id: str
    column:     str
    method:     str = 'mean'

class OutlierRequest(BaseModel):
    dataset_id: str
    column:     str
    method:     str = 'iqr'

class RecodeRequest(BaseModel):
    dataset_id: str
    column:     str
    mapping:    dict

@router.get("/clean/{dataset_id}/summary")
def cleaning_summary(dataset_id: str):
    df = get_dataset_df(dataset_id)
    return get_cleaning_summary(df)

@router.post("/clean/outliers")
def outlier_detection(req: OutlierRequest):
    df = get_dataset_df(req.dataset_id)
    return detect_outliers(df, req.column, req.method)

@router.post("/clean/impute")
def impute(req: ImputeRequest):
    df = get_dataset_df(req.dataset_id)
    result = impute_missing(df, req.column, req.method)
    datasets[req.dataset_id]['df'] = df.fillna(
        {req.column: result.get('fill_value')}
    ) if result.get('fill_value') is not None else df
    log_event("system", "IMPUTE", 
              {"column": req.column, "method": req.method, "imputed": result.get('imputed_count')},
              dataset_id=req.dataset_id)
    return result

@router.post("/clean/recode")
def recode(req: RecodeRequest):
    df = get_dataset_df(req.dataset_id)
    result = recode_variable(df, req.column, req.mapping)
    log_event("system", "RECODE",
              {"column": req.column, "mapping": req.mapping},
              dataset_id=req.dataset_id)
    return result

@router.delete("/clean/{dataset_id}/duplicates")
def remove_duplicates(dataset_id: str):
    df = get_dataset_df(dataset_id)
    before = len(df)
    df_clean = df.drop_duplicates()
    datasets[dataset_id]['df'] = df_clean
    df_clean.to_csv(f'/tmp/{dataset_id}.csv', index=False)
    log_event("system", "REMOVE_DUPLICATES",
              {"removed": before - len(df_clean)},
              dataset_id=dataset_id)
    return {"removed": before - len(df_clean), "rows_remaining": len(df_clean)}

from app.services.guided_analysis import recommend_tests

class GuidedAnalysisRequest(BaseModel):
    dataset_id:        str
    outcome_col:       str
    predictor_cols:    list
    study_design:      str = 'observational'
    research_question: str = ''

@router.post("/guided/recommend")
def guided_recommend(req: GuidedAnalysisRequest):
    df = get_dataset_df(req.dataset_id)
    try:
        from app.analytics.ingestion import DataIngestionEngine
        engine = DataIngestionEngine()
        column_types = {}
        numeric_summary = {}
        for col in df.columns:
            import pandas as pd
            if pd.api.types.is_numeric_dtype(df[col]):
                column_types[col] = 'clinical_continuous'
                numeric_summary[col] = {
                    'mean':   round(float(df[col].mean()), 2),
                    'std':    round(float(df[col].std()), 2),
                    'unique': int(df[col].nunique()),
                }
            else:
                column_types[col] = 'demographic_categorical'
        result = recommend_tests(
            outcome_col=req.outcome_col,
            predictor_cols=req.predictor_cols,
            study_design=req.study_design,
            column_types=column_types,
            numeric_summary=numeric_summary,
            n_participants=len(df),
            research_question=req.research_question,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
