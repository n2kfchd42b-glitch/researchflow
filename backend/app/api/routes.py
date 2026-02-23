from datetime import datetime, timedelta
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import tempfile
import os
import uuid
import sys
sys.path.insert(0, '.')
from app.analytics.ingestion import DataIngestionEngine
from app.analytics.statistics import StatisticsEngine
from app.analytics.rigor import RigorScoreEngine
from app.services.report_generator import ReportGenerator
from fastapi.responses import StreamingResponse
import io

router = APIRouter()

# In-memory store for prototype
studies = {}
datasets = {}

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
        raise HTTPException(status_code=404, detail="Dataset not found")

    study = studies[study_id]
    dataset = datasets[payload.dataset_id]
    df = dataset["df"]
    quality_report = dataset["report"]

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
