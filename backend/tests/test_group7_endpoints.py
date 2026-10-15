import os
import sys
import unittest
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.database import get_connection

class TestGroup7Endpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                # Clean up any leftover test staff user
                cur.execute("DELETE FROM audit_logs WHERE user_name IN ('test_nurse_grp7', 'dr_test_grp7');")
                cur.execute("DELETE FROM users WHERE username IN ('test_nurse_grp7', 'dr_test_grp7');")
        finally:
            conn.close()

    @classmethod
    def tearDownClass(cls):
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM audit_logs WHERE user_name IN ('test_nurse_grp7', 'dr_test_grp7');")
                cur.execute("DELETE FROM users WHERE username IN ('test_nurse_grp7', 'dr_test_grp7');")
        finally:
            conn.close()

    def test_01_admin_dashboard_and_analytics(self):
        """GET /api/admin/dashboard and /api/admin/analytics return governance KPIs and workload"""
        res = self.client.get("/api/admin/dashboard")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("summary", data)
        self.assertIn("revenue_by_mode", data)
        self.assertIn("doctor_workload", data)
        self.assertIn("recent_activity", data)

        # Check analytics alias
        res_alias = self.client.get("/api/admin/analytics")
        self.assertEqual(res_alias.status_code, 200)
        self.assertEqual(res_alias.json()["summary"]["total_patients"], data["summary"]["total_patients"])

    def test_02_get_staff_directory(self):
        """GET /api/admin/staff returns complete staff list with role ordering and no password hashes"""
        res = self.client.get("/api/admin/staff")
        self.assertEqual(res.status_code, 200)
        staff = res.json()
        self.assertTrue(len(staff) >= 4)
        for s in staff:
            self.assertNotIn("password_hash", s)
            self.assertIn("username", s)
            self.assertIn("role", s)
            self.assertIn("is_active", s)

    def test_03_create_staff_user(self):
        """POST /api/admin/staff provisions staff user with bcrypt encryption and records audit entry"""
        payload = {
            "username": "dr_test_grp7",
            "password": "SecurePassword@123",
            "full_name": "Dr. Sameer Joshi, MD (Neurology)",
            "role": "DOCTOR",
            "email": "sameer@brightsolutions.in",
            "phone": "+919876543299"
        }
        res = self.client.post("/api/admin/staff", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["username"], "dr_test_grp7")
        self.assertEqual(data["role"], "DOCTOR")
        self.assertTrue(data["is_active"])
        TestGroup7Endpoints.created_user_id = data["user_id"]

        # Reject duplicate username
        res_dup = self.client.post("/api/admin/staff", json=payload)
        self.assertEqual(res_dup.status_code, 409)

        # Reject invalid role
        invalid_payload = {**payload, "username": "bad_role_user", "role": "ASTRONAUT"}
        res_invalid = self.client.post("/api/admin/staff", json=invalid_payload)
        self.assertEqual(res_invalid.status_code, 400)

    def test_04_toggle_staff_status(self):
        """PUT /api/admin/staff/{id}/status activates and deactivates staff accounts"""
        user_id = self.created_user_id

        # Deactivate
        res_off = self.client.put(f"/api/admin/staff/{user_id}/status", json={"active": False})
        self.assertEqual(res_off.status_code, 200)
        self.assertFalse(res_off.json()["is_active"])

        # Activate
        res_on = self.client.put(f"/api/admin/staff/{user_id}/status", json={"active": True})
        self.assertEqual(res_on.status_code, 200)
        self.assertTrue(res_on.json()["is_active"])

    def test_05_audit_logs(self):
        """GET /api/admin/audit-logs returns immutable ledger entries with category filters"""
        res = self.client.get("/api/admin/audit-logs?category=USER_AUTH")
        self.assertEqual(res.status_code, 200)
        logs = res.json()
        self.assertTrue(len(logs) > 0)
        first_log = logs[0]
        self.assertEqual(first_log["category"], "USER_AUTH")
        self.assertIn("dr_test_grp7", first_log["details"])

    def test_06_dashboard_stats(self):
        """GET /api/dashboard/stats returns real-time OPD KPI statistics and triage distribution"""
        res = self.client.get("/api/dashboard/stats")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("total_patients", data)
        self.assertIn("today_visits", data)
        self.assertIn("active_doctors", data)
        self.assertIn("next_token", data)
        self.assertIn("bp_breakdown", data)
        self.assertIn("bmi_breakdown", data)
        self.assertIn("recent_patients", data)

if __name__ == "__main__":
    unittest.main()
