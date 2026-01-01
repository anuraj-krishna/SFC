"""Program and progress tracking service."""
import json
from datetime import datetime, timezone

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.program import (
    DifficultyLevel,
    IntensityLevel,
    Program,
    ProgramEnrollment,
    ProgramGoal,
    Workout,
    WorkoutCompletion,
)
from app.models.user import User, UserProfile

logger = structlog.get_logger()

MAX_ACTIVE_ENROLLMENTS = 3


class ProgramError(Exception):
    """Custom exception for program errors."""

    def __init__(self, message: str, code: str = "PROGRAM_ERROR"):
        self.message = message
        self.code = code
        super().__init__(message)


# --- Program queries ---


async def get_program_by_id(
    db: AsyncSession,
    program_id: str,
    include_workouts: bool = False,
) -> Program | None:
    """Get program by ID."""
    query = select(Program).where(Program.id == program_id)
    if include_workouts:
        query = query.options(selectinload(Program.workouts))
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def list_published_programs(
    db: AsyncSession,
    goal: str | None = None,
    difficulty: str | None = None,
    featured_only: bool = False,
    limit: int = 50,
    offset: int = 0,
) -> list[Program]:
    """List published programs with optional filters."""
    query = select(Program).where(Program.is_published == True)  # noqa: E712

    if goal:
        query = query.where(Program.goal == goal)
    if difficulty:
        query = query.where(Program.difficulty == difficulty)
    if featured_only:
        query = query.where(Program.is_featured == True)  # noqa: E712

    query = query.order_by(Program.order_index, Program.created_at.desc())
    query = query.limit(limit).offset(offset)

    result = await db.execute(query)
    return list(result.scalars().all())


async def list_all_programs(
    db: AsyncSession,
    include_unpublished: bool = True,
    limit: int = 100,
    offset: int = 0,
) -> list[Program]:
    """List all programs (admin)."""
    query = select(Program)
    if not include_unpublished:
        query = query.where(Program.is_published == True)  # noqa: E712

    query = query.order_by(Program.created_at.desc())
    query = query.limit(limit).offset(offset)

    result = await db.execute(query)
    return list(result.scalars().all())


# --- Enrollment ---


async def get_user_active_enrollments(
    db: AsyncSession,
    user_id: str,
) -> list[ProgramEnrollment]:
    """Get user's active program enrollments."""
    query = (
        select(ProgramEnrollment)
        .where(
            ProgramEnrollment.user_id == user_id,
            ProgramEnrollment.is_active == True,  # noqa: E712
            ProgramEnrollment.completed_at.is_(None),
        )
        .options(selectinload(ProgramEnrollment.program))
        .order_by(ProgramEnrollment.last_workout_at.desc().nullsfirst())
    )
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_enrollment(
    db: AsyncSession,
    user_id: str,
    program_id: str,
) -> ProgramEnrollment | None:
    """Get specific enrollment with program eagerly loaded."""
    query = (
        select(ProgramEnrollment)
        .where(
            ProgramEnrollment.user_id == user_id,
            ProgramEnrollment.program_id == program_id,
        )
        .options(selectinload(ProgramEnrollment.program))
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def enroll_in_program(
    db: AsyncSession,
    user_id: str,
    program_id: str,
) -> ProgramEnrollment:
    """Enroll user in a program."""
    # Check program exists and is published
    program = await get_program_by_id(db, program_id)
    if not program:
        raise ProgramError("Program not found", "PROGRAM_NOT_FOUND")
    if not program.is_published:
        raise ProgramError("Program is not available", "PROGRAM_NOT_PUBLISHED")

    # Check existing enrollment
    existing = await get_enrollment(db, user_id, program_id)
    if existing:
        if existing.is_active and not existing.completed_at:
            raise ProgramError("Already enrolled in this program", "ALREADY_ENROLLED")
        # Re-activate completed/inactive enrollment
        existing.is_active = True
        existing.completed_at = None
        existing.current_day = 1
        existing.started_at = datetime.now(timezone.utc)
        existing.paused_at = None
        await db.flush()
        return existing

    # Check max active enrollments
    active = await get_user_active_enrollments(db, user_id)
    if len(active) >= MAX_ACTIVE_ENROLLMENTS:
        raise ProgramError(
            f"Maximum {MAX_ACTIVE_ENROLLMENTS} active programs allowed",
            "MAX_ENROLLMENTS_REACHED",
        )

    # Create enrollment
    enrollment = ProgramEnrollment(
        user_id=user_id,
        program_id=program_id,
        started_at=datetime.now(timezone.utc),
        current_day=1,
    )
    db.add(enrollment)
    await db.flush()

    logger.info("User enrolled in program", user_id=user_id, program_id=program_id)
    return enrollment


async def unenroll_from_program(
    db: AsyncSession,
    user_id: str,
    program_id: str,
) -> bool:
    """Unenroll user from a program."""
    enrollment = await get_enrollment(db, user_id, program_id)
    if not enrollment:
        raise ProgramError("Not enrolled in this program", "NOT_ENROLLED")

    enrollment.is_active = False
    enrollment.paused_at = datetime.now(timezone.utc)
    await db.flush()

    logger.info("User unenrolled from program", user_id=user_id, program_id=program_id)
    return True


# --- Progress tracking ---


async def get_workout_by_day(
    db: AsyncSession,
    program_id: str,
    day_number: int,
) -> Workout | None:
    """Get workout for a specific day in a program."""
    query = select(Workout).where(
        Workout.program_id == program_id,
        Workout.day_number == day_number,
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_workout_by_id(
    db: AsyncSession,
    workout_id: str,
) -> Workout | None:
    """Get workout by ID."""
    query = select(Workout).where(Workout.id == workout_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def is_workout_completed(
    db: AsyncSession,
    enrollment_id: str,
    workout_id: str,
) -> bool:
    """Check if user has completed a specific workout."""
    query = select(WorkoutCompletion).where(
        WorkoutCompletion.enrollment_id == enrollment_id,
        WorkoutCompletion.workout_id == workout_id,
    )
    result = await db.execute(query)
    return result.scalar_one_or_none() is not None


async def mark_workout_complete(
    db: AsyncSession,
    user_id: str,
    workout_id: str,
    duration_minutes: int | None = None,
    rating: int | None = None,
    difficulty_felt: str | None = None,
    notes: str | None = None,
) -> tuple[WorkoutCompletion, Workout | None, bool]:
    """
    Mark a workout as complete.
    Returns (completion, next_workout, program_completed).
    """
    # Get workout
    workout = await get_workout_by_id(db, workout_id)
    if not workout:
        raise ProgramError("Workout not found", "WORKOUT_NOT_FOUND")

    # Get enrollment
    enrollment = await get_enrollment(db, user_id, workout.program_id)
    if not enrollment or not enrollment.is_active:
        raise ProgramError("Not enrolled in this program", "NOT_ENROLLED")

    # Check if already completed
    if await is_workout_completed(db, enrollment.id, workout_id):
        raise ProgramError("Workout already completed", "ALREADY_COMPLETED")

    # Check gating - previous workout must be completed (except day 1)
    if workout.day_number > 1:
        prev_workout = await get_workout_by_day(db, workout.program_id, workout.day_number - 1)
        if prev_workout and not await is_workout_completed(db, enrollment.id, prev_workout.id):
            raise ProgramError(
                "Complete the previous workout first",
                "PREVIOUS_NOT_COMPLETED",
            )

    # Create completion record
    now = datetime.now(timezone.utc)
    completion = WorkoutCompletion(
        enrollment_id=enrollment.id,
        workout_id=workout_id,
        completed_at=now,
        duration_minutes=duration_minutes or workout.duration_minutes,
        rating=rating,
        difficulty_felt=difficulty_felt,
        notes=notes,
    )
    db.add(completion)

    # Update enrollment stats
    enrollment.total_workouts_completed += 1
    enrollment.total_minutes_completed += duration_minutes or workout.duration_minutes
    enrollment.last_workout_at = now

    # Update current day
    enrollment.current_day = workout.day_number + 1

    # Check if program completed
    total_days = await db.scalar(
        select(func.count(Workout.id)).where(Workout.program_id == workout.program_id)
    )
    program_completed = enrollment.total_workouts_completed >= total_days

    if program_completed:
        enrollment.completed_at = now

    await db.flush()

    # Get next workout
    next_workout = None
    if not program_completed:
        next_workout = await get_workout_by_day(db, workout.program_id, workout.day_number + 1)

    logger.info(
        "Workout completed",
        user_id=user_id,
        workout_id=workout_id,
        program_completed=program_completed,
    )

    return completion, next_workout, program_completed


async def get_enrollment_progress(
    db: AsyncSession,
    enrollment: ProgramEnrollment,
) -> dict:
    """Get detailed progress for an enrollment."""
    # Get total workouts in program
    total_days = await db.scalar(
        select(func.count(Workout.id)).where(Workout.program_id == enrollment.program_id)
    )

    # Get next workout
    next_workout = None
    if enrollment.current_day <= total_days:
        next_workout = await get_workout_by_day(
            db, enrollment.program_id, enrollment.current_day
        )

    progress_percent = (
        (enrollment.total_workouts_completed / total_days * 100) if total_days > 0 else 0
    )

    return {
        "total_days": total_days,
        "progress_percent": round(progress_percent, 1),
        "next_workout": next_workout,
    }


async def get_workouts_with_progress(
    db: AsyncSession,
    enrollment: ProgramEnrollment,
) -> list[dict]:
    """Get all workouts for a program with user's completion status."""
    # Get all workouts
    query = (
        select(Workout)
        .where(Workout.program_id == enrollment.program_id)
        .order_by(Workout.day_number)
    )
    result = await db.execute(query)
    workouts = result.scalars().all()

    # Get completions
    completion_query = select(WorkoutCompletion).where(
        WorkoutCompletion.enrollment_id == enrollment.id
    )
    completion_result = await db.execute(completion_query)
    completions = {c.workout_id: c for c in completion_result.scalars().all()}

    # Build response
    workout_list = []
    for workout in workouts:
        completion = completions.get(workout.id)
        is_completed = completion is not None

        # Gating logic: locked if previous not completed (except day 1)
        is_locked = False
        if workout.day_number > 1 and not is_completed:
            prev_workout = next(
                (w for w in workouts if w.day_number == workout.day_number - 1),
                None,
            )
            if prev_workout and prev_workout.id not in completions:
                is_locked = True

        workout_list.append({
            "workout": workout,
            "is_completed": is_completed,
            "completed_at": completion.completed_at if completion else None,
            "is_locked": is_locked,
        })

    return workout_list


# --- Recommendations ---


async def get_recommended_programs(
    db: AsyncSession,
    user: User,
    limit: int = 6,
) -> tuple[list[Program], str]:
    """Get recommended programs based on user profile."""
    # Get user profile
    profile_query = select(UserProfile).where(UserProfile.user_id == user.id)
    result = await db.execute(profile_query)
    profile = result.scalar_one_or_none()

    reason = "Popular programs"
    filters = {}

    if profile:
        # Map user goal to program goal
        if profile.primary_goal:
            filters["goal"] = profile.primary_goal
            reason = f"Based on your goal: {profile.primary_goal.replace('_', ' ')}"

        # Match difficulty to fitness level
        if profile.fitness_level:
            filters["difficulty"] = profile.fitness_level

    # Build query
    query = select(Program).where(Program.is_published == True)  # noqa: E712

    if filters.get("goal"):
        query = query.where(Program.goal == filters["goal"])
    if filters.get("difficulty"):
        query = query.where(Program.difficulty == filters["difficulty"])

    # Prioritize featured, then by order
    query = query.order_by(
        Program.is_featured.desc(),
        Program.order_index,
        Program.created_at.desc(),
    )
    query = query.limit(limit)

    result = await db.execute(query)
    programs = list(result.scalars().all())

    # If no matches, fall back to featured programs
    if not programs:
        query = (
            select(Program)
            .where(Program.is_published == True)  # noqa: E712
            .order_by(Program.is_featured.desc(), Program.order_index)
            .limit(limit)
        )
        result = await db.execute(query)
        programs = list(result.scalars().all())
        reason = "Featured programs"

    return programs, reason


# --- Admin operations ---


def _serialize_list(value: list | None) -> str | None:
    """Serialize list to JSON string."""
    if value is None:
        return None
    return json.dumps(value)


async def create_program(
    db: AsyncSession,
    title: str,
    goal: str,
    difficulty: str,
    duration_weeks: int,
    days_per_week: int,
    minutes_per_session: int,
    description: str | None = None,
    thumbnail_url: str | None = None,
    equipment_needed: list[str] | None = None,
    is_featured: bool = False,
    workouts: list[dict] | None = None,
) -> Program:
    """Create a new program (admin)."""
    program = Program(
        title=title,
        description=description,
        thumbnail_url=thumbnail_url,
        goal=ProgramGoal(goal),
        difficulty=DifficultyLevel(difficulty),
        equipment_needed=_serialize_list(equipment_needed),
        duration_weeks=duration_weeks,
        days_per_week=days_per_week,
        minutes_per_session=minutes_per_session,
        is_featured=is_featured,
        is_published=False,  # Start unpublished
    )
    db.add(program)
    await db.flush()

    # Create workouts if provided
    if workouts:
        for w_data in workouts:
            workout = Workout(
                program_id=program.id,
                week_number=w_data["week_number"],
                day_number=w_data["day_number"],
                title=w_data["title"],
                description=w_data.get("description"),
                intensity=IntensityLevel(w_data["intensity"]),
                duration_minutes=w_data["duration_minutes"],
                video_url=w_data["video_url"],
                video_title=w_data.get("video_title"),
                video_thumbnail=w_data.get("video_thumbnail"),
                calories_estimate=w_data.get("calories_estimate"),
                equipment_needed=_serialize_list(w_data.get("equipment_needed")),
                tags=_serialize_list(w_data.get("tags")),
                is_rest_day=w_data.get("is_rest_day", False),
            )
            db.add(workout)

    await db.flush()
    logger.info("Program created", program_id=program.id, title=title)
    return program


async def update_program(
    db: AsyncSession,
    program_id: str,
    **updates,
) -> Program:
    """Update a program (admin)."""
    program = await get_program_by_id(db, program_id)
    if not program:
        raise ProgramError("Program not found", "PROGRAM_NOT_FOUND")

    # Handle enum conversions
    if "goal" in updates and updates["goal"]:
        updates["goal"] = ProgramGoal(updates["goal"])
    if "difficulty" in updates and updates["difficulty"]:
        updates["difficulty"] = DifficultyLevel(updates["difficulty"])
    if "equipment_needed" in updates:
        updates["equipment_needed"] = _serialize_list(updates["equipment_needed"])

    for key, value in updates.items():
        if value is not None and hasattr(program, key):
            setattr(program, key, value)

    await db.flush()
    logger.info("Program updated", program_id=program_id)
    return program


async def delete_program(
    db: AsyncSession,
    program_id: str,
) -> bool:
    """Delete a program (admin)."""
    program = await get_program_by_id(db, program_id)
    if not program:
        raise ProgramError("Program not found", "PROGRAM_NOT_FOUND")

    await db.delete(program)
    await db.flush()
    logger.info("Program deleted", program_id=program_id)
    return True


async def add_workout_to_program(
    db: AsyncSession,
    program_id: str,
    workout_data: dict,
) -> Workout:
    """Add a workout to a program (admin)."""
    program = await get_program_by_id(db, program_id)
    if not program:
        raise ProgramError("Program not found", "PROGRAM_NOT_FOUND")

    workout = Workout(
        program_id=program_id,
        week_number=workout_data["week_number"],
        day_number=workout_data["day_number"],
        title=workout_data["title"],
        description=workout_data.get("description"),
        intensity=IntensityLevel(workout_data["intensity"]),
        duration_minutes=workout_data["duration_minutes"],
        video_url=workout_data["video_url"],
        video_title=workout_data.get("video_title"),
        video_thumbnail=workout_data.get("video_thumbnail"),
        calories_estimate=workout_data.get("calories_estimate"),
        equipment_needed=_serialize_list(workout_data.get("equipment_needed")),
        tags=_serialize_list(workout_data.get("tags")),
        is_rest_day=workout_data.get("is_rest_day", False),
    )
    db.add(workout)
    await db.flush()
    logger.info("Workout added", program_id=program_id, workout_id=workout.id)
    return workout


async def update_workout(
    db: AsyncSession,
    workout_id: str,
    **updates,
) -> Workout:
    """Update a workout (admin)."""
    workout = await get_workout_by_id(db, workout_id)
    if not workout:
        raise ProgramError("Workout not found", "WORKOUT_NOT_FOUND")

    if "intensity" in updates and updates["intensity"]:
        updates["intensity"] = IntensityLevel(updates["intensity"])
    if "equipment_needed" in updates:
        updates["equipment_needed"] = _serialize_list(updates["equipment_needed"])
    if "tags" in updates:
        updates["tags"] = _serialize_list(updates["tags"])

    for key, value in updates.items():
        if value is not None and hasattr(workout, key):
            setattr(workout, key, value)

    await db.flush()
    logger.info("Workout updated", workout_id=workout_id)
    return workout


async def delete_workout(
    db: AsyncSession,
    workout_id: str,
) -> bool:
    """Delete a workout (admin)."""
    workout = await get_workout_by_id(db, workout_id)
    if not workout:
        raise ProgramError("Workout not found", "WORKOUT_NOT_FOUND")

    await db.delete(workout)
    await db.flush()
    logger.info("Workout deleted", workout_id=workout_id)
    return True

