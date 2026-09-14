from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from server.config.database import get_db
from server.core.security import decode_token
from server.models.user import User
from server.models.admin import AdminUser
from server.core.rbac import AdminRoleEnum, AdminPermissionEnum

security = HTTPBearer()


# ── Customer Auth Dependencies (unchanged) ──────────────────────────────────

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_role(role: str):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {role}",
            )
        return current_user
    return role_checker


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db),
) -> User | None:
    if credentials is None:
        return None
    token = credentials.credentials
    payload = decode_token(token)
    if payload is None:
        return None
    user_id = payload.get("sub")
    if user_id is None:
        return None
    return db.query(User).filter(User.id == user_id, User.is_active == True).first()


# ── Admin Auth Dependencies ─────────────────────────────────────────────────

def get_current_admin_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> tuple[User, AdminUser]:
    """
    Validates a Bearer token issued by the admin login endpoint.
    The JWT must contain 'admin_role' claim.
    Returns a (User, AdminUser) tuple.
    """
    token = credentials.credentials
    payload = decode_token(token)

    if payload is None or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Must be an admin-issued token
    if payload.get("role") != "admin" or not payload.get("admin_role"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin portal only.",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    admin = (
        db.query(AdminUser)
        .filter(AdminUser.user_id == user_id, AdminUser.is_active == True)
        .first()
    )
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin profile not found. Contact a Super Admin.",
        )

    return user, admin


def require_admin_role(*allowed_roles: AdminRoleEnum):
    """
    Dependency factory. Ensures the authenticated admin has one of the allowed roles.

    Usage:
        @router.get("/...", dependencies=[Depends(require_admin_role(AdminRoleEnum.SUPER_ADMIN))])
    """
    def checker(
        admin_ctx: tuple[User, AdminUser] = Depends(get_current_admin_user),
    ) -> tuple[User, AdminUser]:
        _, admin = admin_ctx
        role_name = admin.role_rel.name if admin.role_rel else None
        allowed = {r.value for r in allowed_roles}
        if role_name not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed)}",
            )
        return admin_ctx
    return checker


def require_permission(permission: AdminPermissionEnum):
    """
    Dependency factory. Checks the JWT 'permissions' claim for the required permission.
    'manage_all' always passes.

    Usage:
        @router.get("/...", dependencies=[Depends(require_permission(AdminPermissionEnum.MANAGE_PROPERTIES))])
    """
    def checker(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db),
    ) -> tuple[User, AdminUser]:
        token = credentials.credentials
        payload = decode_token(token)

        if payload is None or payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )

        user_permissions: list[str] = payload.get("permissions", [])

        # manage_all bypasses all permission checks
        if AdminPermissionEnum.MANAGE_ALL.value in user_permissions:
            return get_current_admin_user(credentials=credentials, db=db)

        if permission.value not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required: {permission.value}",
            )
        return get_current_admin_user(credentials=credentials, db=db)
    return checker


# Alias for backward compatibility / succinct import
get_current_admin = get_current_admin_user

