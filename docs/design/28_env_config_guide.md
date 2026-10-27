# D28 — Environment Configuration Guide
## Bright Solutions: Clinical Hospital Operating System

> **Document ID:** D28  
> **Version:** 1.0  
> **Status:** APPROVED ARCHITECTURE SPECIFICATION  
> **Depends On:** [03_technical_architecture.md](file:///home/prem/Desktop/pbt/COS/docs/design/03_technical_architecture.md), [07_deployment_architecture.md](file:///home/prem/Desktop/pbt/COS/docs/design/07_deployment_architecture.md), [08_security_access_control.md](file:///home/prem/Desktop/pbt/COS/docs/design/08_security_access_control.md), [26_developer_onboarding_guide.md](file:///home/prem/Desktop/pbt/COS/docs/design/26_developer_onboarding_guide.md)  
> **Prepared By:** Bright Solutions Backend Engineering Team  
> **Last Updated:** October 2026  

---

## Table of Contents

1. [Configuration Architecture & Pydantic BaseSettings](#1-configuration-architecture--pydantic-basesettings)
2. [Master Environment Variables Catalog](#2-master-environment-variables-catalog)
3. [Environment-Specific Profiles (Local vs. Staging vs. Edge Fallback)](#3-environment-specific-profiles-local-vs-staging-vs-edge-fallback)
4. [Secrets Management & Production Rotation Protocols](#4-secrets-management--production-rotation-protocols)
5. [Complete `.env.example` Reference Template](#5-complete-envexample-reference-template)

---

## 1. Configuration Architecture & Pydantic BaseSettings

Bright Solutions strictly adheres to the **Twelve-Factor App** methodology for configuration. Configuration values are injected exclusively via environment variables and loaded into a typed, validated Pydantic v2 `BaseSettings` singleton (`app.core.config.settings`).

### 1.1 Implementation Architecture (`app/core/config.py`)

```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import List

class Settings(BaseSettings):
    # Deployment Environment
    DEPLOYMENT_MODE: str = Field(default="LOCAL_DEV", pattern="^(LOCAL_DEV|STAGING|PRODUCTION_ONPREM|EDGE_FALLBACK)$")
    DEBUG: bool = Field(default=False)
    PORT: int = Field(default=8000)
    
    # Database Configuration (MySQL 8.0)
    DB_HOST: str
    DB_PORT: int = Field(default=3306)
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    DB_POOL_SIZE: int = Field(default=20)
    DB_MAX_OVERFLOW: int = Field(default=10)
    DB_POOL_RECYCLE: int = Field(default=1800)
    DB_POOL_TIMEOUT: int = Field(default=30)
    
    # Security, JWT & Hashes
    JWT_SECRET_KEY: str = Field(..., min_length=32)
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=15)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)
    AADHAAR_HASH_SALT: str = Field(..., min_length=16)
    
    # CORS & Networking
    CORS_ORIGINS: List[str] = Field(default=["https://clinicalservices.paperbirdtech.com"])
    
    # Edge Fallback Upstream
    CLOUD_UPSTREAM_URL: str = Field(default="https://clinicalservices.paperbirdtech.com/api/v1")
    
    # File Storage
    STORAGE_UPLOAD_DIR: str = Field(default="./storage")
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
```

---

## 2. Master Environment Variables Catalog

| Variable Name | Required | Default Value | Data Type | Semantics & Constraints |
|:---|:---:|:---:|:---:|:---|
| `DEPLOYMENT_MODE` | Yes | `LOCAL_DEV` | `string` | Target environment: `LOCAL_DEV`, `STAGING`, `PRODUCTION_ONPREM`, or `EDGE_FALLBACK` |
| `DEBUG` | No | `False` | `boolean` | Enables detailed stack traces in responses (Strictly `False` in staging/prod) |
| `PORT` | No | `8000` | `integer` | Port on which the Uvicorn daemon listens |
| `DB_HOST` | Yes | — | `string` | Hostname or IP of the MySQL 8.0 instance (e.g. `localhost` or `127.0.0.1`) |
| `DB_PORT` | No | `3306` | `integer` | MySQL TCP port |
| `DB_USER` | Yes | — | `string` | MySQL database user (must have `SELECT`, `INSERT`, `UPDATE`, `DELETE`) |
| `DB_PASSWORD` | Yes | — | `string` | Strong database password |
| `DB_NAME` | Yes | — | `string` | Database name (e.g. `bright_solutions_db`) |
| `DB_POOL_SIZE` | No | `20` | `integer` | Number of permanent connections maintained in SQLAlchemy `QueuePool` |
| `DB_MAX_OVERFLOW` | No | `10` | `integer` | Temporary burst connections allowed during clinical traffic spikes |
| `DB_POOL_RECYCLE`| No | `1800` | `integer` | Seconds before idle connections are recycled (prevents MySQL disconnects) |
| `DB_POOL_TIMEOUT`| No | `30` | `integer` | Seconds to wait for an available pool connection before raising TimeoutError |
| `JWT_SECRET_KEY` | Yes | — | `string` | Cryptographically random 256-bit secret used to sign HS256 tokens |
| `JWT_ALGORITHM` | No | `HS256` | `string` | HMAC-SHA256 signature algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `15` | `integer` | Expiration lifespan of staff access tokens |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | `7` | `integer` | Expiration lifespan of stateful refresh tokens |
| `AADHAAR_HASH_SALT` | Yes | — | `string` | Salt combined with raw Aadhaar numbers before SHA-256 computation |
| `CORS_ORIGINS` | No | `["..."]` | `json list` | JSON array of whitelisted client origins permitted to access APIs |
| `STORAGE_UPLOAD_DIR` | No | `./storage` | `string` | Absolute or relative filesystem path where diagnostic PDFs are saved |
| `CLOUD_UPSTREAM_URL` | No | `https://...` | `string` | Upstream Contabo cloud API endpoint for the local edge fallback sync agent |

---

## 3. Environment-Specific Profiles

### Profile 1: Local Development (`LOCAL_DEV`)
- `DEBUG=True`
- Fast hot-reload enabled via `uvicorn --reload`.
- Permissive CORS (`http://localhost:5173`, `http://localhost:3000`).
- Local filesystem storage `./storage/`.

### Profile 2: Contabo Cloud Staging (`STAGING`)
- `DEBUG=False`
- Bound to `127.0.0.1:8000` behind Apache reverse proxy.
- CORS restricted strictly to `["https://clinicalservices.paperbirdtech.com"]`.
- Secure system directory `/var/www/storage/` with `chmod 600`.
- Strong, non-default cryptographic keys.

### Profile 3: Local Hospital LAN Fallback (`EDGE_FALLBACK`)
- `DEPLOYMENT_MODE=EDGE_FALLBACK`
- `OFFLINE_MODE=True`
- `CLOUD_UPSTREAM_URL=https://clinicalservices.paperbirdtech.com/api/v1`
- Runs inside Docker network connecting to `edge-db:3306`.

---

## 4. Secrets Management & Production Rotation Protocols

### 4.1 Production Secrets Rules
1. **Never Commit Secrets to Version Control:** The `.env` file is explicitly ignored in `.gitignore`. Only `.env.example` containing dummy template values is tracked in Git.
2. **Generating Cryptographically Secure Secrets:**
   To generate a secure 256-bit random key for `JWT_SECRET_KEY` and `AADHAAR_HASH_SALT`, run:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```
3. **Rotating JWT Secrets:**
   When rotating `JWT_SECRET_KEY`:
   - Active 15-minute access tokens will fail signature verification and trigger an automated `/auth/refresh` call.
   - If the refresh token table is intact, staff sessions will refresh seamlessly without re-prompting for passwords.

---

## 5. Complete `.env.example` Reference Template

This template is saved directly at `backend/.env.example`:

```ini
# ============================================================================
# Bright Solutions: Clinical Hospital Operating System
# Master Environment Configuration Template (.env.example)
# Copy this file to .env and replace placeholder values.
# ============================================================================

# ----------------------------------------------------------------------------
# 1. DEPLOYMENT PROFILE
# ----------------------------------------------------------------------------
# Options: LOCAL_DEV | STAGING | PRODUCTION_ONPREM | EDGE_FALLBACK
DEPLOYMENT_MODE=LOCAL_DEV
DEBUG=True
PORT=8000

# ----------------------------------------------------------------------------
# 2. DATABASE CONFIGURATION (MySQL 8.0 / InnoDB)
# ----------------------------------------------------------------------------
DB_HOST=localhost
DB_PORT=3306
DB_USER=prem
DB_PASSWORD=password123
DB_NAME=bright_solutions_dev

# SQLAlchemy Connection Pool Settings
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=10
DB_POOL_RECYCLE=1800
DB_POOL_TIMEOUT=30

# ----------------------------------------------------------------------------
# 3. AUTHENTICATION, JWT & CRYPTOGRAPHIC SECRETS
# ----------------------------------------------------------------------------
# Generate 256-bit hex secrets via: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=replace_with_64_character_hex_string_min_256_bits_length_12345
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Salt for irreversible HMAC-SHA-256 Aadhaar de-identification (DPDP Act)
AADHAAR_HASH_SALT=replace_with_another_secure_unique_hex_salt_string_here_54321

# ----------------------------------------------------------------------------
# 4. NETWORKING, CORS & PROXY SETTINGS
# ----------------------------------------------------------------------------
# JSON array of permitted CORS origins (include protocol and port, no trailing slash)
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:8000", "https://clinicalservices.paperbirdtech.com"]

# ----------------------------------------------------------------------------
# 5. STORAGE & FILE UPLOADS
# ----------------------------------------------------------------------------
# Directory for storing diagnostic PDF reports and generated receipts (chmod 600)
STORAGE_UPLOAD_DIR=./storage

# ----------------------------------------------------------------------------
# 6. EDGE FALLBACK & SYNC CONFIGURATION
# ----------------------------------------------------------------------------
# Used by edge sync agent when running in hospital LAN fallback mode
CLOUD_UPSTREAM_URL=https://clinicalservices.paperbirdtech.com/api/v1
```
