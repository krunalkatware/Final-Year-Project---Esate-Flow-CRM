"""
EstateFlow — Customer Investment Router
========================================
Customer portal endpoints for tracking holdings, investment portfolio, ROI calculator.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from server.config.database import get_db
from server.core.dependencies import get_current_user
from server.models.user import User
from server.models.investment import Investment, InvestmentReturn, PortfolioHolding, InvestmentStatus, InvestmentType
from server.schemas.investment import (
    InvestmentOut, InvestmentCreate, PortfolioHoldingOut,
    ROICalculatorRequest, ROICalculatorResponse, InvestmentDashboardOut
)

router = APIRouter(prefix="/api/investments", tags=["Customer Investments"])


@router.get("/my", response_model=List[InvestmentOut])
def get_my_investments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch current user's investments list."""
    return db.query(Investment).filter(
        Investment.user_id == current_user.id
    ).order_by(desc(Investment.created_at)).all()


@router.get("/portfolio", response_model=InvestmentDashboardOut)
def get_portfolio_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Summary of user's investment portfolio."""
    investments = db.query(Investment).filter(Investment.user_id == current_user.id).all()
    
    total_invested = sum(i.investment_amount for i in investments)
    total_current_value = sum(i.current_value or i.investment_amount for i in investments)
    total_returns_earned = sum(i.actual_total_return for i in investments)
    num_active = sum(1 for i in investments if i.status == InvestmentStatus.ACTIVE)
    num_props = len(set(i.property_id for i in investments if i.property_id))

    roi_pct = 0.0
    if total_invested > 0:
        roi_pct = round(((total_current_value + total_returns_earned - total_invested) / total_invested) * 100, 2)

    monthly_returns = [
        {"month": "Jan", "amount": total_returns_earned * 0.1},
        {"month": "Feb", "amount": total_returns_earned * 0.15},
        {"month": "Mar", "amount": total_returns_earned * 0.2},
        {"month": "Apr", "amount": total_returns_earned * 0.25},
        {"month": "May", "amount": total_returns_earned * 0.3},
    ]

    return InvestmentDashboardOut(
        total_invested=total_invested,
        total_current_value=total_current_value,
        total_returns_earned=total_returns_earned,
        portfolio_roi_percentage=roi_pct,
        num_active_investments=num_active,
        num_properties=num_props,
        investments=investments,
        monthly_returns=monthly_returns,
    )


@router.post("/create", response_model=InvestmentOut, status_code=status.HTTP_201_CREATED)
def create_investment(
    data: InvestmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new investment entry for current user."""
    inv = Investment(
        user_id=current_user.id,
        property_id=data.property_id,
        booking_id=data.booking_id,
        investment_type=data.investment_type,
        status=InvestmentStatus.ACTIVE,
        investment_amount=data.investment_amount,
        ownership_percentage=data.ownership_percentage,
        expected_roi_percentage=data.expected_roi_percentage or 12.5,
        expected_monthly_return=data.expected_monthly_return or (data.investment_amount * 0.125 / 12),
        current_value=data.current_value or data.investment_amount,
        maturity_date=data.maturity_date,
        lock_in_period_months=data.lock_in_period_months or 36,
        property_name=data.property_name or "Premium Estate Holding",
        property_location=data.property_location or "Prime Metropolitan Area",
        notes=data.notes,
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv


@router.post("/roi-calculator", response_model=ROICalculatorResponse)
def calculate_roi(data: ROICalculatorRequest):
    """Calculate returns projection based on principal amount, ROI %, and horizon."""
    principal = data.investment_amount
    annual_rate = data.expected_roi_percentage / 100.0
    months = data.lock_in_period_months

    monthly_return = (principal * annual_rate) / 12.0
    total_return = monthly_return * months
    total_value = principal + total_return

    return ROICalculatorResponse(
        investment_amount=principal,
        expected_roi_percentage=data.expected_roi_percentage,
        lock_in_period_months=months,
        projected_monthly_return=round(monthly_return, 2),
        projected_total_return=round(total_return, 2),
        projected_total_value=round(total_value, 2),
        year_1_return=round(principal * annual_rate * 1, 2),
        year_3_return=round(principal * annual_rate * 3, 2),
        year_5_return=round(principal * annual_rate * 5, 2),
    )
