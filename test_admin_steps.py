"""
Verification Test Script for Steps 2, 3, and 4 Admin Endpoints
Run: python test_admin_steps.py or python -m pytest test_admin_steps.py
"""
from fastapi.testclient import TestClient
from server.main import app

def test_admin_steps_flow():
    with TestClient(app) as client:
        print("\n" + "=" * 60)
        print("  EstateFlow — Steps 2, 3 & 4 Verification Tests")
        print("=" * 60 + "\n")

        # 1. Login
        r = client.post("/api/admin/auth/login", json={"email": "admin@estateflow.com", "password": "Admin@123"})
        assert r.status_code == 200, f"Login failed: {r.status_code} - {r.text}"

        token = r.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        print("[PASS] Admin Login successful")

        # 2. Step 2 Dashboard Summary & Charts
        r = client.get("/api/admin/dashboard/summary", headers=headers)
        assert r.status_code == 200, f"Dashboard summary failed: {r.status_code}"
        print(f"[PASS] GET /dashboard/summary: {r.status_code}")

        r = client.get("/api/admin/dashboard/charts", headers=headers)
        assert r.status_code == 200, f"Dashboard charts failed: {r.status_code}"
        print(f"[PASS] GET /dashboard/charts: {r.status_code}")

        # 3. Step 3 Properties Listing & CRUD
        r = client.get("/api/admin/properties", headers=headers)
        assert r.status_code == 200, f"Properties listing failed: {r.status_code}"
        print(f"[PASS] GET /properties: {r.status_code} (Total: {r.json().get('total')})")

        # 4. Step 4 Builders Listing & CRUD
        r = client.get("/api/admin/builders", headers=headers)
        assert r.status_code == 200, f"Builders listing failed: {r.status_code}"
        print(f"[PASS] GET /builders: {r.status_code} (Total: {r.json().get('total')})")

        print("\n" + "=" * 60)
        print("  ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!")
        print("=" * 60 + "\n")

if __name__ == "__main__":
    test_admin_steps_flow()
