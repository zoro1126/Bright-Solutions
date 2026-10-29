"""
Inpatient (IPD) & Bed Matrix Service
Domain business logic for ward and bed queries, matrix rollups, and bed state management.
"""

from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy import text
from app.core.database import engine


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
            LEFT JOIN ipd_admissions adm ON adm.current_bed_id = b.id AND adm.status = 'ADMITTED'
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
