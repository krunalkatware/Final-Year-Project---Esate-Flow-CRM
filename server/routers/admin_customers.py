from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func, or_
from datetime import datetime
import uuid

from server.config.database import get_db
from server.core.dependencies import get_current_admin
from server.models.admin import AdminUser
from server.models.user import User, UserRole
from server.models.customer import Customer
from server.models.booking import (
    Booking, BookingStatus, BookingDocument, BookingPayment,
    BookingPaymentStatus, BookingTimeline
)
from server.models.site_visit import SiteVisit, VisitStatus, VisitType
from server.models.wishlist import Wishlist
from server.models.review import Review
from server.models.lead import Lead, LeadStage, LeadSource, LeadPriority
from server.models.property import Property
from server.models.city import City
from server.models.notification import Notification, NotificationType

router = APIRouter(prefix="/api/admin/customers", tags=["Admin Customer CRM"])


@router.get("")
def list_customers(
    search: Optional[str] = None,
    city: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=500),
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """List customers with aggregated CRM metrics."""
    query = db.query(User).options(joinedload(User.customer)).filter(
        or_(User.role == "customer", User.role == UserRole.customer),
        User.is_active == True
    )

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                User.full_name.ilike(pattern),
                User.email.ilike(pattern),
                User.phone.ilike(pattern),
            )
        )

    sort_col = getattr(User, sort_by, User.created_at)
    if sort_order.lower() == "desc":
        query = query.order_by(desc(sort_col))
    else:
        query = query.order_by(sort_col)

    total = query.count()
    users = query.offset((page - 1) * limit).limit(limit).all()

    items = []
    for u in users:
        cust = u.customer
        booking_count = db.query(func.count(Booking.id)).filter(Booking.customer_id == u.id).scalar() or 0
        total_spent = db.query(func.coalesce(func.sum(Booking.net_total), 0.0)).filter(
            Booking.customer_id == u.id,
            Booking.status.in_(["confirmed", "completed", "token_paid", "installment_running", BookingStatus.CONFIRMED, BookingStatus.COMPLETED])
        ).scalar() or 0.0
        visit_count = db.query(func.count(SiteVisit.id)).filter(SiteVisit.customer_id == u.id).scalar() or 0
        lead_count = db.query(func.count(Lead.id)).filter(Lead.customer_id == u.id).scalar() or 0

        # Real KYC document count
        doc_count = db.query(func.count(BookingDocument.id)).filter(
            or_(
                BookingDocument.customer_id == u.id,
                BookingDocument.booking_id.in_(
                    db.query(Booking.id).filter(Booking.customer_id == u.id)
                )
            )
        ).scalar() or 0

        resolved_name = (
            u.full_name or
            (f"{cust.first_name} {cust.last_name or ''}".strip() if cust and (cust.first_name or cust.last_name) else None) or
            u.email.split('@')[0]
        )

        items.append({
            "id": u.id,
            "full_name": resolved_name,
            "email": u.email,
            "phone": u.phone or (cust.phone if cust else None),
            "avatar_url": u.avatar_url or (cust.avatar_url if cust else None),
            "is_verified": u.is_verified,
            "city": cust.city if cust else None,
            "occupation": getattr(cust, 'occupation', None) if cust else None,
            "budget_max": cust.preferred_budget_max if cust and hasattr(cust, 'preferred_budget_max') else (cust.budget_max if cust and hasattr(cust, 'budget_max') else 0.0),
            "preferred_property_type": cust.preferred_property_type if cust else None,
            "booking_count": booking_count,
            "total_spent": float(total_spent),
            "visit_count": visit_count,
            "lead_count": lead_count,
            "doc_count": doc_count,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
    }


@router.get("/{user_id}")
def get_customer_360_detail(
    user_id: str,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Complete 360-degree Customer Profile detail endpoint with Bookings, Visits, KYC Docs, Payments & Timeline."""
    user = db.query(User).options(joinedload(User.customer)).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")

    cust = user.customer
    bookings = (
        db.query(Booking)
        .options(joinedload(Booking.property).joinedload(Property.city_rel))
        .filter(Booking.customer_id == user_id)
        .order_by(desc(Booking.created_at))
        .all()
    )
    booking_ids = [b.id for b in bookings]

    visits = (
        db.query(SiteVisit)
        .options(joinedload(SiteVisit.property).joinedload(Property.city_rel))
        .filter(SiteVisit.customer_id == user_id)
        .order_by(desc(SiteVisit.scheduled_date))
        .all()
    )
    wishlists = (
        db.query(Wishlist)
        .options(joinedload(Wishlist.property))
        .filter(Wishlist.user_id == user_id)
        .all()
    )
    reviews = db.query(Review).filter(Review.user_id == user_id).all()
    leads = (
        db.query(Lead)
        .options(joinedload(Lead.property_rel))
        .filter(Lead.customer_id == user_id)
        .order_by(desc(Lead.created_at))
        .all()
    )

    # Fetch all KYC Documents belonging to customer
    docs_query = db.query(BookingDocument).options(joinedload(BookingDocument.booking)).filter(
        or_(
            BookingDocument.customer_id == user_id,
            BookingDocument.booking_id.in_(booking_ids) if booking_ids else False
        )
    ).order_by(desc(BookingDocument.created_at))
    documents = docs_query.all()

    # Fetch all Payments for customer bookings
    payments_query = db.query(BookingPayment).options(
        joinedload(BookingPayment.booking).joinedload(Booking.property)
    ).filter(
        BookingPayment.booking_id.in_(booking_ids) if booking_ids else False
    ).order_by(desc(BookingPayment.created_at))
    payments = payments_query.all()

    total_spent = sum(
        (b.net_total or b.base_price or 0.0)
        for b in bookings
        if str(b.status).lower() in ("confirmed", "completed", "token_paid", "installment_running")
    )
    total_token_paid = sum(
        (p.amount or 0.0)
        for p in payments
        if str(p.status).lower() in ("completed", "captured", "success")
    )
    outstanding_amount = max(0.0, total_spent - total_token_paid)

    # Build Unified Activity Timeline
    timeline_events = []

    # 1. Registration
    if user.created_at:
        timeline_events.append({
            "id": f"reg_{user.id}",
            "type": "registration",
            "title": "Customer Account Created",
            "description": f"{user.full_name or user.email} registered on EstateFlow platform.",
            "timestamp": user.created_at.isoformat(),
            "badge_color": "emerald",
        })

    # 2. Inquiries / Leads
    for l in leads:
        timeline_events.append({
            "id": f"lead_{l.id}",
            "type": "lead_inquiry",
            "title": f"Inquired about {l.property_rel.name if l.property_rel else 'Property'}",
            "description": f"CRM Lead #{l.lead_number} created with {l.priority.value if hasattr(l.priority, 'value') else l.priority} priority.",
            "timestamp": l.created_at.isoformat() if l.created_at else datetime.utcnow().isoformat(),
            "badge_color": "blue",
        })

    # 3. Site Visits
    for v in visits:
        v_date = v.scheduled_date.isoformat() if v.scheduled_date else (v.created_at.isoformat() if v.created_at else None)
        timeline_events.append({
            "id": f"visit_{v.id}",
            "type": "site_visit",
            "title": f"Site Visit {str(v.status).upper()}: {v.property.name if v.property else 'Property'}",
            "description": f"Scheduled for {v.scheduled_date.strftime('%d %b %Y') if v.scheduled_date else 'Date TBD'} ({v.scheduled_time or 'Regular Slot'}).",
            "timestamp": v_date or datetime.utcnow().isoformat(),
            "badge_color": "amber",
        })

    # 4. KYC Documents
    for d in documents:
        status_label = d.status.upper() if d.status else ("VERIFIED" if d.is_verified else "PENDING")
        timeline_events.append({
            "id": f"doc_{d.id}",
            "type": "document",
            "title": f"KYC Document {status_label}: {d.title}",
            "description": f"Uploaded '{d.file_name}' for Booking #{d.booking.booking_number if d.booking else 'General'}. {f'Reason: {d.rejection_reason}' if d.rejection_reason else ''}",
            "timestamp": d.created_at.isoformat() if d.created_at else datetime.utcnow().isoformat(),
            "badge_color": "purple" if d.status == "verified" or d.is_verified else "indigo",
        })

    # 5. Bookings
    for b in bookings:
        timeline_events.append({
            "id": f"bkg_{b.id}",
            "type": "booking",
            "title": f"Booking Confirmed: {b.property.name if b.property else 'Property'}",
            "description": f"Official Allotment #{b.booking_number} locked with Token Deposit ₹{int(b.token_amount or 25000):,}.",
            "timestamp": b.created_at.isoformat() if b.created_at else datetime.utcnow().isoformat(),
            "badge_color": "emerald",
        })

    # 6. Payments
    for p in payments:
        timeline_events.append({
            "id": f"pay_{p.id}",
            "type": "payment",
            "title": f"Payment Received: ₹{int(p.amount):,}",
            "description": f"Payment #{p.payment_number} captured via {p.payment_mode.value if hasattr(p.payment_mode, 'value') else p.payment_mode} (Ref: {p.transaction_reference or 'N/A'}).",
            "timestamp": p.created_at.isoformat() if p.created_at else datetime.utcnow().isoformat(),
            "badge_color": "emerald",
        })

    # Sort timeline newest first
    timeline_events.sort(key=lambda x: x["timestamp"], reverse=True)

    verified_docs = sum(1 for d in documents if d.status == "verified" or d.is_verified)
    kyc_completion_pct = int((verified_docs / len(documents)) * 100) if documents else 0

    return {
        "profile": {
            "id": user.id,
            "full_name": user.full_name or (f"{cust.first_name} {cust.last_name or ''}".strip() if cust else user.email.split('@')[0]),
            "email": user.email,
            "phone": user.phone or (cust.phone if cust else None),
            "avatar_url": user.avatar_url or (cust.avatar_url if cust else None),
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "city": cust.city if cust else None,
            "state": cust.state if cust else None,
            "address": cust.address if cust else None,
            "occupation": getattr(cust, 'occupation', None) if cust else None,
            "company_name": getattr(cust, 'company_name', None) if cust else None,
            "budget_min": getattr(cust, 'preferred_budget_min', 0.0) if cust else 0.0,
            "budget_max": getattr(cust, 'preferred_budget_max', 0.0) if cust else 0.0,
            "preferred_property_type": getattr(cust, 'preferred_property_type', None) if cust else None,
            "preferred_city": getattr(cust, 'preferred_cities', None) if cust else None,
            "investment_purpose": getattr(cust, 'investment_purpose', None) if cust else None,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        },
        "stats": {
            "total_spent": float(total_spent),
            "total_token_paid": float(total_token_paid),
            "outstanding_amount": float(outstanding_amount),
            "booking_count": len(bookings),
            "site_visit_count": len(visits),
            "document_count": len(documents),
            "verified_document_count": verified_docs,
            "kyc_completion_pct": kyc_completion_pct,
            "payment_count": len(payments),
            "wishlist_count": len(wishlists),
            "review_count": len(reviews),
            "lead_count": len(leads),
        },
        "bookings": [
            {
                "id": b.id,
                "booking_number": b.booking_number,
                "property_id": b.property_id,
                "property_name": b.property.name if b.property else None,
                "property_locality": b.property.locality if b.property else None,
                "property_city": b.property.city_rel.name if b.property and b.property.city_rel else None,
                "status": b.status.value if hasattr(b.status, 'value') else str(b.status),
                "agreed_price": b.net_total or b.base_price or 0.0,
                "booking_amount": b.token_amount or b.booking_amount or 0.0,
                "paid_amount": b.paid_amount or 0.0,
                "booking_date": b.created_at.isoformat() if b.created_at else None,
            }
            for b in bookings
        ],
        "site_visits": [
            {
                "id": v.id,
                "visit_number": getattr(v, 'visit_number', f"SV-{v.id}"),
                "property_id": v.property_id,
                "property_name": v.property.name if v.property else None,
                "property_locality": v.property.locality if v.property else None,
                "visit_date": v.scheduled_date.isoformat() if v.scheduled_date else (v.created_at.isoformat() if v.created_at else None),
                "time_slot": v.scheduled_time or "10:00 AM - 12:00 PM",
                "status": v.status.value if hasattr(v.status, 'value') else str(v.status),
                "visit_type": v.visit_type.value if hasattr(v.visit_type, 'value') else str(v.visit_type),
                "notes": v.notes,
                "created_at": v.created_at.isoformat() if v.created_at else None,
            }
            for v in visits
        ],
        "documents": [
            {
                "id": d.id,
                "uuid": d.uuid,
                "booking_id": d.booking_id,
                "booking_number": d.booking.booking_number if d.booking else "General",
                "document_type": d.document_type,
                "title": d.title,
                "file_name": d.file_name,
                "file_url": d.file_url,
                "mime_type": d.mime_type,
                "file_size_bytes": d.file_size_bytes,
                "status": d.status or ("verified" if d.is_verified else "pending"),
                "is_verified": d.is_verified,
                "verification_notes": d.verification_notes,
                "rejection_reason": d.rejection_reason,
                "verified_by": d.verified_by,
                "verified_at": d.verified_at.isoformat() if d.verified_at else None,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in documents
        ],
        "payments": [
            {
                "id": p.id,
                "payment_number": p.payment_number,
                "booking_id": p.booking_id,
                "booking_number": p.booking.booking_number if p.booking else None,
                "property_name": p.booking.property.name if p.booking and p.booking.property else None,
                "amount": p.amount,
                "payment_mode": p.payment_mode.value if hasattr(p.payment_mode, 'value') else str(p.payment_mode),
                "status": p.status.value if hasattr(p.status, 'value') else str(p.status),
                "transaction_reference": p.transaction_reference,
                "remarks": p.remarks,
                "payment_date": p.payment_date.isoformat() if p.payment_date else (p.created_at.isoformat() if p.created_at else None),
            }
            for p in payments
        ],
        "leads": [
            {
                "id": l.id,
                "lead_number": l.lead_number,
                "property_name": l.property_rel.name if l.property_rel else None,
                "stage": l.stage.value if hasattr(l.stage, 'value') else str(l.stage),
                "priority": l.priority.value if hasattr(l.priority, 'value') else str(l.priority),
                "lead_score": l.lead_score,
                "budget_max": l.budget_max or l.estimated_deal_value,
                "created_at": l.created_at.isoformat() if l.created_at else None,
            }
            for l in leads
        ],
        "wishlists": [
            {
                "id": w.id,
                "property_id": w.property_id,
                "property_name": w.property.name if w.property else None,
                "created_at": w.created_at.isoformat() if w.created_at else None,
            }
            for w in wishlists
        ],
        "timeline": timeline_events,
    }


# ── Direct KYC Document Verification / Rejection Endpoints ───────────────────

@router.patch("/{user_id}/documents/{doc_id}/verify")
def verify_customer_document(
    user_id: str,
    doc_id: int,
    notes: Optional[str] = Body(None, embed=True),
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin verifies a customer's KYC document with optional notes."""
    doc = db.query(BookingDocument).options(joinedload(BookingDocument.booking)).filter(
        BookingDocument.id == doc_id,
        or_(
            BookingDocument.customer_id == user_id,
            BookingDocument.booking_id.in_(db.query(Booking.id).filter(Booking.customer_id == user_id))
        )
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found for this customer")

    doc.status = "verified"
    doc.is_verified = True
    doc.verification_notes = notes
    doc.rejection_reason = None
    doc.verified_by = current_admin.full_name or current_admin.email
    doc.verified_at = datetime.utcnow()

    # Timeline entry on booking
    if doc.booking_id:
        tl = BookingTimeline(
            booking_id=doc.booking_id,
            event_type="kyc_verified",
            title=f"KYC Document Verified: {doc.title}",
            description=f"Verified by Administrator ({doc.verified_by}).",
            performed_by=doc.verified_by,
        )
        db.add(tl)

    # In-app notification to customer
    notif = Notification(
        user_id=user_id,
        title="KYC Document Verified ✅",
        message=f"Your document '{doc.title}' has been successfully verified for Booking #{doc.booking.booking_number if doc.booking else 'General'}.",
        type=NotificationType.system,
        action_url="/dashboard/bookings",
    )
    db.add(notif)
    db.commit()

    return {
        "success": True,
        "message": f"Document '{doc.title}' verified successfully",
        "document_id": doc.id,
        "status": doc.status,
        "verified_by": doc.verified_by,
        "verified_at": doc.verified_at.isoformat(),
    }


@router.patch("/{user_id}/documents/{doc_id}/reject")
def reject_customer_document(
    user_id: str,
    doc_id: int,
    rejection_reason: str = Body(..., embed=True),
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin rejects a customer's KYC document with mandatory reason."""
    if not rejection_reason.strip():
        raise HTTPException(status_code=400, detail="Rejection reason is required")

    doc = db.query(BookingDocument).options(joinedload(BookingDocument.booking)).filter(
        BookingDocument.id == doc_id,
        or_(
            BookingDocument.customer_id == user_id,
            BookingDocument.booking_id.in_(db.query(Booking.id).filter(Booking.customer_id == user_id))
        )
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found for this customer")

    doc.status = "rejected"
    doc.is_verified = False
    doc.rejection_reason = rejection_reason.strip()
    doc.verified_by = current_admin.full_name or current_admin.email
    doc.verified_at = datetime.utcnow()

    # Timeline entry on booking
    if doc.booking_id:
        tl = BookingTimeline(
            booking_id=doc.booking_id,
            event_type="kyc_rejected",
            title=f"KYC Document Rejected: {doc.title}",
            description=f"Rejected by Admin ({doc.verified_by}). Reason: {doc.rejection_reason}",
            performed_by=doc.verified_by,
        )
        db.add(tl)

    # In-app notification to customer
    notif = Notification(
        user_id=user_id,
        title="KYC Document Requires Attention ⚠️",
        message=f"Your document '{doc.title}' was rejected: {doc.rejection_reason}. Please upload a clear copy.",
        type=NotificationType.system,
        action_url="/dashboard/bookings",
    )
    db.add(notif)
    db.commit()

    return {
        "success": True,
        "message": f"Document '{doc.title}' rejected",
        "document_id": doc.id,
        "status": doc.status,
        "rejection_reason": doc.rejection_reason,
    }


# ── Direct Customer Site Visit Action Endpoints ──────────────────────────────

@router.post("/{user_id}/site-visits")
def schedule_customer_site_visit(
    user_id: str,
    property_id: int = Body(...),
    scheduled_date: str = Body(...),
    scheduled_time: Optional[str] = Body("10:00 AM - 12:00 PM"),
    notes: Optional[str] = Body(None),
    visit_type: Optional[str] = Body("physical"),
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin schedules a site visit directly for a specific customer."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")

    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    # Link to existing lead if present
    lead = db.query(Lead).filter(Lead.customer_id == user_id, Lead.property_id == property_id).first()
    if not lead:
        lead = db.query(Lead).filter(Lead.customer_id == user_id).first()

    visit_num = f"SV-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    try:
        parsed_date = datetime.fromisoformat(scheduled_date.replace("Z", "+00:00"))
    except Exception:
        parsed_date = datetime.utcnow()

    visit = SiteVisit(
        visit_number=visit_num,
        customer_id=user_id,
        property_id=property_id,
        builder_id=prop.builder_id or None,
        lead_id=lead.id if lead else None,
        sales_executive_id=current_admin.id,
        status=VisitStatus.scheduled,
        visit_type=VisitType.physical if visit_type == "physical" else VisitType.virtual,
        scheduled_date=parsed_date,
        scheduled_time=scheduled_time,
        notes=notes,
    )
    db.add(visit)

    # CRM Stage update
    if lead and lead.stage != LeadStage.booked:
        lead.stage = LeadStage.site_visit_scheduled
        lead.priority = LeadPriority.hot

    # Notification to customer
    notif = Notification(
        user_id=user_id,
        title="Site Visit Scheduled 📅",
        message=f"A site visit for '{prop.name}' has been scheduled for {parsed_date.strftime('%d %b %Y')} ({scheduled_time}).",
        type=NotificationType.visit_reminder,
        action_url="/dashboard/site-visits",
    )
    db.add(notif)
    db.commit()
    db.refresh(visit)

    return {
        "success": True,
        "message": "Site visit scheduled successfully",
        "visit_id": visit.id,
        "visit_number": visit.visit_number,
        "status": visit.status,
    }


@router.patch("/{user_id}/site-visits/{visit_id}")
def update_customer_site_visit_status(
    user_id: str,
    visit_id: int,
    status: str = Body(...),
    notes: Optional[str] = Body(None),
    reschedule_date: Optional[str] = Body(None),
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin updates site visit status (confirm, reschedule, complete, cancel)."""
    visit = db.query(SiteVisit).options(joinedload(SiteVisit.property)).filter(
        SiteVisit.id == visit_id,
        SiteVisit.customer_id == user_id,
    ).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Site visit not found for this customer")

    status_lower = status.lower().strip()
    status_enum_map = {
        "scheduled": VisitStatus.scheduled,
        "confirmed": VisitStatus.scheduled,
        "rescheduled": VisitStatus.rescheduled,
        "completed": VisitStatus.completed,
        "cancelled": VisitStatus.cancelled,
        "no_show": VisitStatus.no_show,
    }
    target_status = status_enum_map.get(status_lower, VisitStatus.scheduled)
    visit.status = target_status
    if notes:
        visit.notes = f"{visit.notes or ''}\n[{datetime.utcnow().strftime('%d %b %H:%M')}] {notes}".strip()

    if status_lower == "rescheduled" and reschedule_date:
        try:
            visit.scheduled_date = datetime.fromisoformat(reschedule_date.replace("Z", "+00:00"))
            visit.is_rescheduled = True
        except Exception:
            pass

    # Customer notification
    status_titles = {
        "confirmed": "Site Visit Confirmed ✅",
        "rescheduled": "Site Visit Rescheduled 🔄",
        "completed": "Site Visit Completed 🎉",
        "cancelled": "Site Visit Cancelled ❌",
    }
    notif = Notification(
        user_id=user_id,
        title=status_titles.get(status_lower, "Site Visit Status Updated"),
        message=f"Your visit for '{visit.property.name if visit.property else 'Property'}' is now {status_lower.upper()}.",
        type=NotificationType.visit_reminder,
        action_url="/dashboard/site-visits",
    )
    db.add(notif)
    db.commit()

    return {
        "success": True,
        "message": f"Site visit updated to {status_lower}",
        "visit_id": visit.id,
        "status": visit.status,
    }
