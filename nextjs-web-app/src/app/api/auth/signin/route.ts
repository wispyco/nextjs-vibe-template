import { NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';

// Use Edge runtime to avoid cookie handling issues
export const runtime = "edge";

/**
 * POST /api/auth/signin
 * Signs in a user with email and password
 */
export async function POST(request: Request) {
  try {
    // Parse the request body
    const { email, password } = await request.json();

    // Validate the request
    if (!email || !password) {
      return NextResponse.json({
        error: "Email and password are required"
      }, { status: 400 });
    }

    // Create a response object for cookie handling
    const response = NextResponse.json({}, { status: 200 });

    // Create a server client with cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return request.headers.get('cookie')?.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`))?.[2] || null;
          },
          set(name, value, options) {
            // Set cookies on the response
            const cookieValue = `${name}=${value}; path=${options?.path || '/'}; max-age=${options?.maxAge || 31536000}`;
            response.headers.append('Set-Cookie', cookieValue);
          },
          remove(name, options) {
            // Remove cookies by setting expiry to past date
            const cookieValue = `${name}=; path=${options?.path || '/'}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            response.headers.append('Set-Cookie', cookieValue);
          },
        },
      }
    );

    // Sign in the user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Error signing in:', error);

      // Clear any existing auth cookies on failed login
      const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^\.]+)\./)?.[1] || '';
      const supabaseCookieName = projectRef ? `sb-${projectRef}-auth-token` : 'sb-auth-token';

      // Create an error response
      const errorResponse = new Response(JSON.stringify({
        error: error.message
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          // Clear all auth-related cookies
          'Set-Cookie': [
            `${supabaseCookieName}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
            `sb-access-token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
            `sb-refresh-token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`
          ]
        }
      });

      return errorResponse;
    }

    console.log('✅ User signed in successfully:', {
      userId: data.user?.id,
      email: data.user?.email,
      timestamp: new Date().toISOString(),
      action: 'signInWithPassword'
    });

    // Create a response with the session data
    const responseData = {
      user: data.user,
      session: {
        // Only return non-sensitive session info
        expires_at: data.session?.expires_at,
        expires_in: data.session?.expires_in,
      }
    };

    // Log the session data for debugging
    console.log('\n\n[SERVER] Session data for debugging:', {
      userId: data.user?.id,
      email: data.user?.email,
      sessionId: data.session?.id,
      expiresAt: data.session?.expires_at,
      expiresIn: data.session?.expires_in,
    });

    // Update the response with the session data
    response.headers.set('Content-Type', 'application/json');
    const responseBody = JSON.stringify({
      user: data.user,
      session: {
        // Only return non-sensitive session info
        expires_at: data.session?.expires_at,
        expires_in: data.session?.expires_in,
      }
    });

    // Create a new response with the updated body and headers
    const finalResponse = new Response(responseBody, {
      status: 200,
      headers: response.headers
    });

    return finalResponse;
  } catch (error) {
    console.error('Error in /api/auth/signin:', error);

    // Clear any existing auth cookies on error
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^\.]+)\./)?.[1] || '';
    const supabaseCookieName = projectRef ? `sb-${projectRef}-auth-token` : 'sb-auth-token';

    // Create an error response
    return new Response(JSON.stringify({
      error: 'Failed to sign in'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        // Clear all auth-related cookies
        'Set-Cookie': [
          `${supabaseCookieName}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
          `sb-access-token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
          `sb-refresh-token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        ]
      }
    });
  }
}