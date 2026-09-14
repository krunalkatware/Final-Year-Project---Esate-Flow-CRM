from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from server.config.database import get_db
from server.core.dependencies import get_current_user
from server.repositories.wishlist_repo import WishlistRepository
from server.models.user import User
from server.schemas.wishlist import WishlistAdd

router = APIRouter(prefix="/api/wishlist", tags=["Wishlist"])


def _serialize_wishlist_item(item) -> dict:
    prop = item.property
    primary_image = None
    if prop and prop.images:
        pi = next((img for img in prop.images if img.is_primary), prop.images[0] if prop.images else None)
        primary_image = pi.url if pi else None
    return {
        "id": item.id,
        "property_id": item.property_id,
        "property_name": prop.name if prop else None,
        "property_locality": prop.locality if prop else None,
        "property_city": prop.city_rel.name if prop and prop.city_rel else None,
        "property_price": prop.price if prop else None,
        "property_image": primary_image,
        "property_bedrooms": prop.bedrooms if prop else None,
        "property_bathrooms": prop.bathrooms if prop else None,
        "property_area_sqft": prop.area_sqft if prop else None,
        "property_status": prop.status if prop else None,
        "property_builder": prop.builder_rel.name if prop and prop.builder_rel else None,
        "property_slug": prop.slug if prop else None,
        "property_rating": prop.rating if prop else None,
        "created_at": item.created_at.isoformat() if item.created_at else None,
    }


@router.post("")
def add_to_wishlist(
    data: WishlistAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = WishlistRepository(db)
    item = repo.add(current_user.id, data.property_id)
    
    from server.models.property import Property
    from server.models.notification import Notification, NotificationType
    prop = db.query(Property).filter(Property.id == data.property_id).first()
    
    notif = Notification(
        user_id=current_user.id,
        title="Wishlist Saved",
        message=f"'{prop.name if prop else 'Property'}' has been saved to your wishlist.",
        type=NotificationType.property_update,
        action_url="/dashboard/wishlist",
    )
    db.add(notif)

    db.commit()
    return {"message": "Added to wishlist", "wishlist_id": item.id}


@router.get("")
def get_wishlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = WishlistRepository(db)
    items = repo.get_by_user(current_user.id)
    return [_serialize_wishlist_item(i) for i in items]


@router.delete("/{property_id}")
def remove_from_wishlist(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = WishlistRepository(db)
    removed = repo.remove(current_user.id, property_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Item not in wishlist")
    db.commit()
    return {"message": "Removed from wishlist"}
