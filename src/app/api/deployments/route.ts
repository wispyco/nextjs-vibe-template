import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const projectId = searchParams.get('project_id');
    const status = searchParams.get('status');

    // Build query
    let query = supabase
      .from('deployments')
      .select(`
        *,
        project:projects (
          id,
          name,
          github_repo,
          github_url,
          vercel_project_name
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add filters if provided
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: deployments, error } = await query;

    if (error) {
      console.error('Failed to fetch deployments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch deployments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      deployments: deployments || [],
      total: deployments?.length || 0,
    });
  } catch (error) {
    console.error('Deployments API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}