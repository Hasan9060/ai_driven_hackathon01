# Feature Specification: Docusaurus RAG Chatbot Widget & Backend Integration

**Feature Branch**: `009-chatbot-widget`
**Created**: 2025-12-17
**Status**: Draft
**Input**: User description: "Docusaurus RAG Chatbot Widget & Backend Integration
Project: Embedding a smart AI agent into an existing Docusaurus book.

Frontend (Docusaurus) Requirements:
- Widget Type: Floating Chat Bubble (bottom-right) with a slide-in chat window.
- Framework: React (Docusaurus compatible).
- Text Selection Tool: When text is highlighted on any book page, show an "Ask AI" tooltip. Clicking it opens the chatbot with that text as context.
- State Management: Store the current 'selected_text' in a React state to pass it to the API.

Backend (FastAPI) & Data:
- Model: Cohere Command R+ for chat and Embed v3.0 for Qdrant.
- Logic: If `selected_text` is sent from frontend, use it as the ONLY context. If not, use Qdrant search.
- Persistence: Use Neon Postgres to store message history per session.
- Credentials: Use provided Cohere, Qdrant (URL & Key), and Neon DB strings.

Technical Constraints:
- Use `CORS` in FastAPI to allow requests from the Docusaurus domain.
- Implement the widget using Docusaurus 'Theme' wrapping (`src/theme/Root.js`) to ensure it stays visible across all pages."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Floating Chat Assistant (Priority: P1)

A reader navigating the Humanoid Robotics textbook wants to ask questions about the content they're reading. They click on the floating chat bubble in the bottom-right corner, which opens a slide-in chat window where they can type questions and receive AI-powered answers based on the book's content.

**Why this priority**: This is the core functionality that provides immediate value to users and forms the foundation for all other interactions with the AI assistant.

**Independent Test**: Can be fully tested by opening any page in the Docusaurus book, clicking the chat bubble, asking a question, and verifying that a contextually relevant response is received based on the book content.

**Acceptance Scenarios**:

1. **Given** a user is on any page of the Docusaurus book, **When** they click the floating chat bubble, **Then** a chat window slides in from the right with a welcome message
2. **Given** the chat window is open, **When** the user types a question about the book content, **Then** they receive an AI-generated response that cites relevant sections from the book
3. **Given** the chat window is open, **When** the user clicks outside the chat window or on the close button, **Then** the chat window slides closed and the bubble remains visible

---

### User Story 2 - Context-Aware Text Selection (Priority: P1)

A reader highlights a specific paragraph or technical concept in the textbook. An "Ask AI" tooltip appears next to the highlighted text. When clicked, it opens the chat window with the selected text automatically included as context, allowing for more targeted and relevant responses.

**Why this priority**: This provides users with precise, context-specific assistance and significantly improves the learning experience by allowing targeted questions about specific content.

**Independent Test**: Can be fully tested by highlighting text on any page, verifying the "Ask AI" tooltip appears, clicking it, and confirming the chat opens with the selected text as context.

**Acceptance Scenarios**:

1. **Given** a user selects/highlights text on any page, **When** the text selection is complete, **Then** an "Ask AI" tooltip appears within 200ms near the selection
2. **Given** the "Ask AI" tooltip is visible, **When** the user clicks on it, **Then** the chat window opens with the selected text pre-populated as context
3. **Given** the chat window opened via text selection, **When** the user asks a follow-up question, **Then** the AI response is based primarily on the selected text rather than general book content
4. **Given** the user selects different text while the chat is open, **When** they click "Ask AI" again, **Then** the chat context updates to use the newly selected text

---

### User Story 3 - Persistent Conversation History (Priority: P2)

A user has an extended conversation with the AI assistant across multiple pages and sessions. They want to be able to refer back to previous questions and answers, and maintain context throughout their learning journey.

**Why this priority**: This enhances the learning experience by allowing users to build on previous conversations and maintain context, reducing repetitive questions and improving the overall utility of the assistant.

**Independent Test**: Can be fully tested by having a conversation, navigating to different pages, closing and reopening the browser, and verifying that the conversation history is preserved and accessible.

**Acceptance Scenarios**:

1. **Given** a user has an ongoing conversation, **When** they navigate to different pages in the book, **Then** their conversation history remains accessible in the chat
2. **Given** a user closes their browser and returns within 30 days, **When** they open the chat widget, **Then** they can see their previous conversation history
3. **Given** a user wants to review past conversations, **When** they scroll up in the chat window, **Then** they can see all previous questions and responses with proper formatting and citations
4. **Given** a user hasn't interacted with the chat for 30 days, **When** they return, **Then** their conversation history is no longer available (privacy cleanup)

---

### User Story 4 - Responsive Mobile Experience (Priority: P2)

A user accessing the textbook on a mobile device wants to use the chat assistant without it interfering with their reading experience. The widget should adapt to smaller screens while maintaining full functionality.

**Why this priority**: Mobile users represent a significant portion of readers, and the experience must be optimized for their device constraints and usage patterns.

**Independent Test**: Can be fully tested by accessing the book on mobile devices and tablets, verifying that the chat widget is usable and doesn't interfere with the reading experience.

**Acceptance Scenarios**:

1. **Given** a user is on a mobile device (screen width < 768px), **When** the page loads, **Then** the chat bubble is appropriately sized and positioned
2. **Given** a mobile user opens the chat window, **When** it slides in, **Then** it occupies 80-90% of the screen width without covering the main content completely
3. **Given** a mobile user is typing in the chat, **When** the keyboard appears, **Then** the chat interface adjusts to remain visible above the keyboard
4. **Given** a tablet user (screen width 768-1024px), **When** they interact with the chat widget, **Then** it maintains the desktop experience but with touch-optimized controls

---

### Edge Cases

- What happens when the AI service (Cohere) is temporarily unavailable?
- How does the system handle very long text selections (>2000 characters)?
- What happens when users ask questions completely unrelated to the book content?
- How does the system handle network connectivity issues during active conversations?
- What happens when multiple users have concurrent sessions accessing the same content?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a floating chat bubble widget in the bottom-right corner of every page
- **FR-002**: System MUST open a slide-in chat window when the chat bubble is clicked
- **FR-003**: System MUST detect text selection on any page content within 200ms
- **FR-004**: System MUST display an "Ask AI" tooltip when text is selected, positioned within 20px of the selection
- **FR-005**: System MUST pre-populate chat context with selected text when "Ask AI" is clicked
- **FR-006**: System MUST use Cohere Command R+ for generating chat responses
- **FR-007**: System MUST use Cohere Embed v3.0 and Qdrant for content search when no text is selected
- **FR-008**: System MUST use selected text as the ONLY context when it is provided by the frontend
- **FR-009**: System MUST include source citations for all AI-generated responses
- **FR-010**: System MUST store conversation history in Neon Postgres with session-based identification
- **FR-011**: System MUST maintain conversation state across page navigation within a session
- **FR-012**: System MUST implement CORS configuration to allow requests from the Docusaurus domain
- **FR-013**: System MUST automatically clean up conversation data after 30 days of inactivity
- **FR-014**: System MUST display appropriate error messages when services are unavailable
- **FR-015**: System MUST validate text selections to a maximum of 2000 characters
- **FR-016**: System MUST provide a responsive design that works on mobile devices (screen width < 768px)
- **FR-017**: System MUST maintain chat bubble visibility during page scrolling
- **FR-018**: System MUST preserve conversation history for up to 30 days

### Key Entities *(include if feature involves data)*

- **User Session**: Represents a user's interaction session with the chatbot, includes session identifier, creation time, last activity timestamp, and user metadata
- **Conversation Thread**: Contains the complete conversation history for a session, includes all user questions, AI responses, citations, and context information
- **Selected Text Context**: Temporary context entity representing user-selected text, includes the text content, source page/section, and selection metadata
- **AI Response**: Represents chatbot responses, includes the generated answer, confidence score, source citations, and context used for generation
- **Text Selection Event**: Tracks when users select text, includes selection coordinates, page context, and timestamp for analytics

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can initiate a chat conversation in under 3 seconds from page load
- **SC-002**: Text selection tooltip appears within 200ms of completing text selection
- **SC-003**: Chat responses are generated and displayed in under 5 seconds 95% of the time
- **SC-004**: 90% of users successfully complete at least one conversation within their first session
- **SC-005**: The widget maintains functionality across 100% of pages in the Docusaurus site
- **SC-006**: Mobile users can complete basic chat interactions without zooming or horizontal scrolling
- **SC-007**: System supports 1000 concurrent users with response times under 5 seconds
- **SC-008**: 95% of AI responses include relevant source citations from the book content
- **SC-009**: Conversation history is preserved correctly across 99% of page navigation events
- **SC-010**: User satisfaction rate of 4.0/5.0 or higher for chatbot helpfulness

## Assumptions

- The existing Docusaurus site has a standard React-based architecture
- Users have modern browsers that support CSS Grid and Flexbox for responsive design
- Network connectivity is generally stable for the target audience
- The Cohere API has appropriate rate limits for the expected user volume
- The existing Qdrant database contains the complete book content with proper embeddings
- The Neon PostgreSQL database is properly configured with the necessary tables and indexes
- Users are comfortable with chat-based interfaces and AI assistants
- The target audience has basic familiarity with web-based learning platforms

## Constraints

- The widget must not interfere with the primary reading experience
- All AI responses must be grounded in the book content (no hallucinations)
- User data privacy must be maintained with automatic cleanup
- The solution must work across all existing pages without requiring individual page modifications
- Mobile experience must be fully functional without app-like installation requirements
- System must gracefully degrade when AI services are temporarily unavailable
- Implementation must not negatively impact page load performance (>2 seconds additional load time)