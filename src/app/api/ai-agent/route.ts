import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';
import { processAgentRequest } from '@/lib/ai-agent';
import { createOctokit, pushFiles } from '@/lib/github';
import { triggerDeployment } from '@/lib/vercel';

export const runtime = 'edge';

interface AgentRequest {
  projectId: string;
  message: string;
  conversationId?: string;
  clientType?: 'web' | 'mobile';
  autoDeploy?: boolean;
  createPR?: boolean; // Create pull request instead of direct commit
}

interface AgentResponse {
  message: string;
  changes?: Array<{
    file: string;
    action: 'create' | 'update' | 'delete';
    content?: string;
    diff?: string;
  }>;
  preview?: {
    files: Record<string, string>;
    mainFile?: string;
  };
  conversationId: string;
  error?: string;
  deployed?: boolean;
  deploymentUrl?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: AgentRequest = await req.json();
    const { projectId, message, conversationId, clientType = 'web', autoDeploy = false, createPR = false } = body;

    // Validate required fields
    if (!projectId || !message) {
      return NextResponse.json(
        { error: 'Project ID and message are required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get current project files from GitHub
    const octokit = createOctokit();
    let currentFiles: Record<string, string> = {};

    try {
      // Fetch repository contents
      const { data: contents } = await octokit.repos.getContent({
        owner: project.github_owner,
        repo: project.github_name,
        path: '',
      });

      if (Array.isArray(contents)) {
        // Fetch each file's content
        for (const item of contents) {
          if (item.type === 'file') {
            const { data: fileData } = await octokit.repos.getContent({
              owner: project.github_owner,
              repo: project.github_name,
              path: item.path,
            });

            if ('content' in fileData && fileData.content) {
              currentFiles[item.path] = Buffer.from(fileData.content, 'base64').toString('utf-8');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching repository contents:', error);
      // Continue with empty files if repo fetch fails
    }

    // Get or create conversation
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      const { data: conversation, error: convError } = await supabase
        .from('ai_conversations')
        .insert({
          project_id: projectId,
          user_id: user.id,
          metadata: { clientType },
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        // Generate a temporary ID if DB insert fails
        currentConversationId = `temp-${Date.now()}`;
      } else {
        currentConversationId = conversation.id;
      }
    }

    // Store user message
    if (currentConversationId && !currentConversationId.startsWith('temp-')) {
      await supabase
        .from('ai_messages')
        .insert({
          conversation_id: currentConversationId,
          role: 'user',
          content: message,
        });
    }

    // Process the AI agent request
    const agentResult = await processAgentRequest({
      message,
      currentFiles,
      projectName: project.name,
      projectDescription: project.description || '',
      conversationId: currentConversationId,
    });

    // Store AI response
    if (currentConversationId && !currentConversationId.startsWith('temp-')) {
      await supabase
        .from('ai_messages')
        .insert({
          conversation_id: currentConversationId,
          role: 'assistant',
          content: agentResult.message,
          metadata: {
            changes: agentResult.changes,
            preview: agentResult.preview,
          },
        });
    }

    // Apply changes to GitHub repository
    if (agentResult.changes && agentResult.changes.length > 0) {
      try {
        // Prepare files for update
        const updatedFiles = { ...currentFiles };
        
        for (const change of agentResult.changes) {
          if (change.action === 'delete') {
            delete updatedFiles[change.file];
          } else if (change.content) {
            updatedFiles[change.file] = change.content;
          }
        }

        // Handle PR workflow if requested
        if (createPR) {
          const { createBranch, createPullRequest } = await import('@/lib/github');
          
          // Create a feature branch
          const branchName = `ai-agent-${Date.now()}`;
          await createBranch(
            process.env.GH_PAT!,
            { owner: project.github_owner, name: project.github_name },
            branchName,
            'main'
          );
          
          // Push changes to the feature branch
          await pushFiles(
            process.env.GH_PAT!,
            { owner: project.github_owner, name: project.github_name },
            branchName,
            updatedFiles,
            `AI Agent: ${message.substring(0, 50)}...`
          );
          
          // Create pull request
          const prDescription = `## AI Agent Changes\n\n**Request**: ${message}\n\n**Response**: ${agentResult.message}\n\n### Changes Made:\n${
            agentResult.changes?.map(c => `- ${c.file} (${c.action})`).join('\n') || 'No changes'
          }\n\n---\n*This PR was automatically generated by the AI Agent*`;
          
          const pr = await createPullRequest(
            process.env.GH_PAT!,
            { owner: project.github_owner, name: project.github_name },
            `AI Agent: ${message.substring(0, 80)}`,
            branchName,
            'main',
            prDescription
          );
          
          // Store PR info in response
          return NextResponse.json<AgentResponse>({
            message: agentResult.message + `\n\nCreated pull request: ${pr.html_url}`,
            changes: agentResult.changes,
            conversationId: currentConversationId,
            preview: agentResult.preview,
          });
        } else {
          // Direct push to main branch
          await pushFiles(
            process.env.GH_PAT!,
            { owner: project.github_owner, name: project.github_name },
            'main',
            updatedFiles,
            `AI Agent: ${message.substring(0, 50)}...`
          );
        }

        // Auto-deploy for mobile clients or if requested
        if (clientType === 'mobile' || autoDeploy) {
          try {
            const deployment = await triggerDeployment(
              project.name,
              'main',
              project.github_repo.split('/')[1], // repo ID
              project.github_owner,
              project.github_name
            );

            // Store deployment record
            await supabase
              .from('deployments')
              .insert({
                project_id: project.id,
                user_id: user.id,
                deployment_id: deployment.id || `ai-${Date.now()}`,
                deployment_url: deployment.url || `${project.name}.vercel.app`,
                status: 'deploying',
                environment: 'production',
                source: 'ai-agent',
                metadata: {
                  conversationId: currentConversationId,
                  message: message.substring(0, 200),
                },
              });

            return NextResponse.json<AgentResponse>({
              message: agentResult.message,
              changes: agentResult.changes,
              conversationId: currentConversationId,
              deployed: true,
              deploymentUrl: `https://${project.name}.vercel.app`,
            });
          } catch (deployError) {
            console.error('Auto-deployment failed:', deployError);
            // Continue without deployment
          }
        }
      } catch (githubError) {
        console.error('Error applying changes to GitHub:', githubError);
        return NextResponse.json<AgentResponse>({
          message: agentResult.message,
          error: 'Failed to apply changes to repository',
          conversationId: currentConversationId,
        });
      }
    }

    // Return response based on client type
    const response: AgentResponse = {
      message: agentResult.message,
      conversationId: currentConversationId,
    };

    // Include preview for web clients
    if (clientType === 'web' && agentResult.preview) {
      response.preview = agentResult.preview;
      response.changes = agentResult.changes;
    }

    return NextResponse.json<AgentResponse>(response);

  } catch (error) {
    console.error('AI Agent error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI agent request' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve conversation history
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const conversationId = searchParams.get('conversationId');
  const projectId = searchParams.get('projectId');

  if (!conversationId && !projectId) {
    return NextResponse.json(
      { error: 'Conversation ID or Project ID required' },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    if (conversationId) {
      // Get specific conversation
      const { data: messages, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return NextResponse.json({ messages });
    } else if (projectId) {
      // Get all conversations for a project
      const { data: conversations, error } = await supabase
        .from('ai_conversations')
        .select('*, ai_messages(*)')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return NextResponse.json({ conversations });
    }
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation history' },
      { status: 500 }
    );
  }
}