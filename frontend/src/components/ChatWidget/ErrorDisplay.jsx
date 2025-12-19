import React from 'react';
import styles from './styles.module.css';

const ErrorDisplay = ({ error, onRetry, onClearHistory }) => {
  if (!error) return null;

  const getErrorIcon = () => {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={styles.errorIcon}>
        <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
      </svg>
    );
  };

  const getErrorSuggestion = () => {
    if (error.message?.includes('Network error')) {
      return 'Check your internet connection and try again.';
    }
    if (error.message?.includes('rate limit')) {
      return 'Please wait a moment before asking another question.';
    }
    if (error.message?.includes('not available')) {
      return 'The AI service might be experiencing issues. Try again later.';
    }
    return 'Try rephrasing your question or contact support if the problem persists.';
  };

  return (
    <div className={styles.errorDisplay}>
      <div className={styles.errorContent}>
        <div className={styles.errorHeader}>
          {getErrorIcon()}
          <span className={styles.errorTitle}>Something went wrong</span>
        </div>

        <div className={styles.errorMessage}>
          {error.message}
        </div>

        <div className={styles.errorSuggestion}>
          {getErrorSuggestion()}
        </div>

        <div className={styles.errorActions}>
          {error.canRetry && onRetry && (
            <button
              onClick={onRetry}
              className={styles.retryButton}
              title="Try sending your last message again"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
              </svg>
              Retry
            </button>
          )}

          {onClearHistory && (
            <button
              onClick={onClearHistory}
              className={styles.clearButton}
              title="Clear chat history and start fresh"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
              </svg>
              Clear Chat
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;