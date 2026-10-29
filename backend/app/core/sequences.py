from datetime import date, datetime
from typing import Optional
from sqlalchemy import text
from app.core.database import engine

KEY_ALIASES = {
    "OPD_NUMBER": "OPD",
    "IPD_NUMBER": "IPD",
    "INVOICE": "BILL",
    "INVOICE_OPD": "BILL",
}

class SequenceService:
    """
    Concurrency-safe monotonic sequence generator using SELECT ... FOR UPDATE row locks.
    Guarantees gapless numbering under multi-user concurrency for UHID, OPD, IPD, and Invoices.
    """

    @classmethod
    def init_default_sequences(cls, hospital_id: int = 1):
        """Initializes or ensures baseline sequence counters for a hospital tenant."""
        today = date.today()
        defaults = [
            ("UHID", "BS", 1000, 6, "NEVER", None),
            ("OPD", "OPD", 1000, 6, "NEVER", None),
            ("IPD", "IPD", 500, 6, "NEVER", None),
            ("BILL", "INV", 100, 6, "YEARLY", today),
            ("PRESCRIPTION", "RX", 1000, 6, "NEVER", None),
            ("LAB_ORDER", "LAB", 1000, 6, "NEVER", None),
            ("DISPENSATION", "DSP", 1000, 6, "NEVER", None),
            ("PAYMENT", "RCP", 1000, 6, "YEARLY", today)
        ]
        with engine.begin() as conn:
            for key, prefix, val, pad, freq, rst_date in defaults:
                conn.execute(text("""
                    INSERT INTO system_sequences (hospital_id, sequence_key, prefix, current_value, padding_length, reset_frequency, last_reset_date)
                    VALUES (:hid, :key, :prefix, :val, :pad, :freq, :rst)
                    ON DUPLICATE KEY UPDATE
                        prefix = :prefix,
                        current_value = :val,
                        padding_length = :pad,
                        reset_frequency = :freq,
                        last_reset_date = :rst;
                """), {"hid": hospital_id, "key": key, "prefix": prefix, "val": val, "pad": pad, "freq": freq, "rst": rst_date})

    @classmethod
    def get_next_sequence(cls, sequence_key: str, tenant_id: int = 1, conn=None) -> str:
        """
        Locks the sequence counter row with SELECT ... FOR UPDATE, increments, and returns
        the next formatted sequence string (e.g. 'BS-001001', 'OPD-001001', 'IPD-000501').
        """
        clean_key = sequence_key.strip().upper()
        if clean_key in KEY_ALIASES:
            clean_key = KEY_ALIASES[clean_key]

        if conn is not None:
            return cls._execute_increment(conn, clean_key, tenant_id)

        with engine.begin() as local_conn:
            return cls._execute_increment(local_conn, clean_key, tenant_id)

    @classmethod
    def _execute_increment(cls, conn, clean_key: str, tenant_id: int) -> str:
        row = conn.execute(text("""
            SELECT id, prefix, current_value, padding_length, reset_frequency, last_reset_date
            FROM system_sequences
            WHERE hospital_id = :hid AND sequence_key = :key
            FOR UPDATE
        """), {"hid": tenant_id, "key": clean_key}).fetchone()

        if not row:
            # Fallback to alias if present or insert default
            cls.init_default_sequences(tenant_id)
            row = conn.execute(text("""
                SELECT id, prefix, current_value, padding_length, reset_frequency, last_reset_date
                FROM system_sequences
                WHERE hospital_id = :hid AND sequence_key = :key
                FOR UPDATE
            """), {"hid": tenant_id, "key": clean_key}).fetchone()

        today = date.today()
        current_val = row.current_value
        reset_freq = row.reset_frequency
        last_reset = row.last_reset_date
        new_val = current_val + 1
        new_reset_date = last_reset

        # Handle periodic reset rules
        if reset_freq == "YEARLY":
            if last_reset is None or last_reset.year < today.year:
                new_val = 1
                new_reset_date = today
        elif reset_freq == "DAILY":
            if last_reset is None or last_reset < today:
                new_val = 1
                new_reset_date = today

        # Persist updated sequence counter
        conn.execute(text("""
            UPDATE system_sequences
            SET current_value = :val, last_reset_date = :rst_date, updated_at = NOW()
            WHERE id = :id
        """), {"val": new_val, "rst_date": new_reset_date, "id": row.id})

        pad = row.padding_length
        formatted_num = str(new_val).zfill(pad)
        prefix = row.prefix.rstrip("-")
        return f"{prefix}-{formatted_num}"

    @classmethod
    def peek_current_sequence(cls, sequence_key: str, tenant_id: int = 1) -> str:
        """Read-only query of the current sequence string without incrementing."""
        clean_key = sequence_key.strip().upper()
        if clean_key in KEY_ALIASES:
            clean_key = KEY_ALIASES[clean_key]

        with engine.connect() as conn:
            row = conn.execute(text("""
                SELECT prefix, current_value, padding_length
                FROM system_sequences
                WHERE hospital_id = :hid AND sequence_key = :key
            """), {"hid": tenant_id, "key": clean_key}).fetchone()

            if not row:
                return "N/A"

            pad = row.padding_length
            formatted_num = str(row.current_value).zfill(pad)
            prefix = row.prefix.rstrip("-")
            return f"{prefix}-{formatted_num}"
