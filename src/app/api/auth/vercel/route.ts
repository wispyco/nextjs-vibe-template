import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/auth-server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      // Redirect to login first
      return NextResponse.redirect(new URL('/auth/login?redirect=/api/auth/vercel', req.url));
    }

    // Get the callback URL from environment or construct it
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const callbackUrl = `${baseUrl}/api/auth/vercel/callback`;
    
    // Store state in URL for security (could also use cookies)
    const state = Buffer.from(JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
    })).toString('base64');

    // Construct Vercel Integration OAuth URL
    const params = new URLSearchParams({
      client_id: process.env.VERCEL_CLIENT_ID!,
      redirect_uri: callbackUrl,
      scope: 'read:projects write:projects read:deployments write:deployments offline_access',
      state,
    });

    // Use the standard OAuth authorize endpoint for Integrations
    const vercelAuthUrl = `https://vercel.com/oauth/authorize?${params.toString()}`;

    return NextResponse.redirect(vercelAuthUrl);
  } catch (error) {
    console.error('Vercel OAuth initiation error:', error);
    return NextResponse.redirect(new URL('/auth/error?message=Failed to start Vercel authentication', req.url));
  }
}