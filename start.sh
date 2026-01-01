#!/bin/bash

# SFC - Start Script
# Starts both backend and frontend services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Print banner
echo -e "${PURPLE}"
echo "╔═══════════════════════════════════════════╗"
echo "║     SFC Gym & Fitness Center              ║"
echo "║     Starting Development Servers          ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/sfc-backend"
FRONTEND_DIR="$SCRIPT_DIR/sfc-frontend"

# Check if directories exist
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}Error: Backend directory not found at $BACKEND_DIR${NC}"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}Error: Frontend directory not found at $FRONTEND_DIR${NC}"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    
    # Kill all child processes
    if [ ! -z "$BACKEND_PID" ]; then
        echo -e "${BLUE}Stopping backend (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        echo -e "${BLUE}Stopping frontend (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    # Kill any remaining processes on the ports
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

# Set up trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Check for required commands
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed${NC}"
        exit 1
    fi
}

# Parse command line arguments
USE_DOCKER=false
SETUP_ONLY=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --docker) USE_DOCKER=true ;;
        --setup) SETUP_ONLY=true ;;
        --help|-h)
            echo "Usage: ./start.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --docker    Use Docker Compose to start all services"
            echo "  --setup     Only install dependencies, don't start servers"
            echo "  --help, -h  Show this help message"
            echo ""
            echo "Without options, starts backend and frontend in development mode"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Docker mode
if [ "$USE_DOCKER" = true ]; then
    echo -e "${BLUE}Starting with Docker Compose...${NC}"
    check_command docker
    
    cd "$SCRIPT_DIR"
    
    # Start services
    echo -e "${BLUE}Starting Docker containers...${NC}"
    docker compose up --build -d
    
    # Wait for database to be ready
    echo -e "${YELLOW}Waiting for database to be healthy...${NC}"
    sleep 5
    
    # Run migrations
    echo -e "${YELLOW}Running database migrations...${NC}"
    docker compose exec api alembic upgrade head || true
    
    # Create default admin user
    echo -e "${YELLOW}Creating default admin user...${NC}"
    docker compose exec api python -m app.cli create-admin admin@sfc.com adminpassword123 || true
    
    echo -e "\n${GREEN}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     All services are running!             ║${NC}"
    echo -e "${GREEN}╠═══════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║  Frontend:  http://localhost:3000         ║${NC}"
    echo -e "${GREEN}║  Backend:   http://localhost:8000         ║${NC}"
    echo -e "${GREEN}║  API Docs:  http://localhost:8000/api/docs║${NC}"
    echo -e "${GREEN}╠═══════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║  🔐 Admin Credentials:                    ║${NC}"
    echo -e "${GREEN}║     Email:    admin@sfc.com               ║${NC}"
    echo -e "${GREEN}║     Password: adminpassword123            ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
    echo -e "\n${YELLOW}⚠️  Change the admin password in production!${NC}"
    echo -e "${YELLOW}Run 'docker compose logs -f' to see logs${NC}"
    echo -e "${YELLOW}Run 'docker compose down' to stop all services${NC}\n"
    
    exit 0
fi

# Development mode
echo -e "${BLUE}Starting in development mode...${NC}"

# Check for Python, Node, and Docker
check_command python3
check_command node
check_command npm
check_command docker

# Setup Backend
echo -e "\n${YELLOW}Setting up Backend...${NC}"
cd "$BACKEND_DIR"

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo -e "${BLUE}Creating Python virtual environment...${NC}"
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Install dependencies
echo -e "${BLUE}Installing backend dependencies...${NC}"
pip install -q -r requirements.txt

# Setup Frontend
echo -e "\n${YELLOW}Setting up Frontend...${NC}"
cd "$FRONTEND_DIR"

# Install dependencies if node_modules doesn't exist or package.json changed
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo -e "${BLUE}Installing frontend dependencies...${NC}"
    npm install
fi

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo -e "${BLUE}Creating .env.local...${NC}"
    echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local
fi

# Exit if setup only
if [ "$SETUP_ONLY" = true ]; then
    echo -e "\n${GREEN}Setup complete!${NC}"
    echo -e "Run ${YELLOW}./start.sh${NC} to start the servers."
    exit 0
fi

# Kill any existing processes on ports 8000 and 3000
echo -e "\n${YELLOW}Checking for existing processes on ports 8000 and 3000...${NC}"
if lsof -ti:8000 > /dev/null 2>&1; then
    echo -e "${BLUE}Killing existing process on port 8000...${NC}"
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${BLUE}Killing existing process on port 3000...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Function to wait for PostgreSQL to be ready
wait_for_postgres() {
    echo -e "\n${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if pg_isready -h localhost -p 5432 -U sfc -d sfc >/dev/null 2>&1; then
            echo -e "${GREEN}PostgreSQL is ready!${NC}"
            return 0
        fi
        
        # Alternative check using psql if pg_isready is not available
        if command -v psql &> /dev/null; then
            if PGPASSWORD=sfc psql -h localhost -p 5432 -U sfc -d sfc -c "SELECT 1" >/dev/null 2>&1; then
                echo -e "${GREEN}PostgreSQL is ready!${NC}"
                return 0
            fi
        fi
        
        # Alternative check using docker exec
        if docker exec sfc-db pg_isready -U sfc -d sfc >/dev/null 2>&1; then
            echo -e "${GREEN}PostgreSQL is ready!${NC}"
            return 0
        fi
        
        echo -e "${BLUE}  Attempt $attempt/$max_attempts - waiting for PostgreSQL...${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}PostgreSQL is not ready after $max_attempts attempts${NC}"
    echo -e "${YELLOW}Please ensure PostgreSQL is running with:${NC}"
    echo -e "${BLUE}  docker run -d --name sfc-db -e POSTGRES_USER=sfc -e POSTGRES_PASSWORD=sfc -e POSTGRES_DB=sfc -p 5432:5432 postgres:15-alpine${NC}"
    return 1
}

# Check for conflicting PostgreSQL on port 5432
check_postgres_port_conflict() {
    # Check if there's a non-Docker PostgreSQL on port 5432
    local native_pg_pid=$(lsof -ti:5432 2>/dev/null | head -1)
    
    if [ -n "$native_pg_pid" ]; then
        # Check if it's a Docker process
        local process_name=$(ps -p $native_pg_pid -o comm= 2>/dev/null)
        if [[ "$process_name" == "postgres" ]] && ! pgrep -f "docker" | grep -q "$native_pg_pid"; then
            echo -e "${YELLOW}⚠️  Native PostgreSQL is running on port 5432 (PID: $native_pg_pid)${NC}"
            echo -e "${YELLOW}   This may conflict with the Docker PostgreSQL container.${NC}"
            echo -e "${BLUE}   Stopping conflicting PostgreSQL processes on port 5432...${NC}"
            
            # Stop processes on port 5432 (except Docker)
            lsof -ti:5432 | while read pid; do
                local pname=$(ps -p $pid -o comm= 2>/dev/null)
                if [[ "$pname" == "postgres" ]]; then
                    echo -e "${BLUE}   Killing PostgreSQL process $pid...${NC}"
                    kill $pid 2>/dev/null || true
                fi
            done
            
            sleep 2
            
            # Force kill if still running
            if lsof -ti:5432 2>/dev/null | grep -v docker; then
                echo -e "${YELLOW}   Force killing remaining processes...${NC}"
                lsof -ti:5432 | xargs kill -9 2>/dev/null || true
                sleep 1
            fi
        fi
    fi
}

# Check if PostgreSQL container is running
check_postgres_container() {
    # First, handle any port conflicts
    check_postgres_port_conflict
    
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^sfc-db$"; then
        echo -e "${GREEN}PostgreSQL container 'sfc-db' is running${NC}"
        return 0
    else
        echo -e "${YELLOW}PostgreSQL container 'sfc-db' is not running${NC}"
        echo -e "${BLUE}Starting PostgreSQL container...${NC}"
        
        # Remove existing container if exists
        docker rm -f sfc-db 2>/dev/null || true
        
        # Start new container
        docker run -d --name sfc-db \
            -e POSTGRES_USER=sfc \
            -e POSTGRES_PASSWORD=sfc \
            -e POSTGRES_DB=sfc \
            -p 5432:5432 \
            postgres:15-alpine
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}PostgreSQL container started${NC}"
            # Wait extra time for initial database creation
            sleep 5
            return 0
        else
            echo -e "${RED}Failed to start PostgreSQL container${NC}"
            return 1
        fi
    fi
}

# Check and start PostgreSQL BEFORE starting the backend
echo -e "\n${YELLOW}Checking PostgreSQL database...${NC}"
check_postgres_container

# Wait for PostgreSQL to be ready
if ! wait_for_postgres; then
    echo -e "${RED}Cannot proceed without database. Exiting.${NC}"
    exit 1
fi

# Set environment variables for development
export DEBUG=true
export DATABASE_URL="postgresql+asyncpg://sfc:sfc@localhost:5432/sfc"
export SECRET_KEY="${SECRET_KEY:-dev-secret-key-change-in-production}"

# Set PYTHONPATH to include the backend directory for proper module resolution
export PYTHONPATH="$BACKEND_DIR:$PYTHONPATH"

# Run database migrations BEFORE starting the backend
echo -e "\n${YELLOW}Running database migrations...${NC}"
cd "$BACKEND_DIR"
source .venv/bin/activate

if python -m alembic upgrade head; then
    echo -e "${GREEN}Database migrations completed successfully!${NC}"
else
    echo -e "${RED}Migration failed! Check the error above.${NC}"
    echo -e "${YELLOW}Trying to show current migration status...${NC}"
    python -m alembic current || true
fi

# Create default admin user
echo -e "\n${YELLOW}Creating default admin user...${NC}"
if python -m app.cli create-admin admin@sfc.com adminpassword123; then
    echo -e "${GREEN}Admin user ready!${NC}"
else
    echo -e "${YELLOW}Admin user creation skipped (may already exist)${NC}"
fi

# Start Backend
echo -e "\n${PURPLE}Starting Backend Server...${NC}"
cd "$BACKEND_DIR"
source .venv/bin/activate

# Start uvicorn in background
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo -e "${GREEN}Backend started on http://localhost:8000 (PID: $BACKEND_PID)${NC}"

# Wait a moment for backend to start
sleep 2

# Start Frontend
echo -e "\n${PURPLE}Starting Frontend Server...${NC}"
cd "$FRONTEND_DIR"

# Start Next.js dev server in background
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend started on http://localhost:3000 (PID: $FRONTEND_PID)${NC}"

# Print success message
echo -e "\n${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     All services are running!             ║${NC}"
echo -e "${GREEN}╠═══════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Frontend:  http://localhost:3000         ║${NC}"
echo -e "${GREEN}║  Backend:   http://localhost:8000         ║${NC}"
echo -e "${GREEN}║  API Docs:  http://localhost:8000/api/docs║${NC}"
echo -e "${GREEN}╠═══════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  🔐 Admin Credentials:                    ║${NC}"
echo -e "${GREEN}║     Email:    admin@sfc.com               ║${NC}"
echo -e "${GREEN}║     Password: adminpassword123            ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo -e "\n${YELLOW}⚠️  Change the admin password in production!${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}\n"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

