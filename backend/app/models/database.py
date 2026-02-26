from sqlalchemy import Column, String, Float, Integer, DateTime, JSON, Text, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(String, nullable=False)
    institution = Column(String)
    country = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    projects = relationship("Project", back_populates="owner")
    studies = relationship("Study", back_populates="owner")

class Project(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(Text)
    owner_id = Column(String, ForeignKey("users.id"))
    owner = relationship("User", back_populates="projects")
    created_at = Column(DateTime, default=datetime.utcnow)
    studies = relationship("Study", back_populates="project")
    references = relationship("Reference", back_populates="project")
    assessments = relationship("Assessment", back_populates="project")
    dataset_versions = relationship("DatasetVersion", back_populates="project")

class Study(Base):
    __tablename__ = "studies"
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    description = Column(Text)
    study_type = Column(String)
    owner_id = Column(String, ForeignKey("users.id"))
    owner = relationship("User", back_populates="studies")
    project_id = Column(String, ForeignKey("projects.id"))
    project = relationship("Project", back_populates="studies")
    status = Column(String, default="draft")
    config = Column(JSON)
    rigor_score = Column(Float)
    audit_trail = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    datasets = relationship("Dataset", back_populates="study")
    results = relationship("AnalysisResult", back_populates="study")
    assessments = relationship("Assessment", back_populates="study")
# New Reference model
class Reference(Base):
    __tablename__ = "references"
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    authors = Column(String)
    journal = Column(String)
    year = Column(Integer)
    doi = Column(String)
    project_id = Column(String, ForeignKey("projects.id"))
    project = relationship("Project", back_populates="references")
    created_at = Column(DateTime, default=datetime.utcnow)

# New Assessment model
class Assessment(Base):
    __tablename__ = "assessments"
    id = Column(String, primary_key=True, default=generate_uuid)
    type = Column(String)  # RoB2, ROBINS-I, Newcastle-Ottawa
    rating = Column(String)
    study_id = Column(String, ForeignKey("studies.id"))
    study = relationship("Study", back_populates="assessments")
    project_id = Column(String, ForeignKey("projects.id"))
    project = relationship("Project", back_populates="assessments")
    created_at = Column(DateTime, default=datetime.utcnow)

# New DatasetVersion model
class DatasetVersion(Base):
    __tablename__ = "dataset_versions"
    id = Column(String, primary_key=True, default=generate_uuid)
    dataset_name = Column(String, nullable=False)
    version_label = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    project_id = Column(String, ForeignKey("projects.id"))
    project = relationship("Project", back_populates="dataset_versions")

class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(String, primary_key=True, default=generate_uuid)
    study_id = Column(String, ForeignKey("studies.id"))
    study = relationship("Study", back_populates="datasets")
    filename = Column(String)
    file_format = Column(String)
    row_count = Column(Integer)
    column_count = Column(Integer)
    columns = Column(JSON)
    quality_report = Column(JSON)
    cleaned = Column(Boolean, default=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    id = Column(String, primary_key=True, default=generate_uuid)
    study_id = Column(String, ForeignKey("studies.id"))
    study = relationship("Study", back_populates="results")
    analysis_type = Column(String)
    model_used = Column(String)
    parameters = Column(JSON)
    results = Column(JSON)
    assumptions_checked = Column(JSON)
    assumptions_passed = Column(Boolean)
    interpretation = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class RigorReport(Base):
    __tablename__ = "rigor_reports"
    id = Column(String, primary_key=True, default=generate_uuid)
    study_id = Column(String, ForeignKey("studies.id"))
    overall_score = Column(Float)
    data_quality_score = Column(Float)
    methodology_score = Column(Float)
    reporting_score = Column(Float)
    assumptions_score = Column(Float)
    findings = Column(JSON)
    recommendations = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
