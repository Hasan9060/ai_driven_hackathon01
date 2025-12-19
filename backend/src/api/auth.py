"""
Authentication API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
import uuid

from database import get_db
from models import User, Profile, AuthEvent
from logger import logger

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()


class AuthEventWebhook(BaseModel):
    """Webhook payload for auth events from Better-Auth"""
    event: str
    userId: str
    email: str
    timestamp: Optional[str] = None
    ipAddress: Optional[str] = None
    userAgent: Optional[str] = None


class ValidateSessionResponse(BaseModel):
    """Response for session validation"""
    valid: bool
    userId: Optional[str] = None
    expiresAt: Optional[str] = None
    email: Optional[str] = None


class PasswordResetRequest(BaseModel):
    """Password reset request"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation"""
    token: str
    password: str


@router.post("/webhook")
async def auth_webhook(
    payload: AuthEventWebhook,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Receive webhook events from Better-Auth"""
    try:
        # Log the webhook event
        await log_auth_event(
            event_type=f"webhook.{payload.event}",
            user_id=payload.userId,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent"),
            extra={"webhook_payload": payload.dict()}
        )

        # Handle different event types
        if payload.event == "user.created":
            # Create empty profile for new user
            profile = Profile(user_id=uuid.UUID(payload.userId))
            db.add(profile)
            await db.commit()

            logger.info("Created profile for new user", user_id=payload.userId)

        elif payload.event == "user.verified":
            # Update user verification status
            user = await db.get(User, uuid.UUID(payload.userId))
            if user:
                user.email_verified = True
                await db.commit()

                logger.info("User email verified", user_id=payload.userId)

        # Add more event handlers as needed
        # e.g., password.reset.requested, auth.login, auth.logout

        return {"status": "success"}

    except Exception as e:
        logger.error("Webhook processing failed", error=str(e), event=payload.event)
        raise HTTPException(status_code=500, detail="Webhook processing failed")


@router.get("/validate", response_model=ValidateSessionResponse)
async def validate_session(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """Validate session token"""
    try:
        # Extract token from Bearer token
        token = credentials.credentials

        # For now, we'll validate using Better-Auth's session table
        # In a real implementation, you might need to call Better-Auth's validation endpoint
        # or validate the JWT token directly

        # TODO: Implement actual session validation with Better-Auth
        # This is a placeholder implementation

        # Return valid response for demo
        return ValidateSessionResponse(
            valid=True,
            userId="placeholder-user-id",
            expiresAt="2024-12-31T23:59:59Z",
            email="user@example.com"
        )

    except Exception as e:
        logger.error("Session validation failed", error=str(e))
        return ValidateSessionResponse(valid=False)


@router.post("/password-reset")
async def request_password_reset(
    request_data: PasswordResetRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Request password reset"""
    try:
        # Find user by email
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.email == request_data.email))
        user = result.scalar_one_or_none()

        if not user:
            # Don't reveal if email exists
            return {"message": "If the email exists, a reset link has been sent"}

        # Send reset email
        success = await email_service.send_password_reset_email(
            request_data.email,
            str(user.id)
        )

        if success:
            # Log the event
            await log_auth_event(
                event_type="password.reset.requested",
                user_id=str(user.id),
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent")
            )

            return {"message": "Password reset email sent"}
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to send password reset email"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Password reset request failed", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/password-reset")
async def reset_password(
    request_data: PasswordResetConfirm,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Reset password with token"""
    try:
        # Verify the token
        payload = email_service.verify_token(request_data.token)

        if not payload:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired reset token"
            )

        if payload.get("type") != "password_reset":
            raise HTTPException(
                status_code=400,
                detail="Invalid token type"
            )

        # Find user
        user_id = uuid.UUID(payload["user_id"])
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        # TODO: Update user password
        # This would need to be done through Better-Auth's API
        # or by directly updating the users table

        # Log the event
        await log_auth_event(
            event_type="password.reset.completed",
            user_id=str(user.id),
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )

        return {"message": "Password reset successful"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Password reset failed", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")