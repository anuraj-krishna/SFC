"""User and authentication models."""
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDMixin


class UserRole(str, PyEnum):
    """User roles for RBAC."""

    MEMBER = "member"
    ADMIN = "admin"


class AuthProvider(str, PyEnum):
    """Authentication provider types."""

    EMAIL = "email"
    GOOGLE = "google"


class User(Base, UUIDMixin, TimestampMixin):
    """User account."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), default=UserRole.MEMBER, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Auth provider (for future Google OAuth)
    auth_provider: Mapped[AuthProvider] = mapped_column(
        Enum(AuthProvider), default=AuthProvider.EMAIL, nullable=False
    )

    # GDPR/DPDP consent tracking
    privacy_consent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    marketing_consent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    data_processing_consent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Soft delete for GDPR compliance
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    profile: Mapped["UserProfile | None"] = relationship(
        "UserProfile", back_populates="user", uselist=False, lazy="selectin"
    )
    otp_codes: Mapped[list["OTPCode"]] = relationship(
        "OTPCode", back_populates="user", lazy="selectin"
    )
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_users_email_active", "email", "is_active"),
    )


class UserProfile(Base, UUIDMixin, TimestampMixin):
    """User profile with onboarding data."""

    __tablename__ = "user_profiles"

    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # Basic info
    display_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    age_range: Mapped[str | None] = mapped_column(String(20), nullable=True)  # 18-29, 30-45, 46-65, 65+
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    height_cm: Mapped[int | None] = mapped_column(nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(nullable=True)
    fitness_level: Mapped[str | None] = mapped_column(String(20), nullable=True)  # beginner, intermediate, advanced

    # Goals
    primary_goal: Mapped[str | None] = mapped_column(String(50), nullable=True)  # weight_loss, muscle_gain, flexibility, endurance, general_fitness
    secondary_goals: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array

    # Availability
    days_per_week: Mapped[int | None] = mapped_column(nullable=True)
    minutes_per_session: Mapped[int | None] = mapped_column(nullable=True)
    preferred_days: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array

    # Constraints
    injuries: Mapped[str | None] = mapped_column(Text, nullable=True)
    equipment_available: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array: none, dumbbells, bands, gym
    workout_location: Mapped[str | None] = mapped_column(String(20), nullable=True)  # home, gym

    # Preferences
    prefers_cardio: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    prefers_strength: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    interested_in_yoga: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # Health disclaimer acknowledgment
    health_disclaimer_accepted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Onboarding completion
    onboarding_completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="profile")


class OTPCode(Base, UUIDMixin, TimestampMixin):
    """OTP codes for email verification."""

    __tablename__ = "otp_codes"

    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    code: Mapped[str] = mapped_column(String(6), nullable=False)
    purpose: Mapped[str] = mapped_column(String(20), nullable=False)  # signup, password_reset
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    attempts: Mapped[int] = mapped_column(default=0, nullable=False)

    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="otp_codes")

    __table_args__ = (
        Index("ix_otp_user_purpose", "user_id", "purpose"),
    )


class RefreshToken(Base, UUIDMixin, TimestampMixin):
    """Refresh tokens for JWT authentication."""

    __tablename__ = "refresh_tokens"

    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    device_info: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")

    __table_args__ = (
        Index("ix_refresh_tokens_user", "user_id"),
    )

