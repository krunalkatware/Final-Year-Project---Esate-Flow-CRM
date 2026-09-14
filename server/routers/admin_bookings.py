import csv
import io
import uuid
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
from server.models.booking import (
    Booking, BookingStatus, BookingPayment, BookingPaymentType, BookingPaymentStatus,
    BookingPaymentMode, BookingInstallment, BookingInstallmentStatus, BookingDocument,
    BookingTimeline, BookingAudit, BookingStatusHistory, BookingRefund, BookingRefundStatus,
    BookingCancellation, BookingAgreement, BookingAgreementStatus, BookingComment, BookingReminder
)
from server.models.user import User
from server.models.property import Property
from server.models.builder import Builder
from server.models.lead import Lead
from server.services.revenue_service import auto_process_booking_revenue

router = APIRouter(prefix="/api/admin/bookings", tags=["Admin Booking Management"])


# ── State Machine Transition Rules ──────────────────────────────────────────

ALLOWED_TRANSITIONS = {
    BookingStatus.DRAFT: [BookingStatus.REQUESTED, BookingStatus.PENDING_APPROVAL, BookingStatus.CANCELLED],
    BookingStatus.REQUESTED: [BookingStatus.PENDING_APPROVAL, BookingStatus.APPROVED, BookingStatus.CONFIRMED, BookingStatus.REJECTED, BookingStatus.CANCELLED],
    BookingStatus.PENDING: [BookingStatus.CONFIRMED, BookingStatus.APPROVED, BookingStatus.REJECTED, BookingStatus.CANCELLED],
    BookingStatus.PENDING_APPROVAL: [BookingStatus.APPROVED, BookingStatus.CONFIRMED, BookingStatus.REJECTED, BookingStatus.CANCELLED],
    BookingStatus.APPROVED: [BookingStatus.AGREEMENT_GENERATED, BookingStatus.PAYMENT_PENDING, BookingStatus.TOKEN_PAID, BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
    BookingStatus.CONFIRMED: [BookingStatus.TOKEN_PAID, BookingStatus.AGREEMENT_GENERATED, BookingStatus.PAYMENT_PENDING, BookingStatus.INSTALLMENT_RUNNING, BookingStatus.COMPLETED, BookingStatus.CANCELLED],
    BookingStatus.AGREEMENT_GENERATED: [BookingStatus.PAYMENT_PENDING, BookingStatus.TOKEN_PAID, BookingStatus.CANCELLED],
    BookingStatus.PAYMENT_PENDING: [BookingStatus.TOKEN_PAID, BookingStatus.CONFIRMED, BookingStatus.INSTALLMENT_RUNNING, BookingStatus.EXPIRED, BookingStatus.CANCELLED],
    BookingStatus.TOKEN_PAID: [BookingStatus.INSTALLMENT_RUNNING, BookingStatus.COMPLETED, BookingStatus.REFUND_INITIATED, BookingStatus.CANCELLED],
    BookingStatus.INSTALLMENT_RUNNING: [BookingStatus.COMPLETED, BookingStatus.REFUND_INITIATED, BookingStatus.CANCELLED],
    BookingStatus.COMPLETED: [BookingStatus.REFUND_INITIATED, BookingStatus.CANCELLED],
    BookingStatus.REJECTED: [BookingStatus.DRAFT, BookingStatus.REQUESTED],
    BookingStatus.CANCELLED: [BookingStatus.REFUND_INITIATED, BookingStatus.DRAFT],
    BookingStatus.REFUND_INITIATED: [BookingStatus.REFUND_COMPLETED, BookingStatus.CANCELLED],
    BookingStatus.REFUND_COMPLETED: [],
    BookingStatus.EXPIRED: [BookingStatus.DRAFT, BookingStatus.REQUESTED],
}


# ── Helpers ──────────────────────────────────────────────────────────────────

def log_booking_audit(
    db: Session,
    booking_id: int,
    action: str,
    admin_name: str,
    field_name: Optional[str] = None,
    old_val: Optional[str] = None,
    new_val: Optional[str] = None
):
    audit = BookingAudit(
        booking_id=booking_id,
        action=action,
        field_name=field_name,
        old_value=old_val,
        new_value=new_val,
        created_by=admin_name,
    )
    db.add(audit)


def add_timeline_event(
    db: Session,
    booking_id: int,
    event_type: str,
    title: str,
    description: Optional[str] = None,
    performed_by: str = "System"
):
    t = BookingTimeline(
        booking_id=booking_id,
        event_type=event_type,
        title=title,
        description=description,
        performed_by=performed_by,
        created_by=performed_by,
    )
    db.add(t)


def generate_booking_number(db: Session) -> str:
    count = db.query(Booking).count()
    return f"EFL-BK-{datetime.utcnow().strftime('%Y%m')}-{count + 1001:04d}"


def calculate_pricing(
    base_price: float,
    discount_amount: float = 0.0,
    floor_rise: float = 0.0,
    plc: float = 0.0,
    parking: float = 0.0,
    club: float = 0.0,
    other: float = 0.0,
    gst_percent: float = 5.0,
    token_amt: float = 100000.0
):
    gross = base_price + floor_rise + plc + parking + club + other
    taxable = max(0.0, gross - discount_amount)
    gst = taxable * (gst_percent / 100.0)
    stamp_duty = taxable * 0.05  # 5%
    registration = 30000.0  # standard fixed
    net_total = taxable + gst + stamp_duty + registration
    booking_amt = net_total * 0.10  # 10% booking amount standard
    remaining = net_total - token_amt

    return {
        "gross_total": gross,
        "taxable_amount": taxable,
        "gst_amount": gst,
        "stamp_duty_amount": stamp_duty,
        "registration_charges": registration,
        "net_total": net_total,
        "booking_amount": booking_amt,
        "remaining_amount": remaining
    }


# ── Schemas ──────────────────────────────────────────────────────────────────

class BookingCreateSchema(BaseModel):
    customer_id: Optional[str] = None
    property_id: int
    builder_id: Optional[int] = None
    lead_id: Optional[int] = None
    sales_executive_id: Optional[int] = None
    unit_number: Optional[str] = None
    floor_number: Optional[int] = 1
    bhk_type: Optional[str] = "3 BHK"
    super_builtup_area: Optional[float] = 1450.0
    carpet_area: Optional[float] = 1100.0
    base_price: float
    discount_amount: Optional[float] = 0.0
    discount_reason: Optional[str] = None
    token_amount: Optional[float] = 100000.0
    floor_rise_charges: Optional[float] = 0.0
    plc_charges: Optional[float] = 0.0
    parking_charges: Optional[float] = 0.0
    club_membership_charges: Optional[float] = 0.0
    other_charges: Optional[float] = 0.0
    notes: Optional[str] = None


class BookingStatusUpdateSchema(BaseModel):
    status: BookingStatus
    reason: Optional[str] = None


class BookingPaymentCreateSchema(BaseModel):
    payment_type: BookingPaymentType
    payment_mode: BookingPaymentMode
    amount: float
    transaction_reference: Optional[str] = None
    bank_name: Optional[str] = None
    cheque_number: Optional[str] = None
    remarks: Optional[str] = None


class BookingCommentCreateSchema(BaseModel):
    content: Optional[str] = None
    comment: Optional[str] = None
    is_internal: bool = True

    def get_text(self) -> str:
        return self.comment or self.content or ""


class BookingRefundCreateSchema(BaseModel):
    requested_amount: float
    forfeiture_amount: Optional[float] = 0.0
    reason: str
    payout_mode: Optional[str] = "bank_transfer"
    remarks: Optional[str] = None


class BulkActionSchema(BaseModel):
    booking_ids: List[int]
    reason: Optional[str] = None


# ── Endpoints ────────────────────────────────────────────────────────────────


@router.get("/analytics")
def get_booking_analytics(
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    all_bookings = db.query(Booking).filter(Booking.deleted_at == None).all()
    total = len(all_bookings)
    pending = sum(1 for b in all_bookings if b.status in [BookingStatus.DRAFT, BookingStatus.REQUESTED, BookingStatus.PENDING_APPROVAL])
    approved = sum(1 for b in all_bookings if b.status in [BookingStatus.APPROVED, BookingStatus.AGREEMENT_GENERATED, BookingStatus.PAYMENT_PENDING])
    completed = sum(1 for b in all_bookings if b.status == BookingStatus.COMPLETED)
    cancelled = sum(1 for b in all_bookings if b.status in [BookingStatus.CANCELLED, BookingStatus.REJECTED])

    total_revenue = sum(b.paid_amount for b in all_bookings)
    est_pipeline = sum(b.net_total for b in all_bookings)
    token_revenue = sum(b.token_amount for b in all_bookings if b.paid_amount >= b.token_amount)

    # Status funnel
    status_counts = {}
    for b in all_bookings:
        status_counts[b.status.value] = status_counts.get(b.status.value, 0) + 1

    # Monthly trends
    monthly = [
        {"month": "Jan", "bookings": max(1, int(total * 0.1)), "revenue": total_revenue * 0.1},
        {"month": "Feb", "bookings": max(1, int(total * 0.15)), "revenue": total_revenue * 0.15},
        {"month": "Mar", "bookings": max(1, int(total * 0.2)), "revenue": total_revenue * 0.2},
        {"month": "Apr", "bookings": max(1, int(total * 0.25)), "revenue": total_revenue * 0.25},
        {"month": "May", "bookings": max(1, int(total * 0.3)), "revenue": total_revenue * 0.3},
    ]

    return {
        "summary": {
            "total_bookings": total,
            "pending": pending,
            "approved": approved,
            "completed": completed,
            "cancelled": cancelled,
            "total_revenue": total_revenue,
            "estimated_pipeline_value": est_pipeline,
            "token_revenue": token_revenue,
        },
        "status_breakdown": status_counts,
        "monthly_trends": monthly,
    }


@router.get("/calendar")
def get_booking_calendar(
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    installments = (
        db.query(BookingInstallment)
        .join(Booking)
        .filter(Booking.deleted_at == None)
        .limit(100)
        .all()
    )
    events = []
    for inst in installments:
        events.append({
            "id": f"inst-{inst.id}",
            "title": f"Installment #{inst.installment_number} - ₹{inst.due_amount:,.0f}",
            "date": inst.due_date.strftime("%Y-%m-%d"),
            "type": "installment",
            "status": inst.status.value,
            "booking_id": inst.booking_id,
        })
    return {"events": events}


@router.get("/export")
def export_bookings_csv(
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    bookings = db.query(Booking).filter(Booking.deleted_at == None).order_by(desc(Booking.created_at)).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Booking Number", "Status", "Customer Name", "Customer Email", "Property",
        "Net Total (₹)", "Paid Amount (₹)", "Remaining (₹)", "Created Date"
    ])
    for b in bookings:
        c_name = b.customer.full_name if b.customer else "N/A"
        c_email = b.customer.email if b.customer else "N/A"
        p_name = b.property.name if b.property else "N/A"
        writer.writerow([
            b.booking_number, b.status.value, c_name, c_email, p_name,
            b.net_total, b.paid_amount, b.remaining_amount,
            b.created_at.strftime("%Y-%m-%d %H:%M:%S")
        ])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=estateflow_bookings_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
    )


@router.get("")
def list_bookings(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=500),
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    property_id: Optional[int] = None,
    builder_id: Optional[int] = None,
    sales_executive_id: Optional[int] = None,
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    query = db.query(Booking).filter(Booking.deleted_at == None)

    if search:
        term = f"%{search}%"
        query = query.join(User, Booking.customer_id == User.id, isouter=True).filter(
            or_(
                Booking.booking_number.ilike(term),
                Booking.unit_number.ilike(term),
                User.full_name.ilike(term),
                User.email.ilike(term),
                User.phone.ilike(term),
            )
        )

    if status_filter:
        query = query.filter(Booking.status == status_filter)
    if property_id:
        query = query.filter(Booking.property_id == property_id)
    if builder_id:
        query = query.filter(Booking.builder_id == builder_id)
    if sales_executive_id:
        query = query.filter(Booking.sales_executive_id == sales_executive_id)

    total = query.count()
    pages = (total + limit - 1) // limit

    items = (
        query.options(
            joinedload(Booking.customer).joinedload(User.customer),
            joinedload(Booking.property),
            joinedload(Booking.builder),
            joinedload(Booking.sales_executive),
        )
        .order_by(desc(Booking.created_at))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    result = []
    for b in items:
        cust_name = (
            (b.customer.full_name if b.customer else None) or
            (f"{b.customer.customer.first_name} {b.customer.customer.last_name or ''}".strip() if b.customer and b.customer.customer and (b.customer.customer.first_name or b.customer.customer.last_name) else None) or
            b.customer_name or
            (b.customer.email.split('@')[0] if b.customer else "Valued Customer")
        )
        result.append({
            "id": b.id,
            "uuid": b.uuid,
            "booking_number": b.booking_number,
            "status": b.status.value if hasattr(b.status, 'value') else str(b.status or "draft"),
            "unit_number": b.unit_number,
            "bhk_type": b.bhk_type,
            "net_total": b.net_total,
            "token_amount": b.token_amount,
            "paid_amount": b.paid_amount,
            "remaining_amount": b.remaining_amount,
            "customer": {
                "id": b.customer.id,
                "name": cust_name,
                "email": b.customer.email,
                "phone": b.customer.phone or (b.customer.customer.phone if b.customer and b.customer.customer else b.customer_phone),
            } if b.customer else None,
            "property": {
                "id": b.property.id,
                "title": b.property.name,
                "city": b.property.locality or "N/A",
            } if b.property else None,
            "builder": {
                "id": b.builder.id,
                "name": b.builder.name,
            } if b.builder else None,
            "sales_executive_name": b.sales_executive.first_name if b.sales_executive else "Unassigned",
            "created_at": b.created_at.isoformat() if b.created_at else None,
        })

    return {
        "items": result,
        "total": total,
        "page": page,
        "pages": pages,
        "limit": limit,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreateSchema,
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    user, admin = admin_ctx
    prop = db.query(Property).filter(Property.id == payload.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    pricing = calculate_pricing(
        base_price=payload.base_price,
        discount_amount=payload.discount_amount or 0.0,
        floor_rise=payload.floor_rise_charges or 0.0,
        plc=payload.plc_charges or 0.0,
        parking=payload.parking_charges or 0.0,
        club=payload.club_membership_charges or 0.0,
        other=payload.other_charges or 0.0,
        token_amt=payload.token_amount or 100000.0,
    )

    bk_num = generate_booking_number(db)
    booking = Booking(
        booking_number=bk_num,
        customer_id=payload.customer_id,
        property_id=payload.property_id,
        builder_id=payload.builder_id or prop.builder_id,
        lead_id=payload.lead_id,
        sales_executive_id=payload.sales_executive_id or admin.id,
        unit_number=payload.unit_number or f"Unit-{prop.id}01",
        floor_number=payload.floor_number or 1,
        bhk_type=payload.bhk_type or "3 BHK",
        super_builtup_area=payload.super_builtup_area or 1450.0,
        carpet_area=payload.carpet_area or 1100.0,
        base_price=payload.base_price,
        discount_amount=payload.discount_amount or 0.0,
        discount_reason=payload.discount_reason,
        gross_total=pricing["gross_total"],
        taxable_amount=pricing["taxable_amount"],
        gst_amount=pricing["gst_amount"],
        stamp_duty_amount=pricing["stamp_duty_amount"],
        registration_charges=pricing["registration_charges"],
        net_total=pricing["net_total"],
        token_amount=payload.token_amount or 100000.0,
        booking_amount=pricing["booking_amount"],
        remaining_amount=pricing["remaining_amount"],
        status=BookingStatus.REQUESTED,
        created_by=user.full_name,
    )
    db.add(booking)
    db.flush()

    # Generate default installment schedule (4 milestones)
    milestones = [
        ("Token & Booking Fee", 0.10, timedelta(days=7)),
        ("Foundation Milestone", 0.25, timedelta(days=30)),
        ("Superstructure Milestone", 0.35, timedelta(days=90)),
        ("Possession & Handover", 0.30, timedelta(days=180)),
    ]
    for i, (name, pct, delta) in enumerate(milestones, 1):
        inst = BookingInstallment(
            booking_id=booking.id,
            installment_number=i,
            name=name,
            percentage=pct * 100,
            due_amount=pricing["net_total"] * pct,
            due_date=datetime.utcnow() + delta,
            status=BookingInstallmentStatus.PENDING,
            created_by=user.full_name,
        )
        db.add(inst)

    add_timeline_event(db, booking.id, "booking_created", "Booking Created", f"Booking {bk_num} initiated.", user.full_name)
    log_booking_audit(db, booking.id, "create", user.full_name, new_val=bk_num)

    db.commit()
    db.refresh(booking)
    return {"id": booking.id, "booking_number": booking.booking_number, "status": booking.status.value}



# ── Audit Logs (must be BEFORE /{booking_id} to avoid route conflict) ────────

@router.get("/audit-logs")
def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    query = db.query(BookingAudit)
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                BookingAudit.action.ilike(term),
                BookingAudit.field_name.ilike(term),
                BookingAudit.new_value.ilike(term),
                BookingAudit.created_by.ilike(term),
            )
        )
    total = query.count()
    pages = (total + limit - 1) // limit
    logs = query.order_by(desc(BookingAudit.created_at)).offset((page - 1) * limit).limit(limit).all()
    items = []
    for log in logs:
        items.append({
            "id": log.id,
            "booking_id": log.booking_id,
            "action": log.action.upper(),
            "description": f"{log.action}: {log.field_name or 'booking'} -> {log.new_value or ''}",
            "changes": {"field": log.field_name, "from": log.old_value, "to": log.new_value},
            "performed_by_name": log.created_by or "System",
            "created_at": log.created_at.isoformat() if log.created_at else None,
        })
    return {"items": items, "total": total, "page": page, "pages": pages}


@router.get("/{booking_id}")
def get_booking_detail(
    booking_id: int,
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    b = (
        db.query(Booking)
        .filter(Booking.id == booking_id, Booking.deleted_at == None)
        .options(
            joinedload(Booking.customer),
            joinedload(Booking.property),
            joinedload(Booking.builder),
            joinedload(Booking.sales_executive),
            joinedload(Booking.payments),
            joinedload(Booking.installments),
            joinedload(Booking.documents),
            joinedload(Booking.timeline),
            joinedload(Booking.audit_logs),
            joinedload(Booking.status_history),
            joinedload(Booking.refunds),
            joinedload(Booking.agreements),
            joinedload(Booking.comments),
        )
        .first()
    )
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")

    return {
        "id": b.id,
        "uuid": b.uuid,
        "booking_number": b.booking_number,
        "status": b.status.value,
        "rejection_reason": b.rejection_reason,
        "cancellation_reason": b.cancellation_reason,
        "unit_number": b.unit_number,
        "floor_number": b.floor_number,
        "bhk_type": b.bhk_type,
        "super_builtup_area": b.super_builtup_area,
        "carpet_area": b.carpet_area,
        "pricing": {
            "base_price": b.base_price,
            "floor_rise_charges": b.floor_rise_charges,
            "plc_charges": b.plc_charges,
            "parking_charges": b.parking_charges,
            "club_membership_charges": b.club_membership_charges,
            "other_charges": b.other_charges,
            "gross_total": b.gross_total,
            "discount_amount": b.discount_amount,
            "discount_reason": b.discount_reason,
            "taxable_amount": b.taxable_amount,
            "gst_amount": b.gst_amount,
            "stamp_duty_amount": b.stamp_duty_amount,
            "registration_charges": b.registration_charges,
            "net_total": b.net_total,
            "token_amount": b.token_amount,
            "booking_amount": b.booking_amount,
            "paid_amount": b.paid_amount,
            "remaining_amount": b.remaining_amount,
        },
        "customer": {
            "id": b.customer.id,
            "name": b.customer.full_name,
            "email": b.customer.email,
            "phone": b.customer.phone,
        } if b.customer else None,
        "property": {
            "id": b.property.id,
            "title": b.property.name,
            "city": b.property.locality or "N/A",
            "price": b.property.price,
        } if b.property else None,
        "builder": {
            "id": b.builder.id,
            "name": b.builder.name,
        } if b.builder else None,
        "sales_executive_name": b.sales_executive.first_name if b.sales_executive else "Unassigned",
        "created_at": b.created_at.isoformat(),
        "payments": [{
            "id": p.id,
            "payment_number": p.payment_number,
            "type": p.payment_type.value,
            "mode": p.payment_mode.value,
            "status": p.status.value,
            "amount": p.amount,
            "total_paid": p.total_paid,
            "ref": p.transaction_reference,
            "date": p.payment_date.isoformat(),
        } for p in b.payments],
        "installments": [{
            "id": inst.id,
            "installment_number": inst.installment_number,
            "name": inst.name,
            "due_amount": inst.due_amount,
            "paid_amount": inst.paid_amount,
            "due_date": inst.due_date.isoformat(),
            "status": inst.status.value,
        } for inst in b.installments],
        "documents": [{
            "id": doc.id,
            "title": doc.title,
            "type": doc.document_type,
            "file_url": doc.file_url,
            "verified": doc.is_verified,
            "created_at": doc.created_at.isoformat(),
        } for doc in b.documents],
        "timeline": [{
            "id": t.id,
            "title": t.title,
            "type": t.event_type,
            "description": t.description,
            "performed_by": t.performed_by,
            "created_at": t.created_at.isoformat(),
        } for t in b.timeline],
        "comments": [{
            "id": c.id,
            "author": c.author_name,
            "content": c.content,
            "created_at": c.created_at.isoformat(),
        } for c in b.comments],
        "agreements": [{
            "id": a.id,
            "number": a.agreement_number,
            "status": a.status.value,
            "signed_customer": bool(a.customer_signed_at),
            "signed_builder": bool(a.builder_signed_at),
        } for a in b.agreements],
    }


# ── Workflow State Transitions ───────────────────────────────────────────────

@router.put("/{booking_id}/status")
@router.patch("/{booking_id}/status")
def update_booking_status(
    booking_id: int,
    payload: BookingStatusUpdateSchema,
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    user, _ = admin_ctx
    b = db.query(Booking).filter(Booking.id == booking_id, Booking.deleted_at == None).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    old_status = b.status
    new_status = payload.status

    allowed = ALLOWED_TRANSITIONS.get(old_status, [])
    if not allowed:
        # Fallback: check matching enum or string representation
        for k, v in ALLOWED_TRANSITIONS.items():
            if (hasattr(k, 'value') and k.value == str(old_status)) or str(k) == str(old_status):
                allowed = v
                break

    allowed_vals = [s.value if hasattr(s, 'value') else str(s) for s in allowed]
    new_val = new_status.value if hasattr(new_status, 'value') else str(new_status)
    old_val = old_status.value if hasattr(old_status, 'value') else str(old_status)

    if new_val not in allowed_vals and old_val != new_val:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition from '{old_val}' to '{new_val}'. Allowed: {allowed_vals}"
        )

    b.status = new_status
    if payload.reason:
        if new_status == BookingStatus.REJECTED:
            b.rejection_reason = payload.reason
        elif new_status == BookingStatus.CANCELLED:
            b.cancellation_reason = payload.reason

    sh = BookingStatusHistory(
        booking_id=b.id,
        old_status=old_status.value if old_status else None,
        new_status=new_status.value,
        transition_reason=payload.reason,
        changed_by=user.full_name,
    )
    db.add(sh)
    add_timeline_event(db, b.id, "status_changed", f"Status Updated to {new_status.value.upper()}", payload.reason, user.full_name)
    log_booking_audit(db, b.id, "status_update", user.full_name, "status", old_status.value if old_status else "", new_status.value)

    db.commit()

    # Automatic Revenue Generation on confirmation/approval/completion
    if new_status in [BookingStatus.TOKEN_PAID, BookingStatus.APPROVED, BookingStatus.COMPLETED, BookingStatus.CONFIRMED]:
        try:
            auto_process_booking_revenue(
                db=db,
                booking_id=b.id,
                booking_value=b.net_total or b.gross_total or 5000000.0,
                recipient_user_id=b.customer_id,
                property_type=b.property.property_type if b.property else None,
            )
        except Exception as e:
            print(f"[Revenue Engine] Auto-process notice: {e}")

    return {"success": True, "status": b.status.value}


@router.patch("/{booking_id}/approve")
def approve_booking(booking_id: int, db: Session = Depends(get_db), admin_ctx: tuple = Depends(get_current_admin)):
    return update_booking_status(booking_id, BookingStatusUpdateSchema(status=BookingStatus.APPROVED), db, admin_ctx)


@router.patch("/{booking_id}/reject")
def reject_booking(booking_id: int, payload: BookingStatusUpdateSchema, db: Session = Depends(get_db), admin_ctx: tuple = Depends(get_current_admin)):
    payload.status = BookingStatus.REJECTED
    return update_booking_status(booking_id, payload, db, admin_ctx)


@router.patch("/{booking_id}/cancel")
def cancel_booking(booking_id: int, payload: BookingStatusUpdateSchema, db: Session = Depends(get_db), admin_ctx: tuple = Depends(get_current_admin)):
    payload.status = BookingStatus.CANCELLED
    return update_booking_status(booking_id, payload, db, admin_ctx)


@router.patch("/{booking_id}/complete")
def complete_booking(booking_id: int, db: Session = Depends(get_db), admin_ctx: tuple = Depends(get_current_admin)):
    return update_booking_status(booking_id, BookingStatusUpdateSchema(status=BookingStatus.COMPLETED), db, admin_ctx)


@router.patch("/{booking_id}/generate-agreement")
def generate_agreement(booking_id: int, db: Session = Depends(get_db), admin_ctx: tuple = Depends(get_current_admin)):
    user, _ = admin_ctx
    b = db.query(Booking).filter(Booking.id == booking_id, Booking.deleted_at == None).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")

    agr_num = f"AGR-{b.booking_number}"
    agr = BookingAgreement(
        booking_id=b.id,
        agreement_number=agr_num,
        status=BookingAgreementStatus.GENERATED,
        pdf_file_url=f"/agreements/{agr_num}.pdf",
        created_by=user.full_name,
    )
    db.add(agr)
    b.status = BookingStatus.AGREEMENT_GENERATED
    add_timeline_event(db, b.id, "agreement_generated", "Booking Agreement Generated", f"Agreement {agr_num} created.", user.full_name)
    db.commit()
    return {"success": True, "agreement_number": agr_num}


# ── Payments, Comments & Sub-resources ───────────────────────────────────────

@router.post("/{booking_id}/payments")
def record_payment(
    booking_id: int,
    payload: BookingPaymentCreateSchema,
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    user, _ = admin_ctx
    b = db.query(Booking).filter(Booking.id == booking_id, Booking.deleted_at == None).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")

    pay_num = f"PAY-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    pay = BookingPayment(
        booking_id=b.id,
        payment_number=pay_num,
        payment_type=payload.payment_type,
        payment_mode=payload.payment_mode,
        status=BookingPaymentStatus.COMPLETED,
        amount=payload.amount,
        total_paid=payload.amount,
        transaction_reference=payload.transaction_reference or f"TXN-{uuid.uuid4().hex[:8]}",
        bank_name=payload.bank_name,
        cheque_number=payload.cheque_number,
        remarks=payload.remarks,
        created_by=user.full_name,
    )
    db.add(pay)

    b.paid_amount += payload.amount
    b.remaining_amount = max(0.0, b.net_total - b.paid_amount)
    if b.paid_amount >= b.token_amount and b.status in [BookingStatus.APPROVED, BookingStatus.AGREEMENT_GENERATED, BookingStatus.PAYMENT_PENDING]:
        b.status = BookingStatus.TOKEN_PAID

    add_timeline_event(db, b.id, "payment_received", f"Payment Recorded: ₹{payload.amount:,.0f}", f"Via {payload.payment_mode.value}. Ref: {pay.transaction_reference}", user.full_name)
    log_booking_audit(db, b.id, "payment", user.full_name, new_val=f"₹{payload.amount}")

    db.commit()
    return {"success": True, "payment_number": pay_num, "paid_amount": b.paid_amount, "remaining": b.remaining_amount}


@router.post("/{booking_id}/comments")
def add_comment(
    booking_id: int,
    payload: BookingCommentCreateSchema,
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    user, _ = admin_ctx
    text = payload.get_text()
    comment = BookingComment(
        booking_id=booking_id,
        author_name=user.full_name,
        content=text,
        is_internal=payload.is_internal,
        created_by=user.full_name,
    )
    db.add(comment)
    add_timeline_event(db, booking_id, "comment_added", "Internal Note Added", text[:50], user.full_name)
    db.commit()
    return {"success": True}


# ── Bulk Actions ─────────────────────────────────────────────────────────────

@router.post("/bulk-delete")
def bulk_delete_bookings(payload: BulkActionSchema, db: Session = Depends(get_db), admin_ctx: tuple = Depends(get_current_admin)):
    user, _ = admin_ctx
    db.query(Booking).filter(Booking.id.in_(payload.booking_ids)).update(
        {Booking.deleted_at: datetime.utcnow(), Booking.updated_by: user.full_name},
        synchronize_session=False
    )
    db.commit()
    return {"success": True, "count": len(payload.booking_ids)}


@router.post("/bulk-approve")
def bulk_approve_bookings(payload: BulkActionSchema, db: Session = Depends(get_db), admin_ctx: tuple = Depends(get_current_admin)):
    user, _ = admin_ctx
    db.query(Booking).filter(Booking.id.in_(payload.booking_ids)).update(
        {Booking.status: BookingStatus.APPROVED, Booking.updated_by: user.full_name},
        synchronize_session=False
    )
    db.commit()
    return {"success": True, "count": len(payload.booking_ids)}


@router.get("/{booking_id}/agreement-pdf")
def download_agreement_pdf(
    booking_id: int,
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    """Returns a simple text placeholder for the agreement PDF."""
    b = db.query(Booking).filter(Booking.id == booking_id, Booking.deleted_at == None).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    content = f"EstateFlow Booking Agreement\n{'=' * 40}\nBooking: {b.booking_number}\nStatus: {b.status.value}\nNet Total: Rs.{b.net_total:,.2f}\nGenerated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"
    return StreamingResponse(
        io.BytesIO(content.encode("utf-8")),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=agreement_{b.booking_number}.pdf"}
    )


# ── Document Verification Center ─────────────────────────────────────────────

@router.get("/documents/all")
def list_all_booking_documents(
    status_filter: Optional[str] = Query(None, alias="status"),
    booking_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    query = db.query(BookingDocument).join(Booking).filter(Booking.deleted_at == None)

    if booking_id:
        query = query.filter(BookingDocument.booking_id == booking_id)
    if status_filter:
        if status_filter.lower() == "verified":
            query = query.filter(BookingDocument.is_verified == True)
        elif status_filter.lower() in ("pending", "under_review"):
            query = query.filter(BookingDocument.is_verified == False)

    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                BookingDocument.title.ilike(term),
                BookingDocument.file_name.ilike(term),
                BookingDocument.document_type.ilike(term),
                Booking.booking_number.ilike(term),
            )
        )

    docs = query.order_by(desc(BookingDocument.created_at)).all()
    results = []
    for d in docs:
        b = d.booking
        cust_name = (b.customer.full_name if b and b.customer else (b.customer_name if b else "N/A"))
        results.append({
            "id": d.id,
            "uuid": d.uuid,
            "booking_id": d.booking_id,
            "booking_number": b.booking_number if b else "N/A",
            "customer_name": cust_name,
            "property_name": b.property.name if b and b.property else "N/A",
            "document_type": d.document_type,
            "title": d.title,
            "file_name": d.file_name,
            "file_url": d.file_url,
            "file_size_bytes": d.file_size_bytes,
            "mime_type": d.mime_type,
            "is_verified": d.is_verified,
            "verification_notes": d.verification_notes,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        })
    return results


class DocumentVerifySchema(BaseModel):
    status: str  # verified, rejected, resubmission_required
    rejection_reason: Optional[str] = None
    notes: Optional[str] = None


@router.put("/documents/{doc_id}/verify")
def verify_booking_document(
    doc_id: int,
    payload: DocumentVerifySchema,
    db: Session = Depends(get_db),
    admin_ctx: tuple = Depends(get_current_admin),
):
    admin_user, _ = admin_ctx
    doc = db.query(BookingDocument).filter(BookingDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    status_lower = payload.status.lower()
    if status_lower not in ("verified", "rejected", "resubmission_required", "pending"):
        raise HTTPException(status_code=400, detail=f"Invalid status: {payload.status}. Must be verified, rejected, or resubmission_required.")

    is_verified = status_lower == "verified"
    notes = payload.notes or payload.rejection_reason or f"Document status updated to {payload.status}"

    # ── Sync ALL status fields on the document ─────────────────────────────
    doc.status = status_lower
    doc.is_verified = is_verified
    doc.verification_notes = notes
    doc.rejection_reason = payload.rejection_reason if not is_verified else None
    doc.verified_by = admin_user.full_name
    doc.verified_at = datetime.utcnow() if is_verified else None
    doc.updated_by = admin_user.full_name

    # Timeline event
    add_timeline_event(
        db=db,
        booking_id=doc.booking_id,
        event_type="document_verified" if is_verified else "document_rejected",
        title=f"Document {payload.status.title()}: {doc.title}",
        description=notes,
        performed_by=admin_user.full_name,
    )

    # Customer notification
    b = doc.booking
    if b and b.customer_id:
        from server.models.notification import Notification, NotificationType
        notif_msg = (
            f"Your uploaded document '{doc.title}' for Booking #{b.booking_number} was verified successfully."
            if is_verified
            else f"Action required for document '{doc.title}': {notes}"
        )
        notif = Notification(
            user_id=b.customer_id,
            title=f"Document {payload.status.title()}",
            message=notif_msg,
            type=NotificationType.booking_confirmed if is_verified else NotificationType.system,
            action_url="/dashboard/bookings",
        )
        db.add(notif)

    db.commit()
    db.refresh(doc)
    return {
        "success": True,
        "id": doc.id,
        "status": doc.status,
        "is_verified": doc.is_verified,
        "rejection_reason": doc.rejection_reason,
        "verification_notes": doc.verification_notes,
        "verified_at": doc.verified_at.isoformat() if doc.verified_at else None,
    }
