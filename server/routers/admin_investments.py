"""
EstateFlow — Admin Investment Platform Router
=============================================
Provides admin management APIs for property investments.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from server.config.database import get_db
from server.core.dependencies import get_current_admin_user
from server.models.user import User
from server.models.admin import AdminUser
from server.models.investment import Investment, InvestmentReturn, PortfolioHolding, InvestmentStatus, InvestmentType, ReturnType
from server.schemas.investment import InvestmentOut, InvestmentCreate, InvestmentReturnOut, PortfolioHoldingOut

router = APIRouter(prefix="/api/admin/investments", tags=["Admin Investments"])


@router.get("", response_model=List[InvestmentOut])
def list_all_investments(
    status: Optional[InvestmentStatus] = None,
    investment_type: Optional[InvestmentType] = None,
    user_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    """List all property investments in the system."""
    q = db.query(Investment)
    if status:
        q = q.filter(Investment.status == status)
    if investment_type:
        q = q.filter(Investment.investment_type == investment_type)
    if user_id:
        q = q.filter(Investment.user_id == user_id)
    return q.order_by(desc(Investment.created_at)).offset(skip).limit(limit).all()


@router.get("/summary")
def get_investment_summary(
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    """High-level summary of total platform investments and returns."""
    total_invested = db.query(func.coalesce(func.sum(Investment.investment_amount), 0.0)).scalar() or 0.0
    total_returns_paid = db.query(func.coalesce(func.sum(InvestmentReturn.amount), 0.0)).filter(
        InvestmentReturn.is_paid == True
    ).scalar() or 0.0
    active_count = db.query(func.count(Investment.id)).filter(
        Investment.status == InvestmentStatus.ACTIVE
    ).scalar() or 0
    total_count = db.query(func.count(Investment.id)).scalar() or 0

    return {
        "total_invested_inr": float(total_invested),
        "total_returns_paid_inr": float(total_returns_paid),
        "active_investments_count": active_count,
        "total_investments_count": total_count,
    }


@router.post("/returns", response_model=InvestmentReturnOut, status_code=status.HTTP_201_CREATED)
def record_investment_return(
    investment_id: int,
    amount: float,
    return_type: ReturnType = ReturnType.RENTAL_INCOME,
    period_month: Optional[int] = None,
    period_year: Optional[int] = None,
    notes: Optional[str] = None,
    is_paid: bool = True,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    """Record a payout/return for a specific investment."""
    inv = db.query(Investment).filter(Investment.id == investment_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investment record not found")

    ret = InvestmentReturn(
        investment_id=investment_id,
        return_type=return_type,
        period_month=period_month,
        period_year=period_year,
        amount=amount,
        is_paid=is_paid,
        notes=notes,
    )
    if is_paid:
        inv.actual_total_return += amount

    db.add(ret)
    db.commit()
    db.refresh(ret)
    return ret
