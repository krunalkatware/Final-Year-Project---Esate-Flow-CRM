from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from server.config.database import get_db
from server.services.auth_service import AuthService
from server.schemas.auth import (
    RegisterRequest, LoginRequest, RefreshRequest,
    ForgotPasswordRequest, ResetPasswordRequest,
    ChangePasswordRequest, GoogleAuthRequest,
)
from server.core.dependencies import get_current_user
from server.models.user import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.register(data)


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.login(data)


@router.get("/google/config")
def get_google_auth_config():
    """
    Returns public Google OAuth configuration for the frontend client.
    Exposes only client_id, never GOOGLE_CLIENT_SECRET.
    """
    from server.config.settings import settings
    return {
        "configured": settings.google_oauth_configured,
        "client_id": settings.GOOGLE_CLIENT_ID if settings.google_oauth_configured else None,
    }


@router.post("/google")
def google_auth(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.google_auth(data)


@router.post("/refresh")
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.refresh(data.refresh_token)


@router.post("/logout")
def logout(
    data: RefreshRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    service.logout(data.refresh_token, current_user.id)
    return {"message": "Logged out successfully"}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    customer = current_user.customer
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "first_name": customer.first_name if customer else "",
        "last_name": customer.last_name if customer else "",
        "avatar_url": customer.avatar_url if customer else None,
    }


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Request a password reset link. Returns success even if email not found (security)."""
    service = AuthService(db)
    service.forgot_password(data.email)
    return {"message": "If this email is registered, a reset link has been sent.", "success": True}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using a valid reset token."""
    service = AuthService(db)
    service.reset_password(data.token, data.new_password)
    return {"message": "Password reset successfully. Please log in.", "success": True}


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change password for the currently authenticated user."""
    service = AuthService(db)
    service.change_password(current_user.id, data.current_password, data.new_password)
    return {"message": "Password changed successfully.", "success": True}
