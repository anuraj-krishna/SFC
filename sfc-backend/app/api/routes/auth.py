"""Authentication API routes."""
from fastapi import APIRouter, HTTPException, Request, status

from app.api.deps import ActiveUser, DBSession, VerifiedUser
from app.core.config import settings
from app.schemas.auth import (
    AuthStatusResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    MessageResponse,
    RefreshTokenRequest,
    ResendOTPRequest,
    ResetPasswordRequest,
    SigninRequest,
    SignupRequest,
    SignupResponse,
    TokenResponse,
    UserResponse,
    VerifyOTPRequest,
)
from app.services.auth import (
    AuthError,
    authenticate_user,
    change_password,
    create_and_send_otp,
    create_tokens,
    create_user,
    get_user_by_email,
    refresh_tokens,
    reset_password,
    revoke_refresh_token,
    verify_otp,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _get_device_info(request: Request) -> str | None:
    """Extract device info from request headers."""
    user_agent = request.headers.get("user-agent", "")
    return user_agent[:255] if user_agent else None


@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    request: Request,
    data: SignupRequest,
    db: DBSession,
):
    """
    Register a new user account.

    - Creates user with hashed password
    - Sends OTP verification email
    - User must verify OTP to activate account
    """
    try:
        user = await create_user(
            db=db,
            email=data.email,
            password=data.password,
            privacy_consent=data.privacy_consent,
            data_processing_consent=data.data_processing_consent,
            marketing_consent=data.marketing_consent,
        )

        # Send OTP
        await create_and_send_otp(db, user, purpose="signup")

        await db.commit()

        return SignupResponse(
            message="Account created. Please check your email for verification code.",
            user_id=user.id,
            email=user.email,
        )

    except AuthError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": e.message, "code": e.code},
        )


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp_route(
    request: Request,
    data: VerifyOTPRequest,
    db: DBSession,
):
    """
    Verify OTP code and activate account.

    - On success, returns access and refresh tokens
    - User can now sign in
    """
    try:
        user = await verify_otp(db, data.email, data.code, purpose="signup")

        # Create tokens
        access_token, refresh_token = await create_tokens(
            db, user, device_info=_get_device_info(request)
        )

        await db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    except AuthError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": e.message, "code": e.code},
        )


@router.post("/resend-otp", response_model=MessageResponse)
async def resend_otp(
    data: ResendOTPRequest,
    db: DBSession,
):
    """
    Resend OTP verification code.

    - Rate limited to 3 OTPs per hour
    - Previous OTPs are invalidated
    """
    try:
        user = await get_user_by_email(db, data.email)
        if not user:
            # Don't reveal if email exists
            return MessageResponse(message="If the email exists, a verification code has been sent.")

        if user.is_verified:
            return MessageResponse(message="Email is already verified.")

        await create_and_send_otp(db, user, purpose="signup")
        await db.commit()

        return MessageResponse(message="Verification code sent to your email.")

    except AuthError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"message": e.message, "code": e.code},
        )


@router.post("/signin", response_model=TokenResponse)
async def signin(
    request: Request,
    data: SigninRequest,
    db: DBSession,
):
    """
    Sign in with email and password.

    - User must be verified
    - Returns access and refresh tokens
    """
    try:
        user = await authenticate_user(db, data.email, data.password)

        access_token, refresh_token = await create_tokens(
            db, user, device_info=_get_device_info(request)
        )

        await db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    except AuthError as e:
        await db.rollback()
        status_code = status.HTTP_401_UNAUTHORIZED
        if e.code == "EMAIL_NOT_VERIFIED":
            status_code = status.HTTP_403_FORBIDDEN
        raise HTTPException(
            status_code=status_code,
            detail={"message": e.message, "code": e.code},
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: Request,
    data: RefreshTokenRequest,
    db: DBSession,
):
    """
    Refresh access token using refresh token.

    - Old refresh token is revoked
    - New token pair is returned
    """
    try:
        access_token, new_refresh, user = await refresh_tokens(
            db, data.refresh_token, device_info=_get_device_info(request)
        )

        await db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    except AuthError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": e.message, "code": e.code},
        )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    data: RefreshTokenRequest,
    db: DBSession,
):
    """
    Logout by revoking refresh token.

    - Access token remains valid until expiry (short-lived)
    - Refresh token is revoked immediately
    """
    await revoke_refresh_token(db, data.refresh_token)
    await db.commit()
    return MessageResponse(message="Logged out successfully.")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    data: ForgotPasswordRequest,
    db: DBSession,
):
    """
    Request password reset OTP.

    - Sends OTP to email if account exists
    - Rate limited to 3 OTPs per hour
    """
    try:
        user = await get_user_by_email(db, data.email)
        if not user:
            # Don't reveal if email exists
            return MessageResponse(
                message="If the email exists, a reset code has been sent."
            )

        if not user.is_verified:
            return MessageResponse(
                message="If the email exists, a reset code has been sent."
            )

        await create_and_send_otp(db, user, purpose="password_reset")
        await db.commit()

        return MessageResponse(message="Password reset code sent to your email.")

    except AuthError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"message": e.message, "code": e.code},
        )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password_route(
    data: ResetPasswordRequest,
    db: DBSession,
):
    """
    Reset password using OTP.

    - Validates OTP code
    - Updates password
    - Revokes all tokens (forces re-login on all devices)
    """
    try:
        await reset_password(db, data.email, data.code, data.new_password)
        await db.commit()

        return MessageResponse(message="Password reset successfully. Please sign in.")

    except AuthError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": e.message, "code": e.code},
        )


@router.post("/change-password", response_model=MessageResponse)
async def change_password_route(
    data: ChangePasswordRequest,
    db: DBSession,
    current_user: VerifiedUser,
):
    """
    Change password for authenticated user.

    - Requires current password
    - Revokes all tokens (forces re-login on all devices)
    """
    try:
        await change_password(
            db, current_user, data.current_password, data.new_password
        )
        await db.commit()

        return MessageResponse(
            message="Password changed successfully. Please sign in again."
        )

    except AuthError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": e.message, "code": e.code},
        )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: ActiveUser):
    """Get current user info."""
    return UserResponse.model_validate(current_user)


@router.get("/status", response_model=AuthStatusResponse)
async def get_auth_status(current_user: ActiveUser):
    """
    Get authentication status with profile info.

    - Returns user info
    - Indicates if onboarding is completed
    """
    has_profile = current_user.profile is not None
    onboarding_completed = (
        has_profile
        and current_user.profile.onboarding_completed_at is not None
    )

    return AuthStatusResponse(
        user=UserResponse.model_validate(current_user),
        has_profile=has_profile,
        onboarding_completed=onboarding_completed,
    )

