# SFC Backend

FastAPI backend for SFC Gym & Fitness Center.

## Features

- **Authentication**: Email/password signup with OTP verification, JWT tokens
- **User Profiles**: Onboarding questionnaire, fitness goals, preferences
- **Programs**: Curated fitness programs with progress tracking
- **Admin APIs**: Program and content management
- **GDPR/DPDP Compliant**: Consent tracking, data export, account deletion

## Tech Stack

- **Framework**: FastAPI (async Python)
- **Database**: PostgreSQL + SQLAlchemy 2.0 (async)
- **Migrations**: Alembic
- **Auth**: JWT (python-jose) + bcrypt
- **Email**: AWS SES
- **Container**: Docker + docker-compose

## Quickstart (Docker)

```bash
# Start services (API + Postgres)
docker compose up --build

# Run migrations (first time or after model changes)
docker compose exec api alembic upgrade head
```

API: `http://localhost:8000`
Swagger: `http://localhost:8000/api/docs` (debug mode only)
Health: `http://localhost:8000/api/v1/health`

## Local Development (without Docker)

```bash
# Create virtualenv
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables (or create .env file)
export DATABASE_URL="postgresql+asyncpg://sfc:sfc@localhost:5432/sfc"
export SECRET_KEY="your-secret-key"
export DEBUG="true"

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PROJECT_NAME` | Application name | `sfc-backend` |
| `ENV` | Environment (local/staging/production) | `local` |
| `DEBUG` | Enable debug mode | `false` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://sfc:sfc@localhost:5432/sfc` |
| `SECRET_KEY` | JWT signing secret (change in production!) | - |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT access token TTL | `15` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL | `30` |
| `OTP_EXPIRE_MINUTES` | OTP code expiry | `10` |
| `OTP_MAX_ATTEMPTS` | Max OTP requests per hour | `3` |
| `AWS_REGION` | AWS region for SES | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key (optional on EC2 with IAM role) | - |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | - |
| `SES_SENDER_EMAIL` | Verified SES sender email | - |
| `CORS_ORIGINS` | Allowed CORS origins (JSON array) | `["http://localhost:3000"]` |

## API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Register new user |
| POST | `/verify-otp` | Verify email OTP |
| POST | `/resend-otp` | Resend verification OTP |
| POST | `/signin` | Sign in with email/password |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Revoke refresh token |
| POST | `/forgot-password` | Request password reset OTP |
| POST | `/reset-password` | Reset password with OTP |
| POST | `/change-password` | Change password (authenticated) |
| GET | `/me` | Get current user |
| GET | `/status` | Get auth status + profile info |

### Users (`/api/v1/users`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/onboarding` | Complete onboarding questionnaire |
| GET | `/profile` | Get user profile |
| PUT | `/profile` | Update user profile |

### Programs (`/api/v1/programs`) - Coming soon

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all programs |
| GET | `/{id}` | Get program details |
| POST | `/{id}/enroll` | Enroll in program (max 3 active) |
| GET | `/enrolled` | List enrolled programs with progress |

### Admin (`/api/v1/admin`) - Coming soon

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/programs` | Create program |
| PUT | `/programs/{id}` | Update program |
| DELETE | `/programs/{id}` | Delete program |

## Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1
```

## AWS SES Setup

1. **Verify sender email/domain** in SES console
2. **Move out of sandbox** (production) to send to unverified emails
3. **Configure credentials**:
   - On EC2: Use IAM role (no credentials needed)
   - Local: Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

**Free tier**: 3,000 emails/month for first 12 months, then $0.10 per 1,000 emails.

## Project Structure

```
sfc-backend/
├── app/
│   ├── api/
│   │   ├── deps.py          # Dependencies (auth, db)
│   │   ├── router.py        # Route aggregation
│   │   └── routes/          # API endpoints
│   ├── core/
│   │   ├── config.py        # Settings
│   │   └── logging.py       # Logging setup
│   ├── db/
│   │   ├── base.py          # SQLAlchemy base
│   │   └── session.py       # DB session
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic
│   └── main.py              # App factory
├── alembic/                 # Migrations
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── postman_collection.json  # API collection
```
