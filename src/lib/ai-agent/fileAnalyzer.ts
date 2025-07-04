/**
 * Utilities for analyzing file changes and dependencies
 */

export interface FileChange {
  file: string;
  action: 'create' | 'update' | 'delete';
  content?: string;
  dependencies?: string[];
}

export function identifyFileChanges(
  request: string,
  currentFiles: Record<string, string>
): {
  suggestedFiles: string[];
  requiredChanges: FileChange[];
} {
  const suggestedFiles: string[] = [];
  const requiredChanges: FileChange[] = [];

  // Common patterns in user requests
  const patterns = {
    component: /(?:create|add|build|make)\s+(?:a\s+)?(?:new\s+)?component/i,
    page: /(?:create|add|build|make)\s+(?:a\s+)?(?:new\s+)?page/i,
    api: /(?:create|add|build|make)\s+(?:an?\s+)?(?:new\s+)?api/i,
    style: /(?:update|change|modify|style|css|design)/i,
    functionality: /(?:add|implement|create)\s+(?:functionality|feature|behavior)/i,
  };

  // Analyze request to determine what files might need changes
  const lowerRequest = request.toLowerCase();

  // Check for component requests
  if (patterns.component.test(request)) {
    // Extract component name if mentioned
    const nameMatch = request.match(/component\s+(?:called|named)?\s*["`']?(\w+)["`']?/i);
    const componentName = nameMatch ? nameMatch[1] : 'Component';
    
    suggestedFiles.push(`src/components/${componentName}.tsx`);
    
    // Check if component needs to be imported somewhere
    if (lowerRequest.includes('page') || lowerRequest.includes('use')) {
      suggestedFiles.push('src/app/page.tsx');
    }
  }

  // Check for page requests
  if (patterns.page.test(request)) {
    const nameMatch = request.match(/page\s+(?:called|named|for)?\s*["`']?(\w+)["`']?/i);
    const pageName = nameMatch ? nameMatch[1].toLowerCase() : 'new-page';
    
    suggestedFiles.push(`src/app/${pageName}/page.tsx`);
  }

  // Check for API requests
  if (patterns.api.test(request)) {
    const nameMatch = request.match(/api\s+(?:endpoint|route)?\s*(?:called|named|for)?\s*["`']?(\w+)["`']?/i);
    const apiName = nameMatch ? nameMatch[1].toLowerCase() : 'api';
    
    suggestedFiles.push(`src/app/api/${apiName}/route.ts`);
  }

  // Check for style changes
  if (patterns.style.test(request)) {
    // Might need to update global styles or specific component styles
    if (lowerRequest.includes('global') || lowerRequest.includes('theme')) {
      suggestedFiles.push('src/app/globals.css');
    }
  }

  // Analyze current files to find related files
  const fileNames = Object.keys(currentFiles);
  
  // Find files mentioned in the request
  for (const fileName of fileNames) {
    const baseName = fileName.split('/').pop()?.split('.')[0] || '';
    if (lowerRequest.includes(baseName.toLowerCase())) {
      suggestedFiles.push(fileName);
    }
  }

  // Remove duplicates
  const uniqueFiles = [...new Set(suggestedFiles)];

  return {
    suggestedFiles: uniqueFiles,
    requiredChanges,
  };
}

export function analyzeDependencies(
  fileContent: string,
  fileName: string
): string[] {
  const dependencies: string[] = [];
  
  // Extract imports
  const importRegex = /import\s+(?:{[^}]+}|\w+|\*\s+as\s+\w+)\s+from\s+['"](\.\.?\/[^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(fileContent)) !== null) {
    const importPath = match[1];
    
    // Resolve relative import to absolute path
    const resolvedPath = resolveImportPath(fileName, importPath);
    if (resolvedPath) {
      dependencies.push(resolvedPath);
    }
  }
  
  return dependencies;
}

function resolveImportPath(currentFile: string, importPath: string): string | null {
  // This is a simplified implementation
  // In a real implementation, you'd want to handle all the edge cases
  
  const currentDir = currentFile.substring(0, currentFile.lastIndexOf('/'));
  
  if (importPath.startsWith('./')) {
    // Same directory
    return `${currentDir}/${importPath.substring(2)}`;
  } else if (importPath.startsWith('../')) {
    // Parent directory
    const parentDir = currentDir.substring(0, currentDir.lastIndexOf('/'));
    return `${parentDir}/${importPath.substring(3)}`;
  }
  
  return null;
}

export function getFileType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  const typeMap: Record<string, string> = {
    'tsx': 'react-typescript',
    'jsx': 'react-javascript',
    'ts': 'typescript',
    'js': 'javascript',
    'json': 'json',
    'css': 'css',
    'scss': 'scss',
    'html': 'html',
    'md': 'markdown',
  };
  
  return typeMap[extension] || 'text';
}

export function validateFileStructure(
  files: Record<string, string>
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check for required Next.js files
  const requiredFiles = [
    'package.json',
    'next.config.js',
    'src/app/layout.tsx',
    'src/app/page.tsx',
  ];
  
  for (const required of requiredFiles) {
    if (!files[required]) {
      errors.push(`Missing required file: ${required}`);
    }
  }
  
  // Validate package.json
  if (files['package.json']) {
    try {
      const packageJson = JSON.parse(files['package.json']);
      if (!packageJson.dependencies?.next) {
        errors.push('package.json missing Next.js dependency');
      }
    } catch (e) {
      errors.push('Invalid package.json format');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}