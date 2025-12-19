/**
 * Mock authentication implementation for testing
 * This provides the same interface as Better-Auth but works without a backend
 */
interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  image?: string;
}

interface Session {
  user: User;
  token: string;
  expiresAt: Date;
}

interface SignInResponse {
  data?: { user: User; token: string };
  error?: { message: string };
}

interface SignUpResponse {
  data?: { user: User; token: string };
  error?: { message: string };
}

// Mock session storage
let currentSession: Session | null = null;

// Mock users storage (in production, this would be in a database)
const mockUsers: User[] = [
  {
    id: "1",
    email: "test@example.com",
    emailVerified: true,
    name: "Test User",
  },
];

export const authClient = {
  // Mock signIn function
  signIn: {
    email: async ({ email, password, callbackURL }: {
      email: string;
      password: string;
      callbackURL?: string;
    }): Promise<SignInResponse> => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if user exists
      const user = mockUsers.find(u => u.email === email);

      if (!user || password !== "password") {
        return {
          error: { message: "Invalid email or password" }
        };
      }

      // Create session
      currentSession = {
        user,
        token: "mock-jwt-token-" + Date.now(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };

      // Store in localStorage
      localStorage.setItem("auth-session", JSON.stringify(currentSession));

      return {
        data: { user, token: currentSession.token }
      };
    },
  },

  // Mock signUp function
  signUp: {
    email: async ({
      email,
      password,
      name,
      callbackURL
    }: {
      email: string;
      password: string;
      name?: string;
      callbackURL?: string;
    }): Promise<SignUpResponse> => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if user already exists
      const existingUser = mockUsers.find(u => u.email === email);
      if (existingUser) {
        return {
          error: { message: "User already exists" }
        };
      }

      // Create new user
      const newUser: User = {
        id: (mockUsers.length + 1).toString(),
        email,
        emailVerified: false, // Need email verification
        name,
      };

      mockUsers.push(newUser);

      return {
        data: {
          user: newUser,
          token: "verification-email-sent"
        }
      };
    },
  },

  // Mock signOut function
  signOut: async (): Promise<void> => {
    currentSession = null;
    localStorage.removeItem("auth-session");
  },

  // Hook to get session
  useSession: () => {
    // In a real implementation, this would manage subscription to auth state changes
    // For now, return a simple implementation
    const getSession = (): Session | null => {
      if (currentSession) return currentSession;

      // Try to restore from localStorage
      const stored = localStorage.getItem("auth-session");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (new Date(parsed.expiresAt) > new Date()) {
            currentSession = parsed;
            return currentSession;
          } else {
            localStorage.removeItem("auth-session");
          }
        } catch (e) {
          localStorage.removeItem("auth-session");
        }
      }

      return null;
    };

    const session = getSession();

    return {
      data: session,
      isLoading: false,
      isPending: false,
      error: null,
    };
  },

  // Get session function
  getSession: async (): Promise<Session | null> => {
    return authClient.useSession().data;
  },
};

// Export the methods for consistency with Better-Auth
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;