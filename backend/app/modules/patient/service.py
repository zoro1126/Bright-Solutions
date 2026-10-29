import hmac
import hashlib
import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from sqlalchemy import text
from fastapi import HTTPException, status

from app.core.config import settings
from app.core.database import engine
from app.core.sequences import SequenceService
from app.modules.patient.schemas import PatientCreateRequest

class PatientService:
    @staticmethod
    def compute_aadhaar_hash(aadhaar_raw: str) -> str:
        """
        Computes an irreversible HMAC-SHA-256 hash using the server SECRET_KEY.
        Enables DPDP-compliant duplicate detection without persisting raw Aadhaar numbers.
        """
        clean = aadhaar_raw.strip().replace(" ", "").replace("-", "")
        return hmac.new(settings.SECRET_KEY.encode("utf-8"), clean.encode("utf-8"), hashlib.sha256).hexdigest()

    @classmethod
    def register_patient(cls, req: PatientCreateRequest, hospital_id: int = 1) -> Dict[str, Any]:
        """
        Registers a new patient in the Master Patient Index (MPI), enforces zero-duplicate checks
        against Aadhaar hash and demographic tuples, and issues a gapless sequential UHID.
        """
        aadhaar_hash: Optional[str] = None
        if req.aadhaar_number:
            aadhaar_hash = cls.compute_aadhaar_hash(req.aadhaar_number)

        with engine.begin() as conn:
            # 1. DPDP Duplicate Check via Aadhaar HMAC
            if aadhaar_hash:
                existing_aadhaar = conn.execute(text("""
                    SELECT uhid, first_name, last_name FROM patients
                    WHERE hospital_id = :hid AND aadhaar_hash = :ahash AND deleted_at IS NULL
                    LIMIT 1
                """), {"hid": hospital_id, "ahash": aadhaar_hash}).mappings().first()

                if existing_aadhaar:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail={
                            "error": "DUPLICATE_AADHAAR",
                            "message": f"Patient already registered with UHID '{existing_aadhaar['uhid']}' ({existing_aadhaar['first_name']} {existing_aadhaar['last_name']}).",
                            "existing_uhid": existing_aadhaar["uhid"]
                        }
                    )

            # 2. Demographic Duplicate Safety Check (Phone + Name + DOB)
            existing_demo = conn.execute(text("""
                SELECT uhid, first_name, last_name FROM patients
                WHERE hospital_id = :hid AND phone = :phone AND first_name = :fname AND last_name = :lname AND dob = :dob AND deleted_at IS NULL
                LIMIT 1
            """), {
                "hid": hospital_id,
                "phone": req.phone.strip(),
                "fname": req.first_name.strip(),
                "lname": req.last_name.strip(),
                "dob": req.dob
            }).mappings().first()

            if existing_demo:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "error": "DUPLICATE_PATIENT",
                        "message": f"Patient with matching phone and demographic profile already exists under UHID '{existing_demo['uhid']}'.",
                        "existing_uhid": existing_demo["uhid"]
                    }
                )

            # 3. Monotonic Gapless Sequence Allocation
            uhid = SequenceService.get_next_sequence("UHID", hospital_id, conn=conn)
            public_id = str(uuid.uuid4())

            # 4. Insert Patient Record
            insert_stmt = text("""
                INSERT INTO patients (
                    public_id, hospital_id, uhid,
                    first_name, middle_name, last_name, dob, gender, blood_group,
                    phone, alternate_phone, email,
                    address_line1, address_line2, city, state, postal_code,
                    aadhaar_hash, abha_id, abha_number,
                    emergency_contact_name, emergency_contact_relation, emergency_contact_phone,
                    referred_by, is_active
                ) VALUES (
                    :pid, :hid, :uhid,
                    :fname, :mname, :lname, :dob, :gender, :bgroup,
                    :phone, :alt_phone, :email,
                    :addr1, :addr2, :city, :state, :pcode,
                    :ahash, :abha_id, :abha_num,
                    :ec_name, :ec_rel, :ec_phone,
                    :ref_by, 1
                )
            """)

            conn.execute(insert_stmt, {
                "pid": public_id,
                "hid": hospital_id,
                "uhid": uhid,
                "fname": req.first_name.strip(),
                "mname": req.middle_name.strip() if req.middle_name else None,
                "lname": req.last_name.strip(),
                "dob": req.dob,
                "gender": req.gender,
                "bgroup": req.blood_group,
                "phone": req.phone.strip(),
                "alt_phone": req.alternate_phone.strip() if req.alternate_phone else None,
                "email": str(req.email).strip() if req.email else None,
                "addr1": req.address_line1.strip(),
                "addr2": req.address_line2.strip() if req.address_line2 else None,
                "city": req.city.strip(),
                "state": req.state.strip(),
                "pcode": req.postal_code.strip(),
                "ahash": aadhaar_hash,
                "abha_id": req.abha_id.strip() if req.abha_id else None,
                "abha_num": req.abha_number.strip() if req.abha_number else None,
                "ec_name": req.emergency_contact_name.strip() if req.emergency_contact_name else None,
                "ec_rel": req.emergency_contact_relation.strip() if req.emergency_contact_relation else None,
                "ec_phone": req.emergency_contact_phone.strip() if req.emergency_contact_phone else None,
                "ref_by": req.referred_by.strip() if req.referred_by else None
            })

        return cls.get_patient_by_uuid(public_id, hospital_id)

    @classmethod
    def get_patient_by_uuid(cls, public_id: str, hospital_id: int = 1) -> Dict[str, Any]:
        """Retrieves a single patient record by public UUID."""
        with engine.connect() as conn:
            row = conn.execute(text("""
                SELECT * FROM patients
                WHERE public_id = :pid AND hospital_id = :hid AND deleted_at IS NULL
            """), {"pid": public_id, "hid": hospital_id}).mappings().first()

            if not row:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient record not found")

            return cls._serialize_patient(row)

    @classmethod
    def search_patients(
        cls,
        hospital_id: int = 1,
        q: Optional[str] = None,
        phone: Optional[str] = None,
        uhid: Optional[str] = None,
        aadhaar_number: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """
        Executes a high-performance Master Patient Index (MPI) search across UHID, phone, name,
        and Aadhaar HMAC hash with pagination.
        """
        clauses = ["hospital_id = :hid", "deleted_at IS NULL"]
        params: Dict[str, Any] = {"hid": hospital_id}

        if aadhaar_number:
            params["ahash"] = cls.compute_aadhaar_hash(aadhaar_number)
            clauses.append("aadhaar_hash = :ahash")
        elif uhid:
            params["uhid"] = f"%{uhid.strip()}%"
            clauses.append("uhid LIKE :uhid")
        elif phone:
            params["phone"] = f"%{phone.strip()}%"
            clauses.append("phone LIKE :phone")
        elif q:
            term = f"%{q.strip()}%"
            params["q"] = term
            clauses.append("""(
                uhid LIKE :q
                OR phone LIKE :q
                OR first_name LIKE :q
                OR last_name LIKE :q
                OR CONCAT(first_name, ' ', last_name) LIKE :q
            )""")

        where_sql = " AND ".join(clauses)
        offset = (page - 1) * page_size
        params["limit"] = page_size
        params["offset"] = offset

        with engine.connect() as conn:
            total_count = conn.execute(
                text(f"SELECT COUNT(*) as total FROM patients WHERE {where_sql}"),
                params
            ).scalar() or 0

            rows = conn.execute(text(f"""
                SELECT * FROM patients
                WHERE {where_sql}
                ORDER BY id DESC
                LIMIT :limit OFFSET :offset
            """), params).mappings().all()

            items = [cls._serialize_patient(row) for row in rows]

            return {
                "success": True,
                "data": items,
                "meta": {
                    "total": total_count,
                    "page": page,
                    "page_size": page_size,
                    "total_pages": (total_count + page_size - 1) // page_size if total_count > 0 else 1
                }
            }

    @staticmethod
    def _serialize_patient(row: Dict[str, Any]) -> Dict[str, Any]:
        """Formats database patient record into API envelope representation."""
        fname = row.get("first_name", "")
        mname = row.get("middle_name")
        lname = row.get("last_name", "")
        full_name = f"{fname} {mname} {lname}".replace("  ", " ").strip() if mname else f"{fname} {lname}".strip()

        dob_val = row.get("dob")
        dob_str = dob_val.isoformat() if isinstance(dob_val, (date, datetime)) else str(dob_val)

        created_at_val = row.get("created_at")
        created_str = created_at_val.isoformat() if isinstance(created_at_val, (date, datetime)) else str(created_at_val)

        return {
            "public_id": row["public_id"],
            "uhid": row["uhid"],
            "full_name": full_name,
            "first_name": fname,
            "middle_name": mname,
            "last_name": lname,
            "dob": dob_str,
            "gender": row["gender"],
            "blood_group": row["blood_group"],
            "phone": row["phone"],
            "alternate_phone": row.get("alternate_phone"),
            "email": row.get("email"),
            "address_line1": row["address_line1"],
            "address_line2": row.get("address_line2"),
            "city": row["city"],
            "state": row["state"],
            "postal_code": row["postal_code"],
            "abha_id": row.get("abha_id"),
            "abha_number": row.get("abha_number"),
            "emergency_contact_name": row.get("emergency_contact_name"),
            "emergency_contact_relation": row.get("emergency_contact_relation"),
            "emergency_contact_phone": row.get("emergency_contact_phone"),
            "referred_by": row.get("referred_by"),
            "is_active": bool(row.get("is_active", 1)),
            "created_at": created_str
        }

