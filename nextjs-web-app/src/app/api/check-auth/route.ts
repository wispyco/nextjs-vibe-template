import { NextResponse } from "next/server";
import { SupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = "edge";

export async function GET() {
  try {
    // Create a server client with the admin service
    const supabase = await SupabaseAdmin.getInstance();
    
    // Get the current user from the request cookies
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    return NextResponse.json({ 
      authenticated: true, 
      userId: data.user.id 
    }, { status: 200 });
  } catch (error) {
    console.error('Error checking auth:', error);
    return NextResponse.json({ 
      authenticated: false, 
      error: 'Failed to check authentication status' 
    }, { status: 500 });
  }
} 