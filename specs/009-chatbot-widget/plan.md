# Implementation Plan: Docusaurus RAG Chatbot Widget & Backend Integration

**Branch**: `009-chatbot-widget` | **Date**: 2025-12-17 | **Spec**: [spec.md](./spec.md)
**Input**: User description for embedding RAG chatbot widget into Docusaurus book

## Summary

Implement a comprehensive RAG (Retrieval-Augmented Generation) chatbot widget that integrates seamlessly with an existing Docusaurus book site. The system will provide intelligent AI assistance with text selection capabilities, session persistence, and context-aware conversations powered by Cohere and Qdrant.

## Technical Context

**Language/Version**: React 18+ (Frontend), Python 3.9+ (Backend)
**Primary Dependencies**:
- Frontend: React, Docusaurus 2.x, CSS Modules
- Backend: FastAPI, SQLAlchemy, Qdrant Client, Cohere SDK
- Database: Neon PostgreSQL (async), Qdrant Cloud
- Testing: pytest, React Testing Library

**Storage**: Neon Postgres (sessions/chat history), Qdrant Cloud (existing vector embeddings)
**Testing**: pytest (backend), React Testing Library (frontend)
**Target Platform**: Vercel/Railway (backend), GitHub Pages/Vercel (frontend)
**Project Type**: Full-stack web application with persistent UI component
**Performance Goals**: Chat responses <2 seconds, text selection <200ms, widget persistence across navigation
**Constraints**: Must integrate with existing Docusaurus site, preserve existing Qdrant data, maintain user privacy with auto-cleanup
**Scale/Scope**: Single book content with existing embeddings, support 100+ concurrent users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Mandatory Requirements from Constitution:

1. **Spec-Driven Architecture**:
   - ✅ All components traceable to specification files
   - ✅ No independent content creation without specifications
   - ✅ React components follow Docusaurus plugin standards

2. **Documentation-as-Code**:
   - ✅ Version control for all widget components
   - ✅ Modular architecture with clear separation
   - ✅ Automated testing and deployment practices

3. **Docusaurus-Native**:
   - ✅ Uses src/theme/Root.js for persistent components
   - ✅ Follows Docusaurus routing and component standards
   - ✅ Leverages Docusaurus built-in features (Infima)

4. **CI/CD Deployment**:
   - ✅ Automated deployment via GitHub Actions possible
   - ✅ Environment-specific configurations
   - ✅ Consistent build and deployment pipeline

## Architecture Decision Detected:
📋 **Multi-layer widget architecture**: Choose between global DOM injection vs Docusaurus theme wrapping vs plugin system for persistent chat widget — Document reasoning and trade-offs? Run `/sp.adr docusaurus-widget-architecture`.

### Decision:
**Chosen Approach**: Docusaurus Theme Wrapping with src/theme/Root.js
**Rationale**:
- Ensures widget persistence across SPA navigation
- Provides access to global Docusaurus context
- Minimal performance impact
- Follows Docusaurus best practices
- Easier styling with Infima integration

**Trade-offs Evaluated**:
- Plugin system: Overkill for this use case, adds complexity
- DOM injection: Harder to maintain, potential SSR issues
- Theme wrapping: Perfect balance of simplicity and functionality

## 1. Scope and Dependencies

### In Scope:
- Floating chat bubble widget with slide-in chat window
- Text selection detection with "Ask AI" tooltip
- React state management for selected text and chat history
- Session persistence using Neon Postgres
- Integration with existing Qdrant collection and Cohere models
- Responsive design for mobile devices
- CORS configuration for cross-origin requests
- Error handling and graceful degradation

### Out of Scope:
- Voice input/output capabilities
- Multi-language translation in chat responses
- User authentication/authorization system
- Admin dashboard for analytics
- File upload/download capabilities
- Real-time collaboration features
- Advanced AI features (image generation, code execution)

### External Dependencies:
- **Docusaurus**: Frontend framework and theming system
- **Qdrant Cloud**: Existing vector database with book content
- **Cohere AI**: Command R+ (chat) and Embed v3.0 (vectors)
- **Neon Postgres**: Session persistence and chat history
- **Vercel/Railway**: Backend deployment platforms

## 2. Key Decisions and Rationale

### 2.1 Widget Architecture
**Options Considered**:
- Global DOM injection with script tags
- Docusaurus plugin system
- Theme wrapping with Root.js component

**Decision**: Theme wrapping with Root.js
**Rationale**:
- Native Docusaurus integration
- Preserves state across navigation
- Access to theme context
- Minimal performance overhead
- Easy styling with Infima

### 2.2 State Management Strategy
**Options Considered**:
- Redux/Redux Toolkit for global state
- React Context with localStorage
- Zustand for lightweight state
- Server-driven state with API

**Decision**: React Context with localStorage persistence
**Rationale**:
- Simplicity for the required scope
- Automatic persistence across sessions
- No additional dependencies
- Works well with Docusaurus SSR

### 2.3 Backend Framework Choice
**Options Considered**:
- Express.js with traditional routing
- FastAPI with automatic OpenAPI
- Next.js API routes
- GraphQL with Apollo Server

**Decision**: FastAPI
**Rationale**:
- Async/await support for better performance
- Automatic OpenAPI documentation
- Type hints and Pydantic validation
- Excellent async database support
- Easy integration with AI services

### 2.4 Session Management
**Options Considered**:
- JWT-based session tokens
- UUID-based session identifiers
- Browser localStorage only
- Server-side session storage

**Decision**: UUID-based sessions with server storage
**Rationale**:
- No authentication required initially
- Easy to extend with auth later
- Server-side analytics possible
- Better privacy controls

## 3. Interfaces and API Contracts

### 3.1 Public APIs

#### Chat API Endpoint
**Endpoint**: `POST /api/v1/chat`
**Description**: Send message and receive AI response
**Input**: ChatRequest with message, session_id, optional selected_text
**Output**: ChatResponse with answer, sources, timing data
**Errors**: 400 (validation), 429 (rate limit), 500 (server error)
**Versioning**: URL versioning (/api/v1/)

#### Session Management
**Endpoints**:
- `POST /api/v1/sessions` - Create new session
- `GET /api/v1/sessions/{id}` - Get session details
- `GET /api/v1/chat/history` - Get chat history
- `DELETE /api/v1/sessions/{id}` - Delete session

**Data Format**: JSON with OpenAPI 3.0 specification
**Authentication**: None (anonymous sessions), extensible to JWT

### 3.2 Internal Component APIs

#### React Widget Props
```typescript
interface ChatWidgetProps {
  apiBaseUrl: string;
  theme?: 'light' | 'dark' | 'auto';
  position?: 'bottom-right' | 'bottom-left';
  initialOpen?: boolean;
  greeting?: string;
}
```

#### Event System
```typescript
interface ChatEvents {
  onMessageSent: (message: string) => void;
  onResponseReceived: (response: ChatResponse) => void;
  onError: (error: Error) => void;
  onSessionCreated: (session: SessionData) => void;
}
```

### 3.3 Versioning Strategy
**API Versioning**: URL-based (/api/v1/, /api/v2/)
**Breaking Changes**: New major version
**Backward Compatibility**: Maintain v1 for 6 months after v2 release
**Deprecation**: Warnings in response headers and documentation

## 4. Non-Functional Requirements (NFRs) and Budgets

### 4.1 Performance Requirements
- **TTFR (Time to First Response)**: <2 seconds for chat responses
- **Text Selection Detection**: <200ms from selection complete to tooltip visible
- **Widget Load Time**: <1 second after page load
- **Session Persistence**: <500ms for history loading
- **API Response Time**: 95th percentile <3 seconds

### 4.2 Reliability Requirements
- **Availability**: 99.5% uptime (excluding planned maintenance)
- **Error Rate**: <1% of chat requests result in errors
- **Session Recovery**: Graceful handling of network interruptions
- **Fallback Responses**: Basic responses when AI services unavailable
- **Data Persistence**: 99.9% of sessions saved successfully

### 4.3 Security Requirements
- **Data Encryption**: All data encrypted in transit (HTTPS)
- **Input Validation**: Sanitization against XSS and injection
- **Rate Limiting**: 100 requests per minute per session
- **Data Privacy**: Auto-cleanup of sessions after 30 days
- **CORS**: Restricted to approved frontend domains

### 4.4 Scalability Requirements
- **Concurrent Users**: Support 100+ simultaneous users
- **Database Connections**: Connection pooling for efficient resource use
- **Horizontal Scaling**: Backend can be scaled independently
- **CDN Compatibility**: Static assets served via CDN
- **Caching Strategy**: Response caching for repeated queries

## 5. Data Management and Migration

### 5.1 Source of Truth
- **Chat Data**: Neon Postgres is single source of truth
- **User Sessions**: Server-side storage with browser backup
- **Content Embeddings**: Existing Qdrant collection maintained
- **Configuration**: Environment-specific settings

### 5.2 Schema Evolution
- **Version**: Schema version tracked in migrations
- **Migration**: Alembic for database schema changes
- **Backward Compatibility**: Previous API versions supported
- **Data Retention**: Configurable cleanup policies

### 5.3 Migration and Rollback
- **Rollback Strategy**: Database migrations support rollback
- **Blue-Green Deployment**: Zero-downtime deployments possible
- **Data Backup**: Automated backups before schema changes
- **Migration Testing**: Staging environment validation

### 5.4 Data Retention
- **Chat Sessions**: 30 days default, configurable
- **Analytics Data**: 90 days for usage patterns
- **Error Logs**: 7 days for troubleshooting
- **Selected Text**: Immediate cleanup after use

## 6. Operational Readiness

### 6.1 Observability
- **Logs**: Structured JSON logs with correlation IDs
- **Metrics**: Request timing, error rates, user engagement
- **Traces**: OpenTelemetry for distributed tracing
- **Health Checks**: `/health` endpoint for all services

### 6.2 Alerting
- **Error Rate Thresholds**: Alert if >5% error rate over 5 minutes
- **Response Time**: Alert if p95 >3 seconds
- **AI Service Failures**: Immediate alert for Cohere/Qdrant issues
- **Database Issues**: Alert on connection failures or high latency

### 6.3 Runbooks
- **Service Restart**: Graceful restart with zero downtime
- **Database Maintenance**: Backup and restore procedures
- **AI Service Outage**: Fallback response activation
- **Performance Issues**: Bottleneck identification and resolution

### 6.4 Deployment and Rollback
- **CI/CD Pipeline**: Automated testing and deployment
- **Environment Promotion**: staging → production validation
- **Rollback Triggers**: Error rate, performance degradation
- **Feature Flags**: Gradual rollout for new features

### 6.5 Feature Flags and Compatibility
- **Widget Toggle**: Enable/disable chat functionality
- **AI Provider**: Switch between Cohere and other providers
- **UI Variants**: A/B testing for different designs
- **API Versioning**: Gradual migration between versions

## 7. Risk Analysis and Mitigation

### 7.1 Top 3 Risks

**Risk 1: AI Service Dependency**
- **Blast Radius**: Complete service outage if Cohere fails
- **Mitigation**: Implement circuit breaker pattern, fallback responses, multiple provider support
- **Kill Switch**: Disable AI features, show canned responses

**Risk 2: Docusaurus Compatibility**
- **Blast Radius**: Widget breaks during Docusaurus updates
- **Mitigation**: Use stable API, comprehensive testing, version pinning
- **Kill Switch**: Fallback to basic static help content

**Risk 3: Performance Impact**
- **Blast Radius**: Widget slows down page load times
- **Mitigation**: Lazy loading, performance monitoring, CDN caching
- **Kill Switch**: Disable widget during performance issues

### 7.2 Guardrails and Monitoring
- **Performance Budgets**: Alert on budget exceeded
- **Error Thresholds**: Automated rollback on high error rates
- **Usage Limits**: Rate limiting and quota enforcement
- **Security Monitoring**: Anomaly detection and alerting

## 8. Evaluation and Validation

### 8.1 Definition of Done
- **Functional Tests**: All user stories pass acceptance criteria
- **Integration Tests**: Widget works across all Docusaurus pages
- **Performance Tests**: Meet all NFR requirements
- **Security Tests**: Pass vulnerability scanning and penetration testing
- **Documentation**: Complete API docs and deployment guides

### 8.2 Output Validation
- **Format**: JSON schema validation for all API responses
- **Content**: AI responses grounded in book content, properly cited
- **Requirements**: All functional requirements implemented and testable
- **Safety**: No unsafe content or security vulnerabilities

### 8.3 Success Criteria Validation
- **User Experience**: Users can successfully chat and get relevant answers
- **Performance**: Response times meet NFR targets
- **Reliability**: Service maintains high availability
- **Privacy**: User data properly protected and cleaned up

## 9. Architecture Decision Record (ADR)

### 9.1 Created ADRs
- **ADR-001**: Theme wrapping vs plugin system for widget implementation
- **ADR-002**: React Context vs Redux for state management
- **ADR-003**: FastAPI vs Express for backend framework
- **ADR-004**: Session management strategy and persistence
- **ADR-005**: Error handling and fallback mechanisms

### 9.2 Documentation Links
- [ADR-001: Widget Architecture](./adr/001-widget-architecture.md)
- [ADR-002: State Management](./adr/002-state-management.md)
- [ADR-003: Backend Framework](./adr/003-backend-framework.md)
- [ADR-004: Session Management](./adr/004-session-management.md)
- [ADR-005: Error Handling](./adr/005-error-handling.md)

## Implementation Phases

### Phase 1: Backend Foundation (Week 1)
- Set up FastAPI project structure
- Configure database models and migrations
- Implement Cohere and Qdrant services
- Create basic chat endpoint
- Set up CORS and security middleware

### Phase 2: Frontend Widget (Week 2)
- Create React widget components
- Implement text selection detection
- Build chat window interface
- Add responsive design
- Integrate with Docusaurus theme

### Phase 3: Integration & Testing (Week 3)
- Connect frontend to backend API
- Implement session management
- Add error handling and loading states
- Create comprehensive test suite
- Performance optimization

### Phase 4: Deployment & Polish (Week 4)
- Set up CI/CD pipeline
- Deploy to staging environment
- Perform end-to-end testing
- Deploy to production
- Monitor and optimize

## Next Steps

This implementation plan provides a comprehensive foundation for building a production-ready RAG chatbot widget. The plan prioritizes user experience, reliability, and maintainability while leveraging existing infrastructure and following Docusaurus best practices.

**Immediate Actions**:
1. Review and approve this plan
2. Set up development environment
3. Begin Phase 1 backend implementation
4. Create detailed task breakdown using `/sp.tasks`

**Success Criteria**:
- All functional requirements implemented
- Performance targets achieved
- Security measures in place
- Documentation complete
- Production deployment ready