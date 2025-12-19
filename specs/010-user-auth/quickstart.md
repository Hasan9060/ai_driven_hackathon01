# Quick Start Guide: Personalized Auth System

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+ and pip
- Neon PostgreSQL account
- Railway or Render account (for backend deployment)

## Environment Setup

### 1. Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd humanoid-robotics-textbook

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt
```

### 2. Environment Configuration

Create `.env.local` in frontend:

```env
# Better-Auth Configuration
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
NEON_DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# FastAPI Backend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Create `.env` in backend:

```env
# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Security
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email (for password resets)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 3. Database Setup

```sql
-- Run in Neon console or connect via psql
-- Better-Auth tables will be created automatically

-- Custom profile table
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY,
  software_years INTEGER CHECK (software_years >= 0),
  software_languages TEXT[] DEFAULT '{}',
  software_frameworks TEXT[] DEFAULT '{}',
  hardware_robotics BOOLEAN DEFAULT FALSE,
  hardware_embedded BOOLEAN DEFAULT FALSE,
  hardware_iot BOOLEAN DEFAULT FALSE,
  experience_level VARCHAR(20) CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  interests TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Auth events table
CREATE TABLE IF NOT EXISTS auth_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_experience ON profiles(experience_level);
CREATE INDEX IF NOT EXISTS idx_auth_events_timestamp ON auth_events(timestamp);
```

## Running Locally

### 1. Start Backend

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at http://localhost:8000

### 2. Start Frontend

```bash
cd frontend
npm start
```

The site will be available at http://localhost:3000

## Testing the Flows

### 1. Create an Account

1. Navigate to http://localhost:3000/signup
2. Enter email and password
3. Check email for verification link
4. Complete the technical questionnaire
5. Verify profile creation in database

### 2. Test Login

1. Navigate to http://localhost:3000/signin
2. Enter credentials
3. Verify navbar shows logged-in state
4. Check session persistence across refresh

### 3. Test API Integration

```bash
# Test session validation
curl -H "Authorization: Bearer <session-token>" \
     http://localhost:8000/v1/auth/validate

# Test profile retrieval
curl -H "Authorization: Bearer <session-token>" \
     http://localhost:8000/v1/profiles/me
```

## Development Commands

### Frontend

```bash
# Install new dependency
npm install better-auth

# Run tests
npm test

# Build for production
npm run build

# Lint code
npm run lint
```

### Backend

```bash
# Install new dependency
pip install fastapi-users

# Run tests
pytest

# Run with debug
uvicorn main:app --reload --log-level debug

# Check types
mypy .
```

## Common Tasks

### Adding New Questionnaire Fields

1. Update `contracts/openapi.yaml` schema
2. Modify database schema in `data-model.md`
3. Update frontend form components
4. Add validation in backend Pydantic models
5. Write tests for new fields

### Customizing Email Templates

```typescript
// frontend/src/lib/auth.ts
export const authConfig = {
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
  },
  emailVerification: {
    sendOnSignUp: true,
    expiresIn: 24 * 60 * 60, // 24 hours
    sendVerificationEmail: async (user, url) => {
      // Custom email sending logic
    },
  },
}
```

### Adding Social Providers

```typescript
// Add to authConfig
socialProviders: {
  github: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  },
}
```

## Debugging Tips

### Check Session Status

```javascript
// In browser console
console.log(JSON.parse(localStorage.getItem('better-auth.session')))
```

### View Database State

```sql
-- Check user accounts
SELECT id, email, email_verified, created_at FROM users;

-- Check profiles
SELECT * FROM profiles JOIN users ON profiles.user_id = users.id;

-- Check active sessions
SELECT * FROM sessions WHERE expires_at > NOW();
```

### Common Issues

1. **CORS Errors**: Ensure backend CORS includes frontend URL
2. **Database Connection**: Verify DATABASE_URL has SSL mode required
3. **Session Not Persisting**: Check domain and secure flags on cookies
4. **Email Not Sending**: Verify SMTP credentials and app passwords

## Production Deployment

### Backend (Railway)

```yaml
# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### Frontend (GitHub Pages)

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: npm

      - run: npm ci
      - run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./build
```

### Environment Variables

Set these in your deployment platform:

- `BETTER_AUTH_SECRET`
- `NEON_DATABASE_URL`
- `NEXT_PUBLIC_API_URL` (production URL)
- SMTP credentials for email

## Monitoring and Logging

### Backend Logging

```python
# backend/src/logging.py
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("app.log"),
    ],
)

logger = logging.getLogger(__name__)
```

### Frontend Analytics

```javascript
// src/analytics.js
export const trackAuthEvent = (event, properties) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', event, properties)
  }
}

// Usage
trackAuthEvent('login', {
  method: 'email',
  timestamp: new Date().toISOString()
})
```

## Security Checklist

- [ ] Change default secrets
- [ ] Enable HTTPS in production
- [ ] Set secure cookie flags
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Regular security updates
- [ ] Monitor for suspicious activity
- [ ] Backup database regularly