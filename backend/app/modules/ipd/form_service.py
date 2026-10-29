"""
Inpatient (IPD) Universal Clinical Form Submission Service (ADR-009)
Dynamic Form Registry validation, multi-version tracking, and immutability locking.
"""

import json
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from pydantic import BaseModel, ValidationError
from sqlalchemy import text
from app.core.database import engine


def get_form_schema_registry() -> Dict[str, Any]:
    """Dynamically loads registered form schemas from app.modules.ipd.forms."""
    try:
        from app.modules.ipd.forms import FORM_SCHEMA_REGISTRY
        return FORM_SCHEMA_REGISTRY
    except ImportError:
        return {}


class FormService:
    @staticmethod
    def submit_clinical_form(
        hospital_id: int,
        admission_uuid: str,
        form_code: str,
        payload_data: Dict[str, Any],
        recorded_by_user_id: int,
        day_number: Optional[int] = None,
        as_draft: bool = False,
    ) -> Dict[str, Any]:
        """
        Validates clinical form payload against registered Pydantic v2 schema
        and records submission into `ipd_clinical_form_submissions`.
        Increments form_version if previous submissions exist.
        """
        clean_code = form_code.strip().upper()
        registry = get_form_schema_registry()

        # Validate against schema if registered
        validated_payload: Dict[str, Any] = payload_data
        if clean_code in registry:
            schema_cls = registry[clean_code]
            try:
                validated_instance = schema_cls.model_validate(payload_data)
                validated_payload = validated_instance.model_dump(mode="json")
            except ValidationError as ve:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={
                        "error": "FORM_VALIDATION_ERROR",
                        "form_code": clean_code,
                        "validation_errors": ve.errors(),
                    },
                )

        serialized_payload = json.dumps(validated_payload)

        with engine.begin() as conn:
            # 1. Resolve Admission
            adm_query = text(
                """
                SELECT id, status, ipd_number, patient_id
                FROM ipd_admissions
                WHERE public_id = :adm_uuid AND hospital_id = :hospital_id
                """
            )
            adm = conn.execute(
                adm_query, {"adm_uuid": admission_uuid, "hospital_id": hospital_id}
            ).mappings().first()

            if not adm:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Inpatient admission '{admission_uuid}' not found.",
                )

            # 2. Check Previous Submissions & Compute Version
            ver_query = text(
                """
                SELECT id, form_version, status
                FROM ipd_clinical_form_submissions
                WHERE admission_id = :adm_id AND form_code = :form_code
                ORDER BY form_version DESC
                LIMIT 1
                FOR UPDATE
                """
            )
            prev = conn.execute(
                ver_query, {"adm_id": adm["id"], "form_code": clean_code}
            ).mappings().first()

            next_version = 1
            if prev:
                if prev["status"] == "LOCKED" and as_draft:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Cannot save draft over a LOCKED form submission (v{prev['form_version']}).",
                    )
                # Supersede previous active submission
                if prev["status"] in ("DRAFT", "SUBMITTED"):
                    conn.execute(
                        text("UPDATE ipd_clinical_form_submissions SET status = 'SUPERSEDED' WHERE id = :id"),
                        {"id": prev["id"]},
                    )
                next_version = prev["form_version"] + 1

            # 3. Insert Submission Record
            sub_uuid = str(uuid.uuid4())
            sub_status = "DRAFT" if as_draft else "SUBMITTED"

            conn.execute(
                text(
                    """
                    INSERT INTO ipd_clinical_form_submissions (
                        public_id, hospital_id, admission_id, form_code,
                        form_version, day_number, recorded_by, recorded_at,
                        status, payload
                    ) VALUES (
                        :public_id, :hospital_id, :admission_id, :form_code,
                        :form_version, :day_number, :recorded_by, NOW(),
                        :status, :payload
                    )
                    """
                ),
                {
                    "public_id": sub_uuid,
                    "hospital_id": hospital_id,
                    "admission_id": adm["id"],
                    "form_code": clean_code,
                    "form_version": next_version,
                    "day_number": day_number,
                    "recorded_by": recorded_by_user_id,
                    "status": sub_status,
                    "payload": serialized_payload,
                },
            )

        return FormService.get_form_submission(hospital_id, admission_uuid, clean_code, next_version)

    @staticmethod
    def get_form_submission(
        hospital_id: int,
        admission_uuid: str,
        form_code: str,
        version: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Retrieves clinical form submission (latest by default, or specific version).
        """
        clean_code = form_code.strip().upper()
        sql = """
            SELECT 
                s.public_id AS submission_uuid,
                s.form_code,
                s.form_version,
                s.day_number,
                s.recorded_at,
                s.status,
                s.payload,
                adm.public_id AS admission_uuid,
                adm.ipd_number,
                u.full_name AS recorded_by_name,
                r.role_name AS recorded_by_role
            FROM ipd_clinical_form_submissions s
            JOIN ipd_admissions adm ON s.admission_id = adm.id
            JOIN users u ON s.recorded_by = u.id
            JOIN roles r ON u.role_id = r.id
            WHERE adm.public_id = :adm_uuid 
              AND s.hospital_id = :hospital_id 
              AND s.form_code = :form_code
        """
        params: Dict[str, Any] = {
            "adm_uuid": admission_uuid,
            "hospital_id": hospital_id,
            "form_code": clean_code,
        }

        if version is not None:
            sql += " AND s.form_version = :version"
            params["version"] = version
        else:
            sql += " ORDER BY s.form_version DESC LIMIT 1"

        with engine.connect() as conn:
            row = conn.execute(text(sql), params).mappings().first()

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Form submission '{clean_code}' not found for admission '{admission_uuid}'.",
            )

        parsed_payload = json.loads(row["payload"]) if isinstance(row["payload"], str) else row["payload"]

        return {
            "submission_uuid": row["submission_uuid"],
            "admission_uuid": row["admission_uuid"],
            "ipd_number": row["ipd_number"],
            "form_code": row["form_code"],
            "form_version": row["form_version"],
            "day_number": row["day_number"],
            "recorded_at": row["recorded_at"],
            "status": row["status"],
            "recorded_by_name": row["recorded_by_name"],
            "recorded_by_role": row["recorded_by_role"],
            "payload": parsed_payload,
        }

    @staticmethod
    def list_admission_forms(
        hospital_id: int,
        admission_uuid: str,
    ) -> List[Dict[str, Any]]:
        """
        Lists all submitted clinical forms across the patient's stay.
        """
        sql = """
            SELECT 
                s.public_id AS submission_uuid,
                s.form_code,
                s.form_version,
                s.day_number,
                s.recorded_at,
                s.status,
                u.full_name AS recorded_by_name,
                r.role_name AS recorded_by_role
            FROM ipd_clinical_form_submissions s
            JOIN ipd_admissions adm ON s.admission_id = adm.id
            JOIN users u ON s.recorded_by = u.id
            JOIN roles r ON u.role_id = r.id
            WHERE adm.public_id = :adm_uuid AND s.hospital_id = :hospital_id
            ORDER BY s.id DESC
        """
        with engine.connect() as conn:
            rows = conn.execute(
                text(sql), {"adm_uuid": admission_uuid, "hospital_id": hospital_id}
            ).mappings().fetchall()

        return [dict(r) for r in rows]

    @staticmethod
    def lock_clinical_form(
        hospital_id: int,
        admission_uuid: str,
        form_code: str,
        user_id: int,
    ) -> Dict[str, Any]:
        """
        TASK-BE-5.8: Transitions active form submission to 'LOCKED'.
        Creates an immutable legal clinical record.
        """
        clean_code = form_code.strip().upper()

        with engine.begin() as conn:
            find_query = text(
                """
                SELECT s.id, s.public_id, s.form_version, s.status
                FROM ipd_clinical_form_submissions s
                JOIN ipd_admissions adm ON s.admission_id = adm.id
                WHERE adm.public_id = :adm_uuid 
                  AND s.hospital_id = :hospital_id 
                  AND s.form_code = :form_code
                ORDER BY s.form_version DESC
                LIMIT 1
                FOR UPDATE
                """
            )
            form = conn.execute(
                find_query,
                {"adm_uuid": admission_uuid, "hospital_id": hospital_id, "form_code": clean_code},
            ).mappings().first()

            if not form:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Form '{clean_code}' not found for admission '{admission_uuid}'.",
                )

            if form["status"] == "LOCKED":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Form '{clean_code}' v{form['form_version']} is already LOCKED.",
                )

            if form["status"] == "DRAFT":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot lock DRAFT form. Please submit the form before locking.",
                )

            conn.execute(
                text("UPDATE ipd_clinical_form_submissions SET status = 'LOCKED' WHERE id = :id"),
                {"id": form["id"]},
            )

        return FormService.get_form_submission(hospital_id, admission_uuid, clean_code, form["form_version"])
