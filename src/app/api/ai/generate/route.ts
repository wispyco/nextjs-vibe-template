import { NextRequest, NextResponse } from 'next/server';
import { generateWebApp, GeneratedProject } from '@/lib/ai/generateWebApp';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      prompt, 
      framework = 'nextjs',
      styling = 'tailwind',
      typescript = true,
      includeTests = false 
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Check for required environment variables
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasClaude = !!(process.env.CLAUDE_KEY || process.env.CLAUDE_API_KEY);

    if (!hasOpenAI && !hasClaude) {
      return NextResponse.json(
        { error: 'No AI providers configured. Set OPENAI_API_KEY or CLAUDE_KEY.' },
        { status: 500 }
      );
    }

    // Generate the project
    const project: GeneratedProject = await generateWebApp({
      prompt,
      framework,
      styling,
      typescript,
      includeTests,
    });

    // Add package.json if not included
    if (!project.files['package.json']) {
      project.files['package.json'] = JSON.stringify({
        name: project.projectName,
        version: '0.1.0',
        private: true,
        description: project.description,
        scripts: getScriptsForFramework(framework),
        dependencies: project.dependencies || {},
        devDependencies: project.devDependencies || {},
      }, null, 2);
    }

    // Add .gitignore if not included
    if (!project.files['.gitignore']) {
      project.files['.gitignore'] = getGitignoreForFramework(framework);
    }

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error('AI generation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate project';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

function getScriptsForFramework(framework: string): Record<string, string> {
  const scripts: Record<string, Record<string, string>> = {
    nextjs: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
    },
    remix: {
      dev: 'remix dev',
      build: 'remix build',
      start: 'remix-serve build',
    },
    vite: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
    },
    static: {
      serve: 'npx serve .',
    },
  };

  return scripts[framework] || scripts.nextjs;
}

function getGitignoreForFramework(framework: string): string {
  const common = `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
`;

  const frameworkSpecific: Record<string, string> = {
    nextjs: `${common}
# next.js
/.next/
/out/
`,
    remix: `${common}
# remix
/build
/public/build
.cache
`,
    vite: `${common}
# vite
dist
dist-ssr
*.local
`,
    static: common,
  };

  return frameworkSpecific[framework] || frameworkSpecific.nextjs;
}