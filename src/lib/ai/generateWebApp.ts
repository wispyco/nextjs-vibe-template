import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export interface GeneratedProject {
  files: Record<string, string>;
  framework: 'nextjs' | 'remix' | 'vite' | 'static';
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  projectName: string;
  description: string;
}

export interface GenerateOptions {
  prompt: string;
  framework?: 'nextjs' | 'remix' | 'vite' | 'static';
  includeTests?: boolean;
  styling?: 'tailwind' | 'css-modules' | 'styled-components' | 'plain-css';
  typescript?: boolean;
}

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_KEY || process.env.CLAUDE_API_KEY!,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Generate a complete web application project with multiple files
 */
export async function generateWebApp(options: GenerateOptions): Promise<GeneratedProject> {
  const {
    prompt,
    framework = 'nextjs',
    includeTests = false,
    styling = 'tailwind',
    typescript = true,
  } = options;

  // Check if the prompt mentions images
  const needsImages = /image|photo|picture|illustration|graphic/i.test(prompt);
  let imageUrls: string[] = [];

  if (needsImages) {
    imageUrls = await generateImages(prompt);
  }

  // Build the system prompt based on framework
  const systemPrompt = buildSystemPrompt(framework, styling, typescript, includeTests);
  
  // Enhanced user prompt with image URLs if needed
  const enhancedPrompt = `
${prompt}

${imageUrls.length > 0 ? `\nUse these generated images in the application:\n${imageUrls.map((url, i) => `- Image ${i + 1}: ${url}`).join('\n')}` : ''}

Requirements:
- Create a production-ready ${framework} application
- Use ${styling} for styling
- ${typescript ? 'Use TypeScript' : 'Use JavaScript'}
- ${includeTests ? 'Include unit tests' : 'No tests needed'}
- Follow best practices and modern patterns
- Make it visually appealing and functional
`;

  try {
    // Try GPT-4 first
    const gptResponse = await generateWithGPT4(systemPrompt, enhancedPrompt);
    if (gptResponse) {
      return parseGeneratedCode(gptResponse, framework);
    }
  } catch (error) {
    console.error('GPT-4 generation failed:', error);
  }

  // Fallback to Claude
  try {
    const claudeResponse = await generateWithClaude(systemPrompt, enhancedPrompt);
    return parseGeneratedCode(claudeResponse, framework);
  } catch (error) {
    console.error('Claude generation failed:', error);
    throw new Error('Failed to generate project with both GPT-4 and Claude');
  }
}

/**
 * Generate with GPT-4
 */
async function generateWithGPT4(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 8000,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * Generate with Claude
 */
async function generateWithClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 8000,
    temperature: 0.7,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

/**
 * Generate images using DALL-E
 */
async function generateImages(prompt: string): Promise<string[]> {
  try {
    const imagePrompt = `Create a high-quality image for a web application: ${prompt.slice(0, 500)}`;
    
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    return response.data.map(img => img.url || '').filter(Boolean);
  } catch (error) {
    console.error('Image generation failed:', error);
    return [];
  }
}

/**
 * Build system prompt based on framework
 */
function buildSystemPrompt(
  framework: string,
  styling: string,
  typescript: boolean,
  includeTests: boolean
): string {
  const basePrompt = `You are an expert web developer. Generate a complete, production-ready web application.

OUTPUT FORMAT:
Return your response as a JSON object with this structure:
{
  "projectName": "project-name",
  "description": "Brief description",
  "files": {
    "path/to/file.ext": "file content",
    "another/file.ext": "file content"
  },
  "dependencies": {
    "package-name": "version"
  },
  "devDependencies": {
    "package-name": "version"
  }
}

IMPORTANT:
- Generate COMPLETE, WORKING code for each file
- Use proper file paths (e.g., "src/app/page.tsx" for Next.js app router)
- Include all necessary configuration files
- Make the code production-ready
- Return ONLY the JSON object, no additional text`;

  const frameworkSpecific = {
    nextjs: `
Framework: Next.js 14+ with App Router
File structure:
- src/app/page.${typescript ? 'tsx' : 'jsx'} (main page)
- src/app/layout.${typescript ? 'tsx' : 'jsx'} (root layout)
- src/app/globals.css (global styles)
- src/components/* (React components)
- package.json
- ${typescript ? 'tsconfig.json' : 'jsconfig.json'}
- next.config.js
- .gitignore
- README.md`,

    remix: `
Framework: Remix
File structure:
- app/root.${typescript ? 'tsx' : 'jsx'}
- app/routes/_index.${typescript ? 'tsx' : 'jsx'}
- app/components/* (React components)
- package.json
- ${typescript ? 'tsconfig.json' : 'jsconfig.json'}
- remix.config.js
- .gitignore
- README.md`,

    vite: `
Framework: Vite + React
File structure:
- src/main.${typescript ? 'tsx' : 'jsx'}
- src/App.${typescript ? 'tsx' : 'jsx'}
- src/components/* (React components)
- index.html
- package.json
- ${typescript ? 'tsconfig.json' : 'jsconfig.json'}
- vite.config.js
- .gitignore
- README.md`,

    static: `
Framework: Static HTML/CSS/JS
File structure:
- index.html
- styles/main.css
- scripts/main.js
- assets/* (images, fonts, etc.)
- README.md`,
  };

  const stylingSpecific = {
    tailwind: 'Use Tailwind CSS for styling. Include tailwind.config.js and appropriate imports.',
    'css-modules': 'Use CSS Modules for component-scoped styling.',
    'styled-components': 'Use styled-components for CSS-in-JS styling.',
    'plain-css': 'Use plain CSS files for styling.',
  };

  return `${basePrompt}

${frameworkSpecific[framework as keyof typeof frameworkSpecific] || frameworkSpecific.nextjs}

Styling: ${stylingSpecific[styling as keyof typeof stylingSpecific] || stylingSpecific.tailwind}
${includeTests ? '\nInclude unit tests using Jest and React Testing Library.' : ''}`;
}

/**
 * Parse the generated code response into a GeneratedProject
 */
function parseGeneratedCode(response: string, framework: string): GeneratedProject {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(response);
    
    if (parsed.files && typeof parsed.files === 'object') {
      return {
        files: parsed.files,
        framework: framework as GeneratedProject['framework'],
        dependencies: parsed.dependencies || getDefaultDependencies(framework),
        devDependencies: parsed.devDependencies || getDefaultDevDependencies(framework),
        projectName: parsed.projectName || 'vibe-web-project',
        description: parsed.description || 'Generated with Vibe Web AI',
      };
    }
  } catch (error) {
    // If not valid JSON, try to extract code blocks
    console.log('Failed to parse as JSON, attempting to extract code blocks');
  }

  // Fallback: Create a simple project structure
  return createFallbackProject(response, framework);
}

/**
 * Get default dependencies for a framework
 */
function getDefaultDependencies(framework: string): Record<string, string> {
  const deps: Record<string, Record<string, string>> = {
    nextjs: {
      'next': '14.2.0',
      'react': '^18.3.1',
      'react-dom': '^18.3.1',
    },
    remix: {
      '@remix-run/node': '^2.8.0',
      '@remix-run/react': '^2.8.0',
      '@remix-run/serve': '^2.8.0',
      'react': '^18.3.1',
      'react-dom': '^18.3.1',
    },
    vite: {
      'react': '^18.3.1',
      'react-dom': '^18.3.1',
    },
    static: {},
  };

  return deps[framework] || deps.nextjs;
}

/**
 * Get default dev dependencies for a framework
 */
function getDefaultDevDependencies(framework: string): Record<string, string> {
  const devDeps: Record<string, Record<string, string>> = {
    nextjs: {
      '@types/node': '^20.0.0',
      '@types/react': '^18.3.1',
      '@types/react-dom': '^18.3.0',
      'typescript': '^5.0.0',
      'tailwindcss': '^3.4.0',
      'postcss': '^8.4.38',
      'autoprefixer': '^10.4.19',
    },
    remix: {
      '@types/node': '^20.0.0',
      '@types/react': '^18.3.1',
      '@types/react-dom': '^18.3.0',
      'typescript': '^5.0.0',
      'tailwindcss': '^3.4.0',
    },
    vite: {
      '@types/react': '^18.3.1',
      '@types/react-dom': '^18.3.0',
      '@vitejs/plugin-react': '^4.2.1',
      'typescript': '^5.0.0',
      'vite': '^5.2.0',
    },
    static: {},
  };

  return devDeps[framework] || devDeps.nextjs;
}

/**
 * Create a fallback project when parsing fails
 */
function createFallbackProject(content: string, framework: string): GeneratedProject {
  // For now, create a simple single-file project
  const files: Record<string, string> = {};
  
  if (framework === 'static') {
    files['index.html'] = content;
  } else {
    files['src/app/page.tsx'] = `
export default function Page() {
  return (
    <div>
      <h1>Generated Project</h1>
      <pre>${content.slice(0, 500)}...</pre>
    </div>
  );
}`;
  }

  return {
    files,
    framework: framework as GeneratedProject['framework'],
    dependencies: getDefaultDependencies(framework),
    devDependencies: getDefaultDevDependencies(framework),
    projectName: 'vibe-web-project',
    description: 'Generated with Vibe Web AI',
  };
}