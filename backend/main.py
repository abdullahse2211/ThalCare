"""
ThalCare FastAPI Backend - Phase 7
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
import os

# ── Point to Model-2 directory ────────────────────────────────────────────────
if not os.environ.get("MODEL2_DIR"):
    candidate = os.path.join(os.path.dirname(__file__), "..", "Model-2")
    if os.path.isdir(candidate):
        os.environ["MODEL2_DIR"] = os.path.abspath(candidate)
    else:
        os.environ["MODEL2_DIR"] = r"E:\FYP MOHID\Model-2"

from routers import auth, patients, tests, predictions, admin, analytics

# Create / migrate database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ThalCare API",
    description="Backend API for ThalCare Alpha Thalassemia Detection System — Phase 7",
    version="2.0.0"
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "ThalCare API v2.0 — Phase 7 Active", "ml_engine": "5-Model Ensemble"}

@app.get("/api/v1/health")
def health_check():
    from routers.predictions import _get_ml_engine
    engine_obj = _get_ml_engine()
    engine_status = "loaded" if engine_obj is not None else "unavailable (fallback mode)"
    model2_dir = os.environ.get("MODEL2_DIR", "not set")
    return {
        "status": "ok",
        "ml_engine": engine_status,
        "model2_dir": model2_dir,
    }

# ── Register ALL routers ──────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(tests.router)
app.include_router(predictions.router)
app.include_router(admin.router)
app.include_router(analytics.router)   # ← was missing, analytics page was 404ing
