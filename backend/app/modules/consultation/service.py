import uuid
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from sqlalchemy import text
from fastapi import HTTPException, status

from app.core.database import engine
from app.modules.consultation.schemas import ConsultationDraftRequest

class ConsultationService:
    @classmethod
    def save_draft(
        cls,
        req: ConsultationDraftRequest,
        hospital_id: int = 1,
        user_id: int = 1,
        user_role: str = "DOCTOR"
    ) -> Dict[str, Any]:
        """
        Creates or autosaves an in-progress SOAP clinical consultation note and attaches
        ICD-10 India diagnostic codes. Updates visit queue status to IN_CONSULTATION.
        """
        with engine.begin() as conn:
            # 1. Resolve OPD Visit & Patient
            visit = conn.execute(text("""
                SELECT v.id, v.public_id, v.opd_number, v.patient_id, v.doctor_id,
                       p.uhid, p.first_name, p.middle_name, p.last_name,
                       u.full_name as doctor_name, dp.public_id as doctor_uuid
                FROM opd_visits v
                JOIN patients p ON v.patient_id = p.id
                JOIN doctor_profiles dp ON v.doctor_id = dp.id
                JOIN users u ON dp.user_id = u.id
                WHERE v.public_id = :vid AND v.hospital_id = :hid
                LIMIT 1
            """), {"vid": req.opd_visit_uuid, "hid": hospital_id}).mappings().first()

            if not visit:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="OPD Visit encounter not found.")

            # 2. Check for existing consultation
            existing = conn.execute(text("""
                SELECT id, public_id, status FROM consultations
                WHERE opd_visit_id = :vid AND hospital_id = :hid
                LIMIT 1
            """), {"vid": visit["id"], "hid": hospital_id}).mappings().first()

            if existing and existing["status"] == "SIGNED":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Consultation has already been digitally signed and locked."
                )

            follow_up_date_val = None
            if req.follow_up_date:
                try:
                    follow_up_date_val = datetime.strptime(req.follow_up_date, "%Y-%m-%d").date()
                except ValueError:
                    pass

            # 3. Create or Update Consultation Record
            if existing:
                consultation_id = existing["id"]
                public_id = existing["public_id"]
                conn.execute(text("""
                    UPDATE consultations SET
                        subjective = :subj,
                        objective = :obj,
                        assessment = :assess,
                        plan = :plan,
                        clinical_notes = :cnotes,
                        follow_up_date = :fudate,
                        follow_up_instructions = :fuinst,
                        referral_doctor_or_dept = :refdept,
                        updated_at = NOW()
                    WHERE id = :cid
                """), {
                    "cid": consultation_id,
                    "subj": req.subjective,
                    "obj": req.objective,
                    "assess": req.assessment,
                    "plan": req.plan,
                    "cnotes": req.clinical_notes,
                    "fudate": follow_up_date_val,
                    "fuinst": req.follow_up_instructions,
                    "refdept": req.referral_doctor_or_dept
                })
            else:
                public_id = str(uuid.uuid4())
                res_c = conn.execute(text("""
                    INSERT INTO consultations (
                        public_id, hospital_id, opd_visit_id, patient_id, doctor_id,
                        subjective, objective, assessment, plan, clinical_notes,
                        follow_up_date, follow_up_instructions, referral_doctor_or_dept,
                        status
                    ) VALUES (
                        :pid, :hid, :vid, :pat_id, :doc_id,
                        :subj, :obj, :assess, :plan, :cnotes,
                        :fudate, :fuinst, :refdept,
                        'IN_PROGRESS'
                    )
                """), {
                    "pid": public_id,
                    "hid": hospital_id,
                    "vid": visit["id"],
                    "pat_id": visit["patient_id"],
                    "doc_id": visit["doctor_id"],
                    "subj": req.subjective,
                    "obj": req.objective,
                    "assess": req.assessment,
                    "plan": req.plan,
                    "cnotes": req.clinical_notes,
                    "fudate": follow_up_date_val,
                    "fuinst": req.follow_up_instructions,
                    "refdept": req.referral_doctor_or_dept
                })
                consultation_id = res_c.lastrowid

                # Transition OPD Visit & Token to active consultation
                conn.execute(text("""
                    UPDATE opd_visits SET status = 'ENGAGED' WHERE id = :vid
                """), {"vid": visit["id"]})

                conn.execute(text("""
                    UPDATE queue_tokens SET
                        status = 'IN_CONSULTATION',
                        consultation_started_at = COALESCE(consultation_started_at, NOW())
                    WHERE opd_visit_id = :vid
                """), {"vid": visit["id"]})

            # 4. Synchronize Diagnoses if supplied
            if req.diagnoses is not None:
                conn.execute(text("""
                    DELETE FROM consultation_diagnoses WHERE consultation_id = :cid
                """), {"cid": consultation_id})

                for diag in req.diagnoses:
                    icd_row = conn.execute(text("""
                        SELECT id FROM icd10_codes WHERE code = :code LIMIT 1
                    """), {"code": diag.code.strip()}).mappings().first()
                    icd_id = icd_row["id"] if icd_row else None

                    conn.execute(text("""
                        INSERT INTO consultation_diagnoses (
                            consultation_id, icd10_code_id, diagnosis_code, diagnosis_name, diagnosis_type, is_primary
                        ) VALUES (
                            :cid, :icd_id, :code, :name, :dtype, :is_prim
                        )
                    """), {
                        "cid": consultation_id,
                        "icd_id": icd_id,
                        "code": diag.code.strip(),
                        "name": diag.name.strip(),
                        "dtype": diag.type,
                        "is_prim": 1 if diag.is_primary else 0
                    })

        return cls.get_consultation_by_id(consultation_id, hospital_id)

    @classmethod
    def get_consultation_by_id(cls, consultation_id: int, hospital_id: int = 1) -> Dict[str, Any]:
        """Retrieves and formats a consultation along with all diagnoses."""
        with engine.connect() as conn:
            c = conn.execute(text("""
                SELECT c.*, v.public_id as opd_visit_uuid, v.opd_number, p.uhid,
                       p.first_name, p.middle_name, p.last_name,
                       u.full_name as doctor_name, dp.public_id as doctor_uuid
                FROM consultations c
                JOIN opd_visits v ON c.opd_visit_id = v.id
                JOIN patients p ON c.patient_id = p.id
                JOIN doctor_profiles dp ON c.doctor_id = dp.id
                JOIN users u ON dp.user_id = u.id
                WHERE c.id = :cid AND c.hospital_id = :hid
            """), {"cid": consultation_id, "hid": hospital_id}).mappings().first()

            if not c:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultation note not found.")

            diag_rows = conn.execute(text("""
                SELECT id, diagnosis_code, diagnosis_name, diagnosis_type, is_primary
                FROM consultation_diagnoses
                WHERE consultation_id = :cid
                ORDER BY is_primary DESC, id ASC
            """), {"cid": consultation_id}).mappings().all()

            diagnoses = [{
                "id": d["id"],
                "diagnosis_code": d["diagnosis_code"],
                "diagnosis_name": d["diagnosis_name"],
                "diagnosis_type": d["diagnosis_type"],
                "is_primary": bool(d["is_primary"])
            } for d in diag_rows]

            fname = c["first_name"]
            mname = c["middle_name"]
            lname = c["last_name"]
            patient_full_name = f"{fname} {mname} {lname}".replace("  ", " ").strip() if mname else f"{fname} {lname}".strip()

            return {
                "public_id": c["public_id"],
                "opd_visit_uuid": c["opd_visit_uuid"],
                "opd_number": c["opd_number"],
                "uhid": c["uhid"],
                "patient_name": patient_full_name,
                "doctor_name": c["doctor_name"],
                "doctor_uuid": c["doctor_uuid"],
                "subjective": c["subjective"],
                "objective": c["objective"],
                "assessment": c["assessment"],
                "plan": c["plan"],
                "clinical_notes": c["clinical_notes"],
                "follow_up_date": c["follow_up_date"].isoformat() if hasattr(c["follow_up_date"], "isoformat") and c["follow_up_date"] else (str(c["follow_up_date"]) if c["follow_up_date"] else None),
                "follow_up_instructions": c["follow_up_instructions"],
                "referral_doctor_or_dept": c["referral_doctor_or_dept"],
                "status": c["status"],
                "signed_at": c["signed_at"].isoformat() if hasattr(c["signed_at"], "isoformat") and c["signed_at"] else (str(c["signed_at"]) if c["signed_at"] else None),
                "diagnoses": diagnoses,
                "created_at": c["created_at"].isoformat() if hasattr(c["created_at"], "isoformat") else str(c["created_at"]),
                "updated_at": c["updated_at"].isoformat() if hasattr(c["updated_at"], "isoformat") else str(c["updated_at"])
            }

    @classmethod
    def get_by_visit_uuid(cls, visit_uuid: str, hospital_id: int = 1) -> Dict[str, Any]:
        """Retrieves consultation note attached to an OPD visit encounter."""
        with engine.connect() as conn:
            c = conn.execute(text("""
                SELECT c.id FROM consultations c
                JOIN opd_visits v ON c.opd_visit_id = v.id
                WHERE v.public_id = :vid AND c.hospital_id = :hid
                LIMIT 1
            """), {"vid": visit_uuid, "hid": hospital_id}).mappings().first()

            if not c:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No consultation recorded for this visit.")

            return cls.get_consultation_by_id(c["id"], hospital_id)

    @classmethod
    def search_icd10(cls, q: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
        """Autocompletion search against bundled ICD-10 India diagnostic dataset."""
        with engine.connect() as conn:
            if not q or len(q.strip()) < 1:
                rows = conn.execute(text("""
                    SELECT code, description, chapter FROM icd10_codes
                    WHERE is_active = 1
                    ORDER BY code ASC
                    LIMIT :limit
                """), {"limit": limit}).mappings().all()
            else:
                term = f"%{q.strip()}%"
                rows = conn.execute(text("""
                    SELECT code, description, chapter FROM icd10_codes
                    WHERE is_active = 1 AND (code LIKE :q OR description LIKE :q)
                    ORDER BY CASE WHEN code LIKE :q THEN 1 ELSE 2 END, code ASC
                    LIMIT :limit
                """), {"q": term, "limit": limit}).mappings().all()

            return [{
                "code": r["code"],
                "description": r["description"],
                "chapter": r["chapter"]
            } for r in rows]

