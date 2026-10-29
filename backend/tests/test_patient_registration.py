import time
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_patient_registration_and_mpi():
    # 1. Login as Receptionist
    login_res = client.post("/api/v1/auth/login", json={
        "username": "reception@brightsolutions.in",
        "password": "Reception@123"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Register unique patient with dynamic suffix
    ts = str(int(time.time() * 1000))[-6:]
    unique_phone = f"9825{ts}"
    unique_aadhaar = f"66{ts}1234"
    payload = {
        "first_name": "Meera",
        "middle_name": "B",
        "last_name": f"Dave{ts}",
        "dob": "1995-11-20",
        "gender": "FEMALE",
        "blood_group": "A+",
        "phone": unique_phone,
        "address_line1": "Flat 301, Gokul Dham",
        "city": "Ahmedabad",
        "state": "Gujarat",
        "postal_code": "380015",
        "aadhaar_number": unique_aadhaar,
        "referred_by": "Dr. Sharma"
    }

    reg_res = client.post("/api/v1/patients", json=payload, headers=headers)
    assert reg_res.status_code == 201
    patient = reg_res.json()["data"]
    assert patient["uhid"].startswith("BS-")
    assert patient["first_name"] == "Meera"
    assert "aadhaar_number" not in patient

    # 3. Duplicate Aadhaar rejection test
    dup_res = client.post("/api/v1/patients", json=payload, headers=headers)
    assert dup_res.status_code == 409
    assert dup_res.json()["detail"]["error"] == "DUPLICATE_AADHAAR"

    # 4. Search by Name
    search_res = client.get("/api/v1/patients/search?q=Meera", headers=headers)
    assert search_res.status_code == 200
    assert any(p["uhid"] == patient["uhid"] for p in search_res.json()["data"])

    # 5. Search by Phone
    search_phone = client.get(f"/api/v1/patients/search?phone={unique_phone}", headers=headers)
    assert search_phone.status_code == 200
    assert any(p["uhid"] == patient["uhid"] for p in search_phone.json()["data"])

    # 6. Retrieve by Public UUID
    get_res = client.get(f"/api/v1/patients/{patient['public_id']}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["data"]["uhid"] == patient["uhid"]

