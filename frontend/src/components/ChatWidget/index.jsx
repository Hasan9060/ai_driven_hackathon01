import React, { useState, useEffect } from 'react';
import { useChatContext } from './useChatContext';
import ChatWindow from './ChatWindow';
import ChatBubble from './ChatBubble';
import MessageInput from './MessageInput';
import { CONFIG } from './config';
import styles from './styles.module.css';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(CONFIG.initialOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const {
    messages,
    isLoading,
    error,
    sessionInfo,
    sendMessage,
    clearHistory,
    retryLastMessage
  } = useChatContext();

  useEffect(() => {
    if (!CONFIG.enabled) return;
  }, []);

  const toggleWidget = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleSendMessage = async (message) => {
    await sendMessage(message);
  };

  const handleClearHistory = async () => {
    await clearHistory();
  };

  const handleRetry = async () => {
    await retryLastMessage();
  };

  if (!CONFIG.enabled) {
    return null;
  }

  return (
    <div
      className={`${styles.chatWidget} ${styles[CONFIG.position]} ${
        isOpen ? styles.open : styles.closed
      }`}
    >
      {isOpen && !isMinimized ? (
        <div className={styles.chatContainer}>
          <div className={styles.chatHeader}>
            <div className={styles.headerInfo}>
              <h3>AI Assistant</h3>
              {sessionInfo && (
                <span className={styles.sessionInfo}>
                  Session: {sessionInfo.sessionId?.slice(-8) || 'Active'}
                </span>
              )}
            </div>
            <div className={styles.headerActions}>
              <button
                onClick={handleMinimize}
                className={styles.headerButton}
                aria-label="Minimize"
                title="Minimize"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13H5v-2h14v2z" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className={styles.headerButton}
                aria-label="Close"
                title="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
          </div>

          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            error={error}
            onRetry={handleRetry}
            onClearHistory={handleClearHistory}
          />

          <MessageInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholder={CONFIG.greeting}
          />
        </div>
      ) : (
        <ChatBubble
          onClick={toggleWidget}
          theme={CONFIG.theme}
          isMinimized={isMinimized}
        />
      )}
    </div>
  );
};

export default ChatWidget;