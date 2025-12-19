"""
Content models for RAG chatbot
"""
from typing import Optional, List
from pydantic import Field
from datetime import datetime

from .base import BaseSchema, UUIDMixin, TimestampMixin, ContentType, TechnicalLevel, RoboticsDomain


class ContentChunk(BaseSchema):
    """Model for content chunk"""
    chunk_id: str = Field(..., description="Unique identifier for the chunk")
    document_id: Optional[str] = Field(None, description="Document identifier")
    url: str = Field(..., description="Source URL")
    title: str = Field(..., description="Content title")
    section_title: str = Field(..., description="Section title")
    section_level: int = Field(..., ge=1, le=6, description="Section heading level")
    content: str = Field(..., min_length=10, description="Chunk content")
    token_count: int = Field(..., ge=1, description="Token count in chunk")
    chapter: Optional[int] = Field(None, ge=1, description="Chapter number")
    content_type: ContentType = Field(ContentType.TEXT, description="Type of content")
    technical_level: Optional[TechnicalLevel] = Field(None, description="Technical difficulty")
    robotics_domain: Optional[RoboticsDomain] = Field(None, description="Robotics domain")
    breadcrumb_path: List[str] = Field(default_factory=list, description="Navigation breadcrumb")
    prerequisites: List[str] = Field(default_factory=list, description="Required knowledge")
    learning_objectives: List[str] = Field(default_factory=list, description="Learning objectives")
    last_updated: Optional[datetime] = Field(None, description="Last update timestamp")


class ContentPayload(BaseSchema):
    """Payload for Qdrant vector storage"""
    url: str
    title: str
    section_title: str
    section_level: int
    content: str
    token_count: int
    chapter: Optional[int]
    content_type: ContentType
    technical_level: Optional[TechnicalLevel]
    robotics_domain: Optional[RoboticsDomain]


class Source(BaseSchema):
    """Source citation for chat responses"""
    chapter: Optional[int] = None
    section: Optional[str] = None
    page: Optional[int] = None
    relevance_score: float = Field(..., ge=0.0, le=1.0, description="Relevance to query")
    snippet: str = Field(..., description="Relevant text snippet")
    url: str = Field(..., description="Source URL")
    selected_text: bool = Field(False, description="Whether this is user-selected text")


class SearchResult(BaseSchema):
    """Result from vector search"""
    id: str
    score: float
    payload: ContentPayload


class IngestedDocument(BaseSchema):
    """Model for ingested document metadata"""
    document_id: str
    url: str
    title: str
    total_chunks: int
    ingested_at: datetime = Field(default_factory=datetime.utcnow)
    last_updated: datetime = Field(default_factory=datetime.utcnow)