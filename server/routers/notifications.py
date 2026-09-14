from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from server.config.database import get_db
from server.core.dependencies import get_current_user
from server.models.user import User
from server.models.notification import Notification

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("")
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(desc(Notification.created_at))
        .limit(50)
        .all()
    )
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "action_url": n.action_url,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifications
    ]


@router.put("/{notification_id}/read")
def mark_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id, Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Marked as read"}


@router.get("/admin-feed")
def get_admin_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all platform lifecycle notifications for administrative oversight."""
    if current_user.role not in ["admin", "superadmin", "manager"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Administrative access required.")

    notifications = (
        db.query(Notification)
        .order_by(desc(Notification.created_at))
        .limit(100)
        .all()
    )
    return [
        {
            "id": n.id,
            "user_id": n.user_id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "action_url": n.action_url,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifications
    ]

