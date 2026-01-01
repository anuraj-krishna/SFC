"""Application configuration via environment variables."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Application ---
    PROJECT_NAME: str = "sfc-backend"
    ENV: str = "local"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    API_V1_PREFIX: str = "/api/v1"

    # --- Database ---
    DATABASE_URL: str = "postgresql+asyncpg://sfc:sfc@localhost:5432/sfc"

    # --- JWT Authentication ---
    SECRET_KEY: str = "change-me-in-production-use-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # --- OTP Settings ---
    OTP_EXPIRE_MINUTES: int = 10
    OTP_MAX_ATTEMPTS: int = 3  # Max OTP requests per hour
    OTP_MAX_VERIFY_ATTEMPTS: int = 5  # Max verification attempts per OTP

    # --- Email Provider ---
    # Options: "ses" or "mailgun"
    EMAIL_PROVIDER: str = "mailgun"
    MAX_DAILY_EMAILS: int = 100

    # --- AWS SES ---
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    SES_SENDER_EMAIL: str = ""

    # --- Mailgun ---
    MAILGUN_API_KEY: str = ""
    MAILGUN_DOMAIN: str = ""
    MAILGUN_SENDER_EMAIL: str = ""
    MAILGUN_SENDER_NAME: str = "Flow"

    # --- CORS ---
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    @property
    def async_database_url(self) -> str:
        """Get async database URL (ensures asyncpg driver)."""
        url = self.DATABASE_URL
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url


settings = Settings()
