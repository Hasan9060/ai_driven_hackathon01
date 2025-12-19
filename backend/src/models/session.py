"""
Session management models
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from pydantic import Field, validator

from .base import BaseSchema, UUIDMixin, TimestampMixin, validate_session_id


class SessionCreateRequest(BaseSchema):
    """Request model for creating a new session"""
    user_identifier: Optional[str] = Field(None, description="Optional user ID")
    language_preference: str = Field("en", description="Language preference")
    technical_level: Optional[str] = Field(None, description="Technical level")
    privacy_consent: bool = Field(False, description="Privacy consent given")
    session_metadata: dict = Field(default_factory=dict, description="Session metadata")


class UserSession(UUIDMixin, TimestampMixin, BaseSchema):
    """User session model"""
    session_id: str = Field(..., description="Unique session identifier")
    user_identifier: Optional[str] = Field(None, description="Optional user ID")
    language_preference: str = Field("en", description="User's language")
    technical_level_assumed: Optional[str] = Field(None, description="Assumed knowledge level")
    privacy_consent: bool = Field(False, description="Consent for data processing")
    session_metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional session data")
    last_activity: datetime = Field(default_factory=datetime.utcnow, description="Last interaction time")
    message_count: int = Field(0, ge=0, description="Number of messages in session")
    expires_at: Optional[datetime] = Field(None, description="Session expiration time")

    @validator('session_id')
    def validate_session(cls, v):
        return validate_session_id(v)


class SessionStats(BaseSchema):
    """Session statistics"""
    total_sessions: int
    active_sessions: int
    expired_sessions: int
    average_session_length: float  # in minutes
    messages_per_session: float


class SessionSettings(BaseSchema):
    """Configurable session settings"""
    max_session_duration_hours: int = 30  # 30 days
    max_context_messages: int = 5
    auto_cleanup_enabled: bool = True
    privacy_anonymization: bool = False


class PrivacySettings(BaseSchema):
    """Privacy configuration for session data"""
    retention_days: int = 30
    anonymize_ip_addresses: bool = True
    anonymize_user_agents: bool = True
    auto_delete_expired: bool = True


class SessionContext(BaseSchema):
    """Context for session operations"""
    session_id: str
    settings: SessionSettings
    privacy: PrivacySettings
    created_at: datetime


class SessionExport(BaseSchema):
    """Export format for session data"""
    session_id: str
    created_at: datetime
    message_count: int
    last_activity: datetime
    messages: List[Dict[str, Any]]
    metadata: Dict[str, Any]


class SessionSearchFilter(BaseSchema):
    """Filter for searching sessions"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    user_identifier: Optional[str] = None
    has_messages: Optional[bool] = None
    min_message_count: Optional[int] = None
    max_message_count: Optional[int] = None