import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CONFIG } from './config';

const generateSessionId = () => {
  // Try to get existing session from localStorage or generate new one
  const existing = localStorage.getItem('chat_session_id');
  if (existing) return existing;

  const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('chat_session_id', newSessionId);
  return newSessionId;
};

const createMessage = (content, type, sources = null, confidence = null, responseTime = null) => {
  return {
    id: uuidv4(),
    content,
    type,
    timestamp: new Date().toISOString(),
    sources,
    confidence,
    responseTime
  };
};

export const useChatContext = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionInfo, setSessionInfo] = useState({ sessionId: generateSessionId() });
  const abortControllerRef = useRef(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(`chat_messages_${sessionInfo.sessionId}`);
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages.slice(-CONFIG.maxMessageHistory)); // Keep only recent messages
      }
    } catch (error) {
      console.warn('Failed to load saved messages:', error);
    }
  }, [sessionInfo.sessionId]);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        const messagesToSave = messages.slice(-CONFIG.maxMessageHistory);
        localStorage.setItem(
          `chat_messages_${sessionInfo.sessionId}`,
          JSON.stringify(messagesToSave)
        );
      } catch (error) {
        console.warn('Failed to save messages:', error);
      }
    }
  }, [messages, sessionInfo.sessionId]);

  const sendMessage = useCallback(async (content) => {
    if (!content.trim()) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    // Add user message
    const userMessage = createMessage(content, 'question');
    setMessages(prev => [...prev, userMessage]);
    setError(null);
    setIsLoading(true);

    try {
      // Prepare request payload
      const payload = {
        session_id: sessionInfo.sessionId,
        question: content,
        context: {
          max_sources: 5,
          include_metadata: true
        }
      };

      // Make API request
      const response = await fetch(`${CONFIG.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Add bot response
      const botMessage = createMessage(
        data.answer || 'No response received',
        'answer',
        data.sources || [],
        data.confidence_score || 0.0,
        data.response_time_ms || null
      );

      setMessages(prev => [...prev, {
        ...botMessage,
        followUpSuggestions: data.followup_suggestions || [],
        selectedTextProvided: data.selected_text_provided || false
      }]);

      // Update session info if provided
      if (data.session_id && data.session_id !== sessionInfo.sessionId) {
        setSessionInfo(prev => ({ ...prev, sessionId: data.session_id }));
        localStorage.setItem('chat_session_id', data.session_id);
      }

      return data;

    } catch (error) {
      console.error('Chat request failed:', error);

      // Don't show error for aborted requests
      if (error.name === 'AbortError') {
        return;
      }

      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError({
        message: errorMessage,
        canRetry: true,
        originalError: error
      });

    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [sessionInfo.sessionId]);

  const clearHistory = useCallback(async () => {
    try {
      setMessages([]);
      setError(null);

      // Generate new session ID
      const newSessionId = generateSessionId();
      setSessionInfo({ sessionId: newSessionId });

      // Clear localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('chat_messages_')) {
          localStorage.removeItem(key);
        }
      });

    } catch (error) {
      console.error('Failed to clear history:', error);
      setError({
        message: 'Failed to clear chat history',
        canRetry: false,
        originalError: error
      });
    }
  }, []);

  const retryLastMessage = useCallback(async () => {
    if (messages.length === 0) return;

    // Find the last user message
    const lastUserMessage = [...messages].reverse().find(msg => msg.type === 'question');
    if (lastUserMessage) {
      // Remove the last bot response if it exists (and possibly error)
      setMessages(prev => {
        const newMessages = [...prev];
        // Remove last message if it's an error or bot response
        if (newMessages.length > 0 &&
            (newMessages[newMessages.length - 1].type === 'answer' || error)) {
          newMessages.pop();
        }
        return newMessages;
      });

      setError(null);
      // Resend the last user message
      await sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage, error]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    messages,
    isLoading,
    error,
    sessionInfo,
    sendMessage,
    clearHistory,
    retryLastMessage
  };
};