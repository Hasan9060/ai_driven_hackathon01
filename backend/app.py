"""
Unified FastAPI Application with Authentication and Database
"""
from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import os
from typing import Optional, List, Dict, Any

# Add src to path
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / "src"))

# Database imports
from database import engine, AsyncSessionLocal, init_db
from models import User, Profile, AuthEvent

# API imports
from api.auth import router as auth_router
from api.profile import router as profile_router

# Middleware imports
from middleware.auth import AuthMiddleware, get_current_user_id

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup
    logger.info("🚀 Starting application...")

    # Initialize database
    try:
        await init_db()
        logger.info("✅ Database initialized successfully")

        # Create default user if none exists
        async with AsyncSessionLocal() as session:
            user_count = await session.execute("SELECT COUNT(*) FROM users")
            count = user_count.scalar()

            if count == 0:
                from services.auth import AuthService
                auth_service = AuthService(session)

                # Create test user
                test_user = User(
                    email="admin@robotics.com",
                    password_hash="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewBCmKnhX6GSrsyG", # "password"
                    email_verified=True,
                    name="Admin User"
                )
                session.add(test_user)
                await session.flush()

                # Create admin profile
                admin_profile = Profile(
                    user_id=test_user.id,
                    software_years=10,
                    software_languages=["Python", "JavaScript", "C++", "TypeScript"],
                    software_frameworks=["FastAPI", "React", "ROS", "TensorFlow"],
                    hardware_robotics=True,
                    hardware_embedded=True,
                    hardware_iot=True,
                    experience_level="expert",
                    interests=["Robotics", "AI/ML", "IoT", "Computer Vision"]
                )
                session.add(admin_profile)

                await session.commit()
                logger.info("✅ Created default admin user: admin@robotics.com / password")

    except Exception as e:
        logger.error(f"❌ Failed to initialize database: {e}")
        raise

    yield

    # Shutdown
    logger.info("🛑 Shutting down application...")


# Create FastAPI app
app = FastAPI(
    title="Humanoid Robotics Lab API",
    description="Complete authentication and user management system",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Authentication middleware
app.middleware("http")(AuthMiddleware(app))


# Dependency to get database session
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# Health check endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Humanoid Robotics Lab API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "status": "Running"
    }


@app.get("/health")
async def health_check(db: AsyncSessionLocal = Depends(get_db)):
    """Detailed health check"""
    try:
        # Check database
        user_count = await db.execute("SELECT COUNT(*) FROM users")
        profile_count = await db.execute("SELECT COUNT(*) FROM profiles")

        return {
            "status": "healthy",
            "database": "connected",
            "statistics": {
                "users": user_count.scalar(),
                "profiles": profile_count.scalar()
            },
            "services": {
                "authentication": "running",
                "user_profiles": "running"
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Health check failed: {str(e)}"
        )


# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(profile_router, prefix="/api", tags=["Profiles"])


# Additional endpoints for completeness
@app.get("/auth/me", tags=["Authentication"])
async def get_current_user_info(db: AsyncSessionLocal = Depends(get_db)):
    """Get current user info (placeholder - would use auth token in real app)"""
    # This is a placeholder - in real implementation, get user from auth token
    return {
        "message": "This endpoint requires authentication",
        "note": "Implement JWT/Session token validation here"
    }


@app.get("/users", response_model=List[Dict[str, Any]], tags=["Users"])
async def list_users(
    limit: int = 10,
    offset: int = 0,
    db: AsyncSessionLocal = Depends(get_db)
):
    """List all users with their profiles"""
    try:
        result = await db.execute("""
            SELECT
                u.id,
                u.email,
                u.email_verified,
                u.name,
                u.created_at,
                p.experience_level,
                p.software_years,
                array_length(p.software_languages, 1) as language_count,
                p.hardware_robotics,
                p.hardware_embedded,
                p.hardware_iot
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE u.deleted_at IS NULL
            ORDER BY u.created_at DESC
            LIMIT $1 OFFSET $2
        """, (limit, offset))

        users = [dict(row) for row in result.fetchall()]
        return users

    except Exception as e:
        logger.error(f"Error listing users: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch users"
        )


@app.get("/stats", tags=["Statistics"])
async def get_statistics(db: AsyncSessionLocal = Depends(get_db)):
    """Get application statistics"""
    try:
        # Get various statistics
        stats = {}

        # User statistics
        user_stats = await db.execute("""
            SELECT
                COUNT(*) as total_users,
                COUNT(*) FILTER (WHERE email_verified = true) as verified_users,
                COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as recent_users
            FROM users
            WHERE deleted_at IS NULL
        """)
        user_result = user_stats.fetchone()
        stats.update(user_result._asdict())

        # Profile statistics
        profile_stats = await db.execute("""
            SELECT
                COUNT(*) as total_profiles,
                COUNT(*) FILTER (WHERE hardware_robotics = true) as robotics_users,
                COUNT(*) FILTER (WHERE hardware_embedded = true) as embedded_users,
                COUNT(*) FILTER (WHERE hardware_iot = true) as iot_users,
                AVG(experience_level::text::integer) as avg_experience_level
            FROM profiles
        """)
        profile_result = profile_stats.fetchone()
        stats.update(profile_result._asdict())

        # Experience level distribution
        exp_distribution = await db.execute("""
            SELECT experience_level, COUNT(*) as count
            FROM profiles
            GROUP BY experience_level
            ORDER BY experience_level
        """)
        stats["experience_distribution"] = [dict(row) for row in exp_distribution.fetchall()]

        return stats

    except Exception as e:
        logger.error(f"Error fetching statistics: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch statistics"
        )


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if os.getenv("DEBUG") else "Something went wrong"
        }
    )


if __name__ == "__main__":
    import uvicorn

    # Get port from environment or use default
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")

    print(f"🚀 Starting server at http://{host}:{port}")
    print(f"📚 API Documentation: http://{host}:{port}/docs")

    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )