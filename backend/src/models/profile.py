"""
Profile model for user technical background information
"""
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from database import Base


class Profile(Base):
    """
    User technical profile for personalization

    This stores the user's software and hardware experience
    collected during the onboarding questionnaire.
    """
    __tablename__ = "profiles"

    # Primary key - links to Better-Auth users table
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
        default=uuid.uuid4
    )

    # Software experience
    software_years = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Years of software development experience"
    )
    software_languages = Column(
        ARRAY(String),
        nullable=False,
        default=[],
        comment="Programming languages user knows"
    )
    software_frameworks = Column(
        ARRAY(String),
        nullable=False,
        default=[],
        comment="Software frameworks user has experience with"
    )

    # Hardware experience
    hardware_robotics = Column(
        Boolean,
        nullable=False,
        default=False,
        comment="Has robotics experience"
    )
    hardware_embedded = Column(
        Boolean,
        nullable=False,
        default=False,
        comment="Has embedded systems experience"
    )
    hardware_iot = Column(
        Boolean,
        nullable=False,
        default=False,
        comment="Has IoT experience"
    )

    # Overall experience level (calculated from responses)
    experience_level = Column(
        String(20),
        nullable=False,
        default="beginner",
        comment="Overall experience level: beginner, intermediate, advanced, expert"
    )

    # Technical interests
    interests = Column(
        ARRAY(String),
        nullable=False,
        default=[],
        comment="Areas of technical interest"
    )

    # Timestamps
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationship to User
    user = relationship("User", back_populates="profile")

    def __repr__(self):
        return f"<Profile(user_id={self.user_id}, level={self.experience_level})>"

    def to_dict(self):
        """Convert profile to dictionary"""
        return {
            "user_id": str(self.user_id),
            "software_years": self.software_years,
            "software_languages": self.software_languages or [],
            "software_frameworks": self.software_frameworks or [],
            "hardware_robotics": self.hardware_robotics,
            "hardware_embedded": self.hardware_embedded,
            "hardware_iot": self.hardware_iot,
            "experience_level": self.experience_level,
            "interests": self.interests or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @classmethod
    def calculate_experience_level(cls, software_years, has_robotics, has_embedded, has_iot):
        """Calculate overall experience level based on responses"""
        score = 0

        # Software experience scoring
        if software_years >= 10:
            score += 3
        elif software_years >= 5:
            score += 2
        elif software_years >= 2:
            score += 1

        # Hardware experience scoring
        if has_robotics:
            score += 2
        if has_embedded:
            score += 2
        if has_iot:
            score += 1

        # Map score to level
        if score >= 7:
            return "expert"
        elif score >= 5:
            return "advanced"
        elif score >= 3:
            return "intermediate"
        else:
            return "beginner"