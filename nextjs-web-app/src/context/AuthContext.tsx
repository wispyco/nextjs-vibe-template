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
  const [user, setUserState] = useState<User | null>(null);
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

  // Wrapper for setUser that updates both state and ref
  const setUser = useCallback((newUser: User | null) => {
    console.log('🔄 Setting user state:', {
      userId: newUser?.id,
      email: newUser?.email,
      timestamp: new Date().toISOString(),
      action: 'setUser'
    });
    setUserState(newUser);
    userRef.current = newUser;
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
      console.log("🔄 Signing out user via context signOut function");

      // Call the API to sign out - this will clear cookies
      const { error } = await ApiClient.signOut();

      if (error) {
        console.error("Error signing out:", error);
      }

      // Clear local state
      setUser(null);
      setTokens(0);

      // Clear cookies manually to ensure they're properly cleared
      const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^\.]+)\./)?.[1] || '';
      const supabaseCookieName = projectRef ? `sb-${projectRef}-auth-token` : 'sb-auth-token';

      // Clear cookies by setting expiry to past date
      document.cookie = `${supabaseCookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

      console.log('🧹 Cleared auth cookies on logout');

      // Force a page reload to ensure all state is cleared
      window.location.href = '/';
    } catch (error) {
      console.error("Error during sign out:", error);

      // Still clear local state even if API call fails
      setUser(null);
      setTokens(0);

      // Clear cookies even if API call fails
      const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^\.]+)\./)?.[1] || '';
      const supabaseCookieName = projectRef ? `sb-${projectRef}-auth-token` : 'sb-auth-token';

      document.cookie = `${supabaseCookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  }, [setTokens, setUser]);

  // Effect to initialize auth state and set up auth listener
  useEffect(() => {
    setIsLoading(true);
    console.log('🔄 Initializing auth state...');

    // We still need to use AuthService for the auth state listener
    const supabase = AuthService.createClient();

    // Function to get initial user and tokens
    const initializeAuth = async () => {
      try {
        // Clear any stale cookies if there's an issue with the session
        const clearStaleCookies = () => {
          // This will run in the browser context
          const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^\.]+)\./)?.[1] || '';
          const supabaseCookieName = projectRef ? `sb-${projectRef}-auth-token` : 'sb-auth-token';

          // Clear cookies by setting expiry to past date
          document.cookie = `${supabaseCookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

          console.log('🧹 Cleared potentially stale auth cookies');
        };

        // Check if we have a session directly from Supabase first
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        // If there's a session error, clear cookies and retry
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          clearStaleCookies();
          // Retry getting the session after clearing cookies
          const { data: retrySessionData } = await supabase.auth.getSession();
          console.log('🔄 Retried getting session after clearing cookies');
          sessionData.session = retrySessionData.session;
        }

        // If we have a session but it's about to expire, refresh it
        if (sessionData?.session) {
          const expiresAt = sessionData.session.expires_at;
          const now = Math.floor(Date.now() / 1000); // Current time in seconds
          const timeUntilExpiry = expiresAt - now;

          // If session expires in less than 5 minutes (300 seconds), refresh it
          if (timeUntilExpiry < 300) {
            console.log('🔄 Session about to expire, refreshing...');
            await supabase.auth.refreshSession();
            // Get the updated session
            const { data: refreshedData } = await supabase.auth.getSession();
            sessionData.session = refreshedData.session;
          }
        }

        console.log('🔍 Current session state:', {
          hasSession: !!sessionData?.session,
          sessionExpiry: sessionData?.session?.expires_at ? new Date(sessionData.session.expires_at * 1000).toISOString() : 'none',
          timestamp: new Date().toISOString()
        });

        // Force a session refresh to ensure we have the latest session
        if (sessionData?.session) {
          try {
            const { data: refreshData } = await supabase.auth.refreshSession();
            console.log('🔄 Session refreshed successfully', {
              hasRefreshedSession: !!refreshData?.session,
              refreshedExpiry: refreshData?.session?.expires_at ? new Date(refreshData.session.expires_at * 1000).toISOString() : 'none',
            });

            // If we have a refreshed session, use it
            if (refreshData?.session) {
              sessionData.session = refreshData.session;
            }
          } catch (refreshError) {
            console.error('❌ Error refreshing session:', refreshError);
          }
        }

        // If we have a session, try to get the user from Supabase directly first
        if (sessionData?.session) {
          console.log('🔍 Session found, trying to get user directly from Supabase');
          const { data: supabaseUser, error: supabaseError } = await supabase.auth.getUser();

          if (supabaseUser?.user && !supabaseError) {
            console.log('✅ User retrieved directly from Supabase:', {
              userId: supabaseUser.user.id,
              email: supabaseUser.user.email,
              timestamp: new Date().toISOString()
            });

            setUser(supabaseUser.user);
            userRef.current = supabaseUser.user;

            // Now get the user profile and tokens
            const { data: profileData } = await ApiClient.getUserProfile();
            if (profileData?.credits) {
              setTokens(profileData.credits);
            }

            setIsLoading(false);
            return;
          } else {
            console.log('⚠️ Could not get user from Supabase directly:', supabaseError);
          }
        }

        // Fallback to using ApiClient
        console.log('🔍 Falling back to ApiClient for user data');
        const { data: userData, error: userError } = await ApiClient.getCurrentUser();

        if (userError || !userData) {
          console.log("❌ No authenticated user found via API");
          setIsLoading(false);
          return;
        }

        console.log('✅ User authenticated via API:', {
          userId: userData.id,
          email: userData.email,
          timestamp: new Date().toISOString()
        });

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
        console.log("🔔 Auth state changed:", event, {
          hasSession: !!session,
          userId: session?.user?.id,
          timestamp: new Date().toISOString()
        });

        if (event === "SIGNED_IN" && session?.user) {
          console.log('✅ User signed in event received');
          // Use ApiClient to get user data
          const { data: userData } = await ApiClient.getCurrentUser();
          if (userData) {
            console.log('✅ User data retrieved after sign in:', {
              userId: userData.id,
              email: userData.email
            });
            setUser(userData);
            userRef.current = userData;

            // Sync tokens with DB
            syncTokensWithDB();
          } else {
            console.error('❌ Failed to get user data after SIGNED_IN event');
          }
        } else if (event === "SIGNED_OUT") {
          console.log('🚪 User signed out event received');
          setUser(null);
          userRef.current = null;
          setTokens(0);
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          console.log('🔄 Token refreshed event received');
          // Token was refreshed, update user if needed
          if (!userRef.current || userRef.current.id !== session.user.id) {
            const { data: userData } = await ApiClient.getCurrentUser();
            if (userData) {
              console.log('✅ User data updated after token refresh');
              setUser(userData);
              userRef.current = userData;
            }
          }
        } else if (event === "INITIAL_SESSION") {
          console.log('🔍 Initial session event received:', {
            hasSession: !!session,
            userId: session?.user?.id
          });

          // If we have a session but no user, try to get the user
          if (session && !userRef.current) {
            try {
              const { data: userData } = await ApiClient.getCurrentUser();
              if (userData) {
                console.log('✅ User data retrieved after INITIAL_SESSION event');
                setUser(userData);
                userRef.current = userData;

                // Also get the user profile and tokens
                const { data: profileData } = await ApiClient.getUserProfile();
                if (profileData?.credits) {
                  setTokens(profileData.credits);
                }
              }
            } catch (error) {
              console.error('❌ Error getting user after INITIAL_SESSION:', error);
            }
          }

          // The user data is already being fetched in the code above
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
