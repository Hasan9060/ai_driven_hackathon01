/**
 * Authentication context for managing auth state across the app
 */
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSession, signIn, signUp, signOut } from "../lib/auth-mock";

// Types
interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    profileData?: ProfileData
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUserProfile: (profileData: ProfileData) => Promise<{ success: boolean; error?: string }>;
}

interface ProfileData {
  softwareYears?: number;
  softwareLanguages?: string[];
  softwareFrameworks?: string[];
  hardwareRobotics?: boolean;
  hardwareEmbedded?: boolean;
  hardwareIot?: boolean;
  interests?: string[];
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isLoading } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  // Update user state when session changes
  useEffect(() => {
    if (session && session.user) {
      // Mock auth provides session with nested user object
      setUser({
        id: session.user.id,
        email: session.user.email,
        emailVerified: session.user.emailVerified,
        name: session.user.name,
        image: session.user.image,
      });
    } else {
      setUser(null);
      setProfile(null);
    }
  }, [session]);

  // Load user profile
  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      // For mock implementation, we'll just set a default profile
      console.log("Profile would be loaded for user:", user?.email);
      // In a real implementation, this would fetch from the backend API
    } catch (error) {
      console.error("Failed to load user profile:", error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Check for returnUrl in URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get("returnUrl");

      const { data, error } = await signIn.email({
        email,
        password,
        callbackURL: returnUrl || window.location.origin,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed"
      };
    }
  };

  const register = async (
    email: string,
    password: string,
    profileData?: ProfileData
  ) => {
    try {
      // First, sign up the user
      const { data, error } = await signUp.email({
        email,
        password,
        name: profileData?.name,
        callbackURL: `${window.location.origin}/signup?step=questionnaire`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // For mock implementation, we'll just store the profile locally
      if (profileData) {
        console.log("Profile data would be saved:", profileData);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Registration failed"
      };
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const updateUserProfile = async (profileData: ProfileData) => {
    try {
      // For mock implementation, just log and update local state
      console.log("Profile would be updated:", profileData);
      setProfile(profileData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Update failed"
      };
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}