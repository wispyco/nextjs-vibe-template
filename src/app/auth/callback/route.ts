import { createClient } from '@/lib/supabase/server-client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Get the user's session to check for GitHub token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.provider_token) {
        // Store the GitHub token in a secure cookie or session
        console.log('GitHub token available:', !!session.provider_token);
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(new URL('/auth/error', requestUrl.origin));
}