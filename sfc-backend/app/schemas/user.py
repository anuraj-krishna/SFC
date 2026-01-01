"""User profile schemas."""
from datetime import datetime

from pydantic import BaseModel, Field


class OnboardingRequest(BaseModel):
    """Request schema for onboarding questionnaire."""

    # Basic info
    display_name: str | None = Field(None, max_length=100)
    age_range: str | None = Field(None, pattern="^(18-29|30-45|46-65|65\\+)$")
    gender: str | None = Field(None, pattern="^(male|female|other|prefer_not_to_say)$")
    height_cm: int | None = Field(None, ge=100, le=250)
    weight_kg: float | None = Field(None, ge=30, le=300)
    fitness_level: str | None = Field(None, pattern="^(beginner|intermediate|advanced)$")

    # Goals
    primary_goal: str | None = Field(
        None,
        pattern="^(weight_loss|muscle_gain|flexibility|endurance|rehab_mobility|general_fitness)$",
    )
    secondary_goals: list[str] | None = None

    # Availability
    days_per_week: int | None = Field(None, ge=1, le=7)
    minutes_per_session: int | None = Field(None, ge=10, le=180)
    preferred_days: list[str] | None = None  # ["monday", "wednesday", "friday"]

    # Constraints
    injuries: str | None = None
    equipment_available: list[str] | None = None  # ["none", "dumbbells", "bands", "gym"]
    workout_location: str | None = Field(None, pattern="^(home|gym|both)$")

    # Preferences
    prefers_cardio: bool | None = None
    prefers_strength: bool | None = None
    interested_in_yoga: bool | None = None

    # Health disclaimer
    health_disclaimer_accepted: bool = Field(
        ..., description="User must accept health disclaimer"
    )


class UserProfileResponse(BaseModel):
    """Response schema for user profile."""

    id: str
    user_id: str
    display_name: str | None
    age_range: str | None
    gender: str | None
    height_cm: int | None
    weight_kg: float | None
    fitness_level: str | None
    primary_goal: str | None
    secondary_goals: list[str] | None
    days_per_week: int | None
    minutes_per_session: int | None
    preferred_days: list[str] | None
    injuries: str | None
    equipment_available: list[str] | None
    workout_location: str | None
    prefers_cardio: bool | None
    prefers_strength: bool | None
    interested_in_yoga: bool | None
    health_disclaimer_accepted_at: datetime | None
    onboarding_completed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UpdateProfileRequest(BaseModel):
    """Request schema for updating profile."""

    display_name: str | None = Field(None, max_length=100)
    height_cm: int | None = Field(None, ge=100, le=250)
    weight_kg: float | None = Field(None, ge=30, le=300)
    fitness_level: str | None = Field(None, pattern="^(beginner|intermediate|advanced)$")
    primary_goal: str | None = Field(
        None,
        pattern="^(weight_loss|muscle_gain|flexibility|endurance|rehab_mobility|general_fitness)$",
    )
    days_per_week: int | None = Field(None, ge=1, le=7)
    minutes_per_session: int | None = Field(None, ge=10, le=180)

