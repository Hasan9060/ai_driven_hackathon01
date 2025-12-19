<!--
Sync Impact Report:
Version change: 0.0.0 → 1.0.0 (initial adoption)
Modified principles: N/A (new constitution)
Added sections: Core Principles (4), Technical Standards, Performance Standards, Governance
Removed sections: N/A
Templates requiring updates:
  ✅ .specify/templates/plan-template.md (validated)
  ✅ .specify/templates/spec-template.md (validated)
  ✅ .specify/templates/tasks-template.md (validated)
  ✅ .specify/templates/commands/*.md (validated)
Follow-up TODOs: None
-->

# Humanoid Robotics Textbook RAG Chatbot Constitution

## Core Principles

### I. Contextual Integrity
All answers MUST be strictly grounded in the book's content or user-selected text. The chatbot MUST refuse to answer questions outside the documented scope unless explicitly specified by the user. Every response MUST include source citations pointing to the relevant book section.

### II. Minimal Latency
The system MUST achieve high-performance retrieval with average Time To First Token (TTFT) under 1.5 seconds. This requires efficient vector search implementation, optimized embedding flows, and minimal database query overhead. Performance monitoring is mandatory for all endpoints.

### III. Modular Architecture
Clean separation MUST be maintained between Frontend (Embedding), Backend (API), and Vector Database components. Each module MUST be independently deployable and testable. Interfaces between modules MUST be clearly defined with versioned contracts.

### IV. Privacy-First
User-selected text processing MUST be ephemeral and secure. No user-provided text snippets should be persisted permanently without explicit consent. All temporary data MUST be automatically purged after session completion. Processing must comply with data protection regulations.

## Technical Standards

### RAG Logic Implementation
- MUST use "Embed-then-Retrieve" flow exclusively
- Source citation is mandatory for every chatbot response
- Embeddings MUST use Cohere's `embed-english-v3.0` (or multilingual variant for non-English content)
- Document chunks MUST be 512-1024 tokens to maintain Cohere context limits

### Selected Text Feature
- MUST implement specific endpoint that overrides general RAG when `selected_text` is provided
- Selected text processing MUST be prioritized over corpus search
- MUST maintain context switching between general chat and focused text analysis

### API Design Requirements
- RESTful endpoints with comprehensive Pydantic validation
- All responses MUST include structured error handling
- API MUST be versioned with backward compatibility guarantees
- Endpoints MUST support both JSON and human-readable formats

### Database Schema Requirements
- Neon Postgres: Session history, user interactions, and metadata
- Qdrant Cloud: Document embeddings with metadata (page numbers, chapter titles)
- All vector operations MUST include metadata filtering capabilities

## Performance Standards

### Accuracy Requirements
- Chatbot MUST identify and refuse out-of-scope questions
- Source relevance MUST be measured and tracked
- Context retention MUST be maintained across conversation turns

### Response Time Targets
- Average TTFT: <1.5 seconds
- Embedding generation: <500ms per chunk
- Vector search: <300ms for typical queries
- Full response generation: <2 seconds total

### Integration Requirements
- Chatbot MUST be easily embeddable via iframe
- React component script MUST be provided for frontend integration
- Frontend MUST handle streaming responses efficiently

## Technical Requirements

### Technology Stack Constraints
- LLM & Embeddings: Cohere API exclusively (Command R/R+ for chat, Embed v3 for vectors)
- Backend Framework: FastAPI (Python) with async support
- Database: Neon Serverless Postgres for metadata/logs
- Vector Database: Qdrant Cloud (Free Tier minimum)
- No OpenAI APIs or models permitted

### Search Implementation
- Hybrid search combining vector similarity with metadata filtering
- Search relevance MUST be tunable and configurable
- MUST support multi-modal search (text + metadata constraints)

### Deployment Readiness
- Environment variable management via .env files
- Configuration MUST support development, staging, and production
- Docker containerization REQUIRED for consistent deployment
- Health checks and monitoring endpoints MUST be implemented

## Governance

### Amendment Process
- Constitution supersedes all other project documentation
- Amendments require documented proposal with technical justification
- All changes MUST be reviewed and approved by project maintainers
- Version MUST follow semantic versioning (MAJOR.MINOR.PATCH)

### Compliance Requirements
- All pull requests MUST verify compliance with applicable principles
- Automated tests MUST validate constitutional requirements
- Code reviews MUST include constitutional compliance check
- Violations MUST be documented with resolution plans

### Development Workflow
- Features MUST identify applicable constitutional principles
- Implementation MUST include tests for constitutional compliance
- Performance benchmarks MUST meet or exceed defined standards
- Security audits MUST validate Privacy-First requirements

**Version**: 1.0.0 | **Ratified**: 2025-12-17 | **Last Amended**: 2025-12-17