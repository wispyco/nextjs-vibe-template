import { NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { checkAndRefreshCredits } from '@/lib/credits';

// Use Edge runtime to avoid cookie handling issues
export const runtime = "edge";

/**
 * GET /api/auth/user
 * Returns the current authenticated user
 */
export async function GET(request: Request) {
  try {
    // Create a response object
    const response = NextResponse.next();

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

    // Get the current user from the session
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      // Clear any existing auth cookies on error
      const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^\.]+)\./)?.[1] || '';
      const supabaseCookieName = projectRef ? `sb-${projectRef}-auth-token` : 'sb-auth-token';

      // Create an error response
      return new Response(JSON.stringify({
        authenticated: false,
        user: null
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
    }

    const user = data.user;

    // Get the user's profile data using the admin client
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error getting user profile:', profileError);

      // Create an error response
      return new Response(JSON.stringify({
        authenticated: true,
        user,
        profile: null,
        error: 'Failed to get profile data'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Check if the user's credits need to be refreshed
    // This will automatically refresh credits if needed
    const { credits, refreshed } = await checkAndRefreshCredits(supabase, user.id);

    // If credits were refreshed, update the profile object
    if (refreshed) {
      console.log(`Credits refreshed for user ${user.id}. New balance: ${credits}`);
      profile.credits = credits;
      profile.last_credit_refresh = new Date().toISOString();
    }

    // Create a success response
    return new Response(JSON.stringify({
      authenticated: true,
      user,
      profile,
      credits_refreshed: refreshed
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in /api/auth/user:', error);

    // Clear any existing auth cookies on error
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^\.]+)\./)?.[1] || '';
    const supabaseCookieName = projectRef ? `sb-${projectRef}-auth-token` : 'sb-auth-token';

    // Create an error response
    return new Response(JSON.stringify({
      authenticated: false,
      user: null,
      error: 'Failed to get user data'
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