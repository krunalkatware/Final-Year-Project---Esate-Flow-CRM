"""
EstateFlow — Admin Audit Logs Router
====================================
Provides query, filtering, and export capabilities for security & compliance audit logs.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc
import csv
import io

from server.config.database import get_db
from server.core.dependencies import get_current_admin_user
from server.models.user import User
from server.models.admin import AdminUser
from server.models.audit_log import AuditLog

router = APIRouter(prefix="/api/admin/audit-logs", tags=["Admin Audit Logs"])


@router.get("")
def list_audit_logs(
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    user_email: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    """List system audit logs with optional filters."""
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action == action)
    if resource_type:
        q = q.filter(AuditLog.resource_type == resource_type)
    if user_email:
        q = q.filter(AuditLog.user_email.ilike(f"%{user_email}%"))

    total = q.count()
    items = q.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "user_email": log.user_email,
                "user_role": log.user_role,
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "details": log.details,
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in items
        ],
    }


@router.get("/export/csv")
def export_audit_logs_csv(
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    """Export all audit logs as a downloadable CSV file."""
    logs = db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(1000).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Timestamp", "User Email", "Role", "Action", "Resource Type", "Resource ID", "IP Address"])

    for log in logs:
        writer.writerow([
            log.id,
            log.created_at.isoformat() if log.created_at else "",
            log.user_email or "System",
            log.user_role or "N/A",
            log.action,
            log.resource_type or "",
            log.resource_id or "",
            log.ip_address or "",
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=estateflow_audit_logs.csv"},
    )
