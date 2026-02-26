
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

        # ============================================================
        # AUTH ROUTES
        # ============================================================
    column: str
    method: str = 'iqr'
        # ============================================================
        # STUDY ROUTES
        # ============================================================

class RecodeRequest(BaseModel):
        # ============================================================
        # DATA MANAGEMENT ROUTES
        # ============================================================
    dataset_id: str
    column: str
        # ============================================================
        # ANALYSIS ROUTES
        # ============================================================
    mapping: dict

        # ============================================================
        # COLLABORATION ROUTES
        # ============================================================
class GuidedAnalysisRequest(BaseModel):
    dataset_id: str
        # ============================================================
        # JOURNAL & AUDIT ROUTES
        # ============================================================
    outcome_col: str
    predictor_cols: list
        # ============================================================
        # UTILITY ROUTES
        # ============================================================
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
        log_event("UPLOAD", {"dataset_id": dataset_id, "filename": file.filename})
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
    log_event("CREATE_STUDY", {"study_id": study_id, **study})
    return study

@router.post("/study/{study_id}/analyse")
def analyse(study_id: str, payload: AnalysePayload):
    df = get_dataset_df(payload.dataset_id)
    stats = StatisticsEngine().run(df, payload.outcome_column, payload.predictor_columns, payload.duration_column)
    rigor = RigorScoreEngine().score(df, payload.outcome_column, payload.predictor_columns)
    result = {"statistics": stats, "rigor": rigor}
    studies[study_id]['analysis'] = result
    log_event("ANALYSE", {"study_id": study_id, "dataset_id": payload.dataset_id})
    return result

@router.post("/study/{study_id}/report")
def report(study_id: str):
    study = studies.get(study_id)
    if not study or 'analysis' not in study:
        raise HTTPException(status_code=404, detail="Study or analysis not found")
    pdf_bytes = ReportGenerator().generate(study)
    log_event("DOWNLOAD_REPORT", {"study_id": study_id})
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=report_{study_id}.pdf"})

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

@router.post("/journal/package")
def journal_package_ep(req: JournalRequest):
    return get_journal_package(
        req.dataset_id,
        req.outcome_col,
        req.predictor_cols,
        req.study_design,
        req.research_question,
        req.statistical_test,
        req.setting,
        req.open_access_only,
    )

from app.services.journal_assistant import get_journal_package

class JournalRequest(BaseModel):
    dataset_id:        str
    outcome_col:       str
    predictor_cols:    list
    study_design:      str = 'retrospective_cohort'
    research_question: str = ''
    statistical_test:  str = 'logistic regression'
    setting:           str = 'sub-Saharan Africa'
    open_access_only:  bool = False

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

from app.services.instrument_recognition import recognize_instrument

@router.get("/instrument/{dataset_id}")
def instrument_recognition(dataset_id: str):
    df = get_dataset_df(dataset_id)
    result = recognize_instrument(df.columns.tolist())
    return result

from app.services.propensity_matching import run_propensity_matching

class PSMRequest(BaseModel):
    dataset_id:     str
    treatment_col:  str
    covariate_cols: list
    caliper:        float = 0.2
    ratio:          int   = 1

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

from app.services.descriptive_stats import compute_descriptive

@router.get("/descriptive/{dataset_id}")
def descriptive_stats(dataset_id: str):
    df = get_dataset_df(dataset_id)
    return compute_descriptive(df)

from app.services.collaboration import (
    create_workspace, invite_member, accept_invitation,
    add_comment, get_workspace, get_user_workspaces,
    assign_study_to_workspace, update_study_status
)

class WorkspaceRequest(BaseModel):
    name:         str
    description:  str = ''
    owner_email:  str
    owner_name:   str

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

from app.services.meta_analysis import compute_meta_analysis

class MetaAnalysisRequest(BaseModel):
    studies: list
    effect_type: str = 'OR'

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
