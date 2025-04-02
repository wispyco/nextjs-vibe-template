import { NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';

export const runtime = "edge";

/**
 * GET /api/user/profile
 * Returns the current user's profile
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
    
    // Get the user's profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('Error getting user profile:', profileError);
      return NextResponse.json({ 
        error: 'Failed to get profile data' 
      }, { status: 500 });
    }
    
    // Copy cookies from the supabase response to our response
    response = NextResponse.json({ 
      profile 
    }, { status: 200 });

    return response;
  } catch (error) {
    console.error('Error in /api/user/profile:', error);
    return NextResponse.json({ 
      error: 'Failed to get profile data' 
    }, { status: 500 });
  }
}

/**
 * PUT /api/user/profile
 * Updates the current user's profile
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
    const profileData = await request.json();
    
    // Validate the request
    if (!profileData || typeof profileData !== 'object') {
      return NextResponse.json({ 
        error: "Invalid profile data" 
      }, { status: 400 });
    }
    
    // Remove any sensitive fields that shouldn't be updated directly
    const safeProfileData = { ...profileData };
    
    // List of fields that should not be updated directly by the user
    const sensitiveFields = [
      'id', 
      'credits', 
      'stripe_customer_id', 
      'stripe_subscription_id',
      'subscription_period_start',
      'subscription_period_end',
      'subscription_tier',
      'subscription_status',
      'max_monthly_credits'
    ];
    
    // Remove sensitive fields
    sensitiveFields.forEach(field => {
      delete safeProfileData[field];
    });
    
    // Update the user's profile data
    const { error: updateError } = await supabase
      .from('profiles')
      .update(safeProfileData)
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update profile data' 
      }, { status: 500 });
    }
    
    // Get the updated profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('Error getting updated user profile:', profileError);
      return NextResponse.json({ 
        error: 'Profile updated but failed to retrieve updated data' 
      }, { status: 500 });
    }
    
    // Copy cookies from the supabase response to our response
    response = NextResponse.json({ 
      profile,
      message: 'Profile updated successfully'
    }, { status: 200 });

    return response;
  } catch (error) {
    console.error('Error in /api/user/profile:', error);
    return NextResponse.json({ 
      error: 'Failed to update profile data' 
    }, { status: 500 });
  }
} 