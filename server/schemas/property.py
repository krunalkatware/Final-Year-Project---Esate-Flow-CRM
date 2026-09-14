from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PropertyImageOut(BaseModel):
    id: int
    url: str
    caption: Optional[str] = None
    is_primary: bool = False
    sort_order: int = 0

    model_config = {"from_attributes": True}


class AmenityOut(BaseModel):
    id: int
    name: str
    icon: Optional[str] = None
    category: Optional[str] = None

    model_config = {"from_attributes": True}


class BuilderOut(BaseModel):
    id: int
    name: str
    logo_url: Optional[str] = None
    rating: float
    total_projects: int
    delivered_projects: int
    headquarters: Optional[str] = None
    established_year: Optional[int] = None
    is_verified: bool = True

    model_config = {"from_attributes": True}


class CityOut(BaseModel):
    id: int
    name: str
    state: str

    model_config = {"from_attributes": True}


class PropertyListItem(BaseModel):
    id: int
    name: str
    slug: str
    property_type: str
    status: str
    locality: Optional[str] = None
    city: Optional[str] = None
    builder_name: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area_sqft: Optional[float] = None
    price: int
    price_per_sqft: Optional[float] = None
    possession_date: Optional[str] = None
    rating: float
    review_count: int
    is_featured: bool
    primary_image: Optional[str] = None
    expected_roi: Optional[float] = None

    model_config = {"from_attributes": True}


class PropertyDetail(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    property_type: str
    status: str
    locality: Optional[str] = None
    full_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    pincode: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area_sqft: Optional[float] = None
    total_floors: Optional[int] = None
    floor_number: Optional[int] = None
    parking_spots: int = 1
    facing: Optional[str] = None
    furnishing: Optional[str] = None
    price: int
    price_per_sqft: Optional[float] = None
    maintenance_monthly: Optional[int] = None
    possession_date: Optional[str] = None
    rating: float
    review_count: int
    view_count: int
    is_featured: bool
    is_verified: bool
    rera_number: Optional[str] = None
    expected_roi: Optional[float] = None
    created_at: datetime
    images: List[PropertyImageOut] = []
    amenity_names: List[str] = []
    builder: Optional[BuilderOut] = None
    city: Optional[CityOut] = None

    model_config = {"from_attributes": True}


class PropertyFilter(BaseModel):
    city: Optional[str] = None
    min_price: Optional[int] = None
    max_price: Optional[int] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    property_type: Optional[str] = None
    builder_id: Optional[int] = None
    status: Optional[str] = None
    min_area: Optional[float] = None
    max_area: Optional[float] = None
    search: Optional[str] = None
    sort_by: Optional[str] = "created_at"
    sort_order: Optional[str] = "desc"
    page: int = 1
    limit: int = 12


class PropertyListResponse(BaseModel):
    items: List[PropertyListItem]
    total: int
    page: int
    limit: int
    pages: int
