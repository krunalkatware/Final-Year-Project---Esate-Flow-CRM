import enum
import uuid
from datetime import datetime
from builtins import property as py_property
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float,
    Enum as SAEnum, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship, synonym
from sqlalchemy.sql import func
from server.config.database import Base


class VisitStatus(str, enum.Enum):
    draft = "draft"
    scheduled = "scheduled"
    in_transit = "in_transit"
    arrived = "arrived"
    completed = "completed"
    cancelled = "cancelled"
    rescheduled = "rescheduled"
    no_show = "no_show"


class VisitType(str, enum.Enum):
    physical = "physical"
    virtual = "virtual"
    guided = "guided"


class VisitPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class SiteVisit(Base):
    __tablename__ = "site_visits"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True)
    visit_number = Column(String(50), unique=True, index=True, nullable=False)

    # Foreign Keys
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="SET NULL"), nullable=True)
    customer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    builder_id = Column(Integer, ForeignKey("builders.id", ondelete="CASCADE"), nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True)
    
    # Staff / Assignments
    sales_executive_id = Column(Integer, ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True)
    assigned_manager_id = Column(Integer, ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True)

    # Visit Specs
    status = Column(SAEnum(VisitStatus), default=VisitStatus.scheduled, nullable=False, index=True)
    visit_type = Column(SAEnum(VisitType), default=VisitType.physical, nullable=False)
    purpose = Column(Text, nullable=True)
    scheduled_date = Column(DateTime, nullable=False, index=True)
    scheduled_time = Column(String(50), nullable=True)
    expected_duration = Column(Integer, default=60)  # minutes
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)

    # Transport Details
    transport_required = Column(Boolean, default=False)
    pickup_location = Column(Text, nullable=True)
    drop_location = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    # Conversions & Scores
    feedback_score = Column(Integer, nullable=True)  # 1 to 5
    conversion_probability = Column(Float, default=0.0)
    gps_coordinates = Column(String(100), nullable=True)  # e.g., "19.0760, 72.8777"
    check_in_time = Column(DateTime, nullable=True)
    check_out_time = Column(DateTime, nullable=True)

    # Reschedule / Cancellation
    is_rescheduled = Column(Boolean, default=False)
    reschedule_reason = Column(Text, nullable=True)
    cancel_reason = Column(Text, nullable=True)
    
    # Metadata
    weather = Column(String(100), nullable=True)
    priority = Column(SAEnum(VisitPriority), default=VisitPriority.medium, nullable=False, index=True)

    # Audit & Version Columns
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    version = Column(Integer, default=1, nullable=False)

    __mapper_args__ = {
        "version_id_col": version
    }

    user_id = synonym("customer_id")

    def __init__(self, **kwargs):
        if "user_id" in kwargs and "customer_id" not in kwargs:
            kwargs["customer_id"] = kwargs.pop("user_id")
        elif "user_id" in kwargs:
            kwargs.pop("user_id")
        super().__init__(**kwargs)

    # Relationships
    lead = relationship("Lead", backref="site_visits_rel")
    user = relationship("User", back_populates="site_visits", foreign_keys=[customer_id])
    property = relationship("Property", back_populates="site_visits", foreign_keys=[property_id])

    @py_property
    def customer(self):
        return self.user
    builder = relationship("Builder", backref="site_visits_rel")
    sales_executive = relationship("AdminUser", foreign_keys=[sales_executive_id], backref="site_visits_assigned")
    assigned_manager = relationship("AdminUser", foreign_keys=[assigned_manager_id], backref="site_visits_managed")

    assignments = relationship("SiteVisitAssignment", back_populates="site_visit", cascade="all, delete-orphan")
    timeline = relationship("SiteVisitTimeline", back_populates="site_visit", cascade="all, delete-orphan")
    comments = relationship("SiteVisitComment", back_populates="site_visit", cascade="all, delete-orphan")
    documents = relationship("SiteVisitDocument", back_populates="site_visit", cascade="all, delete-orphan")
    reminders = relationship("SiteVisitReminder", back_populates="site_visit", cascade="all, delete-orphan")
    feedbacks = relationship("SiteVisitFeedback", back_populates="site_visit", cascade="all, delete-orphan")
    status_history = relationship("SiteVisitStatusHistory", back_populates="site_visit", cascade="all, delete-orphan")
    routes = relationship("SiteVisitRoute", back_populates="site_visit", cascade="all, delete-orphan")
    attendance = relationship("SiteVisitAttendance", back_populates="site_visit", cascade="all, delete-orphan")
    audits = relationship("SiteVisitAudit", back_populates="site_visit", cascade="all, delete-orphan")
    notifications = relationship("SiteVisitNotification", back_populates="site_visit", cascade="all, delete-orphan")


class SiteVisitAssignment(Base):
    __tablename__ = "site_visit_assignments"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True)
    site_visit_id = Column(Integer, ForeignKey("site_visits.id", ondelete="CASCADE"), nullable=False)
    sales_executive_id = Column(Integer, ForeignKey("admin_users.id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    assignment_rule = Column(String(100), default="manual")  # round_robin, nearest_location, manual
    status = Column(String(50), default="pending")  # pending, accepted, rejected, completed

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    version = Column(Integer, default=1, nullable=False)

    __mapper_args__ = {
        "version_id_col": version
    }

    site_visit = relationship("SiteVisit", back_populates="assignments")
    sales_executive = relationship("AdminUser", foreign_keys=[sales_executive_id])


class SiteVisitTimeline(Base):
    __tablename__ = "site_visit_timelines"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True)
    site_visit_id = Column(Integer, ForeignKey("site_visits.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(100), nullable=False)  # created, status_change, document_uploaded, feedback_received
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    performed_by = Column(String(150), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    version = Column(Integer, default=1, nullable=False)

    __mapper_args__ = {
        "version_id_col": version
    }

    site_visit = relationship("SiteVisit", back_populates="timeline")


class SiteVisitComment(Base):
    __tablename__ = "site_visit_comments"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True)
    site_visit_id = Column(Integer, ForeignKey("site_visits.id", ondelete="CASCADE"), nullable=False)
    author_name = Column(String(150), nullable=False)
    comment = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    version = Column(Integer, default=1, nullable=False)

    __mapper_args__ = {
        "version_id_col": version
    }

    site_visit = relationship("SiteVisit", back_populates="comments")


class SiteVisitDocument(Base):
    __tablename__ = "site_visit_documents"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True)
    site_visit_id = Column(Integer, ForeignKey("site_visits.id", ondelete="CASCADE"), nullable=False)
    document_name = Column(String(200), nullable=False)
    document_type = Column(String(100), nullable=True)
    file_url = Column(String(500), nullable=False)
    is_verified = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    version = Column(Integer, default=1, nullable=False)

    __mapper_args__ = {
        "version_id_col": version
    }

    site_visit = relationship("SiteVisit", back_populates="documents")


class SiteVisitReminder(Base):
    __tablename__ = "site_visit_reminders"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True)
    site_visit_id = Column(Integer, ForeignKey("site_visits.id", ondelete="CASCADE"), nullable=False)
    reminder_type = Column(String(50), nullable=False)  # sms, email, whatsapp
    reminder_time = Column(DateTime, nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(50), default="scheduled")  # scheduled, sent, failed

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    version = Column(Integer, default=1, nullable=False)

    __mapper_args__ = {
        "version_id_col": version
    }

    site_visit = relationship("SiteVisit", back_populates="reminders")


class SiteVisitFeedback(Base):
    __tablename__ = "site_visit_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True)
    site_visit_id = Column(Integer, ForeignKey("site_visits.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    comments = Column(Text, nullable=True)
    interested_in_booking = Column(Boolean, default=False)
    next_action = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    version = Column(Integer, default=1, nullable=False)

    __mapper_args__ = {
        "version_id_col": version
    }

    site_visit = relationship("SiteVisit", back_populates="feedbacks")


class SiteVisitStatusHistory(Base):
    __tablename__ = "site_visit_status_history"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True)
    site_visit_id = Column(Integer, ForeignKey("site_visits.id", ondelete="CASCADE"), nullable=False)
    old_status = Column(SAEnum(VisitStatus), nullable=True)
    new_status = Column(SAEnum(VisitStatus), nullable=False)
    reason = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    version = Column(Integer, default=1, nullable=False)

    __mapper_args__ = {
        "version_id_col": version
    }

    site_visit = relationship("SiteVisit", back_populates="status_history")


class SiteVisitRoute(Base):
    __tablename__ = "site_visit_routes"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True)
    site_visit_id = Column(Integer, ForeignKey("site_visits.id", ondelete="CASCADE"), nullable=False)
    route_name = Column(String(200), nullable=True)
    start_latitude = Column(Float, nullable=True)
    start_longitude = Column(Float, nullable=True)
    end_latitude = Column(Float, nullable=True)
    end_longitude = Column(Float, nullable=True)
    distance_km = Column(Float, default=0.0)
    estimated_duration_min = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    version = Column(Integer, default=1, nullable=False)

    __mapper_args__ = {
        "version_id_col": version
    }

    site_visit = relationship("SiteVisit", back_populates="routes")


class SiteVisitAttendance(Base):
    __tablename__ = "site_visit_attendances"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True)
    site_visit_id = Column(Integer, ForeignKey("site_visits.id", ondelete="CASCADE"), nullable=False)
    sales_executive_id = Column(Integer, ForeignKey("admin_users.id", ondelete="CASCADE"), nullable=False)
    marked_time = Column(DateTime, default=datetime.utcnow)
    attendance_status = Column(String(50), default="present")  # present, absent, delayed
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_gps_verified = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    version = Column(Integer, default=1, nullable=False)

    __mapper_args__ = {
        "version_id_col": version
    }

    site_visit = relationship("SiteVisit", back_populates="attendance")
    sales_executive = relationship("AdminUser", foreign_keys=[sales_executive_id])


class SiteVisitAudit(Base):
    __tablename__ = "site_visit_audits"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True)
    site_visit_id = Column(Integer, ForeignKey("site_visits.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(100), nullable=False)  # create, update, delete, check-in, check-out
    field_name = Column(String(100), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    version = Column(Integer, default=1, nullable=False)

    __mapper_args__ = {
        "version_id_col": version
    }

    site_visit = relationship("SiteVisit", back_populates="audits")


class SiteVisitNotification(Base):
    __tablename__ = "site_visit_notifications"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True)
    site_visit_id = Column(Integer, ForeignKey("site_visits.id", ondelete="CASCADE"), nullable=False)
    recipient_type = Column(String(50), nullable=False)  # customer, executive, manager
    delivery_channel = Column(String(50), nullable=False)  # email, sms, whatsapp, push
    notification_type = Column(String(100), nullable=False)  # confirmation, reschedule_alert, cancellation_alert
    sent_at = Column(DateTime, default=datetime.utcnow)
    message_content = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    version = Column(Integer, default=1, nullable=False)

    __mapper_args__ = {
        "version_id_col": version
    }

    site_visit = relationship("SiteVisit", back_populates="notifications")
