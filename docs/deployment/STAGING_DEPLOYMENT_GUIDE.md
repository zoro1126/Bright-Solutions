# Contabo LAMP Staging Server Deployment Guide
**Target Domain:** `https://clinicalservices.paperbirdtech.com`  
**Root Web Directory:** `~/public_html/clinicalservices.paperbirdtech.com/`  
**Backend API Subdirectory:** `~/public_html/clinicalservices.paperbirdtech.com/api/`  
**Process Manager:** PM2 (`ecosystem.config.js`)  
**Web Server:** Apache 2.4+ (`.htaccess` reverse proxy to Uvicorn on `127.0.0.1:8000`)

---

## 1. System Architecture & Request Routing

```
Internet Request (HTTPS)
       │
       ▼
[ Apache Web Server / Port 443 (SSL) ]
       │
       ├────────────────────────────────────────┬────────────────────────────────────────┐
       ▼                                        ▼                                        ▼
Frontend SPA Routes                      Static Uploads                           API Requests (/api/*)
(e.g., /, /login, /dashboard)           (/api/uploads/*.pdf)                     (/api/v1/*, /api/docs)
       │                                        │                                        │
Root `.htaccess`                         Served directly                         `api/.htaccess`
Rewrites to index.html                   from disk by Apache                     mod_proxy RewriteRule [P]
                                                                                         │
                                                                                         ▼
                                                                        [ PM2 Daemon: Uvicorn / Port 8000 ]
                                                                        FastAPI Modular Monolith Application
                                                                                         │
                                                                                         ▼
                                                                           [ MySQL / MariaDB Database ]
```

---

## 2. Directory Structure on Server

Ensure your files on the Contabo server are laid out as follows:

```text
~/public_html/clinicalservices.paperbirdtech.com/
├── .htaccess                     <-- Root Apache configuration (Frontend SPA routing)
├── index.html                    <-- Frontend build entrypoint (provided by frontend dev)
├── assets/                       <-- Frontend static assets
└── api/                          <-- BACKEND ROOT DIRECTORY
    ├── .htaccess                 <-- Backend reverse proxy to 127.0.0.1:8000
    ├── .env                      <-- Staging environment variables & DB credentials
    ├── ecosystem.config.js       <-- PM2 process manager configuration
    ├── main.py                   <-- Uvicorn entry point
    ├── requirements.txt          <-- Python dependencies
    ├── venv/                     <-- Python 3 virtual environment
    ├── app/                      <-- Modular Monolith application code
    ├── scripts/                  <-- Database provisioning and seeding scripts
    ├── docs/design/              <-- Canonical SQL DDL (09_database_schema_ddl.sql)
    ├── uploads/                  <-- Uploaded clinical scans & receipts
    └── logs/                     <-- PM2 error and stdout logs
```

---

## 3. Configuration Files Reference

### A. Backend Reverse Proxy (`api/.htaccess`)
Located at: `~/public_html/clinicalservices.paperbirdtech.com/api/.htaccess`

```apache
# Disable directory listing & server banner
Options -Indexes
ServerSignature Off

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /api/

    # CRITICAL: Forward Authorization header to PM2/FastAPI for Bearer JWTs
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
    SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=$1

    # Security: Block direct HTTP downloads of python files, virtualenv, and configs
    RewriteRule ^(\.env|\.git|ecosystem\.config\.js|requirements\.txt|.*\.py|.*\.pyc)$ - [F,L]
    RewriteRule ^(venv|app|scripts|tests|logs|__pycache__)/ - [F,L]

    # Serve static uploaded files directly if they exist
    RewriteCond %{REQUEST_FILENAME} -f
    RewriteRule ^uploads/(.*)$ uploads/$1 [L]

    # Reverse Proxy all /api requests to local Uvicorn daemon on port 8000
    RewriteRule ^(.*)$ http://127.0.0.1:8000/api/$1 [P,L,QSA]
</IfModule>

<IfModule mod_headers.c>
    RequestHeader set X-Forwarded-Proto "https" env=HTTPS
</IfModule>
```

### B. Root Domain Router (`.htaccess`)
Located at: `~/public_html/clinicalservices.paperbirdtech.com/.htaccess`

```apache
Options -Indexes
ServerSignature Off

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # 1. Force HTTPS
    RewriteCond %{HTTPS} !=on
    RewriteCond %{HTTP:X-Forwarded-Proto} !https
    RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]

    # 2. DO NOT intercept /api traffic (let api/.htaccess handle it)
    RewriteRule ^api(/.*)?$ - [L]

    # 3. Block sensitive files (.git, .env)
    RewriteRule ^\.(git|env) - [F,L]

    # 4. Frontend SPA Fallback (React/Vue history mode)
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

### C. PM2 Configuration (`api/ecosystem.config.js`)
Located at: `~/public_html/clinicalservices.paperbirdtech.com/api/ecosystem.config.js`

```javascript
module.exports = {
  apps: [
    {
      name: "clinicalservices-api",
      script: "main.py",
      cwd: __dirname,
      interpreter: "./venv/bin/python3",
      args: "",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        HOST: "127.0.0.1",
        PORT: 8000,
        NODE_ENV: "production",
        PYTHONPATH: ".",
        RELOAD: "false",
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,
    },
  ],
};
```

---

## 4. Step-by-Step Staging Server Setup Runbook

Connect to your Contabo server via SSH:
```bash
ssh username@your-contabo-ip
```

### Step 1: Ensure Apache Modules & Node/PM2 Are Available
If you have `sudo` access, ensure Apache proxy and rewrite modules are enabled:
```bash
sudo a2enmod rewrite proxy proxy_http headers
sudo systemctl restart apache2
```
Verify Node.js and PM2 are installed:
```bash
node -v
npm install -g pm2
pm2 -v
```

### Step 2: Prepare the Staging Directories
```bash
# Create the domain root if not already present
mkdir -p ~/public_html/clinicalservices.paperbirdtech.com/api

# Clone the repository to a working directory in your home folder
cd ~
git clone https://github.com/zoro1126/Bright-Solutions.git cos-source
cd cos-source
git checkout main
git pull origin main

# Deploy backend code into the api directory
cp -r backend/* ~/public_html/clinicalservices.paperbirdtech.com/api/
cp -r backend/.htaccess ~/public_html/clinicalservices.paperbirdtech.com/api/
cp -r backend/.env.staging.example ~/public_html/clinicalservices.paperbirdtech.com/api/
cp -r scripts ~/public_html/clinicalservices.paperbirdtech.com/api/
cp -r docs ~/public_html/clinicalservices.paperbirdtech.com/api/

# Copy root .htaccess for the domain
cp docs/deployment/DOMAIN_ROOT_.htaccess ~/public_html/clinicalservices.paperbirdtech.com/.htaccess
```

### Step 3: Set Up Python 3 Virtual Environment & Dependencies
```bash
cd ~/public_html/clinicalservices.paperbirdtech.com/api

# Create isolated Python virtual environment
python3 -m venv venv

# Activate and install dependencies
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Create runtime directories
mkdir -p logs uploads storage
chmod 700 storage uploads logs
```

### Step 4: Configure Staging Environment Variables (`.env`)
```bash
cd ~/public_html/clinicalservices.paperbirdtech.com/api
cp .env.staging.example .env

# Edit .env with your staging MySQL database credentials and secrets:
nano .env
```
Fill in the parameters:
```ini
DEPLOYMENT_MODE=STAGING
DEBUG=False
HOST=127.0.0.1
PORT=8000
RELOAD=false

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_mysql_staging_user
DB_PASSWORD=your_mysql_staging_password
DB_NAME=your_mysql_staging_db

JWT_SECRET_KEY=9478f6a9e14d3c267bca9082ef45b4c10298d36154e7f8a91c32b5e67049c123
SECRET_KEY=9478f6a9e14d3c267bca9082ef45b4c10298d36154e7f8a91c32b5e67049c123
AADHAAR_HASH_SALT=e4b78912cf30a84d59c60e12984576df
CORS_ORIGINS=["https://clinicalservices.paperbirdtech.com", "http://localhost:5173"]
STORAGE_UPLOAD_DIR=./uploads
```
*(Tip: You can generate 64-char random hex secrets using `python3 -c "import secrets; print(secrets.token_hex(32))"`)*.

### Step 5: Provision Database Schema & Master Seeds
While inside `~/public_html/clinicalservices.paperbirdtech.com/api` and with `venv` activated:
```bash
source venv/bin/activate

# 1. Provision all 42 canonical tables from SQL DDL
python scripts/provision_canonical_schema.py

# 2. Seed Default Hospital Tenant ('shubham') and 8 Standard System Roles
python scripts/seed_tenant_and_license.py

# 3. Seed Departments, Tariff Masters, and Clinical Infrastructure (Beds & Rooms)
python scripts/seed_clinical_infrastructure.py

# 4. Seed Clinical Staff User Accounts (Doctor, Nurse, Receptionist, Admin, etc.)
python scripts/seed_staff_users.py
```

### Step 6: Start and Persist the PM2 Daemon
```bash
cd ~/public_html/clinicalservices.paperbirdtech.com/api

# Start process using ecosystem file
pm2 start ecosystem.config.js

# Check status
pm2 status

# Save PM2 process list so it survives server reboots
pm2 save

# (Optional - if root/sudo available) Enable PM2 systemd startup hook
pm2 startup
```

---

## 5. Verification & Testing

### 1. Test Local PM2 Daemon Response (Internal Port 8000)
```bash
curl -i http://127.0.0.1:8000/api/v1/health
```
Expected output:
```json
HTTP/1.1 200 OK
content-type: application/json

{"status":"healthy","service":"Bright Solutions API","version":"2.0.0"}
```

### 2. Test Apache Reverse Proxy (Public HTTPS Domain)
```bash
curl -i https://clinicalservices.paperbirdtech.com/api/v1/health
```
Expected output:
```json
HTTP/2 200 
content-type: application/json

{"status":"healthy","service":"Bright Solutions API","version":"2.0.0"}
```

### 3. Test Interactive Swagger API Documentation
Open your web browser and visit:
👉 **`https://clinicalservices.paperbirdtech.com/api/docs`**  
The Swagger UI will render with all `/api/v1` routes:
- Authentication (`/api/v1/auth/login`, `/api/v1/auth/refresh`)
- Patient Registration (`/api/v1/patients`)
- OPD Triage & Consultations (`/api/v1/triage`, `/api/v1/consultations`)
- IPD Admission & Bed Matrix (`/api/v1/ipd/admissions`, `/api/v1/ipd/bed-matrix`)
- Billing & Discharge (`/api/v1/billing`, `/api/v1/ipd/discharge`)

### 4. Test Staff Authentication via Curl
```bash
curl -X POST https://clinicalservices.paperbirdtech.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"dr.sharma@brightsolutions.in","password":"Doctor@123","hospital_code":"shubham"}'
```
Expected output:
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "email": "dr.sharma@brightsolutions.in",
    "full_name": "Dr. Ramesh Sharma",
    "role": "DOCTOR"
  }
}
```

---

## 6. PM2 Operations & Maintenance Commands

| Operation | Command |
|---|---|
| Check status | `pm2 status` |
| View live logs | `pm2 logs clinicalservices-api` |
| View error log only | `pm2 logs clinicalservices-api --err` |
| Restart backend | `pm2 restart clinicalservices-api` |
| Reload with zero downtime | `pm2 reload clinicalservices-api` |
| Stop backend | `pm2 stop clinicalservices-api` |
| View process metrics (CPU/RAM) | `pm2 monit` |

