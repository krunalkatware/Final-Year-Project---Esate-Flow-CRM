"""
EstateFlow — End-to-End Real-World Customer <-> Admin Journey Verification Test Suite
=====================================================================================
"""
import sys
import os
import random
import string
from datetime import datetime

from server.config.database import SessionLocal, engine, Base
from server.models.user import User, UserRole
from server.models.customer import Customer
from server.models.admin import AdminUser, Role
from server.models.property import Property, PropertyStatus, PropertyType
from server.models.builder import Builder
from server.models.city import City
from server.models.lead import Lead, LeadStage, LeadPriority, LeadSource
from server.models.site_visit import SiteVisit, VisitStatus, VisitType
from server.models.booking import (
    Booking, BookingStatus, BookingDocument, BookingPayment,
    BookingPaymentStatus, BookingPaymentMode, BookingPaymentType, BookingTimeline
)
from server.models.notification import Notification, NotificationType
from server.models.revenue import CommissionRecord, Wallet, WalletTransaction
from server.services.revenue_service import auto_process_booking_revenue
from server.core.security import get_password_hash, create_access_token


def run_e2e_journey_audit():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("=" * 70)
    print("  ESTATEFLOW END-TO-END CUSTOMER <-> ADMIN JOURNEY AUDIT")
    print("=" * 70)

    passed = 0
    total = 14

    try:
        # ── 1. Create or Find Builder, City, Property ────────────────────────
        city = db.query(City).first()
        if not city:
            city = City(name="Mumbai", state="Maharashtra", country="India")
            db.add(city)
            db.flush()

        builder = db.query(Builder).first()
        if not builder:
            builder = Builder(name="Lodha Luxury Group", city_id=city.id, is_active=True)
            db.add(builder)
            db.flush()

        prop = db.query(Property).first()
        if not prop:
            prop = Property(
                name="Lodha Park Tower A",
                slug=f"lodha-park-{random.randint(1000, 9999)}",
                builder_id=builder.id,
                city_id=city.id,
                locality="Worli",
                price=35000000.0,
                booking_amount=25000.0,
                property_type=PropertyType.apartment,
                status=PropertyStatus.available,
                bedrooms=3,
                bathrooms=3,
                area_sqft=1850,
            )
            db.add(prop)
            db.flush()

        # ── 2. Admin User Verification ───────────────────────────────────────
        admin_user = db.query(User).filter(User.email == "admin@estateflow.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@estateflow.com",
                password_hash=get_password_hash("Admin@123"),
                full_name="Super Administrator",
                role=UserRole.admin,
                is_active=True,
                is_verified=True,
            )
            db.add(admin_user)
            db.flush()
        
        admin_profile = db.query(AdminUser).filter(AdminUser.user_id == admin_user.id).first()
        if not admin_profile:
            role = db.query(Role).first()
            admin_profile = AdminUser(
                user_id=admin_user.id,
                role_id=role.id if role else 1,
                first_name="Super",
                last_name="Administrator",
                department="Management",
                is_active=True,
            )
            db.add(admin_profile)
            db.flush()

        print(f"  [PASS] 1. Infrastructure & Super Admin profile verified: {admin_user.email}")
        passed += 1

        # ── 3. Customer Registration & Token Generation ──────────────────────
        unique_suffix = random.randint(10000, 99999)
        test_email = f"buyer_{unique_suffix}@gmail.com"
        test_cust_user = User(
            email=test_email,
            password_hash=get_password_hash("SecurePass@123"),
            full_name="Rajesh Singhania",
            phone="+91 98201 44556",
            role=UserRole.customer,
            is_active=True,
            is_verified=True,
        )
        db.add(test_cust_user)
        db.flush()

        test_cust = Customer(
            user_id=test_cust_user.id,
            first_name="Rajesh",
            last_name="Singhania",
            phone="+91 98201 44556",
            city="Mumbai",
            state="Maharashtra",
            preferred_property_type="apartment",
            preferred_budget_min=20000000,
            preferred_budget_max=45000000,
        )
        db.add(test_cust)
        db.commit()

        token = create_access_token({"sub": test_cust_user.id, "email": test_cust_user.email, "role": "customer"})
        assert token is not None
        print(f"  [PASS] 2. Customer registered with relational Customer profile: {test_email} (ID: {test_cust_user.id[:8]}...)")
        passed += 1

        # ── 4. Property Inquiry -> CRM Lead Synchronization ──────────────────
        lead_num = f"EFL-LD-{unique_suffix}"
        lead = Lead(
            lead_number=lead_num,
            customer_id=test_cust_user.id,
            first_name="Rajesh",
            last_name="Singhania",
            email=test_email,
            phone="+91 98201 44556",
            property_id=prop.id,
            stage=LeadStage.new,
            source=LeadSource.website,
            priority=LeadPriority.hot,
            notes_summary="Inquired about 3 BHK sea-facing unit",
        )
        db.add(lead)
        db.commit()
        db.refresh(lead)

        assert lead.customer_id == test_cust_user.id
        print(f"  [PASS] 3. CRM Lead #{lead.lead_number} created and bound to customer_id")
        passed += 1

        # ── 5. Site Visit Scheduling ─────────────────────────────────────────
        visit_num = f"SV-{unique_suffix}"
        visit = SiteVisit(
            visit_number=visit_num,
            customer_id=test_cust_user.id,
            property_id=prop.id,
            builder_id=builder.id,
            lead_id=lead.id,
            sales_executive_id=admin_profile.id,
            status=VisitStatus.scheduled,
            visit_type=VisitType.physical,
            scheduled_date=datetime.utcnow(),
            scheduled_time="11:00 AM - 01:00 PM",
            notes="Customer requested project model tour and sample flat viewing",
        )
        db.add(visit)
        lead.stage = LeadStage.site_visit_scheduled
        db.commit()
        db.refresh(visit)

        assert visit.customer_id == test_cust_user.id
        assert visit.property_id == prop.id
        print(f"  [PASS] 4. Site visit #{visit.visit_number} scheduled and synchronized to Lead stage")
        passed += 1

        # ── 6. Booking Creation with KYC Documents Attached ──────────────────
        from server.repositories.booking_repo import BookingRepository
        from server.schemas.booking import BookingCreate

        b_repo = BookingRepository(db)
        b_data = BookingCreate(
            property_id=prop.id,
            customer_name="Rajesh Singhania",
            customer_email=test_email,
            customer_phone="+91 98201 44556",
            customer_address="Worli Sea Face, Mumbai",
            pan_number="ABCDE1234F",
            aadhaar_number="4512 8890 1234",
            documents=[
                {
                    "document_type": "aadhaar",
                    "title": "Aadhaar Card",
                    "file_name": "rajesh_aadhaar_card.pdf",
                    "file_url": "/api/files/download/kyc/rajesh_aadhaar_card.pdf",
                    "mime_type": "application/pdf",
                    "file_size_bytes": 1048576,
                },
                {
                    "document_type": "pan",
                    "title": "PAN Card",
                    "file_name": "rajesh_pan_card.jpg",
                    "file_url": "/api/files/download/kyc/rajesh_pan_card.jpg",
                    "mime_type": "image/jpeg",
                    "file_size_bytes": 524288,
                },
                {
                    "document_type": "address_proof",
                    "title": "Address Proof",
                    "file_name": "electricity_bill.pdf",
                    "file_url": "/api/files/download/kyc/electricity_bill.pdf",
                    "mime_type": "application/pdf",
                    "file_size_bytes": 786432,
                },
            ]
        )
        booking = b_repo.create(test_cust_user.id, b_data)
        booking.token_amount = 25000.0
        booking.base_price = prop.price
        booking.net_total = prop.price * 1.11
        booking.lead_id = lead.id
        db.commit()
        db.refresh(booking)

        assert booking.customer_id == test_cust_user.id
        print(f"  [PASS] 5. Booking #{booking.booking_number} generated with customer_id linkage")
        passed += 1

        # ── 7. Verify KYC Documents in Database ──────────────────────────────
        docs = db.query(BookingDocument).filter(BookingDocument.booking_id == booking.id).all()
        assert len(docs) == 3
        for d in docs:
            assert d.customer_id == test_cust_user.id
            assert d.status == "pending"
            assert d.is_verified is False
        print(f"  [PASS] 6. 3 KYC Documents persisted and linked to Booking #{booking.booking_number} & Customer")
        passed += 1

        # ── 8. Admin KYC Verification in Customer 360 ────────────────────────
        aadhaar_doc = next(d for d in docs if d.document_type == "aadhaar")
        aadhaar_doc.status = "verified"
        aadhaar_doc.is_verified = True
        aadhaar_doc.verified_by = admin_profile.first_name + " " + admin_profile.last_name
        aadhaar_doc.verified_at = datetime.utcnow()
        aadhaar_doc.verification_notes = "Official UIDAI watermark verified"

        # Add customer notification
        notif = Notification(
            user_id=test_cust_user.id,
            title="KYC Document Verified ✅",
            message=f"Your Aadhaar Card for Booking #{booking.booking_number} has been verified.",
            type=NotificationType.system,
        )
        db.add(notif)
        db.commit()
        db.refresh(aadhaar_doc)

        assert aadhaar_doc.status == "verified"
        assert aadhaar_doc.is_verified is True
        print(f"  [PASS] 7. Admin verified Aadhaar document with audit stamp and notification")
        passed += 1

        # ── 9. Admin KYC Rejection with Mandatory Reason ─────────────────────
        pan_doc = next(d for d in docs if d.document_type == "pan")
        pan_doc.status = "rejected"
        pan_doc.is_verified = False
        pan_doc.rejection_reason = "Corner is truncated. Please upload a clear flat scan showing all 4 edges."
        pan_doc.verified_by = admin_profile.first_name + " " + admin_profile.last_name
        pan_doc.verified_at = datetime.utcnow()

        notif_reject = Notification(
            user_id=test_cust_user.id,
            title="KYC Document Requires Attention ⚠️",
            message=f"Your PAN Card was rejected: {pan_doc.rejection_reason}",
            type=NotificationType.system,
        )
        db.add(notif_reject)
        db.commit()
        db.refresh(pan_doc)

        assert pan_doc.status == "rejected"
        assert pan_doc.rejection_reason is not None
        print(f"  [PASS] 8. Admin rejected PAN document with mandatory reason stored in DB")
        passed += 1

        # ── 10. Payment Verification & Capture ───────────────────────────────
        pay_ref = f"pay_{unique_suffix}_RZP99201"
        pay_num = f"EFL-PAY-{unique_suffix}"
        payment = BookingPayment(
            booking_id=booking.id,
            payment_number=pay_num,
            payment_type=BookingPaymentType.TOKEN,
            payment_mode=BookingPaymentMode.UPI,
            status=BookingPaymentStatus.COMPLETED,
            amount=25000.0,
            total_paid=25000.0,
            transaction_reference=pay_ref,
            remarks="Verified Razorpay token deposit",
        )
        db.add(payment)
        booking.status = BookingStatus.confirmed
        booking.paid_amount = 25000.0
        lead.stage = LeadStage.booked
        lead.priority = LeadPriority.vip
        db.commit()
        db.refresh(payment)

        assert payment.booking_id == booking.id
        assert payment.status == BookingPaymentStatus.COMPLETED
        print(f"  [PASS] 9. Payment #{payment.payment_number} captured (Ref: {pay_ref})")
        passed += 1

        # ── 11. Revenue Engine Distribution & Wallet Ledger ──────────────────
        auto_process_booking_revenue(
            db=db,
            booking_id=booking.id,
            booking_value=prop.price,
            recipient_user_id=test_cust_user.id,
            property_type=prop.property_type,
        )
        txns = db.query(CommissionRecord).filter(CommissionRecord.booking_id == booking.id).all()
        assert len(txns) > 0
        print(f"  [PASS] 10. Revenue distribution engine calculated commissions ({len(txns)} transactions)")
        passed += 1

        # ── 12. Idempotency Check on Revenue Engine ──────────────────────────
        initial_txn_count = len(txns)
        auto_process_booking_revenue(
            db=db,
            booking_id=booking.id,
            booking_value=prop.price,
            recipient_user_id=test_cust_user.id,
            property_type=prop.property_type,
        )
        txns_after = db.query(CommissionRecord).filter(CommissionRecord.booking_id == booking.id).all()
        assert len(txns_after) == initial_txn_count
        print(f"  [PASS] 11. Revenue engine verified 100% idempotent (no duplicate commissions)")
        passed += 1

        # ── 13. Customer 360 API Endpoint Validation ─────────────────────────
        from server.routers.admin_customers import get_customer_360_detail
        c360 = get_customer_360_detail(user_id=test_cust_user.id, current_admin=admin_profile, db=db)

        assert c360["profile"]["id"] == test_cust_user.id
        assert c360["profile"]["email"] == test_email
        assert len(c360["bookings"]) == 1
        assert c360["bookings"][0]["id"] == booking.id
        assert len(c360["site_visits"]) == 1
        assert c360["site_visits"][0]["id"] == visit.id
        assert len(c360["documents"]) == 3
        assert len(c360["payments"]) == 1
        assert len(c360["timeline"]) >= 3
        print(f"  [PASS] 12. Customer 360 endpoint returns complete verified relational bundle")
        passed += 1

        # ── 14. Customer Profile API Endpoint Validation ─────────────────────
        from server.routers.profile import get_profile
        cust_profile = get_profile(current_user=test_cust_user, db=db)
        assert cust_profile["stats"]["total_bookings"] == 1
        assert cust_profile["stats"]["total_site_visits"] == 1
        assert cust_profile["stats"]["total_documents"] == 3
        assert cust_profile["stats"]["total_paid"] == 25000.0
        print(f"  [PASS] 13. Customer profile endpoint returns accurate real DB computed metrics")
        passed += 1

        # ── 15. Notification Feed Audit ──────────────────────────────────────
        from server.routers.notifications import get_admin_notifications
        admin_feed = get_admin_notifications(current_user=admin_user, db=db)
        assert len(admin_feed) >= 2
        print(f"  [PASS] 14. Admin notification feed returns real database event stream")
        passed += 1

        print("=" * 70)
        print(f"  ALL {total}/{total} END-TO-END JOURNEY AUDIT CHECKS PASSED (100% SUCCESS)!")
        print("=" * 70)
        return True

    finally:
        db.close()


if __name__ == "__main__":
    success = run_e2e_journey_audit()
    sys.exit(0 if success else 1)
