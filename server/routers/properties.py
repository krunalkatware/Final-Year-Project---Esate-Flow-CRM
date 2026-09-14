from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from server.config.database import get_db
from server.repositories.property_repo import PropertyRepository
from server.schemas.property import PropertyFilter, PropertyListResponse, PropertyDetail, PropertyListItem
from server.core.dependencies import get_current_user_optional
from server.repositories.wishlist_repo import WishlistRepository
from server.models.user import User

router = APIRouter(prefix="/api/properties", tags=["Properties"])


def _serialize_property_list(prop, wishlisted_ids: list) -> dict:
    primary_image = next((img.url for img in prop.images if img.is_primary), None)
    if not primary_image and prop.images:
        primary_image = prop.images[0].url
    return {
        "id": prop.id,
        "name": prop.name,
        "slug": prop.slug,
        "property_type": prop.property_type,
        "status": prop.status,
        "locality": prop.locality,
        "city": prop.city_rel.name if prop.city_rel else None,
        "builder_name": prop.builder_rel.name if prop.builder_rel else None,
        "bedrooms": prop.bedrooms,
        "bathrooms": prop.bathrooms,
        "area_sqft": prop.area_sqft,
        "price": prop.price,
        "price_per_sqft": prop.price_per_sqft,
        "possession_date": prop.possession_date,
        "rating": prop.rating,
        "review_count": prop.review_count,
        "is_featured": prop.is_featured,
        "primary_image": primary_image,
        "expected_roi": prop.expected_roi,
        "is_wishlisted": prop.id in wishlisted_ids,
    }


def _serialize_property_detail(prop, is_wishlisted: bool) -> dict:
    primary_image = next((img.url for img in prop.images if img.is_primary), None)
    if not primary_image and prop.images:
        primary_image = prop.images[0].url

    carpet_area = round((prop.area_sqft or 0) * 0.82)
    builtup_area = int(prop.area_sqft or 0)

    # Dynamic luxury highlights
    highlights = [
        {"icon": "Compass", "title": "East Facing", "description": "Abundant morning sunlight & positive energy flow"},
        {"icon": "SquareCorner", "title": "Corner Plot", "description": "Dual road access with premium ventilation"},
        {"icon": "Cpu", "title": "Smart Home Ready", "description": "Automated lighting, climate & security locks"},
        {"icon": "Sparkles", "title": "Premium Flooring", "description": "Italian marble in living & wooden in bedrooms"},
        {"icon": "ChefHat", "title": "Modular Kitchen", "description": "Built-in German appliances & granite counter"},
        {"icon": "Sun", "title": "Vaastu Compliant", "description": "Architect-certified 100% Vaastu compliant layout"}
    ]

    # Dynamic nearby infrastructure
    nearby_locations = [
        {"category": "School", "name": "Delhi Public School / Ryan Intl", "distance": "1.2 km"},
        {"category": "Hospital", "name": "Apollo Super Speciality Hospital", "distance": "2.5 km"},
        {"category": "Metro", "name": "City Center Metro Station Line 1", "distance": "0.8 km"},
        {"category": "Airport", "name": "International Airport Term. 2", "distance": "14.5 km"},
        {"category": "Mall", "name": "Phoenix Marketcity Luxury Mall", "distance": "3.1 km"}
    ]

    # Sample downloadable documents
    documents = [
        {"title": "Property E-Brochure", "type": "PDF", "size": "4.2 MB", "category": "brochure", "download_url": "#"},
        {"title": "Detailed Floor Plan", "type": "PDF", "size": "2.8 MB", "category": "floorplan", "download_url": "#"},
        {"title": "Master Layout Plan", "type": "PDF", "size": "5.1 MB", "category": "masterplan", "download_url": "#"},
        {"title": "Official Price Breakdown", "type": "PDF", "size": "1.5 MB", "category": "pricesheet", "download_url": "#"}
    ]

    return {
        "id": prop.id,
        "name": prop.name,
        "slug": prop.slug,
        "description": prop.description,
        "property_type": prop.property_type,
        "status": prop.status,
        "locality": prop.locality,
        "full_address": prop.full_address or f"{prop.locality}, {prop.city_rel.name if prop.city_rel else 'City'}",
        "latitude": prop.latitude or 19.0760,
        "longitude": prop.longitude or 72.8777,
        "pincode": prop.pincode or "400001",
        "bedrooms": prop.bedrooms,
        "bathrooms": prop.bathrooms,
        "area_sqft": prop.area_sqft,
        "carpet_area": carpet_area,
        "builtup_area": builtup_area,
        "total_floors": prop.total_floors or 24,
        "floor_number": prop.floor_number or 12,
        "parking_spots": prop.parking_spots or 2,
        "facing": prop.facing or "East",
        "furnishing": prop.furnishing or "Semi-Furnished",
        "price": prop.price,
        "price_per_sqft": prop.price_per_sqft or (round(prop.price / prop.area_sqft) if prop.area_sqft else 0),
        "maintenance_monthly": prop.maintenance_monthly or 4500,
        "possession_date": prop.possession_date or "Ready To Move",
        "rating": prop.rating,
        "review_count": prop.review_count,
        "view_count": prop.view_count,
        "is_featured": prop.is_featured,
        "is_verified": prop.is_verified,
        "rera_number": prop.rera_number or "P51900028491",
        "expected_roi": prop.expected_roi or 8.5,
        "created_at": prop.created_at.isoformat() if prop.created_at else None,
        "images": [{"id": img.id, "url": img.url, "caption": img.caption, "is_primary": img.is_primary, "sort_order": img.sort_order} for img in sorted(prop.images, key=lambda x: x.sort_order)],
        "amenity_names": [pa.amenity.name for pa in prop.amenities if pa.amenity] if prop.amenities else ["Swimming Pool", "Club House", "Gym", "Garden", "Kids Play Area", "Parking", "Security", "Lift", "Power Backup", "WiFi"],
        "highlights": highlights,
        "nearby_locations": nearby_locations,
        "documents": documents,
        "project_name": prop.project_rel.name if prop.project_rel else f"{prop.name} Residency",
        "builder": {
            "id": prop.builder_rel.id,
            "name": prop.builder_rel.name,
            "logo_url": prop.builder_rel.logo_url or "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&q=80",
            "rating": prop.builder_rel.rating or 4.7,
            "total_projects": prop.builder_rel.total_projects or 45,
            "delivered_projects": prop.builder_rel.delivered_projects or 38,
            "headquarters": prop.builder_rel.headquarters or "Mumbai, India",
            "established_year": prop.builder_rel.established_year or 1995,
            "description": prop.builder_rel.description or f"{prop.builder_rel.name} is one of India's premier real estate developers known for structural perfection, modern architecture, and timely delivery.",
            "is_verified": prop.builder_rel.is_verified,
        } if prop.builder_rel else {
            "id": 1,
            "name": "EstateFlow Signature Developers",
            "logo_url": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&q=80",
            "rating": 4.8,
            "total_projects": 50,
            "delivered_projects": 42,
            "headquarters": "Mumbai, India",
            "established_year": 1998,
            "description": "Leading luxury property developer delivering sustainable, futuristic living spaces across India.",
            "is_verified": True,
        },
        "city": {
            "id": prop.city_rel.id,
            "name": prop.city_rel.name,
            "state": prop.city_rel.state,
        } if prop.city_rel else None,
        "is_wishlisted": is_wishlisted,
    }


@router.get("")
def list_properties(
    city: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    bedrooms: Optional[int] = None,
    bathrooms: Optional[int] = None,
    property_type: Optional[str] = None,
    builder_id: Optional[int] = None,
    status: Optional[str] = None,
    min_area: Optional[float] = None,
    max_area: Optional[float] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    filters = PropertyFilter(
        city=city, min_price=min_price, max_price=max_price, bedrooms=bedrooms,
        bathrooms=bathrooms, property_type=property_type, builder_id=builder_id,
        status=status, min_area=min_area, max_area=max_area, search=search,
        sort_by=sort_by, sort_order=sort_order, page=page, limit=limit,
    )
    repo = PropertyRepository(db)
    items, total = repo.list_with_filters(filters)

    wishlisted_ids = []
    if current_user:
        wishlist_repo = WishlistRepository(db)
        wishlisted_ids = wishlist_repo.get_wishlisted_ids(current_user.id)

    import math
    return {
        "items": [_serialize_property_list(p, wishlisted_ids) for p in items],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": math.ceil(total / limit),
    }


@router.get("/featured")
def get_featured(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    repo = PropertyRepository(db)
    items = repo.get_featured(limit=6)
    wishlisted_ids = []
    if current_user:
        wishlist_repo = WishlistRepository(db)
        wishlisted_ids = wishlist_repo.get_wishlisted_ids(current_user.id)
    return [_serialize_property_list(p, wishlisted_ids) for p in items]


@router.get("/{property_id}")
def get_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    from fastapi import HTTPException
    repo = PropertyRepository(db)
    prop = repo.get_by_id(property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    repo.increment_view_count(property_id)
    db.commit()
    is_wishlisted = False
    if current_user:
        wishlist_repo = WishlistRepository(db)
        is_wishlisted = wishlist_repo.is_wishlisted(current_user.id, property_id)
    return _serialize_property_detail(prop, is_wishlisted)


@router.get("/{property_id}/similar")
def get_similar_properties(
    property_id: int,
    limit: int = Query(6, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    repo = PropertyRepository(db)
    prop = repo.get_by_id(property_id)
    if not prop:
        return []

    from server.models.property import Property
    from sqlalchemy import or_, and_

    min_p = int(prop.price * 0.6)
    max_p = int(prop.price * 1.4)

    similar = (
        db.query(Property)
        .filter(
            Property.id != property_id,
            Property.is_active == True,
            or_(
                Property.city_id == prop.city_id,
                Property.builder_id == prop.builder_id,
                and_(Property.price >= min_p, Property.price <= max_p)
            )
        )
        .limit(limit)
        .all()
    )

    wishlisted_ids = []
    if current_user:
        wishlist_repo = WishlistRepository(db)
        wishlisted_ids = wishlist_repo.get_wishlisted_ids(current_user.id)

    return [_serialize_property_list(p, wishlisted_ids) for p in similar]


@router.get("/{property_id}/reviews")
def get_property_reviews(
    property_id: int,
    db: Session = Depends(get_db),
):
    from server.routers.reviews import get_reviews
    return get_reviews(property_id=property_id, db=db)


from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from server.models.lead import Lead, LeadActivity, LeadNote, LeadStage, LeadSource, LeadPriority, LeadStageHistory
from server.models.site_visit import SiteVisit, VisitStatus, VisitType, VisitPriority
from sqlalchemy import func

class PropertyInquirySchema(BaseModel):
    name: str = Field(..., min_length=1)
    phone: str = Field(..., min_length=5)
    email: Optional[str] = None
    preferred_bhk: Optional[str] = None
    message: Optional[str] = None
    schedule_site_visit: bool = False
    visit_date: Optional[str] = None
    visit_time: Optional[str] = "11:00 AM"
    visit_type: Optional[str] = "physical"


@router.post("/{property_id}/inquire")
def inquire_property(
    property_id: int,
    data: PropertyInquirySchema,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Submit buyer inquiry / schedule site visit directly into CRM Lead pipeline."""
    from fastapi import HTTPException
    repo = PropertyRepository(db)
    prop = repo.get_by_id(property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    name_parts = data.name.strip().split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else None

    count = db.query(func.count(Lead.id)).scalar() or 0
    lead_num = f"LD-2026-{(count + 1):04d}"

    init_stage = LeadStage.site_visit_scheduled if data.schedule_site_visit else LeadStage.new
    customer_id = current_user.id if current_user else None

    lead = Lead(
        lead_number=lead_num,
        customer_id=customer_id,
        first_name=first_name,
        last_name=last_name,
        email=data.email.strip() if data.email and data.email.strip() else None,
        phone=data.phone.strip(),
        city=prop.city_rel.name if prop.city_rel else None,
        locality=prop.locality,
        preferred_bhk=data.preferred_bhk or (f"{prop.bedrooms} BHK" if prop.bedrooms else None),
        preferred_property_type=prop.property_type,
        property_id=prop.id,
        builder_id=prop.builder_id,
        stage=init_stage,
        source=LeadSource.website,
        priority=LeadPriority.hot if data.schedule_site_visit else LeadPriority.medium,
        lead_score=75 if data.schedule_site_visit else 50,
        estimated_deal_value=float(prop.price or 0.0),
        notes_summary=data.message.strip() if data.message else None,
        created_by="Website Inbound Form",
    )
    db.add(lead)
    db.flush()

    # Initial history & activity
    stage_hist = LeadStageHistory(
        lead_id=lead.id,
        old_stage=None,
        new_stage=init_stage.value,
        changed_by="Buyer Inbound (Web)",
        notes=f"Inquired on {prop.name}" + (" with site visit request" if data.schedule_site_visit else ""),
    )
    db.add(stage_hist)

    act_desc = f"Inquired for {prop.name} (Price: ₹{prop.price:,})."
    if data.message:
        act_desc += f" Note: {data.message}"
    act = LeadActivity(
        lead_id=lead.id,
        activity_type="website_inquiry",
        title=f"Inquiry on {prop.name}",
        description=act_desc,
        performed_by=data.name.strip(),
    )
    db.add(act)

    if data.message:
        note = LeadNote(
            lead_id=lead.id,
            content=f"Buyer Note from Web Form: {data.message}",
            is_pinned=True,
            created_by="Website",
        )
        db.add(note)

    # Optional Site Visit Booking
    visit_id = None
    if data.schedule_site_visit:
        v_count = db.query(func.count(SiteVisit.id)).scalar() or 0
        v_num = f"SV-2026-{(v_count + 1):04d}"
        
        visit_dt = datetime.utcnow() + timedelta(days=1)
        if data.visit_date:
            try:
                visit_dt = datetime.strptime(data.visit_date, "%Y-%m-%d")
            except Exception:
                pass

        v_type = VisitType.virtual if data.visit_type == "virtual" else VisitType.physical

        visit = SiteVisit(
            visit_number=v_num,
            lead_id=lead.id,
            customer_id=customer_id,
            property_id=prop.id,
            builder_id=prop.builder_id,
            status=VisitStatus.scheduled,
            visit_type=v_type,
            purpose=f"Site Visit for {prop.name} requested by {data.name}",
            scheduled_date=visit_dt,
            scheduled_time=data.visit_time or "11:00 AM",
            priority=VisitPriority.high,
            confirmed_by_customer=True,
            customer_notes=data.message,
            created_by="Website Inbound Form",
        )
        db.add(visit)
        db.flush()
        visit_id = visit.id

    db.commit()
    db.refresh(lead)

    return {
        "success": True,
        "message": "Thank you! Your inquiry has been received and assigned to a property consultant.",
        "lead_id": lead.id,
        "lead_number": lead.lead_number,
        "site_visit_id": visit_id,
    }


