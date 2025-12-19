"""
Selected text models
"""
from typing import Optional
from datetime import datetime
from pydantic import Field

from .base import BaseSchema, UUIDMixin, TimestampMixin


class SelectedTextQuery(UUIDMixin, TimestampMixin, BaseSchema):
    """Model for user-selected text queries"""
    session_id: str = Field(..., description="Session context")
    selected_text: str = Field(..., max_length=2000, description="User's selected content")
    source_url: Optional[str] = Field(None, description="Where text was selected")
    selection_context: Optional[dict] = Field(None, description="Surrounding context")
    processing_result: Optional[dict] = Field(None, description="Analysis results")
    is_ephemeral: bool = Field(True, description="Mark for deletion after session")
    expires_at: Optional[datetime] = Field(None, description="Auto-deletion time")


class TextSelection(BaseSchema):
    """Model for text selection data"""
    text: str = Field(..., description="The selected text")
    source_url: str = Field(..., description="Source URL")
    chapter: Optional[int] = Field(None, description="Chapter number")
    section: Optional[str] = Field(None, description="Section title")
    position: Optional['TextPosition'] = Field(None, description="Text position")
    context_before: Optional[str] = Field(None, description="Text before selection")
    context_after: Optional[str] = Field(None, description="Text after selection")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class TextPosition(BaseSchema):
    """Position information for selected text"""
    start_char: int = Field(..., ge=0, description="Start character index")
    end_char: int = Field(..., ge=0, description="End character index")
    start_line: Optional[int] = Field(None, ge=0, description="Start line number")
    end_line: Optional[int] = Field(None, ge=0, description="End line number")
    xpath: Optional[str] = Field(None, description="XPath location")


class SelectedTextAnalysis(BaseSchema):
    """Analysis result for selected text"""
    query_id: str = Field(..., description="Query identifier")
    selected_text: str = Field(..., description="Original selected text")
    analysis: str = Field(..., description="AI analysis of the text")
    related_concepts: list[str] = Field(default_factory=list, description="Related concepts identified")
    suggested_questions: list[str] = Field(default_factory=list, description="Suggested follow-up questions")
    difficulty_level: Optional[str] = Field(None, description="Assumed difficulty level")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Analysis confidence")
    processing_time_ms: int = Field(..., ge=0, description="Time to process")
    created_at: datetime = Field(default_factory=datetime.utcnow)