"""
Authentication middleware for FastAPI
"""
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import logging
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))
from logger import logger

# HTTP Bearer token scheme
security = HTTPBearer(auto_error=False)


async def get_current_user_id(request: Request) -> Optional[str]:
    """
    Get current user ID from request headers or session.

    For now, this is a placeholder that returns a test user.
    In production, this would validate JWT tokens or session cookies.
    """
    # Try to get from Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        # In production, validate JWT token here
        # For now, return placeholder
        logger.info("Found Authorization header (placeholder implementation)")
        return "admin@robotics.com"

    # Try to get from session cookie
    session_token = request.cookies.get("session_token")
    if session_token:
        # In production, validate session token
        logger.info("Found session token (placeholder implementation)")
        return "admin@robotics.com"

    # Check for special debug header
    debug_user = request.headers.get("X-Debug-User")
    if debug_user:
        logger.warning(f"Using debug user header: {debug_user}")
        return debug_user

    # No auth found
    return None


async def require_auth(request: Request) -> str:
    """
    Require authentication and return user ID.
    Raises HTTPException if not authenticated.
    """
    user_id = await get_current_user_id(request)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id


def AuthMiddleware(app):
    """
    Authentication middleware for FastAPI
    """
    async def middleware(request: Request, call_next):
        # Add user info to request state if authenticated
        user_id = await get_current_user_id(request)
        if user_id:
            request.state.user_id = user_id
            logger.debug(f"Authenticated request for user: {user_id}")

        # Continue with the request
        response = await call_next(request)
        return response

    return middleware