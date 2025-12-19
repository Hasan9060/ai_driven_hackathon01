/**
 * Better-Auth client configuration for the frontend
 */
import { createAuthClient } from "better-auth/react";

// Create the Better-Auth client
// Note: In the frontend, we only need to configure the client-side behavior
// Database and webhook configurations are handled on the server
export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined"
    ? window.location.origin + "/api/auth"
    : "http://localhost:3000/api/auth",
});

// Export the auth methods
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;