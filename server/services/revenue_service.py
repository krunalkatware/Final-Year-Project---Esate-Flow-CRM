"""
EstateFlow — Revenue Service & Automated Commission Engine
============================================================
Automates the calculation, wallet crediting, ledger generation, and
notification dispatch when bookings transition to confirmed/completed.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc
from server.models.revenue import (
    RevenueRule, CommissionRecord, Wallet, WalletTransaction,
    RevenueShare, CommissionRole, CommissionType, CommissionStatus,
    WalletTransactionType, WalletTransactionStatus
)
from server.models.notification import Notification, NotificationType


def auto_process_booking_revenue(
    db: Session,
    booking_id: int,
    booking_value: float,
    recipient_user_id: Optional[str] = None,
    property_type: Optional[str] = None,
) -> List[dict]:
    """
    Automated Revenue Workflow:
    1. Checks if commissions were already calculated for this booking_id.
    2. Queries active RevenueRules matching criteria.
    3. Calculates percentage/flat commission (with optional caps).
    4. Creates CommissionRecord entries.
    5. Credits Partner Wallet and creates immutable WalletTransaction ledger.
    6. Generates in-app notifications for partner.
    """
    existing_count = db.query(CommissionRecord).filter(CommissionRecord.booking_id == booking_id).count()
    if existing_count > 0:
        # Already calculated
        return []

    rules = (
        db.query(RevenueRule)
        .filter(RevenueRule.is_active == True)
        .order_by(desc(RevenueRule.priority))
        .all()
    )

    created_records = []
    for rule in rules:
        if rule.min_booking_value and booking_value < rule.min_booking_value:
            continue
        if rule.property_type and property_type and rule.property_type.lower() != property_type.lower():
            continue

        if rule.commission_type == CommissionType.PERCENTAGE:
            raw_amt = booking_value * (rule.value / 100.0)
        else:
            raw_amt = rule.value

        if rule.max_commission_cap:
            raw_amt = min(raw_amt, rule.max_commission_cap)

        comm_record = CommissionRecord(
            booking_id=booking_id,
            rule_id=rule.id,
            role=rule.role,
            recipient_user_id=recipient_user_id,
            booking_value=booking_value,
            commission_percentage=rule.value if rule.commission_type == CommissionType.PERCENTAGE else None,
            commission_amount=raw_amt,
            status=CommissionStatus.CONFIRMED,
            notes=f"Auto-calculated on booking confirmation (Rule: {rule.name})",
        )
        db.add(comm_record)
        db.flush()

        created_records.append({
            "record_id": comm_record.id,
            "role": rule.role.value,
            "amount": raw_amt,
        })

        # Wallet Crediting
        if recipient_user_id:
            wallet = db.query(Wallet).filter(Wallet.user_id == recipient_user_id).first()
            if not wallet:
                wallet = Wallet(user_id=recipient_user_id, balance=0.0, total_earned=0.0, currency="INR")
                db.add(wallet)
                db.flush()

            bal_before = wallet.balance
            wallet.balance += raw_amt
            wallet.total_earned += raw_amt
            bal_after = wallet.balance

            # Wallet Ledger Entry
            ledger_entry = WalletTransaction(
                wallet_id=wallet.id,
                transaction_type=WalletTransactionType.CREDIT,
                amount=raw_amt,
                balance_before=bal_before,
                balance_after=bal_after,
                status=WalletTransactionStatus.COMPLETED,
                reference_type="booking_commission",
                reference_id=str(booking_id),
                description=f"Commission credited for Booking #{booking_id} ({rule.role.value})",
            )
            db.add(ledger_entry)

            # In-App Notification
            noti = Notification(
                user_id=recipient_user_id,
                type=NotificationType.booking_confirmed,
                title="Commission Credited!",
                message=f"₹{raw_amt:,.2f} commission credited to your wallet for Booking #{booking_id}.",
                action_url="/dashboard/wallet",
            )
            db.add(noti)

    # Record RevenueShare summary entry
    rshare = db.query(RevenueShare).filter(RevenueShare.booking_id == booking_id).first()
    if not rshare:
        total_comm = sum(r["amount"] for r in created_records)
        rshare = RevenueShare(
            booking_id=booking_id,
            total_booking_value=booking_value,
            platform_share=round(total_comm * 0.20, 2),
            broker_share=round(total_comm * 0.50, 2),
            builder_share=round(booking_value - total_comm, 2),
            sales_share=round(total_comm * 0.20, 2),
            referral_share=round(total_comm * 0.10, 2),
            other_share=0.0,
            notes=f"Auto-computed from {len(created_records)} commission rule(s) on booking #{booking_id}",
        )
        db.add(rshare)


    db.commit()
    return created_records
