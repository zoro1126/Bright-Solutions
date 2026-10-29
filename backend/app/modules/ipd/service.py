"""
Inpatient (IPD) & Bed Matrix Service
Domain business logic for ward and bed queries, matrix rollups, and bed state management.
"""

import uuid
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy import text
from app.core.database import engine
from app.core.sequences import SequenceService
from app.modules.ipd.schemas import CreateAdmissionRequest


class IPDService:
    @staticmethod
    def get_bed_matrix(hospital_id: int) -> Dict[str, Any]:
        """
        Retrieves real-time hierarchical bed occupancy matrix:
        Wards -> Rooms -> Beds, along with current occupant details if occupied.
        """
        query = text(
            """
            SELECT 
                w.public_id AS ward_uuid,
                w.ward_code,
                w.ward_name,
                w.floor_number,
                w.gender_restriction,
                w.total_beds,
                r.public_id AS room_uuid,
                r.room_number,
                r.room_type,
                r.daily_tariff,
                b.public_id AS bed_uuid,
                b.bed_number,
                b.status AS bed_status,
                adm.public_id AS admission_uuid,
                adm.ipd_number,
                adm.admission_date,
                adm.provisional_diagnosis,
                p.public_id AS patient_uuid,
                p.uhid,
                CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
                p.gender AS patient_gender,
                u.full_name AS attending_doctor_name
            FROM wards w
            JOIN rooms r ON r.ward_id = w.id AND r.deleted_at IS NULL
            JOIN beds b ON b.room_id = r.id AND b.deleted_at IS NULL
            LEFT JOIN ipd_admissions adm ON adm.id = (
                SELECT a.id FROM ipd_admissions a
                WHERE a.current_bed_id = b.id AND a.status = 'ADMITTED'
                ORDER BY a.id DESC LIMIT 1
            )
            LEFT JOIN patients p ON adm.patient_id = p.id
            LEFT JOIN users u ON adm.attending_doctor_id = u.id
            WHERE w.hospital_id = :hospital_id AND w.is_active = 1 AND w.deleted_at IS NULL
            ORDER BY w.ward_name, r.room_number, b.bed_number
            """
        )

        with engine.connect() as conn:
            rows = conn.execute(query, {"hospital_id": hospital_id}).mappings().fetchall()

        wards_map: Dict[str, Dict[str, Any]] = {}
        total_beds = 0
        status_counts = {
            "AVAILABLE": 0,
            "OCCUPIED": 0,
            "CLEANING": 0,
            "MAINTENANCE": 0,
            "RESERVED": 0,
        }

        for row in rows:
            w_uuid = row["ward_uuid"]
            if w_uuid not in wards_map:
                wards_map[w_uuid] = {
                    "uuid": w_uuid,
                    "ward_code": row["ward_code"],
                    "ward_name": row["ward_name"],
                    "floor_number": str(row["floor_number"]),
                    "gender_restriction": row["gender_restriction"],
                    "total_beds": 0,
                    "available_count": 0,
                    "occupied_count": 0,
                    "cleaning_count": 0,
                    "maintenance_count": 0,
                    "rooms_map": {},
                }

            ward = wards_map[w_uuid]
            ward["total_beds"] += 1
            total_beds += 1

            b_status = row["bed_status"]
            if b_status in status_counts:
                status_counts[b_status] += 1

            if b_status == "AVAILABLE":
                ward["available_count"] += 1
            elif b_status == "OCCUPIED":
                ward["occupied_count"] += 1
            elif b_status == "CLEANING":
                ward["cleaning_count"] += 1
            elif b_status == "MAINTENANCE":
                ward["maintenance_count"] += 1

            r_uuid = row["room_uuid"]
            if r_uuid not in ward["rooms_map"]:
                ward["rooms_map"][r_uuid] = {
                    "uuid": r_uuid,
                    "room_number": row["room_number"],
                    "room_type": row["room_type"],
                    "daily_tariff": row["daily_tariff"],
                    "beds": [],
                }

            occupant = None
            if b_status == "OCCUPIED" and row["admission_uuid"]:
                occupant = {
                    "admission_uuid": row["admission_uuid"],
                    "ipd_number": row["ipd_number"],
                    "admission_date": row["admission_date"],
                    "patient_uuid": row["patient_uuid"],
                    "uhid": row["uhid"],
                    "patient_name": row["patient_name"].strip() if row["patient_name"] else "Unknown",
                    "patient_gender": row["patient_gender"],
                    "attending_doctor_name": row["attending_doctor_name"],
                    "provisional_diagnosis": row["provisional_diagnosis"],
                }

            ward["rooms_map"][r_uuid]["beds"].append(
                {
                    "uuid": row["bed_uuid"],
                    "bed_number": row["bed_number"],
                    "status": b_status,
                    "occupant": occupant,
                }
            )

        wards_list = []
        for ward_data in wards_map.values():
            rooms_list = list(ward_data["rooms_map"].values())
            del ward_data["rooms_map"]
            ward_data["rooms"] = rooms_list
            wards_list.append(ward_data)

        occ_pct = (
            round((status_counts["OCCUPIED"] / total_beds) * 100, 2)
            if total_beds > 0
            else 0.0
        )

        return {
            "summary": {
                "total_beds": total_beds,
                "available_beds": status_counts["AVAILABLE"],
                "occupied_beds": status_counts["OCCUPIED"],
                "cleaning_beds": status_counts["CLEANING"],
                "maintenance_beds": status_counts["MAINTENANCE"],
                "reserved_beds": status_counts["RESERVED"],
                "occupancy_rate_percentage": occ_pct,
            },
            "wards": wards_list,
        }

    @staticmethod
    def list_wards(hospital_id: int) -> List[Dict[str, Any]]:
        """
        Lists all active wards with aggregated capacity and bed status counts.
        """
        query = text(
            """
            SELECT 
                w.public_id AS uuid,
                w.ward_code,
                w.ward_name,
                w.floor_number,
                w.gender_restriction,
                COUNT(b.id) AS total_beds,
                SUM(CASE WHEN b.status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available_beds,
                SUM(CASE WHEN b.status = 'OCCUPIED' THEN 1 ELSE 0 END) AS occupied_beds,
                SUM(CASE WHEN b.status = 'CLEANING' THEN 1 ELSE 0 END) AS cleaning_beds,
                SUM(CASE WHEN b.status = 'MAINTENANCE' THEN 1 ELSE 0 END) AS maintenance_beds,
                w.is_active
            FROM wards w
            LEFT JOIN rooms r ON r.ward_id = w.id AND r.deleted_at IS NULL
            LEFT JOIN beds b ON b.room_id = r.id AND b.deleted_at IS NULL
            WHERE w.hospital_id = :hospital_id AND w.is_active = 1 AND w.deleted_at IS NULL
            GROUP BY w.id, w.public_id, w.ward_code, w.ward_name, w.floor_number, w.gender_restriction, w.is_active
            ORDER BY w.ward_name
            """
        )

        with engine.connect() as conn:
            rows = conn.execute(query, {"hospital_id": hospital_id}).mappings().fetchall()

        return [
            {
                "uuid": row["uuid"],
                "ward_code": row["ward_code"],
                "ward_name": row["ward_name"],
                "floor_number": str(row["floor_number"]),
                "gender_restriction": row["gender_restriction"],
                "total_beds": int(row["total_beds"] or 0),
                "available_beds": int(row["available_beds"] or 0),
                "occupied_beds": int(row["occupied_beds"] or 0),
                "cleaning_beds": int(row["cleaning_beds"] or 0),
                "maintenance_beds": int(row["maintenance_beds"] or 0),
                "is_active": bool(row["is_active"]),
            }
            for row in rows
        ]

    @staticmethod
    def update_bed_status(
        hospital_id: int,
        bed_uuid: str,
        new_status: str,
        notes: Optional[str],
        user_id: int,
    ) -> Dict[str, Any]:
        """
        Safely transitions bed status. Enforces safety guards:
        - Prevents changing status of OCCUPIED beds directly.
        - Prevents manually forcing an empty bed to OCCUPIED.
        """
        bed_query = text(
            """
            SELECT 
                b.id,
                b.public_id AS uuid,
                b.status,
                b.bed_number,
                r.room_number,
                r.room_type,
                r.daily_tariff,
                w.ward_name,
                w.ward_code
            FROM beds b
            JOIN rooms r ON b.room_id = r.id
            JOIN wards w ON r.ward_id = w.id
            WHERE b.public_id = :bed_uuid AND b.hospital_id = :hospital_id AND b.deleted_at IS NULL
            """
        )

        with engine.begin() as conn:
            bed = conn.execute(
                bed_query, {"bed_uuid": bed_uuid, "hospital_id": hospital_id}
            ).mappings().first()

            if not bed:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Bed with UUID '{bed_uuid}' not found.",
                )

            current_status = bed["status"]

            if current_status == "OCCUPIED" and new_status != "OCCUPIED":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot change status of an OCCUPIED bed directly. Patient must be formally transferred or discharged.",
                )

            if new_status == "OCCUPIED" and current_status != "OCCUPIED":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot manually set bed to OCCUPIED. Bed allocation must be performed via IPD Admission or Transfer.",
                )

            if current_status != new_status:
                conn.execute(
                    text(
                        """
                        UPDATE beds
                        SET status = :new_status, updated_at = NOW()
                        WHERE id = :bed_id
                        """
                    ),
                    {"new_status": new_status, "bed_id": bed["id"]},
                )

        return {
            "uuid": bed["uuid"],
            "bed_number": bed["bed_number"],
            "status": new_status,
            "room_number": bed["room_number"],
            "room_type": bed["room_type"],
            "ward_name": bed["ward_name"],
            "ward_code": bed["ward_code"],
            "daily_tariff": bed["daily_tariff"],
        }

    @staticmethod
    def create_admission(
        hospital_id: int,
        req: CreateAdmissionRequest,
        created_by: int,
    ) -> Dict[str, Any]:
        """
        Executes dual-path IPD admission:
        - Path A (OPD Referral): Handoff patient from active consultation, pre-populating diagnosis & doctor.
        - Path B (Direct/Emergency Walk-In): Direct casualty/elective admission.
        Guarantees concurrency-safe bed allocation via SELECT ... FOR UPDATE and gapless IPD_NUMBER sequence.
        """
        with engine.begin() as conn:
            # 1. Lock Bed Row Concurrency-Safely
            bed_query = text(
                """
                SELECT 
                    b.id,
                    b.public_id AS uuid,
                    b.status,
                    b.bed_number,
                    r.room_number,
                    r.room_type,
                    r.daily_tariff,
                    w.ward_name,
                    w.ward_code
                FROM beds b
                JOIN rooms r ON b.room_id = r.id
                JOIN wards w ON r.ward_id = w.id
                WHERE b.public_id = :bed_uuid AND b.hospital_id = :hospital_id AND b.deleted_at IS NULL
                FOR UPDATE
                """
            )
            bed = conn.execute(
                bed_query, {"bed_uuid": req.bed_uuid, "hospital_id": hospital_id}
            ).mappings().first()

            if not bed:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Bed '{req.bed_uuid}' not found.",
                )

            if bed["status"] != "AVAILABLE":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Bed {bed['bed_number']} is currently {bed['status']} and cannot be allocated.",
                )

            # 2. Dual-Path Identification & Pre-population
            patient_id = None
            opd_visit_id = None
            attending_doctor_id = None
            referral_id = None
            prov_diagnosis = req.provisional_diagnosis
            admission_src = req.admission_source.value

            if req.referral_uuid:
                # Path A: OPD Referral Handoff
                ref_query = text(
                    """
                    SELECT 
                        r.id,
                        r.public_id,
                        r.patient_id,
                        r.opd_visit_id,
                        r.referring_doctor_id,
                        r.provisional_diagnosis,
                        r.status
                    FROM opd_ipd_referrals r
                    WHERE r.public_id = :ref_uuid AND r.hospital_id = :hospital_id
                    FOR UPDATE
                    """
                )
                referral = conn.execute(
                    ref_query,
                    {"ref_uuid": req.referral_uuid, "hospital_id": hospital_id},
                ).mappings().first()

                if not referral:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"IPD Referral '{req.referral_uuid}' not found.",
                    )

                if referral["status"] == "ADMITTED":
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="This IPD referral has already been admitted.",
                    )
                if referral["status"] == "CANCELLED":
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="This IPD referral has been cancelled.",
                    )

                referral_id = referral["id"]
                patient_id = referral["patient_id"]
                opd_visit_id = referral["opd_visit_id"]
                attending_doctor_id = referral["referring_doctor_id"]
                admission_src = "OPD_REFERRAL"
                if not prov_diagnosis:
                    prov_diagnosis = referral["provisional_diagnosis"]

            # Resolve Patient if not from referral or explicitly provided
            if not patient_id:
                if not req.patient_uuid:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="patient_uuid is required for direct admission.",
                    )
                pat_query = text(
                    "SELECT id, public_id, uhid, first_name, last_name FROM patients WHERE public_id = :pat_uuid AND hospital_id = :hospital_id"
                )
                pat = conn.execute(
                    pat_query,
                    {"pat_uuid": req.patient_uuid, "hospital_id": hospital_id},
                ).mappings().first()
                if not pat:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Patient '{req.patient_uuid}' not found.",
                    )
                patient_id = pat["id"]

            if not prov_diagnosis:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="provisional_diagnosis is mandatory for inpatient admission.",
                )

            # Resolve Doctor Profile
            if req.attending_doctor_uuid:
                doc_query = text(
                    """
                    SELECT dp.id, dp.public_id, u.full_name
                    FROM doctor_profiles dp
                    JOIN users u ON dp.user_id = u.id
                    WHERE (dp.public_id = :doc_uuid OR u.public_id = :doc_uuid)
                      AND dp.hospital_id = :hospital_id
                    """
                )
                doc = conn.execute(
                    doc_query,
                    {"doc_uuid": req.attending_doctor_uuid, "hospital_id": hospital_id},
                ).mappings().first()
                if not doc:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Attending doctor '{req.attending_doctor_uuid}' not found.",
                    )
                attending_doctor_id = doc["id"]
            elif not attending_doctor_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="attending_doctor_uuid is required for admission.",
                )

            # 3. Monotonic Gapless IPD_NUMBER sequence
            ipd_number = SequenceService.get_next_sequence("IPD", hospital_id, conn=conn)

            # 4. Insert Admission Record
            admission_uuid = str(uuid.uuid4())
            ins_adm_query = text(
                """
                INSERT INTO ipd_admissions (
                    public_id, hospital_id, ipd_number, patient_id, attending_doctor_id,
                    current_bed_id, opd_appointment_id, admission_source, admission_date,
                    admission_type, provisional_diagnosis, is_mlc, mlc_details,
                    guardian_name, guardian_relationship, guardian_phone,
                    payment_category, tpa_provider, tpa_policy_number,
                    advance_amount_paid, status, created_by
                ) VALUES (
                    :public_id, :hospital_id, :ipd_number, :patient_id, :attending_doctor_id,
                    :current_bed_id, :opd_appointment_id, :admission_source, NOW(),
                    :admission_type, :provisional_diagnosis, :is_mlc, :mlc_details,
                    :guardian_name, :guardian_relationship, :guardian_phone,
                    :payment_category, :tpa_provider, :tpa_policy_number,
                    :advance_amount_paid, 'ADMITTED', :created_by
                )
                """
            )
            result = conn.execute(
                ins_adm_query,
                {
                    "public_id": admission_uuid,
                    "hospital_id": hospital_id,
                    "ipd_number": ipd_number,
                    "patient_id": patient_id,
                    "attending_doctor_id": attending_doctor_id,
                    "current_bed_id": bed["id"],
                    "opd_appointment_id": opd_visit_id,
                    "admission_source": admission_src,
                    "admission_type": req.admission_type.value,
                    "provisional_diagnosis": prov_diagnosis,
                    "is_mlc": req.is_mlc,
                    "mlc_details": req.mlc_details,
                    "guardian_name": req.guardian_name,
                    "guardian_relationship": req.guardian_relationship,
                    "guardian_phone": req.guardian_phone,
                    "payment_category": req.payment_category.value,
                    "tpa_provider": req.tpa_provider,
                    "tpa_policy_number": req.tpa_policy_number,
                    "advance_amount_paid": req.advance_amount_paid,
                    "created_by": created_by,
                },
            )
            admission_id = result.lastrowid

            # 5. Record Bed Allocation with Locked Historical Tariff
            ins_alloc_query = text(
                """
                INSERT INTO ipd_bed_allocations (
                    hospital_id, admission_id, bed_id, allocated_at, daily_rate,
                    allocated_by
                ) VALUES (
                    :hospital_id, :admission_id, :bed_id, NOW(), :daily_rate,
                    :allocated_by
                )
                """
            )
            conn.execute(
                ins_alloc_query,
                {
                    "hospital_id": hospital_id,
                    "admission_id": admission_id,
                    "bed_id": bed["id"],
                    "daily_rate": bed["daily_tariff"],
                    "allocated_by": created_by,
                },
            )

            # 6. Update Bed Status to OCCUPIED
            conn.execute(
                text("UPDATE beds SET status = 'OCCUPIED', updated_at = NOW() WHERE id = :bed_id"),
                {"bed_id": bed["id"]},
            )

            # 7. Close Referral if Path A
            if referral_id:
                conn.execute(
                    text("UPDATE opd_ipd_referrals SET status = 'ADMITTED', updated_at = NOW() WHERE id = :ref_id"),
                    {"ref_id": referral_id},
                )

        return IPDService.get_admission(hospital_id, admission_uuid)

    @staticmethod
    def get_admission(hospital_id: int, admission_uuid: str) -> Dict[str, Any]:
        """
        Retrieves complete admission record with linked patient, bed, and doctor data.
        """
        query = text(
            """
            SELECT 
                adm.id,
                adm.public_id AS uuid,
                adm.ipd_number,
                adm.admission_source,
                adm.admission_type,
                adm.admission_date,
                adm.discharge_date,
                adm.provisional_diagnosis,
                adm.is_mlc,
                adm.mlc_details,
                adm.guardian_name,
                adm.guardian_relationship,
                adm.guardian_phone,
                adm.payment_category,
                adm.tpa_provider,
                adm.tpa_policy_number,
                adm.advance_amount_paid,
                adm.status,
                p.public_id AS patient_uuid,
                p.uhid,
                CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
                dp.public_id AS attending_doctor_uuid,
                u.full_name AS attending_doctor_name,
                b.public_id AS bed_uuid,
                b.bed_number,
                r.room_number,
                r.room_type,
                r.daily_tariff,
                w.ward_name,
                w.ward_code
            FROM ipd_admissions adm
            JOIN patients p ON adm.patient_id = p.id
            JOIN doctor_profiles dp ON adm.attending_doctor_id = dp.id
            JOIN users u ON dp.user_id = u.id
            JOIN beds b ON adm.current_bed_id = b.id
            JOIN rooms r ON b.room_id = r.id
            JOIN wards w ON r.ward_id = w.id
            WHERE adm.public_id = :admission_uuid AND adm.hospital_id = :hospital_id
            """
        )

        with engine.connect() as conn:
            row = conn.execute(
                query, {"admission_uuid": admission_uuid, "hospital_id": hospital_id}
            ).mappings().first()

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inpatient admission '{admission_uuid}' not found.",
            )

        return dict(row)

    @staticmethod
    def list_admissions(
        hospital_id: int,
        status_filter: Optional[str] = "ADMITTED",
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Lists inpatients filtered by status (default 'ADMITTED') with patient & bed summaries.
        """
        query_sql = """
            SELECT 
                adm.public_id AS uuid,
                adm.ipd_number,
                adm.admission_source,
                adm.admission_type,
                adm.admission_date,
                adm.discharge_date,
                adm.provisional_diagnosis,
                adm.is_mlc,
                adm.mlc_details,
                adm.guardian_name,
                adm.guardian_relationship,
                adm.guardian_phone,
                adm.payment_category,
                adm.tpa_provider,
                adm.tpa_policy_number,
                adm.advance_amount_paid,
                adm.status,
                p.public_id AS patient_uuid,
                p.uhid,
                CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
                dp.public_id AS attending_doctor_uuid,
                u.full_name AS attending_doctor_name,
                b.public_id AS bed_uuid,
                b.bed_number,
                r.room_number,
                r.room_type,
                r.daily_tariff,
                w.ward_name,
                w.ward_code
            FROM ipd_admissions adm
            JOIN patients p ON adm.patient_id = p.id
            JOIN doctor_profiles dp ON adm.attending_doctor_id = dp.id
            JOIN users u ON dp.user_id = u.id
            JOIN beds b ON adm.current_bed_id = b.id
            JOIN rooms r ON b.room_id = r.id
            JOIN wards w ON r.ward_id = w.id
            WHERE adm.hospital_id = :hospital_id
        """
        params: Dict[str, Any] = {"hospital_id": hospital_id, "limit": limit, "offset": offset}

        if status_filter:
            query_sql += " AND adm.status = :status_filter"
            params["status_filter"] = status_filter

        query_sql += " ORDER BY adm.id DESC LIMIT :limit OFFSET :offset"

        with engine.connect() as conn:
            rows = conn.execute(text(query_sql), params).mappings().fetchall()

        return [dict(r) for r in rows]

    @staticmethod
    def get_admission_consent_and_face_sheet(
        hospital_id: int,
        admission_uuid: str,
    ) -> Dict[str, Any]:
        """
        Compiles structured, bilingual (English & Gujarati) print payload for:
        - Admission Consent & Treatment Authorization (AH/MRD/FORM - 8)
        - Inpatient Admission Face Sheet (AH/MRD/FORM - 9)
        """
        query = text(
            """
            SELECT 
                adm.id,
                adm.public_id AS admission_uuid,
                adm.ipd_number,
                adm.admission_source,
                adm.admission_type,
                adm.admission_date,
                adm.provisional_diagnosis,
                adm.is_mlc,
                adm.mlc_details,
                adm.guardian_name,
                adm.guardian_relationship,
                adm.guardian_phone,
                adm.payment_category,
                adm.tpa_provider,
                adm.tpa_policy_number,
                adm.advance_amount_paid,
                p.public_id AS patient_uuid,
                p.uhid,
                p.first_name,
                p.last_name,
                p.dob,
                p.gender,
                p.blood_group,
                p.phone AS patient_phone,
                p.address_line1,
                p.city AS patient_city,
                p.state AS patient_state,
                p.postal_code AS patient_postal_code,
                b.bed_number,
                r.room_number,
                r.room_type,
                r.daily_tariff,
                w.ward_name,
                w.ward_code,
                w.floor_number,
                dp.specialization,
                dp.medical_council_reg_no,
                u.full_name AS doctor_name,
                h.name AS hospital_name,
                h.address_line1 AS hospital_address,
                h.city AS hospital_city,
                h.state AS hospital_state,
                h.postal_code AS hospital_postal_code,
                h.phone AS hospital_phone,
                h.email AS hospital_email,
                h.registration_number AS hospital_registration_number
            FROM ipd_admissions adm
            JOIN patients p ON adm.patient_id = p.id
            JOIN beds b ON adm.current_bed_id = b.id
            JOIN rooms r ON b.room_id = r.id
            JOIN wards w ON r.ward_id = w.id
            JOIN doctor_profiles dp ON adm.attending_doctor_id = dp.id
            JOIN users u ON dp.user_id = u.id
            JOIN hospitals h ON adm.hospital_id = h.id
            WHERE adm.public_id = :admission_uuid AND adm.hospital_id = :hospital_id
            """
        )

        with engine.connect() as conn:
            row = conn.execute(
                query, {"admission_uuid": admission_uuid, "hospital_id": hospital_id}
            ).mappings().first()

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inpatient admission '{admission_uuid}' not found.",
            )

        # Calculate patient age
        age_years = None
        if row["dob"]:
            age_years = (date.today() - row["dob"]).days // 365

        patient_full_name = f"{row['first_name']} {row['last_name']}".strip()
        patient_address_parts = [
            row["address_line1"],
            row["patient_city"],
            f"{row['patient_state']} - {row['patient_postal_code']}",
        ]
        patient_address = ", ".join([p for p in patient_address_parts if p])

        # Bilingual Form 8 Clauses
        clauses = [
            {
                "clause_number": 1,
                "title_en": "General Consent for Medical Treatment",
                "title_gu": "તબીબી સારવાર માટે સામાન્ય સંમતિ",
                "text_en": (
                    "I hereby voluntarily authorize the medical, nursing, and clinical staff of the "
                    "hospital to administer diagnostic examinations, routine laboratory investigations, "
                    "imaging studies, and standard inpatient medical treatments deemed necessary for my care."
                ),
                "text_gu": (
                    "હું આથી હોસ્પિટલના તબીબી, નર્સિંગ અને ક્લિનિકલ સ્ટાફને મારી સંભાળ માટે જરૂરી ગણાતી "
                    "ડાયગ્નોસ્ટિક પરીક્ષાઓ, નિયમિત લેબોરેટરી તપાસ, ઇમેજિંગ અભ્યાસ અને પ્રમાણભૂત ઇનપેશન્ટ "
                    "તબીબી સારવાર આપવા માટે સ્વેચ્છાએ અધિકૃત કરું છું."
                ),
            },
            {
                "clause_number": 2,
                "title_en": "Emergency Resuscitation & High-Risk Interventions",
                "title_gu": "ઇમરજન્સી પુનર્જીવન અને ઉચ્ચ જોખમી સારવાર સંમતિ",
                "text_en": (
                    "In the event of unforeseen clinical deterioration or emergency situations during "
                    "hospital stay, I authorize the attending physicians and ICU critical care team to perform "
                    "life-saving interventions, CPR, and urgent transfusions."
                ),
                "text_gu": (
                    "હોસ્પિટલ રોકાણ દરમિયાન અણધારી ક્લિનિકલ કટોકટીના કિસ્સામાં, હું હાજર તબીબો અને "
                    "આઈસીયુ ક્રિટિકલ કેર ટીમને જીવનરક્ષક દરમિયાનગીરી, CPR અને તાત્કાલિક રક્ત ચઢાવવાની "
                    "પ્રક્રિયા કરવા માટે અધિકૃત કરું છું."
                ),
            },
            {
                "clause_number": 3,
                "title_en": "Financial Tariff & Billing Liability",
                "title_gu": "નાણાકીય ટેરિફ અને બિલિંગ જવાબદારી",
                "text_en": (
                    "I have received explanation of room tariffs, doctor visit charges, and estimated "
                    "procedural expenses. I undertake full financial responsibility to clear all hospital dues "
                    "prior to or at the time of discharge."
                ),
                "text_gu": (
                    "મને રૂમ ટેરિફ, ડૉક્ટર મુલાકાત ફી અને અંદાજિત પ્રક્રિયા ખર્ચની સંપૂર્ણ સમજૂતી મળી છે. "
                    "હું ડિસ્ચાર્જ સમયે અથવા તે પહેલાં તમામ હોસ્પિટલ લેણાં ચૂકવવાની સંપૂર્ણ નાણાકીય "
                    "જવાબદારી સ્વીકારું છું."
                ),
            },
            {
                "clause_number": 4,
                "title_en": "Valuables & Personal Belongings Disclaimer",
                "title_gu": "કિંમતી સામાન અને અંગત વસ્તુઓ અંગેની સૂચના",
                "text_en": (
                    "The hospital shall not be liable for the loss, theft, or damage of any cash, "
                    "mobile phones, gold jewellery, or personal belongings retained in the patient rooms."
                ),
                "text_gu": (
                    "દર્દીના રૂમમાં રાખવામાં આવેલ રોકડ, મોબાઈલ ફોન, સોનાના ઘરેણાં કે અંગત સામાનની ચોરી કે "
                    "નુકસાન માટે હોસ્પિટલ પ્રશાસન કોઈપણ રીતે જવાબદાર રહેશે નહીં."
                ),
            },
        ]

        signee_name = row["guardian_name"] or patient_full_name
        relation = row["guardian_relationship"] or "Self"

        return {
            "hospital": {
                "name": row["hospital_name"],
                "address": row["hospital_address"],
                "city": row["hospital_city"],
                "state": row["hospital_state"],
                "postal_code": row["hospital_postal_code"],
                "phone": row["hospital_phone"],
                "email": row["hospital_email"],
                "registration_number": row["hospital_registration_number"],
            },
            "admission_uuid": row["admission_uuid"],
            "ipd_number": row["ipd_number"],
            "generated_at": datetime.now(),
            "face_sheet": {
                "form_number": "AH/MRD/FORM - 9",
                "form_title": "Inpatient Admission Face Sheet / ઇનપેશન્ટ એડમિશન ફેસ શીટ",
                "demographics": {
                    "patient_uuid": row["patient_uuid"],
                    "uhid": row["uhid"],
                    "ipd_number": row["ipd_number"],
                    "full_name": patient_full_name,
                    "dob": str(row["dob"]) if row["dob"] else None,
                    "age_years": age_years,
                    "gender": row["gender"],
                    "blood_group": row["blood_group"],
                    "phone": row["patient_phone"],
                    "address": patient_address,
                    "admission_date": row["admission_date"],
                    "admission_source": row["admission_source"],
                    "admission_type": row["admission_type"],
                },
                "location": {
                    "ward_name": row["ward_name"],
                    "ward_code": row["ward_code"],
                    "floor_number": str(row["floor_number"]),
                    "room_number": row["room_number"],
                    "room_type": row["room_type"],
                    "bed_number": row["bed_number"],
                    "daily_tariff": row["daily_tariff"],
                },
                "clinical": {
                    "attending_doctor_name": row["doctor_name"],
                    "specialization": row["specialization"],
                    "medical_council_reg_no": row["medical_council_reg_no"],
                    "provisional_diagnosis": row["provisional_diagnosis"],
                },
                "legal_and_financial": {
                    "is_mlc": bool(row["is_mlc"]),
                    "mlc_details": row["mlc_details"],
                    "guardian_name": row["guardian_name"],
                    "guardian_relationship": row["guardian_relationship"],
                    "guardian_phone": row["guardian_phone"],
                    "payment_category": row["payment_category"],
                    "tpa_provider": row["tpa_provider"],
                    "tpa_policy_number": row["tpa_policy_number"],
                    "advance_amount_paid": row["advance_amount_paid"],
                },
            },
            "consent_form": {
                "form_number": "AH/MRD/FORM - 8",
                "form_title": "Admission Consent & Authorization / દાખલ સંમતિ અને અધિકૃતતા",
                "clauses": clauses,
                "patient_or_guardian_name": signee_name,
                "relation_to_patient": relation,
                "declaration_en": (
                    "I confirm that the above terms have been read and explained to me in a language "
                    "I understand, and I sign this consent voluntarily."
                ),
                "declaration_gu": (
                    "હું પુષ્ટિ કરું છું કે ઉપરોક્ત શરતો મને મારી સમજાતી ભાષામાં વાંચી અને સમજાવવામાં આવી છે, "
                    "અને હું સ્વેચ્છાએ આ સંમતિ પત્રક પર સહી કરું છું."
                ),
            },
        }


