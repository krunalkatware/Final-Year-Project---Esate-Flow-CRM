"""
EstateFlow — Investment Platform Models
=======================================
Handles: Investment, InvestmentReturn, PortfolioHolding
"""
import enum
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime,
    ForeignKey, Float, Enum as SAEnum, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from server.config.database import Base


# ── Enumerations ──────────────────────────────────────────────────────────────

class InvestmentStatus(str, enum.Enum):
    ACTIVE = "active"
    MATURED = "matured"
    WITHDRAWN = "withdrawn"
    CANCELLED = "cancelled"
    PENDING = "pending"


class InvestmentType(str, enum.Enum):
    DIRECT = "direct"           # Direct property purchase
    FRACTIONAL = "fractional"   # Fractional ownership
    PRE_LAUNCH = "pre_launch"   # Pre-launch investment
    RENTAL_YIELD = "rental_yield"  # Rental income sharing
    FLIP = "flip"               # Buy & flip strategy


class ReturnType(str, enum.Enum):
    RENTAL_INCOME = "rental_income"
    CAPITAL_APPRECIATION = "capital_appreciation"
    DIVIDEND = "dividend"
    INTEREST = "interest"
    BONUS = "bonus"


# ── Investment ────────────────────────────────────────────────────────────────

class Investment(Base):
    """A customer's investment in a property."""
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="SET NULL"), nullable=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True)

    investment_type = Column(SAEnum(InvestmentType), nullable=False, default=InvestmentType.DIRECT)
    status = Column(SAEnum(InvestmentStatus), nullable=False, default=InvestmentStatus.PENDING, index=True)

    # Financial details
    investment_amount = Column(Float, nullable=False)       # INR
    ownership_percentage = Column(Float, nullable=True)     # For fractional investments
    expected_roi_percentage = Column(Float, nullable=True)  # Annual %
    expected_monthly_return = Column(Float, nullable=True)  # INR per month
    actual_total_return = Column(Float, nullable=False, default=0.0)
    current_value = Column(Float, nullable=True)            # Current market value

    # Timeline
    investment_date = Column(DateTime(timezone=True), server_default=func.now())
    maturity_date = Column(DateTime(timezone=True), nullable=True)
    lock_in_period_months = Column(Integer, nullable=True)

    # Metadata
    property_name = Column(String(500), nullable=True)      # Snapshot at time of investment
    property_location = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    returns = relationship("InvestmentReturn", back_populates="investment", order_by="InvestmentReturn.created_at.desc()")


# ── Investment Return ─────────────────────────────────────────────────────────

class InvestmentReturn(Base):
    """Monthly / periodic return records for an investment."""
    __tablename__ = "investment_returns"

    id = Column(Integer, primary_key=True, index=True)
    investment_id = Column(Integer, ForeignKey("investments.id", ondelete="CASCADE"), nullable=False, index=True)
    return_type = Column(SAEnum(ReturnType), nullable=False)
    period_month = Column(Integer, nullable=True)   # 1-12
    period_year = Column(Integer, nullable=True)
    amount = Column(Float, nullable=False)
    is_paid = Column(Boolean, default=False)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    investment = relationship("Investment", back_populates="returns")


# ── Portfolio Holding ─────────────────────────────────────────────────────────

class PortfolioHolding(Base):
    """Aggregated portfolio snapshot per user (denormalized for performance)."""
    __tablename__ = "portfolio_holdings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    total_invested = Column(Float, nullable=False, default=0.0)
    total_current_value = Column(Float, nullable=False, default=0.0)
    total_returns_earned = Column(Float, nullable=False, default=0.0)
    num_properties = Column(Integer, nullable=False, default=0)
    num_active_investments = Column(Integer, nullable=False, default=0)
    best_performing_property_id = Column(Integer, nullable=True)
    portfolio_roi_percentage = Column(Float, nullable=True)
    last_calculated_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
