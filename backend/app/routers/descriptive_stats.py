import io
import os
from typing import List

import pandas as pd
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.services.descriptive_stats_service import (
    build_table1,
    compute_variable_stats_categorical,
    compute_variable_stats_continuous,
    detect_column_types,
    generate_table1_docx,
)

router = APIRouter(prefix="/descriptive-stats", tags=["descriptive-stats"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _load_df(dataset_id: str) -> pd.DataFrame:
    csv_path = f"/tmp/{dataset_id}.csv"
    if os.path.exists(csv_path):
        return pd.read_csv(csv_path)
    raise HTTPException(status_code=404, detail="Dataset not found")


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class VariableStatsRequest(BaseModel):
    dataset_id: str
    variable_name: str
    variable_type: str  # "categorical" | "continuous"


class Table1Variable(BaseModel):
    name: str
    type: str  # "categorical" | "continuous"


class Table1Request(BaseModel):
    dataset_id: str
    variables: List[Table1Variable]
    summary_type: str = "auto"  # "mean_sd" | "median_iqr" | "auto"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/columns/{dataset_id}")
def get_column_types(dataset_id: str):
    """Return all column names with detected types and missing-value counts."""
    df = _load_df(dataset_id)
    columns = detect_column_types(df)
    return {"dataset_id": dataset_id, "columns": columns}


@router.post("/variable")
def variable_stats(req: VariableStatsRequest):
    """Compute detailed statistics for a single variable."""
    df = _load_df(req.dataset_id)
    try:
        if req.variable_type == "categorical":
            return compute_variable_stats_categorical(df, req.variable_name)
        elif req.variable_type == "continuous":
            return compute_variable_stats_continuous(df, req.variable_name)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown variable_type '{req.variable_type}'. Use 'categorical' or 'continuous'.",
            )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/table1")
def generate_table1(req: Table1Request):
    """Generate a Table 1 for the selected variables."""
    df = _load_df(req.dataset_id)
    variables = [{"name": v.name, "type": v.type} for v in req.variables]
    try:
        return build_table1(df, variables, req.summary_type)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/table1/export")
def export_table1_docx(req: Table1Request):
    """Generate and download a DOCX-formatted Table 1."""
    df = _load_df(req.dataset_id)
    variables = [{"name": v.name, "type": v.type} for v in req.variables]
    try:
        result = build_table1(df, variables, req.summary_type)
        docx_bytes = generate_table1_docx(result["n_total"], result["table"])
        return StreamingResponse(
            io.BytesIO(docx_bytes),
            media_type=(
                "application/vnd.openxmlformats-officedocument"
                ".wordprocessingml.document"
            ),
            headers={"Content-Disposition": "attachment; filename=table1.docx"},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
