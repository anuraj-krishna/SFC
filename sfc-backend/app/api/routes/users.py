"""User profile and onboarding API routes."""
import json
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import DBSession, VerifiedUser
from app.models.user import UserProfile
from app.schemas.user import OnboardingRequest, UpdateProfileRequest, UserProfileResponse

router = APIRouter(prefix="/users", tags=["Users"])


def _serialize_list(value: list | None) -> str | None:
    """Serialize list to JSON string for storage."""
    if value is None:
        return None
    return json.dumps(value)


def _deserialize_list(value: str | None) -> list | None:
    """Deserialize JSON string to list."""
    if value is None:
        return None
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return None


@router.post("/onboarding", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
async def complete_onboarding(
    data: OnboardingRequest,
    db: DBSession,
    current_user: VerifiedUser,
):
    """
    Complete user onboarding questionnaire.

    - Creates user profile with preferences
    - Marks onboarding as completed
    - Can only be done once (use PUT /profile to update)
    """
    # Check if profile already exists
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    existing = result.scalar_one_or_none()

    if existing and existing.onboarding_completed_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Onboarding already completed. Use PUT /users/profile to update.",
        )

    # Validate health disclaimer
    if not data.health_disclaimer_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Health disclaimer must be accepted.",
        )

    now = datetime.now(timezone.utc)

    if existing:
        # Update existing incomplete profile
        profile = existing
        profile.display_name = data.display_name
        profile.age_range = data.age_range
        profile.gender = data.gender
        profile.height_cm = data.height_cm
        profile.weight_kg = data.weight_kg
        profile.fitness_level = data.fitness_level
        profile.primary_goal = data.primary_goal
        profile.secondary_goals = _serialize_list(data.secondary_goals)
        profile.days_per_week = data.days_per_week
        profile.minutes_per_session = data.minutes_per_session
        profile.preferred_days = _serialize_list(data.preferred_days)
        profile.injuries = data.injuries
        profile.equipment_available = _serialize_list(data.equipment_available)
        profile.workout_location = data.workout_location
        profile.prefers_cardio = data.prefers_cardio
        profile.prefers_strength = data.prefers_strength
        profile.interested_in_yoga = data.interested_in_yoga
        profile.health_disclaimer_accepted_at = now
        profile.onboarding_completed_at = now
    else:
        # Create new profile
        profile = UserProfile(
            user_id=current_user.id,
            display_name=data.display_name,
            age_range=data.age_range,
            gender=data.gender,
            height_cm=data.height_cm,
            weight_kg=data.weight_kg,
            fitness_level=data.fitness_level,
            primary_goal=data.primary_goal,
            secondary_goals=_serialize_list(data.secondary_goals),
            days_per_week=data.days_per_week,
            minutes_per_session=data.minutes_per_session,
            preferred_days=_serialize_list(data.preferred_days),
            injuries=data.injuries,
            equipment_available=_serialize_list(data.equipment_available),
            workout_location=data.workout_location,
            prefers_cardio=data.prefers_cardio,
            prefers_strength=data.prefers_strength,
            interested_in_yoga=data.interested_in_yoga,
            health_disclaimer_accepted_at=now,
            onboarding_completed_at=now,
        )
        db.add(profile)

    await db.commit()
    await db.refresh(profile)

    return _profile_to_response(profile)


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(
    db: DBSession,
    current_user: VerifiedUser,
):
    """Get current user's profile."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Complete onboarding first.",
        )

    return _profile_to_response(profile)


@router.put("/profile", response_model=UserProfileResponse)
async def update_profile(
    data: UpdateProfileRequest,
    db: DBSession,
    current_user: VerifiedUser,
):
    """
    Update user profile.

    - Only updates provided fields
    - Onboarding must be completed first
    """
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Complete onboarding first.",
        )

    # Update only provided fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)

    return _profile_to_response(profile)


def _profile_to_response(profile: UserProfile) -> UserProfileResponse:
    """Convert profile model to response schema."""
    return UserProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        display_name=profile.display_name,
        age_range=profile.age_range,
        gender=profile.gender,
        height_cm=profile.height_cm,
        weight_kg=profile.weight_kg,
        fitness_level=profile.fitness_level,
        primary_goal=profile.primary_goal,
        secondary_goals=_deserialize_list(profile.secondary_goals),
        days_per_week=profile.days_per_week,
        minutes_per_session=profile.minutes_per_session,
        preferred_days=_deserialize_list(profile.preferred_days),
        injuries=profile.injuries,
        equipment_available=_deserialize_list(profile.equipment_available),
        workout_location=profile.workout_location,
        prefers_cardio=profile.prefers_cardio,
        prefers_strength=profile.prefers_strength,
        interested_in_yoga=profile.interested_in_yoga,
        health_disclaimer_accepted_at=profile.health_disclaimer_accepted_at,
        onboarding_completed_at=profile.onboarding_completed_at,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )

