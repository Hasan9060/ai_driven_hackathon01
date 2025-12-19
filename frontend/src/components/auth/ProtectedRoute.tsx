/**
 * Protected route component for authentication
 */
import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Navigate } from "@docusaurus/router";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  redirectTo = "/signin",
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid var(--ifm-color-emphasis-300)",
            borderTop: `4px solid var(--ifm-color-primary)`,
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  // Redirect to signin page if user is not authenticated
  if (!user) {
    // Save the current URL to redirect back after login
    const currentPath = window.location.pathname + window.location.search;
    const returnUrl = encodeURIComponent(currentPath);
    return <Navigate to={`${redirectTo}?returnUrl=${returnUrl}`} replace />;
  }

  // User is authenticated, render children
  return <>{children}</>;
}