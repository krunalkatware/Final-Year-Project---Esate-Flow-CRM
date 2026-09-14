from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, or_, and_
from typing import Optional, List

from server.config.database import get_db
from server.core.dependencies import get_current_user, get_current_user_optional
from server.models.user import User
from server.models.customer import Customer
from server.models.property import Property
from server.models.builder import Builder
from server.models.booking import Booking
from server.models.site_visit import SiteVisit
from server.models.notification import Notification, NotificationType
from server.models.review import (
    Review, ReviewReply, ReviewReaction, ReviewReport, ReviewAttachment,
    ReviewStatus, SentimentLabel, ReportReason
)
from server.schemas.review import (
    ReviewCreate, ReviewOut, ReviewReportCreate, ReviewReactionCreate
)
from server.services.review_service import (
    analyze_sentiment, detect_spam, recalculate_property_rating,
    recalculate_builder_rating, log_review_audit
)

router = APIRouter(prefix="/api/reviews", tags=["Customer Reviews"])


@router.post("", summary="Submit a Property Review")
def create_review(
    data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.property_id == data.property_id,
        Review.is_deleted == False
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this property")

    prop = db.query(Property).filter(Property.id == data.property_id).first()
    if not prop:
        raise HTTPException(status_code=444 if hasattr(HTTPException, 'status_code') else 404, detail="Property not found")

    # Verification check: Completed booking or site visit
    booking_id = None
    site_visit_id = None
    try:
        booking_row = db.query(Booking.id).filter(
            Booking.customer_id == current_user.id,
            Booking.property_id == data.property_id
        ).first()
        if booking_row:
            booking_id = booking_row[0]
    except Exception as e:
        print(f"[Review Verification] Booking lookup warning: {e}")
        db.rollback()

    try:
        site_visit_row = db.query(SiteVisit.id).filter(
            SiteVisit.customer_id == current_user.id,
            SiteVisit.property_id == data.property_id
        ).first()
        if site_visit_row:
            site_visit_id = site_visit_row[0]
    except Exception as e:
        print(f"[Review Verification] SiteVisit lookup warning: {e}")
        db.rollback()

    is_verified = bool(booking_id or site_visit_id)
    builder_id = prop.builder_id

    # Sentiment analysis & Spam check
    sentiment_score, sentiment_label = analyze_sentiment(data.title, data.comment, data.rating)
    is_spam, spam_score, spam_flags = detect_spam(data.title, data.comment, current_user.id, db)
    
    status = ReviewStatus.flagged if is_spam else ReviewStatus.approved

    review = Review(
        user_id=current_user.id,
        property_id=data.property_id,
        builder_id=builder_id,
        booking_id=booking_id,
        site_visit_id=site_visit_id,
        rating=data.rating,
        title=data.title,
        comment=data.comment,
        is_verified=is_verified,
        is_active=True,
        status=status,
        sentiment_score=sentiment_score,
        sentiment_label=sentiment_label,
        is_spam=is_spam,
        spam_score=spam_score,
        spam_flags=",".join(spam_flags) if spam_flags else None
    )
    db.add(review)
    db.flush()

    # Attachments
    if data.attachment_urls:
        for url in data.attachment_urls:
            att = ReviewAttachment(
                review_id=review.id,
                file_url=url,
                file_type="image" if any(url.endswith(ext) for ext in [".jpg", ".png", ".jpeg", ".webp"]) else "document",
                file_name=url.split("/")[-1]
            )
            db.add(att)

    # Recalculate ratings if approved
    if status == ReviewStatus.approved:
        recalculate_property_rating(db, data.property_id)
        if builder_id:
            recalculate_builder_rating(db, builder_id)

    # Audit log
    log_review_audit(
        db,
        review_id=review.id,
        action="created",
        performed_by_type="user",
        performed_by_id=current_user.id,
        new_state={"rating": data.rating, "status": status, "is_verified": is_verified}
    )

    # Notification
    notif = Notification(
        user_id=current_user.id,
        title="Review Published" if status == ReviewStatus.approved else "Review Under Moderation",
        message=f"Thank you! Your {data.rating}-star review for '{prop.name}' has been received.",
        type=NotificationType.system,
        action_url=f"/properties/{data.property_id}",
    )
    db.add(notif)
    db.commit()

    return {"message": "Review submitted successfully", "id": review.id, "status": status}


@router.get("/{property_id}", summary="Get Approved Reviews for Property")
def get_property_reviews(
    property_id: int,
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Review)
        .options(
            joinedload(Review.user).joinedload(User.customer),
            joinedload(Review.attachments),
            joinedload(Review.replies)
        )
        .filter(
            Review.property_id == property_id,
            Review.status == ReviewStatus.approved,
            Review.is_active == True,
            Review.is_deleted == False
        )
    )

    if sort_by == "rating_desc":
        query = query.order_by(desc(Review.rating))
    elif sort_by == "rating_asc":
        query = query.order_by(Review.rating)
    elif sort_by == "helpful":
        query = query.order_by(desc(Review.helpful_count))
    else:
        query = query.order_by(desc(Review.created_at))

    reviews = query.all()
    result = []
    for r in reviews:
        customer = r.user.customer if r.user else None
        
        replies_data = []
        for rep in (r.replies or []):
            if rep.status == "approved" and not rep.is_deleted:
                replies_data.append({
                    "id": rep.id,
                    "review_id": rep.review_id,
                    "responder_name": "EstateFlow Support" if rep.admin_id else "Builder Team",
                    "reply_text": rep.reply_text,
                    "is_official": rep.is_official,
                    "created_at": rep.created_at.isoformat() if rep.created_at else None
                })

        attachments_data = [
            {
                "id": a.id,
                "file_url": a.file_url,
                "file_type": a.file_type,
                "file_name": a.file_name,
                "created_at": a.created_at.isoformat() if a.created_at else None
            } for a in (r.attachments or [])
        ]

        result.append({
            "id": r.id,
            "property_id": r.property_id,
            "builder_id": r.builder_id,
            "rating": r.rating,
            "title": r.title,
            "comment": r.comment,
            "reviewer_name": customer.full_name if customer else (r.user.username if r.user else "Anonymous"),
            "reviewer_avatar": customer.avatar_url if customer else None,
            "is_verified": r.is_verified,
            "is_active": r.is_active,
            "status": r.status,
            "sentiment_score": r.sentiment_score,
            "sentiment_label": r.sentiment_label,
            "is_spam": r.is_spam,
            "helpful_count": r.helpful_count,
            "unhelpful_count": r.unhelpful_count,
            "reports_count": r.reports_count,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "attachments": attachments_data,
            "replies": replies_data
        })
    return result


@router.get("/builder/{builder_id}", summary="Get Approved Reviews for Builder")
def get_builder_reviews(
    builder_id: int,
    db: Session = Depends(get_db),
):
    reviews = (
        db.query(Review)
        .options(joinedload(Review.user).joinedload(User.customer))
        .filter(
            Review.builder_id == builder_id,
            Review.status == ReviewStatus.approved,
            Review.is_active == True,
            Review.is_deleted == False
        )
        .order_by(desc(Review.created_at))
        .all()
    )

    result = []
    for r in reviews:
        customer = r.user.customer if r.user else None
        result.append({
            "id": r.id,
            "rating": r.rating,
            "title": r.title,
            "comment": r.comment,
            "reviewer_name": customer.full_name if customer else "Anonymous",
            "is_verified": r.is_verified,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
    return result


@router.get("/my-reviews", summary="Get Current Customer Reviews")
def get_my_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reviews = (
        db.query(Review)
        .options(joinedload(Review.property))
        .filter(Review.user_id == current_user.id, Review.is_deleted == False)
        .order_by(desc(Review.created_at))
        .all()
    )
    result = []
    for r in reviews:
        result.append({
            "id": r.id,
            "property_id": r.property_id,
            "property_name": r.property.name if r.property else "Property",
            "rating": r.rating,
            "title": r.title,
            "comment": r.comment,
            "status": r.status,
            "is_verified": r.is_verified,
            "helpful_count": r.helpful_count,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
    return result


@router.post("/{review_id}/reaction", summary="Vote Helpful/Unhelpful on Review")
def vote_review_reaction(
    review_id: int,
    data: ReviewReactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(Review.id == review_id, Review.is_deleted == False).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    existing = db.query(ReviewReaction).filter(
        ReviewReaction.review_id == review_id,
        ReviewReaction.user_id == current_user.id
    ).first()

    if existing:
        if existing.is_helpful == data.is_helpful:
            # Toggle off
            db.delete(existing)
            if data.is_helpful:
                review.helpful_count = max(0, review.helpful_count - 1)
            else:
                review.unhelpful_count = max(0, review.unhelpful_count - 1)
            msg = "Vote removed"
        else:
            # Switch vote
            if data.is_helpful:
                review.helpful_count += 1
                review.unhelpful_count = max(0, review.unhelpful_count - 1)
            else:
                review.unhelpful_count += 1
                review.helpful_count = max(0, review.helpful_count - 1)
            existing.is_helpful = data.is_helpful
            msg = "Vote updated"
    else:
        # New reaction
        reaction = ReviewReaction(
            review_id=review_id,
            user_id=current_user.id,
            is_helpful=data.is_helpful
        )
        db.add(reaction)
        if data.is_helpful:
            review.helpful_count += 1
        else:
            review.unhelpful_count += 1
        msg = "Vote recorded"

    db.commit()
    return {"message": msg, "helpful_count": review.helpful_count, "unhelpful_count": review.unhelpful_count}


@router.post("/{review_id}/report", summary="Report a Review")
def report_review(
    review_id: int,
    data: ReviewReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(Review.id == review_id, Review.is_deleted == False).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    report = ReviewReport(
        review_id=review_id,
        reporter_id=current_user.id,
        reason=data.reason,
        details=data.details
    )
    db.add(report)
    review.reports_count += 1
    if review.reports_count >= 3 and review.status == ReviewStatus.approved:
        review.status = ReviewStatus.flagged

    log_review_audit(
        db,
        review_id=review_id,
        action="reported",
        performed_by_type="user",
        performed_by_id=current_user.id,
        notes=f"Reason: {data.reason}"
    )

    db.commit()
    return {"message": "Review reported successfully for moderation"}
