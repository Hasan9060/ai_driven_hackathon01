import React, { useEffect, useRef } from 'react';
import MessageList from './MessageList';
import ErrorDisplay from './ErrorDisplay';
import { CONFIG } from './config';
import styles from './styles.module.css';

const ChatWindow = ({ messages, isLoading, error, onRetry, onClearHistory }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (CONFIG.autoScroll) {
      scrollToBottom();
    }
  }, [messages]);

  return (
    <div className={styles.chatWindow}>
      <div className={styles.chatMessages}>
        <MessageList messages={messages} />

        {isLoading && (
          <div className={styles.typingIndicator}>
            <div className={styles.typingDots}>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className={styles.typingText}>AI is thinking...</span>
          </div>
        )}

        {error && (
          <ErrorDisplay
            error={error}
            onRetry={onRetry}
            onClearHistory={onClearHistory}
          />
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;