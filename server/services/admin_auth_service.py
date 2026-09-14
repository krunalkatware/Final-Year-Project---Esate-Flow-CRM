"""
Admin Authentication Service for EstateFlow.

Handles:
- Role/Permission DB seeding (idempotent)
- Admin user creation (super admin bootstrap)
- Login / Refresh / Logout
- Fetching current admin profile
"""
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from server.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from server.config.settings import settings
from server.models.user import User, Session as UserSession, UserRole
from server.models.admin import Role, Permission, RolePermission, AdminUser
from server.core.rbac import AdminRoleEnum, AdminPermissionEnum, ROLE_PERMISSIONS_MATRIX, ROLE_DISPLAY_NAMES

import uuid


# Metadata for each permission (display name, category)
PERMISSION_META = {
    AdminPermissionEnum.MANAGE_ALL.value:            ("Manage All",          "System"),
    AdminPermissionEnum.MANAGE_PROPERTIES.value:     ("Manage Properties",   "Property"),
    AdminPermissionEnum.MANAGE_BUILDERS.value:       ("Manage Builders",     "Property"),
    AdminPermissionEnum.MANAGE_CUSTOMERS.value:      ("Manage Customers",    "CRM"),
    AdminPermissionEnum.MANAGE_BOOKINGS.value:       ("Manage Bookings",     "Sales"),
    AdminPermissionEnum.MANAGE_REVIEWS.value:        ("Manage Reviews",      "Support"),
    AdminPermissionEnum.MANAGE_REPORTS.value:        ("Manage Reports",      "Analytics"),
    AdminPermissionEnum.MANAGE_LEADS.value:          ("Manage Leads",        "CRM"),
    AdminPermissionEnum.MANAGE_SITE_VISITS.value:    ("Manage Site Visits",  "Sales"),
    AdminPermissionEnum.MANAGE_BOOKING_STATUS.value: ("Manage Booking Status","Sales"),
    AdminPermissionEnum.MANAGE_TICKETS.value:        ("Manage Tickets",      "Support"),
    AdminPermissionEnum.MANAGE_NOTIFICATIONS.value:  ("Manage Notifications","Support"),
}


class AdminAuthService:
    def __init__(self, db: Session):
        self.db = db

    # ── Idempotent DB Seeder ────────────────────────────────────────────────

    def seed_roles_and_permissions(self) -> None:
        """Create roles, permissions, and role-permission mappings if they don't exist."""
        # 1. Upsert Permissions
        perm_map: dict[str, Permission] = {}
        for code, (display_name, category) in PERMISSION_META.items():
            perm = self.db.query(Permission).filter(Permission.code == code).first()
            if not perm:
                perm = Permission(code=code, display_name=display_name, category=category)
                self.db.add(perm)
                self.db.flush()
            perm_map[code] = perm

        # 2. Upsert Roles
        role_map: dict[str, Role] = {}
        for role_value, perm_codes in ROLE_PERMISSIONS_MATRIX.items():
            display = ROLE_DISPLAY_NAMES.get(role_value, role_value.replace("_", " ").title())
            role = self.db.query(Role).filter(Role.name == role_value).first()
            if not role:
                role = Role(name=role_value, display_name=display, is_system=True)
                self.db.add(role)
                self.db.flush()
            role_map[role_value] = role

            # 3. Upsert RolePermissions
            for code in perm_codes:
                perm = perm_map.get(code)
                if not perm:
                    continue
                existing = (
                    self.db.query(RolePermission)
                    .filter(RolePermission.role_id == role.id, RolePermission.permission_id == perm.id)
                    .first()
                )
                if not existing:
                    self.db.add(RolePermission(role_id=role.id, permission_id=perm.id))

        self.db.commit()

    # ── Bootstrap Super Admin ───────────────────────────────────────────────

    def create_super_admin(
        self,
        email: str,
        password: str,
        first_name: str,
        last_name: str,
    ) -> AdminUser:
        """Create the default super admin user. Idempotent — skips if already exists."""
        # Check if user already exists
        existing_user = self.db.query(User).filter(User.email == email).first()
        if existing_user:
            # Check if already an admin
            existing_admin = self.db.query(AdminUser).filter(AdminUser.user_id == existing_user.id).first()
            if existing_admin:
                return existing_admin
            # Promote existing user to admin
            user = existing_user
            user.role = UserRole.admin
        else:
            user = User(
                id=str(uuid.uuid4()),
                email=email,
                password_hash=get_password_hash(password),
                role=UserRole.admin,
                is_active=True,
                is_verified=True,
            )
            self.db.add(user)
            self.db.flush()

        role = self.db.query(Role).filter(Role.name == AdminRoleEnum.SUPER_ADMIN.value).first()
        if not role:
            raise RuntimeError("Roles not seeded yet. Call seed_roles_and_permissions() first.")

        admin = AdminUser(
            user_id=user.id,
            role_id=role.id,
            first_name=first_name,
            last_name=last_name,
            department="Administration",
            is_active=True,
        )
        self.db.add(admin)
        self.db.commit()
        self.db.refresh(admin)
        return admin

    # ── Login ───────────────────────────────────────────────────────────────

    def login(self, email: str, password: str) -> dict:
        user = self.db.query(User).filter(User.email == email).first()
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated",
            )

        # Must be admin role on User table
        if user.role != UserRole.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. This portal is for administrators only.",
            )

        admin = (
            self.db.query(AdminUser)
            .filter(AdminUser.user_id == user.id, AdminUser.is_active == True)
            .first()
        )
        if not admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin profile not found. Contact a Super Admin.",
            )

        permissions = self._get_permissions(admin)
        tokens = self._create_admin_tokens(user, admin, permissions)
        self._save_session(user.id, tokens["refresh_token"])

        user.last_login = datetime.utcnow()
        self.db.commit()
        return tokens

    # ── Google OAuth for Admin ──────────────────────────────────────────────

    def google_auth(self, data) -> dict:
        """Authenticate or auto-provision admin user via Google OAuth 2.0."""
        from server.config.settings import settings

        if not settings.google_oauth_configured:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google authentication is not configured yet. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.",
            )

        token_str = (
            getattr(data, "credential", None)
            or getattr(data, "google_id_token", None)
            or getattr(data, "id_token", None)
        )
        if not token_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google ID token (credential) is required for Google authentication.",
            )

        # Cryptographically verify token with Google
        import httpx
        try:
            with httpx.Client(timeout=5.0) as client:
                resp = client.get(
                    "https://oauth2.googleapis.com/tokeninfo",
                    params={"id_token": token_str},
                )
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Google ID token is invalid or expired. Please sign in again.",
                )
            token_data = resp.json()

            if token_data.get("aud") != settings.GOOGLE_CLIENT_ID:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Google token audience mismatch. Token was not issued for this application.",
                )

            if token_data.get("email_verified") not in (True, "true", "True", 1):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Google email address has not been verified by Google.",
                )

            verified_email = token_data.get("email")
            if not verified_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Google token does not contain a valid email address.",
                )

            verified_first = token_data.get("given_name")
            verified_last = token_data.get("family_name")
            if not verified_first:
                full_name = token_data.get("name", "")
                parts = full_name.split(" ", 1)
                verified_first = parts[0] if parts else (data.first_name or "Admin")
                verified_last = parts[1] if len(parts) > 1 else (data.last_name or "User")

            user_email = verified_email.lower().strip()
            user_first_name = verified_first or "Admin"
            user_last_name = verified_last or "User"
            user_avatar = token_data.get("picture") or data.avatar_url

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Could not verify Google token with Google servers: {str(e)}",
            )

        self.seed_roles_and_permissions()

        # Find or create User
        user = self.db.query(User).filter(User.email == user_email).first()
        import secrets
        if not user:
            user = User(
                email=user_email,
                password_hash=get_password_hash(secrets.token_urlsafe(16)),
                role=UserRole.admin,
                is_active=True,
                is_verified=True,
                avatar_url=user_avatar,
            )
            self.db.add(user)
            self.db.flush()
        else:
            user.role = UserRole.admin
            user.is_verified = True
            if user_avatar:
                user.avatar_url = user_avatar

        # Find or create AdminUser
        admin = self.db.query(AdminUser).filter(AdminUser.user_id == user.id).first()
        if not admin:
            super_admin_role = (
                self.db.query(Role)
                .filter(Role.name == AdminRoleEnum.SUPER_ADMIN.value)
                .first()
            )
            role_id = super_admin_role.id if super_admin_role else 1
            admin = AdminUser(
                user_id=user.id,
                role_id=role_id,
                first_name=user_first_name,
                last_name=user_last_name,
                phone=getattr(data, "phone", None) or "+91 98000 00000",
                department="Management",
                is_active=True,
            )
            self.db.add(admin)
            self.db.flush()

        permissions = self._get_permissions(admin)
        tokens = self._create_admin_tokens(user, admin, permissions)
        self._save_session(user.id, tokens["refresh_token"])

        user.last_login = datetime.utcnow()
        self.db.commit()
        return tokens


    # ── Refresh ─────────────────────────────────────────────────────────────

    def refresh(self, refresh_token: str) -> dict:
        payload = decode_token(refresh_token)
        if payload is None or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        session = (
            self.db.query(UserSession)
            .filter(UserSession.refresh_token == refresh_token, UserSession.is_active == True)
            .first()
        )
        if not session or session.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired. Please log in again.",
            )

        user = self.db.query(User).filter(User.id == payload["sub"]).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

        admin = (
            self.db.query(AdminUser)
            .filter(AdminUser.user_id == user.id, AdminUser.is_active == True)
            .first()
        )
        if not admin:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin profile not found")

        permissions = self._get_permissions(admin)
        tokens = self._create_admin_tokens(user, admin, permissions)

        session.refresh_token = tokens["refresh_token"]
        session.expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        self.db.commit()
        return tokens

    # ── Logout ──────────────────────────────────────────────────────────────

    def logout(self, refresh_token: str, user_id: str) -> None:
        session = (
            self.db.query(UserSession)
            .filter(UserSession.user_id == user_id, UserSession.refresh_token == refresh_token)
            .first()
        )
        if session:
            session.is_active = False
        self.db.commit()

    # ── Get Me ──────────────────────────────────────────────────────────────

    def get_me(self, user_id: str) -> dict:
        user = self.db.query(User).filter(User.id == user_id, User.is_active == True).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        admin = (
            self.db.query(AdminUser)
            .filter(AdminUser.user_id == user_id, AdminUser.is_active == True)
            .first()
        )
        if not admin:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin profile not found")

        permissions = self._get_permissions(admin)
        return self._build_admin_user_dict(user, admin, permissions)

    # ── Private Helpers ─────────────────────────────────────────────────────

    def _get_permissions(self, admin: AdminUser) -> list[str]:
        if not admin.role_rel:
            return []
        return [
            rp.permission.code
            for rp in admin.role_rel.role_permissions
            if rp.permission
        ]

    def _build_admin_user_dict(self, user: User, admin: AdminUser, permissions: list[str]) -> dict:
        role_name = admin.role_rel.name if admin.role_rel else "unknown"
        role_display = admin.role_rel.display_name if admin.role_rel else "Unknown"
        return {
            "id": user.id,
            "email": user.email,
            "full_name": admin.full_name,
            "first_name": admin.first_name,
            "last_name": admin.last_name,
            "admin_role": role_name,
            "admin_role_display": role_display,
            "permissions": permissions,
            "department": admin.department,
            "phone": admin.phone,
            "is_active": admin.is_active,
        }

    def _create_admin_tokens(self, user: User, admin: AdminUser, permissions: list[str]) -> dict:
        role_name = admin.role_rel.name if admin.role_rel else "unknown"
        role_display = admin.role_rel.display_name if admin.role_rel else "Unknown"

        access_token = create_access_token({
            "sub": str(user.id),
            "role": "admin",
            "admin_role": role_name,
            "permissions": permissions,
        })
        refresh_token = create_refresh_token({"sub": str(user.id), "role": "admin"})

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": self._build_admin_user_dict(user, admin, permissions),
        }

    def _save_session(self, user_id: str, refresh_token: str) -> None:
        session = UserSession(
            user_id=user_id,
            refresh_token=refresh_token,
            expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        self.db.add(session)
        self.db.flush()
