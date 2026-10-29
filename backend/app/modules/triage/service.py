import json
import uuid
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from sqlalchemy import text
from fastapi import HTTPException, status

from app.core.database import engine
from app.modules.triage.schemas import VitalsIntakeRequest

class TriageService:
    @staticmethod
    def calculate_bmi(height_cm: Optional[float], weight_kg: Optional[float]) -> Tuple[Optional[float], Optional[str]]:
        """Calculates BMI (kg/m^2) and determines WHO classification category."""
        if not height_cm or not weight_kg or height_cm <= 0 or weight_kg <= 0:
            return None, None

        h_meters = height_cm / 100.0
        bmi = round(weight_kg / (h_meters * h_meters), 1)

        if bmi < 18.5:
            category = "UNDERWEIGHT"
        elif bmi < 25.0:
            category = "NORMAL"
        elif bmi < 30.0:
            category = "OVERWEIGHT"
        else:
            category = "OBESE"

        return bmi, category

    @staticmethod
    def evaluate_cdss_alerts(
        temp_f: Optional[float],
        pulse: Optional[int],
        sys_bp: Optional[int],
        dia_bp: Optional[int],
        resp_rate: Optional[int],
        spo2: Optional[int]
    ) -> List[str]:
        """
        Deterministic CDSS Vital Alert Rule Engine:
        Evaluates clinical vital thresholds against NABH & emergency safety standards.
        """
        alerts: List[str] = []

        # 1. Hypoxia Check (Critical)
        if spo2 is not None:
            if spo2 < 90:
                alerts.append(f"Severe Hypoxia: SpO2 is critically low ({spo2}%)")
            elif spo2 < 92:
                alerts.append(f"Hypoxia Warning: SpO2 is below safe threshold ({spo2}%)")

        # 2. Hemodynamic / Blood Pressure Checks
        if sys_bp is not None and dia_bp is not None:
            if sys_bp >= 180 or dia_bp >= 120:
                alerts.append(f"Hypertensive Crisis: BP is {sys_bp}/{dia_bp} mmHg (Urgent Attention Required)")
            elif sys_bp >= 140 or dia_bp >= 90:
                alerts.append(f"Stage 2 Hypertension: BP is {sys_bp}/{dia_bp} mmHg")
            elif sys_bp < 90 or dia_bp < 60:
                alerts.append(f"Hypotension Alert: BP is {sys_bp}/{dia_bp} mmHg")

        # 3. Temperature Checks
        if temp_f is not None:
            if temp_f >= 104.0:
                alerts.append(f"Hyperpyrexia Alert: Core temperature is {temp_f}°F")
            elif temp_f >= 100.4:
                alerts.append(f"Fever Alert: Temperature is {temp_f}°F")
            elif temp_f < 95.0:
                alerts.append(f"Hypothermia Alert: Temperature is {temp_f}°F")

        # 4. Pulse / Heart Rate Checks
        if pulse is not None:
            if pulse > 120:
                alerts.append(f"Severe Tachycardia: Heart rate is {pulse} bpm")
            elif pulse > 100:
                alerts.append(f"Tachycardia Alert: Heart rate is {pulse} bpm")
            elif pulse < 50:
                alerts.append(f"Bradycardia Alert: Heart rate is {pulse} bpm")

        # 5. Respiratory Rate Checks
        if resp_rate is not None:
            if resp_rate > 24:
                alerts.append(f"Tachypnea Alert: Respiratory rate is {resp_rate} bpm")
            elif resp_rate < 10:
                alerts.append(f"Bradypnea Alert: Respiratory rate is {resp_rate} bpm")

        return alerts

    @classmethod
    def record_vitals(
        cls,
        req: VitalsIntakeRequest,
        hospital_id: int = 1,
        recorded_by_id: int = 1
    ) -> Dict[str, Any]:
        """
        Persists triage vital signs, calculates real-time BMI, executes CDSS rule alerts,
        and links encounters to OPD visits or master patient records.
        """
        with engine.begin() as conn:
            # 1. Resolve Patient
            patient = None
            if req.patient_uuid:
                patient = conn.execute(text("""
                    SELECT id, public_id, uhid FROM patients
                    WHERE public_id = :pid AND hospital_id = :hid AND deleted_at IS NULL
                    LIMIT 1
                """), {"pid": req.patient_uuid, "hid": hospital_id}).mappings().first()
            elif req.uhid:
                patient = conn.execute(text("""
                    SELECT id, public_id, uhid FROM patients
                    WHERE uhid = :uhid AND hospital_id = :hid AND deleted_at IS NULL
                    LIMIT 1
                """), {"uhid": req.uhid.strip(), "hid": hospital_id}).mappings().first()

            # 2. Resolve OPD Visit if provided
            opd_visit = None
            if req.opd_visit_uuid:
                opd_visit = conn.execute(text("""
                    SELECT id, public_id, opd_number, patient_id FROM opd_visits
                    WHERE public_id = :vid AND hospital_id = :hid
                    LIMIT 1
                """), {"vid": req.opd_visit_uuid, "hid": hospital_id}).mappings().first()
            elif req.opd_number:
                opd_visit = conn.execute(text("""
                    SELECT id, public_id, opd_number, patient_id FROM opd_visits
                    WHERE opd_number = :onum AND hospital_id = :hid
                    LIMIT 1
                """), {"onum": req.opd_number.strip(), "hid": hospital_id}).mappings().first()

            # If patient wasn't given directly, resolve from OPD visit
            if not patient and opd_visit:
                patient = conn.execute(text("""
                    SELECT id, public_id, uhid FROM patients
                    WHERE id = :pid AND hospital_id = :hid
                    LIMIT 1
                """), {"pid": opd_visit["patient_id"], "hid": hospital_id}).mappings().first()

            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Valid patient or OPD visit identifier required to record triage vitals."
                )

            # 3. Calculate BMI & Category
            bmi, bmi_category = cls.calculate_bmi(req.height_cm, req.weight_kg)

            # 4. Evaluate CDSS Vital Safety Alerts
            alerts = cls.evaluate_cdss_alerts(
                temp_f=req.temperature_f,
                pulse=req.pulse_bpm,
                sys_bp=req.blood_pressure_systolic,
                dia_bp=req.blood_pressure_diastolic,
                resp_rate=req.respiratory_rate_bpm,
                spo2=req.spo2_percentage
            )
            is_abnormal = 1 if len(alerts) > 0 else 0
            alerts_json = json.dumps(alerts) if alerts else None

            # 5. Insert Vital Signs Record
            public_id = str(uuid.uuid4())
            opd_visit_id = opd_visit["id"] if opd_visit else None

            conn.execute(text("""
                INSERT INTO vital_signs (
                    public_id, hospital_id, patient_id, opd_visit_id,
                    temperature_f, pulse_bpm, blood_pressure_systolic, blood_pressure_diastolic,
                    respiratory_rate_bpm, spo2_percentage, height_cm, weight_kg,
                    bmi, pain_scale, is_abnormal, abnormal_flags_json, recorded_by
                ) VALUES (
                    :pid, :hid, :pat_id, :vid,
                    :temp, :pulse, :sys_bp, :dia_bp,
                    :rr, :spo2, :height, :weight,
                    :bmi, :pain, :abnormal, :flags, :rec_by
                )
            """), {
                "pid": public_id,
                "hid": hospital_id,
                "pat_id": patient["id"],
                "vid": opd_visit_id,
                "temp": req.temperature_f,
                "pulse": req.pulse_bpm,
                "sys_bp": req.blood_pressure_systolic,
                "dia_bp": req.blood_pressure_diastolic,
                "rr": req.respiratory_rate_bpm,
                "spo2": req.spo2_percentage,
                "height": req.height_cm,
                "weight": req.weight_kg,
                "bmi": bmi,
                "pain": req.pain_scale,
                "abnormal": is_abnormal,
                "flags": alerts_json,
                "rec_by": recorded_by_id
            })

            # Fetch recorded user name
            user_row = conn.execute(text("SELECT full_name FROM users WHERE id = :uid"), {"uid": recorded_by_id}).mappings().first()
            user_name = user_row["full_name"] if user_row else "Clinical Staff"

            return {
                "public_id": public_id,
                "patient_uuid": patient["public_id"],
                "uhid": patient["uhid"],
                "opd_visit_uuid": opd_visit["public_id"] if opd_visit else None,
                "opd_number": opd_visit["opd_number"] if opd_visit else None,
                "temperature_f": float(req.temperature_f) if req.temperature_f is not None else None,
                "pulse_bpm": req.pulse_bpm,
                "blood_pressure_systolic": req.blood_pressure_systolic,
                "blood_pressure_diastolic": req.blood_pressure_diastolic,
                "respiratory_rate_bpm": req.respiratory_rate_bpm,
                "spo2_percentage": req.spo2_percentage,
                "height_cm": float(req.height_cm) if req.height_cm is not None else None,
                "weight_kg": float(req.weight_kg) if req.weight_kg is not None else None,
                "bmi": bmi,
                "bmi_category": bmi_category,
                "pain_scale": req.pain_scale,
                "is_abnormal": bool(is_abnormal),
                "abnormal_flags": alerts,
                "recorded_by_name": user_name,
                "recorded_at": datetime.now().isoformat()
            }

    @classmethod
    def get_vitals_by_visit(cls, visit_uuid: str, hospital_id: int = 1) -> Optional[Dict[str, Any]]:
        """Retrieves triage vitals recorded for a specific OPD visit."""
        with engine.connect() as conn:
            row = conn.execute(text("""
                SELECT vs.*, p.public_id as patient_uuid, p.uhid, v.public_id as opd_visit_uuid,
                       v.opd_number, u.full_name as recorded_by_name
                FROM vital_signs vs
                JOIN patients p ON vs.patient_id = p.id
                JOIN opd_visits v ON vs.opd_visit_id = v.id
                JOIN users u ON vs.recorded_by = u.id
                WHERE v.public_id = :vid AND vs.hospital_id = :hid
                ORDER BY vs.id DESC
                LIMIT 1
            """), {"vid": visit_uuid, "hid": hospital_id}).mappings().first()

            if not row:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No vitals recorded for this visit.")

            return cls._serialize_vitals_row(row)

    @staticmethod
    def _serialize_vitals_row(row: Dict[str, Any]) -> Dict[str, Any]:
        flags = []
        raw_flags = row.get("abnormal_flags_json")
        if raw_flags:
            try:
                flags = json.loads(raw_flags) if isinstance(raw_flags, str) else raw_flags
            except Exception:
                flags = []

        h = float(row["height_cm"]) if row.get("height_cm") is not None else None
        w = float(row["weight_kg"]) if row.get("weight_kg") is not None else None
        bmi, bmi_category = TriageService.calculate_bmi(h, w)

        return {
            "public_id": row["public_id"],
            "patient_uuid": row["patient_uuid"],
            "uhid": row["uhid"],
            "opd_visit_uuid": row.get("opd_visit_uuid"),
            "opd_number": row.get("opd_number"),
            "temperature_f": float(row["temperature_f"]) if row.get("temperature_f") is not None else None,
            "pulse_bpm": row.get("pulse_bpm"),
            "blood_pressure_systolic": row.get("blood_pressure_systolic"),
            "blood_pressure_diastolic": row.get("blood_pressure_diastolic"),
            "respiratory_rate_bpm": row.get("respiratory_rate_bpm"),
            "spo2_percentage": row.get("spo2_percentage"),
            "height_cm": h,
            "weight_kg": w,
            "bmi": float(row["bmi"]) if row.get("bmi") is not None else bmi,
            "bmi_category": bmi_category,
            "pain_scale": row.get("pain_scale"),
            "is_abnormal": bool(row.get("is_abnormal", 0)),
            "abnormal_flags": flags,
            "recorded_by_name": row.get("recorded_by_name"),
            "recorded_at": row["recorded_at"].isoformat() if hasattr(row["recorded_at"], "isoformat") else str(row["recorded_at"])
        }

