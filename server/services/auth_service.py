import secrets
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from server.repositories.user_repo import UserRepository
from server.models.user import User, Session as UserSession
from server.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from server.config.settings import settings
from server.schemas.auth import RegisterRequest, LoginRequest

# In-memory reset token store: {token: (user_id, expires_at)}
_reset_tokens: dict = {}



class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def register(self, data: RegisterRequest) -> dict:
        import traceback
        try:
            print("Incoming registration:", data.model_dump())
            existing = self.user_repo.get_by_email(data.email)
            if existing:
                print(f"Registration failed: Email '{data.email}' already registered")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered",
                )

            print("Creating user...")
            phone_val = data.phone.strip() if data.phone and data.phone.strip() else None
            full_name_val = f"{data.first_name} {data.last_name or ''}".strip()
            user = self.user_repo.create(
                email=data.email,
                password=data.password,
                full_name=full_name_val,
                phone=phone_val,
            )
            self.user_repo.create_customer_profile(
                user_id=user.id,
                first_name=data.first_name,
                last_name=data.last_name,
                phone=phone_val,
            )

            # Initialize CRM Lead Pipeline for registered customer
            try:
                import uuid
                from server.models.lead import Lead, LeadStage, LeadSource, LeadPriority
                existing_lead = self.db.query(Lead).filter(
                    (Lead.customer_id == user.id) | (Lead.email == data.email.lower().strip())
                ).first()
                if not existing_lead:
                    lead_num = f"EFL-LD-{uuid.uuid4().hex[:8].upper()}"
                    lead = Lead(
                        lead_number=lead_num,
                        customer_id=user.id,
                        first_name=data.first_name,
                        last_name=data.last_name or "",
                        email=data.email.lower().strip(),
                        phone=phone_val or "+91 98000 00000",
                        stage=LeadStage.new,
                        source=LeadSource.website,
                        priority=LeadPriority.medium,
                        notes_summary="New customer registration via web portal",
                    )
                    self.db.add(lead)
                elif not existing_lead.customer_id:
                    existing_lead.customer_id = user.id
            except Exception as lead_err:
                print(f"[CRM Init Warning] {lead_err}")

            self.db.commit()
            self.db.refresh(user)
            print("Database commit successful")

            tokens = self._create_tokens(user)
            self._save_session(user.id, tokens["refresh_token"])
            self.db.commit()
            print("Session saved and registration complete")
            return tokens
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            print("Error during registration:", str(e))
            print(traceback.format_exc())
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Registration failed: {str(e)}",
            )

    def login(self, data: LoginRequest) -> dict:
        user = self.user_repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account deactivated",
            )

        tokens = self._create_tokens(user)
        self._save_session(user.id, tokens["refresh_token"])
        # Update last login timestamp
        user.last_login = datetime.utcnow()
        self.db.commit()
        return tokens

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
                detail="Session expired",
            )

        user = self.user_repo.get_by_id(payload["sub"])
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

        tokens = self._create_tokens(user)
        session.refresh_token = tokens["refresh_token"]
        session.expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        self.db.commit()
        return tokens

    def logout(self, refresh_token: str, user_id: str):
        session = (
            self.db.query(UserSession)
            .filter(UserSession.user_id == user_id, UserSession.refresh_token == refresh_token)
            .first()
        )
        if session:
            session.is_active = False
        self.db.commit()

    def _create_tokens(self, user: User) -> dict:
        access_token = create_access_token({"sub": str(user.id), "role": user.role.value})
        refresh_token = create_refresh_token({"sub": str(user.id)})
        customer = user.customer
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user.role.value,
                "is_active": user.is_active,
                "is_verified": user.is_verified,
                "first_name": customer.first_name if customer else "",
                "last_name": customer.last_name if customer else "",
                "avatar_url": customer.avatar_url if customer else None,
            },
        }

    def _save_session(self, user_id: str, refresh_token: str):
        session = UserSession(
            user_id=user_id,
            refresh_token=refresh_token,
            expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        self.db.add(session)
        self.db.flush()

    def forgot_password(self, email: str) -> None:
        """Generate a reset token. In production, email this link to the user."""
        user = self.user_repo.get_by_email(email)
        if not user:
            # Don't reveal whether email exists (security best practice)
            return
        token = secrets.token_urlsafe(32)
        expires = datetime.utcnow() + timedelta(hours=1)
        _reset_tokens[token] = (str(user.id), expires)
        # In production: send_email(email, reset_link=f"https://app/reset-password?token={token}")
        print(f"[Auth] Password reset token for {email}: {token}")

    def reset_password(self, token: str, new_password: str) -> None:
        """Validate token and update the user's password."""
        record = _reset_tokens.get(token)
        if not record:
            raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        user_id, expires = record
        if datetime.utcnow() > expires:
            _reset_tokens.pop(token, None)
            raise HTTPException(status_code=400, detail="Reset token has expired")
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.password_hash = get_password_hash(new_password)
        self.db.commit()

    def google_auth(self, data) -> dict:
        """Authenticate or auto-register user via Google OAuth 2.0.
        
        If GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not configured in .env,
        raises HTTP 400 with an actionable message.
        When configured, cryptographically verifies the Google ID token via Google's public API
        before creating/logging in the user.
        """
        from server.config.settings import settings

        if not settings.google_oauth_configured:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google authentication is not configured yet. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.",
            )

        # Extract token from credential (GIS standard), google_id_token, or id_token
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

        # Verify token with Google's public tokeninfo API
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
            
            # Verify audience (aud) matches our GOOGLE_CLIENT_ID
            if token_data.get("aud") != settings.GOOGLE_CLIENT_ID:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Google token audience mismatch. Token was not issued for this application.",
                )
            
            # Verify email verification status from Google
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

            # Name and avatar extraction
            verified_first = token_data.get("given_name")
            verified_last = token_data.get("family_name")
            if not verified_first:
                full_name = token_data.get("name", "")
                parts = full_name.split(" ", 1)
                verified_first = parts[0] if parts else (data.first_name or "Google")
                verified_last = parts[1] if len(parts) > 1 else (data.last_name or "User")
            
            verified_avatar = token_data.get("picture") or data.avatar_url
            user_email = verified_email.lower().strip()
            user_first_name = verified_first or "Google"
            user_last_name = verified_last or "User"
            user_avatar = verified_avatar

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Could not verify Google token with Google servers: {str(e)}",
            )

        import secrets
        user = self.user_repo.get_by_email(user_email)
        if not user:
            # Auto-create user profile from verified Google payload
            random_pass = secrets.token_urlsafe(16)
            user = self.user_repo.create(email=user_email, password=random_pass)
            user.is_verified = True
            if user_avatar:
                user.avatar_url = user_avatar
            phone_val = getattr(data, "phone", None) or None
            self.user_repo.create_customer_profile(
                user_id=user.id,
                first_name=user_first_name,
                last_name=user_last_name,
                avatar_url=user_avatar,
            )
            # Initialize CRM Lead for Google-registered customer
            try:
                import uuid
                from server.models.lead import Lead, LeadStage, LeadSource, LeadPriority
                existing_lead = self.db.query(Lead).filter(
                    (Lead.customer_id == user.id) | (Lead.email == user_email)
                ).first()
                if not existing_lead:
                    lead_num = f"EFL-LD-{uuid.uuid4().hex[:8].upper()}"
                    lead = Lead(
                        lead_number=lead_num,
                        customer_id=user.id,
                        first_name=user_first_name,
                        last_name=user_last_name,
                        email=user_email,
                        phone=phone_val or "+91 98000 00000",
                        stage=LeadStage.new,
                        source=LeadSource.website,
                        priority=LeadPriority.medium,
                        notes_summary="New customer registration via Google OAuth 2.0",
                    )
                    self.db.add(lead)
                elif not existing_lead.customer_id:
                    existing_lead.customer_id = user.id
            except Exception as lead_err:
                print(f"[CRM Google Init Warning] {lead_err}")

            self.db.commit()
            self.db.refresh(user)
        else:
            # Update avatar if available
            if user_avatar and not user.avatar_url:
                user.avatar_url = user_avatar
            if user.customer and user_avatar and not user.customer.avatar_url:
                user.customer.avatar_url = user_avatar
            self.db.commit()
            self.db.refresh(user)
        user.last_login = datetime.utcnow()
        tokens = self._create_tokens(user)
        self._save_session(user.id, tokens["refresh_token"])
        self.db.commit()
        return tokens



    def change_password(self, user_id: str, current_password: str, new_password: str) -> None:
        """Allow authenticated user to change their own password."""
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if not verify_password(current_password, user.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        user.password_hash = get_password_hash(new_password)
        self.db.commit()
