"""
Admin Authentication Router for EstateFlow.

All endpoints are prefixed with /api/admin/auth
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from server.config.database import get_db
from server.services.admin_auth_service import AdminAuthService
from server.schemas.admin_auth import AdminLoginRequest, AdminRefreshRequest, AdminTokenResponse, AdminUserOut
from server.core.dependencies import get_current_admin_user
from server.models.user import User
from server.models.admin import AdminUser

router = APIRouter(prefix="/api/admin/auth", tags=["Admin Authentication"])


@router.post("/login", response_model=AdminTokenResponse, summary="Admin Login")
def admin_login(data: AdminLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate an admin user and return JWT access + refresh tokens.
    The access token embeds: role='admin', admin_role, and permissions[].
    """
    service = AdminAuthService(db)
    return service.login(data.email, data.password)


@router.post("/google", response_model=AdminTokenResponse, summary="Admin Google OAuth Login")
def admin_google_auth(data: dict, db: Session = Depends(get_db)):
    """
    Authenticate or auto-provision an admin user via Google OAuth 2.0.
    """
    class Struct:
        def __init__(self, **entries):
            self.__dict__.update(entries)
    service = AdminAuthService(db)
    return service.google_auth(Struct(**data))



@router.post("/refresh", response_model=AdminTokenResponse, summary="Refresh Admin Token")
def admin_refresh(data: AdminRefreshRequest, db: Session = Depends(get_db)):
    """
    Rotate the refresh token and issue a new access+refresh token pair.
    Old refresh token is invalidated.
    """
    service = AdminAuthService(db)
    return service.refresh(data.refresh_token)


@router.post("/logout", summary="Admin Logout")
def admin_logout(
    data: AdminRefreshRequest,
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """
    Invalidate the session tied to the provided refresh token.
    Requires a valid access token in the Authorization header.
    """
    user, _ = admin_ctx
    service = AdminAuthService(db)
    service.logout(data.refresh_token, user.id)
    return {"success": True, "message": "Logged out successfully"}


@router.get("/me", response_model=AdminUserOut, summary="Current Admin User")
def admin_me(
    admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """
    Return the authenticated admin's profile, role, and resolved permissions.
    """
    user, _ = admin_ctx
    service = AdminAuthService(db)
    return service.get_me(user.id)
