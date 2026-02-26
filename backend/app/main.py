import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.core.database import create_tables, run_migrations

app = FastAPI(
    title="ResearchFlow API",
    description="Automated research analytics platform",
    version="0.1.0"
)

# Credentials-safe CORS — must list explicit origins (not "*") when
# allow_credentials=True so browsers send cookies cross-origin.
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000"
)
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,     # required for httpOnly cookie to be sent
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.on_event("startup")
def on_startup():
    create_tables()   # CREATE TABLE IF NOT EXISTS — safe to re-run
    run_migrations()  # ALTER TABLE ADD COLUMN — safe to re-run


@app.get("/")
def root():
    return {
        "platform": "ResearchFlow",
        "version": "0.1.0",
        "status": "running",
        "modules": ["ingestion", "analytics", "reporting", "verification"],
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
