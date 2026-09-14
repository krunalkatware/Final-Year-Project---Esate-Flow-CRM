from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import or_, and_, desc, asc, func
from typing import List, Optional, Tuple
from server.models.property import Property, PropertyImage, PropertyType, PropertyStatus
from server.models.builder import Builder
from server.models.city import City
from server.models.amenity import PropertyAmenity, Amenity
from server.schemas.property import PropertyFilter


class PropertyRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, property_id: int) -> Optional[Property]:
        return (
            self.db.query(Property)
            .options(
                selectinload(Property.images),
                selectinload(Property.amenities).joinedload(PropertyAmenity.amenity),
                joinedload(Property.builder_rel),
                joinedload(Property.city_rel),
            )
            .filter(Property.id == property_id, Property.is_active == True)
            .first()
        )

    def get_by_slug(self, slug: str) -> Optional[Property]:
        return (
            self.db.query(Property)
            .options(
                selectinload(Property.images),
                selectinload(Property.amenities).joinedload(PropertyAmenity.amenity),
                joinedload(Property.builder_rel),
                joinedload(Property.city_rel),
            )
            .filter(Property.slug == slug, Property.is_active == True)
            .first()
        )

    def list_with_filters(self, filters: PropertyFilter) -> Tuple[List[Property], int]:
        query = (
            self.db.query(Property)
            .outerjoin(Property.city_rel)
            .outerjoin(Property.builder_rel)
            .options(
                selectinload(Property.images),
                joinedload(Property.city_rel),
                joinedload(Property.builder_rel),
            )
            .filter(Property.is_active == True)
        )

        if filters.city:
            query = query.filter(City.name.ilike(f"%{filters.city}%"))
        if filters.min_price:
            query = query.filter(Property.price >= filters.min_price)
        if filters.max_price:
            query = query.filter(Property.price <= filters.max_price)
        if filters.bedrooms:
            query = query.filter(Property.bedrooms == filters.bedrooms)
        if filters.bathrooms:
            query = query.filter(Property.bathrooms == filters.bathrooms)
        if filters.property_type:
            query = query.filter(Property.property_type == filters.property_type)
        if filters.builder_id:
            query = query.filter(Property.builder_id == filters.builder_id)
        if filters.status:
            query = query.filter(Property.status == filters.status)
        if filters.min_area:
            query = query.filter(Property.area_sqft >= filters.min_area)
        if filters.max_area:
            query = query.filter(Property.area_sqft <= filters.max_area)
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(
                    Property.name.ilike(search_term),
                    Property.locality.ilike(search_term),
                    City.name.ilike(search_term),
                    Builder.name.ilike(search_term),
                )
            )

        total = query.count()

        sort_col = getattr(Property, filters.sort_by, Property.created_at)
        if filters.sort_order == "asc":
            query = query.order_by(asc(sort_col))
        else:
            query = query.order_by(desc(sort_col))

        offset = (filters.page - 1) * filters.limit
        items = query.offset(offset).limit(filters.limit).all()
        return items, total

    def increment_view_count(self, property_id: int):
        self.db.query(Property).filter(Property.id == property_id).update(
            {Property.view_count: Property.view_count + 1}
        )
        self.db.flush()

    def get_featured(self, limit: int = 6) -> List[Property]:
        return (
            self.db.query(Property)
            .options(selectinload(Property.images), joinedload(Property.city_rel), joinedload(Property.builder_rel))
            .filter(Property.is_featured == True, Property.is_active == True)
            .order_by(desc(Property.rating))
            .limit(limit)
            .all()
        )
