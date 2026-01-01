"""Program and progress schemas."""
from datetime import datetime

from pydantic import BaseModel, Field


# --- Enums as string literals for schemas ---


# --- Workout schemas ---


class WorkoutBase(BaseModel):
    """Base workout schema."""

    week_number: int = Field(..., ge=1)
    day_number: int = Field(..., ge=1)
    title: str = Field(..., max_length=200)
    description: str | None = None
    intensity: str = Field(..., pattern="^(low|medium|high)$")
    duration_minutes: int = Field(..., ge=1)
    video_url: str = Field(..., max_length=500)
    video_title: str | None = Field(None, max_length=200)
    video_thumbnail: str | None = Field(None, max_length=500)
    calories_estimate: int | None = Field(None, ge=0)
    equipment_needed: list[str] | None = None
    tags: list[str] | None = None
    is_rest_day: bool = False


class WorkoutCreate(WorkoutBase):
    """Schema for creating a workout."""

    pass


class WorkoutUpdate(BaseModel):
    """Schema for updating a workout."""

    title: str | None = Field(None, max_length=200)
    description: str | None = None
    intensity: str | None = Field(None, pattern="^(low|medium|high)$")
    duration_minutes: int | None = Field(None, ge=1)
    video_url: str | None = Field(None, max_length=500)
    video_title: str | None = Field(None, max_length=200)
    video_thumbnail: str | None = Field(None, max_length=500)
    calories_estimate: int | None = Field(None, ge=0)
    equipment_needed: list[str] | None = None
    tags: list[str] | None = None
    is_rest_day: bool | None = None


class WorkoutResponse(WorkoutBase):
    """Response schema for workout."""

    id: str
    program_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkoutWithProgressResponse(WorkoutResponse):
    """Workout with user's completion status."""

    is_completed: bool = False
    completed_at: datetime | None = None
    is_locked: bool = False  # True if previous workout not completed


# --- Program schemas ---


class ProgramBase(BaseModel):
    """Base program schema."""

    title: str = Field(..., max_length=200)
    description: str | None = None
    thumbnail_url: str | None = Field(None, max_length=500)
    goal: str = Field(
        ...,
        pattern="^(weight_loss|muscle_gain|flexibility|endurance|general_fitness|rehab_mobility)$",
    )
    difficulty: str = Field(..., pattern="^(beginner|intermediate|advanced)$")
    equipment_needed: list[str] | None = None
    duration_weeks: int = Field(..., ge=1, le=52)
    days_per_week: int = Field(..., ge=1, le=7)
    minutes_per_session: int = Field(..., ge=5, le=180)
    is_featured: bool = False


class ProgramCreate(ProgramBase):
    """Schema for creating a program."""

    workouts: list[WorkoutCreate] | None = None


class ProgramUpdate(BaseModel):
    """Schema for updating a program."""

    title: str | None = Field(None, max_length=200)
    description: str | None = None
    thumbnail_url: str | None = Field(None, max_length=500)
    goal: str | None = Field(
        None,
        pattern="^(weight_loss|muscle_gain|flexibility|endurance|general_fitness|rehab_mobility)$",
    )
    difficulty: str | None = Field(None, pattern="^(beginner|intermediate|advanced)$")
    equipment_needed: list[str] | None = None
    duration_weeks: int | None = Field(None, ge=1, le=52)
    days_per_week: int | None = Field(None, ge=1, le=7)
    minutes_per_session: int | None = Field(None, ge=5, le=180)
    is_featured: bool | None = None
    is_published: bool | None = None
    order_index: int | None = None


class ProgramResponse(ProgramBase):
    """Response schema for program."""

    id: str
    is_published: bool
    order_index: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProgramDetailResponse(ProgramResponse):
    """Detailed program response with workouts."""

    workouts: list[WorkoutResponse] = []
    total_workouts: int = 0


class ProgramWithProgressResponse(ProgramResponse):
    """Program with user's enrollment progress."""

    enrollment_id: str | None = None
    is_enrolled: bool = False
    current_day: int = 0
    total_days: int = 0
    progress_percent: float = 0.0
    workouts_completed: int = 0
    last_workout_at: datetime | None = None


# --- Enrollment schemas ---


class EnrollRequest(BaseModel):
    """Request to enroll in a program."""

    pass  # No extra data needed, program_id comes from path


class EnrollResponse(BaseModel):
    """Response after enrolling in a program."""

    enrollment_id: str
    program_id: str
    message: str


class UnenrollRequest(BaseModel):
    """Request to unenroll from a program."""

    pass


# --- Progress schemas ---


class MarkCompleteRequest(BaseModel):
    """Request to mark a workout as complete."""

    duration_minutes: int | None = Field(None, ge=1)
    rating: int | None = Field(None, ge=1, le=5)
    difficulty_felt: str | None = Field(None, pattern="^(easy|just_right|hard)$")
    notes: str | None = Field(None, max_length=500)


class MarkCompleteResponse(BaseModel):
    """Response after marking workout complete."""

    completion_id: str
    workout_id: str
    next_workout_id: str | None = None
    program_completed: bool = False
    message: str


class EnrollmentProgressResponse(BaseModel):
    """User's progress in an enrolled program."""

    enrollment_id: str
    program: ProgramResponse
    current_day: int
    total_days: int
    progress_percent: float
    workouts_completed: int
    total_minutes_completed: int
    streak_days: int
    started_at: datetime
    last_workout_at: datetime | None
    is_active: bool
    completed_at: datetime | None
    next_workout: WorkoutResponse | None = None


class ContinueSectionResponse(BaseModel):
    """Response for the "Continue" section on homepage."""

    enrollments: list[EnrollmentProgressResponse]


# --- Recommendation schemas ---


class RecommendedProgramsResponse(BaseModel):
    """Recommended programs for user based on profile."""

    programs: list[ProgramResponse]
    reason: str  # e.g., "Based on your goal: weight loss"

