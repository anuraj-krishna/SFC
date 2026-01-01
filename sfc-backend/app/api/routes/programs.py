"""Program API routes (public + authenticated user)."""
import json

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import DBSession, VerifiedUser
from app.schemas.program import (
    ContinueSectionResponse,
    EnrollmentProgressResponse,
    EnrollResponse,
    MarkCompleteRequest,
    MarkCompleteResponse,
    ProgramDetailResponse,
    ProgramResponse,
    ProgramWithProgressResponse,
    RecommendedProgramsResponse,
    WorkoutResponse,
    WorkoutWithProgressResponse,
)
from app.services.program import (
    ProgramError,
    enroll_in_program,
    get_enrollment,
    get_enrollment_progress,
    get_program_by_id,
    get_recommended_programs,
    get_user_active_enrollments,
    get_workouts_with_progress,
    list_published_programs,
    mark_workout_complete,
    unenroll_from_program,
)

router = APIRouter(prefix="/programs", tags=["Programs"])


def _deserialize_list(value: str | None) -> list | None:
    """Deserialize JSON string to list."""
    if value is None:
        return None
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return None


def _program_to_response(program) -> ProgramResponse:
    """Convert program model to response."""
    return ProgramResponse(
        id=program.id,
        title=program.title,
        description=program.description,
        thumbnail_url=program.thumbnail_url,
        goal=program.goal.value,
        difficulty=program.difficulty.value,
        equipment_needed=_deserialize_list(program.equipment_needed),
        duration_weeks=program.duration_weeks,
        days_per_week=program.days_per_week,
        minutes_per_session=program.minutes_per_session,
        is_featured=program.is_featured,
        is_published=program.is_published,
        order_index=program.order_index,
        created_at=program.created_at,
        updated_at=program.updated_at,
    )


def _workout_to_response(workout) -> WorkoutResponse:
    """Convert workout model to response."""
    return WorkoutResponse(
        id=workout.id,
        program_id=workout.program_id,
        week_number=workout.week_number,
        day_number=workout.day_number,
        title=workout.title,
        description=workout.description,
        intensity=workout.intensity.value,
        duration_minutes=workout.duration_minutes,
        video_url=workout.video_url,
        video_title=workout.video_title,
        video_thumbnail=workout.video_thumbnail,
        calories_estimate=workout.calories_estimate,
        equipment_needed=_deserialize_list(workout.equipment_needed),
        tags=_deserialize_list(workout.tags),
        is_rest_day=workout.is_rest_day,
        created_at=workout.created_at,
        updated_at=workout.updated_at,
    )


# --- Public endpoints ---


@router.get("", response_model=list[ProgramResponse])
async def list_programs(
    db: DBSession,
    goal: str | None = Query(None, description="Filter by goal"),
    difficulty: str | None = Query(None, description="Filter by difficulty"),
    featured: bool = Query(False, description="Only featured programs"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    List published programs.

    - Optional filters by goal and difficulty
    - Can filter to featured programs only
    """
    programs = await list_published_programs(
        db,
        goal=goal,
        difficulty=difficulty,
        featured_only=featured,
        limit=limit,
        offset=offset,
    )
    return [_program_to_response(p) for p in programs]


@router.get("/featured", response_model=list[ProgramResponse])
async def list_featured_programs(
    db: DBSession,
    limit: int = Query(6, ge=1, le=20),
):
    """Get featured programs for homepage."""
    programs = await list_published_programs(db, featured_only=True, limit=limit)
    return [_program_to_response(p) for p in programs]


@router.get("/recommended", response_model=RecommendedProgramsResponse)
async def get_recommendations(
    db: DBSession,
    current_user: VerifiedUser,
    limit: int = Query(6, ge=1, le=20),
):
    """
    Get personalized program recommendations.

    Based on user profile:
    - Primary goal
    - Fitness level
    """
    programs, reason = await get_recommended_programs(db, current_user, limit=limit)
    return RecommendedProgramsResponse(
        programs=[_program_to_response(p) for p in programs],
        reason=reason,
    )


@router.get("/continue", response_model=ContinueSectionResponse)
async def get_continue_section(
    db: DBSession,
    current_user: VerifiedUser,
):
    """
    Get user's enrolled programs with progress.

    Returns active enrollments for "Continue" section on homepage.
    """
    enrollments = await get_user_active_enrollments(db, current_user.id)

    enrollment_responses = []
    for enrollment in enrollments:
        progress = await get_enrollment_progress(db, enrollment)
        next_workout = progress.get("next_workout")

        enrollment_responses.append(
            EnrollmentProgressResponse(
                enrollment_id=enrollment.id,
                program=_program_to_response(enrollment.program),
                current_day=enrollment.current_day,
                total_days=progress["total_days"],
                progress_percent=progress["progress_percent"],
                workouts_completed=enrollment.total_workouts_completed,
                total_minutes_completed=enrollment.total_minutes_completed,
                streak_days=enrollment.streak_days,
                started_at=enrollment.started_at,
                last_workout_at=enrollment.last_workout_at,
                is_active=enrollment.is_active,
                completed_at=enrollment.completed_at,
                next_workout=_workout_to_response(next_workout) if next_workout else None,
            )
        )

    return ContinueSectionResponse(enrollments=enrollment_responses)


@router.get("/{program_id}", response_model=ProgramDetailResponse)
async def get_program(
    program_id: str,
    db: DBSession,
):
    """Get program details with workouts."""
    program = await get_program_by_id(db, program_id, include_workouts=True)
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program not found",
        )

    if not program.is_published:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program not found",
        )

    return ProgramDetailResponse(
        **_program_to_response(program).model_dump(),
        workouts=[_workout_to_response(w) for w in program.workouts],
        total_workouts=len(program.workouts),
    )


# --- Authenticated user endpoints ---


@router.post("/{program_id}/enroll", response_model=EnrollResponse)
async def enroll(
    program_id: str,
    db: DBSession,
    current_user: VerifiedUser,
):
    """
    Enroll in a program.

    - Maximum 3 active programs allowed
    - Re-enrolling in completed program restarts progress
    """
    try:
        enrollment = await enroll_in_program(db, current_user.id, program_id)
        await db.commit()

        return EnrollResponse(
            enrollment_id=enrollment.id,
            program_id=program_id,
            message="Successfully enrolled in program",
        )

    except ProgramError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": e.message, "code": e.code},
        )


@router.delete("/{program_id}/enroll", response_model=dict)
async def unenroll(
    program_id: str,
    db: DBSession,
    current_user: VerifiedUser,
):
    """Unenroll from a program (pause progress)."""
    try:
        await unenroll_from_program(db, current_user.id, program_id)
        await db.commit()

        return {"message": "Successfully unenrolled from program"}

    except ProgramError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": e.message, "code": e.code},
        )


@router.get("/{program_id}/progress", response_model=EnrollmentProgressResponse)
async def get_program_progress(
    program_id: str,
    db: DBSession,
    current_user: VerifiedUser,
):
    """Get user's progress in an enrolled program."""
    enrollment = await get_enrollment(db, current_user.id, program_id)
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not enrolled in this program",
        )

    progress = await get_enrollment_progress(db, enrollment)
    next_workout = progress.get("next_workout")

    return EnrollmentProgressResponse(
        enrollment_id=enrollment.id,
        program=_program_to_response(enrollment.program),
        current_day=enrollment.current_day,
        total_days=progress["total_days"],
        progress_percent=progress["progress_percent"],
        workouts_completed=enrollment.total_workouts_completed,
        total_minutes_completed=enrollment.total_minutes_completed,
        streak_days=enrollment.streak_days,
        started_at=enrollment.started_at,
        last_workout_at=enrollment.last_workout_at,
        is_active=enrollment.is_active,
        completed_at=enrollment.completed_at,
        next_workout=_workout_to_response(next_workout) if next_workout else None,
    )


@router.get("/{program_id}/workouts", response_model=list[WorkoutWithProgressResponse])
async def get_program_workouts_with_progress(
    program_id: str,
    db: DBSession,
    current_user: VerifiedUser,
):
    """
    Get all workouts in a program with user's completion status.

    - Shows which workouts are completed
    - Shows which workouts are locked (previous not completed)
    """
    enrollment = await get_enrollment(db, current_user.id, program_id)
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not enrolled in this program",
        )

    workouts_data = await get_workouts_with_progress(db, enrollment)

    return [
        WorkoutWithProgressResponse(
            **_workout_to_response(w["workout"]).model_dump(),
            is_completed=w["is_completed"],
            completed_at=w["completed_at"],
            is_locked=w["is_locked"],
        )
        for w in workouts_data
    ]


@router.post("/workouts/{workout_id}/complete", response_model=MarkCompleteResponse)
async def complete_workout(
    workout_id: str,
    data: MarkCompleteRequest,
    db: DBSession,
    current_user: VerifiedUser,
):
    """
    Mark a workout as complete.

    - Must be enrolled in the program
    - Previous workout must be completed (gating)
    - Returns next workout info if available
    """
    try:
        completion, next_workout, program_completed = await mark_workout_complete(
            db,
            current_user.id,
            workout_id,
            duration_minutes=data.duration_minutes,
            rating=data.rating,
            difficulty_felt=data.difficulty_felt,
            notes=data.notes,
        )
        await db.commit()

        message = "Workout completed!"
        if program_completed:
            message = "Congratulations! You've completed the program!"

        return MarkCompleteResponse(
            completion_id=completion.id,
            workout_id=workout_id,
            next_workout_id=next_workout.id if next_workout else None,
            program_completed=program_completed,
            message=message,
        )

    except ProgramError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": e.message, "code": e.code},
        )

