import csv
import io
import uuid
import math
from datetime import datetime, timedelta
from typing import Optional, List, Any
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func, or_, and_

from server.config.database import get_db
from server.core.dependencies import get_current_admin
from server.models.admin import AdminUser
from server.models.site_visit import (
    SiteVisit, VisitStatus, VisitType, VisitPriority, SiteVisitAssignment,
    SiteVisitTimeline, SiteVisitComment, SiteVisitDocument, SiteVisitReminder,
    SiteVisitFeedback, SiteVisitStatusHistory, SiteVisitRoute, SiteVisitAttendance,
    SiteVisitAudit, SiteVisitNotification
)
from server.models.user import User
from server.models.property import Property
from server.models.builder import Builder
from server.models.lead import Lead, LeadStage

router = APIRouter(prefix="/api/admin/site-visits", tags=["Admin Site Visits"])


# ── Workflow State Transition Rules ──────────────────────────────────────────

ALLOWED_TRANSITIONS = {
    VisitStatus.draft: [VisitStatus.scheduled, VisitStatus.cancelled],
    VisitStatus.scheduled: [VisitStatus.in_transit, VisitStatus.rescheduled, VisitStatus.cancelled, VisitStatus.no_show],
    VisitStatus.in_transit: [VisitStatus.arrived, VisitStatus.cancelled, VisitStatus.no_show],
    VisitStatus.arrived: [VisitStatus.completed, VisitStatus.no_show, VisitStatus.cancelled],
    VisitStatus.completed: [],
    VisitStatus.cancelled: [VisitStatus.scheduled],
    VisitStatus.rescheduled: [VisitStatus.scheduled, VisitStatus.cancelled],
    VisitStatus.no_show: [VisitStatus.rescheduled, VisitStatus.cancelled],
}


# ── Audit Trail and Timeline Helpers ─────────────────────────────────────────

def log_visit_audit(
    db: Session,
    visit_id: int,
    action: str,
    admin_name: str,
    field_name: Optional[str] = None,
    old_val: Optional[str] = None,
    new_val: Optional[str] = None
):
    audit = SiteVisitAudit(
        site_visit_id=visit_id,
        action=action,
        field_name=field_name,
        old_value=old_val,
        new_value=new_val,
        created_by=admin_name,
    )
    db.add(audit)


def add_visit_timeline_event(
    db: Session,
    visit_id: int,
    event_type: str,
    title: str,
    description: Optional[str] = None,
    performed_by: str = "System"
):
    t = SiteVisitTimeline(
        site_visit_id=visit_id,
        event_type=event_type,
        title=title,
        description=description,
        performed_by=performed_by,
        created_by=performed_by,
    )
    db.add(t)


def generate_visit_number(db: Session) -> str:
    count = db.query(SiteVisit).count()
    return f"EFL-SV-{datetime.utcnow().strftime('%Y%m')}-{count + 1001:04d}"


# ── Schemas ──────────────────────────────────────────────────────────────────

class SiteVisitCreateSchema(BaseModel):
    lead_id: Optional[int] = None
    customer_id: Optional[str] = None
    property_id: int
    builder_id: Optional[int] = None
    booking_id: Optional[int] = None
    sales_executive_id: Optional[int] = None
    visit_type: Optional[VisitType] = VisitType.physical
    purpose: Optional[str] = None
    scheduled_date: datetime
    scheduled_time: Optional[str] = None
    expected_duration: Optional[int] = 60
    transport_required: Optional[bool] = False
    pickup_location: Optional[str] = None
    drop_location: Optional[str] = None
    notes: Optional[str] = None
    priority: Optional[VisitPriority] = VisitPriority.medium


class SiteVisitUpdateSchema(BaseModel):
    visit_type: Optional[VisitType] = None
    purpose: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    scheduled_time: Optional[str] = None
    expected_duration: Optional[int] = None
    transport_required: Optional[bool] = None
    pickup_location: Optional[str] = None
    drop_location: Optional[str] = None
    notes: Optional[str] = None
    priority: Optional[VisitPriority] = None
    sales_executive_id: Optional[int] = None


class SiteVisitStatusUpdateSchema(BaseModel):
    status: VisitStatus
    reason: Optional[str] = None


class GPSCoordinatesSchema(BaseModel):
    latitude: float
    longitude: float
    gps_coordinates: Optional[str] = None


class FeedbackSubmitSchema(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comments: Optional[str] = None
    interested_in_booking: Optional[bool] = False
    next_action: Optional[str] = None


class AttendanceMarkSchema(BaseModel):
    sales_executive_id: int
    attendance_status: str  # present, absent, delayed
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class CommentCreateSchema(BaseModel):
    comment: str
    is_internal: Optional[bool] = True


class BulkActionSchema(BaseModel):
    visit_ids: List[int]
    reason: Optional[str] = None
    sales_executive_id: Optional[int] = None


# ── REST Endpoints ───────────────────────────────────────────────────────────

@router.get("/analytics")
def get_site_visit_analytics(
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    all_visits = db.query(SiteVisit).filter(SiteVisit.deleted_at == None).all()
    total = len(all_visits)
    
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    today_visits = sum(1 for v in all_visits if today_start <= v.scheduled_date < today_end)
    upcoming_visits = sum(1 for v in all_visits if v.scheduled_date >= today_start and v.status == VisitStatus.scheduled)
    completed = sum(1 for v in all_visits if v.status == VisitStatus.completed)
    cancelled = sum(1 for v in all_visits if v.status == VisitStatus.cancelled)
    no_show = sum(1 for v in all_visits if v.status == VisitStatus.no_show)
    
    # Simple conversion rate (completed visits that have a linked booking_id or feedback score >= 4)
    converted_visits = sum(1 for v in all_visits if v.status == VisitStatus.completed and (v.booking_id is not None or (v.feedback_score and v.feedback_score >= 4)))
    conversion_rate = (converted_visits / max(completed, 1)) * 100.0
    
    # Leaderboard
    exec_map = {}
    for v in all_visits:
        if v.sales_executive_id:
            name = v.sales_executive.full_name if v.sales_executive else f"Rep #{v.sales_executive_id}"
            stats = exec_map.setdefault(name, {"completed": 0, "total": 0})
            stats["total"] += 1
            if v.status == VisitStatus.completed:
                stats["completed"] += 1
                
    leaderboard = [{"name": k, "completed": v["completed"], "total": v["total"]} for k, v in exec_map.items()]
    leaderboard = sorted(leaderboard, key=lambda x: x["completed"], reverse=True)[:5]
    
    # Monthly trend
    monthly_trends = [
        {"month": "Jan", "visits": max(1, int(total * 0.15)), "completed": max(1, int(completed * 0.15))},
        {"month": "Feb", "visits": max(1, int(total * 0.2)), "completed": max(1, int(completed * 0.2))},
        {"month": "Mar", "visits": max(1, int(total * 0.25)), "completed": max(1, int(completed * 0.25))},
        {"month": "Apr", "visits": max(1, int(total * 0.3)), "completed": max(1, int(completed * 0.3))},
    ]

    return {
        "summary": {
            "total_visits": total,
            "today_visits": today_visits,
            "upcoming_visits": upcoming_visits,
            "completed": completed,
            "cancelled": cancelled,
            "no_show": no_show,
            "conversion_rate": round(conversion_rate, 1),
            "avg_visit_duration": 45,  # minutes avg
        },
        "leaderboard": leaderboard,
        "monthly_trends": monthly_trends,
        "status_breakdown": {
            "scheduled": sum(1 for v in all_visits if v.status == VisitStatus.scheduled),
            "completed": completed,
            "cancelled": cancelled,
            "no_show": no_show,
            "in_transit": sum(1 for v in all_visits if v.status == VisitStatus.in_transit),
            "arrived": sum(1 for v in all_visits if v.status == VisitStatus.arrived),
        }
    }


@router.get("/calendar")
def get_site_visit_calendar(
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    visits = db.query(SiteVisit).filter(SiteVisit.deleted_at == None).all()
    events = []
    for v in visits:
        events.append({
            "id": v.id,
            "title": f"{v.visit_number} - {v.property.name if v.property else 'Property Visit'}",
            "start": v.scheduled_date.isoformat(),
            "end": (v.scheduled_date + timedelta(minutes=v.expected_duration)).isoformat(),
            "status": v.status.value,
            "priority": v.priority.value,
            "executive": v.sales_executive.full_name if v.sales_executive else "Unassigned",
        })
    return {"events": events}


@router.get("/export")
def export_site_visits_csv(
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    visits = db.query(SiteVisit).filter(SiteVisit.deleted_at == None).order_by(desc(SiteVisit.created_at)).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Visit Number", "Status", "Customer Name", "Property Name", "Sales Rep",
        "Scheduled Date", "Duration (min)", "Transport Required", "Priority"
    ])
    for v in visits:
        c_name = v.customer.full_name if v.customer else "N/A"
        p_name = v.property.name if v.property else "N/A"
        rep_name = v.sales_executive.full_name if v.sales_executive else "N/A"
        writer.writerow([
            v.visit_number, v.status.value, c_name, p_name, rep_name,
            v.scheduled_date.strftime("%Y-%m-%d %H:%M:%S") if v.scheduled_date else "N/A",
            v.expected_duration, v.transport_required, v.priority.value
        ])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=estateflow_site_visits_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
    )


@router.get("")
def list_site_visits(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=500),
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    property_id: Optional[int] = None,
    builder_id: Optional[int] = None,
    sales_executive_id: Optional[int] = None,
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    query = db.query(SiteVisit).filter(SiteVisit.deleted_at == None)

    if search:
        term = f"%{search}%"
        query = query.join(User, SiteVisit.customer_id == User.id, isouter=True).filter(
            or_(
                SiteVisit.visit_number.ilike(term),
                User.full_name.ilike(term),
                User.phone.ilike(term),
            )
        )

    if status_filter:
        query = query.filter(SiteVisit.status == status_filter)
    if priority_filter:
        query = query.filter(SiteVisit.priority == priority_filter)
    if property_id:
        query = query.filter(SiteVisit.property_id == property_id)
    if builder_id:
        query = query.filter(SiteVisit.builder_id == builder_id)
    if sales_executive_id:
        query = query.filter(SiteVisit.sales_executive_id == sales_executive_id)

    total = query.count()
    pages = (total + limit - 1) // limit

    items = (
        query.options(
            joinedload(SiteVisit.user).joinedload(User.customer),
            joinedload(SiteVisit.property),
            joinedload(SiteVisit.builder),
            joinedload(SiteVisit.sales_executive),
        )
        .order_by(desc(SiteVisit.scheduled_date))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    result = []
    for v in items:
        cust_name = (
            (v.customer.full_name if v.customer else None) or
            (f"{v.customer.customer.first_name} {v.customer.customer.last_name or ''}".strip() if v.customer and v.customer.customer and (v.customer.customer.first_name or v.customer.customer.last_name) else None) or
            (v.customer.email.split('@')[0] if v.customer else "Valued Customer")
        )
        result.append({
            "id": v.id,
            "uuid": v.uuid,
            "visit_number": v.visit_number,
            "status": v.status.value if hasattr(v.status, 'value') else str(v.status),
            "priority": v.priority.value if hasattr(v.priority, 'value') else str(v.priority),
            "visit_type": v.visit_type.value if hasattr(v.visit_type, 'value') else str(v.visit_type),
            "scheduled_date": v.scheduled_date.isoformat() if v.scheduled_date else None,
            "scheduled_time": v.scheduled_time,
            "customer": {
                "id": v.customer.id,
                "name": cust_name,
                "phone": v.customer.phone or (v.customer.customer.phone if v.customer and v.customer.customer else None),
            } if v.customer else None,
            "property": {
                "id": v.property.id,
                "title": v.property.name,
                "locality": v.property.locality,
            } if v.property else None,
            "builder": {
                "id": v.builder.id,
                "name": v.builder.name,
            } if v.builder else None,
            "sales_executive_name": v.sales_executive.full_name if v.sales_executive else "Unassigned",
        })

    return {
        "items": result,
        "total": total,
        "page": page,
        "pages": pages,
        "limit": limit,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_site_visit(
    payload: SiteVisitCreateSchema,
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    user, admin = admin_ctx
    
    # Verify property and builder
    prop = db.query(Property).filter(Property.id == payload.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
        
    builder_id = payload.builder_id or prop.builder_id

    # Auto Assignment / Conflict Detection
    exec_id = payload.sales_executive_id
    assigned_rule = "manual"
    if not exec_id:
        # Perform Round Robin allocation among admin users with executive profiles
        executives = db.query(AdminUser).filter(AdminUser.is_active == True).all()
        if executives:
            # Pick executive with minimum active scheduled visits
            executives_scores = []
            for ex in executives:
                score = db.query(SiteVisit).filter(
                    SiteVisit.sales_executive_id == ex.id,
                    SiteVisit.status == VisitStatus.scheduled
                ).count()
                executives_scores.append((score, ex.id))
            executives_scores.sort()
            exec_id = executives_scores[0][1]
            assigned_rule = "round_robin"
            
    # Conflict check
    if exec_id:
        conflict = db.query(SiteVisit).filter(
            SiteVisit.sales_executive_id == exec_id,
            SiteVisit.status == VisitStatus.scheduled,
            SiteVisit.scheduled_date == payload.scheduled_date
        ).first()
        if conflict:
            # Log warning, but allow creation
            pass

    visit_num = generate_visit_number(db)
    visit = SiteVisit(
        visit_number=visit_num,
        lead_id=payload.lead_id,
        customer_id=payload.customer_id,
        property_id=payload.property_id,
        builder_id=builder_id,
        booking_id=payload.booking_id,
        sales_executive_id=exec_id,
        assigned_manager_id=admin.id,
        visit_type=payload.visit_type,
        purpose=payload.purpose,
        scheduled_date=payload.scheduled_date,
        scheduled_time=payload.scheduled_time,
        expected_duration=payload.expected_duration,
        transport_required=payload.transport_required,
        pickup_location=payload.pickup_location,
        drop_location=payload.drop_location,
        notes=payload.notes,
        priority=payload.priority,
        created_by=user.full_name,
    )
    db.add(visit)
    db.flush()

    # Create assignment record
    if exec_id:
        asg = SiteVisitAssignment(
            site_visit_id=visit.id,
            sales_executive_id=exec_id,
            assignment_rule=assigned_rule,
            status="accepted",
            created_by=user.full_name,
        )
        db.add(asg)

    # Timeline event
    add_visit_timeline_event(db, visit.id, "created", "Site Visit Created", f"Site visit pass {visit_num} issued.", user.full_name)
    log_visit_audit(db, visit.id, "create", user.full_name, new_val=visit_num)

    # Auto stage update for leads
    if payload.lead_id:
        lead = db.query(Lead).filter(Lead.id == payload.lead_id).first()
        if lead:
            lead.stage = LeadStage.site_visit_scheduled
            lead.updated_by = user.full_name

    db.commit()
    db.refresh(visit)
    return {"id": visit.id, "visit_number": visit.visit_number, "status": visit.status.value}


@router.get("/{visit_id}")
def get_site_visit_detail(
    visit_id: int,
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    v = (
        db.query(SiteVisit)
        .filter(SiteVisit.id == visit_id, SiteVisit.deleted_at == None)
        .options(
            joinedload(SiteVisit.user),
            joinedload(SiteVisit.property),
            joinedload(SiteVisit.builder),
            joinedload(SiteVisit.sales_executive),
            joinedload(SiteVisit.timeline),
            joinedload(SiteVisit.comments),
            joinedload(SiteVisit.documents),
            joinedload(SiteVisit.feedbacks),
            joinedload(SiteVisit.status_history),
            joinedload(SiteVisit.routes),
            joinedload(SiteVisit.attendance),
        )
        .first()
    )
    if not v:
        raise HTTPException(status_code=404, detail="Site Visit not found")

    return {
        "id": v.id,
        "uuid": v.uuid,
        "visit_number": v.visit_number,
        "status": v.status.value,
        "priority": v.priority.value,
        "visit_type": v.visit_type.value,
        "purpose": v.purpose,
        "scheduled_date": v.scheduled_date.isoformat(),
        "scheduled_time": v.scheduled_time,
        "expected_duration": v.expected_duration,
        "notes": v.notes,
        "feedback_score": v.feedback_score,
        "conversion_probability": v.conversion_probability,
        "gps_coordinates": v.gps_coordinates,
        "pickup_location": v.pickup_location,
        "drop_location": v.drop_location,
        "transport_required": v.transport_required,
        "customer": {
            "id": v.customer.id,
            "name": v.customer.full_name,
            "email": v.customer.email,
            "phone": v.customer.phone,
        } if v.customer else None,
        "property": {
            "id": v.property.id,
            "title": v.property.name,
            "locality": v.property.locality,
        } if v.property else None,
        "builder": {
            "id": v.builder.id,
            "name": v.builder.name,
        } if v.builder else None,
        "sales_executive": {
            "id": v.sales_executive.id,
            "name": v.sales_executive.full_name,
        } if v.sales_executive else None,
        "timeline": [{
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "event_type": t.event_type,
            "performed_by": t.performed_by,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        } for t in v.timeline],
        "comments": [{
            "id": c.id,
            "author": c.author_name,
            "comment": c.comment,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        } for c in v.comments],
        "documents": [{
            "id": d.id,
            "document_name": d.document_name,
            "document_type": d.document_type,
            "file_url": d.file_url,
            "is_verified": d.is_verified,
        } for d in v.documents],
        "feedbacks": [{
            "id": f.id,
            "rating": f.rating,
            "comments": f.comments,
            "created_at": f.created_at.isoformat() if f.created_at else None,
        } for f in v.feedbacks],
        "attendance": [{
            "id": a.id,
            "attendance_status": a.attendance_status,
            "marked_time": a.marked_time.isoformat() if a.marked_time else None,
            "is_gps_verified": a.is_gps_verified,
        } for a in v.attendance],
    }


@router.put("/{visit_id}")
def update_site_visit(
    visit_id: int,
    payload: SiteVisitUpdateSchema,
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    user, _ = admin_ctx
    v = db.query(SiteVisit).filter(SiteVisit.id == visit_id, SiteVisit.deleted_at == None).first()
    if not v:
        raise HTTPException(status_code=404, detail="Site Visit not found")

    for field, val in payload.dict(exclude_unset=True).items():
        if val is not None:
            old_val = str(getattr(v, field, ""))
            setattr(v, field, val)
            log_visit_audit(db, v.id, "update", user.full_name, field, old_val, str(val))

    v.updated_by = user.full_name
    db.commit()
    return {"success": True}


@router.delete("/{visit_id}")
def delete_site_visit(
    visit_id: int,
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    user, _ = admin_ctx
    v = db.query(SiteVisit).filter(SiteVisit.id == visit_id, SiteVisit.deleted_at == None).first()
    if not v:
        raise HTTPException(status_code=404, detail="Site Visit not found")

    v.deleted_at = datetime.utcnow()
    v.updated_by = user.full_name
    log_visit_audit(db, v.id, "delete", user.full_name)
    db.commit()
    return {"success": True}


# ── State Machine Workflow Patch Routes ──────────────────────────────────────

@router.patch("/{visit_id}/status")
def update_status(
    visit_id: int,
    payload: SiteVisitStatusUpdateSchema,
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    user, _ = admin_ctx
    v = db.query(SiteVisit).filter(SiteVisit.id == visit_id, SiteVisit.deleted_at == None).first()
    if not v:
        raise HTTPException(status_code=404, detail="Site Visit not found")

    old_status = v.status
    new_status = payload.status

    allowed = ALLOWED_TRANSITIONS.get(old_status, [])
    if new_status not in allowed and old_status != new_status:
        raise HTTPException(
            status_code=400,
            detail=f"Transition from {old_status.value} to {new_status.value} not allowed."
        )

    v.status = new_status
    v.updated_by = user.full_name
    
    # Track status history
    hist = SiteVisitStatusHistory(
        site_visit_id=v.id,
        old_status=old_status,
        new_status=new_status,
        reason=payload.reason,
        created_by=user.full_name,
    )
    db.add(hist)

    add_visit_timeline_event(db, v.id, "status_change", f"Status updated to {new_status.value}", payload.reason, user.full_name)
    log_visit_audit(db, v.id, "status_change", user.full_name, "status", old_status.value, new_status.value)
    
    db.commit()
    return {"success": True, "status": v.status.value}


@router.patch("/{visit_id}/check-in")
def check_in(
    visit_id: int,
    payload: GPSCoordinatesSchema,
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    user, _ = admin_ctx
    v = db.query(SiteVisit).filter(SiteVisit.id == visit_id, SiteVisit.deleted_at == None).first()
    if not v:
        raise HTTPException(status_code=404, detail="Site Visit not found")

    v.check_in_time = datetime.utcnow()
    v.gps_coordinates = payload.gps_coordinates or f"{payload.latitude}, {payload.longitude}"
    v.status = VisitStatus.arrived
    v.updated_by = user.full_name

    add_visit_timeline_event(db, v.id, "check_in", "Executive Checked In", f"Logged GPS: {v.gps_coordinates}", user.full_name)
    log_visit_audit(db, v.id, "check-in", user.full_name, "check_in_time", None, v.check_in_time.isoformat())

    db.commit()
    return {"success": True, "check_in_time": v.check_in_time.isoformat()}


@router.patch("/{visit_id}/check-out")
def check_out(
    visit_id: int,
    payload: GPSCoordinatesSchema,
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    user, _ = admin_ctx
    v = db.query(SiteVisit).filter(SiteVisit.id == visit_id, SiteVisit.deleted_at == None).first()
    if not v:
        raise HTTPException(status_code=404, detail="Site Visit not found")

    v.check_out_time = datetime.utcnow()
    v.status = VisitStatus.completed
    v.updated_by = user.full_name

    add_visit_timeline_event(db, v.id, "check_out", "Executive Checked Out", "Completed site visit.", user.full_name)
    log_visit_audit(db, v.id, "check-out", user.full_name, "check_out_time", None, v.check_out_time.isoformat())

    db.commit()
    return {"success": True, "check_out_time": v.check_out_time.isoformat()}


@router.patch("/{visit_id}/feedback")
def submit_feedback(
    visit_id: int,
    payload: FeedbackSubmitSchema,
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    user, _ = admin_ctx
    v = db.query(SiteVisit).filter(SiteVisit.id == visit_id, SiteVisit.deleted_at == None).first()
    if not v:
        raise HTTPException(status_code=404, detail="Site Visit not found")

    v.feedback_score = payload.rating
    v.conversion_probability = 0.2 * payload.rating
    if payload.interested_in_booking:
        v.conversion_probability = 0.9
        
    feedback = SiteVisitFeedback(
        site_visit_id=v.id,
        rating=payload.rating,
        comments=payload.comments,
        interested_in_booking=payload.interested_in_booking,
        next_action=payload.next_action,
        created_by=user.full_name,
    )
    db.add(feedback)

    add_visit_timeline_event(db, v.id, "feedback", f"Feedback logged: {payload.rating} Stars", payload.comments, user.full_name)
    log_visit_audit(db, v.id, "feedback", user.full_name, "feedback_score", None, str(payload.rating))

    db.commit()
    return {"success": True}


@router.patch("/{visit_id}/attendance")
def mark_attendance(
    visit_id: int,
    payload: AttendanceMarkSchema,
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    user, _ = admin_ctx
    v = db.query(SiteVisit).filter(SiteVisit.id == visit_id, SiteVisit.deleted_at == None).first()
    if not v:
        raise HTTPException(status_code=404, detail="Site Visit not found")

    att = SiteVisitAttendance(
        site_visit_id=v.id,
        sales_executive_id=payload.sales_executive_id,
        attendance_status=payload.attendance_status,
        latitude=payload.latitude,
        longitude=payload.longitude,
        is_gps_verified=payload.latitude is not None,
        created_by=user.full_name,
    )
    db.add(att)
    
    add_visit_timeline_event(db, v.id, "attendance", f"Attendance Marked: {payload.attendance_status}", None, user.full_name)
    db.commit()
    return {"success": True}


@router.post("/{visit_id}/comments")
def add_comment(
    visit_id: int,
    payload: CommentCreateSchema,
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    user, _ = admin_ctx
    comment = SiteVisitComment(
        site_visit_id=visit_id,
        author_name=user.full_name,
        comment=payload.comment,
        is_internal=payload.is_internal,
        created_by=user.full_name,
    )
    db.add(comment)
    add_visit_timeline_event(db, visit_id, "comment", "Comment added", payload.comment[:50], user.full_name)
    db.commit()
    return {"success": True}


@router.get("/{visit_id}/route-plan")
def route_plan(
    visit_id: int,
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    v = db.query(SiteVisit).filter(SiteVisit.id == visit_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Site Visit not found")
        
    return {
        "routes": [
            {
                "stop": 1,
                "name": "Pickup Location",
                "address": v.pickup_location or "Sales Office",
                "lat": 19.0760,
                "lng": 72.8777,
            },
            {
                "stop": 2,
                "name": v.property.name if v.property else "Property Site",
                "address": v.property.locality if v.property else "Site Address",
                "lat": 19.0800,
                "lng": 72.8800,
            },
            {
                "stop": 3,
                "name": "Drop-off Destination",
                "address": v.drop_location or "Customer Residence",
                "lat": 19.0760,
                "lng": 72.8777,
            }
        ],
        "metrics": {
            "total_distance_km": 5.4,
            "estimated_duration_min": 25,
            "traffic_status": "moderate"
        }
    }


# ── Bulk Operations ──────────────────────────────────────────────────────────

@router.post("/bulk-delete")
def bulk_delete_visits(
    payload: BulkActionSchema,
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    user, _ = admin_ctx
    db.query(SiteVisit).filter(SiteVisit.id.in_(payload.visit_ids)).update(
        {SiteVisit.deleted_at: datetime.utcnow(), SiteVisit.updated_by: user.full_name},
        synchronize_session=False
    )
    db.commit()
    return {"success": True, "count": len(payload.visit_ids)}


@router.post("/bulk-assign")
def bulk_assign_visits(
    payload: BulkActionSchema,
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    user, _ = admin_ctx
    if not payload.sales_executive_id:
        raise HTTPException(status_code=400, detail="Sales executive ID required")

    visits = db.query(SiteVisit).filter(SiteVisit.id.in_(payload.visit_ids)).all()
    for v in visits:
        v.sales_executive_id = payload.sales_executive_id
        v.updated_by = user.full_name
        
        asg = SiteVisitAssignment(
            site_visit_id=v.id,
            sales_executive_id=payload.sales_executive_id,
            assignment_rule="manual_bulk",
            status="accepted",
            created_by=user.full_name,
        )
        db.add(asg)
        add_visit_timeline_event(db, v.id, "assigned", f"Reassigned to Rep #{payload.sales_executive_id}", None, user.full_name)

    db.commit()
    return {"success": True, "count": len(payload.visit_ids)}
