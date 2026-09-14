"""
Admin Property Management Router for EstateFlow (Step 3).

Prefix: /api/admin/properties
Protected by Admin JWT authentication & permission guards.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from typing import Optional, List
import csv
import io
import re

from server.config.database import get_db
from server.core.dependencies import get_current_admin_user
from server.models.user import User
from server.models.admin import AdminUser
from server.models.property import (
    Property, PropertyImage, PropertyDocument, PropertyHighlight,
    NearbyLocation, PropertyStatusHistory, PropertyStatus, PropertyType
)
from server.models.builder import Builder
from server.models.city import City

router = APIRouter(prefix="/api/admin/properties", tags=["Admin Property Management"])


def generate_slug(title: str, db: Session, prop_id: Optional[int] = None) -> str:
    base = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
    slug = base
    counter = 1
    query = db.query(Property).filter(Property.slug == slug)
    if prop_id:
        query = query.filter(Property.id != prop_id)
    while query.first():
        slug = f"{base}-{counter}"
        counter += 1
        query = db.query(Property).filter(Property.slug == slug)
        if prop_id:
            query = query.filter(Property.id != prop_id)
    return slug


@router.get("", summary="Get Admin Properties Data Table")
def list_admin_properties(
    search: Optional[str] = None,
    city_id: Optional[int] = None,
    builder_id: Optional[int] = None,
    status: Optional[str] = None,
    property_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    is_published: Optional[bool] = None,
    is_archived: Optional[bool] = False,
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    query = db.query(Property)

    if is_archived is not None:
        query = query.filter(Property.is_archived == is_archived)

    if search:
        query = query.filter(
            or_(
                Property.name.ilike(f"%{search}%"),
                Property.locality.ilike(f"%{search}%"),
                Property.rera_number.ilike(f"%{search}%"),
            )
        )
    if city_id:
        query = query.filter(Property.city_id == city_id)
    if builder_id:
        query = query.filter(Property.builder_id == builder_id)
    if status:
        query = query.filter(Property.status == status)
    if property_type:
        query = query.filter(Property.property_type == property_type)
    if min_price:
        query = query.filter(Property.price >= min_price)
    if max_price:
        query = query.filter(Property.price <= max_price)
    if is_published is not None:
        query = query.filter(Property.is_published == is_published)

    total = query.count()

    sort_col = getattr(Property, sort_by, Property.created_at)
    if sort_order.lower() == "desc":
        query = query.order_by(desc(sort_col))
    else:
        query = query.order_by(asc(sort_col))

    properties = query.offset((page - 1) * limit).limit(limit).all()

    items = []
    for p in properties:
        primary_img = next((img.url for img in p.images if img.is_primary), None)
        if not primary_img and p.images:
            primary_img = p.images[0].url

        items.append({
            "id": p.id,
            "name": p.name,
            "slug": p.slug,
            "property_type": p.property_type,
            "status": p.status,
            "price": p.price,
            "offer_price": p.offer_price,
            "bhk": p.bhk or p.bedrooms,
            "area_sqft": p.area_sqft,
            "city": p.city_rel.name if p.city_rel else "N/A",
            "locality": p.locality,
            "builder_name": p.builder_rel.name if p.builder_rel else "N/A",
            "primary_image": primary_img,
            "is_published": p.is_published,
            "is_featured": p.is_featured,
            "is_archived": p.is_archived,
            "view_count": p.view_count,
            "created_by": p.created_by or "Super Admin",
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })

    import math
    return {
        "success": True,
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": math.ceil(total / limit) if total > 0 else 1,
    }


@router.get("/export", summary="Export Properties to CSV")
def export_properties_csv(
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    properties = db.query(Property).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Title", "Slug", "Type", "Status", "Price", "Bedrooms", "Bathrooms",
        "Area SqFt", "Locality", "RERA Number", "Published", "Created At"
    ])

    for p in properties:
        writer.writerow([
            p.id, p.name, p.slug, p.property_type, p.status, p.price,
            p.bedrooms, p.bathrooms, p.area_sqft, p.locality, p.rera_number,
            p.is_published, p.created_at
        ])

    response = Response(content=output.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=properties_export.csv"
    return response


@router.post("/bulk-import", summary="Bulk Import Properties from CSV")
async def bulk_import_properties(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    contents = await file.read()
    decoded = contents.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))
    imported_count = 0

    user, _ = admin_ctx
    for row in reader:
        title = row.get("Title") or row.get("name")
        if not title:
            continue
        price = int(row.get("Price") or 10000000)
        slug = generate_slug(title, db)

        p = Property(
            name=title,
            slug=slug,
            property_type=row.get("Type", "apartment"),
            status="available",
            price=price,
            city_id=1,
            builder_id=1,
            locality=row.get("Locality", "Prime City Center"),
            bedrooms=int(row.get("Bedrooms") or 3),
            bathrooms=int(row.get("Bathrooms") or 2),
            area_sqft=float(row.get("Area SqFt") or 1450),
            created_by=user.email,
            is_published=True,
        )
        db.add(p)
        imported_count += 1

    db.commit()
    return {"success": True, "imported": imported_count}


@router.post("/bulk-delete", summary="Bulk Delete Properties")
def bulk_delete_properties(
    payload: dict,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    ids: List[int] = payload.get("ids", [])
    if not ids:
        raise HTTPException(status_code=400, detail="No property IDs provided")
    db.query(Property).filter(Property.id.in_(ids)).delete(synchronize_session=False)
    db.commit()
    return {"success": True, "count": len(ids)}


@router.post("/bulk-publish", summary="Bulk Publish Properties")
def bulk_publish_properties(
    payload: dict,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    ids: List[int] = payload.get("ids", [])
    user, _ = admin_ctx
    db.query(Property).filter(Property.id.in_(ids)).update(
        {"is_published": True, "published_by": user.email}, synchronize_session=False
    )
    db.commit()
    return {"success": True, "count": len(ids)}


@router.post("/bulk-unpublish", summary="Bulk Unpublish Properties")
def bulk_unpublish_properties(
    payload: dict,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    ids: List[int] = payload.get("ids", [])
    db.query(Property).filter(Property.id.in_(ids)).update(
        {"is_published": False}, synchronize_session=False
    )
    db.commit()
    return {"success": True, "count": len(ids)}


@router.post("/bulk-archive", summary="Bulk Archive Properties")
def bulk_archive_properties(
    payload: dict,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    ids: List[int] = payload.get("ids", [])
    db.query(Property).filter(Property.id.in_(ids)).update(
        {"is_archived": True, "status": PropertyStatus.archived}, synchronize_session=False
    )
    db.commit()
    return {"success": True, "count": len(ids)}


@router.get("/{property_id}", summary="Get Full Property Detail for Admin Edit")
def get_admin_property_detail(
    property_id: int,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    p = db.query(Property).filter(Property.id == property_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Property not found")

    return {
        "id": p.id,
        "name": p.name,
        "slug": p.slug,
        "description": p.description,
        "purpose": p.purpose,
        "property_type": p.property_type,
        "status": p.status,
        "country": p.country,
        "state": p.state,
        "city_id": p.city_id,
        "locality": p.locality,
        "full_address": p.full_address,
        "latitude": p.latitude,
        "longitude": p.longitude,
        "pincode": p.pincode,
        "builder_id": p.builder_id,
        "project_id": p.project_id,
        "bhk": p.bhk or p.bedrooms,
        "bedrooms": p.bedrooms,
        "bathrooms": p.bathrooms,
        "balconies": p.balconies,
        "floor_number": p.floor_number,
        "total_floors": p.total_floors,
        "carpet_area": p.carpet_area,
        "builtup_area": p.builtup_area,
        "super_builtup_area": p.super_builtup_area,
        "plot_area": p.plot_area,
        "area_sqft": p.area_sqft,
        "parking_spots": p.parking_spots,
        "facing": p.facing,
        "furnishing": p.furnishing,
        "ownership": p.ownership,
        "property_age": p.property_age,
        "price": p.price,
        "offer_price": p.offer_price,
        "price_per_sqft": p.price_per_sqft,
        "maintenance_monthly": p.maintenance_monthly,
        "booking_amount": p.booking_amount,
        "estimated_emi": p.estimated_emi,
        "possession_date": p.possession_date,
        "virtual_tour_url": p.virtual_tour_url,
        "video_url": p.video_url,
        "floor_plan_url": p.floor_plan_url,
        "rera_number": p.rera_number,
        "expected_roi": p.expected_roi,
        "is_published": p.is_published,
        "is_featured": p.is_featured,
        "is_archived": p.is_archived,
        "created_by": p.created_by,
        "updated_by": p.updated_by,
        "published_by": p.published_by,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "images": [{"id": img.id, "url": img.url, "caption": img.caption, "is_primary": img.is_primary, "sort_order": img.sort_order} for img in sorted(p.images, key=lambda x: x.sort_order)],
        "documents": [{"id": doc.id, "title": doc.title, "file_url": doc.file_url, "file_type": doc.file_type, "category": doc.category} for doc in p.documents],
        "highlights": [{"id": h.id, "title": h.title, "description": h.description, "icon_name": h.icon_name} for h in p.highlights_rel],
        "nearby_locations": [{"id": n.id, "category": n.category, "name": n.name, "distance": n.distance} for n in p.nearby_locations_rel],
        "status_history": [{"id": h.id, "old_status": h.old_status, "new_status": h.new_status, "changed_by": h.changed_by, "notes": h.notes, "created_at": h.created_at.isoformat() if h.created_at else None} for h in p.status_history],
    }


@router.post("", summary="Create New Property")
def create_property(
    data: dict,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    user, _ = admin_ctx
    name = data.get("name")
    if not name:
        raise HTTPException(status_code=422, detail="Property name is required")

    slug = generate_slug(name, db)
    price = int(data.get("price") or 10000000)
    area = float(data.get("area_sqft") or 1200)

    resolved_city_id = int(data["city_id"]) if data.get("city_id") else None
    if not resolved_city_id:
        first_city = db.query(City.id).first()
        resolved_city_id = first_city[0] if first_city else 1

    resolved_builder_id = int(data["builder_id"]) if data.get("builder_id") else None
    if not resolved_builder_id:
        first_builder = db.query(Builder.id).first()
        resolved_builder_id = first_builder[0] if first_builder else 1

    p = Property(
        name=name,
        slug=slug,
        description=data.get("description"),
        purpose=data.get("purpose", "Sale"),
        property_type=data.get("property_type", "apartment"),
        status=data.get("status", "available"),
        country=data.get("country", "India"),
        state=data.get("state", "Maharashtra"),
        city_id=resolved_city_id,
        locality=data.get("locality"),
        full_address=data.get("full_address"),
        latitude=float(data.get("latitude") or 19.0760),
        longitude=float(data.get("longitude") or 72.8777),
        pincode=data.get("pincode"),
        builder_id=resolved_builder_id,
        project_id=int(data.get("project_id")) if data.get("project_id") else None,
        bhk=int(data.get("bhk") or 3),
        bedrooms=int(data.get("bedrooms") or 3),
        bathrooms=int(data.get("bathrooms") or 2),
        balconies=int(data.get("balconies") or 1),
        floor_number=int(data.get("floor_number") or 5),
        total_floors=int(data.get("total_floors") or 20),
        carpet_area=float(data.get("carpet_area") or area * 0.8),
        builtup_area=area,
        super_builtup_area=area * 1.25,
        area_sqft=area,
        price=price,
        offer_price=int(data.get("offer_price")) if data.get("offer_price") else None,
        price_per_sqft=round(price / area, 2) if area > 0 else 0,
        maintenance_monthly=int(data.get("maintenance_monthly") or 4500),
        booking_amount=int(data.get("booking_amount") or price * 0.1),
        possession_date=data.get("possession_date", "Ready to Move"),
        virtual_tour_url=data.get("virtual_tour_url"),
        video_url=data.get("video_url"),
        rera_number=data.get("rera_number"),
        created_by=user.email,
        is_published=data.get("is_published", True),
    )

    db.add(p)
    db.flush()

    # Add default image if none provided
    images_data = data.get("images", [])
    if images_data:
        for idx, img in enumerate(images_data):
            p_img = PropertyImage(
                property_id=p.id,
                url=img.get("url"),
                caption=img.get("caption"),
                is_primary=(idx == 0),
                sort_order=idx,
            )
            db.add(p_img)
    else:
        p_img = PropertyImage(
            property_id=p.id,
            url="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1000&q=80",
            caption="Exterior View",
            is_primary=True,
            sort_order=0,
        )
        db.add(p_img)

    # Initial audit status history
    history = PropertyStatusHistory(
        property_id=p.id,
        old_status=None,
        new_status=p.status,
        changed_by=user.email,
        notes="Initial property creation",
    )
    db.add(history)

    db.commit()
    db.refresh(p)
    return {"success": True, "property_id": p.id, "slug": p.slug}


@router.put("/{property_id}", summary="Update Property")
def update_property(
    property_id: int,
    data: dict,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    user, _ = admin_ctx
    p = db.query(Property).filter(Property.id == property_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Property not found")

    old_status = p.status
    if data.get("name") and data.get("name") != p.name:
        p.name = data["name"]
        p.slug = generate_slug(p.name, db, prop_id=p.id)

    for field in [
        "description", "purpose", "property_type", "status", "country", "state",
        "locality", "full_address", "pincode", "facing", "furnishing", "ownership",
        "property_age", "possession_date", "virtual_tour_url", "video_url", "rera_number"
    ]:
        if field in data and data[field] is not None:
            setattr(p, field, data[field])

    if "price" in data and data["price"] is not None:
        p.price = int(data["price"])
    if "area_sqft" in data and data["area_sqft"] is not None:
        p.area_sqft = float(data["area_sqft"])
        if p.price:
            p.price_per_sqft = round(p.price / p.area_sqft, 2)

    p.updated_by = user.email

    if "status" in data and data["status"] != old_status:
        history = PropertyStatusHistory(
            property_id=p.id,
            old_status=old_status,
            new_status=data["status"],
            changed_by=user.email,
            notes="Status updated via admin panel",
        )
        db.add(history)

    db.commit()
    return {"success": True, "message": "Property updated successfully"}


@router.delete("/{property_id}", summary="Delete Property")
def delete_property(
    property_id: int,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    p = db.query(Property).filter(Property.id == property_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Property not found")
    db.delete(p)
    db.commit()
    return {"success": True, "message": "Property deleted"}


@router.patch("/{property_id}/archive", summary="Archive Property")
def archive_property(
    property_id: int,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    p = db.query(Property).filter(Property.id == property_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Property not found")
    p.is_archived = True
    p.status = PropertyStatus.archived
    db.commit()
    return {"success": True, "message": "Property archived"}


@router.patch("/{property_id}/restore", summary="Restore Property")
def restore_property(
    property_id: int,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    p = db.query(Property).filter(Property.id == property_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Property not found")
    p.is_archived = False
    p.status = PropertyStatus.available
    db.commit()
    return {"success": True, "message": "Property restored"}


@router.post("/{property_id}/duplicate", summary="Duplicate Property")
def duplicate_property(
    property_id: int,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    user, _ = admin_ctx
    p = db.query(Property).filter(Property.id == property_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Property not found")

    new_name = f"{p.name} (Copy)"
    new_slug = generate_slug(new_name, db)

    new_p = Property(
        name=new_name,
        slug=new_slug,
        description=p.description,
        purpose=p.purpose,
        property_type=p.property_type,
        status=PropertyStatus.available,
        city_id=p.city_id,
        locality=p.locality,
        builder_id=p.builder_id,
        bhk=p.bhk,
        bedrooms=p.bedrooms,
        bathrooms=p.bathrooms,
        area_sqft=p.area_sqft,
        price=p.price,
        price_per_sqft=p.price_per_sqft,
        created_by=user.email,
        is_published=False,
    )
    db.add(new_p)
    db.commit()
    db.refresh(new_p)
    return {"success": True, "new_property_id": new_p.id, "slug": new_p.slug}


@router.patch("/{property_id}/publish", summary="Publish Property")
def publish_property(
    property_id: int,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    user, _ = admin_ctx
    p = db.query(Property).filter(Property.id == property_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Property not found")
    p.is_published = True
    p.published_by = user.email
    db.commit()
    return {"success": True, "message": "Property published"}


@router.patch("/{property_id}/unpublish", summary="Unpublish Property")
def unpublish_property(
    property_id: int,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    p = db.query(Property).filter(Property.id == property_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Property not found")
    p.is_published = False
    db.commit()
    return {"success": True, "message": "Property unpublished"}
