"""
Bright Solutions EMR & Clinical Decision Support System.
FastAPI Application Entry Point following the Router-Service-Repository architecture.
"""
import sys
import os

# Ensure backend directory is in Python path for clean module resolution
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("RELOAD", "false").lower() in ("true", "1", "yes")
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload,
        proxy_headers=True,
        forwarded_allow_ips="*"
    )
