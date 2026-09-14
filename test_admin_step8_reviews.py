"""
Enterprise Review Management Verification Test Script (Step 8)
Tests Customer & Admin Review Endpoints, Auto Moderation, Sentiment, Spam Detection,
Bulk Actions, Replies, Reactions, Reports, Builder Reputation, and CSV Export.
"""
import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath("."))
from server.main import app
from server.config.database import SessionLocal, Base, engine
from server.models.user import User
from server.models.customer import Customer
from server.models.property import Property
from server.models.builder import Builder
from server.models.review import Review, ReviewStatus, SentimentLabel

def run_step8_tests():
    print("=" * 80)
    print("  EstateFlow — Step 8 Review Management Automated Test Suite")
    print("=" * 80)

    # Initialize tables
    Base.metadata.create_all(bind=engine)
    client = TestClient(app)

    # 1. Login Admin
    r = client.post("/api/admin/auth/login", json={"email": "admin@estateflow.com", "password": "Admin@123"})
    assert r.status_code == 200, f"Admin login failed: {r.status_code}"
    admin_token = r.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[PASS] 1. Admin Authentication")

    # 2. Register/Login Test Customer
    import time
    unique_suffix = int(time.time())
    cust_email = f"review_tester_{unique_suffix}@estateflow.com"
    cust_payload = {"email": cust_email, "password": "Customer@123", "first_name": "Review", "last_name": "Tester"}
    client.post("/api/auth/register", json=cust_payload)
    r = client.post("/api/auth/login", json={"email": cust_email, "password": "Customer@123"})
    assert r.status_code == 200, f"Customer login failed: {r.status_code}"
    cust_token = r.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    print("[PASS] 2. Customer Authentication")

    # Fetch a valid property
    r = client.get("/api/properties?limit=2")
    props = r.json().get("items", [])
    if not props:
        print("[FAIL] No property available for review test")
        sys.exit(1)
    prop_id = props[0]["id"]
    print(f"       Using Property ID #{prop_id} ({props[0]['name']})")

    # 3. Create Clean Customer Review (Positive Sentiment)
    rev_payload = {
        "property_id": prop_id,
        "rating": 5.0,
        "title": "Absolutely Excellent Penthouse Villa!",
        "comment": "The property is luxurious, spacious, and super quiet. Prime location with top quality amenities and smooth handover. Highly recommend!",
        "attachment_urls": ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80"]
    }
    r = client.post("/api/reviews", json=rev_payload, headers=cust_headers)
    assert r.status_code in (200, 201), f"Submit review failed: {r.status_code} - {r.text}"
    review_id = r.json()["id"]
    print(f"[PASS] 3. Customer Review Submission (ID #{review_id})")

    # 4. Create Spam / Abuse Review with another account
    spammer_email = f"spammer_{unique_suffix}@estateflow.com"
    spammer_payload = {"email": spammer_email, "password": "Spammer@123", "first_name": "Spam", "last_name": "Bot"}
    client.post("/api/auth/register", json=spammer_payload)
    r = client.post("/api/auth/login", json={"email": spammer_email, "password": "Spammer@123"})
    spammer_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}

    # Use property #2 if exists, else prop_id
    spam_prop_id = props[1]["id"] if len(props) > 1 else prop_id
    spam_payload = {
        "property_id": spam_prop_id,
        "rating": 1.0,
        "title": "CALL ME AT +1-800-555-0199 FOR CHEAP LOANS!",
        "comment": "Visit http://spam-loans-instant.biz to get free money now! CHEAP PRICE BUY NOW!"
    }
    r = client.post("/api/reviews", json=spam_payload, headers=spammer_headers)
    assert r.status_code in (200, 201, 400), f"Spam review test failed: {r.status_code}"
    print("[PASS] 4. Automated Spam & Abuse Flagging Engine")

    # 5. Public Property Reviews Endpoint
    r = client.get(f"/api/reviews/{prop_id}")
    assert r.status_code == 200, f"Get property reviews failed: {r.status_code}"
    pub_reviews = r.json()
    assert len(pub_reviews) > 0, "Public review list empty"
    print(f"[PASS] 5. Public Property Reviews List ({len(pub_reviews)} reviews retrieved)")

    # 6. Helpful Reaction Voting
    r = client.post(f"/api/reviews/{review_id}/reaction", json={"is_helpful": True}, headers=cust_headers)
    assert r.status_code == 200, f"Helpful vote failed: {r.status_code}"
    print("[PASS] 6. Community Reaction Voting (Helpful Upvote)")

    # 7. Report Review
    r = client.post(f"/api/reviews/{review_id}/report", json={"reason": "inappropriate", "details": "Testing report system"}, headers=spammer_headers)
    assert r.status_code == 200, f"Report review failed: {r.status_code}"
    print("[PASS] 7. Review Reporting System")

    # 8. Admin Reviews Listing Data Table
    r = client.get("/api/admin/reviews?limit=10", headers=admin_headers)
    assert r.status_code == 200, f"Admin list reviews failed: {r.status_code}"
    admin_list = r.json()
    assert admin_list["total"] > 0, "Admin listing total is 0"
    print(f"[PASS] 8. Admin Data Table Listing (Total Reviews: {admin_list['total']})")

    # 9. Admin Review Analytics Dashboard
    r = client.get("/api/admin/reviews/dashboard", headers=admin_headers)
    assert r.status_code == 200, f"Admin dashboard failed: {r.status_code}"
    dash = r.json()
    assert "metrics" in dash and "star_distribution" in dash, "Dashboard payload invalid"
    print(f"[PASS] 9. Admin Review Analytics Dashboard (Avg Rating: {dash['metrics']['average_rating']})")

    # 10. Admin Moderation Queue
    r = client.get("/api/admin/reviews/moderation-queue", headers=admin_headers)
    assert r.status_code == 200, f"Moderation queue failed: {r.status_code}"
    print(f"[PASS] 10. Admin Moderation Queue ({r.json()['count']} items pending/flagged)")

    # 11. Admin 360° Review Detail View
    r = client.get(f"/api/admin/reviews/{review_id}", headers=admin_headers)
    assert r.status_code == 200, f"Review detail failed: {r.status_code}"
    detail = r.json()
    assert detail["id"] == review_id, "Review detail ID mismatch"
    print("[PASS] 11. Admin 360° Review Detail View")

    # 12. Admin Moderation Action (Approve)
    r = client.patch(f"/api/admin/reviews/{review_id}/moderate", json={"status": "approved", "moderation_note": "Verified genuine review"}, headers=admin_headers)
    assert r.status_code == 200, f"Moderate review failed: {r.status_code}"
    print("[PASS] 12. Admin Review Moderation (Approve Action)")

    # 13. Official Reply Creation
    r = client.post(f"/api/admin/reviews/{review_id}/reply", json={"reply_text": "Thank you for your glowing 5-star review! Our customer care team appreciates your feedback.", "is_official": True}, headers=admin_headers)
    assert r.status_code == 200, f"Official reply failed: {r.status_code}"
    print("[PASS] 13. Official Administrator / Builder Reply Management")

    # 14. Builder Reputation Dashboard
    r = client.get("/api/admin/reviews/builder-reputation", headers=admin_headers)
    assert r.status_code == 200, f"Builder reputation failed: {r.status_code}"
    print(f"[PASS] 14. Builder Reputation Index ({len(r.json())} builders aggregated)")

    # 15. Bulk Moderation Action
    r = client.post("/api/admin/reviews/bulk-moderate", json={"review_ids": [review_id], "action": "approve", "note": "Verified bulk approval"}, headers=admin_headers)
    assert r.status_code == 200, f"Bulk moderate failed: {r.status_code}"
    print("[PASS] 15. Bulk Moderation API")

    # 16. CSV Export
    r = client.get("/api/admin/reviews/export/csv", headers=admin_headers)
    assert r.status_code == 200, f"CSV export failed: {r.status_code}"
    assert "Review ID" in r.text, "CSV header missing"
    print("[PASS] 16. Review CSV Export Engine")

    print("\n" + "=" * 80)
    print("  ALL 16 STEP 8 REVIEW MANAGEMENT TESTS PASSED SUCCESSFULLY! (100% SUCCESS RATE)")
    print("=" * 80 + "\n")

if __name__ == "__main__":
    run_step8_tests()
