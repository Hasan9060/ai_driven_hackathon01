# Data Model: RAG Chatbot for Book Content

**Feature**: 008-rag-chatbot
**Created**: 2025-12-17
**Purpose**: Define data entities and relationships for the RAG chatbot system

## 1. Core Entities

### 1.1 Document Content
Represents processed book content ready for vector search

**Attributes**:
- `document_id`: UUID - Unique identifier for document
- `chunk_id`: UUID - Unique identifier for content chunk
- `content_type`: Enum - {TEXT, CODE, MATHEMATICAL, DIAGRAM}
- `technical_level`: Enum - {BEGINNER, INTERMEDIATE, ADVANCED}
- `robotics_domain`: Enum - {KINEMATICS, CONTROL, SENSING, LOCOMOTION, AI, HARDWARE}
- `chapter_number`: Integer - Chapter identifier
- `chapter_title`: String - Chapter name
- `section_number`: String - Section identifier (e.g., "3.2.1")
- `section_title`: String - Section name
- `content_text`: Text - Actual content (200-300 tokens)
- `token_count`: Integer - Token count for optimization
- `source_url`: String - Original URL in Docusaurus
- `breadcrumb_path`: String[] - Hierarchy path [Book, Chapter, Section]
- `prerequisites`: String[] - Related concepts needed
- `learning_objectives`: String[] - Key takeaways
- `last_updated`: DateTime - Content modification timestamp

**Relationships**:
- Many-to-one with Document (via document_id)
- Many-to-many with Citation (through chunk_citations)

### 1.2 User Session
Represents a user's conversation session

**Attributes**:
- `session_id`: UUID - Unique session identifier
- `user_identifier`: String - Optional user ID (if authenticated)
- `created_at`: DateTime - Session start time
- `last_activity`: DateTime - Last interaction time
- `session_context`: JSON - Current conversation context
- `language_preference`: String - User's language (default: "en")
- `technical_level_assumed`: Enum - User's assumed knowledge level
- `privacy_consent`: Boolean - Consent for data processing
- `session_metadata`: JSON - Additional session data

**Relationships**:
- One-to-many with Chat Message
- One-to-many with Selected Text Query

### 1.3 Chat Message
Individual Q&A pairs in conversation

**Attributes**:
- `message_id`: UUID - Unique message identifier
- `session_id`: UUID - Foreign key to User Session
- `message_type`: Enum - {QUESTION, ANSWER, SYSTEM}
- `content`: Text - Message content
- `sources_used`: JSON - Citations and source information
- `confidence_score`: Float - AI confidence in answer (0-1)
- `response_time_ms`: Integer - Time to generate response
- `selected_text_context`: Text - If user provided selected text
- `feedback_rating`: Integer - User feedback (1-5 stars)
- `feedback_comment`: Text - Optional user feedback
- `metadata`: JSON - Additional message data

**Relationships**:
- Many-to-one with User Session
- Many-to-many with Document Content (through message_sources)

### 1.4 Citation
Source references for answers

**Attributes**:
- `citation_id`: UUID - Unique citation identifier
- `document_id`: UUID - Source document
- `chunk_id`: UUID - Specific content chunk
- `chapter_number`: Integer
- `section_title`: String
- `page_number`: Integer (if applicable)
- `paragraph_number`: Integer (if applicable)
- `direct_quote`: Text - Exact referenced text
- `relevance_score`: Float - How relevant to query (0-1)
- `citation_type`: Enum - {DIRECT, PARAPHRASE, CONCEPT}

**Relationships**:
- Many-to-one with Document Content
- Many-to-many with Chat Message

### 1.5 Selected Text Query
User-provided text passages for focused analysis

**Attributes**:
- `query_id`: UUID - Unique query identifier
- `session_id`: UUID - Session context
- `selected_text`: Text - User's selected content
- `source_url`: String - Where text was selected
- `selection_context`: JSON - Surrounding context
- `processing_result`: JSON - Analysis results
- `is_ephemeral`: Boolean - Mark for deletion after session
- `created_at`: DateTime - Query timestamp
- `expires_at`: DateTime - Auto-deletion time

**Relationships**:
- Many-to-one with User Session
- One-to-one with Chat Message (when analyzed)

### 1.6 Embedding Cache
Cached embeddings for performance

**Attributes**:
- `cache_id`: UUID - Unique cache identifier
- `content_hash`: String - SHA-256 hash of content
- `embedding_vector`: Array[Float] - 1024-dimension vector
- `model_version`: String - Cohere model version
- `created_at`: DateTime - Cache timestamp
- `access_count`: Integer - Usage frequency
- `last_accessed`: DateTime - Last usage time

## 2. Entity Relationships (ERD)

```
User Session (1) ---------> (N) Chat Message
    |
    +-----> (N) Selected Text Query

Document Content (1) ----> (N) Citation
    |
    +-----> (N) Message Sources (M:N with Chat Message)

Embedding Cache (1) ------> (N) Document Content (via content_hash)
```

## 3. Data Validation Rules

### 3.1 Content Validation
- `content_text` must be between 50 and 1000 tokens
- `token_count` must match actual tokenization
- `source_url` must be valid URL format
- `chapter_number` must be positive integer

### 3.2 Session Validation
- Session expires after 30 days of inactivity
- `privacy_consent` required for persistent sessions
- `session_context` limited to last 5 message pairs

### 3.3 Citation Validation
- `relevance_score` must be between 0 and 1
- `citation_id` must be unique across system
- `direct_quote` must be exact substring from source

### 4. State Transitions

### 4.1 Session Lifecycle
```
ACTIVE (created) <-> EXTENDED (activity update)
    |
    v
EXPIRED (30 days inactivity)
    |
    v
DELETED (GDPR compliance)
```

### 4.2 Message Processing
```
RECEIVED -> PROCESSING -> COMPLETED -> (optional) FEEDBACK
    |
    v
ERROR (if processing fails)
```

### 4.3 Selected Text Lifecycle
```
CREATED -> PROCESSING -> ANALYZED -> EXPIRED (session end)
```

## 5. Privacy and Security

### 5.1 Data Classification
- **Public**: Document Content, Citations
- **Session Data**: User Session, Chat Messages (temporary)
- **Sensitive**: Selected Text (ephemeral)

### 5.2 Data Retention
- Document Content: Permanent (until book update)
- User Sessions: 30 days after last activity
- Selected Text: Deleted immediately after session
- Chat History: 30 days (configurable per user)

### 5.3 Encryption Requirements
- All session data encrypted at rest
- Selected text encrypted in memory
- API communication over HTTPS only

## 6. Performance Considerations

### 6.1 Indexing Strategy
- Primary keys: UUID with B-tree index
- Session lookup: Hash index on session_id
- Content search: Vector index in Qdrant
- Time-based queries: Composite index on timestamps

### 6.2 Query Optimization
- Batch operations for embedding generation
- Connection pooling for database access
- Cache frequently accessed embeddings
- Lazy loading for large content objects

### 6.3 Scaling Strategy
- Read replicas for chat history queries
- Partition sessions by creation date
- Vector database scaling based on content size
- CDN for static content delivery

## 7. Migration Strategy

### 7.1 Initial Migration
1. Create all tables with proper constraints
2. Set up indexes for performance
3. Initialize connection pools
4. Configure retention policies

### 7.2 Content Ingestion
1. Process Docusaurus content
2. Generate embeddings in batches
3. Populate Document Content table
4. Update Qdrant collection
5. Verify data integrity

### 7.3 Backward Compatibility
- Version all model changes
- Provide migration scripts
- Support old API versions during transition
- Maintain audit trail of changes