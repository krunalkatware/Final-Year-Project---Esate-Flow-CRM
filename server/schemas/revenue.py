"""
EstateFlow — Revenue Sharing Engine Pydantic Schemas
=====================================================
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from server.models.revenue import (
    CommissionType, CommissionRole, WalletTransactionType,
    WalletTransactionStatus, WithdrawalStatus, SettlementStatus, CommissionStatus
)


# ── Revenue Rule ──────────────────────────────────────────────────────────────

class RevenueRuleCreate(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    role: CommissionRole
    commission_type: CommissionType = CommissionType.PERCENTAGE
    value: float = Field(..., gt=0)
    min_booking_value: Optional[float] = None
    max_commission_cap: Optional[float] = None
    property_type: Optional[str] = None
    city: Optional[str] = None
    priority: int = 1
    is_active: bool = True
    effective_from: Optional[datetime] = None
    effective_to: Optional[datetime] = None


class RevenueRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    commission_type: Optional[CommissionType] = None
    value: Optional[float] = None
    min_booking_value: Optional[float] = None
    max_commission_cap: Optional[float] = None
    property_type: Optional[str] = None
    city: Optional[str] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None
    effective_from: Optional[datetime] = None
    effective_to: Optional[datetime] = None


class RevenueRuleOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    role: CommissionRole
    commission_type: CommissionType
    value: float
    min_booking_value: Optional[float] = None
    max_commission_cap: Optional[float] = None
    property_type: Optional[str] = None
    city: Optional[str] = None
    priority: int
    is_active: bool
    effective_from: Optional[datetime] = None
    effective_to: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Commission Record ─────────────────────────────────────────────────────────

class CommissionRecordOut(BaseModel):
    id: int
    booking_id: Optional[int] = None
    rule_id: Optional[int] = None
    role: CommissionRole
    recipient_user_id: Optional[str] = None
    recipient_name: Optional[str] = None
    booking_value: float
    commission_percentage: Optional[float] = None
    commission_amount: float
    status: CommissionStatus
    notes: Optional[str] = None
    paid_at: Optional[datetime] = None
    settlement_id: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Wallet ────────────────────────────────────────────────────────────────────

class WalletTransactionOut(BaseModel):
    id: int
    wallet_id: int
    transaction_type: WalletTransactionType
    amount: float
    balance_before: float
    balance_after: float
    status: WalletTransactionStatus
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    description: Optional[str] = None
    initiated_by: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class WalletOut(BaseModel):
    id: int
    user_id: str
    balance: float
    held_balance: float
    total_earned: float
    total_withdrawn: float
    currency: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    transactions: List[WalletTransactionOut] = []

    model_config = {"from_attributes": True}


class WalletSummaryOut(BaseModel):
    id: int
    user_id: str
    balance: float
    held_balance: float
    total_earned: float
    total_withdrawn: float
    currency: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Withdrawal Request ────────────────────────────────────────────────────────

class WithdrawalRequestCreate(BaseModel):
    wallet_id: int
    amount: float = Field(..., gt=0)
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    account_holder_name: Optional[str] = None
    upi_id: Optional[str] = None


class WithdrawalRequestOut(BaseModel):
    id: int
    wallet_id: int
    user_id: str
    amount: float
    status: WithdrawalStatus
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    account_holder_name: Optional[str] = None
    upi_id: Optional[str] = None
    rejection_reason: Optional[str] = None
    admin_notes: Optional[str] = None
    processed_by: Optional[str] = None
    processed_at: Optional[datetime] = None
    transaction_reference: Optional[str] = None
    requested_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class WithdrawalActionRequest(BaseModel):
    admin_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    transaction_reference: Optional[str] = None


# ── Monthly Settlement ────────────────────────────────────────────────────────

class SettlementCreate(BaseModel):
    settlement_month: int = Field(..., ge=1, le=12)
    settlement_year: int = Field(..., ge=2020, le=2100)
    notes: Optional[str] = None


class MonthlySettlementOut(BaseModel):
    id: int
    settlement_month: int
    settlement_year: int
    total_commissions: float
    total_paid: float
    total_pending: float
    num_records: int
    status: SettlementStatus
    notes: Optional[str] = None
    initiated_by: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Dashboard KPIs ────────────────────────────────────────────────────────────

class RevenueDashboardKPIs(BaseModel):
    total_revenue_inr: float
    total_commissions_paid: float
    pending_withdrawals_amount: float
    pending_withdrawals_count: int
    active_wallets: int
    total_commission_records: int
    pending_commissions: float
    monthly_trend: List[dict] = []
    commission_by_role: List[dict] = []
