#!/bin/bash

set -e

echo "🚀 Starting SFC Backend..."

# Start services
echo "📦 Starting Docker containers..."
docker compose up --build -d

# Wait for database to be ready
echo "⏳ Waiting for database to be healthy..."
sleep 5

# Run migrations
echo "🔄 Running database migrations..."
docker compose exec api alembic upgrade head

# Create default admin user
echo "👤 Creating admin user..."
docker compose exec api python -m app.cli create-admin admin@sfc.com yourpassword123

echo ""
echo "✅ SFC Backend is ready!"
echo ""
echo "📍 API:     http://localhost:8000"
echo "📍 Docs:    http://localhost:8000/api/docs"
echo "📍 Health:  http://localhost:8000/api/v1/health"
echo ""
echo "🔐 Admin credentials:"
echo "   Email:    admin@sfc.com"
echo "   Password: yourpassword123"
echo ""
echo "⚠️  Change the admin password in production!"

