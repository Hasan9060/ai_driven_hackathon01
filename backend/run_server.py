#!/usr/bin/env python3
"""
Unified server runner - starts FastAPI with authentication and user management
"""
import asyncio
import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

# Add src to Python path
current_dir = Path(__file__).parent
src_dir = current_dir / "src"
sys.path.insert(0, str(src_dir))

# Load environment variables
load_dotenv()


async def check_database():
    """Check database connection and create tables if needed"""
    print("🔍 Checking database connection...")

    try:
        # Add src to Python path
        import sys
        from pathlib import Path
        src_dir = Path(__file__).parent / "src"
        sys.path.insert(0, str(src_dir))

        from database import engine, AsyncSessionLocal
        from models import User, Profile

        # Test connection
        async with engine.begin() as conn:
            pass

        print("✅ Database connected")

        # Check if tables exist
        async with AsyncSessionLocal() as session:
            # Check users table
            try:
                await session.execute("SELECT COUNT(*) FROM users")
                print("✅ Users table exists")
            except:
                print("⚠️  Users table not found - it will be created on startup")

            # Check profiles table
            try:
                await session.execute("SELECT COUNT(*) FROM profiles")
                print("✅ Profiles table exists")
            except:
                print("⚠️  Profiles table not found - it will be created on startup")

        return True

    except Exception as e:
        print(f"❌ Database error: {e}")
        print("\n💡 Please check your DATABASE_URL in .env file")
        return False


def check_env_vars():
    """Check required environment variables"""
    print("\n🔧 Checking environment variables...")

    required_vars = {
        "DATABASE_URL": "Neon PostgreSQL connection string",
        "NEON_DATABASE_URL": "Alternative Neon connection string"
    }

    missing = []
    for var, desc in required_vars.items():
        if not os.getenv(var) and not os.getenv(var.lower()):
            missing.append(f"{var} ({desc})")

    if missing:
        print("\n❌ Missing environment variables:")
        for var in missing:
            print(f"  - {var}")

        print("\n💡 Please set these in your .env file:")
        print("   DATABASE_URL=postgresql://user:pass@host/db?sslmode=require")
        return False

    print("✅ All required environment variables set")
    return True


def main():
    """Main function"""
    print("🚀 Starting Humanoid Robotics Lab Server")
    print("=" * 50)

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    logger = logging.getLogger(__name__)

    # Check environment
    if not check_env_vars():
        sys.exit(1)

    # Run database check
    if not asyncio.run(check_database()):
        sys.exit(1)

    # Try to import the new unified app first
    try:
        from app import app
        print("\n✅ Using unified application (app.py)")
        app_name = "app:app"
    except ImportError:
        # Fall back to the original main.py
        try:
            from main import app
            print("\n⚠️  Falling back to original main.py (RAG Chatbot)")
            app_name = "main:app"
        except ImportError:
            print("\n❌ Neither app.py nor main.py found!")
            sys.exit(1)

    print("\n📋 Server Configuration:")
    print(f"  Host: {os.getenv('HOST', '0.0.0.0')}")
    print(f"  Port: {os.getenv('PORT', '8000')}")
    print(f"  Reload: {'Enabled' if os.getenv('DEBUG', 'false').lower() == 'true' else 'Disabled'}")

    print("\n🌐 Available endpoints:")
    print("  - API Documentation: http://localhost:8000/docs")
    print("  - ReDoc: http://localhost:8000/redoc")
    print("  - Health Check: http://localhost:8000/health")
    print("  - Auth Endpoints: http://localhost:8000/auth/*")
    print("  - Profile Endpoints: http://localhost:8000/api/*")

    print("\n👤 Test Credentials:")
    print("  - Email: admin@robotics.com")
    print("  - Password: password")

    print("\n" + "=" * 50)
    print("🎯 Starting server...")

    # Import uvicorn and start the server
    import uvicorn

    # Get configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    debug = os.getenv("DEBUG", "false").lower() == "true"
    workers = 1 if debug else 4

    logger.info(f"Starting server on {host}:{port}")
    logger.info(f"Debug mode: {debug}")
    logger.info(f"Workers: {workers}")

    # Run the server
    uvicorn.run(
        app_name,
        host=host,
        port=port,
        reload=debug,
        log_level="info" if not debug else "debug",
        access_log=True
    )


if __name__ == "__main__":
    main()