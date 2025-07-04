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
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    // Build query
    let query = supabase
      .from('projects')
      .select(`
        *,
        deployments (
          id,
          deployment_id,
          deployment_url,
          status,
          environment,
          created_at,
          completed_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error('Failed to fetch projects:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    // Sort deployments by created_at for each project
    const projectsWithSortedDeployments = projects?.map(project => ({
      ...project,
      deployments: project.deployments?.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ) || []
    }));

    return NextResponse.json({
      projects: projectsWithSortedDeployments || [],
      total: projects?.length || 0,
    });
  } catch (error) {
    console.error('Projects API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}