import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';

export async function POST(req: NextRequest) {
  try {
    // Get current user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { token } = await req.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Validate the token by making a test API call
    const validationResponse = await fetch('https://api.vercel.com/v2/user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!validationResponse.ok) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }

    const vercelUser = await validationResponse.json();

    // Store the token in Supabase
    const { error: dbError } = await supabase
      .from('vercel_tokens')
      .upsert({
        user_id: user.id,
        access_token: token,
        token_type: 'Bearer',
        vercel_user_id: vercelUser.user.id,
        vercel_username: vercelUser.user.username,
        vercel_email: vercelUser.user.email,
        vercel_team_id: vercelUser.user.teamId || null,
        is_pat: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (dbError) {
      console.error('Failed to save Vercel PAT:', dbError);
      return NextResponse.json(
        { error: 'Failed to save token' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: vercelUser.user.id,
        username: vercelUser.user.username,
        email: vercelUser.user.email,
      },
    });
  } catch (error) {
    console.error('PAT validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate token' },
      { status: 500 }
    );
  }
}

// Delete PAT (disconnect Vercel)
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from('vercel_tokens')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to delete Vercel token:', error);
      return NextResponse.json(
        { error: 'Failed to disconnect' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete token error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}