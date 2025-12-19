import React, { useState } from 'react';
import styles from './styles.module.css';

const SourceCitation = ({ sources }) => {
  const [expandedSource, setExpandedSource] = useState(null);

  if (!sources || sources.length === 0) return null;

  const toggleSource = (index) => {
    setExpandedSource(expandedSource === index ? null : index);
  };

  return (
    <div className={styles.sourceCitations}>
      <div className={styles.sourcesHeader}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
        </svg>
        <span>Sources</span>
      </div>

      <div className={styles.sourcesList}>
        {sources.map((source, index) => (
          <div key={index} className={styles.sourceItem}>
            <button
              onClick={() => toggleSource(index)}
              className={styles.sourceToggle}
              aria-expanded={expandedSource === index}
              aria-controls={`source-content-${index}`}
            >
              <div className={styles.sourceInfo}>
                <span className={styles.sourceTitle}>
                  {source.title || `Source ${index + 1}`}
                </span>
                {source.chapter && (
                  <span className={styles.sourceChapter}>
                    Chapter {source.chapter}
                    {source.section && `: ${source.section}`}
                  </span>
                )}
                {source.relevance_score && (
                  <span className={styles.relevanceScore}>
                    {Math.round(source.relevance_score * 100)}% match
                  </span>
                )}
              </div>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
                className={`${styles.expandIcon} ${
                  expandedSource === index ? styles.expanded : ''
                }`}
              >
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>

            {expandedSource === index && (
              <div
                id={`source-content-${index}`}
                className={styles.sourceContent}
              >
                {source.snippet && (
                  <p className={styles.sourceSnippet}>
                    {source.snippet}
                  </p>
                )}
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sourceUrl}
                  >
                    View source
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SourceCitation;