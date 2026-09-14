from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date


class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    avatar_url: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    preferred_cities: Optional[str] = None
    preferred_budget_min: Optional[int] = None
    preferred_budget_max: Optional[int] = None
    preferred_property_type: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    class Config:
        min_length = 8


class ProfileOut(BaseModel):
    user_id: int
    email: str
    role: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    avatar_url: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    preferred_cities: Optional[str] = None
    preferred_budget_min: Optional[int] = None
    preferred_budget_max: Optional[int] = None
    preferred_property_type: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SiteVisitCreate(BaseModel):
    property_id: int
    visit_date: datetime
    time_slot: Optional[str] = None
    notes: Optional[str] = None


class SiteVisitOut(BaseModel):
    id: int
    property_id: int
    property_name: Optional[str] = None
    property_image: Optional[str] = None
    property_locality: Optional[str] = None
    property_city: Optional[str] = None
    visit_date: datetime
    time_slot: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    action_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
