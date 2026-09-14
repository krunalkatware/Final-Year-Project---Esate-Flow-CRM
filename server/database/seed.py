"""
EstateFlow Database Seed Script
Seeds 30 premium properties across 5 Indian cities with realistic data.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server.config.database import SessionLocal, engine, Base
import server.models  # noqa - ensures all models registered
from server.models.city import City
from server.models.builder import Builder
from server.models.project import Project
from server.models.property import Property, PropertyImage, PropertyType, PropertyStatus
from server.models.amenity import Amenity, PropertyAmenity
from server.models.user import User
from server.models.admin import AdminUser
from server.models.lead import Lead

# Import slugify; fall back to simple version if not installed
try:
    from slugify import slugify
except ImportError:
    import re
    def slugify(text):
        text = text.lower().strip()
        text = re.sub(r'[\s_-]+', '-', text)
        text = re.sub(r'[^\w-]', '', text)
        return text


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Clear existing seed data
        print("Clearing existing data...")
        from server.models.site_visit import (
            SiteVisitNotification, SiteVisitAudit, SiteVisitAttendance, SiteVisitRoute,
            SiteVisitStatusHistory, SiteVisitFeedback, SiteVisitReminder, SiteVisitDocument,
            SiteVisitComment, SiteVisitTimeline, SiteVisitAssignment, SiteVisit
        )
        db.query(SiteVisitNotification).delete()
        db.query(SiteVisitAudit).delete()
        db.query(SiteVisitAttendance).delete()
        db.query(SiteVisitRoute).delete()
        db.query(SiteVisitStatusHistory).delete()
        db.query(SiteVisitFeedback).delete()
        db.query(SiteVisitReminder).delete()
        db.query(SiteVisitDocument).delete()
        db.query(SiteVisitComment).delete()
        db.query(SiteVisitTimeline).delete()
        db.query(SiteVisitAssignment).delete()
        db.query(SiteVisit).delete()

        # Clear Booking tables
        from server.models.booking import (
            BookingReminder, BookingComment, BookingAgreement, BookingCancellation,
            BookingRefund, BookingStatusHistory, BookingAudit, BookingTimeline,
            BookingDocument, BookingInstallment, BookingPayment, Booking
        )
        db.query(BookingReminder).delete()
        db.query(BookingComment).delete()
        db.query(BookingAgreement).delete()
        db.query(BookingCancellation).delete()
        db.query(BookingRefund).delete()
        db.query(BookingStatusHistory).delete()
        db.query(BookingAudit).delete()
        db.query(BookingTimeline).delete()
        db.query(BookingDocument).delete()
        db.query(BookingInstallment).delete()
        db.query(BookingPayment).delete()
        db.query(Booking).delete()
        
        db.query(PropertyAmenity).delete()
        db.query(PropertyImage).delete()
        db.query(Property).delete()
        db.query(Project).delete()
        db.query(Amenity).delete()
        db.query(Builder).delete()
        db.query(City).delete()
        db.commit()

        # ── CITIES ──────────────────────────────────────────────────────────
        print("Creating cities...")
        cities_data = [
            {"name": "Mumbai", "state": "Maharashtra"},
            {"name": "Pune", "state": "Maharashtra"},
            {"name": "Bangalore", "state": "Karnataka"},
            {"name": "Hyderabad", "state": "Telangana"},
            {"name": "Delhi NCR", "state": "Delhi"},
        ]
        cities = {}
        for c in cities_data:
            city = City(**c)
            db.add(city)
            db.flush()
            cities[c["name"]] = city

        # ── BUILDERS ────────────────────────────────────────────────────────
        print("Creating builders...")
        builders_data = [
            {
                "name": "Lodha Group",
                "description": "India's leading real estate developer known for world-class luxury developments.",
                "established_year": 1980,
                "total_projects": 85,
                "delivered_projects": 62,
                "website": "https://www.lodhagroup.com",
                "headquarters": "Mumbai, Maharashtra",
                "rating": 4.7,
                "is_verified": True,
            },
            {
                "name": "Prestige Group",
                "description": "Bangalore-based premium developer with pan-India presence.",
                "established_year": 1986,
                "total_projects": 120,
                "delivered_projects": 95,
                "website": "https://www.prestigeconstructions.com",
                "headquarters": "Bangalore, Karnataka",
                "rating": 4.6,
                "is_verified": True,
            },
            {
                "name": "Godrej Properties",
                "description": "Trusted brand delivering quality homes with 125+ years of heritage.",
                "established_year": 1990,
                "total_projects": 60,
                "delivered_projects": 42,
                "website": "https://www.godrejproperties.com",
                "headquarters": "Mumbai, Maharashtra",
                "rating": 4.5,
                "is_verified": True,
            },
            {
                "name": "Brigade Group",
                "description": "South India's leading real estate conglomerate.",
                "established_year": 1986,
                "total_projects": 75,
                "delivered_projects": 58,
                "website": "https://www.brigadegroup.com",
                "headquarters": "Bangalore, Karnataka",
                "rating": 4.4,
                "is_verified": True,
            },
            {
                "name": "Shapoorji Pallonji",
                "description": "Legendary construction group with 155 years of excellence.",
                "established_year": 1865,
                "total_projects": 45,
                "delivered_projects": 38,
                "website": "https://www.shapoorjipallonji.com",
                "headquarters": "Mumbai, Maharashtra",
                "rating": 4.6,
                "is_verified": True,
            },
            {
                "name": "Sobha Limited",
                "description": "Premium developer known for backward integration and quality.",
                "established_year": 1995,
                "total_projects": 55,
                "delivered_projects": 41,
                "website": "https://www.sobha.com",
                "headquarters": "Bangalore, Karnataka",
                "rating": 4.5,
                "is_verified": True,
            },
        ]
        builders = {}
        for b in builders_data:
            builder = Builder(**b)
            db.add(builder)
            db.flush()
            builders[b["name"]] = builder

        # ── AMENITIES ───────────────────────────────────────────────────────
        print("Creating amenities...")
        amenities_data = [
            ("Swimming Pool", "🏊", "Recreation"),
            ("Gymnasium", "💪", "Sports"),
            ("Clubhouse", "🏛️", "Recreation"),
            ("Children's Play Area", "🎠", "Recreation"),
            ("Jogging Track", "🏃", "Sports"),
            ("Badminton Court", "🏸", "Sports"),
            ("Tennis Court", "🎾", "Sports"),
            ("Cricket Pitch", "🏏", "Sports"),
            ("24/7 Security", "🔒", "Security"),
            ("CCTV Surveillance", "📷", "Security"),
            ("Intercom", "📞", "Security"),
            ("Power Backup", "⚡", "Utilities"),
            ("Rainwater Harvesting", "💧", "Utilities"),
            ("Solar Panels", "☀️", "Utilities"),
            ("EV Charging", "🔌", "Utilities"),
            ("Infinity Pool", "🌊", "Recreation"),
            ("Sky Lounge", "🌇", "Recreation"),
            ("Private Elevator", "🛗", "Premium"),
            ("Home Automation", "🏠", "Premium"),
            ("Wine Cellar", "🍷", "Premium"),
            ("Private Garden", "🌳", "Premium"),
            ("Golf Simulator", "⛳", "Premium"),
            ("Yoga Studio", "🧘", "Sports"),
            ("Spa & Wellness", "💆", "Recreation"),
            ("Concierge Service", "🎩", "Services"),
            ("Valet Parking", "🚗", "Services"),
            ("Mini Theatre", "🎬", "Recreation"),
            ("Library", "📚", "Recreation"),
            ("Pet Park", "🐾", "Recreation"),
            ("Rooftop Garden", "🌿", "Premium"),
            ("Billiard Room", "🎱", "Recreation"),
            ("Business Center", "💼", "Services"),
        ]
        amenities = {}
        for name, icon, category in amenities_data:
            amenity = Amenity(name=name, icon=icon, category=category)
            db.add(amenity)
            db.flush()
            amenities[name] = amenity

        # ── PROJECTS ────────────────────────────────────────────────────────
        print("Creating projects...")
        projects_data = [
            {"name": "Lodha World One", "builder": "Lodha Group", "city": "Mumbai", "total_units": 800, "available_units": 120},
            {"name": "Prestige Lakeside Habitat", "builder": "Prestige Group", "city": "Bangalore", "total_units": 500, "available_units": 85},
            {"name": "Godrej Meridien", "builder": "Godrej Properties", "city": "Delhi NCR", "total_units": 350, "available_units": 60},
            {"name": "Brigade Orchards", "builder": "Brigade Group", "city": "Bangalore", "total_units": 450, "available_units": 95},
            {"name": "Shapoorji Pallonji Joyville", "builder": "Shapoorji Pallonji", "city": "Pune", "total_units": 600, "available_units": 110},
            {"name": "Sobha Dream Acres", "builder": "Sobha Limited", "city": "Bangalore", "total_units": 700, "available_units": 150},
        ]
        projects = {}
        for p in projects_data:
            project = Project(
                name=p["name"],
                builder_id=builders[p["builder"]].id,
                city_id=cities[p["city"]].id,
                total_units=p["total_units"],
                available_units=p["available_units"],
                possession_date="Dec 2026",
                is_active=True,
            )
            db.add(project)
            db.flush()
            projects[p["name"]] = project

        # ── PROPERTIES (30) ─────────────────────────────────────────────────
        print("Creating 30 properties...")

        # Unsplash luxury property images (royalty-free)
        IMAGES = [
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
            "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
            "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
            "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80",
            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
            "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
            "https://images.unsplash.com/photo-1597047084897-51e81819a499?w=800&q=80",
            "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80",
            "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
            "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80",
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
            "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80",
        ]

        properties_data = [
            # MUMBAI (6 properties)
            {
                "name": "Lodha Sky Heights Penthouse",
                "builder": "Lodha Group",
                "city": "Mumbai",
                "project": "Lodha World One",
                "locality": "Worli Sea Face",
                "full_address": "Lodha World One, Lower Parel, Mumbai 400013",
                "property_type": PropertyType.penthouse,
                "status": PropertyStatus.available,
                "bedrooms": 4,
                "bathrooms": 5,
                "area_sqft": 4200.0,
                "price": 28500000,
                "price_per_sqft": 6786,
                "possession_date": "Ready to Move",
                "rating": 4.9,
                "is_featured": True,
                "expected_roi": 8.4,
                "description": "Breathtaking 4 BHK sky penthouse at Lodha World One with panoramic views of the Arabian Sea. Features Italian marble flooring, automated blinds, chef's kitchen, and a private sky garden. Among Mumbai's most coveted addresses.",
                "amenities": ["Infinity Pool", "Sky Lounge", "Private Elevator", "Home Automation", "Concierge Service", "24/7 Security"],
                "images": [IMAGES[0], IMAGES[6], IMAGES[9]],
                "latitude": 19.0176,
                "longitude": 72.8131,
                "maintenance_monthly": 25000,
                "parking_spots": 3,
                "facing": "West - Sea Facing",
                "furnishing": "Fully Furnished",
                "rera_number": "P51900023456",
            },
            {
                "name": "Lodha Crown Residences",
                "builder": "Lodha Group",
                "city": "Mumbai",
                "project": "Lodha World One",
                "locality": "Lower Parel",
                "full_address": "Lodha Crown, Lower Parel, Mumbai 400013",
                "property_type": PropertyType.apartment,
                "status": PropertyStatus.available,
                "bedrooms": 3,
                "bathrooms": 3,
                "area_sqft": 1850.0,
                "price": 12500000,
                "price_per_sqft": 6757,
                "possession_date": "June 2026",
                "rating": 4.7,
                "is_featured": True,
                "expected_roi": 7.8,
                "description": "Premium 3 BHK residence in the iconic Lodha Crown tower. High ceilings, floor-to-ceiling glass, modular kitchen with Bosch appliances, and a sprawling balcony with city skyline views.",
                "amenities": ["Swimming Pool", "Gymnasium", "Clubhouse", "Children's Play Area", "24/7 Security", "EV Charging"],
                "images": [IMAGES[1], IMAGES[7], IMAGES[10]],
                "latitude": 19.0130,
                "longitude": 72.8308,
                "maintenance_monthly": 12000,
                "parking_spots": 2,
                "facing": "North",
                "furnishing": "Semi-Furnished",
                "rera_number": "P51900023457",
            },
            {
                "name": "Shapoorji Pallonji The Imperial",
                "builder": "Shapoorji Pallonji",
                "city": "Mumbai",
                "project": None,
                "locality": "Tardeo",
                "full_address": "The Imperial Towers, Tardeo Road, Mumbai 400034",
                "property_type": PropertyType.apartment,
                "status": PropertyStatus.available,
                "bedrooms": 2,
                "bathrooms": 2,
                "area_sqft": 1350.0,
                "price": 8200000,
                "price_per_sqft": 6074,
                "possession_date": "Ready to Move",
                "rating": 4.6,
                "is_featured": False,
                "expected_roi": 7.2,
                "description": "Elegant 2 BHK in the award-winning Imperial Towers. Stunning southward city views, high-quality finish, and premium amenities. Walking distance to Haji Ali.",
                "amenities": ["Gymnasium", "Swimming Pool", "Spa & Wellness", "Concierge Service", "24/7 Security", "CCTV Surveillance"],
                "images": [IMAGES[2], IMAGES[8], IMAGES[11]],
                "latitude": 18.9707,
                "longitude": 72.8140,
                "maintenance_monthly": 8000,
                "parking_spots": 1,
                "facing": "South",
                "furnishing": "Unfurnished",
                "rera_number": "P51900021001",
            },
            {
                "name": "Godrej Platinum Bandra",
                "builder": "Godrej Properties",
                "city": "Mumbai",
                "project": None,
                "locality": "Bandra West",
                "full_address": "Godrej Platinum, Bandra West, Mumbai 400050",
                "property_type": PropertyType.apartment,
                "status": PropertyStatus.available,
                "bedrooms": 3,
                "bathrooms": 3,
                "area_sqft": 2100.0,
                "price": 18500000,
                "price_per_sqft": 8810,
                "possession_date": "Dec 2026",
                "rating": 4.8,
                "is_featured": True,
                "expected_roi": 9.1,
                "description": "Luxurious 3 BHK in Bandra's most coveted address. Features a private terrace, designer kitchen, premium sanitary ware, and sweeping sea views from the living room.",
                "amenities": ["Rooftop Garden", "Gymnasium", "Swimming Pool", "Yoga Studio", "24/7 Security", "Valet Parking"],
                "images": [IMAGES[3], IMAGES[9], IMAGES[12]],
                "latitude": 19.0596,
                "longitude": 72.8295,
                "maintenance_monthly": 15000,
                "parking_spots": 2,
                "facing": "West - Sea Facing",
                "furnishing": "Semi-Furnished",
                "rera_number": "P51900024001",
            },
            {
                "name": "Lodha Thane Studio Tower",
                "builder": "Lodha Group",
                "city": "Mumbai",
                "project": None,
                "locality": "Thane West",
                "full_address": "Lodha Splendora, Thane West, Mumbai 400615",
                "property_type": PropertyType.studio,
                "status": PropertyStatus.available,
                "bedrooms": 1,
                "bathrooms": 1,
                "area_sqft": 650.0,
                "price": 4200000,
                "price_per_sqft": 6462,
                "possession_date": "Ready to Move",
                "rating": 4.3,
                "is_featured": False,
                "expected_roi": 6.8,
                "description": "Compact yet premium studio apartment in Thane West. Ideal for young professionals. Fully fitted kitchen, modern bathroom, and access to all tower amenities.",
                "amenities": ["Gymnasium", "Swimming Pool", "Children's Play Area", "24/7 Security", "Power Backup"],
                "images": [IMAGES[4], IMAGES[10], IMAGES[13]],
                "latitude": 19.2183,
                "longitude": 72.9781,
                "maintenance_monthly": 4000,
                "parking_spots": 1,
                "facing": "East",
                "furnishing": "Fully Furnished",
                "rera_number": "P51900019001",
            },
            {
                "name": "Prestige Nautilus Mumbai",
                "builder": "Prestige Group",
                "city": "Mumbai",
                "project": None,
                "locality": "Andheri West",
                "full_address": "Prestige Nautilus, Andheri West, Mumbai 400053",
                "property_type": PropertyType.apartment,
                "status": PropertyStatus.reserved,
                "bedrooms": 2,
                "bathrooms": 2,
                "area_sqft": 1150.0,
                "price": 9500000,
                "price_per_sqft": 8261,
                "possession_date": "March 2027",
                "rating": 4.5,
                "is_featured": False,
                "expected_roi": 7.5,
                "description": "Contemporary 2 BHK in Prestige Nautilus, Andheri's premium residential address. Modern design, ample natural light, and proximity to the airport and business districts.",
                "amenities": ["Swimming Pool", "Clubhouse", "Gymnasium", "Children's Play Area", "24/7 Security", "EV Charging"],
                "images": [IMAGES[5], IMAGES[11], IMAGES[14]],
                "latitude": 19.1364,
                "longitude": 72.8296,
                "maintenance_monthly": 7500,
                "parking_spots": 1,
                "facing": "North-West",
                "furnishing": "Unfurnished",
                "rera_number": "P51900022001",
            },
            # PUNE (6 properties)
            {
                "name": "Shapoorji Parkwest Pune",
                "builder": "Shapoorji Pallonji",
                "city": "Pune",
                "project": "Shapoorji Pallonji Joyville",
                "locality": "Baner",
                "full_address": "SP Parkwest, Baner, Pune 411045",
                "property_type": PropertyType.apartment,
                "status": PropertyStatus.available,
                "bedrooms": 3,
                "bathrooms": 3,
                "area_sqft": 1750.0,
                "price": 12800000,
                "price_per_sqft": 7314,
                "possession_date": "Ready to Move",
                "rating": 4.7,
                "is_featured": True,
                "expected_roi": 8.0,
                "description": "Iconic 3 BHK in SP Parkwest, Baner's most premium gated community. Surrounded by 18 acres of landscaped greens, this home features top-tier finishes and spectacular hill views.",
                "amenities": ["Swimming Pool", "Clubhouse", "Gymnasium", "Jogging Track", "Cricket Pitch", "24/7 Security", "Rainwater Harvesting"],
                "images": [IMAGES[6], IMAGES[0], IMAGES[8]],
                "latitude": 18.5590,
                "longitude": 73.7868,
                "maintenance_monthly": 10000,
                "parking_spots": 2,
                "facing": "North",
                "furnishing": "Semi-Furnished",
                "rera_number": "P52100011001",
            },
            {
                "name": "Prestige Meadows Villa",
                "builder": "Prestige Group",
                "city": "Pune",
                "project": None,
                "locality": "Koregaon Park",
                "full_address": "Prestige Meadows, Koregaon Park, Pune 411001",
                "property_type": PropertyType.villa,
                "status": PropertyStatus.available,
                "bedrooms": 4,
                "bathrooms": 5,
                "area_sqft": 5200.0,
                "price": 45000000,
                "price_per_sqft": 8654,
                "possession_date": "Dec 2026",
                "rating": 4.9,
                "is_featured": True,
                "expected_roi": 7.8,
                "description": "Luxurious private villa with independent swimming pool and bespoke landscaping in Koregaon Park. Handcrafted interiors, 4-car garage, and a personal garden terrace.",
                "amenities": ["Private Garden", "Golf Simulator", "Wine Cellar", "Concierge Service", "24/7 Security", "Home Automation"],
                "images": [IMAGES[7], IMAGES[1], IMAGES[9]],
                "latitude": 18.5363,
                "longitude": 73.8897,
                "maintenance_monthly": 35000,
                "parking_spots": 4,
                "facing": "East",
                "furnishing": "Fully Furnished",
                "rera_number": "P52100012001",
            },
            {
                "name": "Godrej Infinity Kharadi",
                "builder": "Godrej Properties",
                "city": "Pune",
                "project": None,
                "locality": "Kharadi",
                "full_address": "Godrej Infinity, Kharadi, Pune 411014",
                "property_type": PropertyType.apartment,
                "status": PropertyStatus.available,
                "bedrooms": 2,
                "bathrooms": 2,
                "area_sqft": 1100.0,
                "price": 7500000,
                "price_per_sqft": 6818,
                "possession_date": "Ready to Move",
                "rating": 4.5,
                "is_featured": False,
                "expected_roi": 8.5,
                "description": "Prime 2 BHK in the IT corridor of Kharadi. Walking distance to EON IT Park. Excellent investment opportunity with high rental yield potential.",
                "amenities": ["Swimming Pool", "Gymnasium", "Clubhouse", "Children's Play Area", "EV Charging", "24/7 Security"],
                "images": [IMAGES[8], IMAGES[2], IMAGES[10]],
                "latitude": 18.5529,
                "longitude": 73.9412,
                "maintenance_monthly": 6000,
                "parking_spots": 1,
                "facing": "South",
                "furnishing": "Semi-Furnished",
                "rera_number": "P52100013001",
            },
            {
                "name": "Brigade Atmosphere Pune",
                "builder": "Brigade Group",
                "city": "Pune",
                "project": None,
                "locality": "Hinjewadi Phase 2",
                "full_address": "Brigade Atmosphere, Hinjewadi Phase 2, Pune 411057",
                "property_type": PropertyType.apartment,
                "status": PropertyStatus.available,
                "bedrooms": 3,
                "bathrooms": 2,
                "area_sqft": 1450.0,
                "price": 9800000,
                "price_per_sqft": 6759,
                "possession_date": "June 2027",
                "rating": 4.4,
                "is_featured": False,
                "expected_roi": 8.2,
                "description": "Spacious 3 BHK in the IT hub of Hinjewadi. Well-designed apartments with large balconies, modular kitchen, and access to a massive clubhouse.",
                "amenities": ["Swimming Pool", "Gymnasium", "Clubhouse", "Badminton Court", "Jogging Track", "24/7 Security"],
                "images": [IMAGES[9], IMAGES[3], IMAGES[11]],
                "latitude": 18.5912,
                "longitude": 73.7389,
                "maintenance_monthly": 7500,
                "parking_spots": 1,
                "facing": "West",
                "furnishing": "Unfurnished",
                "rera_number": "P52100014001",
            },
            {
                "name": "Sobha City Wakad",
                "builder": "Sobha Limited",
                "city": "Pune",
                "project": None,
                "locality": "Wakad",
                "full_address": "Sobha City, Wakad, Pune 411057",
                "property_type": PropertyType.apartment,
                "status": PropertyStatus.available,
                "bedrooms": 2,
                "bathrooms": 2,
                "area_sqft": 1050.0,
                "price": 8200000,
                "price_per_sqft": 7810,
                "possession_date": "Ready to Move",
                "rating": 4.6,
                "is_featured": False,
                "expected_roi": 7.9,
                "description": "Premium 2 BHK from Sobha Limited in upscale Wakad. Sobha's signature quality construction with double-glazed windows, vitrified tiles, and a modern open kitchen.",
                "amenities": ["Swimming Pool", "Gymnasium", "Children's Play Area", "Yoga Studio", "24/7 Security", "Rainwater Harvesting"],
                "images": [IMAGES[10], IMAGES[4], IMAGES[12]],
                "latitude": 18.5982,
                "longitude": 73.7617,
                "maintenance_monthly": 6500,
                "parking_spots": 1,
                "facing": "East",
                "furnishing": "Semi-Furnished",
                "rera_number": "P52100015001",
            },
            {
                "name": "Lodha Belmondo Pune",
                "builder": "Lodha Group",
                "city": "Pune",
                "project": None,
                "locality": "Gahunje",
                "full_address": "Lodha Belmondo, Gahunje, Pune 412101",
                "property_type": PropertyType.villa,
                "status": PropertyStatus.reserved,
                "bedrooms": 3,
                "bathrooms": 3,
                "area_sqft": 2800.0,
                "price": 22000000,
                "price_per_sqft": 7857,
                "possession_date": "March 2027",
                "rating": 4.8,
                "is_featured": True,
                "expected_roi": 8.1,
                "description": "Premium row villa set amid a 100-acre riverside development. Private gardens, a 9-hole golf course, and a clubhouse make Belmondo the most lifestyle-centric address in Pune.",
                "amenities": ["Golf Simulator", "Swimming Pool", "Spa & Wellness", "Jogging Track", "Tennis Court", "Concierge Service"],
                "images": [IMAGES[11], IMAGES[5], IMAGES[13]],
                "latitude": 18.5951,
                "longitude": 73.6900,
                "maintenance_monthly": 18000,
                "parking_spots": 2,
                "facing": "South",
                "furnishing": "Semi-Furnished",
                "rera_number": "P52100016001",
            },
            # BANGALORE (6 properties)
            {
                "name": "Prestige Lakeside Habitat",
                "builder": "Prestige Group",
                "city": "Bangalore",
                "project": "Prestige Lakeside Habitat",
                "locality": "Whitefield",
                "full_address": "Prestige Lakeside Habitat, Whitefield, Bangalore 560066",
                "property_type": PropertyType.apartment,
                "status": PropertyStatus.available,
                "bedrooms": 3,
                "bathrooms": 3,
                "area_sqft": 1850.0,
                "price": 15500000,
                "price_per_sqft": 8378,
                "possession_date": "Ready to Move",
                "rating": 4.8,
                "is_featured": True,
                "expected_roi": 8.6,
                "description": "Spectacular 3 BHK apartment in Prestige Lakeside Habitat, Whitefield's most sought-after address. Lake-facing units with serene views, premium amenities, and connected to Whitefield IT corridor.",
                "amenities": ["Swimming Pool", "Clubhouse", "Gymnasium", "Jogging Track", "Children's Play Area", "24/7 Security", "Solar Panels"],
                "images": [IMAGES[12], IMAGES[6], IMAGES[0]],
                "latitude": 12.9784,
                "longitude": 77.7266,
                "maintenance_monthly": 12000,
                "parking_spots": 2,
                "facing": "East - Lake Facing",
                "furnishing": "Semi-Furnished",
                "rera_number": "PRM/KA/RERA/1251/446/PR/180628/001861",
            },
            {
                "name": "Sobha Royal Pavilion",
                "builder": "Sobha Limited",
                "city": "Bangalore",
                "project": "Sobha Dream Acres",
                "locality": "Sarjapur Road",
                "full_address": "Sobha Royal Pavilion, Sarjapur Road, Bangalore 560102",
                "property_type": PropertyType.apartment,
                "status": PropertyStatus.available,
                "bedrooms": 3,
                "bathrooms": 3,
                "area_sqft": 1900.0,
                "price": 18000000,
                "price_per_sqft": 9474,
                "possession_date": "Ready to Move",
                "rating": 4.7,
                "is_featured": True,
                "expected_roi": 8.2,
                "description": "Rajasthani-inspired premium architecture with handcrafted marble designs. Located in Sarjapur Road, one of Bangalore's fastest-growing corridors. Double-glazed soundproof windows.",
                "amenities": ["Swimming Pool", "Gymnasium", "Badminton Court", "Cricket Pitch", "Billiard Room", "24/7 Security"],
                "images": [IMAGES[13], IMAGES[7], IMAGES[1]],
                "latitude": 12.8685,
                "longitude": 77.6748,
                "maintenance_monthly": 14000,
                "parking_spots": 2,
                "facing": "North",
                "furnishing": "Unfurnished",
                "rera_number": "PRM/KA/RERA/1251/446/PR/180628/001862",
            },
            {
                "name": "Brigade Exotica Bangalore",
                "builder": "Brigade Group",
                "city": "Bangalore",
                "project": "Brigade Orchards",
                "locality": "Old Madras Road",
                "full_address": "Brigade Exotica, Old Madras Road, Bangalore 560049",
                "property_type": PropertyType.apartment,
                "status": PropertyStatus.available,
                "bedrooms": 4,
                "bathrooms": 4,
                "area_sqft": 3100.0,
                "price": 29000000,
                "price_per_sqft": 9355,
                "possession_date": "Ready to Move",
                "rating": 4.6,
                "is_featured": True,
                "expected_roi": 7.9,
                "description": "Ultra-luxury 4 BHK in Brigade Exotica — one of Bangalore's tallest residential towers. Private terrace, custom wardrobes, and a dedicated maid's quarters.",
                "amenities": ["Infinity Pool", "Sky Lounge", "Gymnasium", "Spa & Wellness", "Concierge Service", "Mini Theatre"],
                "images": [IMAGES[14], IMAGES[8], IMAGES[2]],
                "latitude": 13.0017,
                "longitude": 77.6603,
                "maintenance_monthly": 20000,
                "parking_spots": 3,
                "facing": "South-West",
                "furnishing": "Fully Furnished",
                "rera_number": "PRM/KA/RERA/1251/446/PR/180628/001863",
            },
            {
                "name": "Godrej Aqua Bangalore",
                "builder": "Godrej Properties",
                "city": "Bangalore",
                "project": None,
                "locality": "International Airport Road",
                "full_address": "Godrej Aqua, Bidrahalli, Bangalore 562149",
                "property_type": PropertyType.apartment,
                "status": PropertyStatus.available,
                "bedrooms": 2,
                "bathrooms": 2,
                "area_sqft": 1200.0,
                "price": 8900000,
                "price_per_sqft": 7417,
                "possession_date": "June 2027",
                "rating": 4.4,
                "is_featured": False,
                "expected_roi": 9.0,
                "description": "Water-themed residential complex near the international airport. Purified drinking water, sustainable design, and green landscapes. Ideal for frequent travelers.",
                "amenities": ["Swimming Pool", "Gymnasium", "Rainwater Harvesting", "Solar Panels", "EV Charging", "24/7 Security"],
                "images": [IMAGES[0], IMAGES[9], IMAGES[3]],
                "latitude": 13.1010,
                "longitude": 77.6200,
                "maintenance_monthly": 7000,
                "parking_spots": 1,
                "facing": "North",
                "furnishing": "Unfurnished",
                "rera_number": "PRM/KA/RERA/1251/446/PR/180628/001864",
            },
            {
                "name": "Prestige Tranquility Plots",
                "builder": "Prestige Group",
                "city": "Bangalore",
                "project": None,
                "locality": "Budigere Cross",
                "full_address": "Prestige Tranquility, Budigere Cross, Bangalore 562129",
                "property_type": PropertyType.plot,
                "status": PropertyStatus.available,
                "bedrooms": None,
                "bathrooms": None,
                "area_sqft": 1200.0,
                "price": 5200000,
                "price_per_sqft": 4333,
                "possession_date": "Ready to Move",
                "rating": 4.3,
                "is_featured": False,
                "expected_roi": 11.0,
                "description": "Premium residential plot in Prestige Tranquility — a BMRDA-approved township. All civic amenities in place. Build your dream villa in Bangalore's emerging north-east corridor.",
                "amenities": ["24/7 Security", "Rainwater Harvesting", "Power Backup", "CCTV Surveillance"],
                "images": [IMAGES[1], IMAGES[10], IMAGES[4]],
                "latitude": 13.0735,
                "longitude": 77.7401,
                "maintenance_monthly": 2000,
                "parking_spots": 0,
                "facing": "East",
                "furnishing": "Unfurnished",
                "rera_number": "PRM/KA/RERA/1251/446/PR/180628/001865",
            },
            {
                "name": "Lodha Splendora Bangalore",
                "builder": "Lodha Group",
                "city": "Bangalore",
                "project": None,
                "locality": "Electronic City",
                "full_address": "Lodha Splendora, Electronic City Phase 1, Bangalore 560100",
                "property_type": PropertyType.apartment,
                "status": PropertyStatus.available,
                "bedrooms": 2,
                "bathrooms": 2,
                "area_sqft": 1050.0,
                "price": 7200000,
                "price_per_sqft": 6857,
                "possession_date": "Dec 2026",
                "rating": 4.5,
                "is_featured": False,
                "expected_roi": 8.8,
                "description": "Value-packed 2 BHK from Lodha in Electronic City — Bangalore's IT powerhouse. High rental demand, modern design, and full amenities make this an excellent first home or investment.",
                "amenities": ["Swimming Pool", "Gymnasium", "Clubhouse", "Children's Play Area", "Jogging Track", "24/7 Security"],
                "images": [IMAGES[2], IMAGES[11], IMAGES[5]],
                "latitude": 12.8399,
                "longitude": 77.6770,
                "maintenance_monthly": 5500,
                "parking_spots": 1,
                "facing": "West",
                "furnishing": "Semi-Furnished",
                "rera_number": "PRM/KA/RERA/1251/446/PR/180628/001866",
            },
            # HYDERABAD (6 properties)
            {
                "name": "Prestige High Fields",
                "builder": "Prestige Group",
                "city": "Hyderabad",
                "project": None,
                "locality": "Gachibowli",
                "full_address": "Prestige High Fields, Gachibowli, Hyderabad 500032",
                "property_type": PropertyType.apartment,
                "status": PropertyStatus.available,
                "bedrooms": 3,
                "bathrooms": 3,
                "area_sqft": 1800.0,
                "price": 14500000,
                "price_per_sqft": 8056,
                "possession_date": "Ready to Move",
                "rating": 4.8,
                "is_featured": True,
                "expected_roi": 9.2,
                "description": "Commanding 3 BHK in Hyderabad's financial district. Breathtaking HITECH City skyline views, high-quality finishes, and proximity to leading tech companies and hospitals.",
                "amenities": ["Swimming Pool", "Gymnasium", "Clubhouse", "Rooftop Garden", "Children's Play Area", "EV Charging"],
                "images": [IMAGES[3], IMAGES[12], IMAGES[6]],
                "latitude": 17.4401,
                "longitude": 78.3489,
                "maintenance_monthly": 10000,
                "parking_spots": 2,
                "facing": "South - City Facing",
                "furnishing": "Semi-Furnished",
                "rera_number": "P01100002512",
            },
            {
                "name": "Lodha Meridian Hyderabad",
                "builder": "Lodha Group",
                "city": "Hyderabad",
                "project": None,
                "locality": "Kokapet",
                "full_address": "Lodha Meridian, Kokapet, Hyderabad 500075",
                "property_type": PropertyType.apartment,
                "status": PropertyStatus.available,
                "bedrooms": 4,
                "bathrooms": 4,
                "area_sqft": 3200.0,
                "price": 32000000,
                "price_per_sqft": 10000,
                "possession_date": "June 2026",
                "rating": 4.9,
                "is_featured": True,
                "expected_roi": 8.5,
                "description": "Hyderabad's most premium address in Kokapet. 4 BHK residences with private pools, butler service, and world-class amenities. Adjacent to the Financial District.",
                "amenities": ["Private Elevator", "Home Automation", "Wine Cellar", "Infinity Pool", "Concierge Service", "Valet Parking"],
                "images": [IMAGES[4], IMAGES[13], IMAGES[7]],
                "latitude": 17.4035,
                "longitude": 78.3337,
                "maintenance_monthly": 28000,
                "parking_spots": 3,
                "facing": "West - Lake Facing",
                "furnishing": "Fully Furnished",
                "rera_number": "P01100002513",
            },
            {
                "name": "Sobha City Kompally",
                "builder": "Sobha Limited",
                "city": "Hyderabad",
                "project": None,
                "locality": "Kompally",
                "full_address": "Sobha City, Kompally, Hyderabad 500100",
                "property_type": PropertyType.apartment,
                "status": PropertyStatus.available,
                "bedrooms": 2,
                "bathrooms": 2,
                "area_sqft": 1200.0,
                "price": 8500000,
                "price_per_sqft": 7083,
                "possession_date": "Ready to Move",
                "rating": 4.5,
                "is_featured": False,
                "expected_roi": 7.8,
                "description": "Peaceful 2 BHK in Kompally's growing residential belt. Surrounded by greenery with Sobha's signature quality construction. Close to ORR and new metro corridor.",
                "amenities": ["Swimming Pool", "Gymnasium", "Jogging Track", "Yoga Studio", "24/7 Security", "Solar Panels"],
                "images": [IMAGES[5], IMAGES[14], IMAGES[8]],
                "latitude": 17.5520,
                "longitude": 78.4740,
                "maintenance_monthly": 6500,
                "parking_spots": 1,
                "facing": "East",
                "furnishing": "Unfurnished",
                "rera_number": "P01100002514",
            },
            {
                "name": "Godrej Woodsworth Hyderabad",
                "builder": "Godrej Properties",
                "city": "Hyderabad",
                "project": None,
                "locality": "Manikonda",
                "full_address": "Godrej Woodsworth, Manikonda, Hyderabad 500089",
                "property_type": PropertyType.apartment,
                "status": PropertyStatus.available,
                "bedrooms": 3,
                "bathrooms": 3,
                "area_sqft": 1650.0,
                "price": 12800000,
                "price_per_sqft": 7758,
                "possession_date": "Dec 2026",
                "rating": 4.6,
                "is_featured": False,
                "expected_roi": 8.3,
                "description": "Forest-themed luxury living in Manikonda. 5 acres of green landscape, wooden-textured walls, and earthy tones create a serene urban retreat near Financial District.",
                "amenities": ["Swimming Pool", "Gymnasium", "Spa & Wellness", "Children's Play Area", "Pet Park", "24/7 Security"],
                "images": [IMAGES[6], IMAGES[0], IMAGES[9]],
                "latitude": 17.4047,
                "longitude": 78.3874,
                "maintenance_monthly": 9000,
                "parking_spots": 2,
                "facing": "North",
                "furnishing": "Semi-Furnished",
                "rera_number": "P01100002515",
            },
            {
                "name": "Brigade Cornerstone Utopia",
                "builder": "Brigade Group",
                "city": "Hyderabad",
                "project": None,
                "locality": "Varthur Road",
                "full_address": "Brigade Cornerstone Utopia, Varthur Road, Hyderabad 501218",
                "property_type": PropertyType.apartment,
                "status": PropertyStatus.available,
                "bedrooms": 2,
                "bathrooms": 2,
                "area_sqft": 1100.0,
                "price": 7800000,
                "price_per_sqft": 7091,
                "possession_date": "March 2027",
                "rating": 4.4,
                "is_featured": False,
                "expected_roi": 9.4,
                "description": "Thoughtfully designed 2 BHK in one of Hyderabad's fastest-appreciating zones. Massive 55-acre township with all amenities and excellent connectivity to IT hubs.",
                "amenities": ["Swimming Pool", "Gymnasium", "Tennis Court", "Clubhouse", "Children's Play Area", "Rainwater Harvesting"],
                "images": [IMAGES[7], IMAGES[1], IMAGES[10]],
                "latitude": 17.4353,
                "longitude": 78.5697,
                "maintenance_monthly": 5500,
                "parking_spots": 1,
                "facing": "West",
                "furnishing": "Unfurnished",
                "rera_number": "P01100002516",
            },
            {
                "name": "Shapoorji Hyderabad One",
                "builder": "Shapoorji Pallonji",
                "city": "Hyderabad",
                "project": None,
                "locality": "Attapur",
                "full_address": "Shapoorji Hyderabad One, Attapur, Hyderabad 500048",
                "property_type": PropertyType.apartment,
                "status": PropertyStatus.available,
                "bedrooms": 3,
                "bathrooms": 2,
                "area_sqft": 1550.0,
                "price": 11200000,
                "price_per_sqft": 7226,
                "possession_date": "Ready to Move",
                "rating": 4.5,
                "is_featured": False,
                "expected_roi": 7.6,
                "description": "Spacious 3 BHK by the legendary Shapoorji Pallonji. Centrally located in Attapur with fast access to HITECH City and Old City. Premium build quality with 10-year warranty.",
                "amenities": ["Swimming Pool", "Gymnasium", "Library", "Business Center", "24/7 Security", "Power Backup"],
                "images": [IMAGES[8], IMAGES[2], IMAGES[11]],
                "latitude": 17.3850,
                "longitude": 78.4290,
                "maintenance_monthly": 8000,
                "parking_spots": 2,
                "facing": "South",
                "furnishing": "Semi-Furnished",
                "rera_number": "P01100002517",
            },
            # DELHI NCR (6 properties)
            {
                "name": "Godrej Meridien Delhi",
                "builder": "Godrej Properties",
                "city": "Delhi NCR",
                "project": "Godrej Meridien",
                "locality": "Sector 106, Gurugram",
                "full_address": "Godrej Meridien, Sector 106, Dwarka Expressway, Gurugram 122001",
                "property_type": PropertyType.apartment,
                "status": PropertyStatus.available,
                "bedrooms": 3,
                "bathrooms": 3,
                "area_sqft": 2100.0,
                "price": 18500000,
                "price_per_sqft": 8810,
                "possession_date": "Ready to Move",
                "rating": 4.8,
                "is_featured": True,
                "expected_roi": 9.1,
                "description": "Opulent 3 BHK in Godrej Meridien — one of Gurugram's most acclaimed projects. Features a French-styled interior, sprawling balcony, private club, and Dwarka Expressway connectivity.",
                "amenities": ["Infinity Pool", "Gymnasium", "Spa & Wellness", "Concierge Service", "Tennis Court", "24/7 Security"],
                "images": [IMAGES[9], IMAGES[3], IMAGES[12]],
                "latitude": 28.4595,
                "longitude": 76.9906,
                "maintenance_monthly": 15000,
                "parking_spots": 2,
                "facing": "South",
                "furnishing": "Semi-Furnished",
                "rera_number": "GGM/454/186/2019/61",
            },
            {
                "name": "Lodha Sector 150 Noida",
                "builder": "Lodha Group",
                "city": "Delhi NCR",
                "project": None,
                "locality": "Sector 150, Noida",
                "full_address": "Lodha Sector 150, Sports City, Noida 201310",
                "property_type": PropertyType.apartment,
                "status": PropertyStatus.available,
                "bedrooms": 4,
                "bathrooms": 4,
                "area_sqft": 2800.0,
                "price": 24000000,
                "price_per_sqft": 8571,
                "possession_date": "June 2026",
                "rating": 4.7,
                "is_featured": True,
                "expected_roi": 8.3,
                "description": "Premium 4 BHK in Noida's iconic Sports City. Sprawling 9-hole golf course, cricket academy, and stadium-grade sports facilities. One of Delhi NCR's most lifestyle-oriented projects.",
                "amenities": ["Golf Simulator", "Swimming Pool", "Cricket Pitch", "Tennis Court", "Gymnasium", "Mini Theatre"],
                "images": [IMAGES[10], IMAGES[4], IMAGES[13]],
                "latitude": 28.3925,
                "longitude": 77.3344,
                "maintenance_monthly": 18000,
                "parking_spots": 3,
                "facing": "East - Golf Course Facing",
                "furnishing": "Fully Furnished",
                "rera_number": "UPRERAPRJ26445",
            },
            {
                "name": "Shapoorji Joyville Gurugram",
                "builder": "Shapoorji Pallonji",
                "city": "Delhi NCR",
                "project": None,
                "locality": "Sector 102, Gurugram",
                "full_address": "Shapoorji Joyville, Sector 102, Dwarka Expressway, Gurugram 122001",
                "property_type": PropertyType.apartment,
                "status": PropertyStatus.available,
                "bedrooms": 2,
                "bathrooms": 2,
                "area_sqft": 1150.0,
                "price": 9500000,
                "price_per_sqft": 8261,
                "possession_date": "Ready to Move",
                "rating": 4.5,
                "is_featured": False,
                "expected_roi": 8.0,
                "description": "Joy-filled living in Shapoorji's flagship Joyville project. 2 BHK with a balcony garden, children's splash pool, and multiple sports courts — perfect for young families.",
                "amenities": ["Swimming Pool", "Gymnasium", "Children's Play Area", "Jogging Track", "Badminton Court", "EV Charging"],
                "images": [IMAGES[11], IMAGES[5], IMAGES[14]],
                "latitude": 28.4772,
                "longitude": 76.9852,
                "maintenance_monthly": 7000,
                "parking_spots": 1,
                "facing": "North-East",
                "furnishing": "Unfurnished",
                "rera_number": "GGM/454/186/2019/62",
            },
            {
                "name": "Sobha City Gurugram",
                "builder": "Sobha Limited",
                "city": "Delhi NCR",
                "project": None,
                "locality": "Sector 108, Gurugram",
                "full_address": "Sobha City, Sector 108, Dwarka Expressway, Gurugram 122001",
                "property_type": PropertyType.apartment,
                "status": PropertyStatus.available,
                "bedrooms": 3,
                "bathrooms": 3,
                "area_sqft": 1750.0,
                "price": 14500000,
                "price_per_sqft": 8286,
                "possession_date": "Dec 2026",
                "rating": 4.6,
                "is_featured": False,
                "expected_roi": 8.7,
                "description": "Premium Sobha construction quality meets Gurugram's prime residential corridor. 3 BHK with large living spaces, high ceilings, and direct Dwarka Expressway connectivity.",
                "amenities": ["Swimming Pool", "Gymnasium", "Clubhouse", "Rooftop Garden", "Yoga Studio", "24/7 Security"],
                "images": [IMAGES[12], IMAGES[6], IMAGES[0]],
                "latitude": 28.4720,
                "longitude": 76.9795,
                "maintenance_monthly": 11000,
                "parking_spots": 2,
                "facing": "South",
                "furnishing": "Semi-Furnished",
                "rera_number": "GGM/454/186/2019/63",
            },
            {
                "name": "Prestige Falcon City Delhi",
                "builder": "Prestige Group",
                "city": "Delhi NCR",
                "project": None,
                "locality": "Sector 95A, Gurugram",
                "full_address": "Prestige Falcon City, Sector 95A, Gurugram 122001",
                "property_type": PropertyType.penthouse,
                "status": PropertyStatus.available,
                "bedrooms": 4,
                "bathrooms": 5,
                "area_sqft": 4500.0,
                "price": 52000000,
                "price_per_sqft": 11556,
                "possession_date": "Ready to Move",
                "rating": 4.9,
                "is_featured": True,
                "expected_roi": 7.5,
                "description": "Ultra-premium penthouse crowning Prestige Falcon City. Sky villa with panoramic Aravalli range views, private pool deck, 4-car garage, home cinema, and personal butler quarters.",
                "amenities": ["Private Elevator", "Home Automation", "Wine Cellar", "Infinity Pool", "Mini Theatre", "Valet Parking", "Concierge Service"],
                "images": [IMAGES[13], IMAGES[7], IMAGES[1]],
                "latitude": 28.4422,
                "longitude": 76.9612,
                "maintenance_monthly": 40000,
                "parking_spots": 4,
                "facing": "South-West - Aravalli Facing",
                "furnishing": "Fully Furnished",
                "rera_number": "GGM/454/186/2019/64",
            },
            {
                "name": "Brigade NCR One",
                "builder": "Brigade Group",
                "city": "Delhi NCR",
                "project": None,
                "locality": "Sector 99A, Gurugram",
                "full_address": "Brigade NCR One, Sector 99A, Gurugram 122001",
                "property_type": PropertyType.apartment,
                "status": PropertyStatus.available,
                "bedrooms": 2,
                "bathrooms": 2,
                "area_sqft": 1050.0,
                "price": 7200000,
                "price_per_sqft": 6857,
                "possession_date": "March 2027",
                "rating": 4.3,
                "is_featured": False,
                "expected_roi": 9.5,
                "description": "Brigade Group's debut in NCR brings its signature South India design aesthetics to Gurugram. Excellent investment opportunity in the rapidly developing Sector 99A corridor.",
                "amenities": ["Swimming Pool", "Gymnasium", "Children's Play Area", "Jogging Track", "24/7 Security", "Rainwater Harvesting"],
                "images": [IMAGES[14], IMAGES[8], IMAGES[2]],
                "latitude": 28.4510,
                "longitude": 76.9720,
                "maintenance_monthly": 5000,
                "parking_spots": 1,
                "facing": "East",
                "furnishing": "Unfurnished",
                "rera_number": "GGM/454/186/2019/65",
            },
        ]

        for i, p_data in enumerate(properties_data):
            slug_base = slugify(p_data["name"]) if callable(slugify) else p_data["name"].lower().replace(" ", "-")
            slug = f"{slug_base}-{i+1}"

            prop = Property(
                name=p_data["name"],
                slug=slug,
                description=p_data["description"],
                property_type=p_data["property_type"],
                status=p_data["status"],
                city_id=cities[p_data["city"]].id,
                locality=p_data["locality"],
                full_address=p_data["full_address"],
                latitude=p_data.get("latitude"),
                longitude=p_data.get("longitude"),
                builder_id=builders[p_data["builder"]].id,
                project_id=projects[p_data["project"]].id if p_data.get("project") and p_data["project"] in projects else None,
                bedrooms=p_data.get("bedrooms"),
                bathrooms=p_data.get("bathrooms"),
                area_sqft=p_data.get("area_sqft"),
                price=p_data["price"],
                price_per_sqft=p_data.get("price_per_sqft"),
                maintenance_monthly=p_data.get("maintenance_monthly"),
                possession_date=p_data.get("possession_date"),
                parking_spots=p_data.get("parking_spots", 1),
                facing=p_data.get("facing"),
                furnishing=p_data.get("furnishing"),
                rating=p_data.get("rating", 4.2),
                is_featured=p_data.get("is_featured", False),
                expected_roi=p_data.get("expected_roi"),
                rera_number=p_data.get("rera_number"),
                is_verified=True,
                is_active=True,
            )
            db.add(prop)
            db.flush()

            # Add images
            for j, img_url in enumerate(p_data.get("images", [])):
                img = PropertyImage(
                    property_id=prop.id,
                    url=img_url,
                    is_primary=(j == 0),
                    sort_order=j,
                )
                db.add(img)

            # Add amenities
            for amenity_name in p_data.get("amenities", []):
                if amenity_name in amenities:
                    pa = PropertyAmenity(
                        property_id=prop.id,
                        amenity_id=amenities[amenity_name].id,
                    )
                    db.add(pa)

        # ── LEADS (10 Sample Leads) ──────────────────────────────────────────
        print("Creating CRM leads...")
        from server.models.lead import Lead, LeadActivity, LeadNote, LeadStageHistory, LeadReminder, LeadStage, LeadSource, LeadPriority
        db.query(LeadActivity).delete()
        db.query(LeadNote).delete()
        db.query(LeadStageHistory).delete()
        db.query(LeadReminder).delete()
        db.query(Lead).delete()

        leads_sample = [
            {"first_name": "Vikram", "last_name": "Aditya", "email": "vikram.a@gmail.com", "phone": "+91 98200 11223", "city": "Mumbai", "locality": "Worli", "budget_max": 35000000, "stage": LeadStage.new, "source": LeadSource.website, "priority": LeadPriority.hot, "lead_score": 85, "est": 35000000},
            {"first_name": "Neha", "last_name": "Kapoor", "email": "neha.k@outlook.com", "phone": "+91 98333 44556", "city": "Mumbai", "locality": "Bandra West", "budget_max": 20000000, "stage": LeadStage.contacted, "source": LeadSource.google_ads, "priority": LeadPriority.high, "lead_score": 75, "est": 20000000},
            {"first_name": "Rohan", "last_name": "Verma", "email": "r.verma@techcorp.com", "phone": "+91 99111 22334", "city": "Bangalore", "locality": "Whitefield", "budget_max": 16000000, "stage": LeadStage.interested, "source": LeadSource.facebook_ads, "priority": LeadPriority.medium, "lead_score": 60, "est": 16000000},
            {"first_name": "Priya", "last_name": "Nair", "email": "priya.nair@yahoo.com", "phone": "+91 97444 55667", "city": "Pune", "locality": "Baner", "budget_max": 13000000, "stage": LeadStage.site_visit_scheduled, "source": LeadSource.referral, "priority": LeadPriority.hot, "lead_score": 90, "est": 13000000},
            {"first_name": "Sanjay", "last_name": "Singhania", "email": "sanjay@singhaniaestates.com", "phone": "+91 98222 33445", "city": "Mumbai", "locality": "Lower Parel", "budget_max": 45000000, "stage": LeadStage.negotiation, "source": LeadSource.walk_in, "priority": LeadPriority.vip, "lead_score": 95, "est": 45000000},
            {"first_name": "Ananya", "last_name": "Roy", "email": "ananya.roy@gmail.com", "phone": "+91 96555 66778", "city": "Delhi NCR", "locality": "Gurgaon", "budget_max": 25000000, "stage": LeadStage.booking_requested, "source": LeadSource.whatsapp, "priority": LeadPriority.high, "lead_score": 88, "est": 25000000},
            {"first_name": "Rajesh", "last_name": "Mehta", "email": "rmehta@mehtatraders.in", "phone": "+91 98111 99887", "city": "Mumbai", "locality": "Juhu", "budget_max": 50000000, "stage": LeadStage.booked, "source": LeadSource.referral, "priority": LeadPriority.vip, "lead_score": 100, "est": 50000000},
            {"first_name": "Amit", "last_name": "Kulkarni", "email": "amit.k@gmail.com", "phone": "+91 98777 88990", "city": "Pune", "locality": "Koregaon Park", "budget_max": 18000000, "stage": LeadStage.lost, "source": LeadSource.website, "priority": LeadPriority.low, "lead_score": 30, "est": 18000000},
        ]

        for idx, ld in enumerate(leads_sample):
            lead = Lead(
                lead_number=f"LD-2026-{(idx+1):04d}",
                first_name=ld["first_name"],
                last_name=ld["last_name"],
                email=ld["email"],
                phone=ld["phone"],
                city=ld["city"],
                locality=ld["locality"],
                budget_max=ld["budget_max"],
                stage=ld["stage"],
                source=ld["source"],
                priority=ld["priority"],
                lead_score=ld["lead_score"],
                estimated_deal_value=ld["est"],
                is_active=True
            )
            db.add(lead)
            db.flush()

            act = LeadActivity(
                lead_id=lead.id,
                activity_type="created",
                title="Lead Created",
                description=f"Inbound lead created via {ld['source'].value}.",
                performed_by="System"
            )
            db.add(act)

        # ── SEED BOOKINGS ──────────────────────────────────────────────────
        print("Creating Booking V2 samples...")
        from server.models.booking import Booking, BookingStatus, BookingPayment, BookingPaymentType, BookingPaymentStatus, BookingPaymentMode, BookingInstallment, BookingInstallmentStatus, BookingTimeline, BookingAudit, BookingAgreement, BookingAgreementStatus, BookingComment
        from datetime import datetime, timedelta

        props = db.query(Property).limit(5).all()
        leads = db.query(Lead).limit(5).all()

        if props:
            b_sample_data = [
                {"status": BookingStatus.TOKEN_PAID, "unit": "1001-A", "base": 25000000.0, "token": 100000.0, "paid": 2500000.0},
                {"status": BookingStatus.APPROVED, "unit": "1204-B", "base": 18000000.0, "token": 100000.0, "paid": 100000.0},
                {"status": BookingStatus.INSTALLMENT_RUNNING, "unit": "502-C", "base": 32000000.0, "token": 100000.0, "paid": 8000000.0},
                {"status": BookingStatus.COMPLETED, "unit": "PH-01", "base": 45000000.0, "token": 200000.0, "paid": 47250000.0},
                {"status": BookingStatus.PENDING_APPROVAL, "unit": "301-D", "base": 15000000.0, "token": 100000.0, "paid": 0.0},
            ]

            for idx, bd in enumerate(b_sample_data):
                p = props[idx % len(props)]
                l = leads[idx % len(leads)] if leads else None
                gross = bd["base"] * 1.05
                gst = gross * 0.05
                net = gross + gst
                bk_num = f"EFL-BK-202607-100{idx+1}"

                bk = Booking(
                    booking_number=bk_num,
                    property_id=p.id,
                    builder_id=p.builder_id,
                    lead_id=l.id if l else None,
                    unit_number=bd["unit"],
                    floor_number=10 + idx,
                    bhk_type=f"{p.bhk or 3} BHK",
                    super_builtup_area=1450.0,
                    carpet_area=1100.0,
                    base_price=bd["base"],
                    gross_total=gross,
                    taxable_amount=gross,
                    gst_amount=gst,
                    net_total=net,
                    token_amount=bd["token"],
                    booking_amount=net * 0.10,
                    paid_amount=bd["paid"],
                    remaining_amount=max(0.0, net - bd["paid"]),
                    status=bd["status"],
                    created_by="System Super Admin",
                )
                db.add(bk)
                db.flush()

                # Add Payment
                if bd["paid"] > 0:
                    pay = BookingPayment(
                        booking_id=bk.id,
                        payment_number=f"PAY-202607-00{idx+1}",
                        payment_type=BookingPaymentType.TOKEN if bd["paid"] <= bd["token"] else BookingPaymentType.INSTALLMENT,
                        payment_mode=BookingPaymentMode.NET_BANKING,
                        status=BookingPaymentStatus.COMPLETED,
                        amount=bd["paid"],
                        total_paid=bd["paid"],
                        transaction_reference=f"TXN-EF998877{idx+1}",
                        bank_name="HDFC Bank",
                        created_by="System Super Admin",
                    )
                    db.add(pay)

                # Add Installments
                for inst_i in range(1, 5):
                    inst = BookingInstallment(
                        booking_id=bk.id,
                        installment_number=inst_i,
                        name=f"Milestone #{inst_i} Payment",
                        percentage=25.0,
                        due_amount=net * 0.25,
                        paid_amount=net * 0.25 if (bd["paid"] >= (net * 0.25 * inst_i)) else 0.0,
                        due_date=datetime.utcnow() + timedelta(days=inst_i * 30),
                        status=BookingInstallmentStatus.PAID if (bd["paid"] >= (net * 0.25 * inst_i)) else BookingInstallmentStatus.PENDING,
                        created_by="System Super Admin",
                    )
                    db.add(inst)

                # Add Agreement
                agr = BookingAgreement(
                    booking_id=bk.id,
                    agreement_number=f"AGR-{bk_num}",
                    status=BookingAgreementStatus.GENERATED if bd["status"] != BookingStatus.DRAFT else BookingAgreementStatus.DRAFT,
                    pdf_file_url=f"/agreements/AGR-{bk_num}.pdf",
                    created_by="System Super Admin",
                )
                db.add(agr)

                # Add Timeline & Comment
                t = BookingTimeline(
                    booking_id=bk.id,
                    event_type="booking_created",
                    title="Booking Initialized",
                    description=f"Booking {bk_num} created for Unit {bd['unit']}.",
                    performed_by="System Super Admin",
                )
                db.add(t)

                c = BookingComment(
                    booking_id=bk.id,
                    author_name="Super Admin",
                    content=f"Initial booking validation complete. Customer preference: {bd['unit']}.",
                    created_by="Super Admin",
                )
                db.add(c)

        # ── SITE VISITS ──────────────────────────────────────────────────────
        print("Creating premium Site Visits...")
        from server.models.site_visit import (
            SiteVisit, VisitStatus, VisitType, VisitPriority, SiteVisitAssignment,
            SiteVisitTimeline, SiteVisitComment, SiteVisitDocument, SiteVisitFeedback,
            SiteVisitStatusHistory, SiteVisitRoute, SiteVisitAttendance
        )

        customers = db.query(User).filter(User.role == "customer").limit(5).all()
        properties = db.query(Property).limit(5).all()
        executives = db.query(AdminUser).limit(3).all()
        leads = db.query(Lead).limit(5).all()

        if customers and properties and executives:
            for idx in range(5):
                cust = customers[idx % len(customers)]
                prop = properties[idx % len(properties)]
                exec_rep = executives[idx % len(executives)]
                ld = leads[idx % len(leads)] if leads else None

                statuses = [VisitStatus.scheduled, VisitStatus.completed, VisitStatus.cancelled, VisitStatus.arrived, VisitStatus.rescheduled]
                priorities = [VisitPriority.medium, VisitPriority.high, VisitPriority.low, VisitPriority.medium, VisitPriority.high]
                v_type = [VisitType.physical, VisitType.physical, VisitType.guided, VisitType.virtual, VisitType.physical]
                
                visit = SiteVisit(
                    visit_number=f"EFL-SV-202607-00{idx+1}",
                    lead_id=ld.id if ld else None,
                    customer_id=cust.id,
                    property_id=prop.id,
                    builder_id=prop.builder_id,
                    sales_executive_id=exec_rep.id,
                    assigned_manager_id=exec_rep.id,
                    status=statuses[idx],
                    visit_type=v_type[idx],
                    purpose="Premium Property Tour & Amenities Inspection",
                    scheduled_date=datetime.utcnow() + timedelta(days=idx - 2, hours=10 + idx),
                    scheduled_time="10:00 AM",
                    expected_duration=60,
                    transport_required=(idx % 2 == 0),
                    pickup_location="Mumbai Central Station" if (idx % 2 == 0) else None,
                    drop_location="Site Office" if (idx % 2 == 0) else None,
                    feedback_score=5 if statuses[idx] == VisitStatus.completed else None,
                    conversion_probability=0.85 if statuses[idx] == VisitStatus.completed else 0.4,
                    gps_coordinates="19.0760, 72.8777",
                    created_by="System Super Admin",
                    priority=priorities[idx],
                )
                db.add(visit)
                db.flush()

                # Assignment
                asg = SiteVisitAssignment(
                    site_visit_id=visit.id,
                    sales_executive_id=exec_rep.id,
                    assignment_rule="round_robin",
                    status="accepted",
                    created_by="System Super Admin",
                )
                db.add(asg)

                # Timeline & Comment
                t = SiteVisitTimeline(
                    site_visit_id=visit.id,
                    event_type="created",
                    title="Site Visit Scheduled",
                    description=f"Assigned to sales representative {exec_rep.full_name}.",
                    performed_by="System Super Admin",
                )
                db.add(t)

                c = SiteVisitComment(
                    site_visit_id=visit.id,
                    author_name="Super Admin",
                    comment="Customer prefers morning slot and wants to see show flat details.",
                    created_by="Super Admin",
                )
                db.add(c)

                # Document
                doc = SiteVisitDocument(
                    site_visit_id=visit.id,
                    document_name="VisitPass.pdf",
                    document_type="visit_pass",
                    file_url=f"/documents/passes/pass_{visit.visit_number}.pdf",
                    is_verified=True,
                    created_by="System Super Admin",
                )
                db.add(doc)

                # Feedback if completed
                if visit.status == VisitStatus.completed:
                    fb = SiteVisitFeedback(
                        site_visit_id=visit.id,
                        rating=5,
                        comments="Extremely professional executive. Loved the show flat layout.",
                        interested_in_booking=True,
                        next_action="Provide booking draft documentation.",
                        created_by="System Super Admin",
                    )
                    db.add(fb)

                    att = SiteVisitAttendance(
                        site_visit_id=visit.id,
                        sales_executive_id=exec_rep.id,
                        marked_time=datetime.utcnow(),
                        attendance_status="present",
                        latitude=19.0760,
                        longitude=72.8777,
                        is_gps_verified=True,
                        created_by="System Super Admin",
                    )
                    db.add(att)

                # Route
                rt = SiteVisitRoute(
                    site_visit_id=visit.id,
                    route_name="Standard Site Tour Route",
                    start_latitude=19.0760,
                    start_longitude=72.8777,
                    end_latitude=19.0800,
                    end_longitude=72.8800,
                    distance_km=2.4,
                    estimated_duration_min=15,
                    created_by="System Super Admin",
                )
                db.add(rt)

        db.commit()
        print("\n[SUCCESS] Seed complete!")
        print(f"   Cities: {len(cities_data)}")
        print(f"   Builders: {len(builders_data)}")
        print(f"   Amenities: {len(amenities_data)}")
        print(f"   Projects: {len(projects_data)}")
        print(f"   Properties: {len(properties_data)}")
        print(f"   CRM Leads: {len(leads_sample)}")
        print(f"   Bookings: {len(b_sample_data) if props else 0}")

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
