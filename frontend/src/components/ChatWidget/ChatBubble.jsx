import React from 'react';
import styles from './styles.module.css';

const ChatBubble = ({ onClick, theme, isMinimized }) => {
  const getBubbleClass = () => {
    if (isMinimized) {
      return `${styles.chatBubble} ${styles.minimized}`;
    }
    return `${styles.chatBubble} ${styles.pulse}`;
  };

  return (
    <button
      onClick={onClick}
      className={getBubbleClass()}
      aria-label="Open chat"
      title={isMinimized ? "Expand chat" : "Open AI Assistant"}
    >
      {isMinimized ? (
        // Minimized state - just show a small icon
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={styles.chatIcon}>
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      ) : (
        // Full bubble state
        <>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={styles.chatIcon}>
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
          <span className={styles.chatBubbleText}>AI Assistant</span>
        </>
      )}
    </button>
  );
};

export default ChatBubble;