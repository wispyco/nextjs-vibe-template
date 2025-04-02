import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/payment';
import { SupabaseAdmin } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';
import { AuthService } from '@/lib/auth';

// Simplified request type
interface CheckoutRequestBody {
  tier: 'pro' | 'ultra';
  userId: string;
  userEmail: string;
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  console.log(`🔄 [${requestId}] Starting checkout process`);

  try {
    // 1. First, authenticate the user making the request using cookies
    const cookieStore = cookies();
    const authClient = await AuthService.createServerClient({
      getAll: () => cookieStore.getAll()
    });

    // Get the authenticated user
    const { data: authData, error: authError } = await authClient.auth.getUser();

    if (authError || !authData?.user) {
      console.error(`❌ [${requestId}] Authentication failed:`, authError || 'No authenticated user');
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const authenticatedUserId = authData.user.id;
    const authenticatedUserEmail = authData.user.email || '';
    console.log(`✅ [${requestId}] Authenticated user: ${authenticatedUserId}, Email: ${authenticatedUserEmail}`);

    // 2. Basic request validation
    const body = await req.json() as CheckoutRequestBody;
    const { tier, userId, userEmail } = body;

    if (!tier || !['pro', 'ultra'].includes(tier)) {
      console.error(`❌ [${requestId}] Invalid tier specified: ${tier}`);
      return new NextResponse(
        JSON.stringify({ error: 'Invalid tier specified' }),
        { status: 400 }
      );
    }

    // 3. SECURITY CHECK: Verify that the authenticated user is the same as the requested user
    if (authenticatedUserId !== userId) {
      console.error(`❌ [${requestId}] User ID mismatch: Authenticated user ${authenticatedUserId} tried to access user ${userId}`);
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: You can only manage your own subscription' }),
        { status: 403 }
      );
    }

    console.log(`✅ [${requestId}] User ID verified: Authenticated user matches requested user`);

    // 4. Initialize Supabase client with admin privileges for the actual operations
    const supabase = await SupabaseAdmin.getInstance();

    // Double-check that the user exists (redundant but good for logging)
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userData?.user) {
      console.error(`❌ [${requestId}] User verification failed:`, userError || 'User not found');
      return new NextResponse(
        JSON.stringify({ error: 'User not found' }),
        { status: 404 }
      );
    }

    const user = userData.user;
    console.log(`✅ [${requestId}] User verified: ${user.id}`);

    // Use the authenticated user's email if not provided in the request
    const email = userEmail || authenticatedUserEmail;

    // 5. Get or create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log(`🔄 [${requestId}] Profile not found, creating new profile for user ${user.id}`);

        const { error: createError } = await supabase
          .from('profiles')
          .insert({ id: user.id });

        if (createError) {
          console.error(`❌ [${requestId}] Profile creation error:`, createError);
          return new NextResponse(
            JSON.stringify({ error: 'Failed to create profile' }),
            { status: 500 }
          );
        }

        console.log(`✅ [${requestId}] Created new profile for user ${user.id}`);
      } else {
        console.error(`❌ [${requestId}] Profile error:`, profileError);
        return new NextResponse(
          JSON.stringify({ error: 'Failed to get profile' }),
          { status: 500 }
        );
      }
    }

    // 6. Get or create Stripe customer
    let stripeCustomerId = profile?.stripe_customer_id;

    if (!stripeCustomerId) {
      console.log(`🔄 [${requestId}] No Stripe customer ID found, creating new customer`);

      stripeCustomerId = await PaymentService.getOrCreateCustomer(userId, userEmail);

      // Update profile with new customer ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id);

      if (updateError) {
        console.error(`❌ [${requestId}] Failed to update stripe_customer_id:`, updateError);
      } else {
        console.log(`✅ [${requestId}] Updated profile with new Stripe customer ID: ${stripeCustomerId}`);
      }
    } else {
      console.log(`✅ [${requestId}] Using existing Stripe customer ID: ${stripeCustomerId}`);
    }

    // 7. Create checkout session
    console.log(`🔄 Creating subscription checkout for customer ${stripeCustomerId}, tier: ${tier}`);

    const { url } = await PaymentService.createSubscriptionCheckout(
      stripeCustomerId,
      tier,
      user.id
    );

    if (!url) {
      return new NextResponse(
        JSON.stringify({ error: 'Failed to create checkout session' }),
        { status: 500 }
      );
    }

    console.log(`✅ [${requestId}] Created checkout session with URL: ${url.substring(0, 50)}...`);

    return new NextResponse(
      JSON.stringify({ url }),
      { status: 200 }
    );

  } catch (error) {
    console.error(`❌ [${requestId}] Checkout error:`, error);
    return new NextResponse(
      JSON.stringify({
        error: `Checkout failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }),
      { status: 500 }
    );
  }
}
