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
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
