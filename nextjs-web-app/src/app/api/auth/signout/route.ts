import { NextResponse } from "next/server";

export const runtime = "edge";

/**
 * POST /api/auth/signout
 * Signs out the current user
 */
export async function POST() {
  try {
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
    
    return response;
  } catch (error) {
    console.error('Error in /api/auth/signout:', error);
    return NextResponse.json({ 
      error: 'Failed to sign out' 
    }, { status: 500 });
  }
} 