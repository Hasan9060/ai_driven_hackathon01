/**
 * Client module to dynamically replace navbar items with auth buttons
 */
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { useAuth } from './context/AuthContext';

export default function ClientModule() {
  if (!ExecutionEnvironment.canUseDOM) {
    return null;
  }

  // Function to add auth buttons to navbar
  const addAuthButtons = () => {
    const navbar = document.querySelector('.navbar__items--right');
    if (!navbar) return;

    // Check if auth buttons already exist
    if (document.getElementById('auth-buttons-container')) return;

    // Create container for auth buttons
    const authContainer = document.createElement('div');
    authContainer.id = 'auth-buttons-container';
    authContainer.className = 'navbar__item';

    // Create login button
    const loginBtn = document.createElement('a');
    loginBtn.className = 'navbar__link navbar__login';
    loginBtn.href = '/signin';
    loginBtn.textContent = 'Login';

    // Create signup button
    const signupBtn = document.createElement('a');
    signupBtn.className = 'navbar__link navbar__signup';
    signupBtn.href = '/signup';
    signupBtn.textContent = 'Sign Up';

    // Add buttons to container
    authContainer.appendChild(loginBtn);
    authContainer.appendChild(signupBtn);

    // Find the GitHub link and insert before it
    const githubLink = navbar.querySelector('a[href*="github.com"]');
    if (githubLink) {
      navbar.insertBefore(authContainer, githubLink);
    } else {
      navbar.appendChild(authContainer);
    }
  };

  // Add buttons when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addAuthButtons);
  } else {
    addAuthButtons();
  }

  // Also add buttons after navigation
  const observer = new MutationObserver(() => {
    addAuthButtons();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  return null;
}