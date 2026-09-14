import re
import json
from typing import Optional, Tuple, List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from server.models.review import (
    Review, ReviewAudit, ReviewStatus, SentimentLabel
)
from server.models.property import Property
from server.models.builder import Builder


POSITIVE_KEYWORDS = {
    "excellent", "luxurious", "spacious", "great", "awesome", "amazing", "beautiful",
    "top quality", "peaceful", "highly recommend", "smooth", "helpful", "friendly",
    "transparent", "punctual", "value for money", "prime location", "superb", "loved"
}

NEGATIVE_KEYWORDS = {
    "worst", "scam", "fraud", "poor", "terrible", "delay", "delayed", "horrible",
    "broken", "unresponsive", "cheated", "overpriced", "waste", "noisy", "disappointed",
    "bad quality", "leakage", "false promises", "rude", "lawsuit"
}

SPAM_KEYWORDS = {
    "call me at", "whatsapp", "bitcoin", "investment opportunity", "click here",
    "visit website", "loan instant", "casino", "poker", "cheap price buy now",
    "http://", "https://", "www."
}


def analyze_sentiment(title: Optional[str], comment: Optional[str], rating: float) -> Tuple[float, SentimentLabel]:
    text = f"{title or ''} {comment or ''}".lower()
    
    # Text sentiment score calculation
    pos_matches = sum(1 for kw in POSITIVE_KEYWORDS if kw in text)
    neg_matches = sum(1 for kw in NEGATIVE_KEYWORDS if kw in text)
    
    text_score = 0.0
    total_matches = pos_matches + neg_matches
    if total_matches > 0:
        text_score = (pos_matches - neg_matches) / total_matches
    
    # Rating influence (-1.0 to 1.0)
    rating_score = (rating - 3.0) / 2.0
    
    # Weighted final sentiment score: 60% rating, 40% text
    final_score = round(0.6 * rating_score + 0.4 * text_score, 2)
    final_score = max(-1.0, min(1.0, final_score))
    
    if final_score >= 0.25:
        label = SentimentLabel.positive
    elif final_score <= -0.25:
        label = SentimentLabel.negative
    else:
        label = SentimentLabel.neutral
        
    return final_score, label


def detect_spam(title: Optional[str], comment: Optional[str], user_id: str, db: Session) -> Tuple[bool, float, List[str]]:
    text = f"{title or ''} {comment or ''}".lower()
    flags = []
    score = 0.0
    
    # 1. URL / Website link detection
    if re.search(r'https?://|www\.|\b[a-zA-Z0-9.-]+\.(com|net|org|io|info|biz)\b', text):
        flags.append("contains_external_link")
        score += 0.45

    # 2. Phone number pattern detection
    if re.search(r'\b(?:\+?\d{1,3}[- .]?)?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}\b', text):
        flags.append("contains_phone_number")
        score += 0.40

    # 3. Known spam keywords check
    for kw in SPAM_KEYWORDS:
        if kw in text:
            flags.append(f"spam_keyword:{kw}")
            score += 0.35
            
    # 4. Excessive caps shouting (e.g. ALL CAPS)
    raw_text = f"{title or ''} {comment or ''}"
    if len(raw_text) > 20:
        upper_ratio = sum(1 for c in raw_text if c.isupper()) / len(raw_text)
        if upper_ratio > 0.6:
            flags.append("excessive_uppercase")
            score += 0.25

    # 5. Fast repeated reviews by same user
    recent_count = db.query(Review).filter(
        Review.user_id == user_id,
        Review.is_deleted == False
    ).count()
    if recent_count > 10:
        flags.append("high_volume_reviewer")
        score += 0.20

    is_spam = score >= 0.50
    return is_spam, round(min(1.0, score), 2), flags


def recalculate_property_rating(db: Session, property_id: int) -> Dict[str, Any]:
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        return {"rating": 0.0, "review_count": 0}
        
    reviews = db.query(Review).filter(
        Review.property_id == property_id,
        Review.status == ReviewStatus.approved,
        Review.is_active == True,
        Review.is_deleted == False
    ).all()
    
    count = len(reviews)
    if count > 0:
        avg_rating = round(sum(r.rating for r in reviews) / count, 1)
    else:
        avg_rating = 0.0
        
    prop.rating = avg_rating
    prop.review_count = count
    db.commit()
    
    return {"rating": avg_rating, "review_count": count}


def recalculate_builder_rating(db: Session, builder_id: int) -> Dict[str, Any]:
    builder = db.query(Builder).filter(Builder.id == builder_id).first()
    if not builder:
        return {"rating": 0.0, "review_count": 0}

    reviews = db.query(Review).filter(
        Review.builder_id == builder_id,
        Review.status == ReviewStatus.approved,
        Review.is_active == True,
        Review.is_deleted == False
    ).all()

    count = len(reviews)
    if count > 0:
        avg_rating = round(sum(r.rating for r in reviews) / count, 1)
    else:
        avg_rating = 0.0

    # Save to builder if builder has rating column or dict metadata
    db.commit()
    return {"rating": avg_rating, "review_count": count}


def log_review_audit(
    db: Session,
    review_id: int,
    action: str,
    performed_by_type: str = "system",
    performed_by_id: Optional[str] = None,
    previous_state: Optional[Dict[str, Any]] = None,
    new_state: Optional[Dict[str, Any]] = None,
    notes: Optional[str] = None
) -> ReviewAudit:
    audit = ReviewAudit(
        review_id=review_id,
        action=action,
        performed_by_type=performed_by_type,
        performed_by_id=str(performed_by_id) if performed_by_id else None,
        previous_state=json.dumps(previous_state) if previous_state else None,
        new_state=json.dumps(new_state) if new_state else None,
        notes=notes
    )
    db.add(audit)
    db.commit()
    return audit
