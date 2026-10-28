import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import UPLOAD_DIR
from app.core.database import init_db
from app.api.v1.api import api_router
from app.modules.auth.router import router as auth_modular_router

def create_app() -> FastAPI:
    app = FastAPI(
        title="Bright Solutions API — OPD Management & Decision Support System",
        version="2.0.0",
        description="Modular Router-Service-Repository backend API powering Bright Solutions Outpatient Department Operations."
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

    # Run DB table creation & demo seeds on startup
    @app.on_event("startup")
    def on_startup():
        init_db()

    # Mount master API router
    app.include_router(api_router)
    # Mount Phase 2+ Modular Domain Routers
    app.include_router(auth_modular_router, prefix="/api/v1")

    return app

app = create_app()
