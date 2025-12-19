# Claude Agent Context

**Last Updated**: 2025-12-17
**Project**: Humanoid Robotics Textbook RAG Chatbot

## Project Overview

This is a comprehensive educational platform for humanoid robotics featuring a RAG (Retrieval-Augmented Generation) chatbot integrated with a Docusaurus documentation site.

## Technology Stack

### Frontend
- **Framework**: Docusaurus v3+
- **Deployment**: Vercel (https://hackathon-physical-ai-humanoid-robo-five.vercel.app)
- **Structure**: Static site with markdown-based content organization

### Backend (RAG Chatbot)
- **API Framework**: FastAPI (Python 3.11+)
- **LLM Service**: Cohere API (Command R+ for chat, embed-english-v3.0 for embeddings)
- **Vector Database**: Qdrant Cloud (Free Tier)
- **Metadata Database**: Neon Serverless Postgres
- **Authentication**: JWT-based sessions

### Key Libraries
- `fastapi`: Web framework
- `qdrant-client`: Vector database operations
- `cohere`: LLM and embedding services
- `beautifulsoup4`: HTML parsing for content ingestion
- `psycopg2-binary`: PostgreSQL connectivity
- `pydantic`: Data validation

## Architecture Principles

From the constitution (v1.0.0):

1. **Contextual Integrity**: All answers must be grounded in book content with source citations
2. **Minimal Latency**: Average response time <1.5 seconds
3. **Modular Architecture**: Clear separation between Frontend, Backend, and Vector DB
4. **Privacy-First**: Ephemeral processing of user-selected text

## Current Feature: 008-rag-chatbot

### Status
- **Specification**: Complete
- **Plan**: Complete
- **Next Phase**: Task creation (`/sp.tasks`)

### Key Components

1. **Content Ingestion Pipeline**
   - Extracts content from Docusaurus site
   - Chunks content (200-300 tokens with 15% overlap)
   - Generates embeddings via Cohere
   - Stores in Qdrant with metadata

2. **Chat API Endpoints**
   - `POST /chat`: Main Q&A endpoint
   - `GET /chat/history`: Retrieve conversation history
   - `POST /sessions`: Create new session
   - `GET /sessions/{id}`: Get session details

3. **Selected Text Feature**
   - Allows users to highlight specific text
   - Prioritizes selected text over general search
   - Ephemeral processing (not persisted)

### Database Schema

#### Neon Postgres
- `sessions`: User session management
- `chat_history`: Q&A pairs with metadata
- Schema includes privacy controls and TTL

#### Qdrant Collection
- Name: `book_content`
- Dimensions: 1024 (Cohere embed-v3)
- Distance: Cosine
- Payload: Rich metadata including chapter, section, content type

## Configuration

### Environment Variables
```env
# Required for implementation
COHERE_API_KEY=***
QDRANT_URL=***
QDRANT_API_KEY=***
DATABASE_URL=***
FRONTEND_URL=***
DOCS_BASE_URL=***

# Optional
SECRET_KEY=***
QDRANT_COLLECTION_NAME=book_content
MAX_CONTENT_CHUNKS=5
EMBEDDING_BATCH_SIZE=50
```

## Integration Points

### Frontend Integration Options
1. **React Component**: Direct embedding in Docusaurus
2. **iframe Widget**: Standalone chat widget
3. **API Integration**: Custom frontend implementation

### Content Structure
- Base URL: https://hackathon-physical-ai-humanoid-robo-five.vercel.app
- Sitemap: `/sitemap.xml` for content discovery
- Main content selector: `article.markdown`
- Navigation: `.theme-doc-sidebar-container`

## Performance Targets

- **TTFT**: <1.5 seconds
- **Embedding Generation**: <500ms per chunk
- **Vector Search**: <300ms
- **Full Response**: <2 seconds

## Development Workflow

### Spec-Driven Development
- Specifications in `specs/` directory
- Each feature has: spec.md, plan.md, data-model.md, contracts/, quickstart.md
- Constitutional compliance checked at each phase

### Quality Gates
- All code must pass constitutional checks
- Performance benchmarks mandatory
- Privacy compliance validation required

## Monitoring & Observability

### Health Checks
- `/health` endpoint monitors all services
- Tracks response times and error rates
- Service dependency health

### Key Metrics
- User satisfaction ratings
- Query relevance scores
- Session analytics
- Performance benchmarks

## Security & Privacy

- Selected text never persisted
- Automatic data purging (30 days)
- GDPR-compliant design
- HTTPS-only communication

## Known Architectural Decisions

1. **Cohere API Selection**: Chosen for superior reasoning capabilities
   - ADR: Consider documenting with `/sp.adr cohere-api-selection`

2. **Chunking Strategy**: 200-300 tokens optimized for technical content
   - Balances context preservation and retrieval precision

3. **Vector Indexing**: HNSW with Cosine similarity
   - Optimal for semantic search performance

## Current Working Directory

When implementing backend:
- Primary location: `/backend/`
- Scripts: `/backend/scripts/`
- Tests: `/backend/tests/`

When working on documentation:
- Location: `/frontend/` or root
- Static files: `/frontend/static/`

## Next Steps for Implementation

1. Run `/sp.tasks` to generate implementation tasks
2. Set up backend directory structure
3. Implement content ingestion pipeline
4. Develop FastAPI endpoints
5. Create frontend integration
6. Set up monitoring and deployment

---
*This file is automatically updated during planning phases. Manual additions should be placed between markers.*