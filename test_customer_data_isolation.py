"""
EstateFlow — Customer Data Isolation & Cross-Tenant Security Audit
===================================================================
Explicit tests verifying RBAC and tenant boundary enforcement:
1. Customer A -> Customer B booking (IDOR)
2. Customer A -> Customer B site visit (IDOR)
3. Customer A -> Customer B sensitive KYC document (IDOR)
4. Customer A -> Customer B booking payment (IDOR)
5. Customer A -> Customer B profile isolation
6. Customer A -> Admin notification feed (Privilege escalation)
7. Unauthenticated -> Private KYC document (Unauthenticated access)
"""
import uuid
import pytest
from fastapi.testclient import TestClient
from server.main import app
from server.config.database import SessionLocal
from server.models.user import User, UserRole
from server.models.customer import Customer
from server.models.booking import Booking, BookingStatus, BookingDocument
from server.models.site_visit import SiteVisit, VisitStatus
from server.models.property import Property
from server.core.security import get_password_hash, create_access_token

client = TestClient(app)

def test_cross_customer_data_isolation():
    db = SessionLocal()
    try:
        # 1. Setup Property
        prop = db.query(Property).first()
        assert prop is not None, "At least one property must exist in database"

        # 2. Setup Customer A & Customer B
        email_a = f"customer_a_{uuid.uuid4().hex[:8]}@estateflow.test"
        email_b = f"customer_b_{uuid.uuid4().hex[:8]}@estateflow.test"

        user_a = User(
            id=str(uuid.uuid4()),
            email=email_a,
            password_hash=get_password_hash("SecretPass123!"),
            full_name="Alice Customer",
            role=UserRole.customer,
            is_active=True,
            is_verified=True,
        )
        user_b = User(
            id=str(uuid.uuid4()),
            email=email_b,
            password_hash=get_password_hash("SecretPass123!"),
            full_name="Bob Customer",
            role=UserRole.customer,
            is_active=True,
            is_verified=True,
        )
        db.add_all([user_a, user_b])
        db.flush()

        cust_a = Customer(user_id=user_a.id, first_name="Alice", last_name="Customer")
        cust_b = Customer(user_id=user_b.id, first_name="Bob", last_name="Customer")
        db.add_all([cust_a, cust_b])
        db.flush()

        # 3. Create Booking belonging exclusively to Customer B
        booking_b = Booking(
            booking_number=f"EF{uuid.uuid4().hex[:8].upper()}",
            customer_id=user_b.id,
            property_id=prop.id,
            customer_name="Bob Customer",
            customer_email=email_b,
            status=BookingStatus.payment_pending,
            token_amount=25000.0,
        )
        db.add(booking_b)
        db.flush()

        # 4. Create Site Visit belonging exclusively to Customer B
        from datetime import datetime, timedelta
        visit_b = SiteVisit(
            visit_number=f"SV-20260909-{uuid.uuid4().hex[:6].upper()}",
            customer_id=user_b.id,
            property_id=prop.id,
            builder_id=prop.builder_id,
            scheduled_date=datetime.utcnow() + timedelta(days=2),
            status=VisitStatus.scheduled,
        )
        db.add(visit_b)
        db.flush()

        # 5. Create Sensitive KYC Document belonging exclusively to Customer B
        doc_b = BookingDocument(
            uuid=str(uuid.uuid4()),
            customer_id=user_b.id,
            booking_id=booking_b.id,
            property_id=prop.id,
            document_type="aadhaar_card",
            title="Bob KYC Document",
            file_name=f"kyc_bob_{uuid.uuid4().hex[:6]}.pdf",
            file_url=f"/api/files/download/kyc/kyc_bob_{uuid.uuid4().hex[:6]}.pdf",
            storage_path=f"kyc/kyc_bob_{uuid.uuid4().hex[:6]}.pdf",
        )
        db.add(doc_b)
        db.commit()

        # Create auth tokens
        token_a = create_access_token(data={"sub": user_a.id, "email": user_a.email, "role": user_a.role.value})
        headers_a = {"Authorization": f"Bearer {token_a}"}

        print("\n--- Running Customer Data Isolation Audit ---")

        # Attack Vector 1: Customer A attempts to access Customer B's Booking
        res1 = client.get(f"/api/bookings/{booking_b.id}", headers=headers_a)
        print(f"1. Customer A -> Customer B booking: HTTP {res1.status_code}")
        assert res1.status_code in (403, 404), f"Expected 403 or 404, got {res1.status_code}"

        # Attack Vector 2: Customer A attempts to delete/cancel Customer B's Site Visit
        res2_del = client.delete(f"/api/site-visits/{visit_b.id}", headers=headers_a)
        print(f"2a. Customer A -> Cancel Customer B site visit: HTTP {res2_del.status_code}")
        assert res2_del.status_code in (403, 404), f"Expected 403 or 404, got {res2_del.status_code}"

        # Vector 2b: Customer A lists site visits (must not contain Customer B's visit)
        res2_list = client.get("/api/site-visits", headers=headers_a)
        print(f"2b. Customer A -> Site visit list isolation: HTTP {res2_list.status_code}")
        assert res2_list.status_code == 200
        visits_list_a = res2_list.json()
        assert not any(v.get("id") == visit_b.id for v in visits_list_a), "Customer B visit leaked in Customer A list!"

        # Attack Vector 3: Customer A attempts to download Customer B's KYC Document
        res3 = client.get(doc_b.file_url, headers=headers_a)
        print(f"3. Customer A -> Customer B KYC file: HTTP {res3.status_code}")
        assert res3.status_code in (403, 404), f"Expected 403 or 404, got {res3.status_code}"

        # Attack Vector 4: Customer A attempts to trigger payment verification on Customer B's booking
        res4 = client.post(
            f"/api/bookings/{booking_b.id}/verify-payment",
            headers=headers_a,
            json={
                "razorpay_order_id": "order_fake123",
                "razorpay_payment_id": "pay_fake123",
                "razorpay_signature": "sig_fake123",
            }
        )
        print(f"4. Customer A -> Customer B payment verify: HTTP {res4.status_code}")
        assert res4.status_code in (400, 403, 404), f"Expected 400/403/404, got {res4.status_code}"

        # Attack Vector 5: Customer A gets own profile (verifying Customer B data is not leaked)
        res5 = client.get("/api/profile", headers=headers_a)
        print(f"5. Customer A profile check: HTTP {res5.status_code}")
        assert res5.status_code == 200
        profile_data = res5.json()
        assert profile_data.get("email") == email_a
        assert "Bob" not in str(profile_data)

        # Attack Vector 6: Customer A attempts to read Admin Feed
        res6 = client.get("/api/notifications/admin-feed", headers=headers_a)
        print(f"6. Customer A -> Admin feed: HTTP {res6.status_code}")
        assert res6.status_code == 403, f"Expected 403 Forbidden, got {res6.status_code}"

        # Attack Vector 7: Unauthenticated request to private KYC document
        res7 = client.get(doc_b.file_url)
        print(f"7. Unauthenticated -> Private KYC file: HTTP {res7.status_code}")
        assert res7.status_code == 401, f"Expected 401 Unauthorized, got {res7.status_code}"

        print("--- ALL 7 CUSTOMER DATA ISOLATION CHECKS PASSED (100%) ---")

    finally:
        db.close()

if __name__ == "__main__":
    test_cross_customer_data_isolation()
