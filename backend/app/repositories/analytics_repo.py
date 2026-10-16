from typing import List, Dict, Any
from app.core.database import get_connection

class AnalyticsRepository:
    @staticmethod
    def get_dashboard_summary() -> Dict[str, Any]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) AS total FROM patients;")
                total_patients = (cur.fetchone() or {}).get("total", 0)

                cur.execute("SELECT COUNT(*) AS total FROM visits;")
                total_visits = (cur.fetchone() or {}).get("total", 0)

                cur.execute("SELECT COUNT(*) AS cnt FROM visits WHERE DATE(visit_date) = CURDATE();")
                today_footfall = (cur.fetchone() or {}).get("cnt", 0)

                cur.execute("SELECT COUNT(*) AS cnt FROM visits WHERE status = 'COMPLETED';")
                completed_count = (cur.fetchone() or {}).get("cnt", 0)

                cur.execute("SELECT COUNT(*) AS cnt FROM visits WHERE status = 'READY_FOR_BILLING';")
                ready_billing_count = (cur.fetchone() or {}).get("cnt", 0)

                cur.execute("SELECT COUNT(*) AS cnt FROM visits WHERE status = 'IN_CONSULTATION';")
                in_consult_count = (cur.fetchone() or {}).get("cnt", 0)

                return {
                    "total_patients": total_patients,
                    "total_visits": total_visits,
                    "today_footfall": today_footfall,
                    "completed_consultations": completed_count,
                    "ready_for_billing": ready_billing_count,
                    "in_consultation": in_consult_count
                }
        finally:
            conn.close()

    @staticmethod
    def get_revenue_breakdown() -> Dict[str, Any]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT payment_mode, COALESCE(SUM(amount_paid), 0.0) AS total_amount
                    FROM payments
                    WHERE payment_status = 'SUCCESS'
                    GROUP BY payment_mode;
                """)
                rev_rows = cur.fetchall()
                revenue_by_mode = {
                    "CASH": 0.0,
                    "UPI": 0.0,
                    "CARD": 0.0,
                    "NETBANKING": 0.0,
                    "INSURANCE_DIRECT": 0.0
                }
                gross_revenue = 0.0
                for r in rev_rows:
                    mode = r["payment_mode"]
                    val = float(r["total_amount"])
                    revenue_by_mode[mode] = val
                    gross_revenue += val

                return {
                    "revenue_by_mode": revenue_by_mode,
                    "gross_revenue": round(gross_revenue, 2)
                }
        finally:
            conn.close()

    @staticmethod
    def get_doctor_workload() -> List[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        u.id AS doctor_id, 
                        u.full_name AS doctor_name, 
                        u.email,
                        COUNT(v.id) AS patients_seen
                    FROM users u
                    LEFT JOIN visits v ON v.doctor_id = u.id AND v.status IN ('READY_FOR_BILLING', 'COMPLETED')
                    WHERE u.role = 'DOCTOR' AND u.is_active = 1
                    GROUP BY u.id, u.full_name, u.email
                    ORDER BY patients_seen DESC, u.full_name ASC;
                """)
                doctors = cur.fetchall()
                return [
                    {
                        "doctor_id": d["doctor_id"],
                        "doctor_name": d["doctor_name"],
                        "email": d.get("email"),
                        "patients_seen": d["patients_seen"]
                    }
                    for d in doctors
                ]
        finally:
            conn.close()

    @staticmethod
    def get_recent_activity(limit: int = 5) -> List[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        v.id AS visit_id,
                        v.queue_token,
                        v.status,
                        v.visit_date,
                        p.uhid,
                        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
                        u.full_name AS doctor_name
                    FROM visits v
                    JOIN patients p ON p.id = v.patient_id
                    LEFT JOIN users u ON u.id = v.doctor_id
                    ORDER BY v.id DESC
                    LIMIT %s;
                """, (limit,))
                recent_rows = cur.fetchall()
                result = []
                for row in recent_rows:
                    visit_dt = row["visit_date"].isoformat() if row.get("visit_date") and hasattr(row["visit_date"], "isoformat") else str(row.get("visit_date") or "")
                    result.append({
                        "visit_id": row["visit_id"],
                        "queue_token": row["queue_token"],
                        "uhid": row["uhid"],
                        "patient_name": row["patient_name"],
                        "doctor_name": row["doctor_name"] or "Assigned Physician",
                        "status": row["status"],
                        "visit_date": visit_dt
                    })
                return result
        finally:
            conn.close()

    @staticmethod
    def get_bp_breakdown() -> List[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        COALESCE(bp_stage, 'Normal Blood Pressure') AS stage,
                        COUNT(*) AS count
                    FROM vital_signs
                    GROUP BY stage;
                """)
                return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def get_bmi_breakdown() -> List[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        COALESCE(bmi_category, 'Normal Weight') AS category,
                        COUNT(*) AS count
                    FROM vital_signs
                    GROUP BY category;
                """)
                return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def get_recent_patients_triage(limit: int = 5) -> List[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
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
                    LIMIT %s;
                """, (limit,))
                return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def get_avg_throughput_minutes() -> float:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT AVG(TIMESTAMPDIFF(MINUTE, visit_date, conclusion_signed_at)) AS avg_mins
                    FROM visits
                    WHERE status IN ('READY_FOR_BILLING', 'COMPLETED')
                      AND conclusion_signed_at IS NOT NULL
                      AND conclusion_signed_at >= visit_date;
                """)
                row = cur.fetchone()
                val = row.get("avg_mins") if row else None
                return round(float(val), 1) if val is not None else 0.0
        finally:
            conn.close()
