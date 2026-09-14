"""
Reset and Seed script for EstateFlow.
Drops all tables and recreates them with full schema fields, then seeds complete initial data.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from server.config.database import engine, Base, SessionLocal
import server.models  # Ensures all models are registered with Base metadata
from server.database.seed import seed

def reset_and_seed():
    print("Dropping all existing database tables...")
    Base.metadata.drop_all(bind=engine)

    print("Recreating all database tables with updated schema...")
    Base.metadata.create_all(bind=engine)

    print("Seeding database...")
    try:
        seed()
        print("[SUCCESS] Database successfully reset and seeded!")
    except Exception as e:
        print(f"Warning during seeding: {e}")
        # Ensure default super admin created
        from server.services.admin_auth_service import AdminAuthService
        db = SessionLocal()
        try:
            svc = AdminAuthService(db)
            svc.seed_roles_and_permissions()
            svc.create_super_admin(
                email="admin@estateflow.com",
                password="Admin@123",
                first_name="Super",
                last_name="Admin",
            )
            print("[SUCCESS] Seeded admin auth roles & default super admin (admin@estateflow.com)")
        finally:
            db.close()

if __name__ == "__main__":
    reset_and_seed()
