/**
 * Better-Auth server configuration
 * This file should be used in a Node.js environment, not imported by client code
 */
import { betterAuth } from "better-auth";
import { neon } from "@neondatabase/serverless";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "./auth-schema";

// Get environment variables
const DATABASE_URL = process.env.NEON_DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("NEON_DATABASE_URL is not configured");
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Create Better-Auth instance
export const auth = betterAuth({
  baseURL: BASE_URL,
  database: drizzleAdapter(neon(DATABASE_URL), {
    provider: "postgres",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  account: {
    accountLinking: {
      enabled: true,
    },
  },
  webhooks: {
    // Send webhook to FastAPI backend when user is created
    onSignUp: {
      url: `${BASE_URL}/auth/webhook`,
      secret: process.env.BETTER_AUTH_WEBHOOK_SECRET || "your-webhook-secret",
    },
    onEmailVerification: {
      url: `${BASE_URL}/auth/webhook`,
      secret: process.env.BETTER_AUTH_WEBHOOK_SECRET || "your-webhook-secret",
    },
  },
});

export type Session = typeof auth.$Infer.Session;