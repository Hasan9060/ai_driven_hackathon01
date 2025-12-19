import React, { useEffect } from 'react';
import { createRoot, Root } from 'react-dom/client';
import RootLayout from '@theme-original/Root';
import { AuthProvider, useAuth } from '@site/src/context/AuthContext';
import AuthNavbarItem from '@site/src/theme/AuthNavbarItem';
import ChatWidget from '@site/src/components/ChatWidget';
import { CONFIG } from '@site/src/components/ChatWidget/config';

// Component to inject auth buttons into navbar
function NavbarAuthInjection() {
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Find the custom navbar item placeholder
    const navbarItem = document.querySelector('.auth-navbar-item');
    if (!navbarItem) return;

    // If already injected, skip
    if (navbarItem.hasChildNodes()) return;

    // Create a container for React
    const container = document.createElement('div');
    navbarItem.appendChild(container);

    // Render the AuthNavbarItem
    const root = createRoot(container);
    root.render(
      <AuthNavbarItem />
    );

    // Cleanup
    return () => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, [user, isAuthenticated, isLoading]);

  return null;
}

// Wrapper that includes the navbar injection
function LayoutWithAuth({ children }) {
  return (
    <>
      {children}
      <NavbarAuthInjection />
    </>
  );
}

export default function RootWrapper(props) {
  // Use configuration to determine if ChatWidget should be enabled
  const isChatWidgetEnabled = CONFIG.enabled;

  return (
    <AuthProvider>
      <LayoutWithAuth>
        <RootLayout {...props} />
        {isChatWidgetEnabled && <ChatWidget />}
      </LayoutWithAuth>
    </AuthProvider>
  );
}