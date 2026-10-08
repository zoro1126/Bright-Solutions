from fastapi import FastAPI, HTTPException, Query, status, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import date, datetime
import pymysql
import os
import math
import shutil
from database import get_connection, init_db

app = FastAPI(
    title="Bright Solutions API — OPD Management & Decision Support System",
    version="1.0.0",
    description="Backend API powering Bright Solutions Outpatient Department Operations. Feature 1: Patient Registration & Triage Vitals Capture."
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create and mount uploads directory for external diagnostic media
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.on_event("startup")
def on_startup():
    init_db()

# ============================================================================
# PYDANTIC DATA MODELS
# ============================================================================

class VitalSignsInput(BaseModel):
    systolic_bp: Optional[int] = Field(None, ge=40, le=300, description="Systolic Blood Pressure (mmHg)")
    diastolic_bp: Optional[int] = Field(None, ge=30, le=200, description="Diastolic Blood Pressure (mmHg)")
    pulse_rate: Optional[int] = Field(None, ge=30, le=250, description="Pulse Rate (bpm)")
    temperature_f: Optional[float] = Field(None, ge=90.0, le=110.0, description="Body Temperature (°F)")
    resp_rate: Optional[int] = Field(None, ge=5, le=60, description="Respiratory Rate (breaths/min)")
    spo2_pct: Optional[int] = Field(None, ge=50, le=100, description="Oxygen Saturation (%)")
    weight_kg: Optional[float] = Field(None, ge=1.0, le=350.0, description="Weight (kg)")
    height_cm: Optional[float] = Field(None, ge=30.0, le=250.0, description="Height (cm)")

class PatientRegistrationRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    dob: date = Field(..., description="Date of birth YYYY-MM-DD")
    gender: str = Field(..., description="MALE, FEMALE, or OTHER")
    blood_group: Optional[str] = Field("UNKNOWN", description="e.g. A+, B+, O+, AB+, etc.")
    phone: str = Field(..., min_length=7, max_length=20)
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    doctor_id: int = Field(..., description="Assigned Physician User ID")
    chief_complaint: Optional[str] = None
    insurance_type: Optional[str] = Field("CASH", description="CASH, INSURANCE, GOVT_SCHEME")
    insurance_provider: Optional[str] = None
    policy_number: Optional[str] = None
    vitals: Optional[VitalSignsInput] = None

class QuestionnaireInput(BaseModel):
    patient_id: int = Field(..., description="Patient Master ID")
    answers: Dict[str, Optional[int]] = Field(
        default_factory=dict,
        description="Key-value mapping of questions (q1..q20) to chosen integer MCQ option index (0, 1, 2, 3...)"
    )
    voice_notes: Optional[str] = Field(None, description="Optional dictated voice notes from triage intake")

class InsightReviewRequest(BaseModel):
    is_reviewed: Optional[bool] = Field(True, description="Mark alert as acknowledged/reviewed")
    doctor_override_notes: Optional[str] = Field(None, description="Clinical justification when overriding a Critical safety alert")

class DoctorSignOffRequest(BaseModel):
    conclusion_notes: str = Field(..., min_length=3, description="Doctor final diagnosis, clinical findings, and disposition impression")
    diagnosis: Optional[str] = Field(None, description="Optional formal primary diagnosis")
    doctor_id: Optional[int] = Field(None, description="Attending physician user ID signing the encounter")
    doctor_override_notes: Optional[str] = Field(None, description="Clinical justification overriding any active CRITICAL safety alerts")
    override_reasons: Optional[str] = Field(None, description="Alias for doctor_override_notes")

class PrescriptionItemInput(BaseModel):
    drug_id: int = Field(..., description="Foreign key to drug_formulary(id)")
    dosage: Optional[str] = Field("1 tab", description="Dosage quantity e.g. 1 tab, 5ml, 2 puffs")
    frequency: Optional[str] = Field("1-0-1", description="Schedule e.g. OD, BD, TDS, 1-0-1, SOS")
    duration_days: Optional[int] = Field(5, description="Duration in calendar days")
    meal_timing: Optional[str] = Field("AFTER_MEALS", description="BEFORE_MEALS, AFTER_MEALS, WITH_MEALS, BEDTIME")
    special_instructions: Optional[str] = Field(None, description="Patient-specific precautions")
    instructions: Optional[str] = Field(None, description="Alias for special_instructions")

class PrescriptionCreateRequest(BaseModel):
    doctor_id: Optional[int] = Field(None, description="Attending physician user ID")
    general_instructions: Optional[str] = Field(None, description="Dietary and lifestyle advice")
    status: Optional[str] = Field("FINALIZED", description="DRAFT, FINALIZED")
    items: List[PrescriptionItemInput] = Field(..., min_items=1, description="List of prescribed medications")


class LoginRequest(BaseModel):
    username: str
    password: str

# ============================================================================
# HELPER FUNCTIONS (CLINICAL LOGIC)
# ============================================================================

def compute_bmi_and_category(weight_kg: Optional[float], height_cm: Optional[float]):
    if not weight_kg or not height_cm or height_cm <= 0:
        return None, None
    height_m = height_cm / 100.0
    bmi = round(weight_kg / (height_m * height_m), 1)
    if bmi < 18.5:
        category = "Underweight"
    elif bmi < 25.0:
        category = "Normal Weight"
    elif bmi < 30.0:
        category = "Overweight"
    else:
        category = "Obese"
    return bmi, category

def compute_bp_stage(systolic: Optional[int], diastolic: Optional[int]):
    if not systolic or not diastolic:
        return None
    if systolic >= 180 or diastolic >= 120:
        return "Hypertensive Crisis"
    elif systolic >= 140 or diastolic >= 90:
        return "Stage 2 Hypertension"
    elif (130 <= systolic <= 139) or (80 <= diastolic <= 89):
        return "Stage 1 Hypertension"
    elif (120 <= systolic <= 129) and diastolic < 80:
        return "Elevated BP"
    elif systolic < 120 and diastolic < 80:
        return "Normal Blood Pressure"
    return "Borderline"

# ============================================================================
# API ROUTES (FEATURE 1: REGISTRATION & TRIAGE VITALS)
# ============================================================================

@app.get("/api/health", tags=["Health"])
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

# ============================================================================
# AUTHENTICATION & PERSONA ENDPOINTS
# ============================================================================

@app.post("/api/auth/login", tags=["Auth"])
def login(req: LoginRequest):
    """Authenticates clinic personnel by username and issues session token."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, username, full_name, role, email, phone, is_active
                FROM users
                WHERE LOWER(username) = LOWER(%s) AND is_active = 1;
            """, (req.username.strip(),))
            user = cur.fetchone()
            if not user:
                raise HTTPException(status_code=401, detail="Invalid username or staff account is inactive.")
            
            token = f"clinicos_session_{user['id']}_{user['role'].lower()}"
            return {
                "token": token,
                "user": user,
                "message": f"Welcome back, {user['full_name']}!"
            }
    finally:
        conn.close()

@app.get("/api/auth/users", tags=["Auth"])
def list_auth_users():
    """Lists available clinic users to enable 1-click persona testing."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, username, full_name, role, email 
                FROM users 
                WHERE is_active = 1
                ORDER BY FIELD(role, 'RECEPTIONIST', 'DOCTOR', 'CASHIER', 'ADMIN'), full_name ASC;
            """)
            users = cur.fetchall()
            return {"users": users}
    finally:
        conn.close()

# ============================================================================
# CLINICAL DASHBOARD ANALYTICS ENDPOINTS
# ============================================================================

@app.get("/api/dashboard/stats", tags=["Dashboard"])
def get_dashboard_stats():
    """Returns real-time OPD KPI metrics, BP stage distribution, BMI breakdown, and recent triage feed."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # 1. Total patients
            cur.execute("SELECT COUNT(*) AS total_patients FROM patients;")
            total_patients = cur.fetchone()["total_patients"]

            # 2. Today's visits
            cur.execute("SELECT COUNT(*) AS today_visits FROM visits WHERE DATE(visit_date) = CURDATE();")
            today_visits = cur.fetchone()["today_visits"]

            # 3. Active doctors count
            cur.execute("SELECT COUNT(*) AS active_doctors FROM users WHERE role = 'DOCTOR' AND is_active = 1;")
            active_doctors = cur.fetchone()["active_doctors"]

            # 4. Next token preview
            next_token = f"Q-{101 + today_visits}"

            # 5. BP Stages distribution
            cur.execute("""
                SELECT 
                    COALESCE(bp_stage, 'Normal Blood Pressure') AS stage,
                    COUNT(*) AS count
                FROM vital_signs
                GROUP BY stage;
            """)
            bp_breakdown = cur.fetchall()

            # 6. BMI Category distribution
            cur.execute("""
                SELECT 
                    COALESCE(bmi_category, 'Normal Weight') AS category,
                    COUNT(*) AS count
                FROM vital_signs
                GROUP BY category;
            """)
            bmi_breakdown = cur.fetchall()

            # 7. Recent 5 registered patients with triage vitals
            cur.execute("""
                SELECT 
                    p.id AS patient_id,
                    p.uhid,
                    CONCAT(p.first_name, ' ', p.last_name) AS full_name,
                    p.gender,
                    TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age,
                    p.phone,
                    v.queue_token,
                    v.status AS visit_status,
                    v.visit_date,
                    u_doc.full_name AS doctor_name,
                    vt.systolic_bp,
                    vt.diastolic_bp,
                    vt.bp_stage,
                    vt.bmi,
                    vt.bmi_category,
                    vt.pulse_rate,
                    vt.temperature_f,
                    vt.spo2_pct
                FROM patients p
                JOIN visits v ON v.patient_id = p.id
                LEFT JOIN users u_doc ON u_doc.id = v.doctor_id
                LEFT JOIN vital_signs vt ON vt.visit_id = v.id
                ORDER BY v.visit_date DESC
                LIMIT 5;
            """)
            recent_patients = cur.fetchall()

            return {
                "total_patients": total_patients,
                "today_visits": today_visits,
                "active_doctors": active_doctors,
                "next_token": next_token,
                "bp_breakdown": bp_breakdown,
                "bmi_breakdown": bmi_breakdown,
                "recent_patients": recent_patients
            }
    finally:
        conn.close()

@app.get("/api/doctors", tags=["Staff"])
def list_doctors():
    """Returns active doctors available for consultation assignment."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, username, full_name, role, email, phone 
                FROM users 
                WHERE role = 'DOCTOR' AND is_active = 1
                ORDER BY full_name ASC;
            """)
            doctors = cur.fetchall()
            return {"count": len(doctors), "doctors": doctors}
    finally:
        conn.close()

@app.get("/api/tokens/next", tags=["Queue"])
def preview_next_token():
    """Generates preview for next OPD queue token."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT COUNT(*) as today_count 
                FROM visits 
                WHERE DATE(visit_date) = CURDATE();
            """)
            row = cur.fetchone()
            next_num = 101 + (row["today_count"] if row else 0)
            return {"next_token": f"Q-{next_num}"}
    finally:
        conn.close()

@app.get("/api/patients", tags=["Patients & Vitals"])
def list_registered_patients(
    search: Optional[str] = Query(None, description="Search by name, phone, or UHID"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    limit: Optional[int] = Query(None, ge=1, le=200, description="Deprecated limit parameter for backwards compatibility")
):
    """Lists registered patients with pagination, search, latest visit encounter, and triage vital signs."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            effective_page_size = limit if isinstance(limit, int) else (page_size if isinstance(page_size, int) else 20)
            cur_page = page if isinstance(page, int) else 1
            offset = (cur_page - 1) * effective_page_size

            # 1. Count query for total matching records
            count_query = "SELECT COUNT(*) AS total FROM patients p"
            count_params = []
            search_term = search.strip() if isinstance(search, str) and search.strip() else None
            if search_term:
                count_query += """
                    WHERE p.first_name LIKE %s 
                       OR p.last_name LIKE %s 
                       OR p.phone LIKE %s 
                       OR p.uhid LIKE %s
                """
                term = f"%{search_term}%"
                count_params.extend([term, term, term, term])
            
            cur.execute(count_query, count_params)
            count_row = cur.fetchone()
            total_count = count_row["total"] if count_row else 0
            total_pages = math.ceil(total_count / effective_page_size) if total_count > 0 else 1

            # 2. Main data query with LIMIT and OFFSET
            query = """
                SELECT 
                    p.id AS patient_id,
                    p.uhid,
                    p.first_name,
                    p.last_name,
                    CONCAT(p.first_name, ' ', p.last_name) AS full_name,
                    p.dob,
                    TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age,
                    p.gender,
                    p.blood_group,
                    p.phone,
                    p.email,
                    p.address,
                    p.emergency_contact,
                    p.insurance_type,
                    p.insurance_provider,
                    p.policy_number,
                    v.id AS visit_id,
                    v.queue_token,
                    v.status AS visit_status,
                    v.visit_date,
                    v.chief_complaint,
                    u_doc.full_name AS doctor_name,
                    u_doc.id AS doctor_id,
                    vt.id AS vital_id,
                    vt.systolic_bp,
                    vt.diastolic_bp,
                    vt.pulse_rate,
                    vt.temperature_f,
                    vt.resp_rate,
                    vt.spo2_pct,
                    vt.weight_kg,
                    vt.height_cm,
                    vt.bmi,
                    vt.bmi_category,
                    vt.bp_stage
                FROM patients p
                LEFT JOIN visits v ON v.id = (
                    SELECT id FROM visits WHERE patient_id = p.id ORDER BY visit_date DESC LIMIT 1
                )
                LEFT JOIN users u_doc ON u_doc.id = v.doctor_id
                LEFT JOIN vital_signs vt ON vt.visit_id = v.id
            """
            params = []
            if search_term:
                query += """
                    WHERE p.first_name LIKE %s 
                       OR p.last_name LIKE %s 
                       OR p.phone LIKE %s 
                       OR p.uhid LIKE %s
                """
                term = f"%{search_term}%"
                params.extend([term, term, term, term])
            
            query += " ORDER BY v.visit_date DESC, p.created_at DESC LIMIT %s OFFSET %s;"
            params.extend([effective_page_size, offset])

            cur.execute(query, params)
            patients = cur.fetchall()

            return {
                "total_count": total_count,
                "page": page,
                "page_size": effective_page_size,
                "total_pages": total_pages,
                "count": len(patients),
                "patients": patients
            }
    finally:
        conn.close()

@app.post("/api/patients", tags=["Patients & Vitals"], status_code=status.HTTP_201_CREATED)
def register_patient_and_triage(req: PatientRegistrationRequest):
    """
    FEAT-01: Registers a new patient, calculates real-time BMI and BP stages,
    allocates the next sequential OPD Queue Token (#Q-xxx), and persists triage vitals.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # 1. Verify attending doctor exists
            cur.execute("SELECT id, full_name FROM users WHERE id = %s AND role = 'DOCTOR';", (req.doctor_id,))
            doctor = cur.fetchone()
            if not doctor:
                raise HTTPException(status_code=400, detail=f"Doctor with ID {req.doctor_id} not found or inactive.")

            # 2. Get receptionist user (default to 1 Anita Sharma if not authenticated)
            cur.execute("SELECT id FROM users WHERE role = 'RECEPTIONIST' LIMIT 1;")
            rec_row = cur.fetchone()
            receptionist_id = rec_row["id"] if rec_row else 1

            # 3. Generate sequential UHID for the year
            current_year = datetime.now().year
            cur.execute("""
                SELECT COUNT(*) as total_patients FROM patients WHERE YEAR(created_at) = %s;
            """, (current_year,))
            count_row = cur.fetchone()
            patient_seq = (count_row["total_patients"] if count_row else 0) + 1
            uhid = f"UHID-{current_year}-{patient_seq:05d}"

            # 4. Insert into patients table
            cur.execute("""
                INSERT INTO patients (
                    uhid, first_name, last_name, dob, gender, blood_group, 
                    phone, email, address, emergency_contact,
                    insurance_type, insurance_provider, policy_number
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (
                uhid,
                req.first_name.strip(),
                req.last_name.strip(),
                req.dob,
                req.gender.upper(),
                req.blood_group.upper() if req.blood_group else "UNKNOWN",
                req.phone.strip(),
                req.email.strip() if req.email else None,
                req.address.strip() if req.address else None,
                req.emergency_contact.strip() if req.emergency_contact else None,
                req.insurance_type or "CASH",
                req.insurance_provider,
                req.policy_number
            ))
            patient_id = cur.lastrowid

            # 5. Generate Queue Token for today
            cur.execute("""
                SELECT COUNT(*) as today_visits FROM visits WHERE DATE(visit_date) = CURDATE();
            """)
            visit_count = cur.fetchone()["today_visits"]
            token_num = 101 + visit_count
            queue_token = f"Q-{token_num}"

            # 6. Insert Visit Record (Initial status: TRIAGED)
            cur.execute("""
                INSERT INTO visits (
                    patient_id, doctor_id, receptionist_id, visit_date,
                    queue_token, status, chief_complaint
                ) VALUES (%s, %s, %s, NOW(), %s, 'TRIAGED', %s);
            """, (
                patient_id,
                req.doctor_id,
                receptionist_id,
                queue_token,
                req.chief_complaint or "Routine General OPD Consultation"
            ))
            visit_id = cur.lastrowid

            # 7. Compute BMI and Blood Pressure Stage
            vitals_data = req.vitals
            bmi = None
            bmi_category = None
            bp_stage = None

            if vitals_data:
                bmi, bmi_category = compute_bmi_and_category(vitals_data.weight_kg, vitals_data.height_cm)
                bp_stage = compute_bp_stage(vitals_data.systolic_bp, vitals_data.diastolic_bp)

                # Insert Vital Signs
                cur.execute("""
                    INSERT INTO vital_signs (
                        visit_id, systolic_bp, diastolic_bp, pulse_rate,
                        temperature_f, resp_rate, spo2_pct, weight_kg,
                        height_cm, bmi, bmi_category, bp_stage
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """, (
                    visit_id,
                    vitals_data.systolic_bp,
                    vitals_data.diastolic_bp,
                    vitals_data.pulse_rate,
                    vitals_data.temperature_f,
                    vitals_data.resp_rate,
                    vitals_data.spo2_pct,
                    vitals_data.weight_kg,
                    vitals_data.height_cm,
                    bmi,
                    bmi_category,
                    bp_stage
                ))
                vital_id = cur.lastrowid
            else:
                vital_id = None

            # 8. Return comprehensive payload
            return {
                "message": "Patient registered and triage vitals recorded successfully",
                "patient": {
                    "id": patient_id,
                    "uhid": uhid,
                    "full_name": f"{req.first_name} {req.last_name}",
                    "phone": req.phone,
                    "gender": req.gender,
                    "dob": str(req.dob)
                },
                "visit": {
                    "id": visit_id,
                    "queue_token": queue_token,
                    "doctor_name": doctor["full_name"],
                    "status": "TRIAGED",
                    "visit_date": datetime.now().isoformat()
                },
                "vitals": {
                    "id": vital_id,
                    "bmi": bmi,
                    "bmi_category": bmi_category,
                    "bp_stage": bp_stage,
                    "systolic_bp": vitals_data.systolic_bp if vitals_data else None,
                    "diastolic_bp": vitals_data.diastolic_bp if vitals_data else None,
                    "pulse_rate": vitals_data.pulse_rate if vitals_data else None,
                    "temperature_f": vitals_data.temperature_f if vitals_data else None,
                    "spo2_pct": vitals_data.spo2_pct if vitals_data else None
                }
            }
    except pymysql.MySQLError as err:
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")
    finally:
        conn.close()

# ============================================================================
# API ROUTES (FEATURE 2: INTAKE MCQ QUESTIONNAIRE & VOICE NOTES)
# ============================================================================

@app.post("/api/visits/{visit_id}/questionnaire", tags=["Questionnaire"], status_code=status.HTTP_200_OK)
def save_visit_questionnaire(visit_id: int, req: QuestionnaireInput):
    """
    FEAT-02: Records standardized clinical intake MCQ questionnaire responses (q1..q20)
    and optional voice notes. Upserts if a questionnaire already exists for this visit encounter.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # 1. Verify visit encounter exists
            cur.execute("SELECT id, patient_id FROM visits WHERE id = %s;", (visit_id,))
            visit = cur.fetchone()
            if not visit:
                raise HTTPException(status_code=404, detail=f"Visit encounter with ID {visit_id} not found.")

            # 2. Extract valid q1..q20 answers
            valid_keys = [f"q{i}" for i in range(1, 21)]
            filtered_answers = {
                k: req.answers[k] for k in valid_keys if k in req.answers and req.answers[k] is not None
            }

            # 3. Build dynamic UPSERT query
            cols = ["visit_id", "patient_id", "voice_notes"] + valid_keys
            vals = [visit_id, req.patient_id, req.voice_notes] + [filtered_answers.get(k) for k in valid_keys]
            
            update_clauses = ["patient_id = VALUES(patient_id)", "voice_notes = VALUES(voice_notes)"]
            for k in valid_keys:
                update_clauses.append(f"{k} = VALUES({k})")

            placeholders = ", ".join(["%s"] * len(cols))
            update_str = ", ".join(update_clauses)
            
            upsert_query = f"""
                INSERT INTO intake_questionnaires ({", ".join(cols)})
                VALUES ({placeholders})
                ON DUPLICATE KEY UPDATE {update_str};
            """
            cur.execute(upsert_query, vals)

            # 4. Fetch the saved record
            cur.execute("SELECT id, updated_at, created_at FROM intake_questionnaires WHERE visit_id = %s;", (visit_id,))
            row = cur.fetchone()
            q_id = row["id"] if row else cur.lastrowid
            ts = (row["updated_at"] if row and row["updated_at"] else (row["created_at"] if row else datetime.now()))

            return {
                "message": "Intake questionnaire MCQ responses recorded successfully",
                "visit_id": visit_id,
                "questionnaire_id": q_id,
                "recorded_answers": filtered_answers,
                "updated_at": ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
            }
    except pymysql.MySQLError as err:
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")
    finally:
        conn.close()

@app.get("/api/visits/{visit_id}/questionnaire", tags=["Questionnaire"])
def get_visit_questionnaire(visit_id: int):
    """
    FEAT-02: Returns saved clinical intake MCQ questionnaire responses (q1..q20)
    and voice notes for physician consultation review.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # 1. Verify visit encounter exists
            cur.execute("SELECT id, patient_id FROM visits WHERE id = %s;", (visit_id,))
            visit = cur.fetchone()
            if not visit:
                raise HTTPException(status_code=404, detail=f"Visit encounter with ID {visit_id} not found.")

            # 2. Query intake_questionnaires
            cur.execute("SELECT * FROM intake_questionnaires WHERE visit_id = %s;", (visit_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(
                    status_code=404, 
                    detail=f"No questionnaire responses recorded for visit encounter {visit_id}."
                )

            # 3. Extract non-null question responses
            answers = {}
            for i in range(1, 21):
                key = f"q{i}"
                if row.get(key) is not None:
                    answers[key] = row[key]

            ts = row["updated_at"] or row["created_at"]
            return {
                "visit_id": row["visit_id"],
                "patient_id": row["patient_id"],
                "questionnaire_id": row["id"],
                "answers": answers,
                "voice_notes": row["voice_notes"],
                "recorded_at": ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
            }
    finally:
        conn.close()

# ============================================================================
# API ROUTES (FEATURE 3: EXTERNAL DIAGNOSTIC REPORTS ARCHIVAL)
# ============================================================================

@app.post("/api/visits/{visit_id}/reports/upload", tags=["External Reports"], status_code=status.HTTP_201_CREATED)
def upload_external_report(
    visit_id: int,
    file: UploadFile = File(..., description="Binary report file (DICOM, PDF, ECG image, etc.)"),
    report_type: str = Form(..., description="DICOM, ECG, LAB_PDF, XRAY, or OTHER"),
    modality: Optional[str] = Form(None, description="Modality or descriptive scan title (e.g. Brain MRI T2)"),
    findings_summary: Optional[str] = Form(None, description="Optional clinical impressions or extracted notes")
):
    """
    FEAT-03: Archives patient-provided external diagnostic reports (DICOM, 12-lead ECG traces, lab PDFs)
    and stores them on disk organized by visit encounter.
    """
    valid_types = {"DICOM", "ECG", "LAB_PDF", "XRAY", "OTHER"}
    normalized_type = report_type.strip().upper()
    if normalized_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid report_type '{report_type}'. Allowed types: {', '.join(sorted(valid_types))}"
        )

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # 1. Verify visit encounter exists
            cur.execute("SELECT id, patient_id FROM visits WHERE id = %s;", (visit_id,))
            visit = cur.fetchone()
            if not visit:
                raise HTTPException(status_code=404, detail=f"Visit encounter with ID {visit_id} not found.")
            patient_id = visit["patient_id"]

            # 2. Prepare directory: uploads/{visit_id}/
            visit_dir = os.path.join(UPLOAD_DIR, str(visit_id))
            os.makedirs(visit_dir, exist_ok=True)

            # 3. Sanitize filename & save file
            orig_name = os.path.basename(file.filename or "report.bin")
            timestamp = int(datetime.now().timestamp())
            clean_filename = f"{timestamp}_{orig_name.replace(' ', '_')}"
            dest_path = os.path.join(visit_dir, clean_filename)

            with open(dest_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            file_size_bytes = os.path.getsize(dest_path)
            file_size_mb = round(file_size_bytes / (1024.0 * 1024.0), 2)
            web_path = f"/uploads/{visit_id}/{clean_filename}"

            # 4. Insert into external_reports
            cur.execute("""
                INSERT INTO external_reports 
                (visit_id, patient_id, report_type, modality, file_path, file_size_mb, findings_summary)
                VALUES (%s, %s, %s, %s, %s, %s, %s);
            """, (
                visit_id,
                patient_id,
                normalized_type,
                modality.strip() if modality else None,
                web_path,
                file_size_mb,
                findings_summary.strip() if findings_summary else None
            ))
            report_id = cur.lastrowid

            return {
                "message": "External report uploaded successfully",
                "report_id": report_id,
                "visit_id": visit_id,
                "patient_id": patient_id,
                "file_name": orig_name,
                "report_type": normalized_type,
                "modality": modality,
                "file_size_bytes": file_size_bytes,
                "file_size_mb": file_size_mb,
                "file_path": web_path,
                "uploaded_at": datetime.now().isoformat()
            }
    except pymysql.MySQLError as err:
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")
    finally:
        conn.close()

@app.get("/api/visits/{visit_id}/reports", tags=["External Reports"])
def list_visit_reports(visit_id: int):
    """
    FEAT-03: Lists all external diagnostic reports archived for a visit encounter.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # 1. Verify visit encounter exists
            cur.execute("SELECT id, patient_id FROM visits WHERE id = %s;", (visit_id,))
            visit = cur.fetchone()
            if not visit:
                raise HTTPException(status_code=404, detail=f"Visit encounter with ID {visit_id} not found.")

            # 2. Query external reports
            cur.execute("""
                SELECT 
                    id, visit_id, patient_id, report_type, modality, 
                    file_path, file_size_mb, findings_summary, upload_date, created_at
                FROM external_reports
                WHERE visit_id = %s
                ORDER BY upload_date DESC;
            """, (visit_id,))
            reports = cur.fetchall()

            for r in reports:
                if r.get("upload_date") and hasattr(r["upload_date"], "isoformat"):
                    r["upload_date"] = r["upload_date"].isoformat()
                if r.get("created_at") and hasattr(r["created_at"], "isoformat"):
                    r["created_at"] = r["created_at"].isoformat()

            return {
                "visit_id": visit_id,
                "patient_id": visit["patient_id"],
                "count": len(reports),
                "reports": reports
            }
    finally:
        conn.close()

# ============================================================================
# API ROUTES (FEATURE 7: CLINICAL DECISION SUPPORT & DETERMINISTIC INSIGHTS)
# ============================================================================

def evaluate_cdss_for_visit(cur, visit_id: int) -> List[Dict[str, Any]]:
    """
    Evaluates 100% deterministic clinical safety rules against patient vital signs
    and persists generated flags into deterministic_insights table.
    """
    # 1. Fetch vital signs
    cur.execute("SELECT * FROM vital_signs WHERE visit_id = %s;", (visit_id,))
    vitals = cur.fetchone() or {}

    sys_bp = vitals.get("systolic_bp")
    dia_bp = vitals.get("diastolic_bp")
    pulse = vitals.get("pulse_rate")
    temp = vitals.get("temperature_f")
    spo2 = vitals.get("spo2_pct")
    resp = vitals.get("resp_rate")
    bmi = vitals.get("bmi")

    rules = []

    # Rule 1: Blood Pressure (AHA 2017)
    if sys_bp and dia_bp:
        if sys_bp >= 180 or dia_bp >= 120:
            rules.append({
                "rule_code": "RULE_HTN_CRISIS",
                "severity_level": "CRITICAL",
                "category": "VITALS",
                "title": "Hypertensive Crisis Alert",
                "description": f"Systolic BP {sys_bp} mmHg / Diastolic BP {dia_bp} mmHg exceeds emergency threshold (>= 180/120 mmHg).",
                "recommendation": "Initiate immediate IV antihypertensive protocol. Screen for acute organ damage (ECG, troponin, fundoscopy)."
            })
        elif sys_bp >= 140 or dia_bp >= 90:
            rules.append({
                "rule_code": "RULE_HTN_STAGE2",
                "severity_level": "WARNING",
                "category": "VITALS",
                "title": "Stage 2 Hypertension Flag",
                "description": f"BP {sys_bp}/{dia_bp} mmHg meets Stage 2 Hypertension criteria.",
                "recommendation": "Initiate dual-agent pharmacotherapy and lifestyle counseling. Schedule 2-week follow-up."
            })
        elif (130 <= sys_bp <= 139) or (80 <= dia_bp <= 89):
            rules.append({
                "rule_code": "RULE_HTN_STAGE1",
                "severity_level": "INFO",
                "category": "VITALS",
                "title": "Stage 1 Hypertension Observed",
                "description": f"BP {sys_bp}/{dia_bp} mmHg meets Stage 1 criteria.",
                "recommendation": "Recommend DASH dietary modifications, sodium reduction, and follow-up in 1 month."
            })

    # Rule 2: Hypoxemia & Respiratory
    if spo2 is not None:
        if spo2 < 90:
            rules.append({
                "rule_code": "RULE_HYPOXEMIA_CRITICAL",
                "severity_level": "CRITICAL",
                "category": "VITALS",
                "title": "Severe Hypoxemia Alert",
                "description": f"Oxygen saturation SpO2 {spo2}% is critically depressed (< 90%).",
                "recommendation": "Administer high-flow supplemental oxygen immediately. Assess airway and auscultate lung fields."
            })
        elif spo2 <= 94:
            rules.append({
                "rule_code": "RULE_HYPOXEMIA_MILD",
                "severity_level": "WARNING",
                "category": "VITALS",
                "title": "Moderate Hypoxemia Flag",
                "description": f"Oxygen saturation SpO2 {spo2}% is subnormal (90 - 94%).",
                "recommendation": "Monitor SpO2 continuously. Consider bronchodilator nebulization and chest radiograph."
            })

    if resp and resp > 24:
        rules.append({
            "rule_code": "RULE_TACHYPNEA",
            "severity_level": "WARNING",
            "category": "VITALS",
            "title": "Tachypnea Detected",
            "description": f"Respiratory rate {resp} bpm exceeds normal resting limits (> 24 bpm).",
            "recommendation": "Assess for acute dyspnea, metabolic acidosis compensation, or pulmonary embolism."
        })

    # Rule 3: Cardiac Rhythm
    if pulse is not None:
        if pulse > 100:
            rules.append({
                "rule_code": "RULE_TACHYCARDIA",
                "severity_level": "WARNING",
                "category": "VITALS",
                "title": "Sinus Tachycardia Detected",
                "description": f"Resting pulse rate {pulse} bpm exceeds 100 bpm.",
                "recommendation": "Check for fever, dehydration, anxiety, hyperthyroidism, or arrhythmias. Review 12-lead ECG."
            })
        elif pulse < 50:
            rules.append({
                "rule_code": "RULE_BRADYCARDIA",
                "severity_level": "WARNING",
                "category": "VITALS",
                "title": "Sinus Bradycardia Detected",
                "description": f"Resting pulse rate {pulse} bpm is below 50 bpm.",
                "recommendation": "Check for beta-blocker/calcium channel blocker usage, athletic baseline, or conduction blocks."
            })

    # Rule 4: Pyrexia / Fever
    if temp is not None:
        if temp >= 101.5:
            rules.append({
                "rule_code": "RULE_PYREXIA_HIGH",
                "severity_level": "WARNING",
                "category": "VITALS",
                "title": "High-Grade Pyrexia Flag",
                "description": f"Body temperature {temp}°F is elevated (>= 101.5°F).",
                "recommendation": "Order antipyretic therapy (Paracetamol), hydration, and complete blood count / infectious workup."
            })
        elif temp >= 99.5:
            rules.append({
                "rule_code": "RULE_PYREXIA_LOW",
                "severity_level": "INFO",
                "category": "VITALS",
                "title": "Low-Grade Fever Observed",
                "description": f"Body temperature {temp}°F is mildly elevated (99.5 - 101.4°F).",
                "recommendation": "Monitor temperature trajectory. Screen for upper respiratory or viral prodrome."
            })

    # Rule 5: BMI & Obesity
    if bmi and float(bmi) >= 30.0:
        rules.append({
            "rule_code": "RULE_OBESITY_CLASS",
            "severity_level": "INFO",
            "category": "GUIDELINE",
            "title": "Class 1+ Obesity Status",
            "description": f"Patient BMI {bmi} kg/m² exceeds 30.0 kg/m² threshold.",
            "recommendation": "Consider screening for metabolic syndrome, lipid profile, and HbA1c testing."
        })

    # 2. Persist rules into deterministic_insights
    cur.execute("SELECT rule_code, is_reviewed, is_signed, doctor_override_notes FROM deterministic_insights WHERE visit_id = %s;", (visit_id,))
    existing_map = {row["rule_code"]: row for row in cur.fetchall()}

    active_rule_codes = {r["rule_code"] for r in rules}

    # Delete rules that no longer apply
    if existing_map:
        for old_code in existing_map:
            if old_code not in active_rule_codes:
                cur.execute("DELETE FROM deterministic_insights WHERE visit_id = %s AND rule_code = %s;", (visit_id, old_code))

    # Insert or update active rules
    for r in rules:
        code = r["rule_code"]
        if code in existing_map:
            cur.execute("""
                UPDATE deterministic_insights
                SET severity_level = %s, title = %s, description = %s, recommendation = %s
                WHERE visit_id = %s AND rule_code = %s;
            """, (r["severity_level"], r["title"], r["description"], r["recommendation"], visit_id, code))
        else:
            cur.execute("""
                INSERT INTO deterministic_insights
                (visit_id, rule_code, severity_level, category, title, description, recommendation)
                VALUES (%s, %s, %s, %s, %s, %s, %s);
            """, (visit_id, code, r["severity_level"], r["category"], r["title"], r["description"], r["recommendation"]))

    # 3. Return refreshed insights
    cur.execute("""
        SELECT id, visit_id, rule_code, severity_level, category, title, description, recommendation,
               is_reviewed, is_signed, doctor_override_notes, created_at
        FROM deterministic_insights
        WHERE visit_id = %s
        ORDER BY FIELD(severity_level, 'CRITICAL', 'WARNING', 'INFO'), id ASC;
    """, (visit_id,))
    rows = cur.fetchall()
    for r in rows:
        if r.get("created_at") and hasattr(r["created_at"], "isoformat"):
            r["created_at"] = r["created_at"].isoformat()
    return rows

@app.post("/api/doctor/visits/{visit_id}/insights", tags=["Doctor Clinical CDSS"])
def trigger_doctor_insights(visit_id: int):
    """
    FEAT-07: Evaluates deterministic clinical decision support rules for the active encounter.
    Generates actionable severity flags (CRITICAL, WARNING, INFO) with clinical guidance.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM visits WHERE id = %s;", (visit_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail=f"Visit encounter with ID {visit_id} not found.")

            insights = evaluate_cdss_for_visit(cur, visit_id)
            has_critical = any(i["severity_level"] == "CRITICAL" for i in insights)

            return {
                "visit_id": visit_id,
                "insights_count": len(insights),
                "has_critical": has_critical,
                "insights": insights
            }
    except pymysql.MySQLError as err:
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")
    finally:
        conn.close()

@app.get("/api/doctor/visits/{visit_id}/insights", tags=["Doctor Clinical CDSS"])
def get_doctor_insights(visit_id: int):
    """
    FEAT-07: Retrieves evaluated clinical safety alerts for an encounter.
    Evaluates automatically if none have been evaluated yet.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM visits WHERE id = %s;", (visit_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail=f"Visit encounter with ID {visit_id} not found.")

            cur.execute("""
                SELECT id, visit_id, rule_code, severity_level, category, title, description, recommendation,
                       is_reviewed, is_signed, doctor_override_notes, created_at
                FROM deterministic_insights
                WHERE visit_id = %s
                ORDER BY FIELD(severity_level, 'CRITICAL', 'WARNING', 'INFO'), id ASC;
            """, (visit_id,))
            insights = cur.fetchall()

            if not insights:
                insights = evaluate_cdss_for_visit(cur, visit_id)
            else:
                for r in insights:
                    if r.get("created_at") and hasattr(r["created_at"], "isoformat"):
                        r["created_at"] = r["created_at"].isoformat()

            has_critical = any(i["severity_level"] == "CRITICAL" for i in insights)

            return {
                "visit_id": visit_id,
                "insights_count": len(insights),
                "has_critical": has_critical,
                "insights": insights
            }
    finally:
        conn.close()

@app.patch("/api/doctor/insights/{insight_id}", tags=["Doctor Clinical CDSS"])
def review_doctor_insight(insight_id: int, req: InsightReviewRequest):
    """
    FEAT-07: Allows physician to mark a safety insight as reviewed or attach override notes.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, visit_id, rule_code, severity_level FROM deterministic_insights WHERE id = %s;", (insight_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail=f"Insight flag with ID {insight_id} not found.")

            cur.execute("""
                UPDATE deterministic_insights
                SET is_reviewed = %s, doctor_override_notes = %s
                WHERE id = %s;
            """, (
                1 if req.is_reviewed else 0,
                req.doctor_override_notes.strip() if req.doctor_override_notes else None,
                insight_id
            ))

            return {
                "message": "Clinical insight review status updated",
                "insight_id": insight_id,
                "is_reviewed": bool(req.is_reviewed),
                "doctor_override_notes": req.doctor_override_notes
            }
    finally:
        conn.close()

# ============================================================================
# API ROUTES (FEATURE 8 / PR-BE-05: DOCTOR ENCOUNTER SIGN-OFF & TRANSITION)
# ============================================================================

@app.get("/api/doctor/queue", tags=["Doctor Consultation"])
def get_doctor_queue(doctor_id: Optional[int] = Query(None, description="Filter queue by attending doctor ID")):
    """
    FEAT-04 / 5.1: Returns waiting patients in OPD queue (TRIAGED or IN_CONSULTATION),
    prioritized by active consultation state and arrival token.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            doctor_name = "All Physicians"
            if doctor_id:
                cur.execute("SELECT full_name FROM users WHERE id = %s;", (doctor_id,))
                doc = cur.fetchone()
                if doc:
                    doctor_name = doc["full_name"]

            query = """
                SELECT 
                    v.id AS visit_id,
                    v.queue_token,
                    v.patient_id,
                    p.uhid,
                    CONCAT(p.first_name, ' ', p.last_name) AS full_name,
                    TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age,
                    p.gender,
                    v.chief_complaint,
                    v.status,
                    v.visit_date,
                    v.created_at,
                    vs.systolic_bp,
                    vs.diastolic_bp,
                    vs.bp_stage,
                    vs.pulse_rate,
                    vs.spo2_pct,
                    vs.temperature_f,
                    vs.bmi
                FROM visits v
                JOIN patients p ON p.id = v.patient_id
                LEFT JOIN vital_signs vs ON vs.visit_id = v.id
                WHERE v.status IN ('TRIAGED', 'IN_CONSULTATION')
            """
            params = []
            if doctor_id:
                query += " AND v.doctor_id = %s"
                params.append(doctor_id)

            query += """
                ORDER BY 
                    FIELD(v.status, 'IN_CONSULTATION', 'TRIAGED'),
                    v.id ASC;
            """
            cur.execute(query, tuple(params))
            rows = cur.fetchall()

            queue_items = []
            for r in rows:
                bp_str = f"{r['systolic_bp']}/{r['diastolic_bp']}" if (r.get("systolic_bp") and r.get("diastolic_bp")) else None
                triage_summary = {
                    "bp": bp_str,
                    "bp_stage": r.get("bp_stage"),
                    "pulse": r.get("pulse_rate"),
                    "spo2": r.get("spo2_pct"),
                    "temperature_f": float(r["temperature_f"]) if r.get("temperature_f") is not None else None,
                    "bmi": float(r["bmi"]) if r.get("bmi") is not None else None
                }
                visit_date_val = r["visit_date"].isoformat() if hasattr(r.get("visit_date"), "isoformat") else str(r.get("visit_date"))
                queue_items.append({
                    "visit_id": r["visit_id"],
                    "queue_token": r["queue_token"],
                    "patient_id": r["patient_id"],
                    "uhid": r["uhid"],
                    "full_name": r["full_name"],
                    "age": r["age"],
                    "gender": r["gender"],
                    "chief_complaint": r["chief_complaint"],
                    "status": r["status"],
                    "visit_date": visit_date_val,
                    "triage_summary": triage_summary
                })

            return {
                "doctor_id": doctor_id,
                "doctor_name": doctor_name,
                "waiting_count": len(queue_items),
                "queue": queue_items
            }
    finally:
        conn.close()

@app.post("/api/doctor/queue/{visit_id}/call", tags=["Doctor Consultation"])
def call_patient_to_consultation(visit_id: int):
    """
    FEAT-04 / 5.2: Transitions visit status from TRIAGED to IN_CONSULTATION when doctor calls the patient.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, status FROM visits WHERE id = %s;", (visit_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail=f"Visit encounter with ID {visit_id} not found.")

            if row["status"] in ("READY_FOR_BILLING", "COMPLETED", "CANCELLED"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot call patient into consultation. Encounter is already in '{row['status']}' state."
                )

            if row["status"] != "IN_CONSULTATION":
                cur.execute("UPDATE visits SET status = 'IN_CONSULTATION' WHERE id = %s;", (visit_id,))

            return {
                "message": "Patient called into consultation room",
                "visit_id": visit_id,
                "status": "IN_CONSULTATION",
                "consultation_started_at": datetime.now().isoformat()
            }
    finally:
        conn.close()

@app.post("/api/doctor/visits/{visit_id}/sign-off", tags=["Doctor Consultation"])
def sign_off_doctor_encounter(visit_id: int, req: DoctorSignOffRequest):
    """
    FEAT-08 / PR-BE-05: Submits the clinical conclusion notes, enforces required doctor override notes
    if unreviewed CRITICAL CDSS safety alerts are active, digitally signs all encounter insights,
    records attending physician ID & timestamp, and transitions status to READY_FOR_BILLING.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # 1. Verify visit encounter
            cur.execute("SELECT id, patient_id, doctor_id, status, conclusion_signed_at FROM visits WHERE id = %s;", (visit_id,))
            visit = cur.fetchone()
            if not visit:
                raise HTTPException(status_code=404, detail=f"Visit encounter with ID {visit_id} not found.")

            current_status = visit["status"]
            if current_status in ("READY_FOR_BILLING", "COMPLETED"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Encounter is already signed off and locked (Status: {current_status})."
                )
            if current_status == "CANCELLED":
                raise HTTPException(status_code=400, detail="Cannot sign off a cancelled encounter.")

            # 2. Validate conclusion notes
            notes = req.conclusion_notes.strip()
            if len(notes) < 3:
                raise HTTPException(status_code=422, detail="Conclusion clinical notes are required to sign off encounter.")

            final_notes = notes
            if req.diagnosis and req.diagnosis.strip():
                final_notes = f"Diagnosis: {req.diagnosis.strip()}\n\nClinical Notes: {notes}"

            # 3. Verify attending doctor
            attending_doctor_id = req.doctor_id or visit["doctor_id"]
            if req.doctor_id:
                cur.execute("SELECT id FROM users WHERE id = %s;", (req.doctor_id,))
                if not cur.fetchone():
                    raise HTTPException(status_code=404, detail=f"Attending physician with ID {req.doctor_id} not found.")

            # 4. Check CDSS deterministic safety alerts
            cur.execute("""
                SELECT id, rule_code, severity_level, title, is_reviewed, doctor_override_notes
                FROM deterministic_insights
                WHERE visit_id = %s;
            """, (visit_id,))
            insights = cur.fetchall()

            # If no insights were evaluated yet, evaluate them automatically to prevent safety bypass
            if not insights:
                insights = evaluate_cdss_for_visit(cur, visit_id)

            critical_alerts = [i for i in insights if i.get("severity_level") == "CRITICAL"]
            unreviewed_critical = [
                i for i in critical_alerts 
                if not i.get("is_reviewed") and not (i.get("doctor_override_notes") and str(i.get("doctor_override_notes")).strip())
            ]

            override_text = (req.doctor_override_notes or req.override_reasons or "").strip()

            if unreviewed_critical:
                if not override_text:
                    alert_names = ", ".join([f"[{a['rule_code']}] {a['title']}" for a in unreviewed_critical])
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            f"Sign-off blocked: Unreviewed CRITICAL safety alert(s) detected: {alert_names}. "
                            "You must supply 'doctor_override_notes' justifying clinical override before finalizing."
                        )
                    )
                else:
                    # Apply override notes and mark reviewed
                    cur.execute("""
                        UPDATE deterministic_insights
                        SET is_reviewed = 1,
                            doctor_override_notes = %s
                        WHERE visit_id = %s 
                          AND severity_level = 'CRITICAL' 
                          AND (is_reviewed = 0 OR doctor_override_notes IS NULL OR doctor_override_notes = '');
                    """, (override_text, visit_id))

            # Mark all active insights as digitally signed
            cur.execute("""
                UPDATE deterministic_insights
                SET is_signed = 1
                WHERE visit_id = %s;
            """, (visit_id,))

            # 5. Lock and transition encounter to READY_FOR_BILLING
            now_dt = datetime.now()
            cur.execute("""
                UPDATE visits
                SET status = 'READY_FOR_BILLING',
                    conclusion_notes = %s,
                    conclusion_signed_at = %s,
                    doctor_id = %s
                WHERE id = %s;
            """, (final_notes, now_dt, attending_doctor_id, visit_id))

            return {
                "message": "Consultation signed off and locked successfully",
                "visit_id": visit_id,
                "status": "READY_FOR_BILLING",
                "doctor_id": attending_doctor_id,
                "conclusion_notes": final_notes,
                "signed_at": now_dt.isoformat(),
                "next_station": "CASHIER_BILLING_DESK",
                "critical_alerts_count": len(critical_alerts),
                "critical_alerts_overridden": len(unreviewed_critical) if override_text else 0
            }
    except HTTPException:
        raise
    except pymysql.MySQLError as err:
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")
    finally:
        conn.close()

# ============================================================================
# API ROUTES (FEATURE 8 / PR-BE-07: FORMULARY SEARCH & E-PRESCRIPTIONS)
# ============================================================================

@app.get("/api/drugs/formulary", tags=["Formulary & E-Prescriptions"])
def search_drug_formulary(
    q: Optional[str] = Query(None, description="Search term for drug brand or generic molecule name"),
    dosage_form: Optional[str] = Query(None, description="Filter by preparation form: TABLET, CAPSULE, SYRUP, etc."),
    limit: int = Query(50, ge=1, le=200, description="Max search results to return")
):
    """
    FEAT-08: Autocomplete lookup from approved clinic medication formulary.
    Zero-heavy overhead query with substring index matching.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            query = """
                SELECT id, brand_name, generic_name, dosage_form, strength, standard_dosage, contraindications, is_active
                FROM drug_formulary
                WHERE is_active = 1
            """
            params = []
            if q and q.strip():
                clean_q = f"%{q.strip()}%"
                query += " AND (brand_name LIKE %s OR generic_name LIKE %s)"
                params.extend([clean_q, clean_q])
            if dosage_form and dosage_form.strip():
                query += " AND dosage_form = %s"
                params.append(dosage_form.strip().upper())

            query += " ORDER BY brand_name ASC LIMIT %s;"
            params.append(limit)

            cur.execute(query, tuple(params))
            drugs = cur.fetchall()

            return {
                "query": q,
                "dosage_form": dosage_form,
                "count": len(drugs),
                "drugs": drugs
            }
    finally:
        conn.close()

@app.post("/api/doctor/visits/{visit_id}/prescriptions", tags=["Formulary & E-Prescriptions"], status_code=status.HTTP_201_CREATED)
def create_visit_prescription(visit_id: int, req: PrescriptionCreateRequest):
    """
    FEAT-08: Creates or updates an e-prescription encounter record with line items from drug_formulary.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # 1. Verify visit exists
            cur.execute("SELECT id, patient_id, doctor_id, status FROM visits WHERE id = %s;", (visit_id,))
            visit = cur.fetchone()
            if not visit:
                raise HTTPException(status_code=404, detail=f"Visit encounter with ID {visit_id} not found.")

            if visit["status"] == "CANCELLED":
                raise HTTPException(status_code=400, detail="Cannot author prescription for a cancelled visit encounter.")

            attending_doctor_id = req.doctor_id or visit["doctor_id"]

            # 2. Check and upsert prescription record
            cur.execute("SELECT id, status FROM prescriptions WHERE visit_id = %s;", (visit_id,))
            existing_rx = cur.fetchone()

            rx_status = (req.status or "FINALIZED").upper()
            if rx_status not in ("DRAFT", "FINALIZED", "DISPENSED", "CANCELLED"):
                rx_status = "FINALIZED"

            if existing_rx:
                rx_id = existing_rx["id"]
                cur.execute("""
                    UPDATE prescriptions 
                    SET doctor_id = %s, general_instructions = %s, status = %s, updated_at = NOW()
                    WHERE id = %s;
                """, (attending_doctor_id, req.general_instructions, rx_status, rx_id))
                # Remove existing line items for clean replacement
                cur.execute("DELETE FROM prescription_items WHERE prescription_id = %s;", (rx_id,))
            else:
                cur.execute("""
                    INSERT INTO prescriptions (visit_id, doctor_id, general_instructions, status)
                    VALUES (%s, %s, %s, %s);
                """, (visit_id, attending_doctor_id, req.general_instructions, rx_status))
                rx_id = cur.lastrowid

            # 3. Insert prescription line items
            persisted_items = []
            for item in req.items:
                cur.execute("SELECT id, brand_name, generic_name, dosage_form, strength FROM drug_formulary WHERE id = %s;", (item.drug_id,))
                drug = cur.fetchone()
                if not drug:
                    raise HTTPException(status_code=404, detail=f"Drug with ID {item.drug_id} does not exist in formulary master.")

                spec_instr = item.special_instructions or item.instructions
                cur.execute("""
                    INSERT INTO prescription_items 
                    (prescription_id, drug_id, dosage, frequency, duration_days, meal_timing, special_instructions)
                    VALUES (%s, %s, %s, %s, %s, %s, %s);
                """, (
                    rx_id,
                    item.drug_id,
                    item.dosage or "1 tab",
                    item.frequency or "1-0-1",
                    item.duration_days or 5,
                    item.meal_timing or "AFTER_MEALS",
                    spec_instr
                ))
                persisted_items.append({
                    "item_id": cur.lastrowid,
                    "drug_id": item.drug_id,
                    "brand_name": drug["brand_name"],
                    "generic_name": drug["generic_name"],
                    "dosage_form": drug["dosage_form"],
                    "strength": drug["strength"],
                    "dosage": item.dosage or "1 tab",
                    "frequency": item.frequency or "1-0-1",
                    "duration_days": item.duration_days or 5,
                    "meal_timing": item.meal_timing or "AFTER_MEALS",
                    "special_instructions": spec_instr
                })

            return {
                "message": "E-Prescription saved successfully",
                "prescription_id": rx_id,
                "visit_id": visit_id,
                "doctor_id": attending_doctor_id,
                "status": rx_status,
                "general_instructions": req.general_instructions,
                "items_count": len(persisted_items),
                "items": persisted_items
            }
    except HTTPException:
        raise
    except pymysql.MySQLError as err:
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")
    finally:
        conn.close()

@app.get("/api/doctor/visits/{visit_id}/prescriptions", tags=["Formulary & E-Prescriptions"])
def get_visit_prescription(visit_id: int):
    """
    FEAT-08: Fetches the e-prescription for a visit encounter with joined formulary medication details.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT p.id, p.visit_id, p.doctor_id, u.full_name AS doctor_name, 
                       p.issue_date, p.general_instructions, p.status, p.created_at, p.updated_at
                FROM prescriptions p
                LEFT JOIN users u ON u.id = p.doctor_id
                WHERE p.visit_id = %s;
            """, (visit_id,))
            rx = cur.fetchone()
            if not rx:
                return {
                    "visit_id": visit_id,
                    "prescription": None,
                    "items": []
                }

            cur.execute("""
                SELECT pi.id AS item_id, pi.drug_id, df.brand_name, df.generic_name, 
                       df.dosage_form, df.strength, pi.dosage, pi.frequency, 
                       pi.duration_days, pi.meal_timing, pi.special_instructions, pi.created_at
                FROM prescription_items pi
                JOIN drug_formulary df ON df.id = pi.drug_id
                WHERE pi.prescription_id = %s
                ORDER BY pi.id ASC;
            """, (rx["id"],))
            items = cur.fetchall()

            if rx.get("issue_date") and hasattr(rx["issue_date"], "isoformat"):
                rx["issue_date"] = rx["issue_date"].isoformat()
            if rx.get("created_at") and hasattr(rx["created_at"], "isoformat"):
                rx["created_at"] = rx["created_at"].isoformat()
            if rx.get("updated_at") and hasattr(rx["updated_at"], "isoformat"):
                rx["updated_at"] = rx["updated_at"].isoformat()

            for item in items:
                if item.get("created_at") and hasattr(item["created_at"], "isoformat"):
                    item["created_at"] = item["created_at"].isoformat()

            return {
                "visit_id": visit_id,
                "prescription": rx,
                "items_count": len(items),
                "items": items
            }
    finally:
        conn.close()





