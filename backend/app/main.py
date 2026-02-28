import time
import logging
import os

from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("researchflow")

from fastapi import FastAPI, APIRouter, Request
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
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = round(time.time() - start, 3)
    logger.info(f"{request.method} {request.url.path} → {response.status_code} ({duration}s)")
    return response


# Legacy routes (no prefix) — backward compatibility
app.include_router(router)
app.include_router(projects_router)
app.include_router(references_router)
app.include_router(assessments_router)
app.include_router(studies_router)
app.include_router(analysis_router)

# Versioned routes
api_v1 = APIRouter(prefix="/api/v1")
api_v1.include_router(router, tags=["Core"])
api_v1.include_router(projects_router, tags=["Projects"])
api_v1.include_router(references_router, tags=["References"])
api_v1.include_router(assessments_router, tags=["Assessments"])
api_v1.include_router(studies_router, tags=["Studies"])
api_v1.include_router(analysis_router, tags=["Advanced Analytics"])
app.include_router(api_v1)


@app.get("/")
def root():
    return {
        "platform": "ResearchFlow",
        "version": "2.0.0",
        "status": "running",
        "products": ["student", "ngo", "journal"],
        "modules": ["ingestion", "analytics", "reporting", "verification"]
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "version": "2.0.0",
        "products": ["student", "ngo", "journal"],
        "api_prefix": "/api/v1",
        "legacy_support": True,
        "endpoints_count": len(app.routes)
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
