

"""
EstateFlow - Google OAuth 2.0 Reality & Verification Test Suite
================================================================
Validates:
1. Google OAuth configuration endpoint (/api/auth/google/config)
2. Handling of unconfigured state (clear 400 error message)
3. Handling of missing/invalid Google ID tokens
4. Verification of Google ID token audience against GOOGLE_CLIENT_ID
5. User creation, customer profile initialization, and CRM lead creation
6. Session and JWT token generation
7. Security: GOOGLE_CLIENT_SECRET is NEVER exposed to public endpoints
"""
import sys
import os
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from server.config.database import Base, get_db
from server.main import app
from server.config.settings import settings
from server.models.user import User
from server.models.customer import Customer
from server.models.lead import Lead

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_google_oauth_suite():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    orig_client_id = settings.GOOGLE_CLIENT_ID
    orig_client_secret = settings.GOOGLE_CLIENT_SECRET

    try:
        print("======================================================================")
        print("  ESTATEFLOW GOOGLE OAUTH 2.0 REALITY & VERIFICATION TEST SUITE")
        print("======================================================================")

        # 1. Unconfigured State Check
        settings.GOOGLE_CLIENT_ID = None
        settings.GOOGLE_CLIENT_SECRET = None

        r_cfg = client.get("/api/auth/google/config")
        assert r_cfg.status_code == 200, f"Config endpoint failed: {r_cfg.text}"
        cfg_data = r_cfg.json()
        assert cfg_data["configured"] is False, "Should report configured: False"
        assert cfg_data["client_id"] is None, "Should report client_id: None"
        assert "GOOGLE_CLIENT_SECRET" not in cfg_data, "Secret must never be exposed"
        assert "client_secret" not in cfg_data, "Secret must never be exposed"
        print("  [PASS] 1. Unconfigured Google OAuth Endpoint reports configured: False & client_id: None")

        # 2. Unconfigured Auth Call returns actionable 400
        r_auth_unconfigured = client.post("/api/auth/google", json={"email": "test@example.com"})
        assert r_auth_unconfigured.status_code == 400, f"Expected 400, got {r_auth_unconfigured.status_code}"
        detail = r_auth_unconfigured.json().get("detail", "")
        assert "Google authentication is not configured yet" in detail, f"Unexpected message: {detail}"
        print("  [PASS] 2. Unconfigured OAuth request returns clear, actionable 400 message")

        # 3. Configure Google OAuth credentials
        TEST_CLIENT_ID = "123456789-testestateflow.apps.googleusercontent.com"
        TEST_CLIENT_SECRET = "GOCSPX-SecretMockKeyForTesting123"
        settings.GOOGLE_CLIENT_ID = TEST_CLIENT_ID
        settings.GOOGLE_CLIENT_SECRET = TEST_CLIENT_SECRET

        r_cfg_active = client.get("/api/auth/google/config")
        assert r_cfg_active.status_code == 200
        cfg_active = r_cfg_active.json()
        assert cfg_active["configured"] is True, "Should report configured: True"
        assert cfg_active["client_id"] == TEST_CLIENT_ID, "Should return public client_id"
        assert "client_secret" not in cfg_active, "Secret must never be in response"
        print("  [PASS] 3. Configured Google OAuth returns public client_id without exposing secret")

        # 4. Missing Token Check
        r_missing_token = client.post("/api/auth/google", json={})
        assert r_missing_token.status_code == 400, f"Expected 400, got {r_missing_token.status_code}"
        print("  [PASS] 4. Request without token is rejected with 400 Bad Request")

        # 5. Invalid / Expired Token Check
        with patch("httpx.Client.get") as mock_get:
            mock_resp = MagicMock()
            mock_resp.status_code = 400
            mock_get.return_value = mock_resp

            r_invalid = client.post("/api/auth/google", json={"credential": "invalid_fake_token_123"})
            assert r_invalid.status_code == 401, f"Expected 401 for invalid token, got {r_invalid.status_code}"
            print("  [PASS] 5. Invalid Google token rejected with 401 Unauthorized")

        # 6. Audience Mismatch Check
        with patch("httpx.Client.get") as mock_get:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {
                "aud": "wrong-client-id.apps.googleusercontent.com",
                "email": "hacker@example.com",
                "email_verified": True,
                "name": "Hacker User",
            }
            mock_get.return_value = mock_resp

            r_mismatch = client.post("/api/auth/google", json={"credential": "token_for_other_app"})
            assert r_mismatch.status_code == 401, f"Expected 401 for audience mismatch, got {r_mismatch.status_code}"
            assert "audience mismatch" in r_mismatch.json().get("detail", "").lower()
            print("  [PASS] 6. Token with mismatched audience rejected with 401 Unauthorized")

        # 7. Unverified Email Check
        with patch("httpx.Client.get") as mock_get:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {
                "aud": TEST_CLIENT_ID,
                "email": "unverified@example.com",
                "email_verified": False,
                "name": "Unverified User",
            }
            mock_get.return_value = mock_resp

            r_unverified = client.post("/api/auth/google", json={"credential": "token_unverified_email"})
            assert r_unverified.status_code == 400, f"Expected 400 for unverified email, got {r_unverified.status_code}"
            print("  [PASS] 7. Unverified Google email rejected with 400 Bad Request")

        # 8. Valid Real Google Login & Auto-registration Flow
        with patch("httpx.Client.get") as mock_get:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {
                "aud": TEST_CLIENT_ID,
                "email": "krunal.katware@gmail.com",
                "email_verified": True,
                "given_name": "Krunal",
                "family_name": "Katware",
                "name": "Krunal Katware",
                "picture": "https://lh3.googleusercontent.com/a/ACg8ocITestPhoto",
            }
            mock_get.return_value = mock_resp

            r_success = client.post("/api/auth/google", json={"credential": "valid_signed_google_jwt_credential"})
            assert r_success.status_code == 200, f"Google login failed: {r_success.text}"
            auth_data = r_success.json()
            assert "access_token" in auth_data, "Access token missing"
            assert "refresh_token" in auth_data, "Refresh token missing"
            assert auth_data["user"]["email"] == "krunal.katware@gmail.com"
            print("  [PASS] 8. Valid Google OAuth login generates EstateFlow JWT tokens")

            # 9. Verify Database Records
            db = TestingSessionLocal()
            try:
                user = db.query(User).filter(User.email == "krunal.katware@gmail.com").first()
                assert user is not None, "User record must exist in database"
                assert user.is_verified is True, "Google users are auto-verified"
                assert user.avatar_url == "https://lh3.googleusercontent.com/a/ACg8ocITestPhoto"
                print("  [PASS] 9. User persisted in database with verified status and avatar")

                # 10. Verify Customer Profile
                customer = db.query(Customer).filter(Customer.user_id == user.id).first()
                assert customer is not None, "Customer profile must be created"
                assert customer.first_name == "Krunal"
                assert customer.last_name == "Katware"
                assert customer.avatar_url == "https://lh3.googleusercontent.com/a/ACg8ocITestPhoto"
                print("  [PASS] 10. Customer profile created with verified Google name & picture")

                # 11. Verify CRM Lead Pipeline Sync
                lead = db.query(Lead).filter(Lead.customer_id == user.id).first()
                assert lead is not None, "CRM Lead must be created for Google registered customer"
                assert lead.email == "krunal.katware@gmail.com"
                assert lead.first_name == "Krunal"
                assert lead.last_name == "Katware"
                assert lead.lead_number.startswith("EFL-LD-")
                print(f"  [PASS] 11. CRM Lead pipeline synchronized ({lead.lead_number})")

                # 12. Subsequent Login with Existing Account
                r_subsequent = client.post("/api/auth/google", json={"credential": "valid_signed_google_jwt_credential"})
                assert r_subsequent.status_code == 200
                sub_data = r_subsequent.json()
                assert sub_data["user"]["id"] == user.id
                print("  [PASS] 12. Subsequent Google login successfully authenticates existing account")
            finally:
                db.close()
    finally:
        app.dependency_overrides.clear()
        settings.GOOGLE_CLIENT_ID = orig_client_id
        settings.GOOGLE_CLIENT_SECRET = orig_client_secret

    print("======================================================================")
    print("  ALL 12 GOOGLE OAUTH VERIFICATION CHECKS PASSED (100% SUCCESS)!")
    print("======================================================================")


if __name__ == "__main__":
    test_google_oauth_suite()
