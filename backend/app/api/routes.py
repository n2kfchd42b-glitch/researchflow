from datetime import datetime, timedelta
from fastapi import APIRouter, UploadFile, File, HTTPException, Response, Depends, Request, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd, tempfile, os, uuid, sys, io

sys.path.insert(0, '.')
from app.analytics.ingestion import DataIngestionEngine
from app.analytics.statistics import StatisticsEngine
from app.analytics.rigor import RigorScoreEngine
from app.services.report_generator import ReportGenerator
from app.services.auth import (
    register_user, login_user, decode_token,
    get_user_by_email, update_user_profile, create_token,
)
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.services.methodology_memory import save_template, get_templates, get_template, delete_template, get_community_templates
from app.services.cohort_builder import build_cohort, get_column_summary
from app.services.survival_analysis import run_kaplan_meier
from app.services.audit_trail import log_event, get_audit_log, get_reproducibility_report
from app.services.protocol_intelligence import parse_protocol_file
from app.services.data_cleaner import get_cleaning_summary, detect_outliers, impute_missing, recode_variable, detect_duplicates
from app.services.guided_analysis import recommend_tests
from app.services.journal_assistant import get_journal_package
from app.services.instrument_recognition import recognize_instrument
from app.services.propensity_matching import run_propensity_matching
from app.services.descriptive_stats import compute_descriptive
from app.services.collaboration import (
    create_workspace, invite_member, accept_invitation,
    add_comment, get_workspace, get_user_workspaces,
    assign_study_to_workspace, update_study_status
)
from app.services.meta_analysis import compute_meta_analysis
from fastapi.responses import StreamingResponse

router = APIRouter()

# In-memory store for prototype
studies = {}
datasets = {}


# ============================================================
# HELPER FUNCTIONS
# ============================================================

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


# ============================================================
# MODELS
# ============================================================

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
    name:        str
    email:       str
    password:    str
    role:        str = "student"
    institution: str = ""
    country:     str = ""

class LoginRequest(BaseModel):
    email:    str
    password: str

class ProfileUpdateRequest(BaseModel):
    name:        Optional[str] = None
    institution: Optional[str] = None
    country:     Optional[str] = None

_COOKIE     = "rf_access_token"
_COOKIE_AGE = 60 * 60 * 24  # 24 h

def _get_token_payload(request_cookies: dict) -> dict:
    token = request_cookies.get(_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return payload

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
    group_col:    Optional[str] = None

class OutlierRequest(BaseModel):
    dataset_id: str
    column:     str
    method:     str = 'iqr'

class ImputeRequest(BaseModel):
    dataset_id: str
    column:     str
    method:     str = 'mean'

class RecodeRequest(BaseModel):
    dataset_id: str
    column:     str
    mapping:    dict

class GuidedAnalysisRequest(BaseModel):
    dataset_id:        str
    outcome_col:       str
    predictor_cols:    list
    study_design:      str = 'observational'
    research_question: str = ''

class JournalRequest(BaseModel):
    dataset_id:        str
    outcome_col:       str
    predictor_cols:    list
    study_design:      str = 'retrospective_cohort'
    research_question: str = ''
    statistical_test:  str = 'logistic regression'
    setting:           str = 'sub-Saharan Africa'
    open_access_only:  bool = False

class PSMRequest(BaseModel):
    dataset_id:     str
    treatment_col:  str
    covariate_cols: List[str]
    caliper:        float = 0.2
    ratio:          int   = 1

class MetaAnalysisRequest(BaseModel):
    studies: List[dict]

class WorkspaceRequest(BaseModel):
    name:        str
    description: str = ""
    owner_email: str
    owner_name:  str

from fastapi import Request as _FRequest

@router.post("/auth/register")
def register(req: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    try:
        user  = register_user(db, req.name, req.email, req.password, req.role,
                               institution=req.institution, country=req.country)
        token = create_token({"sub": user["email"], "role": user["role"]})
        response.set_cookie(key=_COOKIE, value=token,
                            httponly=True, max_age=_COOKIE_AGE, samesite="lax")
        return {"user": user}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/auth/login")
def login(req: LoginRequest, response: Response, db: Session = Depends(get_db)):
    try:
        result = login_user(db, req.email, req.password)
        response.set_cookie(key=_COOKIE, value=result["token"],
                            httponly=True, max_age=_COOKIE_AGE, samesite="lax")
        return {"user": result["user"]}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.get("/auth/me")
def get_me(request: _FRequest, db: Session = Depends(get_db)):
    payload = _get_token_payload(dict(request.cookies))
    user    = get_user_by_email(db, payload["sub"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie(key=_COOKIE)
    return {"ok": True}

@router.put("/auth/profile")
def update_profile(req: ProfileUpdateRequest, request: _FRequest,
                   db: Session = Depends(get_db)):
    payload = _get_token_payload(dict(request.cookies))
    try:
        updated = update_user_profile(
            db, payload["sub"],
            {k: v for k, v in req.dict().items() if v is not None},
        )
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

class InviteRequest(BaseModel):
    workspace_id:   str
    invitee_email:  str
    invitee_name:   str
    role:           str = 'analyst'
    inviter_email:  str

class CommentRequest(BaseModel):
    workspace_id:  str
    study_id:      str
    user_email:    str
    user_name:     str
    comment:       str

class StudyStatusRequest(BaseModel):
    status:      str
    user_email:  str


# ============================================================
# UTILITY ROUTES
# ============================================================

@router.get("/health")
def health():
    return {
        "status": "healthy",
        "version": "2.0.0",
        "products": ["student", "ngo", "journal"],
        "api_prefix": "/api/v1",
        "legacy_support": True
    }

@router.get("/privacy")
def privacy():
    return {"privacy": "Your data is processed securely and not shared with third parties."}


# ============================================================
# AUTH ROUTES
# ============================================================

@router.post("/auth/register")
def register(req: RegisterRequest):
    return register_user(req.name, req.email, req.password, req.role)

@router.post("/auth/login")
def login(req: LoginRequest):
    return login_user(req.email, req.password)

@router.get("/auth/me")
def me(request: Request, authorization: Optional[str] = Header(None)):
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    return decode_token(token)


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


# ------------------- PYDANTIC MODELS -------------------
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
    name: str
    email: str
    password: str
    role: Optional[str] = "student"

class LoginRequest(BaseModel):
    email: str
    password: str

class SaveTemplateRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    study_type: str
    outcome_column: str
    predictor_columns: list
    research_question: Optional[str] = ""
    user_email: str
    organisation: Optional[str] = ""
    is_public: Optional[bool] = False

class CohortRequest(BaseModel):
    dataset_id: str
    inclusion_criteria: list = []
    exclusion_criteria: list = []

class ColumnSummaryRequest(BaseModel):
    dataset_id: str
    column: str

class SurvivalRequest(BaseModel):
    dataset_id: str
    duration_col: str
    event_col: str
    group_col: Optional[str] = None

class ImputeRequest(BaseModel):
    dataset_id: str
    column: str
    method: str = 'mean'

class OutlierRequest(BaseModel):
    dataset_id: str
    column: str
    method: str = 'iqr'

class RecodeRequest(BaseModel):
    dataset_id: str
    column: str
    mapping: dict

class GuidedAnalysisRequest(BaseModel):
    dataset_id: str
    outcome_col: str
    predictor_cols: list
    study_design: str = 'observational'
    research_question: str = ''

class JournalRequest(BaseModel):
    dataset_id: str
    outcome_col: str
    predictor_cols: list
    study_design: str = 'retrospective_cohort'
    research_question: str = ''
    statistical_test: str = 'logistic regression'
    setting: str = 'sub-Saharan Africa'
    open_access_only: bool = False

# ------------------- ENDPOINTS -------------------
@router.get("/health")
def health():
    return {"status": "healthy"}

@router.get("/")
def root():
    return {"message": "ResearchFlow API"}

@router.get("/privacy")
def privacy():
    return {"privacy": "Your data is processed securely and not shared with third parties."}

@router.post("/upload")
async def upload(file: UploadFile = File(...)):
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
            "filename": file.filename,
            "created_at": datetime.utcnow().isoformat()
        }
        df.to_csv(f'/tmp/{dataset_id}.csv', index=False)
        log_event(
            "system",
            "UPLOAD",
            {"dataset_id": dataset_id, "filename": file.filename},
            dataset_id=dataset_id,
        )
        return {
            "dataset_id": dataset_id,
            "filename": file.filename,
            "rows": report["row_count"],
            "columns": report["column_count"],
            "column_types": report["column_types"],
            "missing_percentage": report["missing_percentage"],
            "numeric_summary": report["numeric_summary"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/study")
def create_study(payload: StudyPayload):
    study_id = str(uuid.uuid4())
    study = payload.dict()
    study['id'] = study_id
    study['created_at'] = datetime.utcnow().isoformat()
    studies[study_id] = study
    log_event("system", "CREATE_STUDY", {"study_id": study_id, **study}, study_id=study_id)
    return study

@router.post("/study/{study_id}/analyse")
def analyse(study_id: str, payload: AnalysePayload):
    df = get_dataset_df(payload.dataset_id)
    stats = StatisticsEngine().run(df, payload.outcome_column, payload.predictor_columns, payload.duration_column)
    rigor = RigorScoreEngine().score(df, payload.outcome_column, payload.predictor_columns)
    result = {"statistics": stats, "rigor": rigor}
    studies[study_id]['analysis'] = result
    log_event(
        "system",
        "ANALYSE",
        {"study_id": study_id, "dataset_id": payload.dataset_id},
        study_id=study_id,
        dataset_id=payload.dataset_id,
    )
    return result

@router.post("/study/{study_id}/report")
def report(study_id: str):
    study = studies.get(study_id)
    if not study or 'analysis' not in study:
        raise HTTPException(status_code=404, detail="Study or analysis not found")
    pdf_bytes = ReportGenerator().generate(study)
    log_event("system", "DOWNLOAD_REPORT", {"study_id": study_id}, study_id=study_id)
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=report_{study_id}.pdf"})

@router.post("/templates")
def save_template_ep(req: SaveTemplateRequest):
    return save_template(**req.dict())

@router.get("/templates")
def get_templates_ep(user_email: str):
    return get_templates(user_email)

@router.get("/templates/community")
def get_community_templates_ep():
    return get_community_templates()

@router.get("/templates/{template_id}")
def get_template_ep(template_id: str):
    return get_template(template_id)

@router.delete("/templates/{template_id}")
def delete_template_ep(template_id: str):
    return delete_template(template_id)

@router.post("/cohort/build")
def build_cohort_ep(req: CohortRequest):
    result = build_cohort(req.dataset_id, req.inclusion_criteria, req.exclusion_criteria)
    return {"stats": result.get("stats", {})}

@router.post("/cohort/column-summary")
def column_summary_ep(req: ColumnSummaryRequest):
    return get_column_summary(req.dataset_id, req.column)

@router.post("/survival/kaplan-meier")
def kaplan_meier_ep(req: SurvivalRequest):
    return run_kaplan_meier(req.dataset_id, req.duration_col, req.event_col, req.group_col)

@router.get("/audit")
def audit_log_ep():
    return get_audit_log()

@router.get("/audit/study/{study_id}")
def reproducibility_report_ep(study_id: str):
    return get_reproducibility_report(study_id)

@router.post("/protocol/extract")
async def protocol_extract_ep(file: UploadFile = File(...)):
    content = await file.read()
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name
    try:
        result = parse_protocol_file(tmp_path)
    finally:
        os.remove(tmp_path)
    return result

@router.get("/clean/{dataset_id}/summary")
def cleaning_summary_ep(dataset_id: str):
    return get_cleaning_summary(dataset_id)

@router.post("/clean/outliers")
def outliers_ep(req: OutlierRequest):
    return detect_outliers(req.dataset_id, req.column, req.method)

@router.post("/clean/impute")
def impute_ep(req: ImputeRequest):
    df = get_dataset_df(req.dataset_id)
    df = impute_missing(df, req.column, req.method)
    datasets[req.dataset_id]['df'] = df
    df.to_csv(f"/tmp/{req.dataset_id}.csv", index=False)
    return {"status": "imputed", "column": req.column, "method": req.method}

@router.post("/clean/recode")
def recode_ep(req: RecodeRequest):
    df = get_dataset_df(req.dataset_id)
    df = recode_variable(df, req.column, req.mapping)
    datasets[req.dataset_id]['df'] = df
    df.to_csv(f"/tmp/{req.dataset_id}.csv", index=False)
    return {"status": "recoded", "column": req.column}

@router.delete("/clean/{dataset_id}/duplicates")
def remove_duplicates_ep(dataset_id: str):
    df = get_dataset_df(dataset_id)
    df = detect_duplicates(df, drop=True)
    datasets[dataset_id]['df'] = df
    df.to_csv(f"/tmp/{dataset_id}.csv", index=False)
    return {"status": "duplicates_removed"}

@router.get("/instrument/{dataset_id}")
def instrument_recognition(dataset_id: str):
    df = get_dataset_df(dataset_id)
    result = recognize_instrument(df.columns.tolist())
    return result

@router.get("/descriptive/{dataset_id}")
def descriptive_stats(dataset_id: str):
    df = get_dataset_df(dataset_id)
    return compute_descriptive(df)


# ============================================================
# STUDY ROUTES
# ============================================================

@router.post("/study")
def create_study(payload: StudyPayload):
    study_id = str(uuid.uuid4())
    study = payload.dict()
    study['id'] = study_id
    study['created_at'] = datetime.utcnow().isoformat()
    studies[study_id] = study
    log_event("system", "CREATE_STUDY", {"study_id": study_id, **study}, study_id=study_id)
    return study

@router.post("/study/{study_id}/analyse")
def analyse(study_id: str, payload: AnalysePayload):
    df = get_dataset_df(payload.dataset_id)
    stats = StatisticsEngine().run(df, payload.outcome_column, payload.predictor_columns, payload.duration_column)
    rigor = RigorScoreEngine().score(df, payload.outcome_column, payload.predictor_columns)
    result = {"statistics": stats, "rigor": rigor}
    studies[study_id]['analysis'] = result
    log_event(
        "system",
        "ANALYSE",
        {"study_id": study_id, "dataset_id": payload.dataset_id},
        study_id=study_id,
        dataset_id=payload.dataset_id,
    )
    return result

@router.post("/study/{study_id}/report")
def report(study_id: str):
    study = studies.get(study_id)
    if not study or 'analysis' not in study:
        raise HTTPException(status_code=404, detail="Study or analysis not found")
    pdf_bytes = ReportGenerator().generate(study)
    log_event("system", "DOWNLOAD_REPORT", {"study_id": study_id}, study_id=study_id)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=report_{study_id}.pdf"}
    )


# ============================================================
# ANALYSIS ROUTES
# ============================================================

@router.post("/guided/recommend")
def guided_recommend_ep(req: GuidedAnalysisRequest):
    df = get_dataset_df(req.dataset_id)
    column_types = {}
    numeric_summary = {}
    for col in df.columns:
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

@router.post("/survival/kaplan-meier")
def kaplan_meier_ep(req: SurvivalRequest):
    return run_kaplan_meier(req.dataset_id, req.duration_col, req.event_col, req.group_col)

@router.post("/psm/match")
def psm_match(req: PSMRequest):
    df = get_dataset_df(req.dataset_id)
    result = run_propensity_matching(
        df=df,
        treatment_col=req.treatment_col,
        covariate_cols=req.covariate_cols,
        caliper=req.caliper,
        ratio=req.ratio,
    )
    if 'error' in result:
        raise HTTPException(status_code=500, detail=result['error'])
    log_event("system", "PSM",
              {"treatment": req.treatment_col, "covariates": req.covariate_cols,
               "matched": result.get('n_treated_matched')},
              dataset_id=req.dataset_id)
    return result

@router.post("/meta/analyse")
def meta_analyse(req: MetaAnalysisRequest):
    try:
        result = compute_meta_analysis(req.studies)
        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])
        log_event("system", "META_ANALYSIS",
                  {"n_studies": result['n_studies'], "I2": result['heterogeneity']['I2']})
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cohort/build")
def build_cohort_ep(req: CohortRequest):
    result = build_cohort(req.dataset_id, req.inclusion_criteria, req.exclusion_criteria)
    return {"stats": result.get("stats", {})}

@router.post("/cohort/column-summary")
def column_summary_ep(req: ColumnSummaryRequest):
    return get_column_summary(req.dataset_id, req.column)


# ============================================================
# COLLABORATION ROUTES
# ============================================================

@router.post("/workspace")
def create_ws(req: WorkspaceRequest):
    try:
        result = create_workspace(req.name, req.description, req.owner_email, req.owner_name)
        log_event(req.owner_email, "CREATE_WORKSPACE", {"name": req.name})
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/workspace/{workspace_id}")
def get_ws(workspace_id: str):
    try:
        return get_workspace(workspace_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/workspace/user/{user_email}")
def get_user_ws(user_email: str):
    return get_user_workspaces(user_email)

@router.post("/workspace/invite")
def invite(req: InviteRequest):
    try:
        result = invite_member(
            req.workspace_id, req.invitee_email,
            req.invitee_name, req.role, req.inviter_email
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/workspace/invite/{invite_id}/accept")
def accept_invite(invite_id: str):
    try:
        return accept_invitation(invite_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/workspace/comment")
def comment(req: CommentRequest):
    try:
        return add_comment(
            req.workspace_id, req.study_id,
            req.user_email, req.user_name, req.comment
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/workspace/{workspace_id}/study/{study_id}/status")
def study_status(workspace_id: str, study_id: str, req: StudyStatusRequest):
    try:
        update_study_status(workspace_id, study_id, req.status, req.user_email)
        return {"success": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================
# JOURNAL & AUDIT ROUTES
# ============================================================

@router.post("/journal/package")
def journal_package(req: JournalRequest):
    df = get_dataset_df(req.dataset_id)
    try:
        result = get_journal_package(
            study_design=req.study_design,
            outcome_col=req.outcome_col,
            predictor_cols=req.predictor_cols,
            n_participants=len(df),
            research_question=req.research_question,
            statistical_test=req.statistical_test,
            setting=req.setting,
            open_access_only=req.open_access_only,
        )
        log_event("system", "JOURNAL_PACKAGE",
                  {"study_design": req.study_design, "journals": len(result['journals'])},
                  dataset_id=req.dataset_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/audit")
def audit_log_ep():
    return get_audit_log()

@router.get("/audit/study/{study_id}")
def reproducibility_report_ep(study_id: str):
    return get_reproducibility_report(study_id)


# ============================================================
# METHODOLOGY ROUTES
# ============================================================

@router.post("/templates")
def save_template_ep(req: SaveTemplateRequest):
    return save_template(**req.dict())

@router.get("/templates")
def get_templates_ep(user_email: str):
    return get_templates(user_email)

@router.get("/templates/community")
def get_community_templates_ep():
    return get_community_templates()

@router.get("/templates/{template_id}")
def get_template_ep(template_id: str):
    return get_template(template_id)

@router.delete("/templates/{template_id}")
def delete_template_ep(template_id: str):
    return delete_template(template_id)

@router.post("/protocol/extract")
async def protocol_extract_ep(file: UploadFile = File(...)):
    content = await file.read()
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name
    try:
        result = parse_protocol_file(tmp_path)
    finally:
        os.remove(tmp_path)
    return result
