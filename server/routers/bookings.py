import uuid
import hashlib
import hmac
from fastapi import APIRouter, Depends, HTTPException, Body, Request
from sqlalchemy.orm import Session
from server.config.database import get_db
from server.core.dependencies import get_current_user
from server.repositories.booking_repo import BookingRepository
from server.models.user import User
from server.models.booking import Booking, BookingStatus, BookingPayment, BookingPaymentType, BookingPaymentStatus, BookingPaymentMode
from server.schemas.booking import BookingCreate, BookingUpdate
from server.models.notification import Notification, NotificationType

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])


def _serialize_booking(b) -> dict:
    prop = b.property
    primary_image = None
    if prop and prop.images:
        pi = next((img for img in prop.images if img.is_primary), prop.images[0] if prop.images else None)
        primary_image = pi.url if pi else None
    return {
        "id": b.id,
        "booking_number": b.booking_number,
        "property_id": b.property_id,
        "property_name": prop.name if prop else None,
        "property_locality": prop.locality if prop else None,
        "property_city": prop.city_rel.name if prop and prop.city_rel else None,
        "property_image": primary_image,
        "property_price": prop.price if prop else None,
        "status": b.status,
        "customer_name": b.customer_name,
        "customer_email": b.customer_email,
        "customer_phone": b.customer_phone,
        "preferred_visit_date": b.preferred_visit_date.isoformat() if b.preferred_visit_date else None,
        "visit_time_slot": b.visit_time_slot,
        "special_requirements": b.special_requirements,
        "created_at": b.created_at.isoformat() if b.created_at else None,
        "updated_at": b.updated_at.isoformat() if b.updated_at else None,
    }


@router.post("")
def create_booking(
    data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new booking in PAYMENT_PENDING status.
    Booking is NOT confirmed until Razorpay payment is verified via /verify-payment.
    """
    repo = BookingRepository(db)
    booking = repo.create(current_user.id, data)

    # Sync Real Activity to CRM Lead Pipeline
    try:
        from server.models.lead import Lead, LeadStage, LeadSource, LeadPriority
        lead = db.query(Lead).filter(Lead.customer_id == current_user.id, Lead.property_id == booking.property_id).first()
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
                property_id=booking.property_id,
                stage=LeadStage.negotiation,
                source=LeadSource.website,
                priority=LeadPriority.hot,
                notes_summary=f"Booking initiated (awaiting payment): #{booking.booking_number}",
            )
            db.add(lead)
        else:
            lead.stage = LeadStage.negotiation
            lead.property_id = booking.property_id
            lead.notes_summary = f"{lead.notes_summary or ''}\nBooking initiated (awaiting payment): #{booking.booking_number}".strip()
        db.flush()
        booking.lead_id = lead.id
    except Exception as e:
        print(f"[CRM Sync] {e}")

    # Create in-app notification: payment awaiting
    notif = Notification(
        user_id=current_user.id,
        title="Booking Initiated — Complete Payment",
        message=f"Booking #{booking.booking_number} created. Please complete the token payment to confirm your allotment.",
        type=NotificationType.booking_confirmed,
        action_url=f"/dashboard/bookings",
    )
    db.add(notif)
    db.commit()
    db.refresh(booking)

    return {
        "message": "Booking initiated. Please complete payment to confirm.",
        "booking_number": booking.booking_number,
        "booking_id": booking.id,
        "status": booking.status,
    }


@router.get("")
def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = BookingRepository(db)
    bookings = repo.get_by_user(current_user.id)
    return [_serialize_booking(b) for b in bookings]


@router.get("/{booking_id}")
def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = BookingRepository(db)
    booking = repo.get_by_id(booking_id, current_user.id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return _serialize_booking(booking)


@router.put("/{booking_id}")
def update_booking(
    booking_id: int,
    data: BookingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = BookingRepository(db)
    booking = repo.get_by_id(booking_id, current_user.id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    updated = repo.update(booking, data)
    db.commit()
    return {"message": "Booking updated", "booking_id": updated.id}


@router.delete("/{booking_id}")
@router.patch("/{booking_id}/cancel")
@router.post("/{booking_id}/cancel")
def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = BookingRepository(db)
    booking = repo.get_by_id(booking_id, current_user.id)
    if not booking:
        # Check if booking exists by ID for customer
        booking = db.query(Booking).filter(Booking.id == booking_id, Booking.customer_id == current_user.id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    repo.cancel(booking)
    booking.cancellation_reason = "Cancelled by customer"

    # Sync Cancellation to CRM Lead Pipeline
    try:
        from server.models.lead import Lead, LeadStage
        lead = None
        if booking.lead_id:
            lead = db.query(Lead).filter(Lead.id == booking.lead_id).first()
        if not lead:
            lead = db.query(Lead).filter(Lead.customer_id == current_user.id).first()
        if lead:
            lead.notes_summary = f"{lead.notes_summary or ''}\nBooking #{booking.booking_number} cancelled by customer".strip()
            # If lead was in booked stage, mark as lost
            if lead.stage == LeadStage.booked:
                lead.stage = LeadStage.lost
                lead.loss_reason = "Booking cancelled by customer"
    except Exception as lead_err:
        print(f"[Lead Cancel Sync] {lead_err}")

    db.commit()
    db.refresh(booking)
    return {"message": "Booking cancelled successfully", "booking_id": booking.id, "status": "cancelled"}


# ── Razorpay Payment Gateway Endpoints ──────────────────────────────────────

@router.post("/{booking_id}/create-payment-order")
def create_payment_order(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a Razorpay payment order for a booking's token amount.
    
    Requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to be configured in .env.
    The frontend calls this before loading the Razorpay checkout modal.
    """
    from server.config.settings import settings

    if not settings.razorpay_configured:
        raise HTTPException(
            status_code=400,
            detail="Payment gateway is not configured for production. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables."
        )

    # Fetch booking - verify customer owns it
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.customer_id == current_user.id,
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    token_amount = int(booking.token_amount or 25000)

    try:
        import razorpay  # type: ignore
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        order_data = client.order.create({
            "amount": token_amount * 100,  # Razorpay uses paise
            "currency": "INR",
            "receipt": f"EFL-BKG-{booking.booking_number}",
            "notes": {
                "booking_id": str(booking.id),
                "booking_number": booking.booking_number,
                "customer_id": str(current_user.id),
                "customer_email": current_user.email,
                "property_id": str(booking.property_id),
            }
        })
        return {
            "mode": "live",
            "razorpay_order_id": order_data["id"],
            "razorpay_key_id": settings.RAZORPAY_KEY_ID,
            "amount": token_amount,
            "amount_paise": token_amount * 100,
            "currency": "INR",
            "booking_number": booking.booking_number,
            "customer_name": booking.customer_name or current_user.full_name,
            "customer_email": booking.customer_email or current_user.email,
            "customer_phone": booking.customer_phone or current_user.phone or "",
        }
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="Razorpay SDK not installed. Run: pip install razorpay"
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Razorpay order creation failed: {str(e)}")


@router.post("/{booking_id}/verify-payment")
def verify_payment(
    booking_id: int,
    razorpay_order_id: str = Body(...),
    razorpay_payment_id: str = Body(...),
    razorpay_signature: str = Body(...),
    payment_method: str = Body(default="upi"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Cryptographically verify Razorpay payment signature and confirm booking.
    
    Verifies HMAC-SHA256 signature using Razorpay key secret.
    
    On success:
    - Creates a BookingPayment record (idempotently)
    - Transitions booking to CONFIRMED status
    - Triggers the auto_process_booking_revenue engine ONCE
    - Sends in-app notifications
    """
    from server.config.settings import settings

    if not settings.razorpay_configured:
        raise HTTPException(
            status_code=400,
            detail="Payment gateway is not configured for production. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
        )

    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.customer_id == current_user.id,
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Prevent double-payment / duplicate confirmation
    if booking.status == BookingStatus.confirmed:
        existing_payment = db.query(BookingPayment).filter(BookingPayment.booking_id == booking.id).first()
        return {
            "success": True,
            "message": "Booking already confirmed",
            "booking_number": booking.booking_number,
            "booking_id": booking.id,
            "payment_number": existing_payment.payment_number if existing_payment else None,
            "amount_paid": existing_payment.amount if existing_payment else booking.paid_amount,
            "transaction_reference": existing_payment.transaction_reference if existing_payment else None,
            "status": booking.status,
        }

    # Verify HMAC-SHA256 signature
    expected_sig = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
        f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected_sig, razorpay_signature):
        raise HTTPException(
            status_code=400,
            detail="Payment signature verification failed. Cryptographic signature does not match."
        )

    # Check for existing payment with this reference to prevent duplicates
    existing_txn = db.query(BookingPayment).filter(
        BookingPayment.transaction_reference == razorpay_payment_id
    ).first()
    if existing_txn:
        return {
            "success": True,
            "message": "Payment already processed",
            "booking_number": booking.booking_number,
            "booking_id": booking.id,
            "payment_number": existing_txn.payment_number,
            "amount_paid": existing_txn.amount,
            "transaction_reference": razorpay_payment_id,
            "status": booking.status,
        }

    # ── Record Payment ─────────────────────────────────────────────────────────
    token_amount = float(booking.token_amount or 25000)
    payment_number = f"EFL-PAY-{uuid.uuid4().hex[:10].upper()}"

    mode_map = {
        "upi": BookingPaymentMode.UPI,
        "card": BookingPaymentMode.CREDIT_CARD,
        "netbanking": BookingPaymentMode.NET_BANKING,
        "bank_transfer": BookingPaymentMode.BANK_TRANSFER,
        "cash": BookingPaymentMode.CASH,
    }
    pay_mode = mode_map.get(payment_method.lower(), BookingPaymentMode.UPI)

    bp = BookingPayment(
        booking_id=booking.id,
        payment_number=payment_number,
        payment_type=BookingPaymentType.TOKEN,
        payment_mode=pay_mode,
        status=BookingPaymentStatus.COMPLETED,
        amount=token_amount,
        tax_amount=0.0,
        penalty_amount=0.0,
        total_paid=token_amount,
        transaction_reference=razorpay_payment_id,
        remarks=f"Live Razorpay payment | Order: {razorpay_order_id}",
    )
    db.add(bp)

    # ── Confirm Booking ────────────────────────────────────────────────────────
    booking.status = BookingStatus.confirmed
    booking.paid_amount = token_amount
    db.flush()

    # ── CRM Lead Pipeline Sync ─────────────────────────────────────────────────
    try:
        from server.models.lead import Lead, LeadStage, LeadPriority
        lead = None
        if booking.lead_id:
            lead = db.query(Lead).filter(Lead.id == booking.lead_id).first()
        if not lead:
            lead = db.query(Lead).filter(Lead.customer_id == current_user.id).first()
        if lead:
            lead.stage = LeadStage.booked
            lead.priority = LeadPriority.vip
            lead.notes_summary = f"{lead.notes_summary or ''}\nPayment verified & booking confirmed: #{booking.booking_number}".strip()
        db.flush()
    except Exception as e:
        print(f"[CRM Payment Sync] {e}")

    # ── Revenue Engine Trigger ─────────────────────────────────────────────────
    try:
        from server.services.revenue_service import auto_process_booking_revenue
        prop = booking.property
        booking_val = float(prop.price) if prop and prop.price else 10000000.0
        prop_type = prop.property_type if prop else "apartment"
        auto_process_booking_revenue(
            db=db,
            booking_id=booking.id,
            booking_value=booking_val,
            recipient_user_id=current_user.id,
            property_type=prop_type,
        )
    except Exception as err:
        print(f"[Revenue Engine] {err}")

    # ── In-App Notification ────────────────────────────────────────────────────
    notif = Notification(
        user_id=current_user.id,
        title="🎉 Token Payment Verified & Booking Confirmed!",
        message=f"Payment of ₹{int(token_amount):,} verified. Booking #{booking.booking_number} is officially confirmed. Revenue ledger updated.",
        type=NotificationType.booking_confirmed,
        action_url=f"/dashboard/bookings",
    )
    db.add(notif)
    db.commit()
    db.refresh(booking)

    return {
        "success": True,
        "message": "Payment verified and booking confirmed successfully",
        "booking_number": booking.booking_number,
        "booking_id": booking.id,
        "payment_number": payment_number,
        "amount_paid": token_amount,
        "transaction_reference": razorpay_payment_id,
        "mode": "live",
        "status": booking.status,
    }


@router.post("/webhook/razorpay")
async def razorpay_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Official Razorpay Webhook Handler.
    Verifies X-Razorpay-Signature against RAZORPAY_WEBHOOK_SECRET.
    Processes 'payment.captured' and 'order.paid' events idempotently.
    Prevents duplicate payment records, double booking confirmations, and duplicate commission payouts.
    """
    from server.config.settings import settings
    import json

    if not settings.RAZORPAY_WEBHOOK_SECRET:
        raise HTTPException(status_code=400, detail="Razorpay webhook secret is not configured.")

    webhook_signature = request.headers.get("X-Razorpay-Signature")
    if not webhook_signature:
        raise HTTPException(status_code=400, detail="Missing X-Razorpay-Signature header")

    body_bytes = await request.body()

    expected_signature = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
        body_bytes,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, webhook_signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        payload = json.loads(body_bytes.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event = payload.get("event")
    if event in ("payment.captured", "order.paid"):
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        notes = payment_entity.get("notes", {})
        booking_id_str = notes.get("booking_id")
        payment_id = payment_entity.get("id")
        amount_paise = payment_entity.get("amount", 0)
        amount_inr = amount_paise / 100.0

        if booking_id_str and payment_id:
            try:
                booking_id = int(booking_id_str)
                booking = db.query(Booking).filter(Booking.id == booking_id).first()
                if booking:
                    # Idempotent check
                    existing_bp = db.query(BookingPayment).filter(
                        BookingPayment.transaction_reference == payment_id
                    ).first()

                    if not existing_bp:
                        payment_number = f"EFL-PAY-{uuid.uuid4().hex[:10].upper()}"
                        bp = BookingPayment(
                            booking_id=booking.id,
                            payment_number=payment_number,
                            payment_type=BookingPaymentType.TOKEN,
                            payment_mode=BookingPaymentMode.UPI,
                            status=BookingPaymentStatus.COMPLETED,
                            amount=amount_inr,
                            tax_amount=0.0,
                            penalty_amount=0.0,
                            total_paid=amount_inr,
                            transaction_reference=payment_id,
                            remarks=f"Webhook captured Razorpay payment | ID: {payment_id}",
                        )
                        db.add(bp)

                    if booking.status != BookingStatus.confirmed:
                        booking.status = BookingStatus.confirmed
                        booking.paid_amount = amount_inr
                        db.flush()

                        # Revenue engine (idempotent internally)
                        from server.services.revenue_service import auto_process_booking_revenue
                        prop = booking.property
                        booking_val = float(prop.price) if prop and prop.price else 10000000.0
                        prop_type = prop.property_type if prop else "apartment"
                        auto_process_booking_revenue(
                            db=db,
                            booking_id=booking.id,
                            booking_value=booking_val,
                            recipient_user_id=booking.customer_id,
                            property_type=prop_type,
                        )

                        if booking.customer_id:
                            notif = Notification(
                                user_id=booking.customer_id,
                                title="🎉 Payment Confirmed via Webhook",
                                message=f"Token payment of ₹{int(amount_inr):,} confirmed for Booking #{booking.booking_number}.",
                                type=NotificationType.booking_confirmed,
                                action_url="/dashboard/bookings",
                            )
                            db.add(notif)

                    db.commit()
            except Exception as ex:
                print(f"[Webhook Processing Error] {ex}")

    return {"status": "success", "event": event}

