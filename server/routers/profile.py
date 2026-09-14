from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from server.config.database import get_db
from server.core.dependencies import get_current_user
from server.models.user import User
from server.models.customer import Customer
from server.repositories.user_repo import UserRepository
from server.core.security import verify_password, get_password_hash
from server.schemas.user import ProfileUpdate, ChangePasswordRequest

router = APIRouter(prefix="/api/profile", tags=["Profile"])


def _serialize_profile(user: User, db: Session = None) -> dict:
    customer = user.customer
    from server.models.booking import Booking, BookingDocument, BookingPayment
    from server.models.site_visit import SiteVisit
    from server.models.lead import Lead
    from server.models.review import Review
    from sqlalchemy import func, or_

    total_bookings = 0
    total_visits = 0
    total_docs = 0
    total_paid = 0.0
    total_leads = 0
    total_reviews = 0
    documents_list = []

    if db:
        total_bookings = db.query(func.count(Booking.id)).filter(Booking.customer_id == user.id).scalar() or 0
        total_visits = db.query(func.count(SiteVisit.id)).filter(SiteVisit.customer_id == user.id).scalar() or 0
        total_leads = db.query(func.count(Lead.id)).filter(Lead.customer_id == user.id).scalar() or 0
        total_reviews = db.query(func.count(Review.id)).filter(Review.user_id == user.id).scalar() or 0
        
        docs = db.query(BookingDocument).filter(
            or_(
                BookingDocument.customer_id == user.id,
                BookingDocument.booking_id.in_(db.query(Booking.id).filter(Booking.customer_id == user.id))
            )
        ).all()
        total_docs = len(docs)
        documents_list = [
            {
                "id": d.id,
                "title": d.title,
                "document_type": d.document_type,
                "file_name": d.file_name,
                "file_url": d.file_url,
                "status": d.status,
                "is_verified": d.is_verified,
                "rejection_reason": d.rejection_reason,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in docs
        ]

        total_paid = db.query(func.coalesce(func.sum(BookingPayment.amount), 0.0)).filter(
            BookingPayment.booking_id.in_(db.query(Booking.id).filter(Booking.customer_id == user.id))
        ).scalar() or 0.0

    return {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "first_name": customer.first_name if customer else (user.full_name.split(' ')[0] if user.full_name else ""),
        "last_name": customer.last_name if customer else (user.full_name.split(' ', 1)[1] if user.full_name and ' ' in user.full_name else ""),
        "phone": customer.phone if customer else user.phone,
        "date_of_birth": customer.date_of_birth.isoformat() if customer and customer.date_of_birth else None,
        "avatar_url": customer.avatar_url if customer else user.avatar_url,
        "address": customer.address if customer else None,
        "city": customer.city if customer else None,
        "state": customer.state if customer else None,
        "pincode": customer.pincode if customer else None,
        "preferred_cities": customer.preferred_cities if customer else None,
        "preferred_budget_min": customer.preferred_budget_min if customer else None,
        "preferred_budget_max": customer.preferred_budget_max if customer else None,
        "preferred_property_type": customer.preferred_property_type if customer else None,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "stats": {
            "total_bookings": total_bookings,
            "total_site_visits": total_visits,
            "total_leads": total_leads,
            "total_documents": total_docs,
            "total_reviews": total_reviews,
            "total_paid": float(total_paid),
        },
        "documents": documents_list,
    }


@router.get("")
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _serialize_profile(current_user, db)



@router.put("")
def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = UserRepository(db)
    customer = current_user.customer
    if not customer:
        raise HTTPException(status_code=404, detail="Customer profile not found")
    update_data = data.model_dump(exclude_unset=True, exclude_none=True)
    repo.update_customer(customer, update_data)
    db.commit()
    db.refresh(current_user)
    return _serialize_profile(current_user)


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
