"""
AuthEvent model for audit trail
"""
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, INET
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import json

from database import Base


class AuthEvent(Base):
    """
    Authentication event for audit trail

    Tracks all authentication-related events for security
    and compliance purposes.
    """
    __tablename__ = "auth_events"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign key to user (nullable for some events like signup attempts)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    # Event details
    event_type = Column(
        String(50),
        nullable=False,
        index=True,
        comment="Type of authentication event"
    )
    event_data = Column(
        Text,
        nullable=True,
        comment="Additional event data stored as JSON"
    )

    # Request metadata
    ip_address = Column(
        INET,
        nullable=True,
        comment="Client IP address"
    )
    user_agent = Column(
        Text,
        nullable=True,
        comment="Client user agent string"
    )

    # Timestamp
    timestamp = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True
    )

    # Relationship to User
    user = relationship("User")

    def __repr__(self):
        return f"<AuthEvent(id={self.id}, type={self.event_type}, user_id={self.user_id})>"

    def to_dict(self):
        """Convert auth event to dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id) if self.user_id else None,
            "event_type": self.event_type,
            "event_data": json.loads(self.event_data) if self.event_data else None,
            "ip_address": str(self.ip_address) if self.ip_address else None,
            "user_agent": self.user_agent,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }

    @property
    def event_data_dict(self):
        """Get event_data as dictionary"""
        if self.event_data:
            try:
                return json.loads(self.event_data)
            except json.JSONDecodeError:
                return {}
        return {}

    @event_data_dict.setter
    def event_data_dict(self, value):
        """Set event_data from dictionary"""
        if value is not None:
            self.event_data = json.dumps(value)
        else:
            self.event_data = None