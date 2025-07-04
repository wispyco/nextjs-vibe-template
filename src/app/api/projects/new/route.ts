import { NextRequest, NextResponse } from 'next/server';
import { createFromTemplate } from '@/lib/github';
import { getGitHubToken, getCurrentUser } from '@/lib/supabase/auth-server';
import { createClient } from '@/lib/supabase/server-client';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    // Get the current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the GitHub token
    const githubToken = await getGitHubToken();
    if (!githubToken) {
      return NextResponse.json(
        { error: 'GitHub authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { 
      name, 
      description,
      isPrivate = true,
      templateOwner,
      templateRepo,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    // Generate a unique project ID
    const projectId = nanoid();

    // Get the GitHub username from user metadata
    const githubUsername = user.user_metadata?.user_name || user.email?.split('@')[0];
    if (!githubUsername) {
      return NextResponse.json(
        { error: 'GitHub username not found' },
        { status: 400 }
      );
    }

    // Create the repository from template
    const repo = await createFromTemplate(
      githubUsername,
      name,
      isPrivate,
      templateOwner,
      templateRepo
    );

    // Store project in Supabase
    const supabase = await createClient();
    const { data: project, error: dbError } = await supabase
      .from('projects')
      .insert({
        id: projectId,
        user_id: user.id,
        name: name,
        description: description || '',
        github_repo: repo.full_name,
        github_owner: repo.owner.login,
        github_name: repo.name,
        github_url: repo.html_url,
        is_private: isPrivate,
        status: 'created',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save project' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      project: {
        id: projectId,
        name: project.name,
        githubUrl: project.github_url,
        status: project.status,
      },
      repository: {
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        htmlUrl: repo.html_url,
        cloneUrl: repo.clone_url,
        defaultBranch: repo.default_branch,
      },
    });
  } catch (error) {
    console.error('Create project error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}