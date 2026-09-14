import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Float, Text, DateTime, Boolean, ForeignKey,
    Enum as SAEnum, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from server.config.database import Base


class ReviewStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    flagged = "flagged"


class SentimentLabel(str, enum.Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"


class ReportReason(str, enum.Enum):
    spam = "spam"
    inappropriate = "inappropriate"
    fake = "fake"
    offensive = "offensive"
    misleading = "misleading"
    other = "other"


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    builder_id = Column(Integer, ForeignKey("builders.id", ondelete="SET NULL"), nullable=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True)
    site_visit_id = Column(Integer, ForeignKey("site_visits.id", ondelete="SET NULL"), nullable=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="SET NULL"), nullable=True, index=True)

    # Core Rating & Content
    rating = Column(Float, nullable=False, index=True)  # 1.0 - 5.0
    title = Column(Text, nullable=True)
    comment = Column(Text, nullable=True)
    
    # Verification & Status Flags
    is_verified = Column(Boolean, default=False)  # Verified Buyer or Visitor
    is_active = Column(Boolean, default=True)     # Active vs inactive
    status = Column(SAEnum(ReviewStatus), default=ReviewStatus.approved, nullable=False, index=True)

    # Sentiment & Spam Analytics
    sentiment_score = Column(Float, default=0.0)  # -1.0 to +1.0
    sentiment_label = Column(SAEnum(SentimentLabel), default=SentimentLabel.neutral, nullable=False)
    is_spam = Column(Boolean, default=False, index=True)
    spam_score = Column(Float, default=0.0)
    spam_flags = Column(Text, nullable=True)

    # Aggregates & Counters
    helpful_count = Column(Integer, default=0)
    unhelpful_count = Column(Integer, default=0)
    reports_count = Column(Integer, default=0)

    # Moderation Metadata
    moderated_by_id = Column(Integer, ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True)
    moderated_at = Column(DateTime(timezone=True), nullable=True)
    moderation_note = Column(Text, nullable=True)

    # Audit & Soft Delete
    is_deleted = Column(Boolean, default=False, index=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="reviews")
    property = relationship("Property", back_populates="reviews")
    builder = relationship("Builder")
    booking = relationship("Booking")
    site_visit = relationship("SiteVisit")
    moderator = relationship("AdminUser", foreign_keys=[moderated_by_id])
    
    replies = relationship("ReviewReply", back_populates="review", cascade="all, delete-orphan")
    reactions = relationship("ReviewReaction", back_populates="review", cascade="all, delete-orphan")
    reports = relationship("ReviewReport", back_populates="review", cascade="all, delete-orphan")
    attachments = relationship("ReviewAttachment", back_populates="review", cascade="all, delete-orphan")
    audits = relationship("ReviewAudit", back_populates="review", cascade="all, delete-orphan")


class ReviewReply(Base):
    __tablename__ = "review_replies"

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    admin_id = Column(Integer, ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True)
    builder_id = Column(Integer, ForeignKey("builders.id", ondelete="SET NULL"), nullable=True)
    
    reply_text = Column(Text, nullable=False)
    is_official = Column(Boolean, default=True)
    status = Column(String(20), default="approved")  # approved, pending, rejected
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    review = relationship("Review", back_populates="replies")
    user = relationship("User")
    admin = relationship("AdminUser")
    builder = relationship("Builder")


class ReviewReaction(Base):
    __tablename__ = "review_reactions"

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    is_helpful = Column(Boolean, nullable=False)  # True = Helpful, False = Unhelpful
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    review = relationship("Review", back_populates="reactions")
    user = relationship("User")

    __table_args__ = (
        UniqueConstraint('review_id', 'user_id', name='uq_review_user_reaction'),
    )


class ReviewReport(Base):
    __tablename__ = "review_reports"

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    reporter_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reason = Column(SAEnum(ReportReason), default=ReportReason.inappropriate, nullable=False)
    details = Column(Text, nullable=True)
    status = Column(String(20), default="pending", index=True)  # pending, reviewed, dismissed, actioned
    
    handled_by_id = Column(Integer, ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True)
    handled_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    review = relationship("Review", back_populates="reports")
    reporter = relationship("User")
    handler = relationship("AdminUser")


class ReviewAttachment(Base):
    __tablename__ = "review_attachments"

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    file_url = Column(String(500), nullable=False)
    file_type = Column(String(50), default="image")  # image, document, video
    file_name = Column(String(255), nullable=True)
    file_size = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    review = relationship("Review", back_populates="attachments")


class ReviewAudit(Base):
    __tablename__ = "review_audits"

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(100), nullable=False)  # e.g., created, moderated, status_changed, replied, reported, soft_deleted, restored
    performed_by_type = Column(String(50), default="system")  # user, admin, builder, system
    performed_by_id = Column(String(100), nullable=True)
    previous_state = Column(Text, nullable=True)
    new_state = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    review = relationship("Review", back_populates="audits")
