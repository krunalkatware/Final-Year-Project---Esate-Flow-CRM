from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class WishlistAdd(BaseModel):
    property_id: int


class WishlistItemOut(BaseModel):
    id: int
    property_id: int
    property_name: Optional[str] = None
    property_locality: Optional[str] = None
    property_city: Optional[str] = None
    property_price: Optional[int] = None
    property_image: Optional[str] = None
    property_bedrooms: Optional[int] = None
    property_bathrooms: Optional[int] = None
    property_area_sqft: Optional[float] = None
    property_status: Optional[str] = None
    property_builder: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
