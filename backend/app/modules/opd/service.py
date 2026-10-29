import uuid
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import text
from fastapi import HTTPException, status

from app.core.database import engine
from app.core.sequences import SequenceService
from app.modules.opd.schemas import OpdCheckInRequest

class OpdService:
    @classmethod
    def checkin_patient(
        cls,
        req: OpdCheckInRequest,
        hospital_id: int = 1,
        registered_by_id: int = 1
    ) -> Dict[str, Any]:
        """
        Registers an Outpatient Department encounter (OPD Visit) and allocates
        a doctor-specific daily monotonic queue token.
        """
        with engine.begin() as conn:
            # 1. Resolve Patient
            patient = None
            if req.patient_uuid:
                patient = conn.execute(text("""
                    SELECT id, public_id, uhid, first_name, middle_name, last_name, phone
                    FROM patients
                    WHERE public_id = :pid AND hospital_id = :hid AND deleted_at IS NULL
                    LIMIT 1
                """), {"pid": req.patient_uuid, "hid": hospital_id}).mappings().first()
            elif req.uhid:
                patient = conn.execute(text("""
                    SELECT id, public_id, uhid, first_name, middle_name, last_name, phone
                    FROM patients
                    WHERE uhid = :uhid AND hospital_id = :hid AND deleted_at IS NULL
                    LIMIT 1
                """), {"uhid": req.uhid.strip(), "hid": hospital_id}).mappings().first()

            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Patient not found with the provided identifier."
                )

            # 2. Resolve Doctor Profile
            doctor = None
            if req.doctor_uuid:
                doctor = conn.execute(text("""
                    SELECT dp.id, dp.public_id, u.full_name, dp.specialization, dp.assigned_room_number,
                           dp.default_consultation_fee, dp.follow_up_fee
                    FROM doctor_profiles dp
                    JOIN users u ON dp.user_id = u.id
                    WHERE dp.public_id = :did AND dp.hospital_id = :hid AND dp.is_available_for_opd = 1
                    LIMIT 1
                """), {"did": req.doctor_uuid, "hid": hospital_id}).mappings().first()
            else:
                doctor = conn.execute(text("""
                    SELECT dp.id, dp.public_id, u.full_name, dp.specialization, dp.assigned_room_number,
                           dp.default_consultation_fee, dp.follow_up_fee
                    FROM doctor_profiles dp
                    JOIN users u ON dp.user_id = u.id
                    WHERE dp.hospital_id = :hid AND dp.is_available_for_opd = 1
                    ORDER BY dp.id ASC
                    LIMIT 1
                """), {"hid": hospital_id}).mappings().first()

            if not doctor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No active doctor profile available for OPD consultation."
                )

            # 3. Determine Consultation Tariff & Department
            fee = float(doctor["follow_up_fee"] if req.visit_type == "FOLLOW_UP" else doctor["default_consultation_fee"])
            department = req.department.strip() if req.department else (doctor["specialization"] or "General Medicine")

            # 4. Generate Gapless OPD Number via Monotonic Sequence
            opd_number = SequenceService.get_next_sequence("OPD", hospital_id, conn=conn)
            visit_uuid = str(uuid.uuid4())
            today = date.today()

            # 5. Row-Lock & Generate Daily Monotonic Token for Doctor
            tok_res = conn.execute(text("""
                SELECT COALESCE(MAX(token_number), 0) + 1 AS next_token
                FROM queue_tokens
                WHERE doctor_id = :did AND token_date = :tdate
                FOR UPDATE
            """), {"did": doctor["id"], "tdate": today}).mappings().first()
            token_number = int(tok_res["next_token"])

            # 6. Calculate Estimated Wait Time
            queue_len = conn.execute(text("""
                SELECT COUNT(*) AS waiting_count
                FROM queue_tokens
                WHERE doctor_id = :did AND token_date = :tdate AND status IN ('WAITING', 'CALLED', 'IN_CONSULTATION')
            """), {"did": doctor["id"], "tdate": today}).scalar() or 0
            estimated_wait_minutes = int(queue_len * 15)

            # 7. Insert OPD Visit Record
            res_v = conn.execute(text("""
                INSERT INTO opd_visits (
                    public_id, hospital_id, opd_number, patient_id, doctor_id,
                    visit_date, visit_type, department, status, payment_status, registered_by
                ) VALUES (
                    :pid, :hid, :opd_num, :pat_id, :doc_id,
                    :vdate, :vtype, :dept, 'WAITING', 'PENDING', :reg_by
                )
            """), {
                "pid": visit_uuid,
                "hid": hospital_id,
                "opd_num": opd_number,
                "pat_id": patient["id"],
                "doc_id": doctor["id"],
                "vdate": today,
                "vtype": req.visit_type,
                "dept": department,
                "reg_by": registered_by_id
            })
            visit_id = res_v.lastrowid

            # 8. Insert Queue Token Record
            conn.execute(text("""
                INSERT INTO queue_tokens (
                    hospital_id, opd_visit_id, doctor_id, token_number, token_date, status
                ) VALUES (
                    :hid, :vid, :did, :tok_num, :tdate, 'WAITING'
                )
            """), {
                "hid": hospital_id,
                "vid": visit_id,
                "did": doctor["id"],
                "tok_num": token_number,
                "tdate": today
            })

            fname = patient["first_name"]
            mname = patient["middle_name"]
            lname = patient["last_name"]
            patient_full_name = f"{fname} {mname} {lname}".replace("  ", " ").strip() if mname else f"{fname} {lname}".strip()

            return {
                "visit_uuid": visit_uuid,
                "opd_number": opd_number,
                "uhid": patient["uhid"],
                "patient_name": patient_full_name,
                "doctor_name": doctor["full_name"],
                "doctor_uuid": doctor["public_id"],
                "department": department,
                "visit_type": req.visit_type,
                "token_number": token_number,
                "token_date": today.isoformat(),
                "token_status": "WAITING",
                "estimated_wait_minutes": estimated_wait_minutes,
                "consultation_fee": fee,
                "created_at": datetime.now().isoformat()
            }

    @classmethod
    def list_visits(
        cls,
        hospital_id: int = 1,
        visit_date: Optional[str] = None,
        doctor_uuid: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Lists active OPD encounters with attached queue tokens."""
        clauses = ["v.hospital_id = :hid"]
        params: Dict[str, Any] = {"hid": hospital_id}

        target_date = visit_date if visit_date else date.today().isoformat()
        clauses.append("v.visit_date = :vdate")
        params["vdate"] = target_date

        if doctor_uuid:
            clauses.append("dp.public_id = :duuid")
            params["duuid"] = doctor_uuid

        if status_filter:
            clauses.append("v.status = :status")
            params["status"] = status_filter

        where_sql = " AND ".join(clauses)

        with engine.connect() as conn:
            rows = conn.execute(text(f"""
                SELECT v.public_id as visit_uuid, v.opd_number, p.uhid,
                       p.first_name, p.middle_name, p.last_name, p.phone,
                       u.full_name as doctor_name, v.department, v.visit_type,
                       v.visit_date, qt.token_number, qt.status as token_status,
                       v.status as visit_status, v.created_at
                FROM opd_visits v
                JOIN patients p ON v.patient_id = p.id
                JOIN doctor_profiles dp ON v.doctor_id = dp.id
                JOIN users u ON dp.user_id = u.id
                LEFT JOIN queue_tokens qt ON qt.opd_visit_id = v.id
                WHERE {where_sql}
                ORDER BY qt.token_number ASC, v.id ASC
            """), params).mappings().all()

            results = []
            for r in rows:
                fname = r["first_name"]
                mname = r["middle_name"]
                lname = r["last_name"]
                full_name = f"{fname} {mname} {lname}".replace("  ", " ").strip() if mname else f"{fname} {lname}".strip()
                results.append({
                    "visit_uuid": r["visit_uuid"],
                    "opd_number": r["opd_number"],
                    "uhid": r["uhid"],
                    "patient_name": full_name,
                    "phone": r["phone"],
                    "doctor_name": r["doctor_name"],
                    "department": r["department"],
                    "visit_type": r["visit_type"],
                    "visit_date": r["visit_date"].isoformat() if hasattr(r["visit_date"], "isoformat") else str(r["visit_date"]),
                    "token_number": r["token_number"],
                    "token_status": r["token_status"],
                    "status": r["visit_status"],
                    "created_at": r["created_at"].isoformat() if hasattr(r["created_at"], "isoformat") else str(r["created_at"])
                })
            return results
