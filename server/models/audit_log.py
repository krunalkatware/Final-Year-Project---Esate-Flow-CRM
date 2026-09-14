"""
EstateFlow — Enterprise Audit Logging System
============================================
Tracks every system action: Property Created, Booking Approved, Revenue Generated,
Withdrawal Approved, Role Changed, Login, Logout, Document Uploaded, Settings Changed.
"""
import enum
from typing import Optional, Any
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from server.config.database import Base


class AuditAction(str, enum.Enum):
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    PROPERTY_CREATED = "property_created"
    PROPERTY_UPDATED = "property_updated"
    PROPERTY_DELETED = "property_deleted"
    BUILDER_ONBOARDED = "builder_onboarded"
    LEAD_CREATED = "lead_created"
    LEAD_STATUS_CHANGED = "lead_status_changed"
    SITE_VISIT_SCHEDULED = "site_visit_scheduled"
    SITE_VISIT_COMPLETED = "site_visit_completed"
    BOOKING_CREATED = "booking_created"
    BOOKING_APPROVED = "booking_approved"
    BOOKING_CANCELLED = "booking_cancelled"
    REVENUE_RULE_CREATED = "revenue_rule_created"
    COMMISSION_CALCULATED = "commission_calculated"
    WITHDRAWAL_REQUESTED = "withdrawal_requested"
    WITHDRAWAL_APPROVED = "withdrawal_approved"
    WITHDRAWAL_REJECTED = "withdrawal_rejected"
    SETTLEMENT_PROCESSED = "settlement_processed"
    ROLE_CHANGED = "role_changed"
    DOCUMENT_UPLOADED = "document_uploaded"
    DOCUMENT_DELETED = "document_deleted"
    SETTINGS_CHANGED = "settings_changed"


class AuditLog(Base):
    """Immutable audit trail entry for security & compliance."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), nullable=True, index=True)
    user_email = Column(String(255), nullable=True, index=True)
    user_role = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(100), nullable=True, index=True)  # e.g. "booking", "property", "wallet"
    resource_id = Column(String(100), nullable=True, index=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


def create_audit_entry(
    db,
    action: str,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    user_role: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    details: Optional[dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> AuditLog:
    """Utility helper to record an audit log entry."""
    entry = AuditLog(
        user_id=user_id,
        user_email=user_email,
        user_role=user_role,
        action=action if isinstance(action, str) else action.value,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id is not None else None,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(entry)
    db.commit()
    return entry
