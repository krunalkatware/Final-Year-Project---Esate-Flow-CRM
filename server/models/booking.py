import enum
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Text,
    Boolean, Enum as SQLEnum, JSON, Numeric
)
from sqlalchemy.orm import relationship, synonym
from server.config.database import Base


# ── Enums ───────────────────────────────────────────────────────────────────

class BookingStatus(str, enum.Enum):
    DRAFT = "draft"
    draft = "draft"
    REQUESTED = "requested"
    requested = "requested"
    PENDING = "pending"
    pending = "pending"
    PENDING_APPROVAL = "pending_approval"
    pending_approval = "pending_approval"
    APPROVED = "approved"
    approved = "approved"
    CONFIRMED = "confirmed"
    confirmed = "confirmed"
    AGREEMENT_GENERATED = "agreement_generated"
    agreement_generated = "agreement_generated"
    PAYMENT_PENDING = "payment_pending"
    payment_pending = "payment_pending"
    TOKEN_PAID = "token_paid"
    token_paid = "token_paid"
    INSTALLMENT_RUNNING = "installment_running"
    installment_running = "installment_running"
    COMPLETED = "completed"
    completed = "completed"
    REJECTED = "rejected"
    rejected = "rejected"
    CANCELLED = "cancelled"
    cancelled = "cancelled"
    REFUND_INITIATED = "refund_initiated"
    refund_initiated = "refund_initiated"
    REFUND_COMPLETED = "refund_completed"
    refund_completed = "refund_completed"
    EXPIRED = "expired"
    expired = "expired"


class BookingPaymentType(str, enum.Enum):
    TOKEN = "token"
    BOOKING_AMOUNT = "booking_amount"
    INSTALLMENT = "installment"
    PENALTY = "penalty"
    CUSTOM = "custom"


class BookingPaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class BookingPaymentMode(str, enum.Enum):
    NET_BANKING = "net_banking"
    UPI = "upi"
    CHEQUE = "cheque"
    CREDIT_CARD = "credit_card"
    BANK_TRANSFER = "bank_transfer"
    CASH = "cash"


class BookingInstallmentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    WAIVED = "waived"


class BookingRefundStatus(str, enum.Enum):
    REQUESTED = "requested"
    APPROVED = "approved"
    REJECTED = "rejected"
    PROCESSED = "processed"
    COMPLETED = "completed"


class BookingAgreementStatus(str, enum.Enum):
    DRAFT = "draft"
    GENERATED = "generated"
    SENT = "sent"
    SIGNED = "signed"
    CANCELLED = "cancelled"


# ── Models ──────────────────────────────────────────────────────────────────

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    booking_number = Column(String(50), unique=True, index=True, nullable=False)

    # Relationships / FKs
    customer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_id = synonym("customer_id")
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="RESTRICT"), nullable=False)
    builder_id = Column(Integer, ForeignKey("builders.id", ondelete="SET NULL"), nullable=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="SET NULL"), nullable=True)
    sales_executive_id = Column(Integer, ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True)

    # Customer & Direct Booking Details
    customer_name = Column(String(255), nullable=True)
    customer_email = Column(String(255), nullable=True)
    customer_phone = Column(String(50), nullable=True)
    customer_address = Column(Text, nullable=True)
    preferred_visit_date = Column(DateTime, nullable=True)
    visit_time_slot = Column(String(50), nullable=True)
    special_requirements = Column(Text, nullable=True)

    # Status & Workflow
    status = Column(SQLEnum(BookingStatus), default=BookingStatus.DRAFT, nullable=False, index=True)
    rejection_reason = Column(Text, nullable=True)
    cancellation_reason = Column(Text, nullable=True)

    # Unit Details & Unit Snapshot
    unit_number = Column(String(50), nullable=True)
    floor_number = Column(Integer, nullable=True)
    bhk_type = Column(String(20), nullable=True)
    super_builtup_area = Column(Float, nullable=True)
    carpet_area = Column(Float, nullable=True)

    # Pricing Breakdown
    base_price = Column(Float, nullable=False, default=0.0)
    floor_rise_charges = Column(Float, default=0.0)
    plc_charges = Column(Float, default=0.0)  # Preferential Location Charges
    parking_charges = Column(Float, default=0.0)
    club_membership_charges = Column(Float, default=0.0)
    other_charges = Column(Float, default=0.0)
    gross_total = Column(Float, nullable=False, default=0.0)

    # Discounts & Taxes
    discount_amount = Column(Float, default=0.0)
    discount_reason = Column(String(255), nullable=True)
    taxable_amount = Column(Float, nullable=False, default=0.0)
    gst_percentage = Column(Float, default=5.0)
    gst_amount = Column(Float, default=0.0)
    stamp_duty_amount = Column(Float, default=0.0)
    registration_charges = Column(Float, default=0.0)
    net_total = Column(Float, nullable=False, default=0.0)
    total_amount = synonym("net_total")

    # Financial & Commissions
    token_amount = Column(Float, default=0.0)
    booking_amount = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    remaining_amount = Column(Float, default=0.0)
    broker_commission_percentage = Column(Float, default=0.0)
    broker_commission_amount = Column(Float, default=0.0)
    builder_commission_percentage = Column(Float, default=0.0)
    builder_commission_amount = Column(Float, default=0.0)
    late_fee_charges = Column(Float, default=0.0)

    # Audit & Tracking
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True, index=True)

    # Relationships
    customer = relationship("User", foreign_keys=[customer_id], back_populates="bookings", lazy="joined")
    property = relationship("Property", foreign_keys=[property_id], lazy="joined")
    builder = relationship("Builder", foreign_keys=[builder_id], lazy="joined")
    lead = relationship("Lead", foreign_keys=[lead_id], lazy="select")
    sales_executive = relationship("AdminUser", foreign_keys=[sales_executive_id], lazy="joined")

    payments = relationship("BookingPayment", back_populates="booking", cascade="all, delete-orphan", order_by="BookingPayment.created_at.desc()")
    installments = relationship("BookingInstallment", back_populates="booking", cascade="all, delete-orphan", order_by="BookingInstallment.installment_number")
    documents = relationship("BookingDocument", back_populates="booking", cascade="all, delete-orphan")
    timeline = relationship("BookingTimeline", back_populates="booking", cascade="all, delete-orphan", order_by="BookingTimeline.created_at.desc()")
    audit_logs = relationship("BookingAudit", back_populates="booking", cascade="all, delete-orphan", order_by="BookingAudit.created_at.desc()")
    status_history = relationship("BookingStatusHistory", back_populates="booking", cascade="all, delete-orphan", order_by="BookingStatusHistory.created_at.desc()")
    refunds = relationship("BookingRefund", back_populates="booking", cascade="all, delete-orphan")
    cancellations = relationship("BookingCancellation", back_populates="booking", cascade="all, delete-orphan")
    agreements = relationship("BookingAgreement", back_populates="booking", cascade="all, delete-orphan")
    comments = relationship("BookingComment", back_populates="booking", cascade="all, delete-orphan", order_by="BookingComment.created_at.desc()")
    reminders = relationship("BookingReminder", back_populates="booking", cascade="all, delete-orphan")


class BookingPayment(Base):
    __tablename__ = "booking_payments"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    payment_number = Column(String(50), unique=True, index=True, nullable=False)

    payment_type = Column(SQLEnum(BookingPaymentType), default=BookingPaymentType.INSTALLMENT, nullable=False)
    payment_mode = Column(SQLEnum(BookingPaymentMode), default=BookingPaymentMode.NET_BANKING, nullable=False)
    status = Column(SQLEnum(BookingPaymentStatus), default=BookingPaymentStatus.PENDING, nullable=False)

    amount = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0.0)
    penalty_amount = Column(Float, default=0.0)
    total_paid = Column(Float, nullable=False)

    transaction_reference = Column(String(100), nullable=True)
    bank_name = Column(String(100), nullable=True)
    cheque_number = Column(String(50), nullable=True)
    payment_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    receipt_url = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)

    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    booking = relationship("Booking", back_populates="payments")


class BookingInstallment(Base):
    __tablename__ = "booking_installments"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)

    installment_number = Column(Integer, nullable=False)
    name = Column(String(100), nullable=False)  # e.g., "Token Amount", "1st Installment (Foundation)"
    percentage = Column(Float, default=0.0)
    due_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0.0)
    due_date = Column(DateTime, nullable=False)
    paid_date = Column(DateTime, nullable=True)
    status = Column(SQLEnum(BookingInstallmentStatus), default=BookingInstallmentStatus.PENDING, nullable=False)
    penalty_charges = Column(Float, default=0.0)

    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    booking = relationship("Booking", back_populates="installments")


class BookingDocument(Base):
    __tablename__ = "booking_documents"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="SET NULL"), nullable=True, index=True)

    document_type = Column(String(50), nullable=False)  # sale_agreement, booking_form, customer_kyc, pan, aadhaar, loan_doc, receipt, invoice, address_proof, income_proof, passport_photo
    title = Column(String(200), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_url = Column(Text, nullable=False)
    storage_path = Column(String(500), nullable=True)
    file_size_bytes = Column(Integer, default=0)
    mime_type = Column(String(100), default="application/pdf")
    version = Column(Integer, default=1)
    
    # Verification & Workflow
    status = Column(String(50), default="pending", nullable=False, index=True)  # 'pending', 'verified', 'rejected'
    is_verified = Column(Boolean, default=False)
    verification_notes = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    verified_by = Column(String(100), nullable=True)
    verified_at = Column(DateTime, nullable=True)

    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    booking = relationship("Booking", back_populates="documents")
    customer = relationship("User", foreign_keys=[customer_id], lazy="select")
    property = relationship("Property", foreign_keys=[property_id], lazy="select")



class BookingTimeline(Base):
    __tablename__ = "booking_timelines"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)

    event_type = Column(String(50), nullable=False)  # status_change, payment_received, document_uploaded, agreement_generated, comment_added
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    performed_by = Column(String(100), default="System")
    metadata_json = Column(JSON, nullable=True)

    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    booking = relationship("Booking", back_populates="timeline")


class BookingAudit(Base):
    __tablename__ = "booking_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)

    action = Column(String(50), nullable=False)  # create, update, delete, approve, reject, cancel, refund, payment, export
    field_name = Column(String(100), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(Text, nullable=True)

    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    booking = relationship("Booking", back_populates="audit_logs")


class BookingStatusHistory(Base):
    __tablename__ = "booking_status_histories"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)

    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    transition_reason = Column(Text, nullable=True)
    changed_by = Column(String(100), default="System")

    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    booking = relationship("Booking", back_populates="status_history")


class BookingRefund(Base):
    __tablename__ = "booking_refunds"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)

    refund_number = Column(String(50), unique=True, index=True, nullable=False)
    requested_amount = Column(Float, nullable=False)
    forfeiture_amount = Column(Float, default=0.0)
    approved_amount = Column(Float, nullable=False)
    status = Column(SQLEnum(BookingRefundStatus), default=BookingRefundStatus.REQUESTED, nullable=False)

    reason = Column(Text, nullable=False)
    payout_mode = Column(String(50), default="bank_transfer")
    payout_reference = Column(String(100), nullable=True)
    processed_at = Column(DateTime, nullable=True)
    remarks = Column(Text, nullable=True)

    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    booking = relationship("Booking", back_populates="refunds")


class BookingCancellation(Base):
    __tablename__ = "booking_cancellations"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)

    cancellation_number = Column(String(50), unique=True, index=True, nullable=False)
    reason_category = Column(String(100), nullable=False)  # buyer_request, loan_rejection, builder_delay, force_majeure
    detailed_reason = Column(Text, nullable=False)
    total_paid_so_far = Column(Float, default=0.0)
    cancellation_fee = Column(Float, default=0.0)
    refundable_amount = Column(Float, default=0.0)
    approved_by = Column(String(100), nullable=True)

    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    booking = relationship("Booking", back_populates="cancellations")


class BookingAgreement(Base):
    __tablename__ = "booking_agreements"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)

    agreement_number = Column(String(50), unique=True, index=True, nullable=False)
    version = Column(Integer, default=1)
    status = Column(SQLEnum(BookingAgreementStatus), default=BookingAgreementStatus.DRAFT, nullable=False)

    pdf_file_url = Column(Text, nullable=True)
    digital_signature_ready = Column(Boolean, default=True)
    customer_signed_at = Column(DateTime, nullable=True)
    builder_signed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    booking = relationship("Booking", back_populates="agreements")


class BookingComment(Base):
    __tablename__ = "booking_comments"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)

    author_name = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=True)

    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    booking = relationship("Booking", back_populates="comments")


class BookingReminder(Base):
    __tablename__ = "booking_reminders"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)

    title = Column(String(200), nullable=False)
    reminder_type = Column(String(50), default="payment_due")  # payment_due, agreement_signing, document_submission, follow_up
    due_date = Column(DateTime, nullable=False)
    is_completed = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)

    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    booking = relationship("Booking", back_populates="reminders")
