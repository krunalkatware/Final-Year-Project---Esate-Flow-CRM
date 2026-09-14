"""
Pydantic schemas for Admin Authentication & RBAC.
"""
from pydantic import BaseModel, EmailStr
from typing import List, Optional


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminRefreshRequest(BaseModel):
    refresh_token: str


class AdminUserOut(BaseModel):
    id: str
    email: str
    full_name: str
    first_name: str
    last_name: str
    admin_role: str          # e.g., "super_admin"
    admin_role_display: str  # e.g., "Super Admin"
    permissions: List[str]   # e.g., ["manage_all", "manage_properties"]
    department: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class AdminTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: AdminUserOut
