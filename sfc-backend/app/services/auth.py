"""Authentication service with business logic."""
from datetime import datetime, timedelta, timezone

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.user import OTPCode, RefreshToken, User, UserRole
from app.services.email import send_otp_email, send_password_reset_email
from app.services.security import (
    create_access_token,
    create_refresh_token,
    generate_otp,
    hash_password,
    hash_refresh_token,
    verify_password,
)

logger = structlog.get_logger()


class AuthError(Exception):
    """Custom exception for auth errors."""

    def __init__(self, message: str, code: str = "AUTH_ERROR"):
        self.message = message
        self.code = code
        super().__init__(message)


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """Get user by email address."""
    result = await db.execute(
        select(User).where(User.email == email.lower(), User.deleted_at.is_(None))
    )
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    """Get user by ID."""
    result = await db.execute(
        select(User).where(User.id == user_id, User.deleted_at.is_(None))
    )
    return result.scalar_one_or_none()


async def create_user(
    db: AsyncSession,
    email: str,
    password: str,
    privacy_consent: bool,
    data_processing_consent: bool,
    marketing_consent: bool = False,
) -> User:
    """Create a new user account."""
    # Check if user already exists
    existing = await get_user_by_email(db, email)
    if existing:
        if existing.is_verified:
            raise AuthError("Email already registered", "EMAIL_EXISTS")
        else:
            # Delete unverified user to allow re-registration
            await db.delete(existing)
            await db.flush()

    # Validate consent
    if not privacy_consent or not data_processing_consent:
        raise AuthError("Privacy and data processing consent required", "CONSENT_REQUIRED")

    # Create user
    user = User(
        email=email.lower(),
        hashed_password=hash_password(password),
        is_verified=False,
        privacy_consent_at=datetime.now(timezone.utc) if privacy_consent else None,
        data_processing_consent=data_processing_consent,
        marketing_consent=marketing_consent,
    )
    db.add(user)
    await db.flush()

    logger.info("User created", user_id=user.id, email=email)
    return user


async def create_and_send_otp(
    db: AsyncSession,
    user: User,
    purpose: str = "signup",
) -> bool:
    """Create an OTP code and send it via email."""
    # Check rate limiting (max 3 OTPs per hour)
    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
    result = await db.execute(
        select(OTPCode).where(
            OTPCode.user_id == user.id,
            OTPCode.purpose == purpose,
            OTPCode.created_at > one_hour_ago,
        )
    )
    recent_otps = result.scalars().all()

    if len(recent_otps) >= settings.OTP_MAX_ATTEMPTS:
        raise AuthError("Too many OTP requests. Try again later.", "OTP_RATE_LIMITED")

    # Invalidate previous OTPs
    for otp in recent_otps:
        if otp.used_at is None:
            otp.used_at = datetime.now(timezone.utc)

    # Generate new OTP
    otp_code = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    otp = OTPCode(
        user_id=user.id,
        code=otp_code,
        purpose=purpose,
        expires_at=expires_at,
    )
    db.add(otp)
    await db.flush()

    # Send email
    if purpose == "password_reset":
        email_sent = await send_password_reset_email(user.email, otp_code)
    else:
        email_sent = await send_otp_email(user.email, otp_code)

    logger.info(
        "OTP created",
        user_id=user.id,
        purpose=purpose,
        email_sent=email_sent,
    )
    return email_sent


async def verify_otp(
    db: AsyncSession,
    email: str,
    code: str,
    purpose: str = "signup",
) -> User:
    """Verify an OTP code."""
    user = await get_user_by_email(db, email)
    if not user:
        raise AuthError("Invalid email or code", "INVALID_OTP")

    # Find valid OTP
    result = await db.execute(
        select(OTPCode).where(
            OTPCode.user_id == user.id,
            OTPCode.purpose == purpose,
            OTPCode.used_at.is_(None),
            OTPCode.expires_at > datetime.now(timezone.utc),
        ).order_by(OTPCode.created_at.desc())
    )
    otp = result.scalar_one_or_none()

    if not otp:
        raise AuthError("Invalid or expired code", "INVALID_OTP")

    # Check attempts
    otp.attempts += 1
    if otp.attempts > settings.OTP_MAX_VERIFY_ATTEMPTS:
        otp.used_at = datetime.now(timezone.utc)
        await db.flush()
        raise AuthError("Too many failed attempts", "OTP_MAX_ATTEMPTS")

    # Verify code
    if otp.code != code:
        await db.flush()
        raise AuthError("Invalid code", "INVALID_OTP")

    # Mark OTP as used
    otp.used_at = datetime.now(timezone.utc)

    # Mark user as verified
    if purpose == "signup":
        user.is_verified = True

    await db.flush()

    logger.info("OTP verified", user_id=user.id, purpose=purpose)
    return user


async def authenticate_user(
    db: AsyncSession,
    email: str,
    password: str,
) -> User:
    """Authenticate user with email and password."""
    user = await get_user_by_email(db, email)

    if not user:
        raise AuthError("Invalid email or password", "INVALID_CREDENTIALS")

    if not user.hashed_password:
        raise AuthError("Invalid email or password", "INVALID_CREDENTIALS")

    if not verify_password(password, user.hashed_password):
        raise AuthError("Invalid email or password", "INVALID_CREDENTIALS")

    if not user.is_verified:
        raise AuthError("Email not verified", "EMAIL_NOT_VERIFIED")

    if not user.is_active:
        raise AuthError("Account is deactivated", "ACCOUNT_INACTIVE")

    logger.info("User authenticated", user_id=user.id)
    return user


async def create_tokens(
    db: AsyncSession,
    user: User,
    device_info: str | None = None,
) -> tuple[str, str]:
    """Create access and refresh tokens for a user."""
    # Create access token
    access_token = create_access_token(subject=user.id, role=user.role.value)

    # Create refresh token
    raw_refresh, hashed_refresh = create_refresh_token()
    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )

    refresh_token = RefreshToken(
        user_id=user.id,
        token_hash=hashed_refresh,
        expires_at=expires_at,
        device_info=device_info,
    )
    db.add(refresh_token)
    await db.flush()

    logger.info("Tokens created", user_id=user.id)
    return access_token, raw_refresh


async def refresh_tokens(
    db: AsyncSession,
    refresh_token: str,
    device_info: str | None = None,
) -> tuple[str, str, User]:
    """Refresh access token using refresh token."""
    hashed = hash_refresh_token(refresh_token)

    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == hashed,
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
    )
    token_record = result.scalar_one_or_none()

    if not token_record:
        raise AuthError("Invalid or expired refresh token", "INVALID_REFRESH_TOKEN")

    # Get user
    user = await get_user_by_id(db, token_record.user_id)
    if not user or not user.is_active:
        raise AuthError("User not found or inactive", "USER_INACTIVE")

    # Revoke old token
    token_record.revoked_at = datetime.now(timezone.utc)

    # Create new tokens
    access_token, new_refresh = await create_tokens(db, user, device_info)

    logger.info("Tokens refreshed", user_id=user.id)
    return access_token, new_refresh, user


async def revoke_refresh_token(db: AsyncSession, refresh_token: str) -> bool:
    """Revoke a refresh token (logout)."""
    hashed = hash_refresh_token(refresh_token)

    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == hashed,
            RefreshToken.revoked_at.is_(None),
        )
    )
    token_record = result.scalar_one_or_none()

    if token_record:
        token_record.revoked_at = datetime.now(timezone.utc)
        await db.flush()
        logger.info("Refresh token revoked", user_id=token_record.user_id)
        return True

    return False


async def revoke_all_user_tokens(db: AsyncSession, user_id: str) -> int:
    """Revoke all refresh tokens for a user (logout all devices)."""
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None),
        )
    )
    tokens = result.scalars().all()

    count = 0
    for token in tokens:
        token.revoked_at = datetime.now(timezone.utc)
        count += 1

    await db.flush()
    logger.info("All user tokens revoked", user_id=user_id, count=count)
    return count


async def change_password(
    db: AsyncSession,
    user: User,
    current_password: str,
    new_password: str,
) -> bool:
    """Change user password."""
    if not user.hashed_password or not verify_password(
        current_password, user.hashed_password
    ):
        raise AuthError("Current password is incorrect", "INVALID_PASSWORD")

    user.hashed_password = hash_password(new_password)
    await db.flush()

    # Revoke all tokens (force re-login)
    await revoke_all_user_tokens(db, user.id)

    logger.info("Password changed", user_id=user.id)
    return True


async def reset_password(
    db: AsyncSession,
    email: str,
    code: str,
    new_password: str,
) -> User:
    """Reset password using OTP."""
    # Verify OTP first
    user = await verify_otp(db, email, code, purpose="password_reset")

    # Update password
    user.hashed_password = hash_password(new_password)
    await db.flush()

    # Revoke all tokens
    await revoke_all_user_tokens(db, user.id)

    logger.info("Password reset", user_id=user.id)
    return user


async def create_admin_user(
    db: AsyncSession,
    email: str,
    password: str,
) -> User:
    """Create an admin user (for initial setup)."""
    existing = await get_user_by_email(db, email)
    if existing:
        raise AuthError("Email already registered", "EMAIL_EXISTS")

    user = User(
        email=email.lower(),
        hashed_password=hash_password(password),
        role=UserRole.ADMIN,
        is_verified=True,
        is_active=True,
        privacy_consent_at=datetime.now(timezone.utc),
        data_processing_consent=True,
    )
    db.add(user)
    await db.flush()

    logger.info("Admin user created", user_id=user.id, email=email)
    return user

