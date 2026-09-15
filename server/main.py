from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from server.config.settings import settings
from server.config.database import engine, Base

# Import all models so Alembic can detect them
import server.models  # noqa: F401

from server.middleware.security import SecurityHeadersMiddleware
from server.routers import auth, properties, bookings, wishlist, site_visits, profile, reviews, notifications, investments, search, files
from server.routers import admin_auth, admin_dashboard, admin_properties, admin_builders, admin_leads, admin_customers, admin_bookings, admin_site_visits, admin_reviews, admin_revenue, admin_investments, admin_audit_logs



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup (development convenience)
    Base.metadata.create_all(bind=engine)

    # Seed admin roles, permissions, and default super admin (idempotent)
    try:
        from server.config.database import SessionLocal
        from server.services.admin_auth_service import AdminAuthService
        from server.models.lead import Lead, LeadStage, LeadSource, LeadPriority
        from server.models.property import Property
        db = SessionLocal()
        try:
            svc = AdminAuthService(db)
            svc.seed_roles_and_permissions()
            admin = svc.create_super_admin(
                email="admin@estateflow.com",
                password="Admin@123",
                first_name="Super",
                last_name="Admin",
            )
            print(f"[Admin] Roles & permissions seeded. Default admin: admin@estateflow.com")

            # Seed CRM leads if empty
            if db.query(Lead).count() == 0:
                first_prop = db.query(Property).first()
                prop_id = first_prop.id if first_prop else None
                sample_leads = [
                    Lead(lead_number="EFL-LD-1001", first_name="Rajesh", last_name="Kumar", email="rajesh.kumar@example.com", phone="+91 98201 12345", city="Mumbai", locality="Worli", budget_min=25000000, budget_max=35000000, preferred_bhk="3 BHK", stage=LeadStage.new, source=LeadSource.website, priority=LeadPriority.hot, lead_score=85, estimated_deal_value=32000000, property_id=prop_id),
                    Lead(lead_number="EFL-LD-1002", first_name="Priya", last_name="Sharma", email="priya.sharma@example.com", phone="+91 98450 67890", city="Bangalore", locality="Whitefield", budget_min=15000000, budget_max=18500000, preferred_bhk="2 BHK", stage=LeadStage.contacted, source=LeadSource.google_ads, priority=LeadPriority.high, lead_score=72, estimated_deal_value=17500000, property_id=prop_id),
                    Lead(lead_number="EFL-LD-1003", first_name="Amitabh", last_name="Sen", email="amitabh.sen@example.com", phone="+91 98300 54321", city="Mumbai", locality="Lower Parel", budget_min=45000000, budget_max=55000000, preferred_bhk="4 BHK", stage=LeadStage.interested, source=LeadSource.referral, priority=LeadPriority.vip, lead_score=95, estimated_deal_value=50000000, property_id=prop_id),
                    Lead(lead_number="EFL-LD-1004", first_name="Sneha", last_name="Reddy", email="sneha.reddy@example.com", phone="+91 98765 43210", city="Hyderabad", locality="Gachibowli", budget_min=18000000, budget_max=22000000, preferred_bhk="3 BHK", stage=LeadStage.site_visit_scheduled, source=LeadSource.instagram, priority=LeadPriority.hot, lead_score=88, estimated_deal_value=20500000, property_id=prop_id),
                    Lead(lead_number="EFL-LD-1005", first_name="Vikram", last_name="Malhotra", email="vikram.m@example.com", phone="+91 98111 22334", city="Pune", locality="Baner", budget_min=12000000, budget_max=16000000, preferred_bhk="2 BHK", stage=LeadStage.negotiation, source=LeadSource.builder, priority=LeadPriority.high, lead_score=78, estimated_deal_value=14500000, property_id=prop_id),
                    Lead(lead_number="EFL-LD-1006", first_name="Ananya", last_name="Joshi", email="ananya.j@example.com", phone="+91 98222 33445", city="Mumbai", locality="Bandra West", budget_min=38000000, budget_max=45000000, preferred_bhk="3 BHK", stage=LeadStage.booking_requested, source=LeadSource.website, priority=LeadPriority.vip, lead_score=92, estimated_deal_value=42000000, property_id=prop_id),
                    Lead(lead_number="EFL-LD-1007", first_name="Rohan", last_name="Desai", email="rohan.desai@example.com", phone="+91 98333 44556", city="Mumbai", locality="Kandivali East", budget_min=24000000, budget_max=28500000, preferred_bhk="3 BHK", stage=LeadStage.booked, source=LeadSource.walk_in, priority=LeadPriority.high, lead_score=90, estimated_deal_value=27500000, property_id=prop_id),
                    Lead(lead_number="EFL-LD-1008", first_name="Karan", last_name="Verma", email="karan.v@example.com", phone="+91 98444 55667", city="Delhi NCR", locality="Gurugram", budget_min=10000000, budget_max=12500000, preferred_bhk="2 BHK", stage=LeadStage.lost, source=LeadSource.phone_call, priority=LeadPriority.low, lead_score=40, estimated_deal_value=11000000, property_id=prop_id),
                    Lead(lead_number="EFL-LD-1009", first_name="Meera", last_name="Patel", email="meera.p@example.com", phone="+91 98555 66778", city="Ahmedabad", locality="SG Highway", budget_min=13000000, budget_max=15500000, preferred_bhk="3 BHK", stage=LeadStage.closed, source=LeadSource.referral, priority=LeadPriority.medium, lead_score=70, estimated_deal_value=14000000, property_id=prop_id),
                ]
                db.add_all(sample_leads)
                db.commit()
                print(f"[CRM] Seeded {len(sample_leads)} initial pipeline leads across 9 Kanban stages.")
        finally:
            db.close()
    except Exception as e:
        print(f"[Admin] Seeding warning (non-fatal): {e}")

    yield


app = FastAPI(
    title="EstateFlow API",
    description="Enterprise Real Estate SaaS Platform API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)


# Exception Handlers
import traceback
from fastapi import Request
from fastapi.exceptions import RequestValidationError

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    print(f"HTTPException [{exc.status_code}]: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail if isinstance(exc.detail, str) else str(exc.detail),
            "detail": exc.detail,
        },
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_error = str(errors[0]["msg"]) if errors else "Validation Error"
    print(f"RequestValidationError: {first_error}")
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": first_error,
            "detail": first_error,
        },
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_str = str(exc) or "Internal Server Error"
    print("Unhandled Exception on API request:", error_str)
    print(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": error_str,
            "detail": error_str,
        },
    )

# Routers
app.include_router(auth.router)
app.include_router(properties.router)
app.include_router(bookings.router)
app.include_router(wishlist.router)
app.include_router(site_visits.router)
app.include_router(profile.router)
app.include_router(reviews.router)
app.include_router(notifications.router)
app.include_router(investments.router)
app.include_router(search.router)
app.include_router(files.router)

# Admin Routers
app.include_router(admin_auth.router)
app.include_router(admin_dashboard.router)
app.include_router(admin_properties.router)
app.include_router(admin_builders.router)
app.include_router(admin_leads.router)
app.include_router(admin_customers.router)
app.include_router(admin_bookings.router)
app.include_router(admin_site_visits.router)
app.include_router(admin_reviews.router)
app.include_router(admin_revenue.router)
app.include_router(admin_investments.router)
app.include_router(admin_audit_logs.router)



# Singular aliases requested by API specs
app.add_api_route("/api/site-visit", site_visits.create_site_visit, methods=["POST"], tags=["Site Visit Alias"])
app.add_api_route("/api/site-visit", site_visits.get_site_visits, methods=["GET"], tags=["Site Visit Alias"])
app.add_api_route("/api/booking", bookings.create_booking, methods=["POST"], tags=["Booking Alias"])
app.add_api_route("/api/booking", bookings.get_my_bookings, methods=["GET"], tags=["Booking Alias"])


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "EstateFlow API", "version": "1.0.0"}


@app.get("/")
def root():
    return {"message": "EstateFlow API — Where Real Estate Flows Better"}


@app.post("/api/seed")
def run_seed(secret: str):
    """
    One-time endpoint to seed production data.
    Protected by SEED_SECRET env var.
    Call with: POST /api/seed?secret=YOUR_SECRET
    """
    import os
    from server.config.database import SessionLocal
    expected = os.environ.get("SEED_SECRET", "estateflow-seed-2024")
    if secret != expected:
        raise HTTPException(status_code=403, detail="Invalid seed secret")

    try:
        # Import and run the full seed script inline
        import sys
        sys.path.insert(0, ".")
        from seed_production_data import seed_enterprise_data
        seed_enterprise_data()
        return {
            "success": True,
            "message": "Production data seeded successfully! Admin: admin@estateflow.com / Admin@123"
        }
    except Exception as e:
        # Even if full seed fails, admin is already seeded at startup
        return {
            "success": False,
            "message": f"Seed error: {str(e)}. Note: Admin account is seeded automatically on startup.",
            "admin_credentials": {
                "email": "admin@estateflow.com",
                "password": "Admin@123"
            }
        }
