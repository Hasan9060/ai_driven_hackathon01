---
id: 001
title: RAG Chatbot Constitution
stage: constitution
date: 2025-12-17
surface: agent
model: glm-4.6
feature: none
branch: 007-rag-chatbot
user: null
command: /sp.constitution
labels: ["constitution", "rag-chatbot", "cohere", "governance"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - No tests run (constitution document)
---

## Prompt

- Integrated RAG Chatbot for Published Books (Cohere-Powered)
Core Principles:
- Contextual Integrity: Answers must be strictly grounded in the book's content or user-selected text.
- Minimal Latency: High-performance retrieval using Qdrant and FastAPI.
- Modular Architecture: Clean separation between Frontend (Embedding), Backend (API), and Vector DB.
- Privacy-First: User-selected text processing must be ephemeral and secure.

Technical Stack:
- LLM & Embeddings: Cohere API (Command R/R+ for chat, Embed v3 for vectors)
- Backend Framework: FastAPI (Python)
- Database (Metadata/Logs): Neon Serverless Postgres
- Vector Database: Qdrant Cloud (Free Tier)
- Integration: SpecifyKit + Claude CLI for rapid scaffolding

Key Standards:
- RAG Logic: Use "Embed-then-Retrieve" flow. Always include a "Source Citation" in chatbot responses pointing to the relevant book section.
- Selected Text Feature: Implement a specific endpoint that overrides general RAG retrieval when a user provides a `selected_text` snippet.
- API Design: RESTful endpoints with comprehensive Pydantic validation.
- Database Schema: Neon Postgres must store session history, while Qdrant stores document embeddings with metadata (page numbers, chapter titles).

Constraints:
- No OpenAI: Use Cohere API exclusively for all NLP tasks.
- Hybrid Search: Implement vector search in Qdrant with metadata filtering for high accuracy.
- Embedding Model: Use `embed-english-v3.0` (or multilingual if the book is not in English).
- Deployment Readiness: Ensure the codebase is ready for Vercel/Cloud deployment with environment variable management (.env).

Success Criteria:
- Accuracy: Chatbot must refuse to answer questions outside the book's scope (unless specified).
- Performance: Average response time (TTFT) under 1.5 seconds.
- Context Window: Efficiently handle book chunks (512-1024 tokens) to maintain Cohere context limits.
- UI Embedding: The chatbot must be easily embeddable via an iframe or a React component script.

## Response snapshot

Updated project constitution with RAG chatbot specifications:
- Established 4 core principles: Contextual Integrity, Minimal Latency, Modular Architecture, Privacy-First
- Created comprehensive Technical Standards section with RAG implementation requirements
- Added Performance Standards with measurable targets (TTFT <1.5s, accuracy requirements)
- Defined Technical Requirements including technology stack constraints and deployment readiness
- Implemented Governance section with amendment process and compliance requirements
- Version: 1.0.0 (initial adoption)

## Outcome

- ✅ Impact: Successfully established project governance framework for RAG chatbot development
- 🧪 Tests: No tests run (constitution document)
- 📁 Files: Updated .specify/memory/constitution.md with comprehensive project constitution
- 🔁 Next prompts: Consider creating ADR for Cohere API selection, architectural decisions
- 🧠 Reflection: Constitution provides clear constraints and requirements for implementing RAG chatbot

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Not applicable
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Create feature specification using /sp.specify command