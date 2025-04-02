import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Get the daily credits for a given subscription tier
 */
export function getBaseCreditsForTier(tier: string): number {
  switch (tier.toLowerCase()) {
    case 'free':
      return 30;
    case 'pro':
      return 100;
    case 'ultra':
      return 1000;
    default:
      return 30; // Default to free tier
  }
}

/**
 * Check if a user's credits need to be refreshed and update them if necessary
 * This function is called on key API endpoints to ensure users always have their daily credits
 * without requiring a cron job
 *
 * Credits are refreshed ONLY once per 24-hour period per user, specifically when:
 * 1. The user has never had a refresh before (new user), OR
 * 2. It has been at least 24 hours since the last refresh
 *
 * Note: Credits are NOT refreshed just because they fall below the base amount.
 * Users must wait for the 24-hour period to elapse before getting new credits.
 */
export async function checkAndRefreshCredits(
  supabase: SupabaseClient,
  userId: string
): Promise<{ credits: number; refreshed: boolean }> {
  try {
    console.log(`[Credits] Checking refresh eligibility for user ${userId}`);

    // Use a transaction to ensure atomicity and prevent race conditions
    // First, check if refresh is needed using a SELECT to get the current profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, credits, subscription_tier, last_credit_refresh')
      .eq('id', userId)
      .single();

    if (error) {
      console.error(`[Credits] Error fetching user profile for ${userId}:`, error);
      return { credits: 0, refreshed: false };
    }

    // If the profile doesn't exist, return early
    if (!profile) {
      console.log(`[Credits] No profile found for user ${userId}`);
      return { credits: 0, refreshed: false };
    }

    // Get the base credits for the user's tier
    const baseCredits = getBaseCreditsForTier(profile.subscription_tier || 'free');

    // Get current time and last refresh time
    const now = new Date();
    const lastRefreshTime = profile.last_credit_refresh ? new Date(profile.last_credit_refresh) : null;

    // Calculate time difference in hours since last refresh
    const hoursSinceLastRefresh = lastRefreshTime ?
      (now.getTime() - lastRefreshTime.getTime()) / (1000 * 60 * 60) :
      null;

    // Check individual refresh conditions
    const creditsBelowBase = profile.credits < baseCredits;
    const noLastRefresh = !lastRefreshTime;
    const pastRefreshWindow = hoursSinceLastRefresh !== null && hoursSinceLastRefresh >= 24;

    // Determine if we should refresh based on conditions
    // Refresh ONLY if:
    // 1. No previous refresh has happened (new user), OR
    // 2. Last refresh was more than 24 hours ago
    //
    // Note: We no longer refresh just because credits are below base amount
    // This ensures refreshes happen at most once per 24 hours
    const shouldRefresh = noLastRefresh || pastRefreshWindow;

    // Log the refresh decision details with individual conditions
    console.log(`[Credits] Refresh decision for user ${userId}:`, {
      currentCredits: profile.credits,
      baseCredits,
      lastRefreshTime: lastRefreshTime?.toISOString() || 'never',
      hoursSinceLastRefresh: hoursSinceLastRefresh !== null ? hoursSinceLastRefresh.toFixed(2) : 'N/A',
      conditions: {
        creditsBelowBase,
        noLastRefresh,
        pastRefreshWindow
      },
      shouldRefresh
    });

    if (shouldRefresh) {
      try {
        // Use an atomic update with a condition to prevent race conditions
        // This ensures that if multiple requests come in at the same time, only one will succeed
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({
            credits: baseCredits,
            last_credit_refresh: now.toISOString()
          })
          .eq('id', userId)
          .eq('last_credit_refresh', profile.last_credit_refresh) // Optimistic concurrency control
          .select('credits')
          .single();

        if (updateError) {
          console.error(`[Credits] Error updating credits for user ${userId}:`, updateError);
          // If update failed due to concurrency, get the latest profile
          const { data: latestProfile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();

          console.log(`[Credits] Concurrent update detected for user ${userId}, using latest profile`);
          return {
            credits: latestProfile?.credits || profile.credits,
            refreshed: false
          };
        }

        console.log(`[Credits] Successfully refreshed credits for user ${userId} to ${baseCredits}`);

        // Add entry to credit history table for audit trail
        await supabase
          .from('credit_history')
          .insert({
            user_id: userId,
            amount: baseCredits,
            type: 'daily_reset',
            description: `Daily credit reset for ${profile.subscription_tier} tier`
          });

        return {
          credits: updatedProfile.credits,
          refreshed: true
        };
      } catch (err) {
        console.error(`[Credits] Error refreshing credits for user ${userId}:`, err);
        return { credits: profile.credits, refreshed: false };
      }
    }

    // No refresh needed
    console.log(`[Credits] No refresh needed for user ${userId}`);
    return {
      credits: profile.credits,
      refreshed: false
    };
  } catch (err) {
    console.error(`[Credits] Unexpected error in checkAndRefreshCredits for user ${userId}:`, err);
    return { credits: 0, refreshed: false };
  }
}