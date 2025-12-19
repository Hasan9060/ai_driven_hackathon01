# RAG Chatbot Backend

FastAPI backend for the Humanoid Robotics Textbook RAG Chatbot.

## Features

- **Contextual Q&A** - Ask questions about the book with accurate source citations
- **Selected Text Analysis** - Highlight specific text for focused analysis
- **Session Persistence** - Maintain conversation history across sessions
- **Privacy-First Design** - Ephemeral processing with 30-day auto-deletion
- **Rate Limiting** - Built-in protection against abuse
- **Comprehensive Monitoring** - Health checks, metrics, and performance tracking
- **Input Sanitization** - Protection against XSS and injection attacks

## Quick Start

### 1. Prerequisites

- Python 3.9+
- Docker & Docker Compose (optional, for deployment)
- PostgreSQL database (Neon recommended)
- Qdrant Cloud account
- Cohere API key

### 2. Setup Environment

```bash
# Clone repository
git clone <repository-url>
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env
# Edit .env with your actual credentials
```

### 3. Environment Variables

Create `.env` with:

```env
# API Keys
COHERE_API_KEY=your_cohere_api_key
QDRANT_API_KEY=your_qdrant_api_key

# URLs
QDRANT_URL=https://your-cluster.qdrant.tech
DATABASE_URL=postgresql://user:pass@host:port/dbname

# Settings
ENVIRONMENT=development
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=INFO
```

### 4. Initialize Database

```bash
# Create database tables
python -m src.db

# Or run the initialization script
python scripts/init_db.py
```

### 5. Ingest Content

```bash
# Ingest the Docusaurus book content
python scripts/ingest.py

# Or specify a custom URL
python scripts/ingest.py --url https://your-book-url.com
```

### 6. Run Server

```bash
# Development server with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production server
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 7. Verify Installation

```bash
# Run health checks
curl http://localhost:8000/health

# Run smoke tests
./scripts/smoke-tests.sh development http://localhost:8000
```

## API Endpoints

### Chat
- `POST /chat` - Ask a question about the book
  - Request: `{"query": "What is robotics?", "session_id": "uuid", "selected_text": "optional"}`
  - Response: Answer with source citations

### Sessions
- `POST /sessions` - Create new session
- `GET /sessions/{id}` - Get session details
- `GET /sessions/{id}/status` - Get session status with message count
- `POST /sessions/{id}/extend` - Extend session (24h default)
- `DELETE /sessions/{id}` - Delete session and data
- `GET /sessions` - List sessions (with filters)
- `GET /sessions/stats` - Get session statistics
- `POST /sessions/cleanup` - Clean up expired sessions
- `GET /sessions/{id}/export` - Export session data

### Health Checks
- `GET /health` - Comprehensive health check with metrics
- `GET /health/simple` - Quick health check for load balancers
- `GET /health/ready` - Readiness probe for Kubernetes
- `GET /health/live` - Liveness probe for Kubernetes

### Documentation
- `GET /docs` - Swagger UI documentation
- `GET /redoc` - ReDoc documentation
- `GET /openapi.json` - OpenAPI specification

## Deployment

### Using Deployment Script

```bash
# Deploy to development
./scripts/deploy.sh development

# Deploy to production with custom tag
./scripts/deploy.sh production v1.2.3
```

### Docker

```bash
# Build image
docker build -t rag-chatbot:latest .

# Run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f api
```

### Environment-Specific Configs

Create `.env.production` for production settings:

```env
ENVIRONMENT=production
LOG_LEVEL=WARNING
CORS_ORIGINS=https://yourdomain.com
RATE_LIMIT_ENABLED=true
```

## Monitoring & Observability

### Health Monitoring

```bash
# Check system health
curl http://localhost:8000/health?include_metrics=true

# Check individual services
curl http://localhost:8000/health/ready
curl http://localhost:8000/health/live
```

### Performance Metrics

The API tracks:
- Request/response times
- Success/error rates
- Rate limiting statistics
- Resource utilization

View metrics at `/health?include_metrics=true`

### Logging

Structured logging with:
- Request IDs for tracing
- Correlated logs across services
- Different levels for development vs production

## Security Features

- **Input Sanitization** - All inputs are sanitized against XSS
- **Rate Limiting** - Configurable limits per endpoint
- **Security Headers** - XSS protection, CSRF protection
- **CORS Configuration** - Proper cross-origin setup
- **Error Handling** - No sensitive data in error responses

## Rate Limits

Default limits (configurable):
- Global: 60 requests/minute, 1000/hour
- Chat: 20 requests/minute, 200/hour
- Sessions: 30 requests/minute, 300/hour

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_chat.py

# Run smoke tests
./scripts/smoke-tests.sh
```

## Architecture

```
backend/
├── src/
│   ├── api/             # API endpoints
│   │   └── endpoints/   # Route handlers
│   ├── services/        # Business logic
│   ├── models/          # Pydantic models
│   ├── utils/           # Utilities
│   ├── middleware/      # Custom middleware
│   └── config.py        # Configuration
├── scripts/             # Utility scripts
├── tests/              # Test suite
├── main.py             # Application entry
├── Dockerfile          # Container definition
├── docker-compose.yml  # Development environment
└── requirements.txt    # Dependencies
```

## Performance Characteristics

- **Target Response Time**: <1.5s for 95% of requests
- **Concurrent Users**: Supports 100+ simultaneous users
- **Vector Search**: Sub-100ms search times with Qdrant
- **Session Storage**: Efficient PostgreSQL with proper indexing
- **Memory Usage**: <512MB for typical workloads

## Privacy & Compliance

- Selected text is processed ephemerally (not stored)
- Session data automatically expires after 30 days
- All data encrypted in transit (TLS 1.3)
- GDPR compliant with data export/deletion APIs
- No tracking cookies or third-party analytics

## Troubleshooting

### Common Issues

1. **"Service Unavailable" on startup**
   - Check environment variables are set
   - Verify database and Qdrant URLs are accessible
   - Check API keys are valid

2. **High latency on chat requests**
   - Check Qdrant cluster performance
   - Verify Cohere API rate limits
   - Monitor system resources

3. **Rate limiting errors**
   - Check rate limit configuration
   - Implement client-side retry with backoff
   - Consider increasing limits for production

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=DEBUG uvicorn main:app --reload
```

### Health Check Details

Detailed health check response:
```json
{
  "status": "healthy",
  "services": {
    "database": {"status": "healthy", "response_time": 0.05},
    "qdrant": {"status": "healthy", "vectors_count": 12345},
    "cohere": {"status": "healthy"},
    "content": {"status": "healthy"}
  },
  "metrics": {
    "uptime_seconds": 3600,
    "total_requests": 1500,
    "success_rate": 99.2
  }
}
```