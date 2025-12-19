"""
Chat history models
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import Field, validator

from .base import BaseSchema, UUIDMixin, TimestampMixin, MessageType, validate_rating


class ChatHistory(UUIDMixin, TimestampMixin, BaseSchema):
    """Individual chat message in history"""
    session_id: str = Field(..., description="Session identifier")
    message_type: MessageType = Field(..., description="Type of message")
    content: str = Field(..., min_length=1, description="Message content")
    sources_used: Optional[List[Dict[str, Any]]] = Field(None, description="Source citations used")
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="AI confidence")
    response_time_ms: Optional[int] = Field(None, ge=0, description="Response time in ms")
    selected_text_context: Optional[str] = Field(None, description="User-selected text if applicable")
    feedback_rating: Optional[int] = Field(None, ge=1, le=5)
    feedback_comment: Optional[str] = Field(None, max_length=1000)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @validator('feedback_rating')
    def validate_feedback_rating(cls, v):
        return validate_rating(v)


class ConversationSummary(BaseSchema):
    """Summary of a conversation"""
    session_id: str
    start_time: datetime
    end_time: Optional[datetime]
    message_count: int
    topics_discussed: List[str]
    avg_confidence_score: float
    total_response_time_ms: int
    user_satisfaction: Optional[float] = None  # Average of feedback ratings


class MessageSearchResult(BaseSchema):
    """Result of searching messages"""
    message_id: str
    session_id: str
    content_snippet: str
    message_type: MessageType
    timestamp: datetime
    relevance_score: Optional[float] = None


class HistoryAnalytics(BaseSchema):
    """Analytics for chat history"""
    total_messages: int
    questions_asked: int
    answers_provided: int
    avg_response_time_ms: float
    avg_confidence_score: float
    questions_per_day: float
    most_discussed_topics: List[str]
    user_satisfaction_average: Optional[float] = None


class FeedbackAggregation(BaseSchema):
    """Aggregated feedback data"""
    total_feedbacks: int
    average_rating: float
    rating_distribution: Dict[int, int]  # {1: count, 2: count, ...}
    common_themes: List[str]
    satisfaction_trend: List[Dict[str, Any]]


class HistoryExport(BaseSchema):
    """Export format for chat history"""
    export_date: datetime
    date_range_start: datetime
    date_range_end: datetime
    total_sessions: int
    total_messages: int
    messages: List[ChatHistory]
    analytics: HistoryAnalytics
    feedback_summary: Optional[FeedbackAggregation] = None


class MessageMetrics(BaseSchema):
    """Metrics for individual messages"""
    token_count: int
    processing_time_ms: int
    sources_count: int
    selected_text_length: Optional[int] = None
    user_engagement_score: Optional[float] = None