from datetime import datetime
from fastapi import APIRouter
from app.core.database import get_connection

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT 1 AS ok;")
            db_res = cur.fetchone()
        conn.close()
        db_status = "connected" if db_res and db_res.get("ok") == 1 else "unresponsive"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "service": "Bright Solutions Backend API",
        "feature": "FEAT-01 Patient Registration & Triage Vitals",
        "database": db_status,
        "timestamp": datetime.now().isoformat()
    }
