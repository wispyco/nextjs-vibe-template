import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';
import { storeVercelToken } from '@/lib/vercel-tokens';

export const runtime = 'edge';

interface VercelTokenResponse {
  access_token: string;
  token_type: string;
  installation_id?: string;
  user_id?: string;
  team_id?: string | null;
  error?: string;
  error_description?: string;
}

interface VercelUser {
  id: string;
  email: string;
  name: string;
  username: string;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('Vercel OAuth error:', error);
      return NextResponse.redirect(new URL('/settings/vercel?error=oauth_failed', req.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/settings/vercel?error=no_code', req.url));
    }

    // Decode and validate state
    let stateData: { userId: string; timestamp: number } | null = null;
    if (state) {
      try {
        stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        
        // Check if state is not too old (5 minutes)
        if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
          return NextResponse.redirect(new URL('/settings/vercel?error=state_expired', req.url));
        }
      } catch (e) {
        console.error('Invalid state:', e);
      }
    }

    // Exchange code for access token
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const callbackUrl = `${baseUrl}/api/auth/vercel/callback`;

    const tokenResponse = await fetch('https://api.vercel.com/v2/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.VERCEL_CLIENT_ID!,
        client_secret: process.env.VERCEL_CLIENT_SECRET!,
        code,
        redirect_uri: callbackUrl,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(new URL('/settings/vercel?error=token_exchange_failed', req.url));
    }

    const tokenData: VercelTokenResponse = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Vercel token error:', tokenData.error, tokenData.error_description);
      return NextResponse.redirect(new URL('/settings/vercel?error=token_error', req.url));
    }

    // Get user info from Vercel
    const userResponse = await fetch('https://api.vercel.com/v2/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error('Failed to get Vercel user info:', await userResponse.text());
      return NextResponse.redirect(new URL('/settings/vercel?error=user_info_failed', req.url));
    }

    const vercelUser: { user: VercelUser } = await userResponse.json();

    // Check if this is a marketplace installation (has configurationId)
    const configurationId = searchParams.get('configurationId');
    const isMarketplaceFlow = !!configurationId;
    
    if (isMarketplaceFlow) {
      // For marketplace flow, we need to store the token temporarily and redirect to login
      // Create a temporary token storage using cookies
      const tempTokenData = {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type || 'Bearer',
        installation_id: tokenData.installation_id || configurationId || vercelUser.user.id,
        vercel_user_id: vercelUser.user.id,
        vercel_email: vercelUser.user.email,
        team_id: tokenData.team_id || searchParams.get('teamId') || null,
        created_at: new Date().toISOString(),
      };
      
      // Store in a secure cookie temporarily
      const response = NextResponse.redirect(new URL('/auth/login?redirect=/api/auth/vercel/complete', req.url));
      response.cookies.set('vercel_temp_token', btoa(JSON.stringify(tempTokenData)), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes
      });
      
      return response;
    } else {
      // Regular OAuth flow - user should already be authenticated
      try {
        await storeVercelToken({
          access_token: tokenData.access_token,
          token_type: tokenData.token_type || 'Bearer',
          installation_id: tokenData.installation_id || vercelUser.user.id,
          user_id: vercelUser.user.id,
          team_id: tokenData.team_id || null,
          created_at: new Date().toISOString(),
        });
      } catch (dbError) {
        console.error('Failed to save Vercel token:', {
          error: dbError,
          message: dbError instanceof Error ? dbError.message : 'Unknown error',
          stack: dbError instanceof Error ? dbError.stack : undefined
        });
        return NextResponse.redirect(new URL('/settings/vercel?error=save_failed', req.url));
      }
    }

    // Success - redirect to settings or project creation
    return NextResponse.redirect(new URL('/settings/vercel?success=true', req.url));
  } catch (error) {
    console.error('Vercel callback error:', error);
    return NextResponse.redirect(new URL('/settings/vercel?error=unexpected', req.url));
  }
}