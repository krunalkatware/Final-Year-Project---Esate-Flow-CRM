from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from server.config.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(300), nullable=False)
    builder_id = Column(Integer, ForeignKey("builders.id", ondelete="CASCADE"), nullable=False)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=False)
    description = Column(Text, nullable=True)
    total_units = Column(Integer, nullable=True)
    available_units = Column(Integer, nullable=True)
    min_price = Column(Integer, nullable=True)
    max_price = Column(Integer, nullable=True)
    possession_date = Column(String(50), nullable=True)
    rera_number = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    builder_rel = relationship("Builder", back_populates="projects")
    city_rel = relationship("City", back_populates="projects")
    properties = relationship("Property", back_populates="project_rel")
