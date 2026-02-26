from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.api.projects import router as projects_router
from app.api.references import router as references_router
from app.api.studies import router as studies_router
from app.api.assessments import router as assessments_router
from app.routers.analysis_router import router as analysis_router

app = FastAPI(
    title="ResearchFlow API",
    description="Automated research analytics platform",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(projects_router)
app.include_router(references_router)
app.include_router(studies_router)
app.include_router(assessments_router)
app.include_router(analysis_router)

@app.get("/")
def root():
    return {
        "platform": "ResearchFlow",
        "version": "0.1.0",
        "status": "running",
        "modules": [
            "ingestion", 
            "analytics", 
            "reporting", 
            "verification"
        ]
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
