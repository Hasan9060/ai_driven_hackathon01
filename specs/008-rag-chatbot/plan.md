# Implementation Plan: RAG Chatbot for Book Content

**Branch**: `008-rag-chatbot` | **Date**: 2025-12-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification for RAG Chatbot integration with Docusaurus book

## Summary

Implement a RAG (Retrieval-Augmented Generation) chatbot that provides contextual Q&A for the Humanoid Robotics Textbook. The system will ingest book content from the Docusaurus site, process it for semantic search, and provide answers with source citations. The chatbot will handle both general book queries and selected text analysis through a FastAPI backend.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: FastAPI, Qdrant-client, Cohere, BeautifulSoup4, psycopg2-binary
**Storage**: Neon Postgres (sessions/history), Qdrant Cloud (vector embeddings)
**Testing**: pytest with async support
**Target Platform**: Linux server (Vercel/Docker deployment ready)
**Project Type**: Web API backend service
**Performance Goals**: Average response time <1.5s, support 100+ concurrent users
**Constraints**: Must comply with project constitution (Contextual Integrity, Minimal Latency, Modular Architecture, Privacy-First)
**Scale/Scope**: Single book content with ~1000+ pages, 10k+ content chunks

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Mandatory Requirements from Constitution:

1. **Contextual Integrity**:
   - ✅ Answers strictly grounded in book content
   - ✅ Mandatory source citations for all responses
   - ✅ Refuse out-of-scope questions
   - ✅ Use embed-then-retrieve flow

2. **Minimal Latency**:
   - ✅ TTFT target <1.5s defined in spec
   - ✅ Efficient vector search implementation planned
   - ✅ Performance monitoring endpoints included

3. **Modular Architecture**:
   - ✅ Clean separation: Frontend (Docusaurus), Backend (FastAPI), Vector DB (Qdrant)
   - ✅ Independent deployability of modules
   - ✅ Versioned API contracts

4. **Privacy-First**:
   - ✅ Selected text processing ephemeral by design
   - ✅ No permanent storage of user text without consent
   - ✅ Automatic data purging after sessions

### Architecture Decision Detected:

📋 **Architectural decision detected: Cohere API selection for embeddings and chat**
- Document reasoning and tradeoffs? Run `/sp.adr cohere-api-selection`

## Project Structure

### Documentation (this feature)

```text
specs/008-rag-chatbot/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.yaml         # OpenAPI specification
└── tasks.md             # To be created by /sp.tasks
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/          # Pydantic models for data validation
│   │   ├── chat.py      # Chat request/response models
│   │   └── session.py   # Session management models
│   ├── services/
│   │   ├── qdrant.py    # Vector database operations
│   │   ├── cohere.py    # LLM and embedding services
│   │   ├── postgres.py  # Database operations
│   │   └── ingestion.py # Content processing service
│   ├── api/
│   │   ├── endpoints/
│   │   │   ├── chat.py  # Chat endpoint implementation
│   │   │   └── history.py # Session history endpoint
│   │   └── dependencies.py # FastAPI dependencies
│   ├── utils/
│   │   ├── text_processing.py # Text chunking utilities
│   │   └── citation.py  # Source citation formatting
│   └── main.py          # FastAPI application entry
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── contract/        # API contract tests
├── scripts/
│   └── ingest.py        # Content ingestion script
├── requirements.txt     # Python dependencies
├── .env.example         # Environment variables template
└── Dockerfile           # Container configuration
```

**Structure Decision**: Backend API service following FastAPI best practices with clear separation of concerns (models, services, API endpoints). Enables independent deployment and testing.

## Complexity Tracking

No constitutional violations identified. All requirements align with established principles.

---
## Phase 0: Research & Decisions ✓ COMPLETED

All unknowns have been researched and decisions documented. Key findings:

1. **Content Extraction**: Sitemap-based with BeautifulSoup fallback
2. **Embedding Strategy**: 200-300 token chunks with 15% overlap
3. **Qdrant Design**: Cosine similarity with HNSW index
4. **Cohere Integration**: Command R+ with structured prompting
5. **Session Management**: JWT-based with 30-day TTL

*Detailed findings in research.md*

---

## Phase 1: Design & Contracts ✓ COMPLETED

### Deliverables Created:

1. **Data Model** (`data-model.md`)
   - Defined 6 core entities with relationships
   - Validation rules and state transitions
   - Privacy and security specifications
   - Performance optimization strategies

2. **API Contracts** (`contracts/api.yaml`)
   - OpenAPI 3.0 specification
   - 7 endpoints across 4 resource groups
   - Comprehensive request/response schemas
   - Security and error handling

3. **Quickstart Guide** (`quickstart.md`)
   - Complete setup instructions
   - Code examples for all components
   - Integration patterns
   - Deployment strategies

4. **Agent Context** (`.claude/agent-context.md`)
   - Updated with project architecture
   - Technology stack details
   - Current implementation status

---

## Phase 2: Implementation Planning

Ready to proceed to `/sp.tasks` to generate:
- Detailed implementation tasks
- Task dependencies and execution order
- Testing requirements
- Integration steps

---

## Constitution Check - Final Assessment ✓ PASSED

### Constitutional Compliance Verification:

1. **Contextual Integrity** ✅
   - Strict source grounding implemented
   - Mandatory citations in all responses
   - Out-of-scope question handling

2. **Minimal Latency** ✅
   - Optimized chunking strategy (200-300 tokens)
   - Efficient vector search (HNSW index)
   - Connection pooling and caching

3. **Modular Architecture** ✅
   - Clear service boundaries
   - Independent deployment capability
   - Versioned API contracts

4. **Privacy-First** ✅
   - Ephemeral selected text processing
   - Automatic data purging (30 days)
   - GDPR-compliant design

### Architecture Decision Recorded:

📋 **Cohere API Selection**: Documented for ADR creation
- Rationale: Superior reasoning capabilities and better handling of technical content
- Recommended: Run `/sp.adr cohere-api-selection` to formalize

### Plan Status: ✅ COMPLETE

All planning phases successfully completed. Ready for implementation phase.

**Next Command**: `/sp.tasks` to generate implementation roadmap