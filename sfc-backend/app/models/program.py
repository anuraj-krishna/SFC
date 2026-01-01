"""Program, workout, and progress tracking models."""
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDMixin


class ProgramGoal(str, PyEnum):
    """Program goal categories."""

    WEIGHT_LOSS = "weight_loss"
    MUSCLE_GAIN = "muscle_gain"
    FLEXIBILITY = "flexibility"
    ENDURANCE = "endurance"
    GENERAL_FITNESS = "general_fitness"
    REHAB_MOBILITY = "rehab_mobility"


class DifficultyLevel(str, PyEnum):
    """Difficulty levels."""

    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class IntensityLevel(str, PyEnum):
    """Workout intensity levels."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Program(Base, UUIDMixin, TimestampMixin):
    """Fitness program (curated collection of workouts)."""

    __tablename__ = "programs"

    # Basic info
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Categorization
    goal: Mapped[ProgramGoal] = mapped_column(Enum(ProgramGoal), nullable=False)
    difficulty: Mapped[DifficultyLevel] = mapped_column(Enum(DifficultyLevel), nullable=False)
    equipment_needed: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array

    # Duration
    duration_weeks: Mapped[int] = mapped_column(Integer, nullable=False)
    days_per_week: Mapped[int] = mapped_column(Integer, nullable=False)
    minutes_per_session: Mapped[int] = mapped_column(Integer, nullable=False)

    # Metadata
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    workouts: Mapped[list["Workout"]] = relationship(
        "Workout",
        back_populates="program",
        order_by="Workout.day_number",
        lazy="selectin",
    )
    enrollments: Mapped[list["ProgramEnrollment"]] = relationship(
        "ProgramEnrollment", back_populates="program", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_programs_goal", "goal"),
        Index("ix_programs_difficulty", "difficulty"),
        Index("ix_programs_featured", "is_featured", "is_published"),
    )


class Workout(Base, UUIDMixin, TimestampMixin):
    """A single workout session within a program."""

    __tablename__ = "workouts"

    program_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("programs.id", ondelete="CASCADE"), nullable=False
    )

    # Position in program
    week_number: Mapped[int] = mapped_column(Integer, nullable=False)
    day_number: Mapped[int] = mapped_column(Integer, nullable=False)  # Overall day (1, 2, 3...)

    # Workout info
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    intensity: Mapped[IntensityLevel] = mapped_column(Enum(IntensityLevel), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)

    # Video content
    video_url: Mapped[str] = mapped_column(String(500), nullable=False)  # YouTube URL
    video_title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    video_thumbnail: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Optional metadata
    calories_estimate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    equipment_needed: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array
    tags: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array

    # Rest day indicator
    is_rest_day: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    program: Mapped["Program"] = relationship("Program", back_populates="workouts")
    completions: Mapped[list["WorkoutCompletion"]] = relationship(
        "WorkoutCompletion", back_populates="workout", lazy="selectin"
    )

    __table_args__ = (
        UniqueConstraint("program_id", "day_number", name="uq_workout_program_day"),
        Index("ix_workouts_program", "program_id"),
    )


class ProgramEnrollment(Base, UUIDMixin, TimestampMixin):
    """User enrollment in a program."""

    __tablename__ = "program_enrollments"

    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    program_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("programs.id", ondelete="CASCADE"), nullable=False
    )

    # Progress tracking
    current_day: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    paused_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Stats
    total_workouts_completed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_minutes_completed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    streak_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_workout_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    program: Mapped["Program"] = relationship("Program", back_populates="enrollments")
    completions: Mapped[list["WorkoutCompletion"]] = relationship(
        "WorkoutCompletion", back_populates="enrollment", lazy="selectin"
    )

    __table_args__ = (
        UniqueConstraint("user_id", "program_id", name="uq_enrollment_user_program"),
        Index("ix_enrollments_user_active", "user_id", "is_active"),
    )


class WorkoutCompletion(Base, UUIDMixin, TimestampMixin):
    """Record of a user completing a workout."""

    __tablename__ = "workout_completions"

    enrollment_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("program_enrollments.id", ondelete="CASCADE"), nullable=False
    )
    workout_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("workouts.id", ondelete="CASCADE"), nullable=False
    )

    # Completion info
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Optional user feedback
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 1-5
    difficulty_felt: Mapped[str | None] = mapped_column(String(20), nullable=True)  # easy, just_right, hard
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    enrollment: Mapped["ProgramEnrollment"] = relationship("ProgramEnrollment", back_populates="completions")
    workout: Mapped["Workout"] = relationship("Workout", back_populates="completions")

    __table_args__ = (
        UniqueConstraint("enrollment_id", "workout_id", name="uq_completion_enrollment_workout"),
        Index("ix_completions_enrollment", "enrollment_id"),
    )

