/**
 * Better-Auth API route handler
 * This should be placed in your Next.js API directory or equivalent
 */
import { auth } from "../../../auth.server";

// Export the auth handler for API routes
export const { GET, POST } = auth.handler;