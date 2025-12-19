# Quickstart Guide: RAG Chatbot Implementation

**Feature**: 008-rag-chatbot
**Updated**: 2025-12-17

## Overview

This guide helps you quickly set up and deploy the RAG Chatbot for the Humanoid Robotics Textbook. The chatbot provides contextual Q&A with source citations from the book content.

## Prerequisites

1. **Python 3.11+** installed
2. **Node.js 18+** (for frontend integration)
3. **Access to external services**:
   - Cohere API key
   - Qdrant Cloud cluster
   - Neon Postgres database
4. **Git** for version control

## 1. Environment Setup

### 1.1 Clone Repository
```bash
git clone <repository-url>
cd humanoid-robotics-textbook
```

### 1.2 Create Backend Directory
```bash
mkdir backend
cd backend
```

### 1.3 Setup Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 1.4 Install Dependencies
```bash
pip install fastapi uvicorn qdrant-client cohere beautifulsoup4 psycopg2-binary pydantic python-jose[cryptography] python-multipart aiofiles tenacity
```

### 1.5 Environment Configuration
Create `.env` file:
```env
# Cohere Configuration
COHERE_API_KEY=rY4LtjIY6zmujw5f0vxbZPVjGqwtooisC46kZX2q

# Qdrant Configuration
QDRANT_URL=https://83df9988-77a7-402c-8f21-ab300106a6e2.europe-west3-0.gcp.cloud.qdrant.io
QDRANT_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.Kdu5SIrH4IwC0uzb0rdIvNzFRNRGUA8gFZNFVq2LSLw
QDRANT_COLLECTION_NAME=book_content

# Database Configuration
DATABASE_URL=postgresql://neondb_owner:npg_nrkwIPFDs2f3@ep-tiny-block-ahz0l0eb-pooler.c-3.us-east-1.aws.neon.tech/neondb

# Application Configuration
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200  # 30 days

# Frontend Configuration
FRONTEND_URL=https://hackathon-physical-ai-humanoid-robo-five.vercel.app
DOCS_BASE_URL=https://hackathon-physical-ai-humanoid-robo-five.vercel.app

# Performance Settings
MAX_CONTENT_CHUNKS=5
EMBEDDING_BATCH_SIZE=50
REQUEST_TIMEOUT=30
```

## 2. Database Setup

### 2.1 Create Tables
```bash
python -c "
import asyncio
import asyncpg
import os

async def create_tables():
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))

    # Create sessions table
    await conn.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id VARCHAR(255) UNIQUE NOT NULL,
            user_identifier VARCHAR(255),
            created_at TIMESTAMP DEFAULT NOW(),
            last_activity TIMESTAMP DEFAULT NOW(),
            session_context JSONB,
            language_preference VARCHAR(10) DEFAULT 'en',
            technical_level_assumed VARCHAR(20),
            privacy_consent BOOLEAN DEFAULT false,
            session_metadata JSONB
        )
    ''')

    # Create chat_history table
    await conn.execute('''
        CREATE TABLE IF NOT EXISTS chat_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id VARCHAR(255) REFERENCES sessions(session_id),
            message_type VARCHAR(20) NOT NULL,
            content TEXT NOT NULL,
            sources_used JSONB,
            confidence_score FLOAT,
            response_time_ms INTEGER,
            selected_text_context TEXT,
            feedback_rating INTEGER,
            feedback_comment TEXT,
            timestamp TIMESTAMP DEFAULT NOW()
        )
    ''')

    # Create indexes
    await conn.execute('CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id)')
    await conn.execute('CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON chat_history(session_id)')
    await conn.execute('CREATE INDEX IF NOT EXISTS idx_chat_history_timestamp ON chat_history(timestamp)')

    print('Tables created successfully!')
    await conn.close()

asyncio.run(create_tables())
"
```

## 3. Content Ingestion

### 3.1 Create Ingestion Script
Create `scripts/ingest.py`:
```python
import asyncio
import json
import uuid
from datetime import datetime
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import cohere
import requests
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin, urlparse

# Initialize clients
qdrant = QdrantClient(
    url=os.getenv('QDRANT_URL'),
    api_key=os.getenv('QDRANT_API_KEY')
)
co = cohere.Client(os.getenv('COHERE_API_KEY'))

class DocusaurusIngester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
        self.processed_chunks = []

    async def extract_content(self):
        """Extract content from Docusaurus site"""
        # Get sitemap
        sitemap_url = urljoin(self.base_url, '/sitemap.xml')
        response = self.session.get(sitemap_url)
        soup = BeautifulSoup(response.content, 'xml')

        # Extract URLs
        urls = []
        for loc in soup.find_all('loc'):
            urls.append(loc.text)

        # Process each page
        for url in urls:
            await self.process_page(url)

    async def process_page(self, url):
        """Process individual page"""
        try:
            response = self.session.get(url)
            soup = BeautifulSoup(response.content, 'html.parser')

            # Extract title
            title = soup.find('title')
            title = title.text.strip() if title else ''

            # Extract main content
            content_div = soup.find('article', class_='markdown')
            if not content_div:
                return

            # Extract structured content
            sections = []
            current_section = None

            for element in content_div.find_all(['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'blockquote', 'pre']):
                if element.name.startswith('h'):
                    if current_section:
                        sections.append(current_section)
                    current_section = {
                        'level': int(element.name[1]),
                        'title': element.get_text().strip(),
                        'content': []
                    }
                elif current_section:
                    current_section['content'].append({
                        'type': element.name,
                        'text': element.get_text().strip(),
                        'html': str(element)
                    })

            if current_section:
                sections.append(current_section)

            # Create chunks
            chunks = self.create_chunks(url, title, sections)
            self.processed_chunks.extend(chunks)

        except Exception as e:
            print(f"Error processing {url}: {e}")

    def create_chunks(self, url, title, sections):
        """Create chunks from sections"""
        chunks = []

        for section in sections:
            # Combine content
            content_text = '\n'.join([
                item['text'] for item in section['content']
                if item['text'].strip()
            ])

            # Skip empty sections
            if not content_text or len(content_text) < 50:
                continue

            # Split into smaller chunks if needed
            words = content_text.split()
            chunk_size = 200  # tokens

            for i in range(0, len(words), chunk_size):
                chunk_text = ' '.join(words[i:i + chunk_size])

                chunk = {
                    'chunk_id': str(uuid.uuid4()),
                    'url': url,
                    'title': title,
                    'section_title': section['title'],
                    'section_level': section['level'],
                    'content': chunk_text,
                    'chapter': self.extract_chapter(url),
                    'content_type': self.detect_content_type(chunk_text)
                }
                chunks.append(chunk)

        return chunks

    def extract_chapter(self, url):
        """Extract chapter number from URL"""
        match = re.search(r'/chapter(\d+)', url)
        return int(match.group(1)) if match else None

    def detect_content_type(self, text):
        """Detect type of content"""
        if '```' in text or 'def ' in text or 'class ' in text:
            return 'CODE'
        if any(c in text for c in '∑∫√∂'):
            return 'MATHEMATICAL'
        return 'TEXT'

async def main():
    # Initialize ingester
    ingester = DocusaurusIngester('https://hackathon-physical-ai-humanoid-robo-five.vercel.app')

    # Extract content
    print("Extracting content from Docusaurus site...")
    await ingester.extract_content()
    print(f"Extracted {len(ingester.processed_chunks)} chunks")

    # Create embeddings in batches
    batch_size = 50
    points = []

    for i in range(0, len(ingester.processed_chunks), batch_size):
        batch = ingester.processed_chunks[i:i + batch_size]

        # Generate embeddings
        texts = [chunk['content'] for chunk in batch]
        response = co.embed(
            texts=texts,
            model='embed-english-v3.0',
            input_type='search_document'
        )

        # Create points for Qdrant
        for j, (chunk, embedding) in enumerate(zip(batch, response.embeddings)):
            point = PointStruct(
                id=chunk['chunk_id'],
                vector=embedding,
                payload={
                    'url': chunk['url'],
                    'title': chunk['title'],
                    'section_title': chunk['section_title'],
                    'section_level': chunk['section_level'],
                    'content': chunk['content'],
                    'chapter': chunk['chapter'],
                    'content_type': chunk['content_type'],
                    'token_count': len(chunk['content'].split())
                }
            )
            points.append(point)

        print(f"Processed batch {i//batch_size + 1}/{(len(ingester.processed_chunks)-1)//batch_size + 1}")

    # Create collection in Qdrant
    collection_name = os.getenv('QDRANT_COLLECTION_NAME', 'book_content')

    # Check if collection exists
    collections = qdrant.get_collections().collections
    if not any(c.name == collection_name for c in collections):
        qdrant.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=1024, distance=Distance.COSINE)
        )
        print(f"Created collection '{collection_name}'")

    # Insert points
    print(f"Inserting {len(points)} points into Qdrant...")
    qdrant.upsert(
        collection_name=collection_name,
        points=points
    )
    print("Content ingestion complete!")

if __name__ == "__main__":
    asyncio.run(main())
```

### 3.2 Run Ingestion
```bash
python scripts/ingest.py
```

## 4. API Server Setup

### 4.1 Create Main Application
Create `main.py`:
```python
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uvicorn
import os
from datetime import datetime, timedelta

app = FastAPI(
    title="RAG Chatbot API",
    description="Contextual Q&A for Humanoid Robotics Textbook",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv('FRONTEND_URL', 'http://localhost:3000')],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Import routers
from api.endpoints import chat, history, sessions
from api.dependencies import get_db

# Include routers
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(history.router, prefix="/chat", tags=["Chat"])
app.include_router(sessions.router, prefix="/sessions", tags=["Sessions"])

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": {"status": "healthy"},  # Add actual health check
            "vector_db": {"status": "healthy"},  # Add actual health check
            "llm_service": {"status": "healthy"}  # Add actual health check
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
```

### 4.2 Start API Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## 5. Frontend Integration

### 5.1 Option 1: React Component
Create a React component in your frontend:
```jsx
// components/RAGChatbot.jsx
import React, { useState, useEffect } from 'react';

const RAGChatbot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Initialize session
        initializeSession();
    }, []);

    const initializeSession = async () => {
        const response = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        setSessionId(data.session_id);
    };

    const sendMessage = async () => {
        if (!input.trim() || !sessionId) return;

        setIsLoading(true);
        const userMessage = { type: 'question', content: input };
        setMessages([...messages, userMessage]);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: input,
                    session_id: sessionId
                })
            });

            const data = await response.json();
            const botMessage = {
                type: 'answer',
                content: data.answer,
                sources: data.sources
            };

            setMessages(prev => [...prev, userMessage, botMessage]);
            setInput('');
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chatbot-container">
            <div className="messages">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.type}`}>
                        <p>{msg.content}</p>
                        {msg.sources && (
                            <div className="sources">
                                <h4>Sources:</h4>
                                {msg.sources.map((src, i) => (
                                    <div key={i} className="source">
                                        <a href={src.url} target="_blank" rel="noopener">
                                            Chapter {src.chapter}: {src.section}
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="input-area">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask about the book..."
                    disabled={isLoading}
                />
                <button onClick={sendMessage} disabled={isLoading}>
                    {isLoading ? '...' : 'Send'}
                </button>
            </div>
        </div>
    );
};

export default RAGChatbot;
```

### 5.2 Option 2: Iframe Embed
```html
<iframe
    src="https://your-chatbot-url.com/chat-widget"
    width="100%"
    height="600px"
    frameborder="0"
></iframe>
```

## 6. Testing the Implementation

### 6.1 Test API Endpoints
```bash
# Health check
curl http://localhost:8000/health

# Create session
curl -X POST http://localhost:8000/sessions \
  -H "Content-Type: application/json" \
  -d '{"language_preference": "en"}'

# Send chat query
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is bipedal locomotion?",
    "session_id": "your-session-id"
  }'
```

### 6.2 Test Selected Text
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Can you explain this equation?",
    "selected_text": "F = ma",
    "selected_text_source": {
      "url": "https://example.com/chapter2",
      "chapter": 2,
      "section": "Newton's Laws"
    },
    "session_id": "your-session-id"
  }'
```

## 7. Deployment

### 7.1 Docker Deployment
Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t rag-chatbot .
docker run -p 8000:8000 --env-file .env rag-chatbot
```

### 7.2 Vercel Deployment
1. Install Vercel CLI
2. Run `vercel` in backend directory
3. Configure environment variables in Vercel dashboard

## 8. Monitoring and Maintenance

### 8.1 Key Metrics to Monitor
- Response time (target: <1.5s)
- Error rate
- User satisfaction ratings
- Query relevance scores
- Session duration

### 8.2 Regular Maintenance Tasks
- Update embeddings when book content changes
- Monitor API rate limits
- Review user feedback
- Update models as needed

## 9. Troubleshooting

### Common Issues
1. **Slow responses**: Check embedding cache, vector DB performance
2. **Irrelevant answers**: Verify content ingestion, adjust similarity thresholds
3. **Session errors**: Check JWT configuration
4. **Rate limiting**: Implement request queuing

### Debug Mode
Set environment variable:
```env
DEBUG=true
```

This enables detailed logging and error messages.

## 10. Next Steps

1. Implement user authentication (optional)
2. Add analytics and reporting
3. Create admin dashboard
4. Implement A/B testing for prompts
5. Add multilingual support

## Support

For issues and questions:
- Check the documentation at `/docs`
- Review API specification at `/contracts/api.yaml`
- Open an issue in the project repository