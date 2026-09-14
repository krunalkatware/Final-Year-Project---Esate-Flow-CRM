import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from server.config.database import Base


class LeadStage(str, enum.Enum):
    new = "new"
    contacted = "contacted"
    interested = "interested"
    site_visit_scheduled = "site_visit_scheduled"
    negotiation = "negotiation"
    booking_requested = "booking_requested"
    booked = "booked"
    lost = "lost"
    closed = "closed"


class LeadSource(str, enum.Enum):
    website = "website"
    google_ads = "google_ads"
    facebook_ads = "facebook_ads"
    instagram = "instagram"
    referral = "referral"
    builder = "builder"
    walk_in = "walk_in"
    phone_call = "phone_call"
    whatsapp = "whatsapp"
    manual_entry = "manual_entry"
    csv_import = "csv_import"
    api = "api"


class LeadPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    hot = "hot"
    vip = "vip"


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True)
    lead_number = Column(String(50), unique=True, index=True)
    
    # Customer Relationship
    customer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Prospect Information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=True)
    email = Column(String(150), index=True, nullable=True)
    phone = Column(String(20), index=True, nullable=False)
    alternate_phone = Column(String(20), nullable=True)
    occupation = Column(String(100), nullable=True)
    
    # Requirements & Preferences
    city = Column(String(100), nullable=True)
    locality = Column(String(150), nullable=True)
    budget_min = Column(Float, nullable=True)
    budget_max = Column(Float, nullable=True)
    preferred_bhk = Column(String(50), nullable=True)
    preferred_property_type = Column(String(50), nullable=True)
    buying_timeline = Column(String(50), nullable=True) # e.g. Immediate, 3 Months, 6 Months
    investment_purpose = Column(String(50), nullable=True) # End Use, Investment
    
    # Associated Property / Builder
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="SET NULL"), nullable=True)
    builder_id = Column(Integer, ForeignKey("builders.id", ondelete="SET NULL"), nullable=True)
    
    # CRM Pipeline State
    stage = Column(SQLEnum(LeadStage), default=LeadStage.new, index=True, nullable=False)
    source = Column(SQLEnum(LeadSource), default=LeadSource.website, index=True, nullable=False)
    priority = Column(SQLEnum(LeadPriority), default=LeadPriority.medium, index=True, nullable=False)
    
    lead_score = Column(Integer, default=50)
    estimated_deal_value = Column(Float, default=0.0)
    loss_reason = Column(String(255), nullable=True)
    notes_summary = Column(Text, nullable=True)
    
    # Assignment & Ownership
    assigned_to_id = Column(Integer, ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True)
    
    # Status & Audit Trail
    is_active = Column(Boolean, default=True)
    is_archived = Column(Boolean, default=False)
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customer = relationship("User", foreign_keys=[customer_id])
    property_rel = relationship("Property", foreign_keys=[property_id])
    builder_rel = relationship("Builder", foreign_keys=[builder_id])
    assigned_agent = relationship("AdminUser", foreign_keys=[assigned_to_id])
    
    activities = relationship("LeadActivity", back_populates="lead", cascade="all, delete-orphan", order_by="desc(LeadActivity.created_at)")
    notes = relationship("LeadNote", back_populates="lead", cascade="all, delete-orphan", order_by="desc(LeadNote.created_at)")
    reminders = relationship("LeadReminder", back_populates="lead", cascade="all, delete-orphan", order_by="LeadReminder.due_date")
    stage_history = relationship("LeadStageHistory", back_populates="lead", cascade="all, delete-orphan", order_by="desc(LeadStageHistory.created_at)")
    documents = relationship("LeadDocument", back_populates="lead", cascade="all, delete-orphan")


class LeadActivity(Base):
    __tablename__ = "lead_activities"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    activity_type = Column(String(50), nullable=False) # call, email, whatsapp, meeting, site_visit, note, stage_change, assignment
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    performed_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    lead = relationship("Lead", back_populates="activities")


class LeadNote(Base):
    __tablename__ = "lead_notes"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    is_pinned = Column(Boolean, default=False)
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    lead = relationship("Lead", back_populates="notes")


class LeadStageHistory(Base):
    __tablename__ = "lead_stage_history"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    old_stage = Column(String(50), nullable=True)
    new_stage = Column(String(50), nullable=False)
    changed_by = Column(String(100), nullable=True)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    lead = relationship("Lead", back_populates="stage_history")


class LeadReminder(Base):
    __tablename__ = "lead_reminders"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    reminder_type = Column(String(50), default="call") # call, meeting, visit, email, follow_up
    due_date = Column(DateTime, nullable=False)
    status = Column(String(20), default="pending") # pending, completed, cancelled, snoozed
    notes = Column(Text, nullable=True)
    assigned_to = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    lead = relationship("Lead", back_populates="reminders")


class LeadDocument(Base):
    __tablename__ = "lead_documents"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    document_type = Column(String(50), nullable=True) # kyc, offer_letter, booking_form, pan_card, identity
    document_url = Column(String(500), nullable=False)
    uploaded_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    lead = relationship("Lead", back_populates="documents")
