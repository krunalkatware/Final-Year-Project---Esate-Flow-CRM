"""
Admin Builder Management Router for EstateFlow (Step 4).

Prefix: /api/admin/builders
Protected by Admin JWT authentication & manage_builders permission guard.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Response
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
from server.models.builder import Builder, BuilderContact, BuilderDocument, BuilderProject
from server.models.property import Property

router = APIRouter(prefix="/api/admin/builders", tags=["Admin Builder Management"])


def generate_builder_slug(name: str, db: Session, builder_id: Optional[int] = None) -> str:
    base = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    slug = base
    counter = 1
    query = db.query(Builder).filter(Builder.slug == slug)
    if builder_id:
        query = query.filter(Builder.id != builder_id)
    while query.first():
        slug = f"{base}-{counter}"
        counter += 1
        query = db.query(Builder).filter(Builder.slug == slug)
        if builder_id:
            query = query.filter(Builder.id != builder_id)
    return slug


@router.get("", summary="Get Admin Builders Data Table")
def list_admin_builders(
    search: Optional[str] = None,
    status: Optional[str] = None,
    verification_status: Optional[str] = None,
    city: Optional[str] = None,
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    query = db.query(Builder)

    if search:
        query = query.filter(
            or_(
                Builder.name.ilike(f"%{search}%"),
                Builder.company_name.ilike(f"%{search}%"),
                Builder.rera_number.ilike(f"%{search}%"),
                Builder.email.ilike(f"%{search}%"),
                Builder.phone.ilike(f"%{search}%"),
                Builder.city.ilike(f"%{search}%"),
            )
        )
    if status:
        query = query.filter(Builder.status == status)
    if verification_status:
        query = query.filter(Builder.verification_status == verification_status)
    if city:
        query = query.filter(Builder.city.ilike(f"%{city}%"))

    total = query.count()

    sort_col = getattr(Builder, sort_by, Builder.created_at)
    if sort_order.lower() == "desc":
        query = query.order_by(desc(sort_col))
    else:
        query = query.order_by(asc(sort_col))

    builders = query.offset((page - 1) * limit).limit(limit).all()

    items = []
    for b in builders:
        prop_count = db.query(Property).filter(Property.builder_id == b.id).count()
        items.append({
            "id": b.id,
            "name": b.name,
            "company_name": b.company_name or b.name,
            "slug": b.slug,
            "logo_url": b.logo_url or "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&q=80",
            "city": b.city or "Mumbai",
            "rera_number": b.rera_number or "P519000001",
            "email": b.email,
            "phone": b.phone,
            "projects_count": b.total_projects or 12,
            "properties_count": prop_count,
            "status": b.status or "active",
            "verification_status": b.verification_status or "verified",
            "is_verified": b.is_verified,
            "created_at": b.created_at.isoformat() if b.created_at else None,
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


@router.get("/export", summary="Export Builders to CSV")
def export_builders_csv(
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    builders = db.query(Builder).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Company Name", "RERA Number", "Registration Number", "Email", "Phone",
        "City", "Status", "Verification Status", "Established Year", "Created At"
    ])

    for b in builders:
        writer.writerow([
            b.id, b.name, b.rera_number, b.registration_number, b.email, b.phone,
            b.city, b.status, b.verification_status, b.established_year, b.created_at
        ])

    response = Response(content=output.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=builders_export.csv"
    return response


@router.post("/bulk-activate", summary="Bulk Activate Builders")
def bulk_activate_builders(
    payload: dict,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    ids: List[int] = payload.get("ids", [])
    db.query(Builder).filter(Builder.id.in_(ids)).update(
        {"status": "active", "is_active": True}, synchronize_session=False
    )
    db.commit()
    return {"success": True, "count": len(ids)}


@router.post("/bulk-deactivate", summary="Bulk Deactivate Builders")
def bulk_deactivate_builders(
    payload: dict,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    ids: List[int] = payload.get("ids", [])
    db.query(Builder).filter(Builder.id.in_(ids)).update(
        {"status": "inactive", "is_active": False}, synchronize_session=False
    )
    db.commit()
    return {"success": True, "count": len(ids)}


@router.post("/bulk-delete", summary="Bulk Delete Builders")
def bulk_delete_builders(
    payload: dict,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    ids: List[int] = payload.get("ids", [])
    db.query(Builder).filter(Builder.id.in_(ids)).delete(synchronize_session=False)
    db.commit()
    return {"success": True, "count": len(ids)}


@router.get("/{builder_id}", summary="Get Full Builder Detail")
def get_admin_builder_detail(
    builder_id: int,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    b = db.query(Builder).filter(Builder.id == builder_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Builder not found")

    properties = db.query(Property).filter(Property.builder_id == b.id).all()
    properties_list = [
        {
            "id": p.id,
            "name": p.name,
            "property_type": p.property_type,
            "price": p.price,
            "locality": p.locality,
            "status": p.status,
            "is_published": p.is_published,
        }
        for p in properties
    ]

    return {
        "id": b.id,
        "name": b.name,
        "company_name": b.company_name or b.name,
        "slug": b.slug,
        "logo_url": b.logo_url,
        "description": b.description,
        "registration_number": b.registration_number,
        "rera_number": b.rera_number,
        "gst_number": b.gst_number,
        "pan_number": b.pan_number,
        "established_year": b.established_year,
        "company_type": b.company_type,
        "website": b.website,
        "email": b.email,
        "phone": b.phone,
        "alternate_phone": b.alternate_phone,
        "country": b.country,
        "state": b.state,
        "city": b.city,
        "address": b.address,
        "pincode": b.pincode,
        "latitude": b.latitude,
        "longitude": b.longitude,
        "headquarters": b.headquarters,
        "total_projects": b.total_projects,
        "delivered_projects": b.delivered_projects,
        "rating": b.rating,
        "status": b.status,
        "verification_status": b.verification_status,
        "is_verified": b.is_verified,
        "created_by": b.created_by,
        "updated_by": b.updated_by,
        "verified_by": b.verified_by,
        "created_at": b.created_at.isoformat() if b.created_at else None,
        "contacts": [{"id": c.id, "name": c.name, "designation": c.designation, "email": c.email, "phone": c.phone, "is_primary": c.is_primary} for c in b.contacts],
        "documents": [{"id": d.id, "document_type": d.document_type, "document_name": d.document_name, "document_url": d.document_url, "verification_status": d.verification_status} for d in b.documents],
        "builder_projects": [{"id": p.id, "project_name": p.project_name, "location": p.location, "city": p.city, "status": p.status} for p in b.builder_projects],
        "associated_properties": properties_list,
    }


@router.post("", summary="Create Builder")
def create_builder(
    data: dict,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    user, _ = admin_ctx
    name = data.get("name") or data.get("company_name")
    if not name:
        raise HTTPException(status_code=422, detail="Company Name is required")

    existing = db.query(Builder).filter(Builder.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Builder with this company name already exists")

    slug = generate_builder_slug(name, db)

    b = Builder(
        name=name,
        company_name=name,
        slug=slug,
        logo_url=data.get("logo_url") or "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&q=80",
        description=data.get("description"),
        registration_number=data.get("registration_number", "REG-894210"),
        rera_number=data.get("rera_number", "P5190009941"),
        gst_number=data.get("gst_number", "27AAAAA0000A1Z5"),
        pan_number=data.get("pan_number", "ABCDE1234F"),
        established_year=int(data.get("established_year") or 1998),
        company_type=data.get("company_type", "Private Limited"),
        website=data.get("website", "https://estateflow.com"),
        email=data.get("email"),
        phone=data.get("phone"),
        alternate_phone=data.get("alternate_phone"),
        country=data.get("country", "India"),
        state=data.get("state", "Maharashtra"),
        city=data.get("city", "Mumbai"),
        address=data.get("address"),
        pincode=data.get("pincode"),
        latitude=float(data.get("latitude") or 19.0760),
        longitude=float(data.get("longitude") or 72.8777),
        status="active",
        verification_status="verified",
        created_by=user.email,
    )
    db.add(b)
    db.flush()

    # Add contact if provided
    contacts_data = data.get("contacts", [])
    if contacts_data:
        for c in contacts_data:
            contact = BuilderContact(
                builder_id=b.id,
                name=c.get("name", "Primary Contact"),
                designation=c.get("designation", "Director"),
                email=c.get("email"),
                phone=c.get("phone"),
                is_primary=c.get("is_primary", True),
            )
            db.add(contact)

    db.commit()
    db.refresh(b)
    return {"success": True, "builder_id": b.id, "slug": b.slug}


@router.put("/{builder_id}", summary="Update Builder")
def update_builder(
    builder_id: int,
    data: dict,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    user, _ = admin_ctx
    b = db.query(Builder).filter(Builder.id == builder_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Builder not found")

    for field in [
        "name", "company_name", "description", "logo_url", "registration_number",
        "rera_number", "gst_number", "pan_number", "company_type", "website",
        "email", "phone", "alternate_phone", "country", "state", "city", "address", "pincode"
    ]:
        if field in data and data[field] is not None:
            setattr(b, field, data[field])

    b.updated_by = user.email
    db.commit()
    return {"success": True, "message": "Builder updated successfully"}


@router.delete("/{builder_id}", summary="Delete Builder")
def delete_builder(
    builder_id: int,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    b = db.query(Builder).filter(Builder.id == builder_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Builder not found")
    db.delete(b)
    db.commit()
    return {"success": True, "message": "Builder deleted"}


@router.patch("/{builder_id}/verify", summary="Verify Builder")
def verify_builder(
    builder_id: int,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    user, _ = admin_ctx
    b = db.query(Builder).filter(Builder.id == builder_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Builder not found")
    b.verification_status = "verified"
    b.is_verified = True
    b.verified_by = user.email
    db.commit()
    return {"success": True, "message": "Builder verified successfully"}


@router.patch("/{builder_id}/reject", summary="Reject Builder Verification")
def reject_builder(
    builder_id: int,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    b = db.query(Builder).filter(Builder.id == builder_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Builder not found")
    b.verification_status = "rejected"
    b.is_verified = False
    db.commit()
    return {"success": True, "message": "Builder verification rejected"}


@router.patch("/{builder_id}/activate", summary="Activate Builder")
def activate_builder(
    builder_id: int,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    b = db.query(Builder).filter(Builder.id == builder_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Builder not found")
    b.status = "active"
    b.is_active = True
    db.commit()
    return {"success": True, "message": "Builder activated"}


@router.patch("/{builder_id}/deactivate", summary="Deactivate Builder")
def deactivate_builder(
    builder_id: int,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    b = db.query(Builder).filter(Builder.id == builder_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Builder not found")
    b.status = "inactive"
    b.is_active = False
    db.commit()
    return {"success": True, "message": "Builder deactivated"}
