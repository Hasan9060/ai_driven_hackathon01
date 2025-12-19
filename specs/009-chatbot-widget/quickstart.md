# Quick Start Guide: Docusaurus RAG Chatbot Widget

## Overview

This guide walks you through setting up and deploying the RAG chatbot widget for your Docusaurus site. The widget provides intelligent AI assistance powered by Cohere and Qdrant, with context-aware conversations and text selection capabilities.

## Prerequisites

### System Requirements
- Node.js 16+ and npm/yarn
- Python 3.9+
- Access to Cohere API (Command R+ and Embed v3.0)
- Qdrant Cloud account with existing collection
- Neon PostgreSQL database
- Docusaurus 2.x site

### Required Credentials
- **Cohere API Key**: For chat and embedding models
- **Qdrant URL and API Key**: For vector search
- **Neon Database URL**: For session persistence

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Docusaurus    │    │   FastAPI       │    │    Qdrant       │
│   Frontend      │◄──►│   Backend       │◄──►│   Vector DB     │
│   (React)        │    │   (Python)      │    │   (Embeddings)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       ▼
         │                ┌─────────────────┐    ┌─────────────────┐
         │                │   Neon Postgres │    │   Cohere AI     │
         │                │   (Sessions)     │    │   (Chat/Embed)  │
         └───────────────▶│                 │◄───│                 │
                          └─────────────────┘    └─────────────────┘
```

## Step 1: Backend Setup

### 1.1 Create Backend Directory Structure
```bash
mkdir chatbot-backend
cd chatbot-backend

# Create directory structure
mkdir -p src/{api,models,services,utils}
mkdir -p scripts
mkdir -p tests
```

### 1.2 Initialize Python Project
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn sqlalchemy asyncpg
pip install qdrant-client cohere python-multipart
pip install python-dotenv pydantic alembic
```

### 1.3 Environment Configuration
Create `.env` file:
```env
# Cohere Configuration
COHERE_API_KEY=your_cohere_api_key_here

# Qdrant Configuration
QDRANT_URL=https://your-qdrant-cluster.europe-west3.gcp.cloud.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key_here
QDRANT_COLLECTION_NAME=book_contents

# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Application Configuration
SECRET_KEY=your-secret-key-here
FRONTEND_URL=https://your-docusaurus-site.vercel.app
DEBUG=false
```

### 1.4 Basic FastAPI Application
Create `src/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(
    title="Chatbot API",
    description="RAG Chatbot for Docusaurus",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-docusaurus-site.vercel.app"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 1.5 Test Backend
```bash
# Start the server
python src/main.py

# Test health endpoint
curl http://localhost:8000/health
```

## Step 2: Database Models

### 2.1 SQLAlchemy Setup
Create `src/models/database.py`:
```python
from sqlalchemy import create_engine, Column, String, DateTime, Boolean, Text, JSON, Float, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import uuid

Base = declarative_base()

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, unique=True, index=True)
    user_identifier = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    metadata = Column(JSON, nullable=True)

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, index=True)
    message_type = Column(String)  # question, answer, system
    content = Column(Text)
    sources = Column(JSON, nullable=True)
    confidence_score = Column(Float, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    selected_text_context = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### 2.2 Database Initialization
Create `src/db.py`:
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models.database import Base
import os

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    Base.metadata.create_all(bind=engine)
```

## Step 3: Chat Service Implementation

### 3.1 Cohere Service
Create `src/services/cohere_service.py`:
```python
import cohere
import os
from typing import List, Dict, Any

class CohereService:
    def __init__(self):
        self.client = cohere.Client(os.getenv("COHERE_API_KEY"))

    async def generate_embeddings(self, texts: List[str], input_type: str = "search_query"):
        """Generate embeddings using Cohere Embed v3.0"""
        response = self.client.embed(
            texts=texts,
            model="embed-english-v3.0",
            input_type=input_type
        )
        return response.embeddings

    async def chat_with_documents(self, message: str, documents: List[Dict], selected_text: str = None):
        """Generate chat response with context"""
        context = ""
        if selected_text:
            context = f"Based on this specific text: {selected_text}\n\n"

        response = self.client.chat(
            message=message,
            documents=documents,
            model="command",
            temperature=0.3,
            preamble=context
        )
        return response
```

### 3.2 Qdrant Service
Create `src/services/qdrant_service.py`:
```python
from qdrant_client import QdrantClient
from qdrant_client.http.models import Filter, SearchParams
import os

class QdrantService:
    def __init__(self):
        self.client = QdrantClient(
            url=os.getenv("QDRANT_URL"),
            api_key=os.getenv("QDRANT_API_KEY")
        )
        self.collection_name = os.getenv("QDRANT_COLLECTION_NAME", "book_contents")

    async def search_documents(self, query: str, limit: int = 5):
        """Search documents using query embedding"""
        from .cohere_service import CohereService

        cohere_service = CohereService()
        query_embedding = await cohere_service.generate_embeddings([query])

        search_result = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_embedding[0],
            limit=limit,
            with_payload=True
        )

        return [
            {
                "text": hit.payload["text"],
                "source": hit.payload.get("source_url", ""),
                "title": hit.payload.get("title", ""),
                "score": hit.score
            }
            for hit in search_result
        ]
```

### 3.3 Chat API Endpoint
Create `src/api/chat.py`:
```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from ..services.cohere_service import CohereService
from ..services.qdrant_service import QdrantService
from ..db import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    session_id: str
    selected_text: Optional[str] = None
    context: Optional[dict] = None

class ChatResponse(BaseModel):
    answer: str
    sources: List[dict]
    session_id: str
    message_id: str
    response_time_ms: Optional[int] = None
    confidence_score: Optional[float] = None
    followup_suggestions: List[str] = []
    selected_text_used: bool = False

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """Main chat endpoint"""
    import time
    import uuid

    start_time = time.time()
    message_id = str(uuid.uuid4())

    try:
        cohere_service = CohereService()
        qdrant_service = QdrantService()

        if request.selected_text:
            # Use selected text as primary context
            response = await cohere_service.chat_with_documents(
                message=request.message,
                documents=[],
                selected_text=request.selected_text
            )
            sources = []
            selected_text_used = True
        else:
            # Perform RAG search
            search_results = await qdrant_service.search_documents(
                query=request.message,
                limit=5
            )

            documents = [
                {
                    "title": result["title"],
                    "snippet": result["text"]
                }
                for result in search_results
            ]

            response = await cohere_service.chat_with_documents(
                message=request.message,
                documents=documents
            )

            sources = [
                {
                    "url": result["source"],
                    "title": result["title"],
                    "snippet": result["text"],
                    "relevance_score": result["score"]
                }
                for result in search_results
            ]
            selected_text_used = False

        response_time_ms = int((time.time() - start_time) * 1000)

        return ChatResponse(
            answer=response.text,
            sources=sources,
            session_id=request.session_id,
            message_id=message_id,
            response_time_ms=response_time_ms,
            selected_text_used=selected_text_used,
            followup_suggestions=[]  # TODO: Implement follow-up generation
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## Step 4: Frontend Widget Development

### 4.1 Create Chat Widget Component
Create `src/components/ChatWidget/index.jsx`:
```jsx
import React, { useState, useEffect, useCallback } from 'react';
import useChatContext from './useChatContext';
import ChatBubble from './ChatBubble';
import ChatWindow from './ChatWindow';
import TextSelectionTooltip from './TextSelectionTooltip';
import styles from './styles.module.css';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selection, setSelection] = useState(null);
  const {
    messages,
    sendMessage,
    sessionData,
    isLoading
  } = useChatContext();

  // Handle text selection
  const handleTextSelection = useCallback((selectionData) => {
    setSelection(selectionData);
  }, []);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (selectedText && selectedText.length > 10) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        handleTextSelection({
          text: selectedText,
          position: {
            x: rect.left + rect.width / 2,
            y: rect.top - 10
          }
        });
      } else {
        setSelection(null);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => {
      document.removeEventListener('mouseup', handleSelection);
    };
  }, [handleTextSelection]);

  const handleMessage = async (message) => {
    await sendMessage({
      message,
      selected_text: selection?.text || null
    });
  };

  const handleAskAI = () => {
    if (selection) {
      setIsOpen(true);
      // Pre-fill question based on selected text
      const suggestedQuestion = `Explain: ${selection.text.substring(0, 100)}...`;
      // You can pre-fill the input field with this question
    }
  };

  return (
    <>
      <ChatBubble
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        messageCount={messages.length}
      />

      <ChatWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        onSendMessage={handleMessage}
        isLoading={isLoading}
      />

      <TextSelectionTooltip
        selection={selection}
        onAskAI={handleAskAI}
        onClear={() => setSelection(null)}
      />
    </>
  );
}
```

### 4.2 Chat Hook for State Management
Create `src/components/ChatWidget/useChatContext.js`:
```jsx
import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [sessionData, setSessionData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize session on component mount
  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      // Check for existing session in localStorage
      let sessionId = localStorage.getItem('chat_session_id');

      if (!sessionId) {
        // Create new session
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            context: {
              entry_page: window.location.href,
              referrer: document.referrer
            }
          })
        });

        const session = await response.json();
        sessionId = session.session_id;
        localStorage.setItem('chat_session_id', sessionId);
        setSessionData(session);
      } else {
        // Load existing session
        const response = await fetch(`/api/sessions/${sessionId}`);
        const session = await response.json();
        setSessionData(session);
      }

      // Load chat history
      await loadChatHistory(sessionId);

    } catch (error) {
      console.error('Failed to initialize chat session:', error);
    }
  };

  const loadChatHistory = async (sessionId) => {
    try {
      const response = await fetch(
        `/api/chat/history?session_id=${sessionId}&limit=50`
      );
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const sendMessage = useCallback(async (requestData) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...requestData,
          session_id: sessionData.session_id
        })
      });

      const data = await response.json();

      // Add both question and answer to messages
      setMessages(prev => [
        ...prev,
        {
          id: `question_${Date.now()}`,
          type: 'question',
          content: requestData.message,
          timestamp: new Date().toISOString()
        },
        {
          id: data.message_id,
          type: 'answer',
          content: data.answer,
          sources: data.sources,
          timestamp: new Date().toISOString(),
          responseTime: data.response_time_ms
        }
      ]);

    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          type: 'system',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionData]);

  return (
    <ChatContext.Provider value={{
      sessionData,
      messages,
      isLoading,
      sendMessage
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export default function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
}
```

### 4.3 Style the Widget
Create `src/components/ChatWidget/styles.module.css`:
```css
/* Chat Bubble */
.chatBubble {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: var(--ifm-z-index-fixed);
  background: var(--ifm-color-primary);
  color: var(--ifm-color-primary-contrast);
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  cursor: pointer;
  box-shadow: var(--ifm-global-shadow-lw);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chatBubble:hover {
  transform: scale(1.1);
  box-shadow: var(--ifm-global-shadow-lv);
}

.chatBubble.hasMessages {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--ifm-color-primary-rgb), 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(var(--ifm-color-primary-rgb), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--ifm-color-primary-rgb), 0);
  }
}

/* Chat Window */
.chatWindow {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 380px;
  height: 500px;
  background: var(--ifm-background-color);
  border: 1px solid var(--ifm-color-emphasis-200);
  border-radius: var(--ifm-border-radius);
  box-shadow: var(--ifm-global-shadow-lv);
  z-index: var(--ifm-z-index-fixed);
  display: flex;
  flex-direction: column;
  font-family: var(--ifm-font-family-base);
}

.chatWindow.mobile {
  width: calc(100vw - 40px);
  height: 400px;
  right: 20px;
  bottom: 80px;
}

/* Text Selection Tooltip */
.textSelectionTooltip {
  position: fixed;
  background: var(--ifm-color-primary);
  color: var(--ifm-color-primary-contrast);
  padding: var(--ifm-spacing-vertical-small) var(--ifm-spacing-horizontal);
  border-radius: var(--ifm-border-radius);
  font-size: var(--ifm-font-size-small);
  cursor: pointer;
  z-index: var(--ifm-z-index-fixed);
  box-shadow: var(--ifm-global-shadow-lw);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .chatBubble {
    width: 50px;
    height: 50px;
    bottom: 15px;
    right: 15px;
  }

  .chatWindow {
    width: calc(100vw - 30px);
    height: 60vh;
    bottom: 70px;
    right: 15px;
  }
}

/* Dark theme support */
[data-theme='dark'] .chatWindow {
  border-color: var(--ifm-color-emphasis-300);
}

/* Animation classes */
.slideIn {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.slideOut {
  animation: slideOut 0.3s ease;
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
```

## Step 5: Integration with Docusaurus

### 5.1 Update Theme Root
Create or update `src/theme/Root.js`:
```jsx
import React from 'react';
import Root from '@theme-original/Root';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { ChatProvider } from '@site/src/components/ChatWidget/useChatContext';
import ChatWidget from '@site/src/components/ChatWidget';

export default function RootWrapper(props) {
  if (!ExecutionEnvironment.canUseDOM) {
    return <Root {...props} />;
  }

  return (
    <ChatProvider>
      <Root {...props} />
      <ChatWidget />
    </ChatProvider>
  );
}
```

### 5.2 Update Docusaurus Configuration
Update `docusaurus.config.js`:
```javascript
const config = {
  // ... your existing config

  themeConfig: {
    // ... your existing theme config

    // Custom CSS for the chat widget
    customCss: [
      require.resolve('./src/components/ChatWidget/styles.module.css'),
    ],
  },

  // Enable client-side only for the chat widget
  clientModules: [
    require.resolve('./src/components/ChatWidget'),
  ],
};
```

## Step 6: Deployment

### 6.1 Backend Deployment

#### Option 1: Vercel Serverless
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from backend directory
cd chatbot-backend
vercel --prod

# Configure environment variables in Vercel dashboard
```

#### Option 2: Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
cd chatbot-backend
railway login
railway init
railway up

# Set environment variables in Railway dashboard
```

#### Option 3: Docker
Create `Dockerfile`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and deploy:
```bash
docker build -t chatbot-backend .
docker run -p 8000:8000 chatbot-backend
```

### 6.2 Frontend Deployment

Deploy your Docusaurus site as usual:
```bash
# Build and deploy
npm run build
npm run deploy

# Or use your existing deployment process
```

### 6.3 Environment Configuration

**Backend Environment Variables:**
```env
COHERE_API_KEY=your_production_api_key
QDRANT_URL=https://your-production-cluster.qdrant.io
QDRANT_API_KEY=your_production_qdrant_key
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
FRONTEND_URL=https://your-docusaurus-site.vercel.app
SECRET_KEY=your_production_secret_key
```

**Frontend Configuration:**
Update the API base URL in your chat widget to point to your deployed backend.

## Step 7: Testing

### 7.1 Manual Testing
1. **Basic Chat**: Click chat bubble, ask a question about the book
2. **Text Selection**: Highlight text, click "Ask AI", verify context usage
3. **Session Persistence**: Close browser, reopen, verify history
4. **Mobile**: Test on mobile devices for responsiveness
5. **Error Handling**: Test with network issues and AI service failures

### 7.2 Automated Tests
Create `tests/test_chat_api.py`:
```python
import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_chat_endpoint():
    response = client.post("/chat/", json={
        "message": "What is robotics?",
        "session_id": "test-session"
    })
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "session_id" in data

def test_chat_with_selected_text():
    response = client.post("/chat/", json={
        "message": "Explain this",
        "session_id": "test-session",
        "selected_text": "Robotics is an interdisciplinary field..."
    })
    assert response.status_code == 200
    data = response.json()
    assert data["selected_text_used"] == True
```

Run tests:
```bash
cd chatbot-backend
pytest tests/ -v
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure frontend URL is in CORS allow list
2. **Database Connection**: Check DATABASE_URL format and credentials
3. **API Keys**: Verify Cohere and Qdrant API keys are valid
4. **Widget Not Visible**: Check browser console for JavaScript errors
5. **Text Selection**: Ensure widget loads after Docusaurus hydration

### Debug Mode
Enable debug mode by setting environment variables:
```env
DEBUG=true
LOG_LEVEL=DEBUG
```

### Monitoring
- Check API health endpoint: `GET /health`
- Monitor response times in browser network tab
- Use browser developer tools for debugging

## Next Steps

1. **Customization**: Modify widget appearance to match your site
2. **Analytics**: Add user interaction tracking
3. **Feedback**: Implement thumbs up/down for responses
4. **Internationalization**: Add multi-language support
5. **Voice Input**: Add speech-to-text capabilities

## Support

- Check the [API documentation](./contracts/openapi.yaml)
- Review the [data model](./data-model.md)
- Consult the [research findings](./research.md)
- Open an issue for bugs or feature requests