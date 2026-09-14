from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from server.config.database import Base


class Builder(Base):
    __tablename__ = "builders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False, index=True)
    company_name = Column(String(200), nullable=True)
    slug = Column(String(250), unique=True, nullable=True, index=True)
    logo_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    
    # Registration & Tax Details
    registration_number = Column(String(100), nullable=True)
    rera_number = Column(String(100), nullable=True)
    gst_number = Column(String(50), nullable=True)
    pan_number = Column(String(50), nullable=True)
    established_year = Column(Integer, nullable=True)
    company_type = Column(String(100), default="Private Limited")  # Private Limited, Public Limited, Partnership, Sole Proprietorship

    # Contact & Links
    website = Column(String(300), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    alternate_phone = Column(String(20), nullable=True)

    # Location
    country = Column(String(100), default="India")
    state = Column(String(100), default="Maharashtra")
    city = Column(String(100), default="Mumbai")
    address = Column(Text, nullable=True)
    pincode = Column(String(10), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    headquarters = Column(String(200), nullable=True)

    # Stats & Status
    total_projects = Column(Integer, default=0)
    delivered_projects = Column(Integer, default=0)
    rating = Column(Float, default=4.5)
    status = Column(String(50), default="active")  # active, inactive
    verification_status = Column(String(50), default="verified")  # pending, verified, rejected
    is_verified = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)

    # Audit
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    verified_by = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    properties = relationship("Property", back_populates="builder_rel", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="builder_rel", cascade="all, delete-orphan")
    contacts = relationship("BuilderContact", back_populates="builder", cascade="all, delete-orphan")
    documents = relationship("BuilderDocument", back_populates="builder", cascade="all, delete-orphan")
    builder_projects = relationship("BuilderProject", back_populates="builder", cascade="all, delete-orphan")


class BuilderContact(Base):
    __tablename__ = "builder_contacts"

    id = Column(Integer, primary_key=True, index=True)
    builder_id = Column(Integer, ForeignKey("builders.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False)
    designation = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    builder = relationship("Builder", back_populates="contacts")


class BuilderDocument(Base):
    __tablename__ = "builder_documents"

    id = Column(Integer, primary_key=True, index=True)
    builder_id = Column(Integer, ForeignKey("builders.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String(100), nullable=False)  # RERA Certificate, Registration Certificate, GST Certificate, Company PAN, Legal Documents, Other
    document_name = Column(String(200), nullable=False)
    document_url = Column(String(500), nullable=False)
    verification_status = Column(String(50), default="verified")
    uploaded_by = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    builder = relationship("Builder", back_populates="documents")


class BuilderProject(Base):
    __tablename__ = "builder_projects"

    id = Column(Integer, primary_key=True, index=True)
    builder_id = Column(Integer, ForeignKey("builders.id", ondelete="CASCADE"), nullable=False)
    project_name = Column(String(200), nullable=False)
    location = Column(String(200), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    status = Column(String(50), default="Ongoing")  # Ongoing, Completed, Upcoming
    description = Column(Text, nullable=True)
    launch_date = Column(DateTime(timezone=True), nullable=True)
    completion_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    builder = relationship("Builder", back_populates="builder_projects")
