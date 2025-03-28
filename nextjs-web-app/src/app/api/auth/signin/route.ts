import { NextResponse } from "next/server";
import { SupabaseAdmin } from '@/lib/supabase-admin';

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
    
    // Get the Supabase admin client
    const supabase = SupabaseAdmin.getInstance();
    
    // Sign in the user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('❌ Error signing in:', error);
      return NextResponse.json({ 
        error: error.message 
      }, { status: 401 });
    }
    
    console.log('✅ User signed in successfully:', {
      userId: data.user?.id,
      email: data.user?.email,
      timestamp: new Date().toISOString(),
      action: 'signInWithPassword'
    });
    
    // Create a response with the session data
    const response = NextResponse.json({ 
      user: data.user,
      session: {
        // Only return non-sensitive session info
        expires_at: data.session?.expires_at,
        expires_in: data.session?.expires_in,
      }
    }, { status: 200 });
    
    // Set the session cookies on the response
    if (data.session) {
      response.cookies.set('sb-access-token', data.session.access_token, {
        path: '/',
        maxAge: data.session.expires_in,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      
      response.cookies.set('sb-refresh-token', data.session.refresh_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }
    
    return response;
  } catch (error) {
    console.error('Error in /api/auth/signin:', error);
    return NextResponse.json({ 
      error: 'Failed to sign in' 
    }, { status: 500 });
  }
} 