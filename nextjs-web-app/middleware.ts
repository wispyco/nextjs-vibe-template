import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Log the request URL and cookies for debugging
  const requestCookies = request.cookies.getAll();
  console.log('🔍 [SERVER] Middleware processing request for:', request.nextUrl.pathname);
  console.log('🍪 [SERVER] Cookies in request:', requestCookies.map(c => c.name).join(', '));

  // Create a response object that we'll modify and return
  let response = NextResponse.next({
    request: request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          console.log(`🍪 [SERVER] Setting cookie in middleware: ${name}`);
          response.cookies.set(name, value, options);
        },
        remove(name, options) {
          console.log(`🍪 [SERVER] Removing cookie in middleware: ${name}`);
          response.cookies.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  )

  // Refresh the session to ensure it doesn't expire
  // This is important to maintain the user's session across requests
  try {
    const { data: { session } } = await supabase.auth.getSession();

    // If we have a session, ensure the cookies are properly set
    if (session) {
      console.log('🔄 [SERVER] Session refreshed in middleware');

      // Get the project reference from the Supabase URL
      const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^\.]+)\./)?.[1] || '';
      const supabaseCookieName = projectRef ? `sb-${projectRef}-auth-token` : 'sb-auth-token';

      // Check if the cookie exists and is valid
      const supabaseCookie = request.cookies.get(supabaseCookieName);
      if (!supabaseCookie) {
        console.log('🍪 [SERVER] Setting missing Supabase cookie in middleware');

        // Create the cookie value (JSON stringified session data)
        const supabaseCookieValue = JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
        });

        // Set the Supabase cookie
        response.cookies.set(supabaseCookieName, supabaseCookieValue, {
          path: '/',
          maxAge: session.expires_in,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });
      }
    }
  } catch (e) {
    console.error('Error refreshing session in middleware:', e);

    // If there's an error with the session, clear all auth cookies
    // This helps prevent issues with corrupted or invalid cookies
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^\.]+)\./)?.[1] || '';
    const supabaseCookieName = projectRef ? `sb-${projectRef}-auth-token` : 'sb-auth-token';

    response.cookies.set(supabaseCookieName, '', { maxAge: 0, path: '/' });
    response.cookies.set('sb-access-token', '', { maxAge: 0, path: '/' });
    response.cookies.set('sb-refresh-token', '', { maxAge: 0, path: '/' });

    console.log('🧹 [SERVER] Cleared auth cookies due to session error');
  }

  return response;

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Block direct access to Supabase endpoints from the client
  // This prevents security issues where users could bypass the API layer
  if (request.nextUrl.pathname.startsWith('/.supabase')) {
    return NextResponse.json(
      { error: 'Direct access to Supabase endpoints is not allowed' },
      { status: 403 }
    );
  }

  // Redirect unauthenticated users to login page
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/api/auth') &&
    request.nextUrl.pathname !== '/'
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: We must return the response object that was modified by the setAll method
  // This ensures that all cookies set by Supabase are properly included in the response
  // and sent back to the client

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}