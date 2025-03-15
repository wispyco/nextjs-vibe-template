import { NextResponse } from 'next/server';
import { SupabaseAdmin } from '@/lib/supabase-admin';
import { PaymentService } from '@/lib/payment';
// We're not using these in our fixed version, so removing them to avoid linter errors
// import { cancelSubscription, getSubscription } from '@/lib/stripe';

export async function POST() {
  try {
    // Initialize Supabase client with admin privileges
    const supabase = await SupabaseAdmin.getInstance();
    
    // Get the current user from the request cookies
    const { data, error: userError } = await supabase.auth.getUser();

    if (userError || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = data.user;

    // Use the PaymentService to cancel the subscription
    const { success, message } = await PaymentService.cancelSubscription(user.id);

    if (!success) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: message || 'Your subscription has been cancelled successfully.'
    });
    
  } catch (error) {
    console.error('Error downgrading subscription:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process downgrade request' },
      { status: 500 }
    );
  }
} 