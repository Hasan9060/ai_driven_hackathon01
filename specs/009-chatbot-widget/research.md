# Research: Docusaurus RAG Chatbot Widget Integration

## Phase 0 Research Findings

### 1. React Docusaurus Integration Patterns

**Decision**: Use Docusaurus theme wrapping with `src/theme/Root.js` for persistent widget visibility.

**Rationale**:
- Ensures widget persists across page navigation without remounting
- Provides access to global Docusaurus context
- Minimal performance impact as it doesn't remount on route changes
- Follows Docusaurus best practices for custom components

**Alternatives Considered**:
- Client-side injection: Less maintainable and harder to style consistently
- Plugin system: Overkill for this simple integration
- Custom page wrapper: Would require modifying every page

**Implementation Pattern**:
```jsx
// src/theme/Root.js
import React from 'react';
import Root from '@theme-original/Root';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import ChatWidget from '@site/src/components/ChatWidget';

export default function RootWrapper(props) {
  if (!ExecutionEnvironment.canUseDOM) {
    return <Root {...props} />;
  }

  return (
    <>
      <Root {...props} />
      <ChatWidget />
    </>
  );
}
```

### 2. Text Selection and State Management

**Decision**: Use React hooks with localStorage for cross-session persistence.

**Rationale**:
- Simple and effective for the required scope
- Maintains state across page navigation
- No additional dependencies needed
- Works well with Docusaurus client-side navigation

**State Management Strategy**:
- `useState` for component state
- `useEffect` for localStorage synchronization
- `useCallback` for optimized event handlers
- Debounced persistence to avoid excessive writes

**Text Selection Pattern**:
```javascript
const useTextSelection = (onSelection) => {
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (selectedText) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        onSelection({
          text: selectedText,
          position: {
            x: rect.left + rect.width / 2,
            y: rect.top
          }
        });
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
    };
  }, [onSelection]);
};
```

### 3. FastAPI RAG Integration

**Decision**: Use async FastAPI with Cohere Command R+ and existing Qdrant infrastructure.

**Rationale**:
- Cohere Command R+ provides superior chat capabilities
- Existing Qdrant collection (book_contents) already contains embeddings
- Async FastAPI provides excellent performance for chat applications
- Strong error handling and retry mechanisms available

**Key Patterns**:

**Chat Endpoint Design**:
```python
@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    if request.selected_text:
        # Use selected text as primary context
        context = f"Based on this specific text: {request.selected_text}"
        prompt = f"{context}, answer: {request.message}"
        response = await cohere_client.chat(
            message=prompt,
            model="command",
            temperature=0.3
        )
    else:
        # Use RAG search for general queries
        search_results = await qdrant_service.search(
            query=request.message,
            limit=5
        )
        context = "\n".join([r["text"] for r in search_results])
        response = await cohere_client.chat(
            message=request.message,
            documents=[{
                "title": r.get("source", "Document"),
                "snippet": r["text"]
            } for r in search_results],
            model="command"
        )

    return ChatResponse(
        answer=response.text,
        sources=[...],
        session_id=request.session_id
    )
```

### 4. Qdrant Integration Strategy

**Decision**: Leverage existing `book_contents` collection with Cohere Embed v3.0 embeddings.

**Rationale**:
- Collection already contains 195 embeddings from book content
- Cohere Embed v3.0 provides 1024-dimensional vectors (matching existing data)
- Existing search functionality can be extended for chat context
- Reduces implementation time and complexity

**Integration Approach**:
- Extend existing `QdrantService` with chat-specific methods
- Implement context-aware search (selected text vs general queries)
- Add citation handling for responses
- Implement result diversity selection to avoid redundant sources

### 5. Session Management Architecture

**Decision**: Use SQLAlchemy with Neon Postgres for session persistence.

**Rationale**:
- Neon provides serverless PostgreSQL with excellent performance
- SQLAlchemy offers mature async support
- Session management is critical for conversation continuity
- Enables future analytics and usage tracking

**Database Schema**:
```python
class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, unique=True, index=True)
    user_identifier = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("chat_sessions.session_id"))
    message_type = Column(Enum("question", "answer", "system"))
    content = Column(Text)
    sources = Column(JSON, nullable=True)
    confidence_score = Column(Float, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### 6. Styling and Design Integration

**Decision**: Use Docusaurus Infima CSS variables for native appearance.

**Rationale**:
- Maintains visual consistency with the book site
- Automatic support for light/dark themes
- Responsive design built into Infima
- No additional CSS framework dependencies

**Styling Strategy**:
- CSS Modules for component isolation
- Infima variables for colors, spacing, and typography
- Responsive breakpoints following Infima patterns
- Custom animations for smooth transitions

### 7. Performance Optimization

**Decision**: Implement multiple optimization strategies for real-time chat.

**Rationale**:
- Chat applications require sub-second response times
- Text selection detection needs to be immediate
- Memory leaks in persistent widgets can degrade performance
- Network latency affects user experience significantly

**Optimization Techniques**:
- Debounced text selection events
- Connection pooling for database operations
- Cached search results for repeated queries
- Lazy loading of chat history
- Service worker for offline capability (future enhancement)

### 8. Error Handling and Resilience

**Decision**: Implement comprehensive error handling with graceful degradation.

**Rationale**:
- AI services can experience temporary failures
- Network issues are common in real-world usage
- User experience should remain consistent during errors
- Debugging information should be available for troubleshooting

**Error Handling Strategy**:
- Circuit breaker pattern for external services
- Fallback responses for AI service failures
- Retry logic with exponential backoff
- User-friendly error messages
- Comprehensive logging for monitoring

### 9. Security Considerations

**Decision**: Implement multiple security layers for chat functionality.

**Rationale**:
- Chat interfaces can be vulnerable to injection attacks
- Session data needs protection from unauthorized access
- API endpoints require rate limiting
- User privacy must be maintained

**Security Measures**:
- Input sanitization and validation
- CORS configuration for frontend domains
- Rate limiting per session and global
- Session-based authentication (if required)
- Automatic data cleanup after 30 days

### 10. Deployment Architecture

**Decision**: Deploy backend separately from Docusaurus frontend.

**Rationale**:
- Allows independent scaling of frontend and backend
- Backend can be optimized for chat workloads
- Frontend remains static for fast CDN delivery
- Easier to manage deployments and updates

**Deployment Strategy**:
- FastAPI backend on serverless platform (Vercel, Railway, etc.)
- Docusaurus frontend on GitHub Pages or Vercel
- Environment variable configuration for different deployment stages
- Health check endpoints for monitoring
- Database connection pooling for optimal performance