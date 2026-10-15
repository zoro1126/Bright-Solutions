from typing import Optional, List, Dict, Any
from app.core.database import get_connection

class UserRepository:
    @staticmethod
    def get_by_username(username: str) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, username, password_hash, full_name, role, email, phone, is_active
                    FROM users
                    WHERE LOWER(username) = LOWER(%s) AND is_active = 1;
                """, (username.strip(),))
                return cur.fetchone()
        finally:
            conn.close()

    @staticmethod
    def get_by_id(user_id: int, only_active: bool = False) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                query = """
                    SELECT id, username, password_hash, full_name, role, email, phone, is_active
                    FROM users
                    WHERE id = %s
                """
                if only_active:
                    query += " AND is_active = 1"
                query += ";"
                cur.execute(query, (user_id,))
                return cur.fetchone()
        finally:
            conn.close()

    @staticmethod
    def list_active_users() -> List[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, username, full_name, role, email, phone, is_active 
                    FROM users 
                    WHERE is_active = 1
                    ORDER BY FIELD(role, 'RECEPTIONIST', 'DOCTOR', 'CASHIER', 'ADMIN'), full_name ASC;
                """)
                return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def list_active_doctors() -> List[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, username, full_name, role, email, phone 
                    FROM users 
                    WHERE role = 'DOCTOR' AND is_active = 1
                    ORDER BY full_name ASC;
                """)
                return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def create_user(username: str, password_hash: str, full_name: str, role: str, email: Optional[str], phone: Optional[str]) -> int:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO users (username, password_hash, full_name, role, email, phone, is_active)
                    VALUES (%s, %s, %s, %s, %s, %s, 1);
                """, (username.strip().lower(), password_hash, full_name.strip(), role.upper(), email, phone))
                return cur.lastrowid
        finally:
            conn.close()

    @staticmethod
    def update_password(user_id: int, new_password_hash: str) -> bool:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE users 
                    SET password_hash = %s, updated_at = NOW()
                    WHERE id = %s;
                """, (new_password_hash, user_id))
                return cur.rowcount > 0
        finally:
            conn.close()

    @staticmethod
    def update_status(user_id: int, is_active: bool) -> bool:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE users 
                    SET is_active = %s, updated_at = NOW()
                    WHERE id = %s;
                """, (1 if is_active else 0, user_id))
                return cur.rowcount > 0
        finally:
            conn.close()

    @staticmethod
    def list_all_staff() -> List[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, username, full_name, role, email, phone, is_active, created_at, updated_at
                    FROM users
                    ORDER BY FIELD(role, 'ADMIN', 'DOCTOR', 'RECEPTIONIST', 'CASHIER'), full_name ASC;
                """)
                return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def get_default_receptionist_id() -> Optional[int]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id FROM users 
                    WHERE role = 'RECEPTIONIST' AND is_active = 1
                    ORDER BY id ASC LIMIT 1;
                """)
                row = cur.fetchone()
                if row:
                    return row["id"]
                cur.execute("SELECT id FROM users WHERE is_active = 1 ORDER BY id ASC LIMIT 1;")
                row = cur.fetchone()
                return row["id"] if row else None
        finally:
            conn.close()

    @staticmethod
    def get_default_doctor() -> Optional[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, full_name FROM users 
                    WHERE role = 'DOCTOR' AND is_active = 1
                    ORDER BY id ASC LIMIT 1;
                """)
                row = cur.fetchone()
                if row:
                    return row
                cur.execute("SELECT id, full_name FROM users WHERE is_active = 1 ORDER BY id ASC LIMIT 1;")
                return cur.fetchone()
        finally:
            conn.close()

    @staticmethod
    def get_default_cashier_id() -> Optional[int]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id FROM users 
                    WHERE role = 'CASHIER' AND is_active = 1
                    ORDER BY id ASC LIMIT 1;
                """)
                row = cur.fetchone()
                if row:
                    return row["id"]
                cur.execute("SELECT id FROM users WHERE is_active = 1 ORDER BY id ASC LIMIT 1;")
                row = cur.fetchone()
                return row["id"] if row else None
        finally:
            conn.close()


