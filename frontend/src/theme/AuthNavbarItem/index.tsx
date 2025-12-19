/**
 * AuthNavbarItem component for Docusaurus navbar
 * Shows Login/Signup buttons for unauthenticated users
 * Shows user menu for authenticated users
 */
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import styles from "./AuthNavbarItem.module.css";
import clsx from "clsx";

export default function AuthNavbarItem({ mobile = false }: { mobile?: boolean }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsMenuOpen(false);
    try {
      await logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    // Show loading skeleton
    return (
      <div className={styles.navbarItem}>
        <div className={styles.loadingSkeleton}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Show Login and Signup buttons for unauthenticated users
    return (
      <div className={clsx(styles.navbarItem, styles.authButtons)}>
        <a
          href="/signin"
          className={clsx(
            styles.navbarLink,
            styles.loginLink,
            mobile && styles.mobileLink
          )}
        >
          Login
        </a>
        <a
          href="/signup"
          className={clsx(
            styles.navbarLink,
            styles.signupLink,
            mobile && styles.mobileLink
          )}
        >
          Sign Up
        </a>
      </div>
    );
  }

  // Show user menu for authenticated users
  return (
    <div className={styles.navbarItem} ref={menuRef}>
      <button
        className={clsx(
          styles.userMenuButton,
          isMenuOpen && styles.userMenuButtonOpen
        )}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="User menu"
        aria-expanded={isMenuOpen}
      >
        {user?.name || user?.email?.charAt(0).toUpperCase()}
      </button>

      {isMenuOpen && (
        <div className={clsx(styles.userMenu, mobile && styles.mobileMenu)}>
          <div className={styles.userInfo}>
            <div className={styles.userEmail}>{user?.email}</div>
            {user?.emailVerified && (
              <span className={styles.verifiedBadge}>✓ Verified</span>
            )}
          </div>
          <div className={styles.menuDivider}></div>
          <a
            href="/profile"
            className={styles.menuItem}
            onClick={() => setIsMenuOpen(false)}
          >
            Profile
          </a>
          <a
            href="/settings"
            className={styles.menuItem}
            onClick={() => setIsMenuOpen(false)}
          >
            Settings
          </a>
          <div className={styles.menuDivider}></div>
          <button
            className={clsx(styles.menuItem, styles.logoutItem)}
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}