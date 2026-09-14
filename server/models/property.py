from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean, Float,
    ForeignKey, Enum as SAEnum, BigInteger
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from server.config.database import Base


class PropertyType(str, enum.Enum):
    apartment = "apartment"
    villa = "villa"
    penthouse = "penthouse"
    plot = "plot"
    commercial = "commercial"
    studio = "studio"


class PropertyStatus(str, enum.Enum):
    available = "available"
    reserved = "reserved"
    booked = "booked"
    sold = "sold"
    archived = "archived"


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(300), nullable=False, index=True)
    slug = Column(String(350), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    purpose = Column(String(50), default="Sale")  # Sale, Rent, Lease
    property_type = Column(SAEnum(PropertyType), nullable=False, default=PropertyType.apartment)
    status = Column(SAEnum(PropertyStatus), nullable=False, default=PropertyStatus.available)

    # Location
    country = Column(String(100), default="India")
    state = Column(String(100), default="Maharashtra")
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=False)
    locality = Column(String(200), nullable=True)
    full_address = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    pincode = Column(String(10), nullable=True)

    # Builder & Project
    builder_id = Column(Integer, ForeignKey("builders.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)

    # Specs & Configuration
    bhk = Column(Integer, nullable=True)
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Integer, nullable=True)
    balconies = Column(Integer, default=1)
    floor_number = Column(Integer, nullable=True)
    total_floors = Column(Integer, nullable=True)
    carpet_area = Column(Float, nullable=True)
    builtup_area = Column(Float, nullable=True)
    super_builtup_area = Column(Float, nullable=True)
    plot_area = Column(Float, nullable=True)
    area_sqft = Column(Float, nullable=True)
    parking_spots = Column(Integer, default=1)
    facing = Column(String(50), nullable=True)
    furnishing = Column(String(50), nullable=True)
    ownership = Column(String(100), default="Freehold")
    property_age = Column(String(50), default="New Construction")

    # Pricing & Financials
    price = Column(BigInteger, nullable=False)  # in INR
    offer_price = Column(BigInteger, nullable=True)
    price_per_sqft = Column(Float, nullable=True)
    maintenance_monthly = Column(Integer, nullable=True)
    booking_amount = Column(BigInteger, nullable=True)
    estimated_emi = Column(BigInteger, nullable=True)

    # Dates
    possession_date = Column(String(50), nullable=True)  # e.g. "Dec 2026" or "Ready to Move"
    launch_date = Column(DateTime(timezone=True), nullable=True)

    # Media & Links
    virtual_tour_url = Column(String(500), nullable=True)
    video_url = Column(String(500), nullable=True)
    floor_plan_url = Column(String(500), nullable=True)

    # Stats & Status Flags
    rating = Column(Float, default=4.2)
    review_count = Column(Integer, default=0)
    view_count = Column(Integer, default=0)
    is_featured = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=True)
    is_published = Column(Boolean, default=True)
    is_archived = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    # Legal & Compliance
    rera_number = Column(String(100), nullable=True)
    expected_roi = Column(Float, nullable=True)  # percentage

    # Audit tracking
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    published_by = Column(String(100), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    city_rel = relationship("City", back_populates="properties")
    builder_rel = relationship("Builder", back_populates="properties")
    project_rel = relationship("Project", back_populates="properties")
    images = relationship("PropertyImage", back_populates="property", cascade="all, delete-orphan")
    documents = relationship("PropertyDocument", back_populates="property", cascade="all, delete-orphan")
    highlights_rel = relationship("PropertyHighlight", back_populates="property", cascade="all, delete-orphan")
    nearby_locations_rel = relationship("NearbyLocation", back_populates="property", cascade="all, delete-orphan")
    status_history = relationship("PropertyStatusHistory", back_populates="property", cascade="all, delete-orphan")
    amenities = relationship("PropertyAmenity", back_populates="property", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="property", cascade="all, delete-orphan")
    wishlists = relationship("Wishlist", back_populates="property", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="property", cascade="all, delete-orphan")
    site_visits = relationship("SiteVisit", back_populates="property", cascade="all, delete-orphan")


class PropertyImage(Base):
    __tablename__ = "property_images"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    url = Column(String(500), nullable=False)
    caption = Column(String(200), nullable=True)
    is_primary = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    property = relationship("Property", back_populates="images")


class PropertyDocument(Base):
    __tablename__ = "property_documents"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    file_url = Column(String(500), nullable=False)
    file_type = Column(String(50), default="PDF")
    file_size = Column(String(50), nullable=True)
    category = Column(String(50), default="legal")  # brochure, floorplan, masterplan, legal
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    property = relationship("Property", back_populates="documents")


class PropertyHighlight(Base):
    __tablename__ = "property_highlights"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(String(300), nullable=True)
    icon_name = Column(String(50), default="Sparkles")

    property = relationship("Property", back_populates="highlights_rel")


class NearbyLocation(Base):
    __tablename__ = "property_nearby_locations"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=False)  # School, Hospital, Metro, Airport, Mall
    name = Column(String(200), nullable=False)
    distance = Column(String(50), nullable=False)

    property = relationship("Property", back_populates="nearby_locations_rel")


class PropertyStatusHistory(Base):
    __tablename__ = "property_status_history"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    changed_by = Column(String(150), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    property = relationship("Property", back_populates="status_history")
