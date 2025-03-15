import { NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';

export const runtime = "edge";

/**
 * GET /api/auth/user
 * Returns the current authenticated user
 */
export async function GET(request: Request) {
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
          setAll(cookiesToSet) {
            const response = NextResponse.next({
              request,
            });
            
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
            
            return response;
          }
        },
      }
    );
    
    // Get the current user from the session
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) {
      return NextResponse.json({ 
        authenticated: false,
        user: null
      }, { status: 401 });
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
      return NextResponse.json({ 
        authenticated: true,
        user,
        profile: null,
        error: 'Failed to get profile data'
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      authenticated: true,
      user,
      profile
    }, { status: 200 });
  } catch (error) {
    console.error('Error in /api/auth/user:', error);
    return NextResponse.json({ 
      authenticated: false,
      user: null,
      error: 'Failed to get user data'
    }, { status: 500 });
  }
} 