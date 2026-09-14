from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import desc
from typing import List, Optional
import uuid
from server.models.booking import Booking, BookingStatus
from server.models.property import Property, PropertyImage
from server.models.city import City
from server.schemas.booking import BookingCreate, BookingUpdate


def generate_booking_number() -> str:
    return f"EF{uuid.uuid4().hex[:8].upper()}"


class BookingRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user_id: str, data: BookingCreate) -> Booking:
        from server.models.booking import BookingDocument, BookingTimeline

        booking = Booking(
            booking_number=generate_booking_number(),
            customer_id=user_id,
            property_id=data.property_id,
            customer_name=data.customer_name,
            customer_email=data.customer_email,
            customer_phone=data.customer_phone,
            customer_address=data.customer_address,
            preferred_visit_date=data.preferred_visit_date,
            visit_time_slot=data.visit_time_slot,
            special_requirements=data.special_requirements,
            status=BookingStatus.PAYMENT_PENDING,
        )
        self.db.add(booking)
        self.db.flush()

        # Attach KYC Documents if provided
        if data.documents:
            for doc in data.documents:
                doc_type = doc.get("document_type") or doc.get("key") or "kyc"
                title = doc.get("title") or doc.get("label") or doc_type.replace("_", " ").title()
                fname = doc.get("file_name") or f"{doc_type}.pdf"
                furl = doc.get("file_url") or doc.get("url") or ""
                b_doc = BookingDocument(
                    booking_id=booking.id,
                    customer_id=user_id,
                    property_id=data.property_id,
                    document_type=doc_type,
                    title=title,
                    file_name=fname,
                    file_url=furl,
                    mime_type=doc.get("mime_type", "application/pdf"),
                    file_size_bytes=doc.get("file_size_bytes", 0),
                    status="pending",
                    is_verified=False,
                )
                self.db.add(b_doc)

        # Create Timeline Entry
        tl = BookingTimeline(
            booking_id=booking.id,
            event_type="booking_created",
            title="Booking Initiated",
            description=f"Booking #{booking.booking_number} initiated for property ID {booking.property_id}.",
            performed_by=data.customer_name or "Customer",
        )
        self.db.add(tl)
        self.db.flush()
        return booking


    def get_by_user(self, user_id: str) -> List[Booking]:
        return (
            self.db.query(Booking)
            .options(
                joinedload(Booking.property).joinedload(Property.city_rel),
                joinedload(Booking.property).selectinload(Property.images),
            )
            .filter(Booking.customer_id == user_id)
            .order_by(desc(Booking.created_at))
            .all()
        )

    def get_by_id(self, booking_id: int, user_id: str) -> Optional[Booking]:
        return (
            self.db.query(Booking)
            .filter(Booking.id == booking_id, Booking.customer_id == user_id)
            .first()
        )

    def update(self, booking: Booking, data: BookingUpdate) -> Booking:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(booking, key, value)
        self.db.flush()
        return booking

    def cancel(self, booking: Booking) -> Booking:
        booking.status = BookingStatus.cancelled
        self.db.flush()
        return booking
