# FastAPI Chat Endpoints with RAG Capabilities: Best Practices Guide 2025

This guide provides comprehensive best practices for implementing production-ready FastAPI chat endpoints with RAG (Retrieval Augmented Generation) capabilities, focusing on Cohere Command R+, Qdrant vector search, and Neon Postgres integration.

## Table of Contents
1. [FastAPI Endpoint Design for Chat APIs](#1-fastapi-endpoint-design-for-chat-apis)
2. [Cohere Command R+ Integration](#2-cohere-command-r-integration)
3. [Qdrant Vector Search Integration](#3-qdrant-vector-search-integration)
4. [Session Management with SQLAlchemy and Neon Postgres](#4-session-management-with-sqlalchemy-and-neon-postgres)
5. [CORS Configuration](#5-cors-configuration)
6. [Error Handling Patterns](#6-error-handling-patterns)
7. [Rate Limiting and Security](#7-rate-limiting-and-security)
8. [Pydantic Model Design](#8-pydantic-model-design)
9. [Complete Implementation Example](#9-complete-implementation-example)

---

## 1. FastAPI Endpoint Design for Chat APIs

### Core Principles
- **Async-first design**: Use `async def` for all endpoints to handle concurrent requests
- **Streaming support**: Implement both REST and WebSocket endpoints for real-time chat
- **Optional context parameters**: Support flexible RAG context injection
- **Proper dependency injection**: Leverage FastAPI's DI for database connections and services

### Basic Chat Endpoint Structure
```python
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer
from typing import Optional, List
import asyncio

app = FastAPI(title="RAG Chat API", version="1.0.0")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@app.post("/api/v1/chat")
async def chat_completion(
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_async_session),
    qdrant_client: AsyncQdrantClient = Depends(get_qdrant_client)
) -> ChatResponse:
    """
    Main chat endpoint with RAG capabilities
    """
    # 1. Authenticate user
    user = await authenticate_user(token, db)

    # 2. Retrieve conversation context
    conversation = await get_conversation(request.conversation_id, user.id, db)

    # 3. RAG retrieval (if context is provided)
    context_docs = []
    if request.use_rag and request.message:
        context_docs = await retrieve_relevant_documents(
            query=request.message,
            collection_name=request.collection or "default",
            limit=request.context_limit,
            client=qdrant_client
        )

    # 4. Generate response with Cohere
    response = await generate_cohere_response(
        message=request.message,
        context=context_docs,
        conversation_history=conversation.messages,
        model=request.model
    )

    # 5. Save conversation turn
    background_tasks.add_task(
        save_conversation_turn,
        conversation_id=conversation.id,
        user_message=request.message,
        assistant_response=response.text,
        sources=response.sources
    )

    return ChatResponse(
        message=response.text,
        sources=response.sources,
        conversation_id=conversation.id,
        usage=response.usage
    )
```

### WebSocket Streaming Endpoint
```python
from fastapi import WebSocket, WebSocketDisconnect
import json

@app.websocket("/ws/chat/{conversation_id}")
async def websocket_chat(
    websocket: WebSocket,
    conversation_id: str,
    token: Optional[str] = None
):
    """
    WebSocket endpoint for streaming chat responses
    """
    await websocket.accept()

    try:
        # Authenticate WebSocket connection
        user = await websocket_authenticate(token)
        conversation = await get_conversation(conversation_id, user.id, db)

        while True:
            # Receive message
            data = await websocket.receive_json()
            request = ChatWebSocketRequest.parse_obj(data)

            # Send acknowledgment
            await websocket.send_json({
                "type": "ack",
                "message_id": request.message_id
            })

            # Stream response
            async for chunk in generate_streaming_response(
                message=request.message,
                conversation=conversation
            ):
                await websocket.send_json({
                    "type": "chunk",
                    "content": chunk.content,
                    "is_complete": chunk.is_complete
                })

                if chunk.is_complete:
                    await websocket.send_json({
                        "type": "complete",
                        "sources": chunk.sources,
                        "usage": chunk.usage
                    })

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {conversation_id}")
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })
```

---

## 2. Cohere Command R+ Integration

### Installation and Setup
```python
# requirements.txt
cohere>=5.0.0
pydantic>=2.0.0
httpx>=0.25.0
tenacity>=8.2.0
```

### Cohere Service Implementation
```python
import cohere
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential
from typing import List, Dict, Optional

class CohereService:
    def __init__(self, api_key: str):
        self.client = cohere.AsyncClient(api_key)
        self.model = "command-r-plus"

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def generate_response(
        self,
        message: str,
        context_docs: Optional[List[Dict]] = None,
        conversation_history: Optional[List[Dict]] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> CohereResponse:
        """
        Generate response using Cohere Command R+ with RAG context
        """
        # Build chat history
        chat_history = []
        if conversation_history:
            for msg in conversation_history[-10:]:  # Last 10 messages
                chat_history.append({
                    "role": msg["role"],
                    "message": msg["content"]
                })

        # Prepare context documents
        documents = []
        if context_docs:
            for doc in context_docs[:5]:  # Top 5 documents
                documents.append({
                    "text": doc["content"],
                    "title": doc.get("title", ""),
                    "source": doc.get("source", "")
                })

        # Generate response with connectors for RAG
        response = await self.client.chat(
            message=message,
            model=self.model,
            chat_history=chat_history,
            documents=documents,
            temperature=temperature,
            max_tokens=max_tokens,
            connectors=[{"id": "web-search"}] if self.enable_search else None
        )

        return CohereResponse(
            text=response.text,
            sources=[
                {
                    "id": doc["id"],
                    "title": doc.get("title"),
                    "url": doc.get("url"),
                    "snippet": doc.get("text", "")[:200]
                }
                for doc in response.documents or []
            ],
            citations=response.citations or [],
            usage={
                "input_tokens": response.token_count["prompt_tokens"],
                "output_tokens": response.token_count["response_tokens"],
                "total_tokens": response.token_count["total_tokens"]
            },
            search_results=response.search_results or [],
            search_queries=response.search_queries or []
        )

    async def generate_streaming_response(
        self,
        message: str,
        context_docs: Optional[List[Dict]] = None,
        conversation_history: Optional[List[Dict]] = None
    ):
        """
        Generate streaming response for real-time chat
        """
        async for event in self.client.chat_stream(
            message=message,
            model=self.model,
            documents=context_docs or [],
            chat_history=conversation_history or []
        ):
            if event.event_type == "text-generation":
                yield StreamingChunk(
                    content=event.text,
                    is_complete=False
                )
            elif event.event_type == "stream-end":
                yield StreamingChunk(
                    content="",
                    is_complete=True,
                    sources=event.response.documents or [],
                    usage=event.response.token_count
                )

# Initialize service
cohere_service = CohereService(api_key=settings.COHERE_API_KEY)
```

### Response Models
```python
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class Citation(BaseModel):
    start: int
    end: int
    text: str
    document_ids: List[str]

class DocumentReference(BaseModel):
    id: str
    title: Optional[str] = None
    url: Optional[str] = None
    snippet: Optional[str] = None

class Usage(BaseModel):
    input_tokens: int
    output_tokens: int
    total_tokens: int

class CohereResponse(BaseModel):
    text: str
    sources: List[DocumentReference]
    citations: List[Citation]
    usage: Usage
    search_results: Optional[List[Dict]] = None
    search_queries: Optional[List[Dict]] = None
    finish_reason: Optional[str] = None
    response_time: Optional[float] = None

class StreamingChunk(BaseModel):
    content: str
    is_complete: bool = False
    sources: Optional[List[DocumentReference]] = None
    usage: Optional[Usage] = None
```

---

## 3. Qdrant Vector Search Integration

### Async Qdrant Client Setup
```python
from qdrant_client import QdrantClient
from qdrant_client.async_client import AsyncQdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
import numpy as np
from typing import List, Dict, Optional

class AsyncQdrantService:
    def __init__(self, url: str, api_key: Optional[str] = None):
        self.client = AsyncQdrantClient(url=url, api_key=api_key)
        self.embedding_size = 1024  # Cohere embeddings size

    async def ensure_collection(self, collection_name: str):
        """
        Ensure collection exists with proper configuration
        """
        try:
            await self.client.get_collection(collection_name)
        except Exception:
            await self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=self.embedding_size,
                    distance=Distance.COSINE
                ),
                optimizers_config={
                    "default_segment_number": 2,
                    "max_segment_size": 20000,
                    "memmap_threshold": 20000
                }
            )

    async def search_similar(
        self,
        query_embedding: List[float],
        collection_name: str,
        limit: int = 5,
        score_threshold: float = 0.7,
        filter_condition: Optional[Filter] = None
    ) -> List[Dict]:
        """
        Search for similar documents with optional filtering
        """
        search_result = await self.client.search(
            collection_name=collection_name,
            query_vector=query_embedding,
            query_filter=filter_condition,
            limit=limit,
            score_threshold=score_threshold,
            with_payload=True,
            with_vectors=False
        )

        return [
            {
                "id": str(point.id),
                "score": point.score,
                "content": point.payload.get("content", ""),
                "title": point.payload.get("title", ""),
                "source": point.payload.get("source", ""),
                "metadata": point.payload.get("metadata", {})
            }
            for point in search_result
        ]

    async def upsert_documents(
        self,
        documents: List[Dict],
        collection_name: str,
        batch_size: int = 100
    ):
        """
        Batch upsert documents with embeddings
        """
        await self.ensure_collection(collection_name)

        for i in range(0, len(documents), batch_size):
            batch = documents[i:i + batch_size]

            # Get embeddings for batch
            embeddings = await self._get_embeddings([doc["content"] for doc in batch])

            # Prepare points
            points = [
                PointStruct(
                    id=doc.get("id", f"doc_{i}"),
                    vector=embedding,
                    payload={
                        "content": doc["content"],
                        "title": doc.get("title", ""),
                        "source": doc.get("source", ""),
                        "metadata": doc.get("metadata", {}),
                        "created_at": datetime.utcnow().isoformat()
                    }
                )
                for doc, embedding in zip(batch, embeddings)
            ]

            # Upsert batch
            await self.client.upsert(
                collection_name=collection_name,
                points=points
            )

    async def _get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Get embeddings using Cohere API
        """
        response = await cohere_service.client.embed(
            texts=texts,
            model="embed-multilingual-v3.0",
            input_type="search_document"
        )

        return response.embeddings

# Initialize Qdrant service
qdrant_service = AsyncQdrantService(
    url=settings.QDRANT_URL,
    api_key=settings.QDRANT_API_KEY
)
```

### RAG Retrieval Service
```python
class RAGRetrievalService:
    def __init__(
        self,
        qdrant_service: AsyncQdrantService,
        cohere_service: CohereService
    ):
        self.qdrant = qdrant_service
        self.cohere = cohere_service

    async def retrieve_context(
        self,
        query: str,
        collection_name: str = "default",
        limit: int = 5,
        filters: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Retrieve relevant context for query using semantic search
        """
        # 1. Get query embedding
        query_embedding = await self._get_query_embedding(query)

        # 2. Build filter if provided
        filter_condition = None
        if filters:
            filter_condition = Filter(
                must=[
                    FieldCondition(
                        key=key,
                        match=MatchValue(value=value)
                    )
                    for key, value in filters.items()
                ]
            )

        # 3. Search similar documents
        results = await self.qdrant.search_similar(
            query_embedding=query_embedding,
            collection_name=collection_name,
            limit=limit,
            filter_condition=filter_condition
        )

        # 4. Re-rank if needed
        if len(results) > 2:
            results = await self._rerank_results(query, results)

        return results

    async def _get_query_embedding(self, query: str) -> List[float]:
        """
        Get embedding for query
        """
        response = await self.cohere_service.client.embed(
            texts=[query],
            model="embed-multilingual-v3.0",
            input_type="search_query"
        )

        return response.embeddings[0]

    async def _rerank_results(
        self,
        query: str,
        results: List[Dict]
    ) -> List[Dict]:
        """
        Re-rank search results using Cohere's rerank model
        """
        documents = [result["content"] for result in results]

        rerank_response = await self.cohere_service.client.rerank(
            model="rerank-multilingual-v3.0",
            query=query,
            documents=documents,
            top_k=len(results)
        )

        # Reorder results based on rerank scores
        reranked_results = []
        for result in rerank_response.results:
            original_result = results[result.index]
            original_result["rerank_score"] = result.relevance_score
            reranked_results.append(original_result)

        return reranked_results

# Initialize RAG service
rag_service = RAGRetrievalService(qdrant_service, cohere_service)
```

---

## 4. Session Management with SQLAlchemy and Neon Postgres

### Database Models
```python
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Text, Boolean, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    conversations = relationship("Conversation", back_populates="user")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    system_prompt = Column(Text)
    model = Column(String, default="command-r-plus")
    metadata = Column(JSON)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation")

class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)
    role = Column(String, nullable=False)  # 'user', 'assistant', 'system'
    content = Column(Text, nullable=False)
    metadata = Column(JSON)
    token_count = Column(Integer)
    sources = Column(JSON)  # Store RAG sources
    model = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")

class DocumentIndex(Base):
    __tablename__ = "document_index"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    collection_name = Column(String, nullable=False, index=True)
    document_id = Column(String, nullable=False, index=True)
    title = Column(String)
    source = Column(String)
    content_hash = Column(String, index=True)
    indexed_at = Column(DateTime, default=datetime.utcnow)
    metadata = Column(JSON)
```

### Async Database Configuration
```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
import asyncpg

# Database configuration
DATABASE_URL = "postgresql+asyncpg://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require"

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Dependency to get async session
async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

### Conversation Service
```python
from sqlalchemy import select, delete, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

class ConversationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_conversation(
        self,
        user_id: str,
        conversation_id: Optional[str] = None,
        title: Optional[str] = None
    ) -> Conversation:
        """
        Get existing conversation or create new one
        """
        if conversation_id:
            stmt = select(Conversation).where(
                and_(
                    Conversation.id == conversation_id,
                    Conversation.user_id == user_id
                )
            )
            result = await self.db.execute(stmt)
            conversation = result.scalar_one_or_none()

            if conversation:
                return conversation

        # Create new conversation
        conversation = Conversation(
            user_id=user_id,
            title=title or "New Chat",
            model="command-r-plus"
        )
        self.db.add(conversation)
        await self.db.flush()

        return conversation

    async def get_conversation_messages(
        self,
        conversation_id: str,
        limit: int = 50
    ) -> List[Message]:
        """
        Get conversation history with pagination
        """
        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        metadata: Optional[Dict] = None,
        sources: Optional[List[Dict]] = None
    ) -> Message:
        """
        Add message to conversation
        """
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            metadata=metadata,
            sources=sources
        )
        self.db.add(message)

        # Update conversation timestamp
        await self.db.execute(
            select(Conversation)
            .where(Conversation.id == conversation_id)
            .values(updated_at=datetime.utcnow())
        )

        await self.db.flush()
        return message

    async def get_user_conversations(
        self,
        user_id: str,
        archived: bool = False,
        limit: int = 20
    ) -> List[Conversation]:
        """
        Get user's conversations
        """
        stmt = (
            select(Conversation)
            .where(
                and_(
                    Conversation.user_id == user_id,
                    Conversation.is_archived == archived
                )
            )
            .order_by(Conversation.updated_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()
```

---

## 5. CORS Configuration

### Production CORS Setup
```python
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse
import os
from typing import List

# Environment-specific origins
DEVELOPMENT_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
]

PRODUCTION_ORIGINS = [
    "https://your-frontend.app",
    "https://admin.your-frontend.app",
    "https://chat.your-frontend.app",
]

def get_allowed_origins() -> List[str]:
    """
    Get allowed origins based on environment
    """
    env = os.getenv("ENVIRONMENT", "development")

    if env == "production":
        return PRODUCTION_ORIGINS
    else:
        return DEVELOPMENT_ORIGINS

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-Chat-Session-ID",
        "X-Client-Version"
    ],
    expose_headers=[
        "X-Rate-Limit",
        "X-Rate-Limit-Remaining",
        "X-Rate-Limit-Reset",
        "X-AI-Service-Status",
        "X-Conversation-ID"
    ],
    max_age=86400,  # 24 hours
)

# Custom CORS error handler
@app.exception_handler(Exception)
async def cors_exception_handler(request: Request, exc: Exception):
    """
    Handle CORS-related exceptions with proper error responses
    """
    origin = request.headers.get("origin")

    if origin and origin not in get_allowed_origins():
        return JSONResponse(
            status_code=403,
            content={
                "error": "CORS_POLICY_VIOLATION",
                "message": "Cross-origin request blocked",
                "origin": origin,
                "allowed_origins": get_allowed_origins(),
                "documentation": "https://docs.yourapi.com/cors",
                "timestamp": datetime.utcnow().isoformat()
            },
            headers={
                "Access-Control-Allow-Origin": "null",  # Explicitly deny
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        )

    # Handle other exceptions
    return JSONResponse(
        status_code=500,
        content={
            "error": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred",
            "request_id": getattr(request.state, "request_id", None)
        }
    )
```

### Preflight Request Handler
```python
from fastapi import FastAPI
from fastapi.routing import APIRoute

class CustomRoute(APIRoute):
    def get_route_handler(self):
        original_route_handler = super().get_route_handler()

        async def custom_route_handler(request: Request) -> Response:
            # Add request ID for tracing
            request.state.request_id = str(uuid.uuid4())

            # Log CORS preflight requests
            if request.method == "OPTIONS":
                logger.info(
                    f"CORS preflight: {request.method} {request.url} "
                    f"Origin: {request.headers.get('origin')}"
                )

            response = await original_route_handler(request)

            # Add security headers
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

            return response

        return custom_route_handler

app.router.route_class = CustomRoute
```

---

## 6. Error Handling Patterns

### Comprehensive Error Handling
```python
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
import traceback
from typing import Union, Dict, Any

logger = logging.getLogger(__name__)

class ChatAPIException(Exception):
    """
    Base exception for chat API errors
    """
    def __init__(
        self,
        message: str,
        error_code: str,
        status_code: int = 500,
        details: Optional[Dict] = None,
        should_retry: bool = False
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        self.should_retry = should_retry
        super().__init__(message)

class AIServiceError(ChatAPIException):
    """
    AI service related errors
    """
    def __init__(
        self,
        message: str,
        service: str,
        status_code: int = 502,
        should_retry: bool = True
    ):
        super().__init__(
            message=message,
            error_code=f"AI_SERVICE_ERROR_{service.upper()}",
            status_code=status_code,
            details={"service": service},
            should_retry=should_retry
        )

class RAGError(ChatAPIException):
    """
    RAG specific errors
    """
    def __init__(
        self,
        message: str,
        rag_step: str,
        status_code: int = 500
    ):
        super().__init__(
            message=message,
            error_code=f"RAG_ERROR_{rag_step.upper()}",
            status_code=status_code,
            details={"rag_step": rag_step}
        )

# Exception handlers
@app.exception_handler(ChatAPIException)
async def chat_api_exception_handler(request: Request, exc: ChatAPIException):
    """
    Handle custom chat API exceptions
    """
    logger.error(
        f"Chat API Error: {exc.error_code} - {exc.message}",
        extra={
            "error_code": exc.error_code,
            "details": exc.details,
            "should_retry": exc.should_retry,
            "request_id": getattr(request.state, "request_id", None)
        }
    )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.message,
                "details": exc.details,
                "should_retry": exc.should_retry,
                "timestamp": datetime.utcnow().isoformat(),
                "request_id": getattr(request.state, "request_id", None)
            }
        }
    )

@app.exception_handler(AIServiceError)
async def ai_service_error_handler(request: Request, exc: AIServiceError):
    """
    Handle AI service errors with fallback
    """
    # Try to provide fallback response
    try:
        fallback_response = await get_fallback_response()
        return JSONResponse(
            status_code=200,
            content={
                "message": fallback_response,
                "is_fallback": True,
                "fallback_reason": "AI_SERVICE_UNAVAILABLE",
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    except:
        # If fallback fails, return error
        return JSONResponse(
            status_code=502,
            content={
                "error": {
                    "code": "AI_SERVICE_UNAVAILABLE",
                    "message": "AI service temporarily unavailable. Please try again.",
                    "retry_after": 30,
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handle Pydantic validation errors
    """
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid request data",
                "details": {
                    "field_errors": [
                        {
                            "field": ".".join(str(x) for x in error["loc"]),
                            "message": error["msg"],
                            "type": error["type"]
                        }
                        for error in exc.errors()
                    ]
                },
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    )

# Circuit breaker for AI services
from circuitbreaker import circuit

@circuit(failure_threshold=5, recovery_timeout=30)
async def call_cohere_with_circuit_breaker(message: str, context: List[Dict]):
    """
    Call Cohere API with circuit breaker pattern
    """
    return await cohere_service.generate_response(message, context)

# Retry decorator for transient failures
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    retry=retry_if_exception_type((ConnectionError, TimeoutError))
)
async def retry_ai_service_call(func, *args, **kwargs):
    """
    Retry wrapper for AI service calls
    """
    return await func(*args, **kwargs)
```

### Error Recovery Strategies
```python
class ErrorRecoveryService:
    def __init__(self):
        self.fallback_responses = {
            "greeting": "Hello! How can I help you today?",
            "error": "I'm having trouble connecting to my knowledge base. Could you try rephrasing your question?",
            "timeout": "The request took too long. Please try with a shorter message.",
        }

    async def get_fallback_response(
        self,
        message: str,
        error_type: str = "general"
    ) -> str:
        """
        Get appropriate fallback response based on message and error
        """
        message_lower = message.lower()

        # Check for greetings
        if any(word in message_lower for word in ["hello", "hi", "hey"]):
            return self.fallback_responses["greeting"]

        # Default fallback
        return self.fallback_responses[error_type]

    async def degrade_gracefully(
        self,
        original_request: ChatRequest,
        error: Exception
    ) -> ChatResponse:
        """
        Gracefully degrade functionality when errors occur
        """
        if isinstance(error, RAGError):
            # Disable RAG and try without context
            try:
                response = await cohere_service.generate_response(
                    message=original_request.message,
                    context_docs=None,
                    conversation_history=None
                )
                return ChatResponse(
                    message=response.text,
                    sources=[],
                    is_degraded=True,
                    degradation_reason="RAG_UNAVAILABLE"
                )
            except:
                pass

        # Final fallback
        fallback_message = await self.get_fallback_response(
            original_request.message,
            "general"
        )

        return ChatResponse(
            message=fallback_message,
            sources=[],
            is_fallback=True,
            fallback_reason="SERVICE_UNAVAILABLE"
        )

recovery_service = ErrorRecoveryService()
```

---

## 7. Rate Limiting and Security

### Rate Limiting Implementation
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import redis
import json
from datetime import datetime, timedelta

# Redis client for rate limiting
redis_client = redis.Redis(
    host="localhost",
    port=6379,
    db=0,
    decode_responses=True
)

# Initialize limiter
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="redis://localhost:6379",
    default_limits=["1000/hour", "60/minute"]
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Custom rate limiting for chat endpoints
@app.post("/api/v1/chat")
@limiter.limit("20/minute")
async def chat_with_rate_limit(
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    http_request: Request
):
    """
    Chat endpoint with custom rate limiting
    """
    # Additional user-based rate limiting
    user_id = await get_user_id_from_token(request.token)

    # Check user-specific limits
    user_limit_key = f"rate_limit:user:{user_id}"
    current_requests = await redis_client.get(user_limit_key)

    if current_requests and int(current_requests) >= 100:  # 100 requests per hour per user
        raise HTTPException(
            status_code=429,
            detail="User rate limit exceeded",
            headers={
                "X-RateLimit-Limit": "100",
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(int(time.time()) + 3600)
            }
        )

    # Increment counter
    pipe = redis_client.pipeline()
    pipe.incr(user_limit_key)
    pipe.expire(user_limit_key, 3600)
    await pipe.execute()

    # Process request...
    return await process_chat_request(request)

# API Key security
from fastapi import Security, HTTPException, HTTPAuthorizationCredentials
from fastapi.security import APIKeyHeader

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def get_api_key(
    api_key: str = Security(api_key_header),
    token: str = Depends(oauth2_scheme)
):
    """
    Validate API key for external integrations
    """
    if api_key:
        # Validate API key from database
        is_valid = await validate_api_key(api_key)
        if not is_valid:
            raise HTTPException(
                status_code=403,
                detail="Invalid API Key"
            )
        return api_key

    # Fall back to JWT token
    return token

# Input sanitization
import bleach
from typing import Any, Dict

def sanitize_input(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitize user input to prevent XSS and injection
    """
    if isinstance(data, str):
        # Clean HTML and scripts
        return bleach.clean(data, tags=[], strip=True)
    elif isinstance(data, dict):
        return {k: sanitize_input(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_input(item) for item in data]
    else:
        return data

# Content moderation
class ContentModerator:
    def __init__(self):
        self.blocked_words = ["spam", "abuse", "inappropriate"]
        self.max_message_length = 4096

    async def moderate_message(self, message: str) -> tuple[bool, str]:
        """
        Check if message violates content policy
        """
        # Length check
        if len(message) > self.max_message_length:
            return False, f"Message too long (max {self.max_message_length} characters)"

        # Content check
        message_lower = message.lower()
        for word in self.blocked_words:
            if word in message_lower:
                return False, "Message contains inappropriate content"

        # Additional checks can be added here
        # - External moderation service
        # - Pattern matching
        # - Machine learning classifier

        return True, "Message approved"

content_moderator = ContentModerator()
```

### Security Middleware
```python
from fastapi import FastAPI, Request, Response
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
import time
import hmac
import hashlib

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)

    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "connect-src 'self' https://api.cohere.ai;"
    )
    response.headers["Permissions-Policy"] = (
        "geolocation=(), microphone=(), camera=()"
    )
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    return response

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()

    # Generate request ID
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id

    # Log request
    logger.info(
        f"Request started: {request.method} {request.url}",
        extra={
            "request_id": request_id,
            "method": request.method,
            "url": str(request.url),
            "user_agent": request.headers.get("user-agent"),
            "ip": get_remote_address(request)
        }
    )

    response = await call_next(request)

    # Calculate duration
    process_time = time.time() - start_time

    # Log response
    logger.info(
        f"Request completed: {request.method} {request.url} - {response.status_code}",
        extra={
            "request_id": request_id,
            "status_code": response.status_code,
            "process_time": process_time
        }
    )

    # Add timing header
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-Request-ID"] = request_id

    return response

# Add trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["yourdomain.com", "*.yourdomain.com"]
)

# HTTPS redirect middleware (for production)
if os.getenv("ENVIRONMENT") == "production":
    app.add_middleware(HTTPSRedirectMiddleware)
```

---

## 8. Pydantic Model Design

### Core Chat Models
```python
from pydantic import BaseModel, Field, validator, root_validator
from typing import List, Optional, Dict, Any, Union, Literal
from datetime import datetime
from enum import Enum
import uuid

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    FUNCTION = "function"

class ChatMessage(BaseModel):
    role: MessageRole
    content: str = Field(..., min_length=1, max_length=4096)
    timestamp: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None

    @validator('content')
    def validate_content(cls, v):
        """Validate message content"""
        if not v.strip():
            raise ValueError('Message content cannot be empty')
        return v.strip()

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class DocumentSource(BaseModel):
    id: str
    title: Optional[str] = None
    content: str
    url: Optional[str] = None
    score: float = Field(..., ge=0.0, le=1.0)
    metadata: Optional[Dict[str, Any]] = None

class UsageStats(BaseModel):
    prompt_tokens: int = Field(..., ge=0)
    completion_tokens: int = Field(..., ge=0)
    total_tokens: int = Field(..., ge=0)

    @property
    def cost(self) -> float:
        """Calculate approximate cost based on token usage"""
        # Example pricing (adjust based on actual Cohere pricing)
        prompt_cost = self.prompt_tokens * 0.000003
        completion_cost = self.completion_tokens * 0.000015
        return prompt_cost + completion_cost

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4096, description="User message")
    conversation_id: Optional[str] = None
    model: str = Field(default="command-r-plus", regex="^(command|command-r|command-r-plus)$")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="Controls randomness")
    max_tokens: int = Field(default=1000, ge=1, le=8192, description="Maximum tokens to generate")
    stream: bool = Field(default=False, description="Enable streaming response")
    use_rag: bool = Field(default=True, description="Use RAG for context")
    collection: Optional[str] = Field(default="default", description="Vector collection for RAG")
    context_limit: int = Field(default=5, ge=1, le=10, description="Number of context documents")
    filters: Optional[Dict[str, Any]] = None
    system_prompt: Optional[str] = None
    tools: Optional[List[Dict[str, Any]]] = None

    @validator('message')
    def sanitize_message(cls, v):
        """Sanitize and validate message"""
        # Remove excessive whitespace
        v = ' '.join(v.split())
        return v

    @validator('collection')
    def validate_collection(cls, v):
        """Validate collection name"""
        if v:
            if not v.replace('-', '').replace('_', '').isalnum():
                raise ValueError('Collection name can only contain alphanumeric characters, hyphens, and underscores')
        return v

    class Config:
        schema_extra = {
            "example": {
                "message": "What are the benefits of using FastAPI for web APIs?",
                "model": "command-r-plus",
                "temperature": 0.7,
                "use_rag": True,
                "collection": "documentation"
            }
        }

class ChatResponse(BaseModel):
    message: str
    conversation_id: str
    model: str
    usage: UsageStats
    sources: List[DocumentSource] = []
    finish_reason: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    is_fallback: bool = False
    is_degraded: bool = False
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class StreamingChunk(BaseModel):
    content: str
    conversation_id: str
    role: MessageRole = MessageRole.ASSISTANT
    is_complete: bool = False
    sources: Optional[List[DocumentSource]] = None
    usage: Optional[UsageStats] = None
    finish_reason: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# WebSocket models
class WebSocketMessage(BaseModel):
    type: str  # 'message', 'ack', 'error', 'ping', 'pong'
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    message_id: Optional[str] = None

class ChatWebSocketRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4096)
    message_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: Optional[str] = None
    model: str = "command-r-plus"
    use_rag: bool = True
    stream: bool = True

# Error response models
class ErrorDetail(BaseModel):
    field: str
    message: str
    code: Optional[str] = None

class ErrorResponse(BaseModel):
    error: str
    error_code: str
    message: str
    details: Optional[Dict[str, Any]] = None
    field_errors: Optional[List[ErrorDetail]] = None
    should_retry: bool = False
    retry_after: Optional[int] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request_id: Optional[str] = None

# API Response wrapper
class APIResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[ErrorResponse] = None
    metadata: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    @classmethod
    def success_response(cls, data: Any, metadata: Optional[Dict] = None):
        return cls(
            success=True,
            data=data,
            metadata=metadata
        )

    @classmethod
    def error_response(cls, error: ErrorResponse):
        return cls(
            success=False,
            error=error
        )

# Configuration models
class ModelConfig(BaseModel):
    name: str
    display_name: str
    max_tokens: int
    temperature_range: tuple[float, float]
    supports_rag: bool = True
    supports_streaming: bool = True
    cost_per_token: float

    class Config:
        schema_extra = {
            "example": {
                "name": "command-r-plus",
                "display_name": "Cohere Command R+",
                "max_tokens": 8192,
                "temperature_range": [0.0, 2.0],
                "cost_per_token": 0.000015
            }
        }

# Conversation models
class ConversationSummary(BaseModel):
    id: str
    title: str
    message_count: int
    last_message: Optional[str] = None
    last_updated: datetime
    model: str
    is_archived: bool = False

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ConversationDetail(ConversationSummary):
    messages: List[ChatMessage]
    system_prompt: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
```

### Validation and Serialization
```python
from pydantic import BaseModel, validator, root_validator
import re
from typing import Type, TypeVar, Generic

T = TypeVar('T')

class ValidatedBaseModel(BaseModel):
    """Base model with common validation patterns"""

    @validator('*', pre=True)
    def strip_whitespace(cls, v):
        """Strip whitespace from string fields"""
        if isinstance(v, str):
            return v.strip()
        return v

    @validator('*', pre=True)
    def prevent_none(cls, v):
        """Prevent None values for required fields"""
        if v is None and cls.__fields__[v.name].required:
            raise ValueError(f"{v.name} cannot be None")
        return v

class SecureModel(ValidatedBaseModel):
    """Base model with security validations"""

    @validator('*')
    def prevent_html_injection(cls, v):
        """Prevent HTML injection in string fields"""
        if isinstance(v, str):
            # Check for dangerous patterns
            dangerous_patterns = [
                r'<script.*?>.*?</script>',
                r'javascript:',
                r'on\w+\s*=',
                r'<iframe.*?>',
                r'<object.*?>',
                r'<embed.*?>'
            ]

            for pattern in dangerous_patterns:
                if re.search(pattern, v, re.IGNORECASE | re.DOTALL):
                    raise ValueError("Invalid characters detected")

        return v

# Generic response wrapper
class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response model"""
    items: List[T]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool

    @validator('total_pages', always=True)
    def calculate_total_pages(cls, v, values):
        """Calculate total pages from total and per_page"""
        if 'total' in values and 'per_page' in values:
            return (values['total'] + values['per_page'] - 1) // values['per_page']
        return v

    @validator('has_next', always=True)
    def calculate_has_next(cls, v, values):
        """Calculate if there's a next page"""
        if 'page' in values and 'total_pages' in values:
            return values['page'] < values['total_pages']
        return False

    @validator('has_prev', always=True)
    def calculate_has_prev(cls, v, values):
        """Calculate if there's a previous page"""
        if 'page' in values:
            return values['page'] > 1
        return False

# Search and filtering models
class SearchFilter(BaseModel):
    field: str
    operator: Literal["eq", "ne", "gt", "gte", "lt", "lte", "in", "contains"]
    value: Any

    @validator('field')
    def validate_field(cls, v):
        """Validate field name"""
        allowed_fields = ['title', 'created_at', 'model', 'is_archived']
        if v not in allowed_fields:
            raise ValueError(f"Field must be one of: {allowed_fields}")
        return v

class SearchQuery(BaseModel):
    query: Optional[str] = None
    filters: Optional[List[SearchFilter]] = None
    sort_by: Optional[str] = 'last_updated'
    sort_order: Literal['asc', 'desc'] = 'desc'
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)

    @validator('sort_by')
    def validate_sort_by(cls, v):
        """Validate sort field"""
        allowed_sorts = ['title', 'created_at', 'last_updated', 'message_count']
        if v not in allowed_sorts:
            raise ValueError(f"Sort field must be one of: {allowed_sorts}")
        return v
```

---

## 9. Complete Implementation Example

### Main Application Structure
```python
# main.py
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Application lifecycle
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifecycle
    """
    # Startup
    logger.info("Starting up RAG Chat API...")

    # Initialize database
    await init_db()

    # Initialize Qdrant collections
    await qdrant_service.ensure_collection("default")

    logger.info("Application startup complete")

    yield

    # Shutdown
    logger.info("Shutting down RAG Chat API...")
    await cleanup_resources()
    logger.info("Shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="RAG Chat API",
    description="Production-ready chat API with RAG capabilities",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add middleware
setup_middleware(app)

# Include routers
from .api.endpoints import chat, conversations, health, admin
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(conversations.router, prefix="/api/v1/conversations", tags=["conversations"])
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
```

### Chat Endpoint Implementation
```python
# api/endpoints/chat.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import json
import asyncio

router = APIRouter()

@router.post("", response_model=ChatResponse)
@limiter.limit("20/minute")
async def create_chat_message(
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    http_request: Request,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Create a new chat message with RAG support
    """
    try:
        # 1. Authenticate user
        user = await authenticate_user(token, db)

        # 2. Moderate content
        is_appropriate, moderation_message = await content_moderator.moderate_message(request.message)
        if not is_appropriate:
            raise HTTPException(status_code=400, detail=moderation_message)

        # 3. Get or create conversation
        conv_service = ConversationService(db)
        conversation = await conv_service.get_or_create_conversation(
            user_id=str(user.id),
            conversation_id=request.conversation_id,
            title=request.message[:50] + "..." if len(request.message) > 50 else request.message
        )

        # 4. Save user message
        await conv_service.add_message(
            conversation_id=str(conversation.id),
            role=MessageRole.USER,
            content=request.message
        )

        # 5. Retrieve context if RAG is enabled
        context_docs = []
        if request.use_rag:
            try:
                context_docs = await rag_service.retrieve_context(
                    query=request.message,
                    collection_name=request.collection,
                    limit=request.context_limit,
                    filters=request.filters
                )
            except Exception as e:
                logger.error(f"RAG retrieval failed: {e}")
                # Continue without context if RAG fails
                pass

        # 6. Generate AI response
        try:
            if request.stream:
                # Streaming response handled by WebSocket endpoint
                raise HTTPException(
                    status_code=400,
                    detail="Use WebSocket endpoint for streaming responses"
                )

            # Get conversation history
            history = await conv_service.get_conversation_messages(
                conversation_id=str(conversation.id),
                limit=10
            )

            # Generate response with circuit breaker
            response = await call_cohere_with_circuit_breaker(
                message=request.message,
                context=context_docs,
                conversation_history=history,
                temperature=request.temperature,
                max_tokens=request.max_tokens
            )

            # Save assistant response
            await conv_service.add_message(
                conversation_id=str(conversation.id),
                role=MessageRole.ASSISTANT,
                content=response.text,
                sources=response.sources
            )

            return ChatResponse(
                message=response.text,
                conversation_id=str(conversation.id),
                model=request.model,
                usage=response.usage,
                sources=[
                    DocumentSource(**doc) for doc in response.sources
                ]
            )

        except Exception as e:
            logger.error(f"AI response generation failed: {e}")

            # Try graceful degradation
            degraded_response = await recovery_service.degrade_gracefully(request, e)

            # Save degraded response
            await conv_service.add_message(
                conversation_id=str(conversation.id),
                role=MessageRole.ASSISTANT,
                content=degraded_response.message,
                sources=[]
            )

            return degraded_response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat endpoint error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.websocket("/stream/{conversation_id}")
async def websocket_chat_stream(
    websocket: WebSocket,
    conversation_id: str,
    token: Optional[str] = None
):
    """
    WebSocket endpoint for streaming chat responses
    """
    await websocket.accept()

    try:
        # Authenticate
        user = await websocket_authenticate(token)

        # Get conversation
        db = AsyncSessionLocal()
        conv_service = ConversationService(db)
        conversation = await conv_service.get_conversation(conversation_id, str(user.id))

        # Handle messages
        while True:
            data = await websocket.receive_json()
            request = ChatWebSocketRequest.parse_obj(data)

            # Validate message
            is_appropriate, moderation_message = await content_moderator.moderate_message(request.message)
            if not is_appropriate:
                await websocket.send_json({
                    "type": "error",
                    "error": moderation_message
                })
                continue

            # Save user message
            await conv_service.add_message(
                conversation_id=conversation_id,
                role=MessageRole.USER,
                content=request.message
            )

            # Get context
            context_docs = []
            if request.use_rag:
                try:
                    context_docs = await rag_service.retrieve_context(
                        query=request.message,
                        collection_name="default",
                        limit=5
                    )
                except:
                    pass

            # Stream response
            accumulated_response = ""
            try:
                async for chunk in cohere_service.generate_streaming_response(
                    message=request.message,
                    context_docs=context_docs
                ):
                    if chunk.content:
                        accumulated_response += chunk.content

                        await websocket.send_json({
                            "type": "chunk",
                            "content": chunk.content,
                            "is_complete": False
                        })

                # Send final message
                await websocket.send_json({
                    "type": "complete",
                    "message": accumulated_response,
                    "sources": [],
                    "is_complete": True
                })

                # Save to database
                await conv_service.add_message(
                    conversation_id=conversation_id,
                    role=MessageRole.ASSISTANT,
                    content=accumulated_response,
                    sources=[]
                )

            except Exception as e:
                await websocket.send_json({
                    "type": "error",
                    "error": "Failed to generate response"
                })

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {conversation_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close(code=1011)
    finally:
        await db.close()
```

### Health Check Endpoint
```python
# api/endpoints/health.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

router = APIRouter()

@router.get("/")
async def health_check():
    """
    Basic health check
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@router.get("/detailed")
async def detailed_health_check(
    db: AsyncSession = Depends(get_async_session)
):
    """
    Detailed health check with service status
    """
    checks = {
        "database": await check_database_health(db),
        "qdrant": await check_qdrant_health(),
        "cohere": await check_cohere_health(),
        "redis": await check_redis_health()
    }

    all_healthy = all(check["status"] == "healthy" for check in checks.values())

    return {
        "status": "healthy" if all_healthy else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "services": checks
    }

async def check_database_health(db: AsyncSession) -> dict:
    """Check database connectivity"""
    try:
        await db.execute("SELECT 1")
        return {"status": "healthy", "response_time": "fast"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

async def check_qdrant_health() -> dict:
    """Check Qdrant connectivity"""
    try:
        collections = await qdrant_service.client.get_collections()
        return {"status": "healthy", "collections": len(collections.collections)}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

async def check_cohere_health() -> dict:
    """Check Cohere API connectivity"""
    try:
        response = await cohere_service.client.generate(
            model="command",
            prompt="Hi",
            max_tokens=1
        )
        return {"status": "healthy"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

async def check_redis_health() -> dict:
    """Check Redis connectivity"""
    try:
        await redis_client.ping()
        return {"status": "healthy"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
```

### Environment Configuration
```python
# config.py
from pydantic import BaseSettings, Field
from typing import List

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "RAG Chat API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development", regex="^(development|staging|production)$")
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10

    # Cohere
    COHERE_API_KEY: str = Field(..., env="COHERE_API_KEY")
    COHERE_MODEL: str = "command-r-plus"
    COHERE_MAX_RETRIES: int = 3

    # Qdrant
    QDRANT_URL: str = Field(..., env="QDRANT_URL")
    QDRANT_API_KEY: str = Field(default=None, env="QDRANT_API_KEY")
    QDRANT_COLLECTION: str = "default"

    # Redis
    REDIS_URL: str = Field(..., env="REDIS_URL")
    REDIS_DB: int = 0

    # Security
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000"
    ]

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

### Docker Configuration
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:password@db:5432/chatdb
      - QDRANT_URL=http://qdrant:6333
      - REDIS_URL=redis://redis:6379
      - COHERE_API_KEY=${COHERE_API_KEY}
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - db
      - qdrant
      - redis
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: chatdb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  qdrant_data:
  redis_data:
```

This comprehensive guide provides production-ready patterns for implementing FastAPI chat endpoints with RAG capabilities. The implementation follows 2025 best practices including:

1. **Async-first architecture** for optimal performance
2. **Comprehensive error handling** with graceful degradation
3. **Security-first design** with proper authentication and input validation
4. **Scalable patterns** with connection pooling and rate limiting
5. **Modern Python patterns** using Pydantic v2 and async/await
6. **Production-ready deployment** with Docker and health checks

The code examples are modular, testable, and follow industry best practices for maintainable and scalable chat APIs.