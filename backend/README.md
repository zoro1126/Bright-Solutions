# Bright Solutions — Backend API

This backend is structured following the **Router-Service-Repository** pattern with FastAPI and PyMySQL.

## Quick Start
```bash
# 1. Activate venv
source venv/bin/activate

# 2. Run dev server
uvicorn main:app --reload --port 8000
```

- **Interactive API Docs (Swagger)**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc
- **Liveness Health Check**: http://localhost:8000/api/health

## Complete Documentation
For full architectural details, code flow walkthroughs, and a complete reference of all 27 endpoints (with request bodies and response schemas), refer to:
- [`docs/BACKEND_DEVELOPER_GUIDE.md`](../docs/BACKEND_DEVELOPER_GUIDE.md)
