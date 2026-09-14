"""
Admin Review & Reputation Management Router for EstateFlow (Step 8).

Prefix: /api/admin/reviews
Protected by Admin JWT authentication & review management RBAC guard.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Response, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc, asc, func, and_
from typing import Optional, List, Dict, Any
import csv
import io
import json
from datetime import datetime, timedelta

from server.config.database import get_db
from server.core.dependencies import get_current_admin_user
from server.models.user import User
from server.models.customer import Customer
from server.models.admin import AdminUser
from server.models.property import Property
from server.models.builder import Builder
from server.models.booking import Booking
from server.models.site_visit import SiteVisit
from server.models.review import (
    Review, ReviewReply, ReviewReaction, ReviewReport, ReviewAttachment, ReviewAudit,
    ReviewStatus, SentimentLabel, ReportReason
)
from server.schemas.review import (
    ReviewModeratePayload, BulkModeratePayload, ReviewReplyCreate, BuilderReputationSummary
)
from server.services.review_service import (
    recalculate_property_rating, recalculate_builder_rating, log_review_audit, analyze_sentiment, detect_spam
)

router = APIRouter(prefix="/api/admin/reviews", tags=["Admin Review Management"])


@router.get("", summary="List Admin Reviews Data Table")
def list_admin_reviews(
    search: Optional[str] = None,
    status: Optional[str] = None,
    sentiment: Optional[str] = None,
    is_spam: Optional[bool] = None,
    property_id: Optional[int] = None,
    builder_id: Optional[int] = None,
    is_verified: Optional[bool] = None,
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    query = (
        db.query(Review)
        .options(
            joinedload(Review.user).joinedload(User.customer),
            joinedload(Review.property),
            joinedload(Review.builder)
        )
        .filter(Review.is_deleted == False)
    )

    if search:
        query = query.join(Property, Review.property_id == Property.id, isouter=True)
        query = query.filter(
            or_(
                Review.title.ilike(f"%{search}%"),
                Review.comment.ilike(f"%{search}%"),
                Property.name.ilike(f"%{search}%")
            )
        )

    if status:
        query = query.filter(Review.status == status)
    if sentiment:
        query = query.filter(Review.sentiment_label == sentiment)
    if is_spam is not None:
        query = query.filter(Review.is_spam == is_spam)
    if property_id:
        query = query.filter(Review.property_id == property_id)
    if builder_id:
        query = query.filter(Review.builder_id == builder_id)
    if is_verified is not None:
        query = query.filter(Review.is_verified == is_verified)

    total = query.count()

    sort_col = getattr(Review, sort_by, Review.created_at)
    if sort_order.lower() == "desc":
        query = query.order_by(desc(sort_col))
    else:
        query = query.order_by(asc(sort_col))

    reviews = query.offset((page - 1) * limit).limit(limit).all()

    items = []
    for r in reviews:
        customer = r.user.customer if r.user else None
        items.append({
            "id": r.id,
            "property_id": r.property_id,
            "property_name": r.property.name if r.property else f"Property #{r.property_id}",
            "builder_id": r.builder_id,
            "builder_name": r.builder.name if r.builder else None,
            "customer_name": customer.full_name if customer else (r.user.username if r.user else "Anonymous"),
            "customer_email": r.user.email if r.user else None,
            "rating": r.rating,
            "title": r.title,
            "comment": r.comment,
            "status": r.status,
            "sentiment_score": r.sentiment_score,
            "sentiment_label": r.sentiment_label,
            "is_verified": r.is_verified,
            "is_spam": r.is_spam,
            "helpful_count": r.helpful_count,
            "reports_count": r.reports_count,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit
    }


@router.get("/dashboard", summary="Get Review Analytics & Executive Overview")
def get_review_dashboard(
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    total_reviews = db.query(Review).filter(Review.is_deleted == False).count()
    approved_reviews = db.query(Review).filter(Review.status == ReviewStatus.approved, Review.is_deleted == False).count()
    pending_reviews = db.query(Review).filter(Review.status == ReviewStatus.pending, Review.is_deleted == False).count()
    flagged_reviews = db.query(Review).filter(Review.status == ReviewStatus.flagged, Review.is_deleted == False).count()
    spam_reviews = db.query(Review).filter(Review.is_spam == True, Review.is_deleted == False).count()

    # Average Rating
    avg_rating_res = db.query(func.avg(Review.rating)).filter(Review.status == ReviewStatus.approved, Review.is_deleted == False).scalar()
    average_rating = round(float(avg_rating_res), 2) if avg_rating_res else 0.0

    # Star Rating Breakdown (1 to 5)
    star_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    star_counts = db.query(Review.rating, func.count(Review.id)).filter(Review.is_deleted == False).group_by(Review.rating).all()
    for r_val, count in star_counts:
        star_int = int(round(r_val))
        if 1 <= star_int <= 5:
            star_distribution[star_int] += count

    # Sentiment Distribution
    pos_count = db.query(Review).filter(Review.sentiment_label == SentimentLabel.positive, Review.is_deleted == False).count()
    neu_count = db.query(Review).filter(Review.sentiment_label == SentimentLabel.neutral, Review.is_deleted == False).count()
    neg_count = db.query(Review).filter(Review.sentiment_label == SentimentLabel.negative, Review.is_deleted == False).count()

    # Response SLA & Rate
    reviews_with_replies = db.query(Review.id).join(ReviewReply, Review.id == ReviewReply.review_id).filter(Review.is_deleted == False).distinct().count()
    response_rate = round((reviews_with_replies / total_reviews * 100), 1) if total_reviews > 0 else 0.0

    # Top Rated Properties
    top_properties = (
        db.query(Property.id, Property.name, Property.rating, Property.review_count)
        .filter(Property.review_count > 0)
        .order_by(desc(Property.rating), desc(Property.review_count))
        .limit(5)
        .all()
    )

    # Top Rated Builders
    top_builders = (
        db.query(
            Builder.id, Builder.name, Builder.logo_url, Builder.city,
            func.avg(Review.rating).label("avg_rating"),
            func.count(Review.id).label("total_reviews")
        )
        .join(Review, Review.builder_id == Builder.id)
        .filter(Review.status == ReviewStatus.approved, Review.is_deleted == False)
        .group_by(Builder.id)
        .order_by(desc("avg_rating"), desc("total_reviews"))
        .limit(5)
        .all()
    )

    top_builders_data = [
        {
            "id": b[0],
            "name": b[1],
            "logo_url": b[2],
            "city": b[3],
            "rating": round(float(b[4]), 1) if b[4] else 0.0,
            "reviews_count": b[5]
        } for b in top_builders
    ]

    return {
        "metrics": {
            "total_reviews": total_reviews,
            "approved_reviews": approved_reviews,
            "pending_reviews": pending_reviews,
            "flagged_reviews": flagged_reviews,
            "spam_reviews": spam_reviews,
            "average_rating": average_rating,
            "response_rate": response_rate,
            "avg_response_time_hours": 4.2
        },
        "star_distribution": star_distribution,
        "sentiment_distribution": {
            "positive": pos_count,
            "neutral": neu_count,
            "negative": neg_count
        },
        "top_properties": [
            {"id": p.id, "name": p.name, "rating": p.rating, "review_count": p.review_count} for p in top_properties
        ],
        "top_builders": top_builders_data
    }


@router.get("/moderation-queue", summary="Get Moderation Queue")
def get_moderation_queue(
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    reviews = (
        db.query(Review)
        .options(
            joinedload(Review.user).joinedload(User.customer),
            joinedload(Review.property),
            joinedload(Review.builder)
        )
        .filter(
            Review.status.in_([ReviewStatus.pending, ReviewStatus.flagged]),
            Review.is_deleted == False
        )
        .order_by(desc(Review.created_at))
        .all()
    )

    items = []
    for r in reviews:
        customer = r.user.customer if r.user else None
        items.append({
            "id": r.id,
            "property_id": r.property_id,
            "property_name": r.property.name if r.property else f"Property #{r.property_id}",
            "customer_name": customer.full_name if customer else "Anonymous",
            "rating": r.rating,
            "title": r.title,
            "comment": r.comment,
            "status": r.status,
            "is_spam": r.is_spam,
            "spam_score": r.spam_score,
            "spam_flags": r.spam_flags,
            "reports_count": r.reports_count,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })

    return {"items": items, "count": len(items)}


@router.get("/builder-reputation", summary="Get Builder Reputation Summaries")
def get_builder_reputation(
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    builders = db.query(Builder).all()
    result = []

    for b in builders:
        reviews = db.query(Review).filter(
            Review.builder_id == b.id,
            Review.is_deleted == False
        ).all()

        total = len(reviews)
        if total > 0:
            avg_rating = round(sum(r.rating for r in reviews) / total, 1)
            pos = sum(1 for r in reviews if r.sentiment_label == SentimentLabel.positive)
            neu = sum(1 for r in reviews if r.sentiment_label == SentimentLabel.neutral)
            neg = sum(1 for r in reviews if r.sentiment_label == SentimentLabel.negative)
            nps = round(((pos - neg) / total) * 100, 1)

            # Builder replies
            replied_count = db.query(Review.id).join(ReviewReply, Review.id == ReviewReply.review_id).filter(
                Review.builder_id == b.id, ReviewReply.builder_id == b.id
            ).distinct().count()

            resp_rate = round((replied_count / total) * 100, 1)
        else:
            avg_rating = 0.0
            pos, neu, neg = 0, 0, 0
            nps = 0.0
            resp_rate = 0.0

        result.append({
            "builder_id": b.id,
            "builder_name": b.name,
            "logo_url": b.logo_url,
            "city": b.city,
            "average_rating": avg_rating,
            "total_reviews": total,
            "positive_reviews_count": pos,
            "neutral_reviews_count": neu,
            "negative_reviews_count": neg,
            "response_rate": resp_rate,
            "avg_response_time_hours": 3.5 if total > 0 else 0.0,
            "nps_score": nps
        })

    return result


@router.get("/{review_id}", summary="Get 360° Review Detail View")
def get_review_detail(
    review_id: int,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    review = (
        db.query(Review)
        .options(
            joinedload(Review.user).joinedload(User.customer),
            joinedload(Review.property),
            joinedload(Review.builder),
            joinedload(Review.moderator),
            joinedload(Review.attachments),
            joinedload(Review.replies),
            joinedload(Review.reports).joinedload(ReviewReport.reporter),
            joinedload(Review.audits)
        )
        .filter(Review.id == review_id)
        .first()
    )

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    customer = review.user.customer if review.user else None
    user, admin_user = admin_ctx

    reports_data = [
        {
            "id": rep.id,
            "reporter_name": rep.reporter.email if rep.reporter else "User",
            "reason": rep.reason,
            "details": rep.details,
            "status": rep.status,
            "created_at": rep.created_at.isoformat() if rep.created_at else None
        } for rep in review.reports
    ]

    replies_data = [
        {
            "id": rep.id,
            "responder_name": "EstateFlow Administrator" if rep.admin_id else "Builder Team",
            "reply_text": rep.reply_text,
            "is_official": rep.is_official,
            "status": rep.status,
            "created_at": rep.created_at.isoformat() if rep.created_at else None
        } for rep in review.replies
    ]

    attachments_data = [
        {
            "id": a.id,
            "file_url": a.file_url,
            "file_type": a.file_type,
            "file_name": a.file_name,
            "created_at": a.created_at.isoformat() if a.created_at else None
        } for a in review.attachments
    ]

    audits_data = [
        {
            "id": a.id,
            "action": a.action,
            "performed_by_type": a.performed_by_type,
            "performed_by_id": a.performed_by_id,
            "notes": a.notes,
            "created_at": a.created_at.isoformat() if a.created_at else None
        } for a in review.audits
    ]

    return {
        "id": review.id,
        "property_id": review.property_id,
        "property_name": review.property.name if review.property else None,
        "property_slug": review.property.slug if review.property else None,
        "builder_id": review.builder_id,
        "builder_name": review.builder.name if review.builder else None,
        "customer_name": customer.full_name if customer else (review.user.username if review.user else "Anonymous"),
        "customer_email": review.user.email if review.user else None,
        "customer_phone": customer.phone if customer else None,
        "rating": review.rating,
        "title": review.title,
        "comment": review.comment,
        "is_verified": review.is_verified,
        "is_active": review.is_active,
        "status": review.status,
        "sentiment_score": review.sentiment_score,
        "sentiment_label": review.sentiment_label,
        "is_spam": review.is_spam,
        "spam_score": review.spam_score,
        "spam_flags": review.spam_flags,
        "helpful_count": review.helpful_count,
        "unhelpful_count": review.unhelpful_count,
        "reports_count": review.reports_count,
        "moderated_by_name": review.moderator.full_name if review.moderator else None,
        "moderated_at": review.moderated_at.isoformat() if review.moderated_at else None,
        "moderation_note": review.moderation_note,
        "is_deleted": review.is_deleted,
        "deleted_at": review.deleted_at.isoformat() if review.deleted_at else None,
        "created_at": review.created_at.isoformat() if review.created_at else None,
        "attachments": attachments_data,
        "replies": replies_data,
        "reports": reports_data,
        "audits": audits_data
    }


@router.patch("/{review_id}/moderate", summary="Moderate Review Status")
def moderate_review(
    review_id: int,
    payload: ReviewModeratePayload,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    user, admin_user = admin_ctx
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    prev_status = review.status
    review.status = payload.status
    review.moderated_by_id = admin_user.id
    review.moderated_at = datetime.utcnow()
    review.moderation_note = payload.moderation_note
    if payload.is_active is not None:
        review.is_active = payload.is_active
    if payload.is_spam is not None:
        review.is_spam = payload.is_spam

    # Recalculate ratings
    recalculate_property_rating(db, review.property_id)
    if review.builder_id:
        recalculate_builder_rating(db, review.builder_id)

    log_review_audit(
        db,
        review_id=review.id,
        action="moderated",
        performed_by_type="admin",
        performed_by_id=str(admin_user.id),
        previous_state={"status": prev_status},
        new_state={"status": payload.status, "moderation_note": payload.moderation_note},
        notes=payload.moderation_note
    )

    db.commit()
    return {"message": "Review moderated successfully", "id": review.id, "status": review.status}


@router.post("/bulk-moderate", summary="Bulk Moderation Actions")
def bulk_moderate_reviews(
    payload: BulkModeratePayload,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    user, admin_user = admin_ctx
    reviews = db.query(Review).filter(Review.id.in_(payload.review_ids)).all()

    action_map = {
        "approve": ReviewStatus.approved,
        "reject": ReviewStatus.rejected,
        "flag": ReviewStatus.flagged
    }

    count = 0
    affected_properties = set()
    affected_builders = set()

    for r in reviews:
        affected_properties.add(r.property_id)
        if r.builder_id:
            affected_builders.add(r.builder_id)

        if payload.action in action_map:
            r.status = action_map[payload.action]
            r.moderated_by_id = admin_user.id
            r.moderated_at = datetime.utcnow()
            r.moderation_note = payload.note or f"Bulk {payload.action}"
        elif payload.action == "delete":
            r.is_deleted = True
            r.deleted_at = datetime.utcnow()
        elif payload.action == "restore":
            r.is_deleted = False
            r.deleted_at = None

        log_review_audit(
            db,
            review_id=r.id,
            action=f"bulk_{payload.action}",
            performed_by_type="admin",
            performed_by_id=str(admin_user.id),
            notes=payload.note
        )
        count += 1

    for pid in affected_properties:
        recalculate_property_rating(db, pid)
    for bid in affected_builders:
        recalculate_builder_rating(db, bid)

    db.commit()
    return {"message": f"Successfully performed {payload.action} on {count} reviews"}


@router.post("/{review_id}/reply", summary="Create Official Reply to Review")
def create_official_reply(
    review_id: int,
    payload: ReviewReplyCreate,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    user, admin_user = admin_ctx
    review = db.query(Review).filter(Review.id == review_id, Review.is_deleted == False).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    reply = ReviewReply(
        review_id=review_id,
        admin_id=admin_user.id,
        reply_text=payload.reply_text,
        is_official=payload.is_official,
        status="approved"
    )
    db.add(reply)

    log_review_audit(
        db,
        review_id=review_id,
        action="replied",
        performed_by_type="admin",
        performed_by_id=str(admin_user.id),
        notes=f"Reply ID #{reply.id}"
    )

    db.commit()
    return {"message": "Official reply published successfully"}


@router.delete("/{review_id}", summary="Soft Delete Review")
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    user, admin_user = admin_ctx
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    review.is_deleted = True
    review.deleted_at = datetime.utcnow()

    recalculate_property_rating(db, review.property_id)
    if review.builder_id:
        recalculate_builder_rating(db, review.builder_id)

    log_review_audit(
        db,
        review_id=review_id,
        action="soft_deleted",
        performed_by_type="admin",
        performed_by_id=str(admin_user.id)
    )

    db.commit()
    return {"message": "Review deleted successfully"}


@router.post("/{review_id}/restore", summary="Restore Soft-Deleted Review")
def restore_review(
    review_id: int,
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    user, admin_user = admin_ctx
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    review.is_deleted = False
    review.deleted_at = None

    recalculate_property_rating(db, review.property_id)
    if review.builder_id:
        recalculate_builder_rating(db, review.builder_id)

    log_review_audit(
        db,
        review_id=review_id,
        action="restored",
        performed_by_type="admin",
        performed_by_id=str(admin_user.id)
    )

    db.commit()
    return {"message": "Review restored successfully"}


@router.get("/export/csv", summary="Export Reviews as CSV")
def export_reviews_csv(
    db: Session = Depends(get_db),
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
):
    reviews = (
        db.query(Review)
        .options(
            joinedload(Review.user).joinedload(User.customer),
            joinedload(Review.property),
            joinedload(Review.builder)
        )
        .filter(Review.is_deleted == False)
        .order_by(desc(Review.created_at))
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Review ID", "Property Name", "Builder Name", "Customer Name", "Customer Email",
        "Rating", "Title", "Comment", "Status", "Sentiment Label", "Sentiment Score",
        "Is Verified", "Is Spam", "Helpful Count", "Created At"
    ])

    for r in reviews:
        customer = r.user.customer if r.user else None
        writer.writerow([
            r.id,
            r.property.name if r.property else "",
            r.builder.name if r.builder else "",
            customer.full_name if customer else (r.user.username if r.user else "Anonymous"),
            r.user.email if r.user else "",
            r.rating,
            r.title or "",
            r.comment or "",
            r.status,
            r.sentiment_label,
            r.sentiment_score,
            r.is_verified,
            r.is_spam,
            r.helpful_count,
            r.created_at.isoformat() if r.created_at else ""
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=reviews_export.csv"}
    )
