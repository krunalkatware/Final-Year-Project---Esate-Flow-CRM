from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from server.config.database import Base


class NotificationType(str, enum.Enum):
    booking_confirmed = "booking_confirmed"
    booking_cancelled = "booking_cancelled"
    visit_reminder = "visit_reminder"
    property_update = "property_update"
    system = "system"
    promotion = "promotion"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(300), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(SAEnum(NotificationType), default=NotificationType.system)
    is_read = Column(Boolean, default=False)
    action_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")
