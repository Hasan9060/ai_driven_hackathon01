# Implementation Plan: Personalized Auth System with Docusaurus Integration

**Branch**: `010-user-auth` | **Date**: 2025-12-18 | **Spec**: [/specs/010-user-auth/spec.md](/specs/010-user-auth/spec.md)
**Input**: Feature specification from `/specs/010-user-auth/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implementation of a secure authentication system with Better-Auth for Docusaurus, enabling user registration with technical background questionnaire for content personalization. The system integrates Neon Postgres for data storage, FastAPI for backend event handling, and custom React components for authentication UI.

## Technical Context

**Language/Version**:
- Frontend: TypeScript 5.x (React 18+ with Docusaurus v3+)
- Backend: Python 3.11 (FastAPI)

**Primary Dependencies**:
- Frontend: Better-Auth, React, Docusaurus, Tailwind CSS or CSS Modules
- Backend: FastAPI, asyncpg, SQLAlchemy, Pydantic
- Database: Neon Serverless PostgreSQL

**Storage**: Neon Serverless PostgreSQL
- Shared database between Better-Auth and FastAPI
- Schema: `users` (Better-Auth standard) + `profiles` (custom technical background data)

**Testing**:
- Frontend: Jest, React Testing Library, Playwright E2E
- Backend: pytest, httpx (async testing)

**Target Platform**: Web (Static site with API backend)
- Docusaurus static site generation
- FastAPI deployed as separate service

**Project Type**: Web application (frontend + backend)

**Performance Goals**:
- Authentication response: <3 seconds (p95)
- Page load for auth pages: <2 seconds
- Support 500 concurrent users

**Constraints**:
- Must use Docusaurus v3+ with MDX
- Better-Auth for session management
- Email verification required
- 30-day session persistence
- Responsive design for auth pages

**Scale/Scope**:
- Initial: 500 concurrent users
- Database schema designed for scalability
- Multi-step signup with questionnaire

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Compliance Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Spec-Driven Architecture | ✅ PASS | All implementation traceable to spec.md with data model and API contracts |
| Documentation-as-Code | ✅ PASS | Auth components version controlled with comprehensive docs |
| Docusaurus-Native | ✅ PASS | Standard routing, custom pages, and MDX components |
| CI/CD Deployment | ✅ PASS | Auth system compatible with static site deployment |

### ✅ Standards Compliance

| Standard | Status | Implementation |
|----------|--------|----------------|
| File Format | ✅ PASS | MDX pages with OpenAPI contracts |
| Directory Structure | ✅ PASS | Clear separation of auth components and backend services |
| Navigation | ✅ PASS | Dynamic navbar based on auth state |
| Styling | ✅ PASS | CSS Modules for scoped auth page styling |
| Writing Style | ✅ PASS | Clear API documentation and user messaging |
| Reference Management | ✅ PASS | Internal links in auth flows documentation |

### ✅ Constraints Compliance

| Constraint | Status | Implementation |
|------------|--------|----------------|
| Generator | ✅ PASS | Claude Code CLI with detailed research phase |
| Framework | ✅ PASS | Docusaurus v3+ with Better-Auth integration |
| Hosting | ✅ PASS | Frontend on GitHub Pages, API on Railway/Render |
| Output | ✅ PASS | Static build with separate API service |
| Plagiarism | ✅ PASS | Custom auth implementation with original contracts |

### ✅ Post-Design Validation

| Design Element | Constitution Alignment | Implementation |
|----------------|----------------------|----------------|
| Database Schema | Documentation-as-Code | Full schema in data-model.md |
| API Contracts | Spec-Driven Architecture | OpenAPI spec in contracts/ |
| Auth Flows | Docusaurus-Native | Mermaid diagrams with MDX |
| Testing Strategy | Documentation-as-Code | Documented in quickstart.md |

## Project Structure

### Documentation (this feature)

```text
specs/010-user-auth/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
│   ├── openapi.yaml     # FastAPI endpoints
│   └── auth-flows.md    # Auth flow documentation
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
# Web application structure
backend/
├── src/
│   ├── models/
│   │   ├── user.py      # User model (Better-Auth integration)
│   │   └── profile.py   # Technical profile model
│   ├── services/
│   │   ├── auth.py      # Auth event handlers
│   │   └── profile.py   # Profile CRUD operations
│   ├── api/
│   │   ├── auth.py      # Auth webhook endpoints
│   │   └── profiles.py  # Profile management endpoints
│   └── database.py      # Neon DB connection
├── tests/
│   ├── contract/        # API contract tests
│   ├── integration/     # DB integration tests
│   └── unit/           # Unit tests
└── requirements.txt

frontend/
├── src/
│   ├── components/
│   │   ├── auth/       # Auth components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   └── Questionnaire.tsx
│   │   └── common/     # Shared components
│   ├── pages/
│   │   ├── signin.tsx  # Custom signin page
│   │   └── signup.tsx  # Custom signup page
│   ├── services/
│   │   └── auth.ts     # Auth API client
│   ├── context/
│   │   └── AuthContext.tsx  # Auth state management
│   └── theme/
│       └── AuthNavbarItem/  # Custom navbar component
├── static/
│   └── css/            # Custom auth styles
├── docusaurus.config.ts
└── tests/
    └── e2e/           # Playwright E2E tests
```

**Structure Decision**: Web application with clear separation between frontend (Docusaurus) and backend (FastAPI). Both services share the same Neon database for data consistency.