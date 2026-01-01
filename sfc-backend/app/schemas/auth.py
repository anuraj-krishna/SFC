"""Authentication schemas."""
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# --- Request schemas ---


class SignupRequest(BaseModel):
    """Request schema for user signup."""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    privacy_consent: bool = Field(..., description="User must consent to privacy policy")
    data_processing_consent: bool = Field(..., description="User must consent to data processing")
    marketing_consent: bool = Field(default=False)


class VerifyOTPRequest(BaseModel):
    """Request schema for OTP verification."""

    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)


class ResendOTPRequest(BaseModel):
    """Request schema for resending OTP."""

    email: EmailStr


class SigninRequest(BaseModel):
    """Request schema for user signin."""

    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    """Request schema for token refresh."""

    refresh_token: str


class ChangePasswordRequest(BaseModel):
    """Request schema for password change."""

    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class ForgotPasswordRequest(BaseModel):
    """Request schema for forgot password."""

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Request schema for password reset."""

    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8, max_length=128)


# --- Response schemas ---


class TokenResponse(BaseModel):
    """Response schema with access and refresh tokens."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(..., description="Access token expiry in seconds")


class UserResponse(BaseModel):
    """Response schema for user data."""

    id: str
    email: str
    role: str
    is_active: bool
    is_verified: bool
    privacy_consent_at: datetime | None
    marketing_consent: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SignupResponse(BaseModel):
    """Response schema for signup."""

    message: str
    user_id: str
    email: str


class MessageResponse(BaseModel):
    """Generic message response."""

    message: str


class AuthStatusResponse(BaseModel):
    """Response schema for auth status check."""

    user: UserResponse
    has_profile: bool
    onboarding_completed: bool

