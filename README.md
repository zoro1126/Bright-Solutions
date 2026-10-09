# Bright Solutions — Clinic Operating System (Clinic OS)

> **A high-velocity, role-based Outpatient Department (OPD) Clinic Operating System designed for general clinics.**  
> Built with FastAPI, MySQL 8.0, React 18, and Vite. Designed around a Radiant Yellow primary palette, modern editorial typography, and zero-clutter clinical workflows.

---

## 1. System Architecture

```
+-------------------------------------------------------------+
|              React 18 + Vite Frontend (Port 3000)           |
|    Receptionist | Doctor / CDSS | Cashier | Administrator   |
+-------------------------------------------------------------+
                              |
                     Proxy /api/* requests
                              ↓
+-------------------------------------------------------------+
|               FastAPI REST Backend (Port 8000)              |
|        Auth • Visits • Triage • Reports • CDSS • Billing    |
+-------------------------------------------------------------+
                              ↓
+-------------------------------------------------------------+
|                     MySQL 8.0 Database                      |
|                  Database: test_clinicos_db                 |
+-------------------------------------------------------------+
```

### Technology Stack
- **Backend**: Python 3.10+, FastAPI, PyMySQL, Pydantic v2, Uvicorn
- **Frontend**: React 18, Vite, Vanilla CSS Design System, Lucide React
- **Database**: MySQL 8.0 (`InnoDB`, `utf8mb4`)
- **Brand Typography**: [Libre Baskerville](https://fonts.google.com/specimen/Libre+Baskerville) (Headings & Accents) + [DM Sans](https://fonts.google.com/specimen/DM+Sans) (Body & Inputs)
- **Brand Colors**: **Canary / Radiant Yellow** (`#FFE500` / `#FACC15`) as dominant primary; Midnight Navy (`#0A2540` / `#051A30`) framing complement.

---

## 2. Prerequisites

Ensure you have the following installed locally:
- **MySQL Server 8.0+** running on port `3306`
- **Python 3.10+** and `pip`
- **Node.js 18+** and `npm`

---

## 3. Database Setup

1. **Create the MySQL Database**:
   ```sql
   CREATE DATABASE IF NOT EXISTS test_clinicos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Configure Environment Variables**:
   Verify or edit `backend/.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=prem
   DB_PASSWORD=password123
   DB_NAME=test_clinicos_db
   PORT=8000
   ```

3. **Initialize Schema & Seed Staff Users**:
   Run the database initialization script from the `backend/` directory:
   ```bash
   cd backend
   python3 -c "from database import init_db; init_db()"
   ```
   *This automatically creates the required tables (`users`, `patients`, `visits`, `vital_signs`, etc.) and seeds default demo staff accounts.*

---

## 4. Running the Backend (FastAPI)

1. **Activate Virtual Environment & Install Dependencies**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Start the FastAPI Development Server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

3. **Verify Backend Health**:
   - Health check: `http://localhost:8000/api/health`
   - Interactive Swagger API Documentation: `http://localhost:8000/docs`
   - ReDoc Documentation: `http://localhost:8000/redoc`

---

## 5. Running the Frontend (React + Vite)

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start the Vite Dev Server**:
   ```bash
   npm run dev
   ```

3. **Open the Application**:
   - Access the web application at: `http://localhost:3000`
   - Vite automatically proxies all `/api/*` network requests to `http://localhost:8000/api/*`.

---

## 6. Seed Staff Accounts (One-Click Personas)

The database includes pre-configured staff accounts for rapid testing:

| Role | Username | Password | Full Name & Specialty |
| :--- | :--- | :--- | :--- |
| **Receptionist** | `receptionist_anita` | `password123` | Anita Sharma (Front Desk & Triage) |
| **Doctor** | `dr_kulkarni` | `password123` | Dr. Vikram Kulkarni, MD (Cardiology) |
| **Doctor** | `dr_ananya` | `password123` | Dr. Ananya Roy, MBBS, DNB |
| **Doctor** | `dr_priya` | `password123` | Dr. Priya Nair, MD (Internal Medicine) |
| **Cashier** | `cashier_rahul` | `password123` | Rahul Verma (Billing & Cashier Desk) |

*You can also click the quick **Persona Switcher** in the UI to log in instantly without typing passwords.*

---

## 7. Developer Rules & Workflow Guidelines

### Strict Subsystem Folder Isolation
To prevent git merge conflicts and ensure clean rebases:
- **Backend Developers**: Work **ONLY inside `backend/`** and `docs/BACKEND_PR_LIST.md`. **Never edit `frontend/`**.
- **Frontend Developers**: Work **ONLY inside `frontend/`** and `docs/FRONTEND_PR_LIST.md`. **Never edit `backend/`**.

### Dynamic Routing & Server Load Hygiene
- **Backend Endpoints**: **Must strictly use the `/api/` prefix** (e.g. `/api/visits/{id}/questionnaire`).
- **Frontend SPA Routes**: Clean semantic routes without `/api/` (e.g. `/receptionist/dashboard`, `/doctor/patient/:id`).
- **Zero Hidden DB Hits**: Components and modals MUST NOT trigger network or DB calls while closed or hidden. Data is strictly fetched on-demand when the modal/view mounts.

---

## 8. Specification & Documentation Directory

- 🗄️ **[DATABASE_SPEC.md](docs/DATABASE_SPEC.md)**: Full 13-table MySQL relational data dictionary, constraints, and DDL.
- 🔌 **[API_SPEC.md](docs/API_SPEC.md)**: Exhaustive REST API contract with request/response schemas.
- 🚀 **[BACKEND_DEVELOPER_GUIDE.md](docs/BACKEND_DEVELOPER_GUIDE.md)**: Router-Service-Repository architecture, request lifecycles, and complete endpoint reference.
- 🎨 **[FRONTEND_PAGES_SPEC.md](docs/FRONTEND_PAGES_SPEC.md)**: Role-by-role page designs, component purposes, and ASCII wireframes.
- 📋 **[FEATURE_SPEC.md](docs/FEATURE_SPEC.md)**: Detailed clinical features and acceptance criteria.
- 🔨 **[BACKEND_PR_LIST.md](docs/BACKEND_PR_LIST.md)**: 10 atomic, committable PR tasks for FastAPI/MySQL.
- ⚛️ **[FRONTEND_PR_LIST.md](docs/FRONTEND_PR_LIST.md)**: 10 atomic, committable PR tasks for React/Vite.
