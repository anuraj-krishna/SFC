"""Admin API routes for program management."""
import json

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import AdminUser, DBSession
from app.schemas.program import (
    ProgramCreate,
    ProgramDetailResponse,
    ProgramResponse,
    ProgramUpdate,
    WorkoutCreate,
    WorkoutResponse,
    WorkoutUpdate,
)
from app.services.program import (
    ProgramError,
    add_workout_to_program,
    create_program,
    delete_program,
    delete_workout,
    get_program_by_id,
    get_workout_by_id,
    list_all_programs,
    update_program,
    update_workout,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


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


# --- Program management ---


@router.get("/programs", response_model=list[ProgramResponse])
async def admin_list_programs(
    db: DBSession,
    _admin: AdminUser,
    include_unpublished: bool = Query(True),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """List all programs (including unpublished)."""
    programs = await list_all_programs(
        db,
        include_unpublished=include_unpublished,
        limit=limit,
        offset=offset,
    )
    return [_program_to_response(p) for p in programs]


@router.post("/programs", response_model=ProgramDetailResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_program(
    data: ProgramCreate,
    db: DBSession,
    _admin: AdminUser,
):
    """
    Create a new program.

    - Program starts as unpublished
    - Optionally include workouts in the request
    """
    try:
        workouts_data = None
        if data.workouts:
            workouts_data = [w.model_dump() for w in data.workouts]

        program = await create_program(
            db,
            title=data.title,
            goal=data.goal,
            difficulty=data.difficulty,
            duration_weeks=data.duration_weeks,
            days_per_week=data.days_per_week,
            minutes_per_session=data.minutes_per_session,
            description=data.description,
            thumbnail_url=data.thumbnail_url,
            equipment_needed=data.equipment_needed,
            is_featured=data.is_featured,
            workouts=workouts_data,
        )
        await db.commit()

        # Reload with workouts
        program = await get_program_by_id(db, program.id, include_workouts=True)

        return ProgramDetailResponse(
            **_program_to_response(program).model_dump(),
            workouts=[_workout_to_response(w) for w in program.workouts],
            total_workouts=len(program.workouts),
        )

    except ProgramError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": e.message, "code": e.code},
        )


@router.get("/programs/{program_id}", response_model=ProgramDetailResponse)
async def admin_get_program(
    program_id: str,
    db: DBSession,
    _admin: AdminUser,
):
    """Get program details (including unpublished)."""
    program = await get_program_by_id(db, program_id, include_workouts=True)
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program not found",
        )

    return ProgramDetailResponse(
        **_program_to_response(program).model_dump(),
        workouts=[_workout_to_response(w) for w in program.workouts],
        total_workouts=len(program.workouts),
    )


@router.put("/programs/{program_id}", response_model=ProgramResponse)
async def admin_update_program(
    program_id: str,
    data: ProgramUpdate,
    db: DBSession,
    _admin: AdminUser,
):
    """Update a program."""
    try:
        updates = data.model_dump(exclude_unset=True)
        program = await update_program(db, program_id, **updates)
        await db.commit()

        return _program_to_response(program)

    except ProgramError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": e.message, "code": e.code},
        )


@router.delete("/programs/{program_id}")
async def admin_delete_program(
    program_id: str,
    db: DBSession,
    _admin: AdminUser,
):
    """Delete a program and all its workouts."""
    try:
        await delete_program(db, program_id)
        await db.commit()

        return {"message": "Program deleted successfully"}

    except ProgramError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": e.message, "code": e.code},
        )


@router.post("/programs/{program_id}/publish", response_model=ProgramResponse)
async def admin_publish_program(
    program_id: str,
    db: DBSession,
    _admin: AdminUser,
):
    """Publish a program (make it visible to users)."""
    try:
        program = await update_program(db, program_id, is_published=True)
        await db.commit()

        return _program_to_response(program)

    except ProgramError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": e.message, "code": e.code},
        )


@router.post("/programs/{program_id}/unpublish", response_model=ProgramResponse)
async def admin_unpublish_program(
    program_id: str,
    db: DBSession,
    _admin: AdminUser,
):
    """Unpublish a program (hide from users)."""
    try:
        program = await update_program(db, program_id, is_published=False)
        await db.commit()

        return _program_to_response(program)

    except ProgramError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": e.message, "code": e.code},
        )


# --- Workout management ---


@router.post("/programs/{program_id}/workouts", response_model=WorkoutResponse, status_code=status.HTTP_201_CREATED)
async def admin_add_workout(
    program_id: str,
    data: WorkoutCreate,
    db: DBSession,
    _admin: AdminUser,
):
    """Add a workout to a program."""
    try:
        workout = await add_workout_to_program(db, program_id, data.model_dump())
        await db.commit()

        return _workout_to_response(workout)

    except ProgramError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": e.message, "code": e.code},
        )


@router.put("/workouts/{workout_id}", response_model=WorkoutResponse)
async def admin_update_workout(
    workout_id: str,
    data: WorkoutUpdate,
    db: DBSession,
    _admin: AdminUser,
):
    """Update a workout."""
    try:
        updates = data.model_dump(exclude_unset=True)
        workout = await update_workout(db, workout_id, **updates)
        await db.commit()

        return _workout_to_response(workout)

    except ProgramError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": e.message, "code": e.code},
        )


@router.delete("/workouts/{workout_id}")
async def admin_delete_workout(
    workout_id: str,
    db: DBSession,
    _admin: AdminUser,
):
    """Delete a workout."""
    try:
        await delete_workout(db, workout_id)
        await db.commit()

        return {"message": "Workout deleted successfully"}

    except ProgramError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": e.message, "code": e.code},
        )


@router.get("/workouts/{workout_id}", response_model=WorkoutResponse)
async def admin_get_workout(
    workout_id: str,
    db: DBSession,
    _admin: AdminUser,
):
    """Get workout details."""
    workout = await get_workout_by_id(db, workout_id)
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found",
        )

    return _workout_to_response(workout)

