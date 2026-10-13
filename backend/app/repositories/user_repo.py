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
    def get_by_id(user_id: int) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, username, password_hash, full_name, role, email, phone, is_active
                    FROM users
                    WHERE id = %s AND is_active = 1;
                """, (user_id,))
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
