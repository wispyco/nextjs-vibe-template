import { NextResponse } from 'next/server';
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { agentSystemPrompt } from '@/lib/agentSystemPrompt';
import { writeFs, applyPatchToFile, shell, gitCommit, gitPush } from '@/lib/repoTools';

// Using Node.js runtime for file system and git operations
// export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const stream = await streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages,
      system: agentSystemPrompt,
      tools: {
        create_file: {
          description: 'Create a new file with content',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'File path' },
              content: { type: 'string', description: 'File content' }
            },
            required: ['path', 'content']
          },
          execute: async ({ path, content }) => writeFs(path, content)
        },
        patch_file: {
          description: 'Apply RFC 6902 patch to a file',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'File path' },
              patch: { type: 'array', description: 'RFC 6902 patch operations' }
            },
            required: ['path', 'patch']
          },
          execute: async ({ path, patch }) => applyPatchToFile(path, patch)
        },
        run_command: {
          description: 'Run a shell command',
          parameters: {
            type: 'object',
            properties: {
              cmd: { type: 'string', description: 'Command to run' }
            },
            required: ['cmd']
          },
          execute: async ({ cmd }) => shell(cmd)
        },
        git_commit: {
          description: 'Create a git commit',
          parameters: {
            type: 'object',
            properties: {
              message: { type: 'string', description: 'Commit message' }
            },
            required: ['message']
          },
          execute: async ({ message }) => gitCommit(message)
        },
        git_push: {
          description: 'Push to git remote',
          parameters: {
            type: 'object',
            properties: {}
          },
          execute: async () => gitPush()
        }
      },
      toolChoice: 'auto'
    });

    return new Response(stream.toDataStreamResponse(), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}