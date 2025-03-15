import { NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';

export const runtime = "edge";

/**
 * GET /api/user/credits
 * Returns the current user's credits
 */
export async function GET(request: Request) {
  try {
    // Create a server client that can handle cookies
    let response = NextResponse.next({
      request,
    });

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
          setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          }
        },
      }
    );
    
    // Get the current user from the session
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) {
      return NextResponse.json({ 
        error: "Authentication required" 
      }, { status: 401 });
    }
    
    const user = data.user;
    
    // Get the user's credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('Error getting user credits:', profileError);
      return NextResponse.json({ 
        error: 'Failed to get credits' 
      }, { status: 500 });
    }
    
    // Copy cookies from the supabase response to our response
    response = NextResponse.json({ 
      credits: profile.credits 
    }, { status: 200 });

    return response;
  } catch (error) {
    console.error('Error in /api/user/credits:', error);
    return NextResponse.json({ 
      error: 'Failed to get credits' 
    }, { status: 500 });
  }
}

/**
 * PUT /api/user/credits
 * Updates the current user's credits
 */
export async function PUT(request: Request) {
  try {
    // Create a server client that can handle cookies
    let response = NextResponse.next({
      request,
    });

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
          setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          }
        },
      }
    );
    
    // Get the current user from the session
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) {
      return NextResponse.json({ 
        error: "Authentication required" 
      }, { status: 401 });
    }
    
    const user = data.user;
    
    // Parse the request body
    const body = await request.json();
    const { credits } = body;
    
    if (typeof credits !== 'number' || credits < 0) {
      return NextResponse.json({ 
        error: "Invalid credits value" 
      }, { status: 400 });
    }
    
    // Update the user's credits
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Error updating user credits:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update credits' 
      }, { status: 500 });
    }
    
    // Copy cookies from the supabase response to our response
    response = NextResponse.json({ 
      credits,
      message: 'Credits updated successfully'
    }, { status: 200 });

    return response;
  } catch (error) {
    console.error('Error in /api/user/credits:', error);
    return NextResponse.json({ 
      error: 'Failed to update credits' 
    }, { status: 500 });
  }
} 