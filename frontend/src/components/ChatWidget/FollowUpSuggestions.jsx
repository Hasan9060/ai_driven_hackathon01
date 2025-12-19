import React from 'react';
import styles from './styles.module.css';

const FollowUpSuggestions = ({ suggestions }) => {
  if (!suggestions || suggestions.length === 0) return null;

  const handleSuggestionClick = (suggestion, event) => {
    // Create a custom event to handle suggestion clicks
    const suggestionEvent = new CustomEvent('chatSuggestion', {
      detail: { text: suggestion },
      bubbles: true
    });
    event.target.dispatchEvent(suggestionEvent);
  };

  return (
    <div className={styles.followUpSuggestions}>
      <div className={styles.suggestionsHeader}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.5,12.5L11,15L15.5,9.5M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
        </svg>
        <span>Suggested Questions</span>
      </div>

      <div className={styles.suggestionsList}>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={(e) => handleSuggestionClick(suggestion, e)}
            className={styles.suggestionButton}
            title={`Ask: ${suggestion}`}
          >
            <span className={styles.suggestionText}>
              {suggestion}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className={styles.suggestionArrow}>
              <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FollowUpSuggestions;