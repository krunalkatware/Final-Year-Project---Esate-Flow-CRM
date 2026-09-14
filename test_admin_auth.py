"""
Step 1 Admin Auth API Verification Tests
Run from project root: python test_admin_auth.py or python -m pytest test_admin_auth.py
"""
import sys
from fastapi.testclient import TestClient
from server.main import app

def test_admin_auth_flow():
    with TestClient(app) as client:
        print("\n" + "="*60)
        print("  EstateFlow — Step 1 Admin Auth API Tests")
        print("="*60 + "\n")

        # ── Test 1: Valid Login ──────────────────────────────────────────────────────
        print("TEST 1: Login — valid credentials")
        r = client.post("/api/admin/auth/login", json={"email": "admin@estateflow.com", "password": "Admin@123"})
        assert r.status_code == 200, f"Got {r.status_code}: {r.text}"
        data = r.json()
        assert bool(data.get("access_token")), "Missing access_token"
        assert bool(data.get("refresh_token")), "Missing refresh_token"
        assert data.get("user", {}).get("admin_role") == "super_admin"
        assert len(data.get("user", {}).get("permissions", [])) > 0

        access_token = data.get("access_token", "")
        refresh_token = data.get("refresh_token", "")
        auth_headers = {"Authorization": f"Bearer {access_token}"}

        # ── Test 2: GET /me with valid token ─────────────────────────────────────────
        print("TEST 2: GET /me — valid admin token")
        r = client.get("/api/admin/auth/me", headers=auth_headers)
        assert r.status_code == 200, f"Got {r.status_code}"
        me = r.json()
        assert me.get("email") == "admin@estateflow.com"
        assert bool(me.get("admin_role"))
        assert isinstance(me.get("permissions"), list)

        # ── Test 3: Wrong password ───────────────────────────────────────────────────
        print("TEST 3: Login — wrong password")
        r = client.post("/api/admin/auth/login", json={"email": "admin@estateflow.com", "password": "wrongpass"})
        assert r.status_code == 401, f"Got {r.status_code}"
        assert bool(r.json().get("detail") or r.json().get("error"))

        # ── Test 4: Non-existent user ────────────────────────────────────────────────
        print("TEST 4: Login — non-existent email")
        r = client.post("/api/admin/auth/login", json={"email": "nobody@nowhere.com", "password": "test"})
        assert r.status_code == 401, f"Got {r.status_code}"

        # ── Test 5: /me without token ────────────────────────────────────────────────
        print("TEST 5: GET /me — no token")
        r = client.get("/api/admin/auth/me")
        assert r.status_code in (401, 403, 422), f"Got {r.status_code}"

        # ── Test 6: Customer token rejected on admin endpoint ────────────────────────
        print("TEST 6: Customer token rejected on admin /me")
        reg = client.post("/api/auth/register", json={
            "email": "testcust_verify@example.com",
            "password": "Test@123",
            "first_name": "Test",
            "last_name": "Customer"
        })
        if reg.status_code == 200:
            cust_token = reg.json().get("access_token", "")
        else:
            lg = client.post("/api/auth/login", json={"email": "testcust_verify@example.com", "password": "Test@123"})
            cust_token = lg.json().get("access_token", "") if lg.status_code == 200 else ""

        if cust_token:
            r = client.get("/api/admin/auth/me", headers={"Authorization": f"Bearer {cust_token}"})
            assert r.status_code == 403, f"Expected 403, got {r.status_code}"
            detail = r.json().get("detail", "")
            assert "admin" in detail.lower() or "denied" in detail.lower()

        # ── Test 7: Refresh Token ────────────────────────────────────────────────────
        print("TEST 7: Refresh token rotation")
        r = client.post(
            "/api/admin/auth/refresh",
            json={"refresh_token": refresh_token},
            headers=auth_headers
        )
        assert r.status_code == 200, f"Got {r.status_code}: {r.text}"
        new_data = r.json()
        assert bool(new_data.get("access_token"))
        assert bool(new_data.get("refresh_token"))
        assert new_data.get("refresh_token") != refresh_token
        new_access = new_data.get("access_token", "")
        new_refresh = new_data.get("refresh_token", "")

        # ── Test 8: New token works for /me ──────────────────────────────────────────
        print("TEST 8: New access token works after refresh")
        r = client.get("/api/admin/auth/me", headers={"Authorization": f"Bearer {new_access}"})
        assert r.status_code == 200, f"Got {r.status_code}"

        # ── Test 9: Invalid refresh token ────────────────────────────────────────────
        print("TEST 9: Invalid refresh token rejected")
        r = client.post(
            "/api/admin/auth/refresh",
            json={"refresh_token": "thisisnotavalidtoken"},
            headers={"Authorization": f"Bearer {new_access}"}
        )
        assert r.status_code == 401, f"Got {r.status_code}"

        # ── Test 10: Logout ───────────────────────────────────────────────────────────
        print("TEST 10: Logout")
        r = client.post(
            "/api/admin/auth/logout",
            json={"refresh_token": new_refresh},
            headers={"Authorization": f"Bearer {new_access}"}
        )
        assert r.status_code == 200, f"Got {r.status_code}"

        # ── Test 11: Login non-admin user ─────────────────────────────────────────────
        print("TEST 11: Non-admin user blocked from admin login")
        r = client.post("/api/admin/auth/login", json={"email": "testcust_verify@example.com", "password": "Test@123"})
        assert r.status_code == 403, f"Got {r.status_code}"

        print("="*60)
        print("  ALL 11 ADMIN AUTH TESTS PASSED SUCCESSFULLY!")
        print("="*60 + "\n")

if __name__ == "__main__":
    test_admin_auth_flow()
