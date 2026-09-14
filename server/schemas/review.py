from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from server.models.review import ReviewStatus, SentimentLabel, ReportReason


class ReviewAttachmentOut(BaseModel):
    id: int
    file_url: str
    file_type: str
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewReplyOut(BaseModel):
    id: int
    review_id: int
    responder_name: Optional[str] = None
    responder_role: Optional[str] = None
    reply_text: str
    is_official: bool
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewCreate(BaseModel):
    property_id: int
    rating: float
    title: Optional[str] = None
    comment: Optional[str] = None
    attachment_urls: Optional[List[str]] = None

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v: float) -> float:
        if not 1.0 <= v <= 5.0:
            raise ValueError("Rating must be between 1.0 and 5.0")
        return round(v, 1)


class ReviewOut(BaseModel):
    id: int
    property_id: int
    builder_id: Optional[int] = None
    booking_id: Optional[int] = None
    site_visit_id: Optional[int] = None
    rating: float
    title: Optional[str] = None
    comment: Optional[str] = None
    reviewer_name: Optional[str] = None
    reviewer_avatar: Optional[str] = None
    is_verified: bool
    is_active: bool
    status: ReviewStatus
    sentiment_score: float
    sentiment_label: SentimentLabel
    is_spam: bool
    helpful_count: int
    unhelpful_count: int
    reports_count: int
    created_at: datetime
    attachments: Optional[List[ReviewAttachmentOut]] = []
    replies: Optional[List[ReviewReplyOut]] = []

    model_config = {"from_attributes": True}


class ReviewDetailOut(ReviewOut):
    property_name: Optional[str] = None
    property_slug: Optional[str] = None
    builder_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    spam_score: float = 0.0
    spam_flags: Optional[str] = None
    moderated_by_name: Optional[str] = None
    moderated_at: Optional[datetime] = None
    moderation_note: Optional[str] = None
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    reports: Optional[List[Dict[str, Any]]] = []
    audits: Optional[List[Dict[str, Any]]] = []


class ReviewModeratePayload(BaseModel):
    status: ReviewStatus
    moderation_note: Optional[str] = None
    is_active: Optional[bool] = True
    is_spam: Optional[bool] = False


class BulkModeratePayload(BaseModel):
    review_ids: List[int]
    action: str  # approve, reject, flag, delete, restore
    note: Optional[str] = None


class ReviewReplyCreate(BaseModel):
    reply_text: str
    is_official: bool = True


class ReviewReportCreate(BaseModel):
    reason: ReportReason
    details: Optional[str] = None


class ReviewReactionCreate(BaseModel):
    is_helpful: bool


class BuilderReputationSummary(BaseModel):
    builder_id: int
    builder_name: str
    logo_url: Optional[str] = None
    city: Optional[str] = None
    average_rating: float
    total_reviews: int
    positive_reviews_count: int
    neutral_reviews_count: int
    negative_reviews_count: int
    response_rate: float
    avg_response_time_hours: float
    nps_score: float
