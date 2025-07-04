import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { parseErrorOutput, type BuildError } from './error-patterns';

interface SelfHealRequest {
  files: Record<string, string>;
  errors: string[];
  buildOutput?: string;
  attempt?: number;
}

interface SelfHealResponse {
  success: boolean;
  fixedFiles?: Record<string, string>;
  changes?: Array<{
    file: string;
    error: string;
    fix: string;
  }>;
  message: string;
}

// Initialize AI clients
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || '',
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Maximum healing attempts
const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export async function selfHealBuildErrors(
  request: SelfHealRequest
): Promise<SelfHealResponse> {
  const { files, errors, buildOutput, attempt = 1 } = request;

  if (attempt > MAX_ATTEMPTS) {
    return {
      success: false,
      message: `Failed to fix build errors after ${MAX_ATTEMPTS} attempts`,
    };
  }

  // Create a timeout promise
  const timeoutPromise = new Promise<SelfHealResponse>((_, reject) => {
    setTimeout(() => reject(new Error('Self-healing timeout')), TIMEOUT_MS);
  });

  try {
    // Race between healing and timeout
    return await Promise.race([
      healBuildErrors(files, errors, buildOutput),
      timeoutPromise,
    ]);
  } catch (error) {
    if (error instanceof Error && error.message === 'Self-healing timeout') {
      return {
        success: false,
        message: 'Self-healing timeout - build fix took too long',
      };
    }
    throw error;
  }
}

async function healBuildErrors(
  files: Record<string, string>,
  errors: string[],
  buildOutput?: string
): Promise<SelfHealResponse> {
  // Parse errors to understand what needs fixing
  const parsedErrors = parseErrorOutput(errors.join('\n'));
  
  // Try quick fixes first
  const quickFixResult = applyQuickFixes(files, parsedErrors);
  if (quickFixResult.fixed) {
    return {
      success: true,
      fixedFiles: quickFixResult.files,
      changes: quickFixResult.changes,
      message: 'Applied quick fixes for known error patterns',
    };
  }

  // Use AI for complex fixes
  const aiFixResult = await applyAIFixes(files, errors, buildOutput);
  return aiFixResult;
}

function applyQuickFixes(
  files: Record<string, string>,
  errors: BuildError[]
): {
  fixed: boolean;
  files: Record<string, string>;
  changes: Array<{ file: string; error: string; fix: string }>;
} {
  const fixedFiles = { ...files };
  const changes: Array<{ file: string; error: string; fix: string }> = [];
  let fixed = false;

  for (const error of errors) {
    if (error.file && fixedFiles[error.file]) {
      let content = fixedFiles[error.file];
      let fileFix = '';

      // Fix unterminated strings
      if (error.type === 'syntax' && error.message.includes('Unterminated string')) {
        const lines = content.split('\n');
        if (error.line && error.line > 0 && error.line <= lines.length) {
          const line = lines[error.line - 1];
          
          // Check for unterminated single quotes
          const singleQuotes = (line.match(/'/g) || []).length;
          if (singleQuotes % 2 !== 0) {
            lines[error.line - 1] = line + "'";
            fileFix = "Added missing single quote";
          }
          
          // Check for unterminated double quotes
          const doubleQuotes = (line.match(/"/g) || []).length;
          if (doubleQuotes % 2 !== 0) {
            lines[error.line - 1] = line + '"';
            fileFix = "Added missing double quote";
          }
          
          content = lines.join('\n');
        }
      }

      // Fix JSX syntax errors
      if (error.type === 'syntax' && error.message.includes('Expression expected')) {
        // Remove problematic style jsx blocks
        content = content.replace(/<style jsx>\{`[\s\S]*?`\}<\/style>/g, '');
        fileFix = "Removed problematic style jsx block";
      }

      // Fix import errors
      if (error.type === 'module' && error.message.includes('Cannot find module')) {
        const moduleMatch = error.message.match(/Cannot find module '(.+)'/);
        if (moduleMatch) {
          const missingModule = moduleMatch[1];
          // Add missing import
          if (!content.includes(`import`) || content.indexOf('import') > 50) {
            content = `import React from 'react';\n${content}`;
            fileFix = "Added missing React import";
          }
        }
      }

      if (fileFix) {
        fixedFiles[error.file] = content;
        changes.push({
          file: error.file,
          error: error.message,
          fix: fileFix,
        });
        fixed = true;
      }
    }
  }

  return { fixed, files: fixedFiles, changes };
}

async function applyAIFixes(
  files: Record<string, string>,
  errors: string[],
  buildOutput?: string
): Promise<SelfHealResponse> {
  const fileList = Object.entries(files)
    .map(([path, content]) => `File: ${path}\n\`\`\`\n${content.substring(0, 1000)}...\n\`\`\``)
    .join('\n\n');

  const prompt = `You are a Next.js expert. Fix the build errors in this Next.js project.

Build Errors:
${errors.join('\n')}

${buildOutput ? `Full Build Output:\n${buildOutput}\n` : ''}

Current Files (truncated):
${fileList}

Analyze the errors and provide fixed versions of the files that have errors. 
Focus on:
1. Syntax errors (unterminated strings, missing brackets)
2. JSX syntax issues
3. TypeScript type errors
4. Import/export issues

Respond with the complete fixed file contents for each file that needs changes.
Format: 
FILE: <filepath>
\`\`\`
<complete fixed file content>
\`\`\`

Only include files that need fixes.`;

  try {
    // Try Claude first
    let aiResponse: string;
    
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
        system: 'You are an expert at fixing Next.js and TypeScript build errors. Provide complete, working file contents.',
      });

      aiResponse = response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (claudeError) {
      console.error('Claude error, trying GPT-4:', claudeError);
      
      // Fallback to GPT-4
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert at fixing Next.js and TypeScript build errors. Provide complete, working file contents.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
      });

      aiResponse = response.choices[0]?.message?.content || '';
    }

    // Parse AI response and extract fixed files
    const fixedFiles = { ...files };
    const changes: Array<{ file: string; error: string; fix: string }> = [];
    
    const fileMatches = aiResponse.matchAll(/FILE:\s*([^\n]+)\n```[\w]*\n([\s\S]*?)```/g);
    
    for (const match of fileMatches) {
      const filePath = match[1].trim();
      const fileContent = match[2].trim();
      
      if (files[filePath]) {
        fixedFiles[filePath] = fileContent;
        changes.push({
          file: filePath,
          error: 'Build error',
          fix: 'AI-generated fix applied',
        });
      }
    }

    if (changes.length > 0) {
      return {
        success: true,
        fixedFiles,
        changes,
        message: `Fixed ${changes.length} files with AI assistance`,
      };
    } else {
      return {
        success: false,
        message: 'AI could not generate fixes for the build errors',
      };
    }

  } catch (error) {
    console.error('AI fix error:', error);
    return {
      success: false,
      message: 'Failed to apply AI fixes: ' + (error instanceof Error ? error.message : 'Unknown error'),
    };
  }
}