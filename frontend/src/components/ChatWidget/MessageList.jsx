import React from 'react';
import Message from './Message';
import SourceCitation from './SourceCitation';
import FollowUpSuggestions from './FollowUpSuggestions';
import { CONFIG } from './config';
import styles from './styles.module.css';

const MessageList = ({ messages }) => {
  if (!messages || messages.length === 0) {
    return (
      <div className={styles.welcomeMessage}>
        <h4>Welcome to the Humanoid Robotics AI Assistant! 🤖</h4>
        <p>I can help you with questions about the textbook content. Try asking about:</p>
        <ul>
          <li>Module topics and concepts</li>
          <li>Robot kinematics and dynamics</li>
          <li>Control systems and programming</li>
          <li>Simulation and hardware setup</li>
        </ul>
      </div>
    );
  }

  return (
    <div className={styles.messageList}>
      {messages.map((message, index) => (
        <div key={message.id || index} className={styles.messageContainer}>
          <Message
            type={message.type}
            content={message.content}
            timestamp={message.timestamp}
            isBot={message.type === 'answer'}
            confidence={message.confidence}
            sources={message.sources}
            responseTime={message.responseTime}
          />

          {/* Show sources for bot answers */}
          {message.type === 'answer' && message.sources && message.sources.length > 0 && (
            <div className={styles.messageFooter}>
              <SourceCitation sources={message.sources} />

              {/* Show follow-up suggestions */}
              {message.followUpSuggestions && message.followUpSuggestions.length > 0 && (
                <FollowUpSuggestions suggestions={message.followUpSuggestions} />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MessageList;