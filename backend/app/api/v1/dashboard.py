from fastapi import APIRouter
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats():
    """Returns real-time OPD KPI metrics, BP stage distribution, BMI breakdown, and recent triage feed."""
    return AnalyticsService.get_dashboard_stats()
