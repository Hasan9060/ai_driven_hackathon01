# Research Findings: RAG Chatbot Implementation

**Date**: 2025-12-17
**Feature**: 008-rag-chatbot

## 1. Docusaurus Content Extraction

### Decision: Sitemap-Based Extraction with BeautifulSoup Fallback
**Rationale**: The sitemap.xml provides a systematic, reliable method for discovering all pages. When combined with BeautifulSoup for parsing, we ensure comprehensive coverage while preserving document structure.

**Implementation Strategy**:
1. Access sitemap at `https://hackathon-physical-ai-humanoid-robo-five.vercel.app/sitemap.xml`
2. Extract all page URLs with metadata (last modified, priority)
3. Use BeautifulSoup to parse HTML content
4. Target specific CSS selectors:
   - Main content: `article.markdown`
   - Sidebar: `.theme-doc-sidebar-container`
   - Breadcrumbs: `nav[aria-label="Breadcrumbs"]`
   - TOC: `.tableOfContents`

**Content Structure**:
- Docusaurus v3+ organizes content in hierarchical markdown files
- HTML output preserves structure with semantic classes
- Navigation hierarchy captured through sidebar and breadcrumbs

**Alternatives Considered**:
- Direct crawling: Less systematic, might miss pages
- API-based extraction: Limited availability, no guarantee of JSON endpoints

## 2. Cohere Embedding Strategy

### Decision: 200-300 Token Chunks with 15% Overlap
**Rationale**: Research shows optimal retrieval performance with 200-300 tokens for technical content. Smaller chunks (150-250) recommended for robotics concepts to maintain precision.

**Implementation Details**:
- **Model**: embed-english-v3.0 (1024 dimensions)
- **Chunk size**: 200-300 tokens for general content, 150-250 for technical sections
- **Overlap**: 15% between consecutive chunks
- **Batch size**: 50-90 texts per API call (max 96)
- **Rate limiting**: Implement exponential backoff

**Special Handling**:
- Code blocks: 50-100 tokens, keep intact
- Mathematical expressions: Preserve as-is
- Technical terms: Include acronyms with full forms

**Metadata Structure**:
```json
{
  "document_id": "unique_identifier",
  "chunk_id": "chunk_number",
  "content_type": "text|code|mathematical",
  "technical_level": "beginner|intermediate|advanced",
  "robotics_domain": "kinematics|control|sensing|locomotion",
  "prerequisites": ["related_concepts"],
  "chapter": "chapter_number",
  "section": "section_title"
}
```

## 3. Qdrant Collection Design

### Decision: Cosine Similarity with HNSW Index
**Rationale**: Cosine similarity is optimal for semantic search with Cohere embeddings. HNSW provides excellent performance for approximate nearest neighbor search.

**Configuration**:
- **Distance Metric**: Cosine
- **Vector Size**: 1024 (Cohere embed-english-v3.0)
- **Index Type**: HNSW (Hierarchical Navigable Small World)
- **Collection Name**: `book_content`
- **Payload Schema**: Metadata structure from section 2

**Performance Considerations**:
- Configure `hnsw_config.m` for balance between accuracy and memory
- Set `hnsw_config.ef_construct` for build-time accuracy
- Use `payload_index` for efficient metadata filtering

## 4. Cohere API Integration

### Decision: Command R+ with Structured Prompting
**Rationale**: Command R+ provides superior reasoning capabilities and handles context-rich queries better than base models.

**Implementation Approach**:
- **Model**: command-r-plus (for complex reasoning)
- **Context Window**: 128k tokens
- **Temperature**: 0.3 (balanced creativity and reliability)

**Prompt Strategy**:
```
You are a helpful assistant answering questions about the Humanoid Robotics textbook.
Use ONLY the provided context. If the answer is not in the context, politely say so.

Context:
{retrieved_chunks}

Selected Text (if provided):
{selected_text}

Question: {user_question}

Provide a clear answer with citations. Use the format:
[Citation: Chapter X, Section Y]
```

**Error Handling**:
- Implement retry logic with exponential backoff
- Handle rate limits (429 errors)
- Fallback to command-r if command-r-plus unavailable

## 5. Session Management Strategy

### Decision: JWT-Based Sessions with Context Window
**Rationale**: JWT tokens provide stateless authentication and easy integration with frontend. Maintaining conversation context across turns is crucial for follow-up questions.

**Implementation**:
- **Session ID**: UUID v4 for uniqueness
- **Token**: JWT with session_id and expiration
- **Context Storage**: Last 5 Q&A pairs in session
- **Persistence**: Neon Postgres with TTL for automatic cleanup

**Database Schema**:
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);

CREATE TABLE chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) REFERENCES sessions(session_id),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sources JSONB,
    selected_text TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

**Privacy Compliance**:
- Automatic purging after 30 days of inactivity
- No storage of selected text beyond session
- GDPR-compliant data handling

## 6. Performance Optimization

### Decision: Async Processing with Connection Pooling
**Rationale**: Async processing enables handling concurrent requests efficiently, while connection pooling reduces database overhead.

**Optimizations**:
- **FastAPI**: Async/await throughout the stack
- **Database**: Connection pooling (asyncpg)
- **Vector Search**: Batch similarity search
- **Caching**: Embedding cache for repeated queries
- **CDN**: Static asset delivery for frontend

**Monitoring**:
- Response time tracking
- Query relevance metrics
- Error rate monitoring
- Resource usage alerts

## 7. Integration Strategy

### Decision: Modular Microservices Architecture
**Rationale**: Aligns with constitutional principle of modular architecture, enables independent deployment and scaling.

**Components**:
1. **Ingestion Service** (standalone script)
   - Processes and indexes content
   - Runs as batch job
   - Updates Qdrant collection

2. **Chat API** (FastAPI service)
   - Handles chat requests
   - Manages sessions
   - Integrates with Cohere

3. **Frontend Widget** (React component)
   - Embeddable chat interface
   - Iframe alternative
   - Real-time streaming support

## Summary of Technical Decisions

| Component | Decision | Rationale |
|-----------|----------|-----------|
| Content Extraction | Sitemap + BeautifulSoup | Systematic, reliable, preserves structure |
| Embedding Size | 200-300 tokens | Optimal for technical content retrieval |
| Vector Index | HNSW with Cosine | Best performance for semantic search |
| LLM Model | Command R+ | Superior reasoning capabilities |
| Session Store | JWT + Neon Postgres | Stateless, scalable, compliant |
| Architecture | Modular services | Constitutional compliance, scalability |

## Next Steps

1. Implement content ingestion pipeline
2. Set up Qdrant collection with proper indexing
3. Develop FastAPI endpoints
4. Create React chat widget
5. Implement monitoring and logging
6. Set up CI/CD pipeline

## Compliance Check

✅ All decisions align with constitutional requirements:
- Contextual Integrity: Strict source grounding
- Minimal Latency: Optimized for <1.5s response
- Modular Architecture: Clear service separation
- Privacy-First: Ephemeral selected text processing