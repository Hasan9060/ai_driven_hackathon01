---

description: "Task list for Docusaurus RAG Chatbot Widget implementation"
---

# Tasks: Docusaurus RAG Chatbot Widget Integration

**Input**: Design documents from `/specs/009-chatbot-widget/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Integration testing for cross-component functionality

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `src/components/` and `src/theme/`
- **Backend**: `backend/src/` with subdirectories for models, services, api, utils
- **Tests**: `frontend/tests/` and `backend/tests/`
- **Config**: Root level configuration files

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create backend directory structure in backend/
- [x] T002 Initialize Python project with requirements.txt and pyproject.toml
- [x] T003 [P] Configure environment variables with .env.example and validation
- [x] T004 [P] Setup Docker configuration for backend deployment
- [x] T005 Create development README with setup instructions
- [x] T006 [P] Configure ESLint and code formatting for Python
- [x] T007 [P] Create frontend widget directory structure in src/components/ChatWidget/
- [x] T008 [P] Initialize React component structure and package.json (if needed)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T009 Setup database models and connection handling in backend/src/models/
- [x] T010 [P] Initialize Qdrant client and existing collection connection
- [x] T011 [P] Configure Cohere client with Command R+ and Embed v3.0 models
- [x] T012 Create base Pydantic models for API data validation
- [x] T013 Setup FastAPI application structure with middleware in backend/src/main.py
- [x] T014 [P] Configure logging and monitoring infrastructure in backend/src/utils/
- [x] T015 [P] Create utility functions for text processing and validation
- [x] T016 [P] Configure CORS for Docusaurus frontend domain
- [x] T017 [P] Set up session management with SQLAlchemy async in backend/src/db/
- [x] T018 [P] Create error handling middleware with circuit breaker patterns

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Floating Chat Assistant (Priority: P1) 🎯 MVP

**Goal**: Enable users to ask questions about book content and receive answers with citations

**Independent Test**: Can be fully tested by opening any page, clicking chat bubble, asking question, and receiving contextually relevant response with citations.

### Implementation for User Story 1

#### Models
- [x] T019 [P] [US1] Create ChatRequest model in backend/src/models/chat.py
- [x] T020 [P] [US1] Create ChatResponse model in backend/src/models/chat.py
- [x] T021 [P] [US1] Create Source model for citations in backend/src/models/chat.py

#### Services
- [x] T022 [P] [US1] Create CohereService in backend/src/services/cohere_service.py with Command R+ integration
- [x] T023 [P] [US1] Create QdrantService for vector search in backend/src/services/qdrant_service.py
- [x] T024 [P] [US1] Create SessionService for chat session management in backend/src/services/session_service.py
- [x] T025 [P] [US1] Create ChatService for orchestrating chat logic in backend/src/services/chat_service.py

#### API Endpoints
- [x] T026 [US1] Implement POST /api/chat endpoint in backend/src/api/endpoints/chat.py
- [x] T027 [P] [US1] Add request validation and error handling in chat endpoint
- [x] T028 [P] [US1] Implement GET /api/chat/history endpoint in backend/src/api/endpoints/chat.py

#### Frontend Components
- [x] T029 [US1] Create ChatWidget root component in src/components/ChatWidget/index.jsx
- [x] T030 [P] [US1] Create useChatContext hook in src/components/ChatWidget/useChatContext.js
- [x] T031 [P] [US1] Create ChatBubble component in src/components/ChatWidget/ChatBubble.jsx
- [x] T032 [P] [US1] Create ChatWindow component in src/components/ChatWidget/ChatWindow.jsx
- [x] T033 [P] [US1] Create MessageList component in src/components/ChatWidget/MessageList.jsx
- [x] T034 [P] [US1] Create MessageInput component in src/components/ChatWidget/MessageInput.jsx

#### Integration
- [x] T035 [US1] Create theme wrapper in src/theme/Root.js to integrate widget globally
- [x] T036 [P] [US1] Add CSS Modules styling in src/components/ChatWidget/styles.module.css
- [x] T037 [P] [US1] Implement responsive design with mobile breakpoints
- [x] T038 [US1] Configure theme-aware styling for Docusaurus light/dark modes

#### Final Integration
- [x] T039 [US1] Create environment configuration with .env file for frontend
- [x] T040 [US1] Update ChatWidget to use environment variables for configuration
- [x] T041 [US1] Update theme wrapper to conditionally render ChatWidget based on config
- [x] T042 [US1] Create test page and documentation for ChatWidget visibility verification
- [x] T043 [US1] Verify ChatWidget integration is visible and functional in frontend

**Checkpoint**: User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Context-Aware Text Selection (Priority: P1)

**Goal**: Enable users to highlight text and get targeted AI responses with context

**Independent Test**: Can be fully tested by highlighting text on any page, verifying "Ask AI" tooltip appears, clicking it, and confirming selected text is used as context.

### Implementation for User Story 2

#### Frontend Components
- [T039 [P] [US2] Create TextSelectionTooltip component in src/components/ChatWidget/TextSelectionTooltip.jsx
- [040] [P] [US2] Create useTextSelection hook in src/components/ChatWidget/hooks/useTextSelection.js
- [041] [P] [US2] Implement text selection detection with debouncing
- [042] [P] [US2] Add tooltip positioning algorithm relative to text selection

#### API Enhancement
- [T043 [US2] Update ChatRequest model to support selected_text field in backend/src/models/chat.py
- [T044 [P] [US2] Update ChatResponse model to include selected_text_used flag in backend/src/models/chat.py
- [045] [P] [US2] Modify chat endpoint to handle selected_text context in backend/src/api/endpoints/chat.py

#### Backend Logic
- [046 [US2] [P] Implement context switching logic in backend/src/services/chat_service.py
- [047] [P] [US2] Create selected text preprocessing and validation in backend/src/utils/text_processing.py
- [048] [US2] Add context-aware response generation in backend/src/services/cohere_service.py

#### Integration
- [049 [P] [US2] Update useChatContext to handle selected text state in src/components/ChatWidget/useChatContext.js
- [050] [P] [US2] Connect TextSelectionTooltip to ChatWidget root component in src/components/ChatWidget/index.jsx
- [051] [P] [US2] Implement selected text persistence in localStorage for chat context

**Checkpoint**: User Story 2 should be fully functional and testable independently

---

## Phase 5: User Story 3 - Persistent Conversation History (Priority: P2)

**Goal**: Maintain conversation history across sessions and page navigation

**Independent Test**: Can be fully tested by having conversation, navigating pages, closing/reopening browser, and verifying history persistence.

### Implementation for User Story 3

#### Database Enhancement
- [T052 [P] [US3] Add ChatMessage model in backend/src/models/chat.py with required fields
- [T053 [P] [US3] Create database migrations for chat tables using Alembic in backend/alembic/
- [054] [P] [US3] Implement automatic session expiration and cleanup in backend/src/services/session_service.py

#### Backend Services
- [055] [P] [US3] Create MessageService for chat history operations in backend/src/services/message_service.py
- [056] [P] [US3] Implement session recovery and history restoration in backend/src/services/session_service.py
- [057] [P] [US3] Add message pagination and filtering in backend/src/services/message_service.py

#### API Endpoints
- [058] [P] [US3] Implement GET /api/sessions endpoint in backend/src/api/endpoints/sessions.py
- [059] [P] [US3] Create POST /api/sessions endpoint for new sessions in backend/src/api/endpoints/sessions.py
- [060] [P] [US3] Add DELETE /api/sessions/{id} endpoint for session cleanup in backend/src/api/endpoints/sessions.py
- [061] [P] [US3] Extend GET /api/chat/history with advanced filtering options

#### Frontend Enhancement
- [062] [P] [US3] Update useChatContext to load/save chat history in src/components/ChatWidget/useChatContext.js
- [063] [US3] Add session recovery logic for browser restarts
- [064] [P] [US3] Implement infinite scroll for chat history loading
- [065] [P] [US3] Add conversation continuity indicators in UI

#### Data Management
- [066] [P] [US3] Implement localStorage caching for offline support
- [067] [P] [US3] Create data synchronization strategy between client and server
- [068] [P] [US3] Add conflict resolution for concurrent sessions

**Checkpoint**: User Story 3 should be fully functional and testable independently

---

## Phase 6: User Story 4 - Responsive Mobile Experience (Priority: P2)

**Goal**: Optimize widget for mobile and tablet devices without interfering with reading experience

**Independent Test**: Can be fully tested on mobile devices and tablets verifying usability and non-interference.

### Implementation for User Story 4

#### Responsive Design
- [T069 [P] [US4] Create responsive CSS breakpoints for mobile/tablet in src/components/ChatWidget/styles.module.css
- [070] [P] [US4] Implement touch-optimized controls for mobile devices
- [071] [P] [US4] Add keyboard-aware positioning for mobile chat window
- [072] [P] [US4] Create mobile-optimized chat bubble sizing and positioning

#### Frontend Components
- [073] [P] [US4] Create MobileChatBubble variant in src/components/ChatWidget/MobileChatBubble.jsx
- [074] [P] [US4] Implement MobileChatWindow with full-screen capability
- [075] [P] [US4] Add touch gestures for swipe actions and navigation
- [076] [P] [US4] Create ResponsiveChatContainer that adapts to screen size

#### Performance Optimization
- [077] [P] [US4] Implement lazy loading for chat history on mobile
- [078] [P] [US4] Add touch debouncing for text selection detection
- [079] [P] [US4] Optimize bundle size for mobile networks
- [080] [P] [US4] Implement offline support with service workers

#### Testing
- [081] [P] [US4] Create mobile-specific test suite in frontend/tests/mobile/
- [082] [P] [US4] Add touch interaction testing with React Testing Library
- [083] [P] [US4] Implement device compatibility testing across screen sizes

**Checkpoint**: User Story 4 should be fully functional and testable independently

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and overall system quality

### Error Handling & Reliability
- [084] [P] Implement comprehensive error handling for AI service failures
- [085] [P] Add circuit breaker pattern for Cohere API calls
- [086] [P] Create fallback responses when services are unavailable
- [087] [P] Add retry logic with exponential backoff for failed requests
- [088] [P] Implement graceful degradation for network issues

### Performance Optimization
- [089] [P] Add response caching for repeated queries
- [090] [P] Implement request debouncing for text selection
- [091] [P] Optimize database queries with proper indexing
- [092] [P] Add performance monitoring and metrics collection
- [093] [P] Implement connection pooling for database operations

### Security & Privacy
- [094] [P] Add input sanitization and validation for all inputs
- [095] [P] Implement rate limiting per session and global limits
- [096] [P] Add CSRF protection for state-changing operations
- [097] [P] Ensure data encryption in transit and at rest
- [098] [P] Implement automatic data cleanup after 30 days

### Testing & Quality
- [099] [P] Create comprehensive backend test suite with pytest
- [100] [P] Add frontend integration tests with React Testing Library
- [101] [P] Implement end-to-end testing for complete workflow
- [102] [P] Add performance and load testing capabilities
- [103] [P] Create automated testing pipeline for CI/CD

### Documentation & Deployment
- [104] [P] Create API documentation with OpenAPI specification
- [105] [P] Add developer setup and deployment guides
- [106] [P] Create user documentation for chat widget features
- [107] [P] Implement monitoring and alerting setup
- [108] [P] Create troubleshooting guide for common issues

### Accessibility & UX
- [109] [P] Add ARIA labels and keyboard navigation support
- [110] [P] Implement screen reader compatibility
- [111] [P] Add high contrast mode support
- [112] [P] Ensure focus management for keyboard users
- [113] [P] Add haptic feedback for mobile interactions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in parallel if adequately staffed
  - Or sequentially in priority order (P1 → P1 → P2 → P2)
  - User Stories 1 & 2 can proceed in parallel if team capacity allows

### Within Each User Story

- **Testing (if required)**: Test models before implementations
- **Models before Services**: Define data structures before business logic
- **Services before Endpoints**: Core logic before API layer
- **Frontend Components**: Independent development, integrated via theme wrapper
- **Integration**: Connect all layers, then end-to-end testing
- **Success Criteria**: Verify each story meets its independent test criteria before moving to next

### Parallel Opportunities

- **Setup Phase**: All T003, T004, T006, T007, T008 can run in parallel
- **Foundational Phase**: All marked [P] can run in parallel (within Phase 2)
- **User Story 1**: Models (T019-021) [P], Services (T022-025) [P], Components (T029-034) [P], Integration (T035-038) can run in parallel
- **User Story 2**: Frontend (T039-042) [P] can run with backend (T043-048) after models done
- **User Story 3**: Database (T052-054) [P] can run with Services (T055-058) [P] after models done
- **User Story 4**: All [P] tasks can run in parallel

### Parallel Example: User Story 1

```bash
# Launch all models for User Story 1 together:
Task: "Create ChatRequest model in backend/src/models/chat.py"
Task: "Create ChatResponse model in backend/src/models/chat.py"
Task: "Create Source model for citations in backend/src/models/chat.py"

# Launch all services for User Story 1 together:
Task: "Create CohereService in backend/src/services/cohere_service.py"
Task: "Create QdrantService for vector search in backend/src/services/qdrant_service.py"
Task: "Create SessionService for chat session management in backend/src/services/session_service.py"
Task: "Create ChatService for orchestrating chat logic in backend/src/services/chat_service.py"
```

### Parallel Example: User Story 2

```bash
# Frontend components can run in parallel:
Task: "Create TextSelectionTooltip component in src/components/ChatWidget/TextSelectionTooltip.jsx"
Task: "Create useTextSelection hook in src/components/ChatWidget/hooks/useTextSelection.js"
Task: "Implement text selection detection with debouncing"

# Backend enhancements can run in parallel:
Task: "Update ChatRequest model to support selected_text field"
Task: "Update ChatResponse model to include selected_text_used flag"
Task: "Modify chat endpoint to handle selected_text context"
Task: "Implement context switching logic in backend/src/services/chat_service.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (backend models, services, API)
   - Developer B: User Story 1 (frontend components, integration)
   - Developer C: User Story 2 (text selection, context handling)
   - Developer D: User Story 3 (database, persistence, history)
   - Developer E: User Story 4 (responsive design, mobile optimization)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify each story meets its independent test criteria before marking complete
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Total tasks: 113
- Tasks per user story: US1 (15), US2 (11), US3 (17), US4 (15)
- Parallel tasks: 91 marked with [P]