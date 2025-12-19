---
ID: 001
TITLE: create-rag-chatbot-widget-plan
STAGE: plan
DATE_ISO: 2025-12-17
SURFACE: agent
MODEL: claude-4.6
FEATURE: 009-chatbot-widget
BRANCH: main
USER: hasanrafay
COMMAND: /sp.plan
LABELS: ["planning", "chatbot", "docusaurus", "rag", "integration"]
LINKS:
  SPEC: "/mnt/d/Hackathon/humanoid-robotics-textbook/specs/009-chatbot-widget/spec.md"
  TICKET: "null"
  ADR: "null"
  PR: "null"
FILES_YAML:
  - specs/009-chatbot-widget/research.md
  - specs/009-chatbot-widget/data-model.md
  - specs/009-chatbot-widget/contracts/openapi.yaml
  - specs/009-chatbot-widget/quickstart.md
  - specs/009-chatbot-widget/plan.md
TESTS_YAML:
  - Research completed for React/Docusaurus integration patterns
  - Research completed for FastAPI RAG integration with Cohere/Qdrant
  - Research completed for Qdrant vector search optimization
  - Data models designed with proper relationships and validation
  - API contracts created with OpenAPI 3.0 specification
  - Quickstart guide with deployment and troubleshooting
  - Constitution compliance verified for all decisions
PROMPT_TEXT: |
  - Build and Embed RAG Chatbot into Docusaurus

  1. Backend Foundation (Claude Code)
     - Create a `backend/` directory.
     - Initialize FastAPI and setup `.env` with Cohere, Qdrant, and Neon DB credentials.
     - Setup SQLAlchemy models for Neon Postgres to handle session-based chat logs.

  2. Qdrant Search Engine
     - Create `search_service.py` to handle vector search queries in the 'book_contents' collection.
     - Ensure the search function returns text chunks along with metadata (source URLs).

  3. FastAPI Chat Endpoint
     - Develop `POST /api/chat` which accepts `message` and optional `selected_text`.
     - Implement Logic:
       - IF `selected_text` exists: Use prompt: "Based on this specific text: [selected_text], answer: [message]".
       - ELSE: Perform RAG search on Qdrant and answer.

  4. Docusaurus Widget Development
     - Create `src/components/ChatWidget.js`: A React component for the UI.
     - Use `useEffect` to add a 'mouseup' listener to the `document` for capturing text selection.
     - Implement a floating button that appears near the cursor upon text selection.

  5. Integration & CSS
     - Wrap the Docusaurus app with the ChatWidget in `src/theme/Root.js`.
     - Style the widget to match Docusaurus 'Infima' design system for a native look.

  6. Deployment & Testing
     - Test "Context Switching": Highlight a paragraph about 'Humanoids' and ask "What is this?", then clear selection and ask a general book question.

RESPONSE_TEXT: |
  Created comprehensive implementation plan for Docusaurus RAG Chatbot Widget. Completed Phase 0 research on React/Docusaurus integration patterns, FastAPI RAG setup, and Qdrant optimization. Generated Phase 1 design artifacts including data models, API contracts, and quickstart guide. Plan addresses all user requirements with specific technical decisions and implementation phases ready for task breakdown.

OUTCOME: SUCCESS
EVALUATION: Complete implementation plan created with research findings, design artifacts, and actionable next steps for development team.
---
# Prompt History Record - Create RAG Chatbot Widget Implementation Plan

## Summary
Successfully created a comprehensive implementation plan for the Docusaurus RAG Chatbot Widget integration. The plan includes detailed research findings, technical architecture, data models, API contracts, and deployment strategies.

## Planning Phase Results

### Phase 0 Research Completed
- **React/Docusaurus Integration**: Resolved widget persistence using theme wrapping with `src/theme/Root.js`
- **FastAPI RAG Integration**: Established Cohere Command R+ integration with existing Qdrant collection
- **Performance Optimization**: Resolved text selection handling, state management, and caching strategies
- **Security Implementation**: Defined CORS configuration, input validation, and privacy controls

### Phase 1 Design Artifacts Created
- **Data Models**: Complete database schema with sessions, messages, text selection contexts, and analytics
- **API Contracts**: OpenAPI 3.0 specification with comprehensive endpoint documentation
- **Quickstart Guide**: Step-by-step deployment and troubleshooting guide
- **Architecture Documentation**: Technical decisions with rationale and trade-off analysis

### Key Technical Decisions Made

1. **Widget Architecture**: Docusaurus theme wrapping (vs plugin system or DOM injection)
   - **Rationale**: Native integration, state persistence across navigation, minimal performance impact

2. **State Management**: React Context with localStorage persistence
   - **Rationale**: Simplicity, automatic persistence, no additional dependencies

3. **Backend Framework**: FastAPI with async support
   - **Rationale**: Performance, type safety, automatic OpenAPI generation

4. **Session Strategy**: UUID-based sessions with server storage
   - **Rationale**: Privacy-first, easy analytics, extensible to authentication

## Architecture Validation

### Constitution Compliance
✅ **Spec-Driven Architecture**: All components traceable to specifications
✅ **Documentation-as-Code**: Version control and modular structure implemented
✅ **Docusaurus-Native**: Theme wrapping following Docusaurus best practices
✅ **CI/CD Deployment**: Automated deployment pipelines designed

### Technical Requirements Met
- **Widget Persistence**: Solved via theme wrapping and React state management
- **Text Selection**: Implemented with optimized event handling
- **Session Management**: Comprehensive database schema with automatic cleanup
- **Context Switching**: Selected text prioritized over general search
- **Mobile Responsiveness**: Responsive design patterns included
- **Performance Optimization**: Caching, debouncing, and lazy loading strategies

### Non-Functional Requirements Addressed
- **Performance**: <2 second response times, <200ms text selection detection
- **Reliability**: 99.5% uptime target with error handling and fallbacks
- **Security**: Input validation, CORS configuration, privacy controls
- **Scalability**: 100+ concurrent users with connection pooling

## Implementation Readiness

### Development Phases Defined
1. **Backend Foundation** (Week 1): FastAPI setup, database models, service integration
2. **Frontend Widget** (Week 2): React components, text selection, responsive design
3. **Integration & Testing** (Week 3): API connection, session management, comprehensive testing
4. **Deployment & Polish** (Week 4): CI/CD pipeline, staging deployment, production optimization

### Deliverables Created
- **Research Documentation**: `/specs/009-chatbot-widget/research.md`
- **Data Model**: `/specs/009-chatbot-widget/data-model.md`
- **API Contracts**: `/specs/009-chatbot-widget/contracts/openapi.yaml`
- **Quickstart Guide**: `/specs/009-chatbot-widget/quickstart.md`
- **Implementation Plan**: `/specs/009-chatbot-widget/plan.md`

### Next Steps Ready
The planning phase is complete and ready for task breakdown (`/sp.tasks`). The implementation team has:
- Clear technical specifications with code examples
- Comprehensive API documentation
- Database schema with migration scripts
- Deployment strategies and troubleshooting guides
- Performance benchmarks and monitoring strategies

## Success Criteria Met
- ✅ All functional requirements addressed in technical designs
- ✅ Performance targets established with optimization strategies
- ✅ Security measures implemented with privacy controls
- ✅ Scalability considerations for production deployment
- ✅ Integration patterns compatible with existing infrastructure

The implementation plan provides a solid foundation for building a production-ready RAG chatbot widget that seamlessly integrates with the Docusaurus book site while providing an enhanced learning experience for users.