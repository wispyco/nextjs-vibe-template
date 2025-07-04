import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        details: authError?.message 
      }, { status: 401 });
    }

    // Check for stored tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('vercel_tokens')
      .select('*')
      .eq('user_id', user.id);

    if (tokenError) {
      return NextResponse.json({ 
        error: 'Failed to check tokens',
        details: tokenError.message 
      }, { status: 500 });
    }

    // Try to get user info from Vercel if we have a token
    let vercelUser = null;
    if (tokens && tokens.length > 0) {
      const token = tokens[0];
      try {
        // Decrypt the token (simplified for edge runtime)
        const decryptedToken = atob(token.encrypted_token);
        
        const response = await fetch('https://api.vercel.com/v2/user', {
          headers: {
            'Authorization': `Bearer ${decryptedToken}`,
          },
        });
        
        if (response.ok) {
          vercelUser = await response.json();
        }
      } catch (error) {
        console.error('Error fetching Vercel user:', error);
      }
    }

    return NextResponse.json({
      hasToken: tokens && tokens.length > 0,
      tokenCount: tokens?.length || 0,
      tokenInfo: tokens && tokens.length > 0 ? {
        createdAt: tokens[0].created_at,
        installationId: tokens[0].installation_id,
        teamId: tokens[0].team_id,
        userId: tokens[0].vercel_user_id,
      } : null,
      vercelUser: vercelUser ? {
        id: vercelUser.user?.id,
        email: vercelUser.user?.email,
        username: vercelUser.user?.username,
        name: vercelUser.user?.name,
      } : null,
      authFlow: tokens && tokens.length > 0 ? 
        (tokens[0].installation_id ? 'OAuth Integration' : 'Direct Token') : 
        'Not Connected'
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}