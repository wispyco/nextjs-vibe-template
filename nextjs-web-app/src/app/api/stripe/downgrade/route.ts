import { NextRequest, NextResponse } from 'next/server';
import { SupabaseAdmin } from '@/lib/supabase-admin';
import { PaymentService } from '@/lib/payment';
import { cookies } from 'next/headers';
import { AuthService } from '@/lib/auth';
// We're not using these in our fixed version, so removing them to avoid linter errors
// import { cancelSubscription, getSubscription } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  console.log(`🔄 [${requestId}] Starting subscription downgrade process`);

  try {
    // First, authenticate the user making the request using cookies
    const cookieStore = cookies();
    const authClient = await AuthService.createServerClient({
      getAll: () => cookieStore.getAll()
    });

    // Get the authenticated user
    const { data: authData, error: authError } = await authClient.auth.getUser();

    if (authError || !authData?.user) {
      console.error(`❌ [${requestId}] Authentication failed:`, authError || 'No authenticated user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authenticatedUserId = authData.user.id;
    console.log(`✅ [${requestId}] Authenticated user: ${authenticatedUserId}`);

    // Try to get the request body for the user ID
    let body;
    try {
      body = await req.json();
      console.log(`🔍 [${requestId}] Request body:`, body);
    } catch (e) {
      console.error(`❌ [${requestId}] Error parsing request body:`, e);
      body = {};
    }

    // Get user ID from the request body
    const requestedUserId = body?.userId;

    if (!requestedUserId) {
      console.error(`❌ [${requestId}] Missing user ID in request body`);
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    // SECURITY CHECK: Verify that the authenticated user is the same as the requested user
    if (authenticatedUserId !== requestedUserId) {
      console.error(`❌ [${requestId}] User ID mismatch: Authenticated user ${authenticatedUserId} tried to access user ${requestedUserId}`);
      return NextResponse.json({ error: 'Unauthorized: You can only manage your own subscription' }, { status: 403 });
    }

    console.log(`✅ [${requestId}] User ID verified: Authenticated user matches requested user`);

    // Initialize Supabase client with admin privileges for the actual operations
    // This bypasses the need for authentication tokens for database operations
    const supabase = await SupabaseAdmin.getInstance();

    // Double-check that the user exists (redundant but good for logging)
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(requestedUserId);

    if (userError || !userData?.user) {
      console.error(`❌ [${requestId}] User verification failed:`, userError || 'User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userData.user;
    console.log(`✅ [${requestId}] User verified: ${user.id}`);
    console.log(`✅ [${requestId}] User authenticated: ${user.id}`);

    // Use the PaymentService to cancel the subscription
    console.log(`🔄 [${requestId}] Cancelling subscription for user: ${user.id}`);
    const { success, message } = await PaymentService.cancelSubscription(user.id);

    if (!success) {
      console.error(`❌ [${requestId}] Subscription cancellation failed:`, message);
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.log(`✅ [${requestId}] Subscription cancelled successfully`);
    return NextResponse.json({
      success: true,
      message: message || 'Your subscription has been cancelled successfully.'
    });

  } catch (error) {
    console.error(`❌ [${requestId}] Error downgrading subscription:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process downgrade request' },
      { status: 500 }
    );
  }
}