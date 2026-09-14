"""
EstateFlow — Revenue Sharing Engine Models
==========================================
Handles: RevenueRule, CommissionRecord, Wallet, WalletTransaction,
         WithdrawalRequest, MonthlySettlement, RevenueShare
"""
import enum
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime,
    ForeignKey, UniqueConstraint, Float, Enum as SAEnum, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from server.config.database import Base


# ── Enumerations ──────────────────────────────────────────────────────────────

class CommissionType(str, enum.Enum):
    PERCENTAGE = "percentage"
    FLAT = "flat"


class CommissionRole(str, enum.Enum):
    BROKER = "broker"
    SALES_EXECUTIVE = "sales_executive"
    SALES_MANAGER = "sales_manager"
    CHANNEL_PARTNER = "channel_partner"
    REFERRAL = "referral"
    PLATFORM = "platform"


class WalletTransactionType(str, enum.Enum):
    CREDIT = "credit"
    DEBIT = "debit"
    HOLD = "hold"
    RELEASE = "release"
    SETTLEMENT = "settlement"
    REFUND = "refund"


class WalletTransactionStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REVERSED = "reversed"


class WithdrawalStatus(str, enum.Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    PROCESSED = "processed"
    FAILED = "failed"


class SettlementStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    PROCESSED = "processed"
    CANCELLED = "cancelled"


class CommissionStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PAID = "paid"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"


# ── Revenue Rule ──────────────────────────────────────────────────────────────

class RevenueRule(Base):
    """Configurable commission rule per role and optionally per property type."""
    __tablename__ = "revenue_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    role = Column(SAEnum(CommissionRole), nullable=False, index=True)
    commission_type = Column(SAEnum(CommissionType), nullable=False, default=CommissionType.PERCENTAGE)
    value = Column(Float, nullable=False)           # % or flat amount in INR
    min_booking_value = Column(Float, nullable=True)  # Rule applies only above this booking value
    max_commission_cap = Column(Float, nullable=True)  # Cap commission at this amount
    property_type = Column(String(100), nullable=True)  # Optional: filter by property type
    city = Column(String(100), nullable=True)          # Optional: city-specific rule
    priority = Column(Integer, default=1)              # Higher = takes precedence
    is_active = Column(Boolean, default=True)
    effective_from = Column(DateTime(timezone=True), nullable=True)
    effective_to = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(String(36), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    commissions = relationship("CommissionRecord", back_populates="rule")


# ── Commission Record ─────────────────────────────────────────────────────────

class CommissionRecord(Base):
    """Per-booking commission breakdown for each role."""
    __tablename__ = "commission_records"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True)
    rule_id = Column(Integer, ForeignKey("revenue_rules.id", ondelete="SET NULL"), nullable=True)
    role = Column(SAEnum(CommissionRole), nullable=False, index=True)
    recipient_user_id = Column(String(36), nullable=True)   # Who receives the commission
    recipient_name = Column(String(200), nullable=True)
    booking_value = Column(Float, nullable=False)
    commission_percentage = Column(Float, nullable=True)
    commission_amount = Column(Float, nullable=False)       # INR amount
    status = Column(SAEnum(CommissionStatus), nullable=False, default=CommissionStatus.PENDING, index=True)
    notes = Column(Text, nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    settlement_id = Column(Integer, ForeignKey("monthly_settlements.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    rule = relationship("RevenueRule", back_populates="commissions")
    settlement = relationship("MonthlySettlement", back_populates="commissions")


# ── Wallet ────────────────────────────────────────────────────────────────────

class Wallet(Base):
    """Per-user wallet holding earned commissions."""
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    balance = Column(Float, nullable=False, default=0.0)        # Available balance
    held_balance = Column(Float, nullable=False, default=0.0)   # On-hold (pending settlement)
    total_earned = Column(Float, nullable=False, default=0.0)
    total_withdrawn = Column(Float, nullable=False, default=0.0)
    currency = Column(String(10), nullable=False, default="INR")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    transactions = relationship("WalletTransaction", back_populates="wallet", order_by="WalletTransaction.created_at.desc()")
    withdrawal_requests = relationship("WithdrawalRequest", back_populates="wallet")


# ── Wallet Transaction ────────────────────────────────────────────────────────

class WalletTransaction(Base):
    """Immutable ledger entry for every wallet movement."""
    __tablename__ = "wallet_transactions"

    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_type = Column(SAEnum(WalletTransactionType), nullable=False)
    amount = Column(Float, nullable=False)
    balance_before = Column(Float, nullable=False)
    balance_after = Column(Float, nullable=False)
    status = Column(SAEnum(WalletTransactionStatus), nullable=False, default=WalletTransactionStatus.COMPLETED)
    reference_type = Column(String(100), nullable=True)   # e.g., "commission", "booking", "withdrawal"
    reference_id = Column(String(100), nullable=True)     # FK in string form for flexibility
    description = Column(Text, nullable=True)
    meta_data = Column(JSON, nullable=True)
    initiated_by = Column(String(36), nullable=True)      # Admin user_id
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    wallet = relationship("Wallet", back_populates="transactions")


# ── Withdrawal Request ────────────────────────────────────────────────────────

class WithdrawalRequest(Base):
    """User-initiated withdrawal request with approval workflow."""
    __tablename__ = "withdrawal_requests"

    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    status = Column(SAEnum(WithdrawalStatus), nullable=False, default=WithdrawalStatus.PENDING, index=True)
    # Bank details
    bank_name = Column(String(200), nullable=True)
    account_number = Column(String(50), nullable=True)
    ifsc_code = Column(String(20), nullable=True)
    account_holder_name = Column(String(200), nullable=True)
    upi_id = Column(String(200), nullable=True)
    # Processing
    rejection_reason = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)
    processed_by = Column(String(36), nullable=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    transaction_reference = Column(String(200), nullable=True)
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    wallet = relationship("Wallet", back_populates="withdrawal_requests")


# ── Monthly Settlement ────────────────────────────────────────────────────────

class MonthlySettlement(Base):
    """Monthly commission settlement batch."""
    __tablename__ = "monthly_settlements"

    id = Column(Integer, primary_key=True, index=True)
    settlement_month = Column(Integer, nullable=False)  # 1-12
    settlement_year = Column(Integer, nullable=False)
    total_commissions = Column(Float, nullable=False, default=0.0)
    total_paid = Column(Float, nullable=False, default=0.0)
    total_pending = Column(Float, nullable=False, default=0.0)
    num_records = Column(Integer, nullable=False, default=0)
    status = Column(SAEnum(SettlementStatus), nullable=False, default=SettlementStatus.DRAFT, index=True)
    notes = Column(Text, nullable=True)
    initiated_by = Column(String(36), nullable=True)
    approved_by = Column(String(36), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("settlement_month", "settlement_year", name="uq_settlement_month_year"),
    )

    # Relationships
    commissions = relationship("CommissionRecord", back_populates="settlement")


# ── Revenue Share ─────────────────────────────────────────────────────────────

class RevenueShare(Base):
    """Platform-level revenue sharing record (builder, platform, referral splits)."""
    __tablename__ = "revenue_shares"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True)
    total_booking_value = Column(Float, nullable=False)
    platform_share = Column(Float, nullable=False, default=0.0)
    builder_share = Column(Float, nullable=False, default=0.0)
    broker_share = Column(Float, nullable=False, default=0.0)
    sales_share = Column(Float, nullable=False, default=0.0)
    referral_share = Column(Float, nullable=False, default=0.0)
    other_share = Column(Float, nullable=False, default=0.0)
    breakdown = Column(JSON, nullable=True)    # Detailed per-role breakdown
    notes = Column(Text, nullable=True)
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
