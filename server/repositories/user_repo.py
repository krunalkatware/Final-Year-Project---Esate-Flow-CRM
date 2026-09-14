from sqlalchemy.orm import Session
from typing import Optional
from server.models.user import User
from server.models.customer import Customer
from server.core.security import get_password_hash


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: str) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def create(
        self, email: str, password: str, role: str = "customer", full_name: Optional[str] = None, phone: Optional[str] = None
    ) -> User:
        from server.models.user import UserRole
        if isinstance(role, str):
            try:
                role_enum = UserRole(role)
            except ValueError:
                role_enum = UserRole.customer
        else:
            role_enum = role

        user = User(
            email=email.lower().strip(),
            password_hash=get_password_hash(password),
            role=role_enum,
            full_name=full_name,
            phone=phone,
        )
        self.db.add(user)
        self.db.flush()
        return user

    def create_customer_profile(
        self, user_id: str, first_name: str, last_name: str, phone: Optional[str] = None, avatar_url: Optional[str] = None
    ) -> Customer:
        customer = Customer(
            user_id=user_id,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            avatar_url=avatar_url,
        )
        self.db.add(customer)
        self.db.flush()
        return customer

    def update_customer(self, customer: Customer, data: dict) -> Customer:
        for key, value in data.items():
            if value is not None and hasattr(customer, key):
                setattr(customer, key, value)
        self.db.flush()
        return customer

    def deactivate(self, user: User) -> User:
        user.is_active = False
        self.db.flush()
        return user
