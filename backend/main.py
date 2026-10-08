from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import date, datetime
import pymysql
import os
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
    limit: int = Query(50, ge=1, le=200)
):
    """Lists registered patients along with their latest visit encounter and triage vital signs."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
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
            if search:
                query += """
                    WHERE p.first_name LIKE %s 
                       OR p.last_name LIKE %s 
                       OR p.phone LIKE %s 
                       OR p.uhid LIKE %s
                """
                term = f"%{search.strip()}%"
                params.extend([term, term, term, term])
            
            query += " ORDER BY v.visit_date DESC, p.created_at DESC LIMIT %s;"
            params.append(limit)

            cur.execute(query, params)
            patients = cur.fetchall()

            return {
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
