import React from 'react';
import Layout from '@theme/Layout';
import ChatWidget from '@site/src/components/ChatWidget';
import { CONFIG } from '@site/src/components/ChatWidget/config';

export default function TestChatWidget() {
  return (
    <Layout
      title="ChatWidget Test Page"
      description="Test page for the ChatWidget component"
    >
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>ChatWidget Test Page</h1>

        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h2>✅ ChatWidget Status</h2>
          <p><strong>Component Location:</strong> <code>src/components/ChatWidget/</code></p>
          <p><strong>Theme Integration:</strong> <code>src/theme/Root.js</code></p>
          <p><strong>Environment Variables:</strong> <code>.env</code></p>
          <p><strong>Enabled Status:</strong> {CONFIG.enabled ? '✅ ENABLED' : '❌ DISABLED'}</p>
          <p><strong>API URL:</strong> <code>{CONFIG.baseUrl}</code></p>
          <p><strong>Position:</strong> <code>{CONFIG.position}</code></p>
          <p><strong>Theme:</strong> <code>{CONFIG.theme}</code></p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h2>🔍 How to Test</h2>
          <ol>
            <li>Look for the chat bubble in the <strong>{CONFIG.position}</strong> corner of the screen</li>
            <li>Click the chat bubble to open the chat window</li>
            <li>Try typing a message like "What is humanoid robotics?"</li>
            <li>The backend server should be running on <code>{CONFIG.baseUrl}</code> for full functionality</li>
          </ol>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h2>📋 Testing Checklist</h2>
          <ul>
            <li>✅ Chat bubble is visible in the corner</li>
            <li>✅ Chat window opens when bubble is clicked</li>
            <li>✅ Messages can be typed and sent</li>
            <li>✅ Chat window can be closed</li>
            <li>✅ Responsive design works on mobile</li>
            <li>✅ Theme switching works (light/dark mode)</li>
          </ul>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h2>🛠️ Backend Setup</h2>
          <p>To test full functionality, start the backend server:</p>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
{`cd backend
python -m pip install -r requirements.txt
python main.py`}
          </pre>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h2>⚙️ Current Configuration</h2>
          <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '8px', fontFamily: 'monospace' }}>
            <pre>{JSON.stringify(CONFIG, null, 2)}</pre>
          </div>
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            <strong>To modify:</strong> Edit <code>src/components/ChatWidget/config.js</code>
          </p>
        </div>

        <div>
          <h2>🎨 Component Structure</h2>
          <ul>
            <li><strong>ChatWidget/index.jsx</strong> - Main component with configuration</li>
            <li><strong>ChatBubble.jsx</strong> - Floating chat button</li>
            <li><strong>ChatWindow.jsx</strong> - Chat interface with header and messages</li>
            <li><strong>MessageList.jsx</strong> - Message display with sources</li>
            <li><strong>MessageInput.jsx</strong> - Input field with send button</li>
            <li><strong>useChatContext.js</strong> - State management and API calls</li>
            <li><strong>config.js</strong> - Configuration settings</li>
            <li><strong>styles.module.css</strong> - Responsive styling</li>
          </ul>
        </div>
      </div>

      {/* ChatWidget is already integrated globally via Root.js, but we're also showing it here for testing */}
      <ChatWidget />
    </Layout>
  );
}