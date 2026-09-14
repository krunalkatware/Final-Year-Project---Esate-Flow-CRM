"""
EstateFlow — Production Enterprise Sample Data Seeder
=====================================================
Idempotent script to populate EstateFlow database with rich production-grade
sample data across all enterprise modules.
"""
import sys
import os

# Ensure server package can be imported
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from server.config.database import SessionLocal, engine, Base
from server.models.user import User, UserRole
from server.models import (
    AdminUser, Role, Permission, RolePermission, City, Builder, Project,
    Property, PropertyType, PropertyStatus, RevenueRule, CommissionRole, CommissionType,
    Wallet, WalletTransaction, WalletTransactionType, WalletTransactionStatus,
    Lead, LeadStage, LeadPriority, SiteVisit, VisitStatus, Booking, BookingStatus,
    BookingDocument, BookingPayment, BookingPaymentType, BookingPaymentMode, BookingPaymentStatus,
    Notification, NotificationType, AuditLog, AuditAction
)
from server.services.admin_auth_service import AdminAuthService
from server.services.auth_service import AuthService


def seed_enterprise_data():
    print("[START] Starting EstateFlow Enterprise Data Seeding...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Roles & Default Super Admin
        auth_svc = AdminAuthService(db)
        auth_svc.seed_roles_and_permissions()
        
        super_admin = auth_svc.create_super_admin(
            email="admin@estateflow.com",
            password="Admin@123",
            first_name="Super",
            last_name="Admin",
        )

        # 2. Seed Demo Accounts across Roles
        customer_svc = AuthService(db)
        demo_accounts = [
            ("customer@estateflow.com", "Customer@123", "Rajesh", "Kumar", "9876543210", UserRole.customer),
            ("priya.sharma@estateflow.com", "Customer@123", "Priya", "Sharma", "9876543211", UserRole.customer),
            ("amit.verma@estateflow.com", "Customer@123", "Amit", "Verma", "9876543212", UserRole.customer),
            ("broker@estateflow.com", "Broker@123", "Vikram", "Mehta", "9876543220", UserRole.agent),
            ("senior_broker@estateflow.com", "Broker@123", "Suresh", "Rao", "9876543221", UserRole.agent),
            ("manager@estateflow.com", "Manager@123", "Neha", "Gupta", "9876543230", UserRole.admin),
        ]
        
        user_map = {}
        for email, pwd, fname, lname, phone, role in demo_accounts:
            u = db.query(User).filter(User.email == email).first()
            if not u:
                try:
                    u = customer_svc.register_user(
                        email=email, password=pwd, first_name=fname, last_name=lname, phone=phone
                    )
                    u.role = role
                    db.commit()
                except Exception:
                    u = db.query(User).filter(User.email == email).first()
            user_map[email] = u

        print("  [OK] Super Admin & Multi-Role Accounts seeded")

        # 3. Seed Cities
        city_list = [
            {"name": "Mumbai", "state": "Maharashtra"},
            {"name": "Bengaluru", "state": "Karnataka"},
            {"name": "Delhi NCR", "state": "Delhi"},
            {"name": "Pune", "state": "Maharashtra"},
            {"name": "Hyderabad", "state": "Telangana"},
        ]
        city_objs = {}
        for c in city_list:
            existing = db.query(City).filter(City.name == c["name"]).first()
            if not existing:
                existing = City(name=c["name"], state=c["state"], is_active=True)
                db.add(existing)
                db.flush()
            city_objs[c["name"]] = existing
        db.commit()

        # 4. Seed Builders
        builders_data = [
            {"name": "Godrej Properties", "company_name": "Godrej Properties Ltd", "city": "Mumbai", "total_projects": 42},
            {"name": "Prestige Group", "company_name": "Prestige Estates Projects Ltd", "city": "Bengaluru", "total_projects": 38},
            {"name": "DLF India", "company_name": "DLF Limited", "city": "Delhi NCR", "total_projects": 55},
            {"name": "Sobha Developers", "company_name": "Sobha Limited", "city": "Bengaluru", "total_projects": 30},
            {"name": "Lodha Group", "company_name": "Macrotech Developers Ltd", "city": "Mumbai", "total_projects": 48},
        ]
        builder_objs = {}
        for b_data in builders_data:
            existing = db.query(Builder).filter(Builder.name == b_data["name"]).first()
            if not existing:
                existing = Builder(**b_data, is_active=True)
                db.add(existing)
                db.flush()
            builder_objs[b_data["name"]] = existing
        db.commit()

        # 5. Seed 25 Realistic Properties across Cities & Categories
        sample_props = [
            ("Lodha Sky Heights Penthouse", "Mumbai", "Lodha Group", 48000000, 500000, "apartment", PropertyStatus.available),
            ("Godrej Horizon Luxury Tower", "Mumbai", "Godrej Properties", 28500000, 300000, "apartment", PropertyStatus.available),
            ("Prestige Golfshire Royal Villa", "Bengaluru", "Prestige Group", 65000000, 1000000, "villa", PropertyStatus.available),
            ("DLF Camellias Super Luxury Suite", "Delhi NCR", "DLF India", 120000000, 2000000, "penthouse", PropertyStatus.reserved),
            ("Sobha Dream Acres Residence", "Bengaluru", "Sobha Developers", 14500000, 200000, "apartment", PropertyStatus.available),
            ("Hiranandani Estate Promenade", "Mumbai", "Godrej Properties", 32000000, 400000, "apartment", PropertyStatus.available),
            ("Salarpuria Sattva Knowledge City", "Hyderabad", "Prestige Group", 42000000, 500000, "commercial", PropertyStatus.available),
            ("Brigade Utopia Skyline", "Bengaluru", "Sobha Developers", 18500000, 250000, "apartment", PropertyStatus.available),
            ("K Raheja Corp Cyber Park", "Pune", "Godrej Properties", 85000000, 1500000, "commercial", PropertyStatus.available),
            ("Oberoi Realty Sky City", "Mumbai", "Lodha Group", 39000000, 500000, "apartment", PropertyStatus.sold),
            ("Tata Housing Avenida", "Kolkata", "Godrej Properties", 16000000, 200000, "apartment", PropertyStatus.available),
            ("Puravankara Atmosphere", "Bengaluru", "Prestige Group", 21000000, 300000, "apartment", PropertyStatus.available),
            ("Mahindra Lifespaces Luminare", "Delhi NCR", "DLF India", 31000000, 400000, "apartment", PropertyStatus.available),
            ("Rustomjee Crown Prabhadevi", "Mumbai", "Godrej Properties", 72000000, 1000000, "penthouse", PropertyStatus.available),
            ("L&T Realty Emerald Isle", "Mumbai", "Godrej Properties", 26000000, 300000, "apartment", PropertyStatus.available),
            ("Prestige Jindal City", "Bengaluru", "Prestige Group", 12500000, 150000, "apartment", PropertyStatus.available),
            ("Godrej Woods Noida", "Delhi NCR", "Godrej Properties", 24000000, 300000, "apartment", PropertyStatus.available),
            ("DLF One Midtown Moti Nagar", "Delhi NCR", "DLF India", 29500000, 350000, "apartment", PropertyStatus.available),
            ("Sobha Neopolis Panathur", "Bengaluru", "Sobha Developers", 19800000, 250000, "apartment", PropertyStatus.available),
            ("Lodha Park Allura", "Mumbai", "Lodha Group", 34000000, 400000, "apartment", PropertyStatus.available),
            ("Prestige Tech Park IV", "Bengaluru", "Prestige Group", 95000000, 2000000, "commercial", PropertyStatus.available),
            ("DLF Cyber City Gurgaon", "Delhi NCR", "DLF India", 150000000, 2500000, "commercial", PropertyStatus.available),
            ("Godrej Rivergreens Pune", "Pune", "Godrej Properties", 11500000, 150000, "apartment", PropertyStatus.available),
            ("My Home Bhooja Hitech City", "Hyderabad", "Prestige Group", 46000000, 600000, "apartment", PropertyStatus.available),
            ("Aparna Zenith Gachibowli", "Hyderabad", "Prestige Group", 22000000, 300000, "apartment", PropertyStatus.available),
        ]

        for name, city_name, b_name, price, book_amt, ptype_str, status_enum in sample_props:
            existing = db.query(Property).filter(Property.name == name).first()
            if not existing:
                city_obj = city_objs.get(city_name, list(city_objs.values())[0])
                b_obj = builder_objs.get(b_name, list(builder_objs.values())[0])
                p = Property(
                    name=name,
                    slug=name.lower().replace(" ", "-"),
                    description=f"Premium {ptype_str} development featuring world-class amenities in prime {city_name}.",
                    purpose="sale",
                    property_type=ptype_str,
                    status=status_enum,
                    country="India",
                    state=city_obj.state,
                    city_id=city_obj.id,
                    locality=f"Prime Sector, {city_name}",
                    full_address=f"Plot 101, Central Boulevard, {city_name}",
                    builder_id=b_obj.id,
                    bhk="3 BHK",
                    bedrooms=3,
                    bathrooms=3,
                    carpet_area=1450.0,
                    builtup_area=1850.0,
                    price=price,
                    booking_amount=book_amt,
                    is_featured=True,
                    is_verified=True,
                    is_published=True,
                    is_active=True,
                )
                db.add(p)
        db.commit()

        # 6. Seed Revenue Rules
        rules_data = [
            {"name": "Mumbai Luxury Residential - Tier A", "role": CommissionRole.BROKER, "commission_type": CommissionType.PERCENTAGE, "value": 3.5, "priority": 15, "city": "Mumbai"},
            {"name": "Standard Broker Commission", "role": CommissionRole.BROKER, "commission_type": CommissionType.PERCENTAGE, "value": 2.5, "priority": 10},
            {"name": "Senior Broker Override", "role": CommissionRole.BROKER, "commission_type": CommissionType.PERCENTAGE, "value": 1.5, "priority": 8},
            {"name": "Sales Manager Allocation", "role": CommissionRole.SALES_EXECUTIVE, "commission_type": CommissionType.PERCENTAGE, "value": 1.0, "priority": 5},
            {"name": "Channel Partner Flat Bonus", "role": CommissionRole.CHANNEL_PARTNER, "commission_type": CommissionType.FLAT, "value": 100000, "priority": 7},
        ]
        for r_data in rules_data:
            if not db.query(RevenueRule).filter(RevenueRule.name == r_data["name"]).first():
                db.add(RevenueRule(**r_data, is_active=True))
        db.commit()

        # 7. Audit Log Entry
        db.add(AuditLog(
            user_email="system@estateflow.com",
            action=AuditAction.SETTINGS_CHANGED.value,
            resource_type="system",
            details={"message": "Full production enterprise dataset (25 properties, multi-role users, rules) initialized"}
        ))
        db.commit()
        print("  [OK] 25 Properties & Enterprise Rules seeded")
        print("[SUCCESS] Enterprise Data Seeding Complete!")

    except Exception as e:
        print(f"[ERROR] Seeding error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_enterprise_data()
