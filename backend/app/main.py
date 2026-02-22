from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

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
