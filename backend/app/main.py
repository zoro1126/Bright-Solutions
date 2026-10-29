import os
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import UPLOAD_DIR
from app.modules.auth.router import router as auth_modular_router
from app.core.licensing import router as licensing_router
from app.modules.patient.router import router as patient_router
from app.modules.opd.router import router as opd_router
from app.modules.triage.router import router as triage_router

health_router = APIRouter(tags=["Health"])

@health_router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Bright Solutions API",
        "version": "2.0.0"
    }

def create_app() -> FastAPI:
    app = FastAPI(
        title="Bright Solutions API — Modular Hospital Operating System (COS)",
        version="2.0.0",
        description="FastAPI Modular Monolith backend powering Bright Solutions Clinical Hospital Operating System."
    )

    # Enable CORS for frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount static uploads directory for external diagnostic media
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

    # Mount Core Health router
    app.include_router(health_router, prefix="/api/v1")
    app.include_router(health_router)

    # Mount Phase 2+ Modular Domain Routers under /api/v1
    app.include_router(auth_modular_router, prefix="/api/v1")
    app.include_router(licensing_router, prefix="/api/v1")
    app.include_router(patient_router, prefix="/api/v1")
    app.include_router(opd_router, prefix="/api/v1")
    app.include_router(triage_router, prefix="/api/v1")

    return app

app = create_app()
