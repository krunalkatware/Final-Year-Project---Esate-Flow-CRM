from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import List, Optional
from server.models.wishlist import Wishlist
from server.models.property import Property, PropertyImage
from server.models.city import City
from server.models.builder import Builder


class WishlistRepository:
    def __init__(self, db: Session):
        self.db = db

    def add(self, user_id: int, property_id: int) -> Optional[Wishlist]:
        existing = self.db.query(Wishlist).filter(
            Wishlist.user_id == user_id, Wishlist.property_id == property_id
        ).first()
        if existing:
            return existing
        item = Wishlist(user_id=user_id, property_id=property_id)
        self.db.add(item)
        self.db.flush()
        return item

    def remove(self, user_id: int, property_id: int) -> bool:
        item = self.db.query(Wishlist).filter(
            Wishlist.user_id == user_id, Wishlist.property_id == property_id
        ).first()
        if item:
            self.db.delete(item)
            self.db.flush()
            return True
        return False

    def get_by_user(self, user_id: int) -> List[Wishlist]:
        return (
            self.db.query(Wishlist)
            .options(
                joinedload(Wishlist.property).joinedload(Property.images),
                joinedload(Wishlist.property).joinedload(Property.city_rel),
                joinedload(Wishlist.property).joinedload(Property.builder_rel),
            )
            .filter(Wishlist.user_id == user_id)
            .order_by(desc(Wishlist.created_at))
            .all()
        )

    def is_wishlisted(self, user_id: int, property_id: int) -> bool:
        return (
            self.db.query(Wishlist)
            .filter(Wishlist.user_id == user_id, Wishlist.property_id == property_id)
            .count()
            > 0
        )

    def get_wishlisted_ids(self, user_id: int) -> List[int]:
        results = self.db.query(Wishlist.property_id).filter(Wishlist.user_id == user_id).all()
        return [r[0] for r in results]
