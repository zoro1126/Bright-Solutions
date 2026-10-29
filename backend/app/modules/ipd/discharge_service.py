"""
Inpatient Discharge Service (TASK-BE-6.1 & TASK-BE-6.4)
Handles structured clinical discharge summary creation, digital sign-off immutability,
and formal discharge workflow with bed release and billing reconciliation checks.
"""

from datetime import datetime
from decimal import Decimal
import json
from typing import Any, Dict, Optional
import uuid

from fastapi import HTTPException, status
from sqlalchemy import text

from app.core.database import engine
from app.modules.ipd.schemas import (
    DischargeSummaryCreate,
    DischargeSummaryResponse,
    FormalDischargeRequest,
    FormalDischargeResponse,
)


class DischargeService:
    """Service managing inpatient clinical discharge summaries and formal bed releases."""

    @classmethod
    def record_discharge_summary(
        cls,
        hospital_id: int,
        admission_uuid: str,
        doctor_user_id: int,
        payload: DischargeSummaryCreate,
    ) -> Dict[str, Any]:
        """
        Authors and digitally signs a structured discharge summary.
        Immutably locks the clinical summary with doctor digital sign-off timestamp.
        """
        with engine.begin() as conn:
            # 1. Fetch admission
            adm = conn.execute(
                text("""
                    SELECT a.id, a.public_id, a.ipd_number, a.status, a.patient_id, a.attending_doctor_id,
                           p.first_name AS pat_first, p.last_name AS pat_last
                    FROM ipd_admissions a
                    JOIN patients p ON a.patient_id = p.id
                    WHERE a.public_id = :uuid AND a.hospital_id = :hid
                """),
                {"uuid": admission_uuid, "hid": hospital_id},
            ).mappings().first()

            if not adm:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Inpatient admission with UUID '{admission_uuid}' not found.",
                )

            if adm["status"] != "ADMITTED":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot record discharge summary. Admission status is '{adm['status']}', expected 'ADMITTED'.",
                )

            # 2. Resolve doctor profile
            doc = conn.execute(
                text("""
                    SELECT dp.id, u.full_name
                    FROM doctor_profiles dp
                    JOIN users u ON dp.user_id = u.id
                    WHERE dp.user_id = :uid AND dp.hospital_id = :hid
                """),
                {"uid": doctor_user_id, "hid": hospital_id},
            ).mappings().first()

            doctor_profile_id = doc["id"] if doc else adm["attending_doctor_id"]
            if not doc:
                doc = conn.execute(
                    text("""
                        SELECT dp.id, u.full_name
                        FROM doctor_profiles dp
                        JOIN users u ON dp.user_id = u.id
                        WHERE dp.id = :did
                    """),
                    {"did": doctor_profile_id},
                ).mappings().first()

            doctor_name = f"Dr. {doc['full_name']}" if doc and doc.get("full_name") else "Attending Medical Officer"

            # 3. Check for existing signed summary (immutability check)
            existing = conn.execute(
                text("""
                    SELECT id, public_id, signed_at
                    FROM ipd_discharge_summaries
                    WHERE admission_id = :aid
                """),
                {"aid": adm["id"]},
            ).mappings().first()

            if existing and existing["signed_at"]:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Discharge summary has already been digitally signed and locked for this admission.",
                )

            summary_uuid = str(uuid.uuid4())
            now = datetime.now()
            vitals_json = json.dumps(payload.discharge_vitals) if payload.discharge_vitals else None
            meds_json = json.dumps(payload.discharge_medications) if payload.discharge_medications else None

            if existing:
                conn.execute(
                    text("""
                        UPDATE ipd_discharge_summaries
                        SET doctor_id = :did,
                            final_diagnosis = :diag,
                            hospital_course = :course,
                            procedures_performed = :proc,
                            condition_at_discharge = :cond,
                            discharge_vitals_json = :vitals,
                            discharge_medications_json = :meds,
                            follow_up_instructions = :followup,
                            emergency_warning_signs = :warn,
                            signed_at = :signed_at,
                            updated_at = :now
                        WHERE id = :sid
                    """),
                    {
                        "sid": existing["id"],
                        "did": doctor_profile_id,
                        "diag": payload.final_diagnosis,
                        "course": payload.hospital_course,
                        "proc": payload.procedures_performed,
                        "cond": payload.condition_at_discharge,
                        "vitals": vitals_json,
                        "meds": meds_json,
                        "followup": payload.follow_up_instructions,
                        "warn": payload.emergency_warning_signs,
                        "signed_at": now,
                        "now": now,
                    },
                )
                summary_uuid = existing["public_id"]
            else:
                conn.execute(
                    text("""
                        INSERT INTO ipd_discharge_summaries (
                            public_id, hospital_id, admission_id, doctor_id,
                            final_diagnosis, hospital_course, procedures_performed,
                            condition_at_discharge, discharge_vitals_json, discharge_medications_json,
                            follow_up_instructions, emergency_warning_signs,
                            signed_at, created_at, updated_at
                        ) VALUES (
                            :uuid, :hid, :aid, :did,
                            :diag, :course, :proc,
                            :cond, :vitals, :meds,
                            :followup, :warn,
                            :signed_at, :now, :now
                        )
                    """),
                    {
                        "uuid": summary_uuid,
                        "hid": hospital_id,
                        "aid": adm["id"],
                        "did": doctor_profile_id,
                        "diag": payload.final_diagnosis,
                        "course": payload.hospital_course,
                        "proc": payload.procedures_performed,
                        "cond": payload.condition_at_discharge,
                        "vitals": vitals_json,
                        "meds": meds_json,
                        "followup": payload.follow_up_instructions,
                        "warn": payload.emergency_warning_signs,
                        "signed_at": now,
                        "now": now,
                    },
                )

        return {
            "public_id": summary_uuid,
            "admission_uuid": adm["public_id"],
            "ipd_number": adm["ipd_number"],
            "patient_name": f"{adm['pat_first']} {adm['pat_last']}",
            "doctor_name": doctor_name,
            "final_diagnosis": payload.final_diagnosis,
            "hospital_course": payload.hospital_course,
            "condition_at_discharge": payload.condition_at_discharge,
            "procedures_performed": payload.procedures_performed,
            "discharge_vitals": payload.discharge_vitals,
            "discharge_medications": payload.discharge_medications,
            "follow_up_instructions": payload.follow_up_instructions,
            "emergency_warning_signs": payload.emergency_warning_signs,
            "signed_at": now,
            "created_at": now,
        }

    @classmethod
    def get_discharge_summary(
        cls,
        hospital_id: int,
        admission_uuid: str,
    ) -> Dict[str, Any]:
        """Retrieves structured signed discharge summary for an inpatient admission."""
        with engine.connect() as conn:
            row = conn.execute(
                text("""
                    SELECT s.public_id, s.final_diagnosis, s.hospital_course, s.procedures_performed,
                           s.condition_at_discharge, s.discharge_vitals_json, s.discharge_medications_json,
                           s.follow_up_instructions, s.emergency_warning_signs, s.signed_at, s.created_at,
                           a.public_id AS admission_uuid, a.ipd_number,
                           p.first_name AS pat_first, p.last_name AS pat_last,
                           u.full_name AS doc_name
                    FROM ipd_discharge_summaries s
                    JOIN ipd_admissions a ON s.admission_id = a.id
                    JOIN patients p ON a.patient_id = p.id
                    LEFT JOIN doctor_profiles dp ON s.doctor_id = dp.id
                    LEFT JOIN users u ON dp.user_id = u.id
                    WHERE a.public_id = :uuid AND a.hospital_id = :hid
                """),
                {"uuid": admission_uuid, "hid": hospital_id},
            ).mappings().first()

            if not row:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Discharge summary for admission '{admission_uuid}' not found.",
                )

            vitals = json.loads(row["discharge_vitals_json"]) if row["discharge_vitals_json"] else None
            meds = json.loads(row["discharge_medications_json"]) if row["discharge_medications_json"] else None
            doc_name = f"Dr. {row['doc_name']}" if row.get("doc_name") else "Attending Consultant"

            return {
                "public_id": row["public_id"],
                "admission_uuid": row["admission_uuid"],
                "ipd_number": row["ipd_number"],
                "patient_name": f"{row['pat_first']} {row['pat_last']}",
                "doctor_name": doc_name,
                "final_diagnosis": row["final_diagnosis"],
                "hospital_course": row["hospital_course"],
                "condition_at_discharge": row["condition_at_discharge"],
                "procedures_performed": row["procedures_performed"],
                "discharge_vitals": vitals,
                "discharge_medications": meds,
                "follow_up_instructions": row["follow_up_instructions"],
                "emergency_warning_signs": row["emergency_warning_signs"],
                "signed_at": row["signed_at"],
                "created_at": row["created_at"],
            }

    @classmethod
    def execute_formal_discharge(
        cls,
        hospital_id: int,
        admission_uuid: str,
        current_user: Dict[str, Any],
        payload: FormalDischargeRequest,
    ) -> Dict[str, Any]:
        """
        Executes formal clinical and administrative discharge:
        1. Checks doctor signed discharge summary exists.
        2. Checks final IPD bill generated and balance settled to zero (or authorized waiver).
        3. Updates admission status to 'DISCHARGED' with discharge_date = NOW().
        4. Releases active bed allocation in ipd_bed_allocations.
        5. Transitions bed status in beds table to 'CLEANING'.
        """
        now = datetime.now()
        user_id = int(current_user.get("id", 1))

        with engine.begin() as conn:
            # 1. Lock admission
            adm = conn.execute(
                text("""
                    SELECT a.id, a.public_id, a.ipd_number, a.patient_id, a.current_bed_id,
                           a.status, a.advance_amount_paid
                    FROM ipd_admissions a
                    WHERE a.public_id = :uuid AND a.hospital_id = :hid
                    FOR UPDATE
                """),
                {"uuid": admission_uuid, "hid": hospital_id},
            ).mappings().first()

            if not adm:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Inpatient admission with UUID '{admission_uuid}' not found.",
                )

            if adm["status"] == "DISCHARGED":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Admission '{adm['ipd_number']}' has already been discharged.",
                )

            if adm["status"] != "ADMITTED":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot discharge admission with status '{adm['status']}'. Expected 'ADMITTED'.",
                )

            # 2. Check signed discharge summary exists
            summary = conn.execute(
                text("""
                    SELECT id, signed_at
                    FROM ipd_discharge_summaries
                    WHERE admission_id = :aid AND signed_at IS NOT NULL
                """),
                {"aid": adm["id"]},
            ).mappings().first()

            if not summary or not summary["signed_at"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="CANNOT_DISCHARGE: Discharge summary must be signed by attending doctor before formal discharge.",
                )

            # 3. Check final invoice generated and settled
            inv = conn.execute(
                text("""
                    SELECT id, invoice_number, status, net_amount, paid_amount, balance_amount
                    FROM invoices
                    WHERE ipd_admission_id = :aid AND invoice_type = 'IPD_FINAL'
                    ORDER BY id DESC
                    LIMIT 1
                """),
                {"aid": adm["id"]},
            ).mappings().first()

            if not inv:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="CANNOT_DISCHARGE: Final consolidated bill has not been generated. Please generate final IPD invoice first.",
                )

            balance_amount = Decimal(str(inv["balance_amount"]))
            if balance_amount > Decimal("0.00") and not payload.waiver_reason:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"CANNOT_DISCHARGE: Inpatient bill has unsettled balance of ₹{balance_amount:.2f}. Clear balance or provide authorized financial waiver.",
                )

            # 4. Update admission status to DISCHARGED
            conn.execute(
                text("""
                    UPDATE ipd_admissions
                    SET status = 'DISCHARGED',
                        discharge_date = :now,
                        discharge_type = :dtype,
                        updated_at = :now
                    WHERE id = :aid
                """),
                {
                    "now": now,
                    "dtype": payload.discharge_type,
                    "aid": adm["id"],
                },
            )

            # 5. Release bed in ipd_bed_allocations
            conn.execute(
                text("""
                    UPDATE ipd_bed_allocations
                    SET released_at = :now,
                        released_by = :uid
                    WHERE admission_id = :aid AND released_at IS NULL
                """),
                {
                    "now": now,
                    "uid": user_id,
                    "aid": adm["id"],
                },
            )

            # 6. Transition bed status in beds table to CLEANING
            bed_id = adm["current_bed_id"]
            if bed_id:
                conn.execute(
                    text("""
                        UPDATE beds
                        SET status = 'CLEANING',
                            updated_at = :now
                        WHERE id = :bid
                    """),
                    {"now": now, "bid": bed_id},
                )

        return {
            "admission_uuid": adm["public_id"],
            "ipd_number": adm["ipd_number"],
            "patient_id": adm["patient_id"],
            "status": "DISCHARGED",
            "discharge_type": payload.discharge_type,
            "discharge_date": now,
            "bed_released": True,
            "bed_status": "CLEANING",
            "invoice_number": inv["invoice_number"],
            "balance_amount": balance_amount,
            "message": f"Admission {adm['ipd_number']} successfully discharged. Bed released and marked for cleaning.",
        }
