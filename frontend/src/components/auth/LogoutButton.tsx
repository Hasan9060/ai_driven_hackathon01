/**
 * Logout button component
 */
import React from "react";
import { useAuth } from "../../context/AuthContext";
import styles from "./AuthForm.module.css";

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function LogoutButton({ className, children }: LogoutButtonProps) {
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      const result = await logout();
      if (result.success) {
        // Redirect to home page after successful logout
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, try to redirect
      window.location.href = "/";
    }

    setIsLoading(false);
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`${styles.button} ${styles.secondary} ${className || ""}`}
    >
      {isLoading ? "Signing out..." : children || "Sign Out"}
    </button>
  );
}