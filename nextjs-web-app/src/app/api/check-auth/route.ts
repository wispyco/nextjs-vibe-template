import { NextResponse } from "next/server";
import { SupabaseAdmin } from '@/lib/supabase-admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

export async function POST(request: Request) {
  try {
    console.log('POST /api/check-auth: Starting request');
    
    // Create a server client with cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    console.log('POST /api/check-auth: Supabase client created');
    
    // Get the current user from the request cookies
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('POST /api/check-auth: Auth check result:', { user: !!user, error: authError });
    
    if (authError || !user) {
      console.log('POST /api/check-auth: No authenticated user found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user's credits from the database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    console.log('POST /api/check-auth: Profile check result:', { 
      profile: profile ? 'found' : 'not found',
      credits: profile?.credits,
      error: profileError 
    });

    if (profileError || !profile) {
      console.error('POST /api/check-auth: Error fetching user profile:', profileError);
      return NextResponse.json({ error: 'Failed to check credits' }, { status: 500 });
    }

    // Check if user has enough credits
    const body = await request.json();
    const numGenerations = body.numGenerations || 1; // Default to 1 if not specified
    
    console.log('POST /api/check-auth: Credit check:', {
      required: numGenerations,
      available: profile.credits,
      sufficient: (profile.credits as number) >= numGenerations
    });
    
    if ((profile.credits as number) < numGenerations) {
      console.log('POST /api/check-auth: Insufficient credits');
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    console.log('POST /api/check-auth: Success, returning response');
    return NextResponse.json({ 
      success: true,
      credits: profile.credits,
      userId: user.id 
    }, { status: 200 });
  } catch (error) {
    console.error('POST /api/check-auth: Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 