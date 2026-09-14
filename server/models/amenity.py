from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from server.config.database import Base


class Amenity(Base):
    __tablename__ = "amenities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)
    icon = Column(String(100), nullable=True)
    category = Column(String(100), nullable=True)  # Sports, Recreation, Security, etc.
    is_active = Column(Boolean, default=True)

    property_amenities = relationship("PropertyAmenity", back_populates="amenity")


class PropertyAmenity(Base):
    __tablename__ = "property_amenities"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    amenity_id = Column(Integer, ForeignKey("amenities.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    property = relationship("Property", back_populates="amenities")
    amenity = relationship("Amenity", back_populates="property_amenities")
