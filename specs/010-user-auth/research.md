# Research Findings: Personalized Auth System

**Created**: 2025-12-18
**Purpose**: Research decisions for Phase 0 implementation planning

## Better-Auth Integration Pattern

**Decision**: Better-Auth operates exclusively in the frontend/Node layer with FastAPI as a resource server

**Rationale**:
- Better-Auth is designed for Node.js environments and doesn't have Python native support
- Frontend session management simplifies static site deployment
- Shared database approach ensures data consistency without auth protocol complexity

**Implementation Pattern**:
```typescript
// Frontend (Docusaurus)
betterAuth.configure({
  database: {
    provider: "postgres",
    url: process.env.NEON_DATABASE_URL,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 days
  }
})
```

**Alternatives Considered**:
- OAuth2/JWT token sharing between services - Rejected due to complexity
- Central auth service with both Node and Python SDKs - Rejected as over-engineering

## React Context for Auth State

**Decision**: Use React Context Provider wrapping Docusaurus root component

**Rationale**:
- Docusaurus supports custom root components via `swizzle` or config
- Context provides centralized state management across pages
- Enables automatic navbar updates based on auth status

**Implementation Pattern**:
```typescript
// src/context/AuthContext.tsx
const AuthContext = createContext({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {}
})

// Wrap in docusaurus.config.ts
export default {
  themeConfig: { ... },
  clientModules: [require.resolve('./src/client')],
}
```

**Alternatives Considered**:
- Local storage polling - Rejected due to stale data issues
- Zustand/Jotai stores - Rejected as unnecessary complexity

## Styling Approach for Auth Pages

**Decision**: CSS Modules with shared design tokens

**Rationale**:
- CSS Modules provide scoped styling without runtime overhead
- Docusaurus has built-in CSS Modules support
- Better Tailwind CSS integration requires additional build configuration

**Implementation Pattern**:
```css
/* src/components/auth/AuthForm.module.css */
.container {
  @apply max-w-md mx-auto bg-white rounded-lg shadow-md p-6;
}
.input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md;
}
.button {
  @apply w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700;
}
```

**Alternatives Considered**:
- Tailwind CSS - Rejected due to Docusaurus build complexity
- Inline styles - Rejected for maintainability concerns
- Global CSS - Rejected to prevent style conflicts

## Database Schema Design

**Decision**: Separate schemas for Better-Auth and custom profiles with foreign key relationship

**Rationale**:
- Better-Auth manages its own schema through migrations
- Custom profile schema allows independent evolution
- Foreign key maintains data integrity without schema coupling

**Schema Structure**:
```sql
-- Better-Auth managed tables
users (id, email, password_hash, email_verified, created_at, updated_at)
sessions (id, user_id, token, expires_at)
accounts (id, user_id, provider_id, provider_account_id)

-- Custom profile table
profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  software_years INTEGER,
  software_languages TEXT[],
  software_frameworks TEXT[],
  hardware_robotics BOOLEAN,
  hardware_embedded BOOLEAN,
  hardware_iot BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

**Alternatives Considered**:
- Single table extension - Rejected due to Better-Auth migration conflicts
- NoSQL document store - Rejected for lack of strong typing

## API Communication Pattern

**Decision**: Webhook-based event notification from Better-Auth to FastAPI

**Rationale**:
- Async notification avoids blocking user flows
- Decouples frontend auth from backend processing
- Provides audit trail for all auth events

**Implementation Pattern**:
```typescript
// Better-Auth hooks configuration
hooks: {
  after: [
    {
      matcher(context) {
        return context.path === "/sign-up" && context.status === 200
      },
      handler: async (ctx) => {
        await fetch(process.env.FASTAPI_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "user.created",
            userId: ctx.user.id,
            email: ctx.user.email
          })
        })
      }
    }
  ]
}
```

**Alternatives Considered**:
- Direct DB triggers - Rejected due to cross-service complexity
- Message queue - Rejected as over-engineering for current scale

## Testing Strategy

**Decision**: Pyramid testing approach with E2E as primary validation

**Rationale**:
- E2E tests validate complete user flows most effectively
- Unit tests catch business logic errors
- Integration tests ensure API contracts are met

**Test Structure**:
```javascript
// E2E: Complete auth flow
test("user signup with questionnaire", async ({ page }) => {
  await page.goto("/signup")
  await page.fill('[name="email"]', "test@example.com")
  await page.fill('[name="password"]', "SecurePass123!")
  await page.click('[type="submit"]')
  // Questionnaire steps...
  await expect(page.locator('[data-testid="auth-status"]')).toContainText("test@example.com")
})
```

**Alternatives Considered**:
- Contract testing only - Rejected for insufficient user flow validation
- Manual testing only - Rejected for lack of reproducibility

## Deployment Architecture

**Decision**: Separate deployment with shared database connection

**Rationale**:
- Frontend deployed to GitHub Pages (static)
- Backend deployed to Railway/Render (serverless)
- Neon provides serverless PostgreSQL with connection pooling

**Connection Pattern**:
```python
# FastAPI database configuration
DATABASE_URL = "postgresql://user:pass@host/db?sslmode=require&pool_size=20"
engine = create_async_engine(DATABASE_URL, poolclass=NullPool)
```

**Alternatives Considered**:
- Monolithic deployment - Rejected due to stack complexity
- Microservices with service mesh - Rejected as over-engineering

## Performance Optimizations

**Decision**: Client-side session validation with periodic refresh

**Rationale**:
- Reduces server round trips for authenticated requests
- Local storage provides instant auth state checks
- Server validation occurs on sensitive operations

**Implementation**:
```typescript
// Auth context implementation
const validateSession = async () => {
  const token = localStorage.getItem('better-auth.session_token')
  if (!token) return false

  try {
    const response = await fetch('/api/auth/validate', {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.ok
  } catch {
    localStorage.removeItem('better-auth.session_token')
    return false
  }
}
```

**Alternatives Considered**:
- Server-side only validation - Rejected for latency concerns
- JWT with refresh tokens - Rejected due to Better-Auth session management