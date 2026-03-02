from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.analysis_recommender_service import (
    generate_fallback_recommendations,
    generate_recommendations,
)

router = APIRouter(prefix="/analysis-recommender", tags=["analysis-recommender"])


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class VariableRef(BaseModel):
    name: str
    type: str  # "categorical" | "continuous"


class DatasetSummary(BaseModel):
    n_rows: int
    n_columns: int
    has_missing_data: bool
    potential_confounders: List[str] = []


class RecommendRequest(BaseModel):
    dataset_id: str
    research_question: str
    exposure_variable: VariableRef
    outcome_variable: VariableRef
    study_design: str
    dataset_summary: DatasetSummary


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("/suggest")
def suggest_analyses(req: RecommendRequest):
    """
    Generate AI-powered analysis recommendations via the Claude API.
    Falls back to rule-based recommendations if the API is unavailable.
    """
    try:
        result = generate_recommendations(
            research_question=req.research_question,
            exposure_variable={"name": req.exposure_variable.name, "type": req.exposure_variable.type},
            outcome_variable={"name": req.outcome_variable.name, "type": req.outcome_variable.type},
            study_design=req.study_design,
            dataset_summary=req.dataset_summary.model_dump(),
        )
        return result
    except ValueError as exc:
        # API key not configured — return fallback immediately
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception:
        # Any other error (network, parse, etc.) — return rule-based fallback
        fallback = generate_fallback_recommendations(
            exposure_type=req.exposure_variable.type,
            outcome_type=req.outcome_variable.type,
            study_design=req.study_design,
        )
        # Signal to the frontend that this is a fallback
        fallback["_fallback"] = True
        return fallback
