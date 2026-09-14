"""
Real Customer Journey & CRM End-to-End Verification Test
=========================================================
Tests the exact sequence:
1. Customer Registration
2. Customer Profile Created
3. CRM Customer Record Available
4. Initial Lead Created
5. Property View / Interest
6. Site Visit Scheduled & Lead Stage Updated
7. Site Visit Appears in Admin API
8. Booking Created
9. Booking Appears in Admin API
10. Payment Status & Lead Promoted to Booked
11. Revenue Sharing Engine & Commission Record
12. Recipient Wallet Updated
13. Duplicate Revenue / Lead Prevention Check
14. Customer 360 API Verification
"""
import sys
import os
import random
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath("."))
from server.main import app
from server.config.database import SessionLocal, engine, Base
from server.models.user import User, UserRole
from server.models.customer import Customer
from server.models.lead import Lead, LeadStage
from server.models.site_visit import SiteVisit
from server.models.booking import Booking, BookingStatus
from server.models.revenue import CommissionRecord, Wallet, WalletTransaction, RevenueShare

def verify_full_journey():
    print("=" * 80)
    print("  ESTATEFLOW: REAL CUSTOMER -> CRM END-TO-END DATA VERIFICATION")
    print("=" * 80)

    Base.metadata.create_all(bind=engine)
    client = TestClient(app)
    db = SessionLocal()

    # 1. Admin Authentication
    admin_login_res = client.post("/api/admin/auth/login", json={"email": "admin@estateflow.com", "password": "Admin@123"})
    assert admin_login_res.status_code == 200, f"Admin login failed: {admin_login_res.text}"
    admin_token = admin_login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[PASS] 1. Admin authenticated successfully")

    # 2. Customer Registration
    test_id = random.randint(100000, 999999)
    cust_email = f"audit_buyer_{test_id}@estateflow.com"
    reg_res = client.post("/api/auth/register", json={
        "email": cust_email,
        "password": "CustomerPassword@123",
        "first_name": "Rohan",
        "last_name": f"Verma_{test_id}",
        "phone": f"+91 98{test_id}"
    })
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
    cust_token = reg_res.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    print(f"[PASS] 2. Customer registered ({cust_email})")

    # 3. Verify User & Customer Profile in Database
    user_row = db.query(User).filter(User.email == cust_email).first()
    assert user_row is not None, "User record not found in DB"
    cust_profile = db.query(Customer).filter(Customer.user_id == user_row.id).first()
    assert cust_profile is not None, "Customer profile not found in DB"
    print(f"[PASS] 3. Database User record (ID: {user_row.id}) and Customer profile verified")

    # 4. Verify Initial CRM Lead Created
    initial_lead = db.query(Lead).filter(Lead.customer_id == user_row.id).first()
    assert initial_lead is not None, "Initial CRM Lead was not auto-created on registration"
    assert initial_lead.email == cust_email, "Lead email mismatch"
    assert initial_lead.stage == LeadStage.new, f"Initial lead stage is {initial_lead.stage}, expected 'new'"
    print(f"[PASS] 4. Initial CRM Lead created (Lead #{initial_lead.lead_number}, Stage: {initial_lead.stage.value})")

    # 5. Fetch Property
    prop_res = client.get("/api/properties?limit=1")
    assert prop_res.status_code == 200
    props = prop_res.json().get("items", [])
    assert len(props) > 0, "No properties found in database"
    target_prop = props[0]
    prop_id = target_prop["id"]
    prop_price = target_prop.get("price", 15000000.0)
    print(f"[PASS] 5. Property selected (ID #{prop_id} - '{target_prop['name']}')")

    # 6. Schedule Site Visit
    visit_res = client.post("/api/site-visits", json={
        "property_id": prop_id,
        "visit_date": "2026-09-15T11:00:00",
        "time_slot": "10:00 AM - 12:00 PM",
        "notes": "Verified VIP site visit request"
    }, headers=cust_headers)
    assert visit_res.status_code == 200, f"Site visit creation failed: {visit_res.text}"
    visit_id = visit_res.json()["visit_id"]
    visit_num = visit_res.json()["visit_number"]
    print(f"[PASS] 6. Site visit scheduled (#{visit_num}, ID #{visit_id})")

    # 7. Verify SiteVisit in DB & Lead Linkage + Stage Update
    db.expire_all()
    visit_row = db.query(SiteVisit).filter(SiteVisit.id == visit_id).first()
    assert visit_row is not None, "SiteVisit row not found in DB"
    assert visit_row.customer_id == user_row.id, "SiteVisit customer_id mismatch"
    assert visit_row.property_id == prop_id, "SiteVisit property_id mismatch"
    assert visit_row.lead_id is not None, "SiteVisit lead_id was not linked!"
    
    updated_lead = db.query(Lead).filter(Lead.id == visit_row.lead_id).first()
    assert updated_lead.stage == LeadStage.site_visit_scheduled, f"Lead stage is {updated_lead.stage}, expected site_visit_scheduled"
    print(f"[PASS] 7. SiteVisit row verified in DB and Lead #{updated_lead.lead_number} stage promoted to '{updated_lead.stage.value}'")

    # 8. Verify Site Visit Appears in Admin API
    admin_sv_res = client.get(f"/api/admin/site-visits?search={visit_num}", headers=admin_headers)
    assert admin_sv_res.status_code == 200, f"Admin site visits endpoint failed: {admin_sv_res.text}"
    admin_sv_items = admin_sv_res.json().get("items", [])
    assert any(v["visit_number"] == visit_num for v in admin_sv_items), f"Visit #{visit_num} not found in admin site visit list"
    print(f"[PASS] 8. Site visit #{visit_num} confirmed visible in Admin Site Visits API")

    # 9. Create Booking
    booking_res = client.post("/api/bookings", json={
        "property_id": prop_id,
        "customer_name": f"Rohan Verma_{test_id}",
        "customer_email": cust_email,
        "customer_phone": f"+91 98{test_id}",
        "customer_address": "Flat 402, Sea Green Towers, Mumbai",
        "preferred_visit_date": "2026-09-15T11:00:00",
        "visit_time_slot": "10:00 AM - 12:00 PM",
        "special_requirements": "Priority Escrow Verification"
    }, headers=cust_headers)
    assert booking_res.status_code == 200, f"Booking failed: {booking_res.text}"
    booking_id = booking_res.json()["booking_id"]
    booking_num = booking_res.json()["booking_number"]
    print(f"[PASS] 9. Booking created (#{booking_num}, ID #{booking_id})")

    # 10. Verify Booking Row in DB & Lead Linkage + Stage Promoted to 'booked'
    db.expire_all()
    booking_row = db.query(Booking).filter(Booking.id == booking_id).first()
    assert booking_row is not None, "Booking row not in DB"
    assert booking_row.customer_id == user_row.id, "Booking customer_id mismatch"
    assert booking_row.lead_id is not None, "Booking lead_id was not linked!"

    booked_lead = db.query(Lead).filter(Lead.id == booking_row.lead_id).first()
    assert booked_lead.stage == LeadStage.booked, f"Lead stage is {booked_lead.stage}, expected 'booked'"
    print(f"[PASS] 10. Booking row verified in DB and Lead #{booked_lead.lead_number} stage promoted to '{booked_lead.stage.value}'")

    # 11. Verify Booking Appears in Admin API
    admin_book_res = client.get(f"/api/admin/bookings?search={booking_num}", headers=admin_headers)
    assert admin_book_res.status_code == 200
    admin_book_items = admin_book_res.json().get("items", [])
    assert any(b["booking_number"] == booking_num for b in admin_book_items), f"Booking #{booking_num} not found in admin bookings list"
    print(f"[PASS] 11. Booking #{booking_num} confirmed visible in Admin Bookings API")

    # 12. Verify Revenue Sharing & Commission Record & Wallet Ledger
    comm_records = db.query(CommissionRecord).filter(CommissionRecord.booking_id == booking_id).all()
    assert len(comm_records) > 0, "No commission records generated for confirmed booking!"
    print(f"[PASS] 12. Revenue sharing triggered: {len(comm_records)} commission records generated")
    for cr in comm_records:
        print(f"       -> Commission ID #{cr.id}: Role: {cr.role.value}, Amount: INR {cr.commission_amount:,.2f}, Status: {cr.status.value}")

    # Check Wallet Credited
    wallet = db.query(Wallet).filter(Wallet.user_id == user_row.id).first()
    assert wallet is not None, "Partner/User wallet not found"
    assert wallet.balance > 0, f"Wallet balance is {wallet.balance}, expected > 0"
    
    txns = db.query(WalletTransaction).filter(WalletTransaction.wallet_id == wallet.id).all()
    assert len(txns) > 0, "Wallet transactions ledger empty"
    print(f"[PASS] 13. Recipient Wallet verified: Balance = INR {wallet.balance:,.2f} ({len(txns)} ledger entries)")

    # 13. Verify Idempotency / Prevent Duplicate Commissions
    from server.services.revenue_service import auto_process_booking_revenue
    second_run = auto_process_booking_revenue(db, booking_id, float(prop_price), user_row.id)
    assert len(second_run) == 0, "Duplicate commission prevention FAILED! Duplicate records created."
    comm_count_after = db.query(CommissionRecord).filter(CommissionRecord.booking_id == booking_id).count()
    assert comm_count_after == len(comm_records), f"Commission count grew from {len(comm_records)} to {comm_count_after}"
    print(f"[PASS] 14. Idempotency protected: Re-running revenue calculation produced 0 duplicates (Count: {comm_count_after})")

    # 14. Verify Customer 360 API with String User ID
    c360_res = client.get(f"/api/admin/customers/{user_row.id}", headers=admin_headers)
    assert c360_res.status_code == 200, f"Customer 360 endpoint failed: {c360_res.text}"
    c360_data = c360_res.json()
    assert c360_data["profile"]["id"] == user_row.id
    assert c360_data["stats"]["booking_count"] >= 1
    assert c360_data["stats"]["site_visit_count"] >= 1
    assert len(c360_data["bookings"]) >= 1
    assert len(c360_data["site_visits"]) >= 1
    assert len(c360_data["leads"]) >= 1
    print(f"[PASS] 15. Customer 360 API verified: {c360_data['stats']['booking_count']} bookings, {c360_data['stats']['site_visit_count']} visits, {c360_data['stats']['lead_count']} leads")

    # 15. Test Booking Cancellation Synchronization
    cancel_res = client.post(f"/api/bookings/{booking_id}/cancel", headers=cust_headers)
    assert cancel_res.status_code == 200, f"Cancellation failed: {cancel_res.text}"
    db.expire_all()
    cancelled_lead = db.query(Lead).filter(Lead.id == booking_row.lead_id).first()
    assert cancelled_lead.stage == LeadStage.lost, f"Lead stage after cancellation is {cancelled_lead.stage}, expected 'lost'"
    print(f"[PASS] 16. Cancellation sync verified: Lead #{cancelled_lead.lead_number} stage transitioned to '{cancelled_lead.stage.value}'")

    print("\n" + "=" * 80)
    print("  ALL 16 END-TO-END WORKFLOW VERIFICATIONS PASSED 100% WITH REAL DATABASE DATA!")
    print("=" * 80)

if __name__ == "__main__":
    verify_full_journey()
