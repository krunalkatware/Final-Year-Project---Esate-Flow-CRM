from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BookingCreate(BaseModel):
    property_id: int
    customer_name: str
    customer_email: str
    customer_phone: str
    customer_address: Optional[str] = None
    pan_number: Optional[str] = None
    aadhaar_number: Optional[str] = None
    preferred_visit_date: Optional[datetime] = None
    visit_time_slot: Optional[str] = None
    special_requirements: Optional[str] = None
    documents: Optional[list[dict]] = None



class BookingUpdate(BaseModel):
    status: Optional[str] = None
    preferred_visit_date: Optional[datetime] = None
    visit_time_slot: Optional[str] = None
    special_requirements: Optional[str] = None
    agent_notes: Optional[str] = None


class BookingOut(BaseModel):
    id: int
    booking_number: str
    property_id: int
    property_name: Optional[str] = None
    property_locality: Optional[str] = None
    property_city: Optional[str] = None
    property_image: Optional[str] = None
    property_price: Optional[int] = None
    status: str
    customer_name: str
    customer_email: str
    customer_phone: str
    preferred_visit_date: Optional[datetime] = None
    visit_time_slot: Optional[str] = None
    special_requirements: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
