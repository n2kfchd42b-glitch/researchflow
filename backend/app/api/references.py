from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.models.database import Reference
from app.core.database import get_db
from pydantic import BaseModel

router = APIRouter()

class ReferenceSchema(BaseModel):
    id: str
    title: str
    authors: str = ""
    journal: str = ""
    year: int = 0
    doi: str = ""
    project_id: str
    class Config:
        orm_mode = True

class ReferenceCreateSchema(BaseModel):
    title: str
    authors: str = ""
    journal: str = ""
    year: int = 0
    doi: str = ""
    project_id: str

@router.get("/references", response_model=List[ReferenceSchema])
def get_references(project_id: str, db: Session = Depends(get_db)):
    return db.query(Reference).filter(Reference.project_id == project_id).all()

@router.post("/references", response_model=ReferenceSchema)
def create_reference(reference: ReferenceCreateSchema, db: Session = Depends(get_db)):
    db_reference = Reference(**reference.dict())
    db.add(db_reference)
    db.commit()
    db.refresh(db_reference)
    return db_reference

@router.delete("/references/{reference_id}")
def delete_reference(reference_id: str, db: Session = Depends(get_db)):
    ref = db.query(Reference).filter(Reference.id == reference_id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Reference not found")
    db.delete(ref)
    db.commit()
    return {"ok": True}
