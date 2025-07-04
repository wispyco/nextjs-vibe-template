import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';
import { storeVercelToken } from '@/lib/vercel-tokens';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    // Check if user is now authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.redirect(new URL('/auth/login?redirect=/api/auth/vercel/complete', req.url));
    }

    // Get the temporary token from cookie
    const tempTokenCookie = req.cookies.get('vercel_temp_token');
    if (!tempTokenCookie) {
      return NextResponse.redirect(new URL('/settings/vercel?error=no_temp_token', req.url));
    }

    try {
      // Decode the temporary token data
      const tempTokenData = JSON.parse(atob(tempTokenCookie.value));
      
      // Store the token properly now that we have an authenticated user
      await storeVercelToken({
        access_token: tempTokenData.access_token,
        token_type: tempTokenData.token_type,
        installation_id: tempTokenData.installation_id,
        user_id: tempTokenData.vercel_user_id,
        team_id: tempTokenData.team_id,
        created_at: tempTokenData.created_at,
      });

      // Clear the temporary token cookie
      const response = NextResponse.redirect(new URL('/settings/vercel?success=true', req.url));
      response.cookies.delete('vercel_temp_token');
      
      return response;
    } catch (error) {
      console.error('Failed to process temporary token:', error);
      return NextResponse.redirect(new URL('/settings/vercel?error=token_processing_failed', req.url));
    }
  } catch (error) {
    console.error('Vercel complete error:', error);
    return NextResponse.redirect(new URL('/settings/vercel?error=unexpected', req.url));
  }
}