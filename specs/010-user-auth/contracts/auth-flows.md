# Authentication Flow Documentation

## Overview

This document describes the complete authentication flows for the personalized auth system, including user registration, login, session management, and profile management.

## Flow 1: User Registration

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend (Docusaurus)
    participant B as Better-Auth
    participant D as Neon DB
    participant API as FastAPI

    U->>F: Navigate to /signup
    F->>U: Display signup form
    U->>F: Submit email & password
    F->>B: POST /auth/signup
    B->>D: Create user record
    B-->>F: Return user session
    B->>API: Webhook: user.created
    API->>D: Create empty profile
    F->>U: Display questionnaire
    U->>F: Complete questionnaire
    F->>API: POST /profiles/me/questionnaire
    API->>D: Update profile
    API-->>F: Return updated profile
    F->>U: Redirect to dashboard
```

### Detailed Steps

1. **Initial Signup**
   - User navigates to `/signup`
   - Frontend renders multi-step form with validation
   - Email format and password strength validated client-side
   - Form submitted to Better-Auth signup endpoint

2. **Account Creation**
   - Better-Auth creates user record in Neon DB
   - Generates session token
   - Sends verification email
   - Returns session to frontend

3. **Profile Initialization**
   - Better-Auth webhook notifies FastAPI of new user
   - FastAPI creates empty profile record
   - Associates with user ID via foreign key

4. **Questionnaire Flow**
   - Frontend displays technical background questionnaire
   - Multi-step form with progress indicator
   - Validation at each step
   - Final submission to FastAPI

5. **Profile Completion**
   - FastAPI validates questionnaire data
   - Calculates overall experience level
   - Updates profile in database
   - Returns complete profile to frontend

## Flow 2: Email Verification

```mermaid
sequenceDiagram
    participant U as User
    participant E as Email Client
    participant F as Frontend
    participant B as Better-Auth
    participant D as Neon DB

    B->>E: Send verification email
    U->>E: Click verification link
    E->>F: Navigate to /verify?token=xxx
    F->>B: GET /auth/verify-email?token=xxx
    B->>D: Update user.email_verified = true
    B-->>F: Return verification status
    F->>U: Display success message
```

### Implementation Details

- Verification tokens expire after 24 hours
- Users can request new verification email
- Verification status checked on each login attempt
- Unverified accounts cannot access personalized content

## Flow 3: User Login

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Better-Auth
    participant D as Neon DB
    participant API as FastAPI

    U->>F: Navigate to /signin
    F->>U: Display login form
    U->>F: Submit credentials
    F->>B: POST /auth/signin
    B->>D: Validate credentials
    B-->>F: Return session & user
    F->>API: GET /profiles/me (with token)
    API->>D: Fetch user profile
    API-->>F: Return profile data
    F->>U: Update navbar & redirect
```

### Session Management

- Sessions stored in browser secure cookies
- 30-day expiration with sliding renewal
- Session validation occurs on sensitive operations
- Multiple sessions allowed per user

## Flow 4: Session Validation

```mermaid
sequenceDiagram
    participant F as Frontend
    participant API as FastAPI
    participant D as Neon DB
    participant B as Better-Auth

    F->>API: GET /auth/validate (with token)
    API->>D: Check session in database
    alt Valid session
        API->>D: Update last_accessed
        API-->>F: Return session info
    else Invalid/expired
        API-->>F: Return 401
        F->>B: Clear local session
    end
```

### Validation Strategy

- Client checks localStorage for session token
- Server validates token in database
- Last accessed timestamp updated on each validation
- Expired sessions automatically cleaned up

## Flow 5: Password Reset

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant API as FastAPI
    participant D as Neon DB
    participant E as Email Service

    U->>F: Navigate to /forgot-password
    F->>U: Display email form
    U->>F: Submit email
    F->>API: POST /auth/password-reset
    API->>D: Find user by email
    API->>D: Create reset token
    API->>E: Send reset email
    API-->>F: Return success
    U->>E: Click reset link
    E->>F: Navigate to /reset-password?token=xxx
    F->>U: Display password form
    U->>F: Submit new password
    F->>API: PUT /auth/password-reset
    API->>D: Validate token
    API->>D: Update password
    API-->>F: Return success
```

### Security Measures

- Reset tokens expire after 1 hour
- Rate limiting: 3 requests per hour per email
- Tokens are single-use
- Password strength validation enforced

## Flow 6: Profile Management

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant API as FastAPI
    participant D as Neon DB

    U->>F: Navigate to /profile
    F->>API: GET /profiles/me
    API->>D: Fetch user profile
    API-->>F: Return profile data
    F->>U: Display profile form
    U->>F: Update profile
    F->>API: PUT /profiles/me
    API->>D: Update profile
    API->>D: Create audit record
    API-->>F: Return updated profile
```

### Update Tracking

- All profile changes create audit records
- Original values preserved for rollback
- Change history visible to user
- Admin access to full audit trail

## Flow 7: Session Expiry

```mermaid
sequenceDiagram
    participant F as Frontend
    participant API as FastAPI
    participant D as Neon DB

    F->>API: API request with expired token
    API->>D: Check session expiry
    Note over API,D: Session expired
    API-->>F: Return 401 Unauthorized
    F->>F: Clear local auth state
    F->>F: Redirect to /signin
    F->>U: Display "Session expired" message
```

### Expiry Handling

- Sessions expire after 30 days of inactivity
- Sliding expiration on activity
- Graceful logout on expiry
- Clear messaging to user

## Error Handling

### Common Errors

| Error | Code | User Message | Action |
|-------|------|--------------|--------|
| Invalid credentials | AUTH_001 | Email or password incorrect | Try again |
| Email not verified | AUTH_002 | Please verify your email | Resend verification |
| Account locked | AUTH_003 | Account temporarily locked | Contact support |
| Rate limit exceeded | AUTH_004 | Too many attempts | Try again later |
| Invalid token | AUTH_005 | Invalid reset link | Request new reset |

### Error Response Format

```json
{
  "error": "Invalid credentials",
  "code": "AUTH_001",
  "details": {
    "field": "email",
    "retryAfter": 60
  }
}
```

## Performance Optimizations

### Database Optimizations

- Index on user email for fast lookups
- Partitioned auth_events table by date
- Connection pooling for concurrent requests
- Read replicas for profile queries

### Caching Strategy

- Redis cache for session validation
- Profile data cached with 5-minute TTL
- Static assets served from CDN
- API responses cached where appropriate

### Frontend Optimizations

- Lazy loading of auth components
- Debounced form validation
- Progressive form rendering
- Optimistic UI updates