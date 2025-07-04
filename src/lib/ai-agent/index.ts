import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { parseCode, generateDiff } from './codeParser';
import { identifyFileChanges } from './fileAnalyzer';

interface AgentRequest {
  message: string;
  currentFiles: Record<string, string>;
  projectName: string;
  projectDescription: string;
  conversationId: string;
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
}

// Initialize AI clients
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || '',
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function processAgentRequest(request: AgentRequest): Promise<AgentResponse> {
  const { message, currentFiles, projectName, projectDescription } = request;

  // Prepare context about current project structure
  const fileList = Object.keys(currentFiles).join('\n');
  const projectContext = `
Project: ${projectName}
Description: ${projectDescription}
Current files:
${fileList}

The project is a Next.js application with the following structure:
- src/app/: App router pages and layouts
- src/components/: React components
- src/lib/: Utility functions and libraries
- public/: Static assets
- Standard Next.js configuration files
`;

  // Create the prompt for the AI
  const systemPrompt = `You are an expert Next.js developer assistant. You help users modify and improve their Next.js projects.

When the user asks for changes:
1. Analyze the current project structure and files
2. Determine which files need to be modified, created, or deleted
3. Generate the complete updated code for modified/new files
4. Provide clear explanations of the changes

Always:
- Maintain Next.js 14+ App Router conventions
- Use TypeScript
- Follow the existing code style and patterns
- Ensure all imports are correct
- Keep the application functional after changes

Format your response with:
1. A clear explanation of what changes you'll make
2. Code blocks with file paths as headers
3. Brief explanations of why each change is necessary`;

  const userPrompt = `${projectContext}

User request: ${message}

Please analyze the request and provide the necessary code changes. Include complete file contents for any files that need to be modified or created.`;

  try {
    // Try Claude first
    let aiResponse: string;
    
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        system: systemPrompt,
      });

      aiResponse = response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (claudeError) {
      console.error('Claude API error, falling back to GPT-4:', claudeError);
      
      // Fallback to GPT-4
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4000,
      });

      aiResponse = response.choices[0]?.message?.content || '';
    }

    // Parse the AI response to extract code changes
    const parsedResponse = parseAIResponse(aiResponse, currentFiles);

    return {
      message: parsedResponse.explanation,
      changes: parsedResponse.changes,
      preview: {
        files: parsedResponse.updatedFiles,
        mainFile: parsedResponse.mainFile,
      },
    };

  } catch (error) {
    console.error('AI Agent processing error:', error);
    return {
      message: 'I encountered an error while processing your request. Please try again or rephrase your request.',
      changes: [],
    };
  }
}

function parseAIResponse(
  response: string,
  currentFiles: Record<string, string>
): {
  explanation: string;
  changes: Array<{
    file: string;
    action: 'create' | 'update' | 'delete';
    content?: string;
    diff?: string;
  }>;
  updatedFiles: Record<string, string>;
  mainFile?: string;
} {
  const lines = response.split('\n');
  const changes: Array<{
    file: string;
    action: 'create' | 'update' | 'delete';
    content?: string;
    diff?: string;
  }> = [];
  
  let explanation = '';
  let currentFile: string | null = null;
  let currentContent: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  
  const updatedFiles = { ...currentFiles };
  
  // Extract explanation (everything before the first code block)
  let explanationLines: string[] = [];
  let foundFirstCodeBlock = false;
  
  for (const line of lines) {
    // Check for code block markers
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        // Starting a code block
        foundFirstCodeBlock = true;
        inCodeBlock = true;
        
        // Check if this line contains a file path
        const match = line.match(/```(?:typescript|javascript|tsx|jsx|json|css|html)?\s*(?:\/\/|#|<!--)?\s*(.+\.(?:ts|tsx|js|jsx|json|css|html|md))/i);
        if (match) {
          // Save previous file if exists
          if (currentFile && currentContent.length > 0) {
            const content = currentContent.join('\n');
            const action = currentFiles[currentFile] ? 'update' : 'create';
            
            changes.push({
              file: currentFile,
              action,
              content,
              diff: action === 'update' ? generateDiff(currentFiles[currentFile], content) : undefined,
            });
            
            updatedFiles[currentFile] = content;
          }
          
          currentFile = match[1].trim();
          currentContent = [];
        }
      } else {
        // Ending a code block
        inCodeBlock = false;
        
        // Save the file content
        if (currentFile && currentContent.length > 0) {
          const content = currentContent.join('\n');
          const action = currentFiles[currentFile] ? 'update' : 'create';
          
          changes.push({
            file: currentFile,
            action,
            content,
            diff: action === 'update' ? generateDiff(currentFiles[currentFile], content) : undefined,
          });
          
          updatedFiles[currentFile] = content;
          currentFile = null;
          currentContent = [];
        }
      }
    } else if (inCodeBlock) {
      // Inside a code block, collect content
      currentContent.push(line);
    } else if (!foundFirstCodeBlock) {
      // Before first code block, collect explanation
      explanationLines.push(line);
    }
    
    // Look for file path indicators outside code blocks
    if (!inCodeBlock && !foundFirstCodeBlock) {
      const fileMatch = line.match(/(?:File:|Create|Update|Modify|Delete)\s*[`']?(.+\.(?:ts|tsx|js|jsx|json|css|html|md))[`']?/i);
      if (fileMatch) {
        const filePath = fileMatch[1].trim();
        if (line.toLowerCase().includes('delete')) {
          changes.push({
            file: filePath,
            action: 'delete',
          });
          delete updatedFiles[filePath];
        }
      }
    }
  }
  
  // Save any remaining file
  if (currentFile && currentContent.length > 0) {
    const content = currentContent.join('\n');
    const action = currentFiles[currentFile] ? 'update' : 'create';
    
    changes.push({
      file: currentFile,
      action,
      content,
      diff: action === 'update' ? generateDiff(currentFiles[currentFile], content) : undefined,
    });
    
    updatedFiles[currentFile] = content;
  }
  
  explanation = explanationLines.join('\n').trim();
  
  // If no explanation was extracted, use the first paragraph of the response
  if (!explanation) {
    const firstParagraph = response.split('\n\n')[0];
    explanation = firstParagraph || 'I\'ve made the requested changes to your project.';
  }
  
  // Determine the main file to preview (usually the most recently modified page or component)
  let mainFile: string | undefined;
  for (const change of changes) {
    if (change.file.includes('page.tsx') || change.file.includes('page.js')) {
      mainFile = change.file;
      break;
    }
  }
  
  if (!mainFile && changes.length > 0) {
    // Use the first changed component file
    mainFile = changes.find(c => c.file.includes('component'))?.file || changes[0].file;
  }
  
  return {
    explanation,
    changes,
    updatedFiles,
    mainFile,
  };
}