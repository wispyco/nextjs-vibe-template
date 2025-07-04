/**
 * Utilities for parsing and comparing code
 */

export function parseCode(code: string): {
  imports: string[];
  exports: string[];
  functions: string[];
  components: string[];
} {
  const imports: string[] = [];
  const exports: string[] = [];
  const functions: string[] = [];
  const components: string[] = [];

  const lines = code.split('\n');

  for (const line of lines) {
    // Parse imports
    if (line.trim().startsWith('import')) {
      imports.push(line.trim());
    }

    // Parse exports
    if (line.includes('export')) {
      exports.push(line.trim());
    }

    // Parse function declarations
    const functionMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
    if (functionMatch) {
      functions.push(functionMatch[1]);
    }

    // Parse arrow functions
    const arrowMatch = line.match(/(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(/);
    if (arrowMatch) {
      functions.push(arrowMatch[1]);
    }

    // Parse React components (capitalized functions)
    const componentMatch = line.match(/(?:export\s+)?(?:default\s+)?function\s+([A-Z]\w+)/);
    if (componentMatch) {
      components.push(componentMatch[1]);
    }
  }

  return {
    imports: [...new Set(imports)],
    exports: [...new Set(exports)],
    functions: [...new Set(functions)],
    components: [...new Set(components)],
  };
}

export function generateDiff(oldContent: string, newContent: string): string {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  
  const diff: string[] = [];
  const maxLines = Math.max(oldLines.length, newLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];
    
    if (oldLine === undefined && newLine !== undefined) {
      // Line added
      diff.push(`+ ${newLine}`);
    } else if (oldLine !== undefined && newLine === undefined) {
      // Line removed
      diff.push(`- ${oldLine}`);
    } else if (oldLine !== newLine) {
      // Line changed
      diff.push(`- ${oldLine}`);
      diff.push(`+ ${newLine}`);
    }
  }
  
  return diff.join('\n');
}

export function extractCodeBlocks(text: string): Array<{
  language: string;
  code: string;
  filename?: string;
}> {
  const blocks: Array<{
    language: string;
    code: string;
    filename?: string;
  }> = [];
  
  const codeBlockRegex = /```(\w+)?\s*(?:\/\/|#|<!--)?\s*([^\n]*)\n([\s\S]*?)```/g;
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const language = match[1] || 'text';
    const header = match[2].trim();
    const code = match[3].trim();
    
    // Try to extract filename from header
    const filenameMatch = header.match(/(\S+\.(?:ts|tsx|js|jsx|json|css|html|md))/);
    const filename = filenameMatch ? filenameMatch[1] : undefined;
    
    blocks.push({
      language,
      code,
      filename,
    });
  }
  
  return blocks;
}

export function mergeCodeChanges(
  original: string,
  changes: string,
  strategy: 'replace' | 'merge' = 'replace'
): string {
  if (strategy === 'replace') {
    return changes;
  }
  
  // For merge strategy, try to intelligently merge changes
  // This is a simplified implementation - in production you'd want more sophisticated merging
  const originalParsed = parseCode(original);
  const changesParsed = parseCode(changes);
  
  // Merge imports (deduplicate)
  const mergedImports = [...new Set([...originalParsed.imports, ...changesParsed.imports])];
  
  // For now, just return the changes
  // A more sophisticated implementation would do actual AST-based merging
  return changes;
}