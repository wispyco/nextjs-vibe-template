"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
  useRef
} from "react";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { ApiClient } from "@/lib/api-client";
// We'll still need AuthService for auth event listeners
import { AuthService } from "@/lib/auth/service";

// Define the shape of our AuthContext
type AuthContextType = {
  user: User | null;
  tokens: number;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setTokens: (tokens: number) => void;
  incrementTokens: (amount: number) => void;
  decrementTokens: (amount: number) => void;
  syncTokensWithDB: () => Promise<void>;
  refreshCredits: () => Promise<void>;
  signOut: () => Promise<void>;
};

// Create the context with a default value
export const AuthContext = createContext<AuthContextType>({
  user: null,
  tokens: 0,
  isLoading: true,
  isAuthenticated: false,
  setUser: () => {},
  setTokens: () => {},
  incrementTokens: () => {},
  decrementTokens: () => {},
  syncTokensWithDB: async () => {},
  refreshCredits: async () => {},
  signOut: async () => {},
});

// Custom hook for using the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component that wraps the app and makes auth object available to any child component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokensState] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Create refs to track the latest values without triggering re-renders
  const userRef = useRef<User | null>(null);
  const tokensRef = useRef<number>(0);

  // Create a ref for the token update timeout
  const tokenUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update refs when state changes
  useEffect(() => {
    userRef.current = user;
    tokensRef.current = tokens;
  }, [user, tokens]);

  // Wrapper for setTokens that updates both state and ref
  const setTokens = useCallback((newTokens: number) => {
    setTokensState(newTokens);
    tokensRef.current = newTokens;

    // Update tokens in the database if user is authenticated
    if (userRef.current) {
      // Use a debounce to avoid too many API calls
      if (tokenUpdateTimeoutRef.current) {
        clearTimeout(tokenUpdateTimeoutRef.current);
      }

      tokenUpdateTimeoutRef.current = setTimeout(async () => {
        try {
          await ApiClient.updateUserCredits(newTokens);
        } catch (error) {
          console.error("Error updating tokens in database:", error);
        }
        tokenUpdateTimeoutRef.current = null;
      }, 1000);
    }
  }, []);

  // Function to increment tokens
  const incrementTokens = useCallback((amount: number) => {
    const newTokens = tokensRef.current + amount;
    setTokens(newTokens);
  }, [setTokens]);

  // Function to decrement tokens
  const decrementTokens = useCallback((amount: number) => {
    const newTokens = Math.max(0, tokensRef.current - amount);
    setTokens(newTokens);
  }, [setTokens]);

  // Function to sync tokens with database (without triggering refresh)
  const syncTokensWithDB = useCallback(async () => {
    if (!userRef.current) return;

    try {
      // Use ApiClient instead of direct Supabase access
      // This uses the dedicated endpoint that doesn't trigger refresh
      const { data, error } = await ApiClient.getUserCredits();

      if (error) {
        console.error("Error syncing tokens with DB:", error);
        return;
      }

      // Update local state with the database value
      if (data !== null) {
        setTokens(data);
      }
    } catch (error) {
      console.error("Error syncing tokens with DB:", error);
    }
  }, [setTokens]);

  // Function to refresh user credits (once per 24 hours)
  const refreshCredits = useCallback(async () => {
    if (!userRef.current) return;

    try {
      // Use the dedicated refresh method
      const { data, error } = await ApiClient.refreshUserCredits();

      if (error) {
        console.error("Error refreshing credits:", error);
        return;
      }

      // Update local state with the refreshed value
      if (data !== null) {
        setTokens(data);
      }
    } catch (error) {
      console.error("Error refreshing credits:", error);
    }
  }, [setTokens]);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      // Use ApiClient instead of direct Supabase access
      const { error } = await ApiClient.signOut();

      if (error) {
        console.error("Error signing out:", error);
        return;
      }

      // Clear local state
      setUser(null);
      setTokens(0);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, [setTokens]);

  // Effect to initialize auth state and set up auth listener
  useEffect(() => {
    setIsLoading(true);

    // We still need to use AuthService for the auth state listener
    const supabase = AuthService.createClient();

    // Function to get initial user and tokens
    const initializeAuth = async () => {
      try {
        // Get current user using ApiClient
        const { data: userData, error: userError } = await ApiClient.getCurrentUser();

        if (userError || !userData) {
          console.log("No authenticated user found");
          setIsLoading(false);
          return;
        }

        setUser(userData);
        userRef.current = userData;

        // Refresh user credits using ApiClient
        // This is the only place we should trigger a credit refresh on app initialization
        const { data: creditsData, error: creditsError } = await ApiClient.refreshUserCredits();

        if (creditsError) {
          console.error("Error refreshing user credits:", creditsError);
        } else if (creditsData !== null) {
          setTokens(creditsData);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initialize auth state
    initializeAuth();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log("Auth state changed:", event);

        if (event === "SIGNED_IN" && session?.user) {
          // Use ApiClient to get user data
          const { data: userData } = await ApiClient.getCurrentUser();
          setUser(userData);
          userRef.current = userData;

          // Sync tokens with DB
          syncTokensWithDB();
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          userRef.current = null;
          setTokens(0);
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          // Token was refreshed, update user if needed
          if (!userRef.current || userRef.current.id !== session.user.id) {
            const { data: userData } = await ApiClient.getCurrentUser();
            setUser(userData);
            userRef.current = userData;
          }
        }
      }
    );

    // Clean up auth listener on unmount
    return () => {
      authListener.subscription.unsubscribe();

      // Clear any pending token updates
      if (tokenUpdateTimeoutRef.current) {
        clearTimeout(tokenUpdateTimeoutRef.current);
      }
    };
  }, [setTokens, syncTokensWithDB]);

  // Provide the auth context to children components
  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isLoading,
        isAuthenticated: !!user,
        setUser,
        setTokens,
        incrementTokens,
        decrementTokens,
        syncTokensWithDB,
        refreshCredits,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
