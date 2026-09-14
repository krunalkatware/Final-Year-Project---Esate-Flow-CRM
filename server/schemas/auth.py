from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
import re


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("first_name", "last_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    is_active: bool
    is_verified: bool

    model_config = {"from_attributes": True}


class CustomerResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    city: Optional[str] = None

    model_config = {"from_attributes": True}


class GoogleAuthRequest(BaseModel):
    """
    Google OAuth sign-in payload.
    
    When `credential`, `google_id_token`, or `id_token` is provided, the backend
    verifies it with Google's public tokeninfo API (requires GOOGLE_CLIENT_ID to be set in .env).
    
    Fields `email`, `first_name`, `last_name`, `avatar_url` are used as
    overrides / fallbacks only if token verification returns incomplete data.
    """
    credential: Optional[str] = None  # Google Identity Services (GIS) standard credential string
    google_id_token: Optional[str] = None  # Google ID token from frontend OAuth flow
    id_token: Optional[str] = None  # Alias
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None



# ── Password Management Schemas ───────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def new_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("New password must be at least 8 characters")
        return v
