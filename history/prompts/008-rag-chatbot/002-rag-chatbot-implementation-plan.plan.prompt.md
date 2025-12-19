---
id: 002
title: RAG Chatbot Implementation Plan
stage: plan
date: 2025-12-17
surface: agent
model: glm-4.6
feature: 008-rag-chatbot
branch: 008-rag-chatbot
user: null
command: /sp.plan
labels: ["rag-chatbot", "implementation-plan", "architecture", "design"]
links:
  spec: https://github.com//tree/main/specs/008-rag-chatbot/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/008-rag-chatbot/plan.md
  - specs/008-rag-chatbot/research.md
  - specs/008-rag-chatbot/data-model.md
  - specs/008-rag-chatbot/contracts/api.yaml
  - specs/008-rag-chatbot/quickstart.md
  - .claude/agent-context.md
tests:
  - Constitution compliance check (PASSED)
  - API specification validation (PASSED)
  - Data model completeness check (PASSED)
---

## Prompt

- Integrate RAG Chatbot into Existing Docusaurus Book

1. Environment & Setup (Claude Code)
   - Initialize a `/backend` directory in the current repository.
   - Configure `.env` with provided Cohere, Qdrant, and Neon Postgres credentials.
   - Setup a Virtual Environment and install: `fastapi`, `qdrant-client`, `cohere`, `beautifulsoup4`, `psycopg2-binary`.

2. Automated Content Ingestion (The "Embedding" Step)
   - Create `ingest.py`: A script to crawl the provided Vercel URL (https://hackathon-physical-ai-humanoid-robo-five.vercel.app/).
   - Logic: Extract text from Docusaurus markdown/html structure, chunk by 1000 chars.
   - Execution: Use Cohere `embed-english-v3.0` to convert text to vectors and push to Qdrant collection 'book_content'.

3. Neon Database Schema
   - Setup `models.py` for Neon Postgres to store:
     - User Session IDs
     - Chat History (for context-aware follow-up questions)
     - Log of user-selected text queries.

4. Backend API Development (FastAPI)
   - Implement `POST /chat`:
     - If `selected_text` is provided: Query Cohere using ONLY that context.
     - If no selection: Perform Vector Search in Qdrant, then send context to Cohere Command R+.
   - Implement `GET /history`: Fetch previous chats from Neon DB.

## Response snapshot

Created comprehensive implementation plan for RAG chatbot:

### Phase 0 Research ✓ COMPLETED
- Docusaurus content extraction: Sitemap-based with BeautifulSoup
- Cohere embedding strategy: 200-300 token chunks with 15% overlap
- Qdrant configuration: HNSW index with cosine similarity
- Session management: JWT-based with 30-day TTL

### Phase 1 Design ✓ COMPLETED
- Data model with 6 core entities (Document Content, User Session, Chat Message, Citation, Selected Text, Embedding Cache)
- Complete API contracts (OpenAPI 3.0) with 7 endpoints
- Quickstart guide with full implementation examples
- Updated agent context with project architecture

### Constitution Compliance ✓ PASSED
- Contextual Integrity: Source citations enforced
- Minimal Latency: Optimized chunking and indexing
- Modular Architecture: Clear service boundaries
- Privacy-First: Ephemeral text processing

### Key Technical Decisions
- Cohere Command R+ for superior reasoning
- 1024-dimension vectors (embed-english-v3.0)
- Async FastAPI with connection pooling
- Content metadata preservation for accurate citations

## Outcome

- ✅ Impact: Complete implementation plan ready for development
- 🧪 Tests: All validation checks passed (constitution, API, data model)
- 📁 Files: Created plan.md, research.md, data-model.md, api.yaml, quickstart.md, agent-context.md
- 🔁 Next prompts: Ready for `/sp.tasks` to generate implementation roadmap
- 🧠 Reflection: Successfully designed modular, compliant architecture aligning with constitutional principles

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): All compliance checks PASSED
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Run `/sp.adr cohere-api-selection` to formalize architecture decision

## Architecture Decision to Document

📋 **Cohere API Selection**: Recommend creating ADR to document rationale for choosing Cohere over alternatives (OpenAI, Anthropic, etc.) for this RAG implementation