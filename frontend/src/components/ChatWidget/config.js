/**
 * ChatWidget Configuration
 *
 * This file contains the configuration settings for the ChatWidget.
 * Modify these values to customize the widget behavior.
 */

// API Configuration
export const API_CONFIG = {
  // Backend API URL - change this to match your backend server
  baseUrl: 'http://localhost:8000',

  // Request timeout in milliseconds
  timeout: 30000,

  // Retry attempts for failed requests
  retryAttempts: 3,
};

// Widget Configuration
export const WIDGET_CONFIG = {
  // Widget position: 'bottom-right', 'bottom-left'
  position: 'bottom-right',

  // Widget theme: 'auto', 'light', 'dark'
  theme: 'auto',

  // Whether the widget should be enabled
  enabled: true,

  // Initial open state
  initialOpen: false,

  // Default greeting message
  greeting: 'Hello! I\'m your AI assistant for the Humanoid Robotics textbook. How can I help you today?',

  // Message limits
  maxMessageLength: 1000,
  maxMessageHistory: 100,
};

// Chat Behavior Configuration
export const CHAT_CONFIG = {
  // Auto-scroll to latest message
  autoScroll: true,

  // Show typing indicator
  showTypingIndicator: true,

  // Enable message timestamps
  showTimestamps: true,

  // Enable source citations in bot responses
  showSources: true,

  // Enable confidence scores
  showConfidence: true,
};

// Mobile Configuration
export const MOBILE_CONFIG = {
  // Breakpoint for mobile layout (in pixels)
  breakpoint: 768,

  // Touch gesture sensitivity
  gestureSensitivity: 50,

  // Enable haptic feedback on mobile (if supported)
  enableHaptics: true,
};

// Export all configurations as a single object for easy import
export const CONFIG = {
  ...API_CONFIG,
  ...WIDGET_CONFIG,
  ...CHAT_CONFIG,
  ...MOBILE_CONFIG,
};

// Export default configuration
export default CONFIG;