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



    // Get the current user from the request cookies
    const { data: { user }, error: authError } = await supabase.auth.getUser();


    if (authError || !user) {

      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user's credits from the database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();



    if (profileError || !profile) {
      console.error('POST /api/check-auth: Error fetching user profile:', profileError);
      return NextResponse.json({ error: 'Failed to check credits' }, { status: 500 });
    }

    // Check if user has enough credits
    const body = await request.json();
    let numGenerations = body.numGenerations || 1; // Default to 1 if not specified

    // Ensure numGenerations is within valid range (1-99)
    numGenerations = Math.min(99, Math.max(1, numGenerations));



    if ((profile.credits as number) < numGenerations) {

      return NextResponse.json({
        error: 'Insufficient credits',
        required: numGenerations,
        available: profile.credits
      }, { status: 402 });
    }


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