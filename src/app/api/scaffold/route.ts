import { NextResponse } from 'next/server';
import yaml from 'yaml';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { writeFs, shell } from '@/lib/repoTools';

// Using Node.js runtime for file system operations
// export const runtime = 'edge';

interface Node {
  type: string;
  name: string;
  path?: string;
  props?: any;
  children?: Node[];
}

async function generateFileContent(node: Node): Promise<string> {
  const prompt = `Generate ${node.type} "${node.name}" for a Next.js app.
Props: ${JSON.stringify(node.props || {}, null, 2)}
Return ONLY file content, no explanations.`;

  const { text } = await generateText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    prompt,
  });

  return text;
}

async function processNode(node: Node, basePath: string = ''): Promise<void> {
  const fullPath = basePath ? `${basePath}/${node.name}` : node.name;
  
  if (node.type === 'directory') {
    // Process children
    if (node.children) {
      for (const child of node.children) {
        await processNode(child, fullPath);
      }
    }
  } else if (node.type === 'file' || node.type === 'component') {
    // Generate and write file
    const content = await generateFileContent(node);
    const filePath = node.path || `${fullPath}.tsx`;
    await writeFs(filePath, content);
  }
}

async function selfHealBuild(failedNodes: Node[], attempts: number = 0): Promise<boolean> {
  if (attempts >= 3) return false;

  for (const node of failedNodes) {
    const content = await generateFileContent(node);
    await writeFs(node.path!, content);
  }

  const buildResult = await shell('npm run build');
  if (buildResult.success) {
    return true;
  }

  // Parse errors and try again
  const errorPaths = parseErrorPaths(buildResult.stderr || '');
  const newFailedNodes = failedNodes.filter(n => errorPaths.includes(n.path!));
  
  if (newFailedNodes.length === 0) return false;
  
  return selfHealBuild(newFailedNodes, attempts + 1);
}

function parseErrorPaths(stderr: string): string[] {
  // Simple error path extraction - can be enhanced
  const pathRegex = /\.\/src\/[^\s:]+\.(tsx?|jsx?)/g;
  const matches = stderr.match(pathRegex) || [];
  return [...new Set(matches)];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { yaml: yamlContent } = body;

    if (!yamlContent) {
      return NextResponse.json(
        { error: 'YAML content is required' },
        { status: 400 }
      );
    }

    // Parse YAML
    const tree = yaml.parse(yamlContent) as Node;

    // Process tree
    await processNode(tree);

    // Run build
    const buildResult = await shell('npm run build');
    
    if (!buildResult.success) {
      // Attempt self-healing
      const errorPaths = parseErrorPaths(buildResult.stderr || '');
      const failedNodes: Node[] = []; // Would need to map paths back to nodes
      
      const healed = await selfHealBuild(failedNodes);
      
      if (!healed) {
        return NextResponse.json(
          { 
            error: 'Build failed after self-healing attempts',
            stderr: buildResult.stderr 
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Scaffold complete and build successful'
    });

  } catch (error) {
    console.error('Scaffold API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}