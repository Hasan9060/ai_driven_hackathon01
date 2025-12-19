#!/bin/bash
# Deployment script for RAG Chatbot API

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Configuration
ENVIRONMENT=${1:-development}
BACKUP_DIR="/tmp/backups/$(date +%Y%m%d_%H%M%S)"
DOCKER_IMAGE_NAME="rag-chatbot"
DOCKER_TAG=${2:-latest}

log "Starting deployment for environment: $ENVIRONMENT"

# Check prerequisites
command -v docker >/dev/null 2>&1 || error "Docker is not installed"
command -v docker-compose >/dev/null 2>&1 || error "Docker Compose is not installed"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    log "Loading environment variables from .env.$ENVIRONMENT"
    cp ".env.$ENVIRONMENT" .env
else
    warn "No .env.$ENVIRONMENT file found, using .env"
fi

if [ ! -f ".env" ]; then
    error "No .env file found. Please create one from .env.example"
fi

# Health check function
health_check() {
    local url=$1
    local max_attempts=30
    local attempt=1

    log "Performing health check on $url"

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url/health/simple" > /dev/null; then
            log "Health check passed after $attempt attempts"
            return 0
        fi

        log "Health check attempt $attempt/$max_attempts failed"
        sleep 10
        attempt=$((attempt + 1))
    done

    error "Health check failed after $max_attempts attempts"
}

# Pre-deployment checks
log "Running pre-deployment checks"

# Check if required environment variables are set
required_vars=("COHERE_API_KEY" "QDRANT_URL" "DATABASE_URL")
for var in "${required_vars[@]}"; do
    if ! grep -q "^$var=" .env; then
        error "Required environment variable $var is not set"
    fi
done

# Database backup if running in production
if [ "$ENVIRONMENT" = "production" ]; then
    log "Creating database backup"
    # Add your database backup commands here
    # Example: pg_dump $DATABASE_URL > "$BACKUP_DIR/database.sql"
fi

# Build Docker image
log "Building Docker image"
docker build -t "$DOCKER_IMAGE_NAME:$DOCKER_TAG" . || error "Docker build failed"

# Tag with latest if using specific tag
if [ "$DOCKER_TAG" != "latest" ]; then
    docker tag "$DOCKER_IMAGE_NAME:$DOCKER_TAG" "$DOCKER_IMAGE_NAME:latest"
fi

# Stop existing services
log "Stopping existing services"
docker-compose down || true

# Pull latest base images
log "Pulling latest base images"
docker-compose pull || warn "Failed to pull some images, continuing with local images"

# Start services
log "Starting services"
docker-compose up -d || error "Failed to start services"

# Wait for services to be ready
log "Waiting for services to be ready"
sleep 30

# Run database migrations if needed
log "Running database migrations"
# docker-compose exec -T api python -m alembic upgrade head || warn "Migration failed or not needed"

# Health checks
HEALTH_URL="http://localhost:8000"
if [ "$ENVIRONMENT" = "production" ]; then
    HEALTH_URL=${PRODUCTION_URL:-"https://your-domain.com"}
fi

health_check "$HEALTH_URL"

# Post-deployment checks
log "Running post-deployment checks"

# Test chat endpoint
log "Testing chat endpoint"
curl -X POST "$HEALTH_URL/chat" \
    -H "Content-Type: application/json" \
    -d '{"query": "test", "session_id": "00000000-0000-0000-0000-000000000000"}' \
    -f -s > /dev/null || warn "Chat endpoint test failed"

# Clean up old Docker images
log "Cleaning up old Docker images"
docker image prune -f || warn "Failed to prune old images"

log "Deployment completed successfully!"

# Display service status
log "Service status:"
docker-compose ps

log "Deployment information:"
echo "  Environment: $ENVIRONMENT"
echo "  Docker Image: $DOCKER_IMAGE_NAME:$DOCKER_TAG"
echo "  Health URL: $HEALTH_URL"
echo "  Backup Dir: $BACKUP_DIR"

# Next steps
log "Next steps:"
echo "1. Monitor logs: docker-compose logs -f api"
echo "2. Check metrics: $HEALTH_URL/health?include_metrics=true"
echo "3. View API docs: $HEALTH_URL/docs"
echo "4. Run smoke tests: ./scripts/smoke-tests.sh $ENVIRONMENT"