import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import text
from fastapi import HTTPException, status

from app.core.database import engine
from app.core.sequences import SequenceService
from app.modules.prescription.schemas import PrescriptionCreateRequest, IpdReferralRequest

class PrescriptionService:
    @classmethod
    def check_ddi(cls, drug_generics: List[str], hospital_id: int = 1) -> Dict[str, Any]:
        """
        Evaluates potential Drug-Drug Interactions (DDIs) across a list of prescribed generics
        against deterministic CDSS rules in cdss_ddi_rules.
        """
        clean_drugs = [d.strip() for d in drug_generics if d and d.strip()]
        if len(clean_drugs) < 2:
            return {"has_interactions": False, "interactions": []}

        interactions: List[Dict[str, Any]] = []
        seen_pairs = set()

        with engine.connect() as conn:
            for i in range(len(clean_drugs)):
                for j in range(i + 1, len(clean_drugs)):
                    da = clean_drugs[i]
                    db = clean_drugs[j]
                    pair_key = tuple(sorted([da.lower(), db.lower()]))
                    if pair_key in seen_pairs:
                        continue
                    seen_pairs.add(pair_key)

                    row = conn.execute(text("""
                        SELECT drug_a_generic, drug_b_generic, severity, clinical_mechanism, management_advice
                        FROM cdss_ddi_rules
                        WHERE hospital_id = :hid AND is_active = 1 AND (
                            (LOWER(drug_a_generic) = LOWER(:da) AND LOWER(drug_b_generic) = LOWER(:db))
                            OR (LOWER(drug_a_generic) = LOWER(:db) AND LOWER(drug_b_generic) = LOWER(:da))
                        )
                        LIMIT 1
                    """), {"hid": hospital_id, "da": da, "db": db}).mappings().first()

                    if row:
                        interactions.append({
                            "drug_a": row["drug_a_generic"],
                            "drug_b": row["drug_b_generic"],
                            "severity": row["severity"],
                            "clinical_mechanism": row["clinical_mechanism"],
                            "management_advice": row["management_advice"]
                        })

        return {
            "has_interactions": len(interactions) > 0,
            "interactions": interactions
        }

    @classmethod
    def create_prescription(
        cls,
        req: PrescriptionCreateRequest,
        hospital_id: int = 1,
        user_id: int = 1
    ) -> Dict[str, Any]:
        """Creates an e-prescription order linked to a patient and consultation encounter."""
        with engine.begin() as conn:
            # 1. Resolve Patient
            patient = None
            if req.patient_uuid:
                patient = conn.execute(text("""
                    SELECT id, public_id, uhid, first_name, middle_name, last_name FROM patients
                    WHERE public_id = :pid AND hospital_id = :hid LIMIT 1
                """), {"pid": req.patient_uuid, "hid": hospital_id}).mappings().first()
            elif req.uhid:
                patient = conn.execute(text("""
                    SELECT id, public_id, uhid, first_name, middle_name, last_name FROM patients
                    WHERE uhid = :uhid AND hospital_id = :hid LIMIT 1
                """), {"uhid": req.uhid.strip(), "hid": hospital_id}).mappings().first()

            # 2. Resolve Consultation & Attending Doctor
            consultation = None
            doctor = None
            if req.consultation_uuid:
                consultation = conn.execute(text("""
                    SELECT c.id, c.public_id, c.patient_id, c.doctor_id, dp.public_id as doctor_uuid, u.full_name as doctor_name
                    FROM consultations c
                    JOIN doctor_profiles dp ON c.doctor_id = dp.id
                    JOIN users u ON dp.user_id = u.id
                    WHERE c.public_id = :cid AND c.hospital_id = :hid
                    LIMIT 1
                """), {"cid": req.consultation_uuid, "hid": hospital_id}).mappings().first()

                if consultation and not patient:
                    patient = conn.execute(text("""
                        SELECT id, public_id, uhid, first_name, middle_name, last_name FROM patients
                        WHERE id = :pid AND hospital_id = :hid
                    """), {"pid": consultation["patient_id"], "hid": hospital_id}).mappings().first()

            if not patient:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient record not found.")

            # Resolve Doctor Profile for authenticated user if not from consultation
            if consultation:
                doctor_id = consultation["doctor_id"]
                doctor_uuid = consultation["doctor_uuid"]
                doctor_name = consultation["doctor_name"]
            else:
                doc_row = conn.execute(text("""
                    SELECT dp.id, dp.public_id, u.full_name
                    FROM doctor_profiles dp
                    JOIN users u ON dp.user_id = u.id
                    WHERE dp.user_id = :uid AND dp.hospital_id = :hid
                    LIMIT 1
                """), {"uid": user_id, "hid": hospital_id}).mappings().first()

                if doc_row:
                    doctor_id = doc_row["id"]
                    doctor_uuid = doc_row["public_id"]
                    doctor_name = doc_row["full_name"]
                else:
                    first_doc = conn.execute(text("""
                        SELECT dp.id, dp.public_id, u.full_name FROM doctor_profiles dp
                        JOIN users u ON dp.user_id = u.id
                        WHERE dp.hospital_id = :hid ORDER BY dp.id ASC LIMIT 1
                    """), {"hid": hospital_id}).mappings().first()
                    doctor_id = first_doc["id"]
                    doctor_uuid = first_doc["public_id"]
                    doctor_name = first_doc["full_name"]

            # 3. Generate Monotonic Prescription Number
            rx_number = SequenceService.get_next_sequence("PRESCRIPTION", hospital_id, conn=conn)
            rx_uuid = str(uuid.uuid4())
            consultation_id = consultation["id"] if consultation else None

            # 4. Insert Prescription Header
            res_rx = conn.execute(text("""
                INSERT INTO prescriptions (
                    public_id, hospital_id, prescription_number, patient_id,
                    consultation_id, doctor_id, status, general_instructions
                ) VALUES (
                    :pid, :hid, :rx_num, :pat_id,
                    :c_id, :doc_id, 'PENDING', :gen_inst
                )
            """), {
                "pid": rx_uuid,
                "hid": hospital_id,
                "rx_num": rx_number,
                "pat_id": patient["id"],
                "c_id": consultation_id,
                "doc_id": doctor_id,
                "gen_inst": req.general_instructions
            })
            rx_id = res_rx.lastrowid

            # 5. Insert Prescription Items
            item_responses = []
            for item in req.items:
                res_item = conn.execute(text("""
                    INSERT INTO prescription_items (
                        prescription_id, item_id, drug_name_custom, dosage,
                        frequency, route, duration_days, quantity_prescribed,
                        food_relation, special_instructions, is_off_formulary
                    ) VALUES (
                        :rx_id, NULL, :dname, :dosage,
                        :freq, :route, :dur, :qty,
                        :food, :s_inst, 1
                    )
                """), {
                    "rx_id": rx_id,
                    "dname": item.drug_name.strip(),
                    "dosage": item.dosage.strip(),
                    "freq": item.frequency,
                    "route": item.route,
                    "dur": item.duration_days,
                    "qty": item.quantity_prescribed,
                    "food": item.food_relation,
                    "s_inst": item.special_instructions
                })
                item_responses.append({
                    "id": res_item.lastrowid,
                    "drug_name": item.drug_name.strip(),
                    "dosage": item.dosage.strip(),
                    "frequency": item.frequency,
                    "route": item.route,
                    "duration_days": item.duration_days,
                    "quantity_prescribed": item.quantity_prescribed,
                    "food_relation": item.food_relation,
                    "special_instructions": item.special_instructions
                })

            fname = patient["first_name"]
            mname = patient["middle_name"]
            lname = patient["last_name"]
            patient_full_name = f"{fname} {mname} {lname}".replace("  ", " ").strip() if mname else f"{fname} {lname}".strip()

            return {
                "public_id": rx_uuid,
                "prescription_number": rx_number,
                "uhid": patient["uhid"],
                "patient_name": patient_full_name,
                "doctor_name": doctor_name,
                "doctor_uuid": doctor_uuid,
                "consultation_uuid": req.consultation_uuid,
                "status": "PENDING",
                "general_instructions": req.general_instructions,
                "items": item_responses,
                "created_at": datetime.now().isoformat()
            }

    @classmethod
    def refer_patient_to_ipd(
        cls,
        consultation_uuid: str,
        req: IpdReferralRequest,
        hospital_id: int = 1,
        user_id: int = 1
    ) -> Dict[str, Any]:
        """
        Creates an Inpatient Admission Referral Order from an active OPD consultation chamber,
        flagging the patient in the admission desk queue.
        """
        with engine.begin() as conn:
            c = conn.execute(text("""
                SELECT c.id, c.opd_visit_id, c.patient_id, c.doctor_id,
                       p.uhid, p.first_name, p.middle_name, p.last_name,
                       u.full_name as doctor_name
                FROM consultations c
                JOIN patients p ON c.patient_id = p.id
                JOIN doctor_profiles dp ON c.doctor_id = dp.id
                JOIN users u ON dp.user_id = u.id
                WHERE c.public_id = :cid AND c.hospital_id = :hid
                LIMIT 1
            """), {"cid": consultation_uuid, "hid": hospital_id}).mappings().first()

            if not c:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultation record not found.")

            ref_uuid = str(uuid.uuid4())
            conn.execute(text("""
                INSERT INTO opd_ipd_referrals (
                    public_id, hospital_id, consultation_id, opd_visit_id,
                    patient_id, referring_doctor_id, provisional_diagnosis,
                    preferred_bed_category, clinical_urgency, reason_for_admission,
                    status
                ) VALUES (
                    :pid, :hid, :cid, :vid,
                    :pat_id, :doc_id, :prov_diag,
                    :bed_cat, :urgency, :reason,
                    'PENDING_ADMISSION'
                )
            """), {
                "pid": ref_uuid,
                "hid": hospital_id,
                "cid": c["id"],
                "vid": c["opd_visit_id"],
                "pat_id": c["patient_id"],
                "doc_id": c["doctor_id"],
                "prov_diag": req.provisional_diagnosis.strip(),
                "bed_cat": req.preferred_bed_category.strip().upper(),
                "urgency": req.clinical_urgency,
                "reason": req.reason_for_admission
            })

            # Update consultation referral tag
            conn.execute(text("""
                UPDATE consultations
                SET referral_doctor_or_dept = :tag
                WHERE id = :cid
            """), {
                "cid": c["id"],
                "tag": f"IPD Admission: {req.preferred_bed_category.upper()} ({req.clinical_urgency})"
            })

            fname = c["first_name"]
            mname = c["middle_name"]
            lname = c["last_name"]
            patient_name = f"{fname} {mname} {lname}".replace("  ", " ").strip() if mname else f"{fname} {lname}".strip()

            return {
                "referral_uuid": ref_uuid,
                "consultation_uuid": consultation_uuid,
                "uhid": c["uhid"],
                "patient_name": patient_name,
                "referring_doctor": c["doctor_name"],
                "provisional_diagnosis": req.provisional_diagnosis.strip(),
                "preferred_bed_category": req.preferred_bed_category.strip().upper(),
                "clinical_urgency": req.clinical_urgency,
                "status": "PENDING_ADMISSION",
                "created_at": datetime.now().isoformat()
            }

    @classmethod
    def list_pending_ipd_referrals(cls, hospital_id: int = 1) -> List[Dict[str, Any]]:
        """Lists pending inpatient admission referrals for the IPD intake desk."""
        with engine.connect() as conn:
            rows = conn.execute(text("""
                SELECT r.public_id as referral_uuid, r.provisional_diagnosis, r.preferred_bed_category,
                       r.clinical_urgency, r.reason_for_admission, r.status, r.created_at,
                       p.public_id as patient_uuid, p.uhid, p.first_name, p.middle_name, p.last_name, p.phone,
                       u.full_name as referring_doctor_name
                FROM opd_ipd_referrals r
                JOIN patients p ON r.patient_id = p.id
                JOIN doctor_profiles dp ON r.referring_doctor_id = dp.id
                JOIN users u ON dp.user_id = u.id
                WHERE r.hospital_id = :hid AND r.status = 'PENDING_ADMISSION'
                ORDER BY CASE r.clinical_urgency WHEN 'EMERGENCY' THEN 1 WHEN 'URGENT' THEN 2 ELSE 3 END, r.id ASC
            """), {"hid": hospital_id}).mappings().all()

            results = []
            for r in rows:
                fname = r["first_name"]
                mname = r["middle_name"]
                lname = r["last_name"]
                patient_name = f"{fname} {mname} {lname}".replace("  ", " ").strip() if mname else f"{fname} {lname}".strip()
                results.append({
                    "referral_uuid": r["referral_uuid"],
                    "patient_uuid": r["patient_uuid"],
                    "uhid": r["uhid"],
                    "patient_name": patient_name,
                    "phone": r["phone"],
                    "referring_doctor": r["referring_doctor_name"],
                    "provisional_diagnosis": r["provisional_diagnosis"],
                    "preferred_bed_category": r["preferred_bed_category"],
                    "clinical_urgency": r["clinical_urgency"],
                    "reason_for_admission": r["reason_for_admission"],
                    "status": r["status"],
                    "created_at": r["created_at"].isoformat() if hasattr(r["created_at"], "isoformat") else str(r["created_at"])
                })
            return results

