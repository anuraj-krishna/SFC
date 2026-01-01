"""Privacy and GDPR/DPDP compliance API routes."""
import json
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select

from app.api.deps import DBSession, VerifiedUser
from app.models.program import ProgramEnrollment, WorkoutCompletion
from app.models.user import OTPCode, RefreshToken, User, UserProfile
from app.services.auth import revoke_all_user_tokens

router = APIRouter(prefix="/privacy", tags=["Privacy"])


class ConsentUpdateRequest(BaseModel):
    """Request to update consent preferences."""

    marketing_consent: bool | None = None
    data_processing_consent: bool | None = None


class ConsentResponse(BaseModel):
    """Current consent status."""

    privacy_consent_at: datetime | None
    data_processing_consent: bool
    marketing_consent: bool


class DataExportResponse(BaseModel):
    """User data export (GDPR Article 20 - Right to data portability)."""

    user: dict
    profile: dict | None
    enrollments: list[dict]
    workout_completions: list[dict]
    exported_at: datetime


class DeleteAccountRequest(BaseModel):
    """Request to delete account."""

    confirm: bool = False  # Must be True to proceed


class DeleteAccountResponse(BaseModel):
    """Response after account deletion."""

    message: str
    deleted_at: datetime


def _deserialize_list(value: str | None) -> list | None:
    """Deserialize JSON string to list."""
    if value is None:
        return None
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return None


@router.get("/consent", response_model=ConsentResponse)
async def get_consent_status(current_user: VerifiedUser):
    """
    Get current consent status.

    Shows when privacy consent was given and current preferences.
    """
    return ConsentResponse(
        privacy_consent_at=current_user.privacy_consent_at,
        data_processing_consent=current_user.data_processing_consent,
        marketing_consent=current_user.marketing_consent,
    )


@router.put("/consent", response_model=ConsentResponse)
async def update_consent(
    data: ConsentUpdateRequest,
    db: DBSession,
    current_user: VerifiedUser,
):
    """
    Update consent preferences.

    - Marketing consent can be freely toggled
    - Data processing consent withdrawal may require account deletion
    """
    if data.marketing_consent is not None:
        current_user.marketing_consent = data.marketing_consent

    if data.data_processing_consent is not None:
        if not data.data_processing_consent:
            # Withdrawing data processing consent - user should delete account
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "Withdrawing data processing consent requires account deletion. Use DELETE /privacy/account.",
                    "code": "CONSENT_WITHDRAWAL_REQUIRES_DELETION",
                },
            )
        current_user.data_processing_consent = data.data_processing_consent

    await db.commit()

    return ConsentResponse(
        privacy_consent_at=current_user.privacy_consent_at,
        data_processing_consent=current_user.data_processing_consent,
        marketing_consent=current_user.marketing_consent,
    )


@router.get("/export", response_model=DataExportResponse)
async def export_user_data(
    db: DBSession,
    current_user: VerifiedUser,
):
    """
    Export all user data (GDPR Article 20 - Right to data portability).

    Returns all personal data in a structured format.
    """
    # User data
    user_data = {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role.value,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "auth_provider": current_user.auth_provider.value,
        "privacy_consent_at": current_user.privacy_consent_at.isoformat() if current_user.privacy_consent_at else None,
        "marketing_consent": current_user.marketing_consent,
        "data_processing_consent": current_user.data_processing_consent,
        "created_at": current_user.created_at.isoformat(),
        "updated_at": current_user.updated_at.isoformat(),
    }

    # Profile data
    profile_data = None
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()

    if profile:
        profile_data = {
            "display_name": profile.display_name,
            "age_range": profile.age_range,
            "gender": profile.gender,
            "height_cm": profile.height_cm,
            "weight_kg": profile.weight_kg,
            "fitness_level": profile.fitness_level,
            "primary_goal": profile.primary_goal,
            "secondary_goals": _deserialize_list(profile.secondary_goals),
            "days_per_week": profile.days_per_week,
            "minutes_per_session": profile.minutes_per_session,
            "preferred_days": _deserialize_list(profile.preferred_days),
            "injuries": profile.injuries,
            "equipment_available": _deserialize_list(profile.equipment_available),
            "workout_location": profile.workout_location,
            "prefers_cardio": profile.prefers_cardio,
            "prefers_strength": profile.prefers_strength,
            "interested_in_yoga": profile.interested_in_yoga,
            "health_disclaimer_accepted_at": profile.health_disclaimer_accepted_at.isoformat() if profile.health_disclaimer_accepted_at else None,
            "onboarding_completed_at": profile.onboarding_completed_at.isoformat() if profile.onboarding_completed_at else None,
            "created_at": profile.created_at.isoformat(),
            "updated_at": profile.updated_at.isoformat(),
        }

    # Enrollments
    enrollments_result = await db.execute(
        select(ProgramEnrollment).where(ProgramEnrollment.user_id == current_user.id)
    )
    enrollments = enrollments_result.scalars().all()

    enrollments_data = [
        {
            "id": e.id,
            "program_id": e.program_id,
            "current_day": e.current_day,
            "started_at": e.started_at.isoformat(),
            "completed_at": e.completed_at.isoformat() if e.completed_at else None,
            "is_active": e.is_active,
            "total_workouts_completed": e.total_workouts_completed,
            "total_minutes_completed": e.total_minutes_completed,
            "streak_days": e.streak_days,
            "last_workout_at": e.last_workout_at.isoformat() if e.last_workout_at else None,
        }
        for e in enrollments
    ]

    # Workout completions
    enrollment_ids = [e.id for e in enrollments]
    completions_data = []

    if enrollment_ids:
        completions_result = await db.execute(
            select(WorkoutCompletion).where(
                WorkoutCompletion.enrollment_id.in_(enrollment_ids)
            )
        )
        completions = completions_result.scalars().all()

        completions_data = [
            {
                "id": c.id,
                "enrollment_id": c.enrollment_id,
                "workout_id": c.workout_id,
                "completed_at": c.completed_at.isoformat(),
                "duration_minutes": c.duration_minutes,
                "rating": c.rating,
                "difficulty_felt": c.difficulty_felt,
                "notes": c.notes,
            }
            for c in completions
        ]

    return DataExportResponse(
        user=user_data,
        profile=profile_data,
        enrollments=enrollments_data,
        workout_completions=completions_data,
        exported_at=datetime.now(timezone.utc),
    )


@router.delete("/account", response_model=DeleteAccountResponse)
async def delete_account(
    data: DeleteAccountRequest,
    db: DBSession,
    current_user: VerifiedUser,
):
    """
    Delete user account (GDPR Article 17 - Right to erasure).

    This will:
    - Anonymize user data (email, profile)
    - Revoke all tokens (logout all devices)
    - Mark account as deleted
    - Retain anonymized records for legal/analytics purposes

    Set confirm=true to proceed with deletion.
    """
    if not data.confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Set confirm=true to proceed with account deletion",
                "code": "CONFIRMATION_REQUIRED",
            },
        )

    now = datetime.now(timezone.utc)

    # Revoke all tokens
    await revoke_all_user_tokens(db, current_user.id)

    # Anonymize user data
    anonymized_email = f"deleted_{current_user.id}@deleted.local"
    current_user.email = anonymized_email
    current_user.hashed_password = None
    current_user.is_active = False
    current_user.deleted_at = now
    current_user.marketing_consent = False

    # Anonymize profile
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()

    if profile:
        profile.display_name = None
        profile.age_range = None
        profile.gender = None
        profile.height_cm = None
        profile.weight_kg = None
        profile.injuries = None

    # Delete OTP codes (no need to retain)
    otp_result = await db.execute(
        select(OTPCode).where(OTPCode.user_id == current_user.id)
    )
    for otp in otp_result.scalars().all():
        await db.delete(otp)

    # Delete refresh tokens
    token_result = await db.execute(
        select(RefreshToken).where(RefreshToken.user_id == current_user.id)
    )
    for token in token_result.scalars().all():
        await db.delete(token)

    await db.commit()

    return DeleteAccountResponse(
        message="Account deleted successfully. Your data has been anonymized.",
        deleted_at=now,
    )

