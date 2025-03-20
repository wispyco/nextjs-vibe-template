"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { AuthService } from "@/lib/auth/service";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import CreditPurchase from "@/components/CreditPurchase";
import { ApiClient } from "@/lib/api-client";

export default function DashboardPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user, tokens, setTokens, syncTokensWithDB, isLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState("free");
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isProcessingCredits, setIsProcessingCredits] = useState(false);

  // Add refs to track latest values without causing re-renders
  const latestTokens = useRef<number>(tokens);
  const latestSubscriptionTier = useRef<string>(subscriptionTier);
  const latestSubscriptionStatus = useRef<string | null>(subscriptionStatus);
  const isLoadingProfile = useRef<boolean>(false);

  // Define profile data type
  interface ProfileData {
    credits: number;
    subscription_tier?: string;
    subscription_status?: string;
    email?: string;
  }

  // Helper function to update state from profile data
  const updateStateFromProfile = useCallback((profileData: ProfileData) => {
    if (profileData.credits !== undefined) {
      setTokens(profileData.credits);
    }
    if (profileData.subscription_tier) {
      setSubscriptionTier(profileData.subscription_tier);
    }
    if (profileData.subscription_status) {
      setSubscriptionStatus(profileData.subscription_status);
    }
  }, [setTokens, setSubscriptionTier, setSubscriptionStatus]);

  // Profile data loading function
  const loadProfileData = useCallback(async () => {
    if (isLoadingProfile.current) {
      console.log("🚫 Skipping profile load - already in progress");
      return;
    }

    try {
      isLoadingProfile.current = true;
      setLoading(true);
      console.log("🔄 Loading profile data");

      const { data: profileData, error: profileError } = await ApiClient.getUserProfile();

      if (profileError) {
        console.error("❌ Error fetching profile:", profileError);
        setError("Failed to load your profile data. Please try again later.");
        return;
      }

      if (profileData) {
        console.log("✅ Profile data loaded:", profileData);

        // Handle credits/tokens
        if (profileData.credits !== undefined) {
          console.log("💰 Setting credits:", profileData.credits);
          setTokens(profileData.credits);
          latestTokens.current = profileData.credits;

          // Sync with DB if needed
          if (profileData.credits === 0) {
            console.log("🔄 Syncing tokens with DB due to zero balance");
            await syncTokensWithDB();
          }
        }

        // Handle subscription data
        if (profileData.subscription_tier) {
          const newTier = profileData.subscription_tier.toLowerCase();
          console.log("📊 Setting subscription tier:", newTier);
          setSubscriptionTier(newTier);
          latestSubscriptionTier.current = newTier;
        }

        if (profileData.subscription_status) {
          const newStatus = profileData.subscription_status.toLowerCase();
          console.log("📊 Setting subscription status:", newStatus);
          setSubscriptionStatus(newStatus);
          latestSubscriptionStatus.current = newStatus;

          // Show subscription message only if status changes to active
          if (newStatus === 'active' && newStatus !== latestSubscriptionStatus.current) {
            const tierName = profileData.subscription_tier?.toLowerCase() || 'unknown';
            setSuccessMessage(`Your ${tierName} subscription is active!`);
            setTimeout(() => setSuccessMessage(null), 5000);
          }
        }
      }
    } catch (error: unknown) {
      console.error("❌ Error in loadProfileData:", error);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      console.log("✅ Profile data loading complete");
      isLoadingProfile.current = false;
      setLoading(false);
    }
  }, [setLoading, setError, setTokens, setSubscriptionTier, setSubscriptionStatus, syncTokensWithDB]);

  // Function to refresh user profile
  const refreshUserProfile = useCallback(async () => {
    if (isLoadingProfile.current) {
      console.log("🚫 Skipping profile refresh - already loading");
      return;
    }

    try {
      isLoadingProfile.current = true;
      setLoading(true);

      const { data: profileData, error: profileError } = await ApiClient.getUserProfile();

      if (profileError) {
        console.error("Error refreshing profile:", profileError);
        setError("Failed to refresh your profile data. Please try again later.");
        return;
      }

      if (profileData) {
        updateStateFromProfile(profileData as ProfileData);
        setSuccessMessage("Profile refreshed successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error) {
      console.error("Error in refreshUserProfile:", error);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      isLoadingProfile.current = false;
      setLoading(false);
    }
  }, [setLoading, setError, updateStateFromProfile, setSuccessMessage]);

  // Update refs when values change
  useEffect(() => {
    latestTokens.current = tokens;
  }, [tokens]);

  useEffect(() => {
    latestSubscriptionTier.current = subscriptionTier;
  }, [subscriptionTier]);

  useEffect(() => {
    latestSubscriptionStatus.current = subscriptionStatus;
  }, [subscriptionStatus]);

  // Safety timeout effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoadingProfile.current) {
        console.log("⚠️ Loading timeout reached - resetting loading state");
        isLoadingProfile.current = false;
        setLoading(false);
      }
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, []);

  // Main auth effect
  useEffect(() => {
    let mounted = true;

    const initializeUser = async () => {
      if (!mounted) return;

      console.log("🔄 Auth effect triggered:", {
        user,
        isLoading,
        userEmail,
        subscriptionTier,
        subscriptionStatus
      });

      if (!user && !isLoading) {
        console.log("❌ No user and not loading - redirecting to home");
        router.push("/");
        return;
      }

      if (!user || isLoading) {
        console.log("⏳ Waiting for auth to complete");
        return;
      }

      // Set email immediately when user is available
      if (user.email && !userEmail) {
        console.log("✉️ Setting user email:", user.email);
        setUserEmail(user.email);
      }

      // Load profile data whenever we have a user and auth is complete
      if (user.email) {
        console.log("🔄 Loading profile data for user:", user.email);
        await loadProfileData();
      }
    };

    void initializeUser();

    // Set up an interval to refresh profile data every minute
    const intervalId = setInterval(() => {
      if (user && !isLoading) {
        console.log("🔄 Periodic profile refresh");
        void loadProfileData();
      }
    }, 60000); // Every minute

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [user, isLoading, router, userEmail, loadProfileData]);

  // Remove the initial sync effect since we're handling it in loadProfileData
  useEffect(() => {
    if (user && !isLoading) {
      console.log("🔄 Initial profile load");
      void loadProfileData();
    }
  }, [user, isLoading, loadProfileData]);

  // 7. Stripe session effect
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const creditsPurchased = searchParams.get('credits_purchased');
    const purchasedAmount = searchParams.get('amount');
    const planType = searchParams.get('plan');

    if (!sessionId) return;

    console.log(`🔍 Checking URL parameters:`, {
      sessionId,
      creditsPurchased,
      purchasedAmount,
      planType
    });

    if (creditsPurchased === 'true' && purchasedAmount) {
      console.log(`✅ Credit purchase success detected: ${purchasedAmount} credits`);
      setSuccessMessage(`Payment successful! ${purchasedAmount} credits have been added to your account.`);

      // Remove the parameters from the URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      console.log(`🔄 URL parameters removed, new URL: ${newUrl}`);

      // Refresh profile data immediately instead of reloading the page
      console.log(`🔄 Refreshing user profile after credit purchase`);
      refreshUserProfile().then(() => {
        console.log(`✅ Profile refresh completed after credit purchase`);
        // Hide success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      });
    } else if (planType) {
      // Handle plan upgrade success
      const planName = planType.toLowerCase();
      console.log(`✅ Plan upgrade success detected: ${planName}`);
      setSuccessMessage(`Payment successful! Your subscription has been upgraded to ${planName.toUpperCase()}.`);

      // Update the UI immediately to reflect the upgrade
      console.log(`🔄 Updating UI to reflect plan upgrade to ${planName}`);
      console.log(`📊 Current subscription tier: ${subscriptionTier}`);
      setSubscriptionTier(planName);
      setSubscriptionStatus('active');
      console.log(`📊 Updated subscription tier: ${planName}`);

      // Remove the session_id from the URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      console.log(`🔄 URL parameters removed, new URL: ${newUrl}`);

      // Refresh profile data immediately instead of reloading the page
      console.log(`🔄 Refreshing user profile after plan upgrade`);
      refreshUserProfile().then(() => {
        console.log(`✅ Profile refresh completed after plan upgrade`);
        console.log(`📊 Final subscription tier after refresh: ${subscriptionTier}`);
        // Hide success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      });
    } else {
      console.log(`✅ Generic payment success detected`);
      setSuccessMessage("Payment successful! Your subscription has been updated.");

      // Remove the session_id from the URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      console.log(`🔄 URL parameters removed, new URL: ${newUrl}`);

      // Refresh profile data immediately instead of reloading the page
      console.log(`🔄 Refreshing user profile after payment`);
      refreshUserProfile().then(() => {
        console.log(`✅ Profile refresh completed after payment`);
        // Hide success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      });
    }
  }, [searchParams, subscriptionTier, refreshUserProfile]);

  const handleSelectPlan = async (plan: string) => {
    try {
      setIsUpgrading(true);
      setError(null);

      // Check if we have a valid session before making the API call
      const supabase = AuthService.createClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      console.log(`🔍 Session check before API call:`, {
        hasSession: !!sessionData?.session,
        sessionError: sessionError?.message || 'none',
        sessionExpiry: sessionData?.session?.expires_at ? new Date(sessionData.session.expires_at * 1000).toISOString() : 'none',
        currentTime: new Date().toISOString(),
        isExpired: sessionData?.session?.expires_at ? (sessionData.session.expires_at * 1000) < Date.now() : false
      });

      if (sessionError || !sessionData.session) {
        console.error(`❌ Session error:`, sessionError);
        setError("You must be logged in to change your plan");
        setIsUpgrading(false);
        return;
      }

      // Get the current user to verify authentication
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        console.error(`❌ User verification failed:`, {
          error: userError?.message || 'No user data',
          userData: userData || null
        });
        setError("Could not verify your user account");
        setIsUpgrading(false);
        return;
      }

      console.log(`✅ User verification successful:`, {
        id: userData.user.id,
        email: userData.user.email,
        lastSignIn: userData.user.last_sign_in_at,
        metadata: userData.user.user_metadata
      });

      // Check if this is a downgrade request (indicated by :downgrade suffix)
      const isDowngrade = plan.includes(':downgrade');
      // Extract the actual plan name without the :downgrade suffix if present
      const actualPlan = isDowngrade ? plan.split(':')[0] : plan;

      if (isDowngrade) {
        // Handle downgrade - call the downgrade API endpoint
        console.log(`🔄 Starting subscription downgrade process`);

        // Authentication token
        const accessToken = sessionData.session.access_token;

        // Make the API call to the downgrade endpoint
        console.log(`📤 Outgoing downgrade request details:`, {
          url: '/api/stripe/downgrade',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          accessToken: accessToken // Log the token for debugging
        });

        // Create a request body with the authenticated user's ID
        // The server will verify that this matches the authenticated user making the request
        const requestBody = {
          userId: userData.user.id // This is the authenticated user's ID from the session
        };

        const response = await fetch('/api/stripe/downgrade', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include', // Include cookies
          body: JSON.stringify(requestBody) // Include the user ID in the body
        });

        console.log(`📥 Downgrade API response details:`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          url: response.url
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.log(`❌ Downgrade API error details:`, {
            status: response.status,
            errorData,
            requestUrl: response.url,
            requestId: response.headers.get('x-request-id')
          });
          throw new Error(errorData.error || `HTTP error ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          console.log(`✅ Subscription downgraded successfully:`, {
            message: data.message,
            timestamp: new Date().toISOString()
          });

          // Update UI to reflect the downgrade
          setSubscriptionTier('free');
          setSubscriptionStatus('inactive');

          // Show success message
          setSuccessMessage(data.message || 'Your subscription has been cancelled successfully.');

          // Refresh profile data
          await refreshUserProfile();

          // Hide success message after 5 seconds
          setTimeout(() => {
            setSuccessMessage(null);
          }, 5000);
        } else {
          throw new Error("Downgrade failed");
        }
      } else {
        // Handle upgrade - call the checkout API endpoint
        console.log(`🔄 Starting Stripe checkout process for tier: ${actualPlan}`);

        // Request body with the authenticated user's ID and email
        // The server will verify that this matches the authenticated user making the request
        const requestBody = {
          tier: actualPlan,
          userId: userData.user.id, // This is the authenticated user's ID from the session
          userEmail: userData.user.email || '',
        };

        // Log the request details before making the call
        console.log(`📤 Outgoing checkout request details:`, {
          url: '/api/stripe/checkout',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBody
        });

        // Make the API call with credentials to include cookies for authentication
        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for authentication
          body: JSON.stringify(requestBody),
        });

        console.log(`📥 API response details:`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          url: response.url
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.log(`❌ Checkout API error details:`, {
            status: response.status,
            errorData,
            requestUrl: response.url,
            requestId: response.headers.get('x-request-id'),
            corsHeaders: {
              'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
              'access-control-allow-credentials': response.headers.get('access-control-allow-credentials')
            }
          });
          throw new Error(errorData.error || `HTTP error ${response.status}`);
        }

        const data = await response.json();

        if (data.url) {
          console.log(`✅ Checkout session created successfully:`, {
            checkoutUrl: data.url,
            timestamp: new Date().toISOString()
          });
          window.location.href = data.url;
        } else {
          throw new Error("No checkout URL returned");
        }
      }
    } catch (err) {
      console.error('Plan change error:', err);
      setError('Failed to process your request. Please try again later.');
      setIsUpgrading(false);
    }
  };

  const handlePurchaseCredits = async (creditAmount: number) => {
    try {
      setIsProcessingCredits(true);
      setError(null); // Clear any previous errors

      // Get access token from current session
      const supabase = AuthService.createClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData?.session?.access_token) {
        console.error('No valid session found for credit purchase:', sessionError);
        setError('No valid session found. Please log in again.');
        setIsProcessingCredits(false);
        return;
      }

      const accessToken = sessionData.session.access_token;

      // Get the user data for verification
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        console.error('User verification failed for credit purchase:', userError);
        setError('Could not verify your user account');
        setIsProcessingCredits(false);
        return;
      }

      // Log request details for debugging
      console.log(`🔄 Sending credit purchase request:`, {
        creditAmount,
        userId: userData.user.id,
        userEmail: userData.user.email
      });

      // Request body
      const requestBody = {
        amount: creditAmount // This is CREDITS, not dollars
      };

      // Create Stripe checkout session for credit purchase
      const response = await fetch('/api/stripe/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        credentials: 'include', // Include cookies for additional auth context
        body: JSON.stringify(requestBody),
      });

      // Log response details
      console.log(`📥 Credit purchase response:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ Credit purchase API error:`, {
          status: response.status,
          error: errorData.error || 'Unknown error',
          timestamp: new Date().toISOString()
        });
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      // Redirect to checkout
      if (url) {
        console.log(`✅ Credit purchase checkout URL created:`, {
          url: url.substring(0, 50) + '...',
          timestamp: new Date().toISOString()
        });
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Credit purchase error:', err);
      setError(`Failed to start checkout process: ${err instanceof Error ? err.message : 'Please try again later.'}`);
    } finally {
      setIsProcessingCredits(false);
    }
  };

  const handleLogout = async () => {
    console.log("🔄 Starting logout process");
    try {
      setLoading(true);
      console.log("🔄 Set loading state to true");

      // Use ApiClient instead of direct Supabase access
      console.log("📤 Calling ApiClient.signOut()");
      const { error } = await ApiClient.signOut();

      if (error) {
        console.error("❌ Error signing out:", error);
        setError("Failed to sign out. Please try again.");
        return;
      }

      console.log("✅ Successfully signed out, redirecting to home page");
      // Redirect to home page
      router.push("/");
    } catch (error) {
      console.error("❌ Error in handleLogout:", error);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      console.log("🔄 Setting loading state to false");
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          {/* Profile Section */}
          {userEmail && (
            <div className="flex justify-between items-start w-full">
              <div className="flex flex-col gap-2">
                <div className={`p-3 rounded-lg flex items-center gap-3 ${theme === "dark" ? "bg-gray-800" : "bg-white shadow-sm"}`}>
                  <div className="flex flex-col">
                    <span className="text-sm opacity-75">Signed in as:</span>
                    <span className="font-medium">{userEmail}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className={`py-2.5 px-6 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2 ${
                    theme === "dark"
                      ? "bg-red-800 hover:bg-red-700 text-white"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Log Out
                    </>
                  )}
                </button>
              </div>
              <div className="flex-1"></div>
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {successMessage && (
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800'}`}>
              {successMessage}
            </div>
          )}

          {error && (
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800'}`}>
              {error}
            </div>
          )}

          {/* Billing & Credits */}
          <div className={`p-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow-md"}`}>
            <h2 className="text-xl font-bold mb-4">Billing & Credits</h2>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Current Plan</h3>
              <div className={`p-4 rounded-lg border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold capitalize">{subscriptionTier} Plan</p>
                    <p className="text-sm opacity-75">
                      {subscriptionTier === 'free'
                        ? '30 credits per day'
                        : subscriptionTier === 'pro'
                          ? '100 credits per day'
                          : '1000 credits per day'}
                    </p>
                    {subscriptionStatus && subscriptionTier !== 'free' && (
                      <p className="text-sm mt-1 capitalize">
                        Status: <span className={`font-medium ${
                          subscriptionStatus === 'active'
                            ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                            : theme === 'dark' ? 'text-red-400' : 'text-red-600'
                        }`}>{subscriptionStatus}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold">
                      {/* Force display tokens regardless of loading state */}
                      {tokens !== null && tokens !== undefined
                        ? tokens
                        : '0'}
                    </p>
                    <p className="text-sm opacity-75">Credits Available</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Credit Purchase for Pro and Ultra subscribers */}
            {subscriptionTier && subscriptionTier !== 'free' && (
              <CreditPurchase
                subscriptionTier={subscriptionTier}
                isLoading={isProcessingCredits}
                onPurchase={handlePurchaseCredits}
              />
            )}
          </div>

          {/* Subscription Plans UNDER DEV */}
          <SubscriptionPlans
            currentPlan={subscriptionTier}
            credits={tokens}
            onSelectPlan={handleSelectPlan}
            isLoading={isUpgrading}
            subscriptionStatus={subscriptionStatus}
          />
        </motion.div>
      </div>
    </div>
  );
}