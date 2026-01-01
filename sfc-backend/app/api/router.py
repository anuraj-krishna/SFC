"""API router aggregating all route modules."""
from fastapi import APIRouter

from app.api.routes import admin, auth, health, privacy, programs, users

api_router = APIRouter()

# Health check
api_router.include_router(health.router, tags=["Health"])

# Authentication
api_router.include_router(auth.router)

# User profile and onboarding
api_router.include_router(users.router)

# Programs and progress
api_router.include_router(programs.router)

# Privacy and GDPR/DPDP compliance
api_router.include_router(privacy.router)

# Admin endpoints
api_router.include_router(admin.router)
