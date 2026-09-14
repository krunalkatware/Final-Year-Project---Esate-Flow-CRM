import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import desc
from server.config.database import get_db
from server.core.dependencies import get_current_user
from server.models.user import User
from server.models.site_visit import SiteVisit, VisitStatus
from server.models.property import Property
from server.schemas.user import SiteVisitCreate, SiteVisitOut

router = APIRouter(prefix="/api/site-visits", tags=["Site Visits"])


def _serialize_visit(v) -> dict:
    prop = v.property
    primary_image = None
    if prop and prop.images:
        pi = next((img for img in prop.images if img.is_primary), prop.images[0] if prop.images else None)
        primary_image = pi.url if pi else None
    return {
        "id": v.id,
        "visit_number": v.visit_number,
        "property_id": v.property_id,
        "property_name": prop.name if prop else None,
        "property_image": primary_image,
        "property_locality": prop.locality if prop else None,
        "property_city": prop.city_rel.name if prop and prop.city_rel else None,
        "visit_date": v.scheduled_date.isoformat() if v.scheduled_date else None,
        "time_slot": v.scheduled_time,
        "status": v.status.value if hasattr(v.status, 'value') else v.status,
        "notes": v.notes,
        "created_at": v.created_at.isoformat() if v.created_at else None,
    }


@router.post("")
def create_site_visit(
    data: SiteVisitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prop = db.query(Property).filter(Property.id == data.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    builder_id = prop.builder_id

    scheduled_dt = data.visit_date
    if not isinstance(scheduled_dt, datetime):
        scheduled_dt = datetime.combine(scheduled_dt, datetime.min.time())

    today = datetime.utcnow().date()
    if scheduled_dt.date() < today:
        raise HTTPException(
            status_code=400,
            detail="Site visit date must be today or a future date."
        )

    slot = (data.time_slot or "10:00 AM").strip()

    # Prevent duplicate active bookings for the same customer, property, date, and slot
    existing = db.query(SiteVisit).filter(
        SiteVisit.customer_id == current_user.id,
        SiteVisit.property_id == data.property_id,
        SiteVisit.scheduled_date == scheduled_dt,
        SiteVisit.scheduled_time == slot,
        SiteVisit.status.in_([VisitStatus.scheduled, VisitStatus.in_transit, VisitStatus.arrived]),
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You already have an active site visit scheduled for this property at the selected date and time."
        )

    visit_num = f"SV-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    visit = SiteVisit(
        visit_number=visit_num,
        customer_id=current_user.id,
        property_id=data.property_id,
        builder_id=builder_id,
        scheduled_date=scheduled_dt,
        scheduled_time=slot,
        notes=data.notes,
        status=VisitStatus.scheduled,
    )
    db.add(visit)
    db.flush()

    from server.models.notification import Notification, NotificationType
    from server.models.user import UserRole
    from server.models.site_visit import SiteVisitTimeline

    visit_str = scheduled_dt.strftime("%b %d, %Y")
    cust_name = (current_user.customer.full_name if current_user.customer else current_user.email)

    # 1. Customer Notification
    notif = Notification(
        user_id=current_user.id,
        title="Site Visit Scheduled",
        message=f"Site visit confirmed ({visit_num}) for '{prop.name}' on {visit_str} at {data.time_slot or '10:00 AM'}.",
        type=NotificationType.visit_reminder,
        action_url="/dashboard/site-visits",
    )
    db.add(notif)

    # 2. Admin Real-Time Notifications
    admin_users = db.query(User).filter(User.role == UserRole.admin).all()
    for admin in admin_users:
        admin_notif = Notification(
            user_id=admin.id,
            title="⚡ New VIP Site Visit Scheduled",
            message=f"Customer {cust_name} scheduled site visit #{visit_num} for property '{prop.name}' on {visit_str} at {data.time_slot or '10:00 AM'}.",
            type=NotificationType.visit_reminder,
            action_url="/admin/site-visits/list",
        )
        db.add(admin_notif)

    # 3. Log Timeline Event
    timeline_event = SiteVisitTimeline(
        site_visit_id=visit.id,
        event_type="scheduled",
        title="Site Visit Booked by Customer",
        description=f"Customer {cust_name} booked site visit for '{prop.name}' on {visit_str} slot: {data.time_slot or '10:00 AM'}",
        performed_by=cust_name,
        created_by=cust_name,
    )
    db.add(timeline_event)

    # 4. Sync Real Activity to CRM Lead Pipeline
    try:
        from server.models.lead import Lead, LeadStage, LeadSource, LeadPriority
        lead = db.query(Lead).filter(Lead.customer_id == current_user.id, Lead.property_id == data.property_id).first()
        if not lead:
            lead = db.query(Lead).filter(Lead.customer_id == current_user.id).first()
        name_parts = (current_user.full_name or "Valued Customer").split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        if not lead:
            lead_num = f"EFL-LD-{uuid.uuid4().hex[:8].upper()}"
            lead = Lead(
                lead_number=lead_num,
                customer_id=current_user.id,
                first_name=first_name,
                last_name=last_name,
                email=current_user.email,
                phone=current_user.phone or "+91 98000 00000",
                property_id=data.property_id,
                stage=LeadStage.site_visit_scheduled,
                source=LeadSource.website,
                priority=LeadPriority.hot,
                notes_summary=f"Site visit scheduled for {visit_str} ({data.time_slot})",
            )
            db.add(lead)
        else:
            lead.stage = LeadStage.site_visit_scheduled
            lead.property_id = data.property_id
            lead.priority = LeadPriority.hot
        db.flush()
        visit.lead_id = lead.id
    except Exception as e:
        print(f"[CRM Sync] {e}")

    db.commit()
    db.refresh(visit)
    return {"message": "Site visit scheduled", "visit_id": visit.id, "visit_number": visit_num}


@router.get("")
def get_site_visits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    visits = (
        db.query(SiteVisit)
        .options(
            joinedload(SiteVisit.property).selectinload(Property.images),
            joinedload(SiteVisit.property).joinedload(Property.city_rel),
        )
        .filter(SiteVisit.customer_id == current_user.id)
        .order_by(desc(SiteVisit.scheduled_date))
        .all()
    )
    return [_serialize_visit(v) for v in visits]


@router.delete("/{visit_id}")
def cancel_visit(
    visit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    visit = db.query(SiteVisit).filter(SiteVisit.id == visit_id, SiteVisit.customer_id == current_user.id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    visit.status = VisitStatus.cancelled
    db.commit()
    return {"message": "Visit cancelled"}

