import time
import logging
import os
import json

from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("researchflow")

from fastapi import FastAPI, APIRouter, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import create_tables, run_migrations
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

# Credentials-safe CORS — must list explicit origins (not "*") when
# allow_credentials=True so browsers send cookies cross-origin.
def _parse_allowed_origins(raw: str) -> list[str]:
    if not raw:
        return []

    value = raw.strip()

    # Support JSON array format, e.g. ["https://app.onrender.com", "http://localhost:3000"]
    if value.startswith("["):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return [str(origin).strip().rstrip("/") for origin in parsed if str(origin).strip()]
        except Exception:
            pass

    # Support comma-separated format, with optional quotes around each origin.
    origins = []
    for item in value.split(","):
        cleaned = item.strip().strip('"').strip("'").rstrip("/")
        if cleaned:
            origins.append(cleaned)
    return origins


_raw_origins = os.getenv("CORS_ORIGINS") or os.getenv(
    "ALLOWED_ORIGINS",
    "https://researchflow-frontend-ttdz.onrender.com,http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000"
)
ALLOWED_ORIGINS = _parse_allowed_origins(_raw_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"^https://.*-3000\.app\.github\.dev$|^https://researchflow-frontend(-[a-z0-9]+)?\.onrender\.com$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    run_migrations()
    create_tables()

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
app.include_router(analysis_router)
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
        "endpoints_count": len(app.routes),
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
