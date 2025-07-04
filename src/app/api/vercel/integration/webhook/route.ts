import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';
import { deleteVercelToken } from '@/lib/vercel-tokens';

export const runtime = 'edge';

interface IntegrationWebhookPayload {
  type: 'integration-configuration.removed' | 'integration-configuration.scope-change-request';
  teamId?: string | null;
  userId: string;
  configuration: {
    id: string;
    ownerId: string;
    teamId?: string | null;
    projects: string[];
  };
}

export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature (optional but recommended)
    const webhookSecret = process.env.VERCEL_INTEGRATION_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers.get('x-vercel-signature');
      if (!signature) {
        return NextResponse.json({ error: 'No signature' }, { status: 401 });
      }
      // TODO: Implement signature verification
    }

    const payload: IntegrationWebhookPayload = await req.json();
    
    // Handle different webhook types
    switch (payload.type) {
      case 'integration-configuration.removed':
        // User uninstalled the integration - clean up their data
        await handleIntegrationRemoved(payload);
        break;
        
      case 'integration-configuration.scope-change-request':
        // User requested different permissions
        console.log('Scope change requested:', payload);
        // You might want to notify the user or update their permissions
        break;
        
      default:
        console.log('Unknown webhook type:', payload.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Integration webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleIntegrationRemoved(payload: IntegrationWebhookPayload) {
  const supabase = await createClient();
  
  // Find user by Vercel user ID or team ID
  const { data: tokens } = await supabase
    .from('vercel_tokens')
    .select('user_id')
    .or(`vercel_user_id.eq.${payload.userId},vercel_team_id.eq.${payload.teamId}`)
    .limit(1);
    
  if (tokens && tokens.length > 0) {
    // Delete the user's Vercel token
    const { error } = await supabase
      .from('vercel_tokens')
      .delete()
      .eq('user_id', tokens[0].user_id);
      
    if (error) {
      console.error('Failed to delete Vercel token:', error);
    }
    
    // Clean up any related data (projects, deployments, etc.)
    // This depends on your data model
    console.log(`Cleaned up data for user ${tokens[0].user_id}`);
  }
}