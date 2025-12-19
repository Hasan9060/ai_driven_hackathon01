"""
User model for Better-Auth integration
This model represents the base user table that Better-Auth will manage
"""
from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from database import Base


class User(Base):
    """
    User model managed by Better-Auth

    This table follows Better-Auth's standard schema.
    Better-Auth will handle all CRUD operations on this table.
    """
    __tablename__ = "users"

    # Primary key - Better-Auth uses UUID
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Authentication fields
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    email_verified = Column(Boolean, nullable=False, default=False)

    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Soft delete support
    deleted_at = Column(DateTime, nullable=True)

    # Additional fields that Better-Auth might use
    name = Column(String(255), nullable=True)
    image = Column(String(255), nullable=True)
    email_verification_token = Column(String(255), nullable=True)
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expires = Column(DateTime, nullable=True)

    # JSON fields for Better-Auth metadata
    auth_metadata = Column(Text, nullable=True)  # Stored as JSON string

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False)

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, verified={self.email_verified})>"

    def to_dict(self):
        """Convert user to dictionary"""
        return {
            "id": str(self.id),
            "email": self.email,
            "email_verified": self.email_verified,
            "name": self.name,
            "image": self.image,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }