import React, { useState, useRef, useEffect } from 'react';
import { CONFIG } from './config';
import styles from './styles.module.css';

const MessageInput = ({ onSendMessage, isLoading, placeholder }) => {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim() || isLoading || isComposing) return;

    const trimmedMessage = message.trim();
    if (trimmedMessage.length > CONFIG.maxMessageLength) {
      alert(`Message is too long. Please keep it under ${CONFIG.maxMessageLength} characters.`);
      return;
    }

    try {
      await onSendMessage(trimmedMessage);
      setMessage('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getCharacterCount = () => {
    return `${message.length}/${CONFIG.maxMessageLength}`;
  };

  const isNearLimit = message.length > CONFIG.maxMessageLength * 0.9;

  return (
    <form onSubmit={handleSubmit} className={styles.messageInput}>
      <div className={styles.inputContainer}>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder={placeholder || "Ask me anything about the Humanoid Robotics textbook..."}
          className={styles.textarea}
          disabled={isLoading}
          rows={1}
          style={{ resize: 'none' }}
        />

        <button
          type="submit"
          disabled={!message.trim() || isLoading || isComposing}
          className={`${styles.sendButton} ${
            !message.trim() || isLoading ? styles.disabled : ''
          }`}
          title="Send message (Enter)"
        >
          {isLoading ? (
            <div className={styles.loadingSpinner}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
              </svg>
            </div>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
            </svg>
          )}
        </button>
      </div>

      <div className={styles.inputFooter}>
        <div className={`${styles.characterCount} ${isNearLimit ? styles.warning : ''}`}>
          {getCharacterCount()}
        </div>
        <div className={styles.inputHints}>
          Press <kbd>Enter</kbd> to send, <kbd>Shift+Enter</kbd> for new line
        </div>
      </div>
    </form>
  );
};

export default MessageInput;