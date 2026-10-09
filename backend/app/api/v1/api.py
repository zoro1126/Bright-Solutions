from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.patients import router as patients_router
from app.api.v1.visits import router as visits_router
from app.api.v1.doctor import router as doctor_router
from app.api.v1.drugs import router as drugs_router
from app.api.v1.cashier import router as cashier_router
from app.api.v1.admin import router as admin_router

api_router = APIRouter(prefix="/api")

api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(dashboard_router)
api_router.include_router(patients_router)
api_router.include_router(visits_router)
api_router.include_router(doctor_router)
api_router.include_router(drugs_router)
api_router.include_router(cashier_router)
api_router.include_router(admin_router)
