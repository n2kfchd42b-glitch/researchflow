from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.models.database import Assessment
from app.core.database import get_db
from pydantic import BaseModel

router = APIRouter()

class AssessmentSchema(BaseModel):
    id: str
    type: str
    rating: str
    study_id: str
    project_id: str
    class Config:
        orm_mode = True

class AssessmentCreateSchema(BaseModel):
    type: str
    rating: str
    study_id: str
    project_id: str

@router.get("/assessments", response_model=List[AssessmentSchema])
def get_assessments(project_id: str, db: Session = Depends(get_db)):
    return db.query(Assessment).filter(Assessment.project_id == project_id).all()

@router.post("/assessments", response_model=AssessmentSchema)
def create_assessment(assessment: AssessmentCreateSchema, db: Session = Depends(get_db)):
    db_assessment = Assessment(**assessment.dict())
    db.add(db_assessment)
    db.commit()
    db.refresh(db_assessment)
    return db_assessment
