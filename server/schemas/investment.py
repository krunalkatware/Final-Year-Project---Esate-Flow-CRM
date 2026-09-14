"""
EstateFlow — Investment Platform Pydantic Schemas
=================================================
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from server.models.investment import InvestmentStatus, InvestmentType, ReturnType


# ── Investment ────────────────────────────────────────────────────────────────

class InvestmentCreate(BaseModel):
    property_id: Optional[int] = None
    booking_id: Optional[int] = None
    investment_type: InvestmentType = InvestmentType.DIRECT
    investment_amount: float = Field(..., gt=0)
    ownership_percentage: Optional[float] = None
    expected_roi_percentage: Optional[float] = None
    expected_monthly_return: Optional[float] = None
    current_value: Optional[float] = None
    maturity_date: Optional[datetime] = None
    lock_in_period_months: Optional[int] = None
    property_name: Optional[str] = None
    property_location: Optional[str] = None
    notes: Optional[str] = None


class InvestmentReturnOut(BaseModel):
    id: int
    investment_id: int
    return_type: ReturnType
    period_month: Optional[int] = None
    period_year: Optional[int] = None
    amount: float
    is_paid: bool
    paid_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class InvestmentOut(BaseModel):
    id: int
    user_id: str
    property_id: Optional[int] = None
    booking_id: Optional[int] = None
    investment_type: InvestmentType
    status: InvestmentStatus
    investment_amount: float
    ownership_percentage: Optional[float] = None
    expected_roi_percentage: Optional[float] = None
    expected_monthly_return: Optional[float] = None
    actual_total_return: float
    current_value: Optional[float] = None
    investment_date: datetime
    maturity_date: Optional[datetime] = None
    lock_in_period_months: Optional[int] = None
    property_name: Optional[str] = None
    property_location: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    returns: List[InvestmentReturnOut] = []

    model_config = {"from_attributes": True}


# ── Portfolio ─────────────────────────────────────────────────────────────────

class PortfolioHoldingOut(BaseModel):
    id: int
    user_id: str
    total_invested: float
    total_current_value: float
    total_returns_earned: float
    num_properties: int
    num_active_investments: int
    best_performing_property_id: Optional[int] = None
    portfolio_roi_percentage: Optional[float] = None
    last_calculated_at: datetime

    model_config = {"from_attributes": True}


# ── ROI Calculator ────────────────────────────────────────────────────────────

class ROICalculatorRequest(BaseModel):
    investment_amount: float = Field(..., gt=0, description="Amount in INR")
    investment_type: InvestmentType = InvestmentType.DIRECT
    expected_roi_percentage: float = Field(..., gt=0, le=100, description="Annual ROI %")
    lock_in_period_months: int = Field(..., ge=1, le=360)


class ROICalculatorResponse(BaseModel):
    investment_amount: float
    expected_roi_percentage: float
    lock_in_period_months: int
    projected_monthly_return: float
    projected_total_return: float
    projected_total_value: float
    year_1_return: float
    year_3_return: float
    year_5_return: float


# ── Dashboard ─────────────────────────────────────────────────────────────────

class InvestmentDashboardOut(BaseModel):
    total_invested: float
    total_current_value: float
    total_returns_earned: float
    portfolio_roi_percentage: float
    num_active_investments: int
    num_properties: int
    investments: List[InvestmentOut] = []
    monthly_returns: List[dict] = []
