"""
Automated Pytest Suite: Bed Occupancy Matrix & Status API (TASK-BE-4.1)
Verifies hierarchical ward/room/bed retrieval, real-time totals, status updates, and safety guards.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def nurse_token(client):
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"username": "nurse.anita@brightsolutions.in", "password": "Nurse@123"},
    )
    assert login_resp.status_code == 200, f"Nurse login failed: {login_resp.text}"
    return login_resp.json()["access_token"]


@pytest.fixture
def doctor_token(client):
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"username": "dr.sharma@brightsolutions.in", "password": "Doctor@123"},
    )
    assert login_resp.status_code == 200, f"Doctor login failed: {login_resp.text}"
    return login_resp.json()["access_token"]


def test_bed_occupancy_matrix_and_status(client, nurse_token, doctor_token):
    # 1. Test unauthenticated request blocked with 401
    unauth_resp = client.get("/api/v1/beds/matrix")
    assert unauth_resp.status_code == 401

    # 2. Test Doctor can read Bed Matrix (ipd:read permission)
    matrix_resp = client.get(
        "/api/v1/beds/matrix",
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert matrix_resp.status_code == 200, matrix_resp.text
    matrix_data = matrix_resp.json()

    assert "summary" in matrix_data
    summary = matrix_data["summary"]
    assert summary["total_beds"] == 20
    assert (
        summary["total_beds"]
        == summary["available_beds"]
        + summary["occupied_beds"]
        + summary["cleaning_beds"]
        + summary["maintenance_beds"]
        + summary["reserved_beds"]
    )
    assert summary["occupancy_rate_percentage"] >= 0.0

    assert "wards" in matrix_data
    wards = matrix_data["wards"]
    assert len(wards) == 4

    # Pick an AVAILABLE bed
    target_bed_uuid = None
    for w in wards:
        for r in w["rooms"]:
            for b in r["beds"]:
                if b["status"] == "AVAILABLE":
                    target_bed_uuid = b["uuid"]
                    break
            if target_bed_uuid:
                break
        if target_bed_uuid:
            break

    assert target_bed_uuid is not None, "At least one AVAILABLE bed required for testing"

    # 3. Test GET /api/v1/wards
    wards_resp = client.get(
        "/api/v1/wards",
        headers={"Authorization": f"Bearer {nurse_token}"},
    )
    assert wards_resp.status_code == 200
    wards_list = wards_resp.json()
    assert len(wards_list) == 4
    for w in wards_list:
        assert "ward_code" in w
        assert "total_beds" in w
        assert w["total_beds"] > 0

    # 4. Test Nurse transitions bed to CLEANING
    patch_resp = client.patch(
        f"/api/v1/beds/{target_bed_uuid}/status",
        headers={"Authorization": f"Bearer {nurse_token}"},
        json={"status": "CLEANING", "notes": "Post-sanitization routine check"},
    )
    assert patch_resp.status_code == 200, patch_resp.text
    updated_bed = patch_resp.json()
    assert updated_bed["uuid"] == target_bed_uuid
    assert updated_bed["status"] == "CLEANING"

    # Verify updated counts in matrix
    matrix_after_patch = client.get(
        "/api/v1/beds/matrix",
        headers={"Authorization": f"Bearer {nurse_token}"},
    ).json()
    assert matrix_after_patch["summary"]["cleaning_beds"] >= 1

    # 5. Guard check: Cannot manually force bed to OCCUPIED
    invalid_occ_resp = client.patch(
        f"/api/v1/beds/{target_bed_uuid}/status",
        headers={"Authorization": f"Bearer {nurse_token}"},
        json={"status": "OCCUPIED"},
    )
    assert invalid_occ_resp.status_code == 400
    assert "Cannot manually set bed to OCCUPIED" in invalid_occ_resp.json()["detail"]

    # 6. Revert bed back to AVAILABLE
    revert_resp = client.patch(
        f"/api/v1/beds/{target_bed_uuid}/status",
        headers={"Authorization": f"Bearer {nurse_token}"},
        json={"status": "AVAILABLE"},
    )
    assert revert_resp.status_code == 200
    assert revert_resp.json()["status"] == "AVAILABLE"

    # 7. 404 on non-existent bed UUID
    nf_resp = client.patch(
        "/api/v1/beds/00000000-0000-0000-0000-000000000000/status",
        headers={"Authorization": f"Bearer {nurse_token}"},
        json={"status": "MAINTENANCE"},
    )
    assert nf_resp.status_code == 404
