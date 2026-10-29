"""
Inpatient (IPD) Operational Flowsheet Service (TASK-BE-5.3)
Relational Core for:
- Doctor Treatment Orders & Oxygen Therapy (AH/MRD/FORM - 29)
- Nurse Medication Administration Record (MAR)
- 24-Hour Fluid Balance Intake & Output Chart (AH/MRD/FORM - 61)
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy import text
from app.core.database import engine


class FlowsheetService:
    # -------------------------------------------------------------------------
    # FORM 29: Doctor Treatment Orders & Oxygen Therapy
    # -------------------------------------------------------------------------
    @staticmethod
    def create_treatment_order(
        hospital_id: int,
        admission_uuid: str,
        doctor_user_id: int,
        order_type: str,
        drug_name: Optional[str] = None,
        dosage: Optional[str] = None,
        route: Optional[str] = None,
        frequency: Optional[str] = None,
        o2_device: Optional[str] = None,
        o2_flow_rate_lpm: Optional[Decimal] = None,
        instructions: Optional[str] = None,
        start_time: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Creates doctor inpatient treatment order (medication, O2 therapy, diet, or special instruction).
        """
        start = start_time or datetime.now()
        order_uuid = str(uuid.uuid4())

        with engine.begin() as conn:
            adm = conn.execute(
                text("SELECT id, status FROM ipd_admissions WHERE public_id = :uuid AND hospital_id = :hid"),
                {"uuid": admission_uuid, "hid": hospital_id},
            ).mappings().first()

            if not adm:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Admission '{admission_uuid}' not found.")

            ins_query = text(
                """
                INSERT INTO ipd_treatment_orders (
                    public_id, hospital_id, admission_id, doctor_id, order_datetime,
                    order_type, drug_name, dosage, route, frequency,
                    o2_device, o2_flow_rate_lpm, instructions, start_time,
                    status
                ) VALUES (
                    :public_id, :hospital_id, :admission_id, :doctor_id, NOW(),
                    :order_type, :drug_name, :dosage, :route, :frequency,
                    :o2_device, :o2_flow_rate_lpm, :instructions, :start_time,
                    'ACTIVE'
                )
                """
            )
            conn.execute(
                ins_query,
                {
                    "public_id": order_uuid,
                    "hospital_id": hospital_id,
                    "admission_id": adm["id"],
                    "doctor_id": doctor_user_id,
                    "order_type": order_type,
                    "drug_name": drug_name,
                    "dosage": dosage,
                    "route": route,
                    "frequency": frequency,
                    "o2_device": o2_device,
                    "o2_flow_rate_lpm": o2_flow_rate_lpm,
                    "instructions": instructions,
                    "start_time": start,
                },
            )

        return FlowsheetService.get_treatment_order(hospital_id, order_uuid)

    @staticmethod
    def get_treatment_order(hospital_id: int, order_uuid: str) -> Dict[str, Any]:
        query = text(
            """
            SELECT 
                o.public_id AS order_uuid,
                o.order_type,
                o.drug_name,
                o.dosage,
                o.route,
                o.frequency,
                o.o2_device,
                o.o2_flow_rate_lpm,
                o.instructions,
                o.start_time,
                o.stop_time,
                o.status,
                u.full_name AS doctor_name
            FROM ipd_treatment_orders o
            JOIN users u ON o.doctor_id = u.id
            WHERE o.public_id = :uuid AND o.hospital_id = :hid
            """
        )
        with engine.connect() as conn:
            row = conn.execute(query, {"uuid": order_uuid, "hid": hospital_id}).mappings().first()

        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Treatment order not found.")
        return dict(row)

    @staticmethod
    def list_treatment_orders(hospital_id: int, admission_uuid: str, status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        sql = """
            SELECT 
                o.public_id AS order_uuid,
                o.order_type,
                o.drug_name,
                o.dosage,
                o.route,
                o.frequency,
                o.o2_device,
                o.o2_flow_rate_lpm,
                o.instructions,
                o.start_time,
                o.stop_time,
                o.status,
                u.full_name AS doctor_name,
                COUNT(a.id) AS total_administrations,
                SUM(CASE WHEN a.status = 'GIVEN' THEN 1 ELSE 0 END) AS given_count
            FROM ipd_treatment_orders o
            JOIN ipd_admissions adm ON o.admission_id = adm.id
            JOIN users u ON o.doctor_id = u.id
            LEFT JOIN ipd_treatment_administrations a ON a.treatment_order_id = o.id
            WHERE adm.public_id = :uuid AND o.hospital_id = :hid
        """
        params: Dict[str, Any] = {"uuid": admission_uuid, "hid": hospital_id}
        if status_filter:
            sql += " AND o.status = :status_filter"
            params["status_filter"] = status_filter
        sql += " GROUP BY o.id ORDER BY o.id DESC"

        with engine.connect() as conn:
            rows = conn.execute(text(sql), params).mappings().fetchall()
        return [dict(r) for r in rows]

    @staticmethod
    def discontinue_treatment_order(hospital_id: int, order_uuid: str, user_id: int, reason: str) -> Dict[str, Any]:
        with engine.begin() as conn:
            order = conn.execute(
                text("SELECT id, status FROM ipd_treatment_orders WHERE public_id = :uuid AND hospital_id = :hid FOR UPDATE"),
                {"uuid": order_uuid, "hid": hospital_id},
            ).mappings().first()
            if not order:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
            if order["status"] == "DISCONTINUED":
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order already discontinued.")

            conn.execute(
                text(
                    """
                    UPDATE ipd_treatment_orders
                    SET status = 'DISCONTINUED', stop_time = NOW(), discontinued_by = :uid, discontinued_reason = :reason
                    WHERE id = :id
                    """
                ),
                {"id": order["id"], "uid": user_id, "reason": reason},
            )
        return FlowsheetService.get_treatment_order(hospital_id, order_uuid)

    # -------------------------------------------------------------------------
    # FORM 29 MAR: Medication Administration Record
    # -------------------------------------------------------------------------
    @staticmethod
    def record_mar_administration(
        hospital_id: int,
        order_uuid: str,
        nurse_user_id: int,
        scheduled_time: datetime,
        mar_status: str,
        omitted_reason: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Nurse logs single dose administration or omission into MAR.
        """
        with engine.begin() as conn:
            order = conn.execute(
                text("SELECT id, admission_id, drug_name, status FROM ipd_treatment_orders WHERE public_id = :uuid AND hospital_id = :hid"),
                {"uuid": order_uuid, "hid": hospital_id},
            ).mappings().first()
            if not order:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Treatment order not found.")
            if order["status"] == "DISCONTINUED":
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot administer discontinued order.")

            administered_time = datetime.now() if mar_status == "GIVEN" else None

            conn.execute(
                text(
                    """
                    INSERT INTO ipd_treatment_administrations (
                        hospital_id, treatment_order_id, admission_id, nurse_id,
                        scheduled_time, administered_time, status, omitted_reason, notes
                    ) VALUES (
                        :hid, :order_id, :adm_id, :nurse_id,
                        :sched_time, :admin_time, :status, :reason, :notes
                    )
                    """
                ),
                {
                    "hid": hospital_id,
                    "order_id": order["id"],
                    "adm_id": order["admission_id"],
                    "nurse_id": nurse_user_id,
                    "sched_time": scheduled_time,
                    "admin_time": administered_time,
                    "status": mar_status,
                    "reason": omitted_reason,
                    "notes": notes,
                },
            )

        return {
            "order_uuid": order_uuid,
            "drug_name": order["drug_name"],
            "scheduled_time": scheduled_time,
            "administered_time": administered_time,
            "status": mar_status,
            "omitted_reason": omitted_reason,
            "message": "MAR administration logged successfully.",
        }

    # -------------------------------------------------------------------------
    # FORM 61: 24-Hour Fluid Intake & Output Chart
    # -------------------------------------------------------------------------
    @staticmethod
    def record_intake_output(
        hospital_id: int,
        admission_uuid: str,
        nurse_user_id: int,
        shift: str,
        oral_rt_intake_ml: int = 0,
        iv_fluid_type: Optional[str] = None,
        iv_fluid_intake_ml: int = 0,
        blood_products_ml: int = 0,
        urine_output_ml: int = 0,
        vomitus_rt_aspirate_ml: int = 0,
        stool_count: int = 0,
        drain_output_ml: int = 0,
        remarks: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Records shift fluid intake and output, automatically computing signed net balance.
        """
        total_intake = oral_rt_intake_ml + iv_fluid_intake_ml + blood_products_ml
        total_output = urine_output_ml + vomitus_rt_aspirate_ml + drain_output_ml
        net_balance = total_intake - total_output
        record_uuid = str(uuid.uuid4())

        with engine.begin() as conn:
            adm = conn.execute(
                text("SELECT id FROM ipd_admissions WHERE public_id = :uuid AND hospital_id = :hid"),
                {"uuid": admission_uuid, "hid": hospital_id},
            ).mappings().first()
            if not adm:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admission not found.")

            conn.execute(
                text(
                    """
                    INSERT INTO ipd_intake_output (
                        public_id, hospital_id, admission_id, nurse_id, record_datetime,
                        shift, oral_rt_intake_ml, iv_fluid_type, iv_fluid_intake_ml,
                        blood_products_ml, urine_output_ml, vomitus_rt_aspirate_ml,
                        stool_count, drain_output_ml, net_balance_ml, remarks
                    ) VALUES (
                        :public_id, :hid, :adm_id, :nurse_id, NOW(),
                        :shift, :oral_rt, :iv_type, :iv_ml,
                        :blood_ml, :urine_ml, :vomitus_ml,
                        :stool, :drain_ml, :net_bal, :remarks
                    )
                    """
                ),
                {
                    "public_id": record_uuid,
                    "hid": hospital_id,
                    "adm_id": adm["id"],
                    "nurse_id": nurse_user_id,
                    "shift": shift,
                    "oral_rt": oral_rt_intake_ml,
                    "iv_type": iv_fluid_type,
                    "iv_ml": iv_fluid_intake_ml,
                    "blood_ml": blood_products_ml,
                    "urine_ml": urine_output_ml,
                    "vomitus_ml": vomitus_rt_aspirate_ml,
                    "stool": stool_count,
                    "drain_ml": drain_output_ml,
                    "net_bal": net_balance,
                    "remarks": remarks,
                },
            )

        return {
            "record_uuid": record_uuid,
            "shift": shift,
            "total_intake_ml": total_intake,
            "total_output_ml": total_output,
            "net_balance_ml": net_balance,
            "remarks": remarks,
        }

    @staticmethod
    def get_intake_output_history(hospital_id: int, admission_uuid: str) -> Dict[str, Any]:
        """
        Retrieves shift records and calculates cumulative fluid balance.
        """
        sql = """
            SELECT 
                io.public_id AS record_uuid,
                io.record_datetime,
                io.shift,
                io.oral_rt_intake_ml,
                io.iv_fluid_type,
                io.iv_fluid_intake_ml,
                io.blood_products_ml,
                io.urine_output_ml,
                io.vomitus_rt_aspirate_ml,
                io.stool_count,
                io.drain_output_ml,
                io.net_balance_ml,
                io.remarks,
                u.full_name AS nurse_name
            FROM ipd_intake_output io
            JOIN ipd_admissions adm ON io.admission_id = adm.id
            JOIN users u ON io.nurse_id = u.id
            WHERE adm.public_id = :uuid AND io.hospital_id = :hid
            ORDER BY io.record_datetime ASC
        """
        with engine.connect() as conn:
            rows = conn.execute(text(sql), {"uuid": admission_uuid, "hid": hospital_id}).mappings().fetchall()

        records = [dict(r) for r in rows]
        cum_intake = sum(
            r["oral_rt_intake_ml"] + r["iv_fluid_intake_ml"] + r["blood_products_ml"] for r in records
        )
        cum_output = sum(
            r["urine_output_ml"] + r["vomitus_rt_aspirate_ml"] + r["drain_output_ml"] for r in records
        )

        return {
            "admission_uuid": admission_uuid,
            "total_records": len(records),
            "cumulative_intake_ml": cum_intake,
            "cumulative_output_ml": cum_output,
            "cumulative_net_balance_ml": cum_intake - cum_output,
            "records": records,
        }
