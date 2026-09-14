"""
EstateFlow — Admin Revenue Sharing Engine Router
================================================
Provides full revenue management APIs: rules, commissions, wallets,
withdrawal workflow, settlements, and reporting.
"""
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from server.config.database import get_db
from server.core.dependencies import get_current_admin_user
from server.models.user import User
from server.models.admin import AdminUser
from server.models.revenue import (
    RevenueRule, CommissionRecord, Wallet, WalletTransaction,
    WithdrawalRequest, MonthlySettlement, RevenueShare,
    CommissionRole, CommissionType, CommissionStatus,
    WithdrawalStatus, SettlementStatus, WalletTransactionType, WalletTransactionStatus
)
from server.schemas.revenue import (
    RevenueRuleCreate, RevenueRuleUpdate, RevenueRuleOut,
    CommissionRecordOut, WalletOut, WalletSummaryOut, WalletTransactionOut,
    WithdrawalRequestOut, WithdrawalActionRequest,
    MonthlySettlementOut, SettlementCreate, RevenueDashboardKPIs
)

router = APIRouter(prefix="/api/admin/revenue", tags=["Admin Revenue"])


# ── Dashboard KPIs ────────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=RevenueDashboardKPIs)
def get_revenue_dashboard(
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    """High-level revenue KPIs for the admin dashboard."""
    total_commissions_paid = db.query(func.coalesce(func.sum(CommissionRecord.commission_amount), 0.0)).filter(
        CommissionRecord.status == CommissionStatus.PAID
    ).scalar() or 0.0

    pending_withdrawals_q = db.query(WithdrawalRequest).filter(
        WithdrawalRequest.status.in_([WithdrawalStatus.PENDING, WithdrawalStatus.UNDER_REVIEW])
    )
    pending_withdrawals_count = pending_withdrawals_q.count()
    pending_withdrawals_amount = db.query(func.coalesce(func.sum(WithdrawalRequest.amount), 0.0)).filter(
        WithdrawalRequest.status.in_([WithdrawalStatus.PENDING, WithdrawalStatus.UNDER_REVIEW])
    ).scalar() or 0.0

    active_wallets = db.query(func.count(Wallet.id)).filter(Wallet.is_active == True).scalar() or 0
    total_commission_records = db.query(func.count(CommissionRecord.id)).scalar() or 0
    pending_commissions = db.query(func.coalesce(func.sum(CommissionRecord.commission_amount), 0.0)).filter(
        CommissionRecord.status == CommissionStatus.PENDING
    ).scalar() or 0.0

    total_revenue_inr = db.query(func.coalesce(func.sum(RevenueShare.total_booking_value), 0.0)).scalar() or 0.0

    # Monthly commission trend (last 12 months using created_at year+month grouping)
    monthly_rows = db.query(
        func.strftime('%Y-%m', CommissionRecord.created_at).label("month"),
        func.sum(CommissionRecord.commission_amount).label("total")
    ).group_by("month").order_by("month").limit(12).all()

    monthly_trend = [{"month": r.month, "total": float(r.total or 0)} for r in monthly_rows]

    # Commission by role
    role_rows = db.query(
        CommissionRecord.role,
        func.sum(CommissionRecord.commission_amount).label("total")
    ).group_by(CommissionRecord.role).all()

    commission_by_role = [{"role": r.role.value, "total": float(r.total or 0)} for r in role_rows]

    return RevenueDashboardKPIs(
        total_revenue_inr=total_revenue_inr,
        total_commissions_paid=float(total_commissions_paid),
        pending_withdrawals_amount=float(pending_withdrawals_amount),
        pending_withdrawals_count=pending_withdrawals_count,
        active_wallets=active_wallets,
        total_commission_records=total_commission_records,
        pending_commissions=float(pending_commissions),
        monthly_trend=monthly_trend,
        commission_by_role=commission_by_role,
    )


# ── Commission Rules ──────────────────────────────────────────────────────────

@router.get("/rules", response_model=List[RevenueRuleOut])
def list_revenue_rules(
    role: Optional[CommissionRole] = None,
    is_active: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    """List all commission rules with optional filters."""
    q = db.query(RevenueRule)
    if role:
        q = q.filter(RevenueRule.role == role)
    if is_active is not None:
        q = q.filter(RevenueRule.is_active == is_active)
    return q.order_by(desc(RevenueRule.priority), desc(RevenueRule.created_at)).offset(skip).limit(limit).all()


@router.post("/rules", response_model=RevenueRuleOut, status_code=status.HTTP_201_CREATED)
def create_revenue_rule(
    data: RevenueRuleCreate,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    """Create a new commission rule."""
    user, _ = admin_ctx
    rule = RevenueRule(**data.model_dump(), created_by=str(user.id))
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.get("/rules/{rule_id}", response_model=RevenueRuleOut)
def get_revenue_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    rule = db.query(RevenueRule).filter(RevenueRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Revenue rule not found")
    return rule


@router.put("/rules/{rule_id}", response_model=RevenueRuleOut)
def update_revenue_rule(
    rule_id: int,
    data: RevenueRuleUpdate,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    """Update an existing commission rule."""
    rule = db.query(RevenueRule).filter(RevenueRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Revenue rule not found")
    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(rule, field, val)
    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_revenue_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    """Soft-delete by deactivating a commission rule."""
    rule = db.query(RevenueRule).filter(RevenueRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Revenue rule not found")
    rule.is_active = False
    db.commit()


# ── Commission Records ────────────────────────────────────────────────────────

@router.get("/commissions", response_model=List[CommissionRecordOut])
def list_commissions(
    role: Optional[CommissionRole] = None,
    commission_status: Optional[CommissionStatus] = None,
    booking_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    """List all commission records with filters."""
    q = db.query(CommissionRecord)
    if role:
        q = q.filter(CommissionRecord.role == role)
    if commission_status:
        q = q.filter(CommissionRecord.status == commission_status)
    if booking_id:
        q = q.filter(CommissionRecord.booking_id == booking_id)
    return q.order_by(desc(CommissionRecord.created_at)).offset(skip).limit(limit).all()


@router.post("/commissions/{booking_id}/calculate")
def calculate_commissions_for_booking(
    booking_id: int,
    booking_value: float = Query(..., gt=0, description="Total booking value in INR"),
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    """Auto-calculate and create commission records for a booking based on active rules."""
    existing = db.query(CommissionRecord).filter(CommissionRecord.booking_id == booking_id).count()
    if existing > 0:
        raise HTTPException(status_code=400, detail=f"Commissions already calculated for booking {booking_id}")

    active_rules = db.query(RevenueRule).filter(
        RevenueRule.is_active == True
    ).order_by(desc(RevenueRule.priority)).all()

    records_created = []
    for rule in active_rules:
        if rule.min_booking_value and booking_value < rule.min_booking_value:
            continue
        if rule.commission_type == CommissionType.PERCENTAGE:
            amount = booking_value * (rule.value / 100)
        else:
            amount = rule.value

        if rule.max_commission_cap:
            amount = min(amount, rule.max_commission_cap)

        record = CommissionRecord(
            booking_id=booking_id,
            rule_id=rule.id,
            role=rule.role,
            booking_value=booking_value,
            commission_percentage=rule.value if rule.commission_type == CommissionType.PERCENTAGE else None,
            commission_amount=amount,
            status=CommissionStatus.PENDING,
        )
        db.add(record)
        records_created.append({"role": rule.role.value, "amount": amount})

    db.commit()
    return {"success": True, "booking_id": booking_id, "commissions_created": records_created}


# ── Wallets ───────────────────────────────────────────────────────────────────

@router.get("/wallets", response_model=List[WalletSummaryOut])
def list_wallets(
    is_active: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    """List all user wallets."""
    q = db.query(Wallet)
    if is_active is not None:
        q = q.filter(Wallet.is_active == is_active)
    return q.order_by(desc(Wallet.total_earned)).offset(skip).limit(limit).all()


@router.get("/wallets/{user_id}", response_model=WalletOut)
def get_wallet_by_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    """Get a specific wallet with full transaction history."""
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found for this user")
    return wallet


# ── Withdrawal Requests ───────────────────────────────────────────────────────

@router.get("/withdrawals", response_model=List[WithdrawalRequestOut])
def list_withdrawals(
    withdrawal_status: Optional[WithdrawalStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    """List all withdrawal requests."""
    q = db.query(WithdrawalRequest)
    if withdrawal_status:
        q = q.filter(WithdrawalRequest.status == withdrawal_status)
    return q.order_by(desc(WithdrawalRequest.requested_at)).offset(skip).limit(limit).all()


@router.put("/withdrawals/{request_id}/approve", response_model=WithdrawalRequestOut)
def approve_withdrawal(
    request_id: int,
    data: WithdrawalActionRequest,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    """Approve a pending withdrawal request."""
    user, _ = admin_ctx
    req = db.query(WithdrawalRequest).filter(WithdrawalRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Withdrawal request not found")
    if req.status not in [WithdrawalStatus.PENDING, WithdrawalStatus.UNDER_REVIEW]:
        raise HTTPException(status_code=400, detail=f"Cannot approve request in status: {req.status.value}")

    req.status = WithdrawalStatus.APPROVED
    req.processed_by = str(user.id)
    req.processed_at = datetime.now(timezone.utc)
    req.admin_notes = data.admin_notes
    req.transaction_reference = data.transaction_reference

    # Debit wallet
    wallet = db.query(Wallet).filter(Wallet.id == req.wallet_id).first()
    if wallet and wallet.balance >= req.amount:
        balance_before = wallet.balance
        wallet.balance -= req.amount
        wallet.total_withdrawn += req.amount
        txn = WalletTransaction(
            wallet_id=wallet.id,
            transaction_type=WalletTransactionType.DEBIT,
            amount=req.amount,
            balance_before=balance_before,
            balance_after=wallet.balance,
            status=WalletTransactionStatus.COMPLETED,
            reference_type="withdrawal",
            reference_id=str(request_id),
            description=f"Withdrawal #{request_id} approved",
            initiated_by=str(user.id),
        )
        db.add(txn)
        req.status = WithdrawalStatus.PROCESSED

    db.commit()
    db.refresh(req)
    return req


@router.put("/withdrawals/{request_id}/reject", response_model=WithdrawalRequestOut)
def reject_withdrawal(
    request_id: int,
    data: WithdrawalActionRequest,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    """Reject a pending withdrawal request."""
    user, _ = admin_ctx
    req = db.query(WithdrawalRequest).filter(WithdrawalRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Withdrawal request not found")
    if req.status not in [WithdrawalStatus.PENDING, WithdrawalStatus.UNDER_REVIEW]:
        raise HTTPException(status_code=400, detail=f"Cannot reject request in status: {req.status.value}")

    req.status = WithdrawalStatus.REJECTED
    req.processed_by = str(user.id)
    req.processed_at = datetime.now(timezone.utc)
    req.rejection_reason = data.rejection_reason
    req.admin_notes = data.admin_notes
    db.commit()
    db.refresh(req)
    return req


# ── Monthly Settlements ───────────────────────────────────────────────────────

@router.get("/settlements", response_model=List[MonthlySettlementOut])
def list_settlements(
    settlement_status: Optional[SettlementStatus] = None,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    """List all monthly settlements."""
    q = db.query(MonthlySettlement)
    if settlement_status:
        q = q.filter(MonthlySettlement.status == settlement_status)
    return q.order_by(desc(MonthlySettlement.settlement_year), desc(MonthlySettlement.settlement_month)).all()


@router.post("/settlements", response_model=MonthlySettlementOut, status_code=status.HTTP_201_CREATED)
def create_settlement(
    data: SettlementCreate,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    """Trigger a new monthly settlement run."""
    user, _ = admin_ctx
    existing = db.query(MonthlySettlement).filter(
        MonthlySettlement.settlement_month == data.settlement_month,
        MonthlySettlement.settlement_year == data.settlement_year,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Settlement for {data.settlement_month}/{data.settlement_year} already exists")

    # Aggregate pending commissions for the period
    pending_records = db.query(CommissionRecord).filter(
        CommissionRecord.status == CommissionStatus.PENDING
    ).all()

    total_amount = sum(r.commission_amount for r in pending_records)
    settlement = MonthlySettlement(
        settlement_month=data.settlement_month,
        settlement_year=data.settlement_year,
        total_commissions=total_amount,
        total_paid=0.0,
        total_pending=total_amount,
        num_records=len(pending_records),
        status=SettlementStatus.DRAFT,
        notes=data.notes,
        initiated_by=str(user.id),
    )
    db.add(settlement)
    db.flush()

    for record in pending_records:
        record.settlement_id = settlement.id

    db.commit()
    db.refresh(settlement)
    return settlement


@router.put("/settlements/{settlement_id}/approve", response_model=MonthlySettlementOut)
def approve_settlement(
    settlement_id: int,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    """Approve and process a monthly settlement."""
    user, _ = admin_ctx
    settlement = db.query(MonthlySettlement).filter(MonthlySettlement.id == settlement_id).first()
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    if settlement.status not in [SettlementStatus.DRAFT, SettlementStatus.PENDING]:
        raise HTTPException(status_code=400, detail=f"Cannot approve settlement in status: {settlement.status.value}")

    settlement.status = SettlementStatus.APPROVED
    settlement.approved_by = str(user.id)
    settlement.approved_at = datetime.now(timezone.utc)

    # Mark associated commissions as confirmed
    db.query(CommissionRecord).filter(
        CommissionRecord.settlement_id == settlement_id,
        CommissionRecord.status == CommissionStatus.PENDING,
    ).update({"status": CommissionStatus.CONFIRMED})

    db.commit()
    db.refresh(settlement)
    return settlement


# ── Reports ───────────────────────────────────────────────────────────────────

@router.get("/reports")
def get_revenue_reports(
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    """Revenue reports — monthly totals by role and overall."""
    q = db.query(CommissionRecord)
    if year:
        q = q.filter(func.strftime('%Y', CommissionRecord.created_at) == str(year))

    total_by_role = db.query(
        CommissionRecord.role,
        func.sum(CommissionRecord.commission_amount).label("total"),
        func.count(CommissionRecord.id).label("count"),
    ).group_by(CommissionRecord.role).all()

    monthly_totals = db.query(
        func.strftime('%Y-%m', CommissionRecord.created_at).label("month"),
        func.sum(CommissionRecord.commission_amount).label("total"),
        func.count(CommissionRecord.id).label("count"),
    ).group_by("month").order_by("month").all()

    status_breakdown = db.query(
        CommissionRecord.status,
        func.sum(CommissionRecord.commission_amount).label("total"),
        func.count(CommissionRecord.id).label("count"),
    ).group_by(CommissionRecord.status).all()

    return {
        "by_role": [{"role": r.role.value, "total": float(r.total or 0), "count": r.count} for r in total_by_role],
        "monthly": [{"month": r.month, "total": float(r.total or 0), "count": r.count} for r in monthly_totals],
        "by_status": [{"status": r.status.value, "total": float(r.total or 0), "count": r.count} for r in status_breakdown],
    }
