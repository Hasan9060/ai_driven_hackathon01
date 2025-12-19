import React from 'react';
import { CONFIG } from './config';
import styles from './styles.module.css';

const Message = ({ type, content, timestamp, isBot, confidence, sources, responseTime }) => {
  const formatTime = (timestamp) => {
    if (!timestamp || !CONFIG.showTimestamps) return null;

    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return null;
    }
  };

  const renderContent = () => {
    if (typeof content === 'string') {
      return content.split('\n').map((paragraph, index) => (
        <p key={index} className={styles.messageParagraph}>
          {paragraph}
        </p>
      ));
    }
    return <div>{content}</div>;
  };

  return (
    <div
      className={`${styles.message} ${
        isBot ? styles.botMessage : styles.userMessage
      }`}
    >
      <div className={styles.messageHeader}>
        <span className={styles.messageType}>
          {isBot ? '🤖 AI Assistant' : '👤 You'}
        </span>

        <div className={styles.messageMeta}>
          {formatTime(timestamp) && (
            <span className={styles.messageTime}>
              {formatTime(timestamp)}
            </span>
          )}

          {isBot && confidence !== undefined && CONFIG.showConfidence && (
            <span
              className={`${styles.confidence} ${
                confidence >= 0.8 ? styles.highConfidence :
                confidence >= 0.6 ? styles.mediumConfidence :
                styles.lowConfidence
              }`}
            >
              {Math.round(confidence * 100)}% confident
            </span>
          )}

          {isBot && responseTime && (
            <span className={styles.responseTime}>
              {responseTime}ms
            </span>
          )}
        </div>
      </div>

      <div className={styles.messageContent}>
        {renderContent()}
      </div>

      {/* Sources indicator */}
      {isBot && sources && sources.length > 0 && (
        <div className={styles.sourcesIndicator}>
          📚 {sources.length} source{sources.length !== 1 ? 's' : ''} cited
        </div>
      )}
    </div>
  );
};

export default Message;