from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/estateflow"
    SECRET_KEY: str = "estateflow-super-secret-jwt-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000"

    # ── Google OAuth 2.0 ─────────────────────────────────────────────────────
    # Set these in .env to enable real Google Sign-In.
    # If not set, the backend will return a 400 with a clear message.
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # ── Razorpay Payment Gateway ─────────────────────────────────────────────
    # Set these in .env to enable live Razorpay checkout.
    RAZORPAY_KEY_ID: Optional[str] = "rzp_test_EstateFlow2024Demo"
    RAZORPAY_KEY_SECRET: Optional[str] = "EstateFlowDemoSecret2024Key"
    RAZORPAY_WEBHOOK_SECRET: Optional[str] = None
    PAYMENT_MODE: str = "demo"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def google_oauth_configured(self) -> bool:
        return bool(self.GOOGLE_CLIENT_ID and self.GOOGLE_CLIENT_SECRET)

    @property
    def razorpay_configured(self) -> bool:
        return bool(self.RAZORPAY_KEY_ID and self.RAZORPAY_KEY_SECRET)

    @property
    def is_demo_payment(self) -> bool:
        if self.PAYMENT_MODE.lower() == "demo":
            return True
        if not self.razorpay_configured:
            return True
        if self.RAZORPAY_KEY_ID and self.RAZORPAY_KEY_ID.startswith("rzp_test_EstateFlow"):
            return True
        return False

    @property
    def effective_payment_mode(self) -> str:
        if self.is_demo_payment:
            return "demo"
        return "live" if self.razorpay_configured else "unconfigured"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
