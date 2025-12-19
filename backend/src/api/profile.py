"""
Profile API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User
from models import Profile
from logger import logger

router = APIRouter(prefix="/profiles", tags=["Profiles"])


class ProfileResponse(BaseModel):
    user_id: str
    software_years: int
    software_languages: List[str]
    software_frameworks: List[str]
    hardware_robotics: bool
    hardware_embedded: bool
    hardware_iot: bool
    experience_level: str
    interests: List[str]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    software_years: Optional[int] = None
    software_languages: Optional[List[str]] = None
    software_frameworks: Optional[List[str]] = None
    hardware_robotics: Optional[bool] = None
    hardware_embedded: Optional[bool] = None
    hardware_iot: Optional[bool] = None
    interests: Optional[List[str]] = None


class ProfileQuestionnaire(BaseModel):
    """Profile data from questionnaire"""
    software_experience: dict
    hardware_experience: dict
    interests: List[str]

    class Config:
        schema_extra = {
            "example": {
                "software_experience": {
                    "years": 5,
                    "languages": ["Python", "JavaScript", "TypeScript"],
                    "frameworks": ["React", "Node.js", "FastAPI"]
                },
                "hardware_experience": {
                    "robotics": True,
                    "embedded": False,
                    "iot": True
                },
                "interests": ["Robotics", "AI/ML", "IoT"]
            }
        }


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get current user's profile"""
    # This would normally get user_id from auth token
    # For now, using a placeholder
    if user_id == "placeholder":
        user_id = "admin@robotics.com"

    # Find user by email (temporary solution)
    result = await db.execute(
        select(User).where(User.email == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get profile
    profile = await db.get(Profile, user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile


@router.post("/me/questionnaire")
async def save_questionnaire(
    questionnaire: ProfileQuestionnaire,
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Save questionnaire data to profile"""
    # This would normally get user_id from auth token
    # For now, using a placeholder
    if user_id == "placeholder":
        user_id = "admin@robotics.com"

    # Find user by email (temporary solution)
    result = await db.execute(
        select(User).where(User.email == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get or create profile
    profile = await db.get(Profile, user.id)
    if not profile:
        profile = Profile(user_id=user.id)
        db.add(profile)

    # Update profile with questionnaire data
    sw_exp = questionnaire.software_experience
    hw_exp = questionnaire.hardware_experience

    profile.software_years = sw_exp.get("years", 0)
    profile.software_languages = sw_exp.get("languages", [])
    profile.software_frameworks = sw_exp.get("frameworks", [])
    profile.hardware_robotics = hw_exp.get("robotics", False)
    profile.hardware_embedded = hw_exp.get("embedded", False)
    profile.hardware_iot = hw_exp.get("iot", False)
    profile.interests = questionnaire.interests

    # Calculate experience level
    profile.experience_level = Profile.calculate_experience_level(
        profile.software_years,
        profile.hardware_robotics,
        profile.hardware_embedded,
        profile.hardware_iot
    )

    await db.commit()
    logger.info(f"Saved questionnaire for user {user.id}")

    return {"message": "Profile saved successfully"}


@router.put("/me", response_model=ProfileResponse)
async def update_my_profile(
    profile_update: ProfileUpdate,
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Update current user's profile"""
    # This would normally get user_id from auth token
    # For now, using a placeholder
    if user_id == "placeholder":
        user_id = "admin@robotics.com"

    # Find user by email (temporary solution)
    result = await db.execute(
        select(User).where(User.email == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get profile
    profile = await db.get(Profile, user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Update only provided fields
    if profile_update.software_years is not None:
        profile.software_years = profile_update.software_years
    if profile_update.software_languages is not None:
        profile.software_languages = profile_update.software_languages
    if profile_update.software_frameworks is not None:
        profile.software_frameworks = profile_update.software_frameworks
    if profile_update.hardware_robotics is not None:
        profile.hardware_robotics = profile_update.hardware_robotics
    if profile_update.hardware_embedded is not None:
        profile.hardware_embedded = profile_update.hardware_embedded
    if profile_update.hardware_iot is not None:
        profile.hardware_iot = profile_update.hardware_iot
    if profile_update.interests is not None:
        profile.interests = profile_update.interests

    # Recalculate experience level
    profile.experience_level = Profile.calculate_experience_level(
        profile.software_years,
        profile.hardware_robotics,
        profile.hardware_embedded,
        profile.hardware_iot
    )

    await db.commit()
    logger.info(f"Updated profile for user {user.id}")

    return profile


@router.get("/{user_id}", response_model=ProfileResponse)
async def get_user_profile(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get profile by user ID (admin only)"""
    # Find user
    try:
        # Try to parse as UUID first
        from uuid import UUID
        user_uuid = UUID(user_id)
        user = await db.get(User, user_uuid)
    except ValueError:
        # If not UUID, try email lookup
        result = await db.execute(
            select(User).where(User.email == user_id)
        )
        user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get profile
    profile = await db.get(Profile, user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile


@router.get("/", response_model=List[ProfileResponse])
async def list_profiles(
    limit: int = 20,
    offset: int = 0,
    experience_level: Optional[str] = None,
    has_robotics: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    """List profiles with optional filters"""
    query = select(Profile, User).join(User, Profile.user_id == User.id)

    # Add filters
    filters = []
    if experience_level:
        filters.append(Profile.experience_level == experience_level)
    if has_robotics is not None:
        filters.append(Profile.hardware_robotics == has_robotics)

    if filters:
        query = query.where(*filters)

    # Add pagination
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    profiles = []
    for profile, user in result.fetchall():
        profile_dict = profile.to_dict()
        profile_dict['email'] = user.email
        profile_dict['name'] = user.name
        profiles.append(ProfileResponse(**profile_dict))

    return profiles


@router.get("/stats/summary")
async def get_profile_stats(db: AsyncSession = Depends(get_db)):
    """Get profile statistics"""
    # Total profiles
    total = await db.execute(select(Profile).count())
    total_profiles = total.scalar()

    # By experience level
    exp_levels = await db.execute(
        select(Profile.experience_level, Profile.experience_level.count())
        .group_by(Profile.experience_level)
    )
    experience_distribution = dict(exp_levels.fetchall())

    # Hardware experience stats
    robotics = await db.execute(
        select(Profile.hardware_robotics.count()).where(Profile.hardware_robotics == True)
    )
    embedded = await db.execute(
        select(Profile.hardware_embedded.count()).where(Profile.hardware_embedded == True)
    )
    iot = await db.execute(
        select(Profile.hardware_iot.count()).where(Profile.hardware_iot == True)
    )

    # Average experience
    avg_years = await db.execute(
        select(Profile.software_years).select(Profile.software_years.avg())
    )
    avg_experience_years = avg_years.scalar() or 0

    return {
        "total_profiles": total_profiles,
        "experience_distribution": experience_distribution,
        "hardware_experience": {
            "robotics": robotics.scalar(),
            "embedded": embedded.scalar(),
            "iot": iot.scalar()
        },
        "average_software_years": round(avg_experience_years, 2)
    }