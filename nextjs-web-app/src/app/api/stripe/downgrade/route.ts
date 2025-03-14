import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/payment';
import { createServerClient } from '@supabase/ssr';
import { AuthService } from '@/lib/auth';
import type { Database } from '@/types/supabase';
// We're not using these in our fixed version, so removing them to avoid linter errors
// import { cancelSubscription, getSubscription } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting subscription downgrade process');
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      console.error('No Authorization header found');
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }
    
    // Extract the token (removing 'Bearer ' prefix if present)
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;
    
    // Initialize Supabase client with the token for auth checks
    const response = NextResponse.next();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
    
    // Check if user is authenticated
    console.log('Verifying user authentication');
    const { data, error: userError } = await supabase.auth.getUser();

    if (userError || !data.user) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = data.user;
    console.log(`User authenticated: ${user.id}`);

    // Use admin client for database operations
    const adminClient = await AuthService.createAdminClient();

    // Get user profile to verify subscription status
    console.log('Fetching user profile');
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('subscription_tier, subscription_status, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    if (!profile) {
      console.error('No profile found for user:', user.id);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    console.log(`Profile found: tier=${profile.subscription_tier}, status=${profile.subscription_status}`);

    // Verify user has a paid subscription tier
    if (profile.subscription_tier === 'free') {
      console.error(`Cannot downgrade: already on free tier`);
      return NextResponse.json(
        { error: 'Your account is already on the free tier' },
        { status: 400 }
      );
    }

    // If there's no Stripe customer ID, directly update the profile
    if (!profile.stripe_customer_id) {
      console.log('No Stripe customer ID found. Directly updating profile to free tier.');
      
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({
          subscription_tier: 'free',
          subscription_status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
        
      if (updateError) {
        console.error('Error updating profile:', updateError);
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
      }
      
      // Add to subscription history
      try {
        const { error: historyError } = await adminClient
          .from('subscription_history')
          .insert({
            user_id: user.id,
            subscription_tier: 'free',
            status: 'canceled',
            created_at: new Date().toISOString(),
          });
          
        if (historyError) {
          console.error('Error recording subscription history:', historyError);
        }
      } catch (error) {
        console.error('Error recording subscription history:', error);
      }
      
      console.log('Successfully downgraded account to free tier');
      return NextResponse.json({ 
        success: true,
        message: 'Your subscription has been cancelled successfully. Your account has been downgraded to the free tier.'
      });
    }

    // For users with a Stripe customer ID, use the PaymentService to cancel the subscription
    console.log('Cancelling subscription via PaymentService');
    const { success, message } = await PaymentService.cancelSubscription(user.id);

    if (!success) {
      console.error('Failed to cancel subscription:', message);
      return NextResponse.json({ error: message }, { status: 400 });
    }
    
    console.log('Subscription cancelled successfully');
    return NextResponse.json({ 
      success: true,
      message: message || 'Your subscription has been cancelled successfully.'
    });
    
  } catch (error) {
    console.error('Unhandled error in downgrade process:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process downgrade request' },
      { status: 500 }
    );
  }
} 