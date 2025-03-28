import { NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';

export const runtime = "edge";

/**
 * POST /api/auth/signout
 * Signs out the current user
 */
export async function POST(request: Request) {
  try {
    // Create a server client that can handle cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const cookie = request.headers.get('cookie') || '';
            return cookie.split(';').map(cookie => {
              const [name, ...rest] = cookie.split('=');
              return {
                name: name.trim(),
                value: rest.join('='),
              };
            });
          },
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          setAll(_cookiesToSet) {
            // This function is needed for createServerClient but
            // we might not need to set any cookies during sign-out
            // beyond clearing the existing ones.
            // Prefixing the parameter with _ indicates it's intentionally unused.
          }
        },
      }
    );

    // Sign out the user from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out from Supabase:', error);
      return NextResponse.json({ 
        error: 'Failed to sign out from Supabase'
      }, { status: 500 });
    }

    // Create a response
    const response = NextResponse.json({ 
      success: true 
    }, { status: 200 });
    
    // Clear the auth cookies
    response.cookies.set('sb-access-token', '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    
    response.cookies.set('sb-refresh-token', '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    console.log('✅ User signed out successfully and cookies cleared.');
    
    return response;
  } catch (error) {
    console.error('❌ Error in /api/auth/signout:', error);
    return NextResponse.json({ 
      error: 'Failed to sign out' 
    }, { status: 500 });
  }
} 