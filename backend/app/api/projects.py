from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.models.database import Project, User
from app.core.database import get_db
from pydantic import BaseModel

router = APIRouter()

class ProjectSchema(BaseModel):
    id: str
    name: str
    description: str = ""
    owner_id: str
    class Config:
        orm_mode = True

class ProjectCreateSchema(BaseModel):
    name: str
    description: str = ""
    owner_id: str

@router.get("/projects", response_model=List[ProjectSchema])
def get_projects(db: Session = Depends(get_db)):
    return db.query(Project).all()

@router.post("/projects", response_model=ProjectSchema)
def create_project(project: ProjectCreateSchema, db: Session = Depends(get_db)):
    db_project = Project(
        name=project.name,
        description=project.description,
        owner_id=project.owner_id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/projects/{project_id}", response_model=ProjectSchema)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project
