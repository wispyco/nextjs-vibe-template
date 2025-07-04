import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

const execAsync = promisify(exec);

export interface BuildValidationResult {
  success: boolean;
  errors?: string[];
  warnings?: string[];
  output?: string;
}

/**
 * Validates a Next.js project by attempting to build it
 */
export async function validateNextJsBuild(
  files: Record<string, string>
): Promise<BuildValidationResult> {
  // Create a temporary directory
  const tempDir = join(tmpdir(), `nextjs-validate-${randomBytes(8).toString('hex')}`);
  
  try {
    // Create the temporary directory structure
    await mkdir(tempDir, { recursive: true });
    await mkdir(join(tempDir, 'src', 'app'), { recursive: true });
    
    // Write all files to the temp directory
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = join(tempDir, filePath);
      const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
      
      // Ensure directory exists
      await mkdir(dir, { recursive: true });
      
      // Write the file
      await writeFile(fullPath, content, 'utf-8');
    }
    
    // Install dependencies (minimal install for speed)
    console.log('Installing dependencies for validation...');
    const { stdout: installOutput, stderr: installError } = await execAsync(
      'npm install --production --no-audit --no-fund',
      { cwd: tempDir }
    );
    
    if (installError && !installError.includes('npm WARN')) {
      return {
        success: false,
        errors: [`Dependency installation failed: ${installError}`],
      };
    }
    
    // Run the build
    console.log('Running build validation...');
    const { stdout: buildOutput, stderr: buildError } = await execAsync(
      'npm run build',
      { cwd: tempDir, env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } }
    );
    
    // Parse build output for errors
    if (buildError || buildOutput.includes('Failed to compile')) {
      const errors: string[] = [];
      const output = buildError || buildOutput;
      
      // Extract specific error messages
      const errorMatches = output.match(/Error:[\s\S]*?(?=\n\n|\n[A-Z]|$)/g);
      if (errorMatches) {
        errors.push(...errorMatches.map(e => e.trim()));
      }
      
      // Extract syntax errors
      const syntaxErrors = output.match(/x [^\n]+/g);
      if (syntaxErrors) {
        errors.push(...syntaxErrors.map(e => e.trim()));
      }
      
      return {
        success: false,
        errors,
        output: output.substring(0, 2000), // Limit output size
      };
    }
    
    return {
      success: true,
      output: buildOutput.substring(0, 1000), // Limit output size
    };
    
  } catch (error) {
    console.error('Build validation error:', error);
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown build validation error'],
    };
  } finally {
    // Clean up temp directory
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      console.error('Failed to clean up temp directory:', e);
    }
  }
}

/**
 * Quick syntax validation without full build
 */
export function validateSyntax(files: Record<string, string>): BuildValidationResult {
  const errors: string[] = [];
  
  for (const [filePath, content] of Object.entries(files)) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      // Check for basic syntax issues
      try {
        // Check for unterminated strings
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Simple check for unterminated strings (not perfect but catches common issues)
          const singleQuotes = (line.match(/'/g) || []).length;
          const doubleQuotes = (line.match(/"/g) || []).length;
          const backticks = (line.match(/`/g) || []).length;
          
          // Check if quotes are balanced (very basic check)
          if (singleQuotes % 2 !== 0 && !line.includes("\\'")) {
            errors.push(`${filePath}:${i + 1} - Possible unterminated string (single quotes)`);
          }
          if (doubleQuotes % 2 !== 0 && !line.includes('\\"')) {
            errors.push(`${filePath}:${i + 1} - Possible unterminated string (double quotes)`);
          }
        }
        
        // Check for common JSX issues
        if (filePath.endsWith('.tsx')) {
          // Check for style jsx without proper closing
          if (content.includes('<style jsx>{`') && !content.includes('`}</style>')) {
            errors.push(`${filePath} - Unclosed style jsx block`);
          }
          
          // Check for empty fragments
          const emptyFragmentMatch = content.match(/<>\s*\n\s*</);
          if (emptyFragmentMatch) {
            errors.push(`${filePath} - Empty React fragment with newline may cause syntax errors`);
          }
        }
        
      } catch (e) {
        errors.push(`${filePath} - Failed to validate: ${e}`);
      }
    }
  }
  
  return {
    success: errors.length === 0,
    errors,
  };
}