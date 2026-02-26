from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.models.database import Study
from app.core.database import get_db
from pydantic import BaseModel

router = APIRouter()

class StudySchema(BaseModel):
    id: str
    title: str
    description: str = ""
    study_type: str = ""
    owner_id: str
    project_id: str
    class Config:
        orm_mode = True

class StudyCreateSchema(BaseModel):
    title: str
    description: str = ""
    study_type: str = ""
    owner_id: str
    project_id: str

@router.get("/studies", response_model=List[StudySchema])
def get_studies(project_id: str, db: Session = Depends(get_db)):
    return db.query(Study).filter(Study.project_id == project_id).all()

@router.post("/studies", response_model=StudySchema)
def create_study(study: StudyCreateSchema, db: Session = Depends(get_db)):
    db_study = Study(**study.dict())
    db.add(db_study)
    db.commit()
    db.refresh(db_study)
    return db_study
