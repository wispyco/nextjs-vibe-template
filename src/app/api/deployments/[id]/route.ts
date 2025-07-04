import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';
import { getDeploymentStatus } from '@/lib/vercel';

export const runtime = 'edge';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get deployment from database
    const { data: deployment, error } = await supabase
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
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !deployment) {
      return NextResponse.json(
        { error: 'Deployment not found' },
        { status: 404 }
      );
    }

    // If deployment is still pending/building, check Vercel for updates
    if (deployment.status === 'pending' || deployment.status === 'building') {
      try {
        const vercelDeployment = await getDeploymentStatus(deployment.deployment_id);
        
        // Update deployment status if changed
        if (vercelDeployment.state !== deployment.status) {
          const newStatus = vercelDeployment.state.toLowerCase();
          const { error: updateError } = await supabase
            .from('deployments')
            .update({
              status: newStatus,
              metadata: {
                ...deployment.metadata,
                vercel_deployment: vercelDeployment,
              },
              ...(newStatus === 'ready' && { completed_at: new Date().toISOString() }),
              ...(newStatus === 'error' && { 
                error_message: vercelDeployment.meta?.error || 'Deployment failed',
                completed_at: new Date().toISOString()
              }),
            })
            .eq('id', id);

          if (!updateError) {
            deployment.status = newStatus;
            deployment.metadata = {
              ...deployment.metadata,
              vercel_deployment: vercelDeployment,
            };
          }
        }
      } catch (vercelError) {
        console.error('Failed to check Vercel status:', vercelError);
      }
    }

    return NextResponse.json({ deployment });
  } catch (error) {
    console.error('Deployment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}