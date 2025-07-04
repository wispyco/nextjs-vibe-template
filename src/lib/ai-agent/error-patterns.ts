export interface BuildError {
  type: 'syntax' | 'type' | 'module' | 'runtime' | 'unknown';
  file?: string;
  line?: number;
  column?: number;
  message: string;
  raw: string;
}

export interface ErrorPattern {
  pattern: RegExp;
  type: BuildError['type'];
  extract: (match: RegExpMatchArray) => Partial<BuildError>;
}

// Common Next.js/TypeScript error patterns
export const ERROR_PATTERNS: ErrorPattern[] = [
  // Syntax errors
  {
    pattern: /Error:\s*\n\s*x\s+(.+)\n\s*,-\[([^:]+):(\d+):(\d+)\]/,
    type: 'syntax',
    extract: (match) => ({
      message: match[1].trim(),
      file: match[2],
      line: parseInt(match[3]),
      column: parseInt(match[4]),
    }),
  },
  
  // Unterminated string
  {
    pattern: /Unterminated string constant.*\[([^:]+):(\d+):(\d+)\]/,
    type: 'syntax',
    extract: (match) => ({
      message: 'Unterminated string constant',
      file: match[1],
      line: parseInt(match[2]),
      column: parseInt(match[3]),
    }),
  },
  
  // Module not found
  {
    pattern: /Module not found: Can't resolve '([^']+)'.*\n.*Import trace for requested module:\n([^\n]+)/,
    type: 'module',
    extract: (match) => ({
      message: `Cannot find module '${match[1]}'`,
      file: match[2].trim(),
    }),
  },
  
  // TypeScript type errors
  {
    pattern: /Type error: (.+)\n\s+([^:]+):(\d+):(\d+)/,
    type: 'type',
    extract: (match) => ({
      message: match[1].trim(),
      file: match[2],
      line: parseInt(match[3]),
      column: parseInt(match[4]),
    }),
  },
  
  // JSX syntax errors
  {
    pattern: /SyntaxError: (.+) \((\d+):(\d+)\)\n.*Module.*\n([^\n]+\.tsx?)/,
    type: 'syntax',
    extract: (match) => ({
      message: match[1],
      file: match[4].trim(),
      line: parseInt(match[2]),
      column: parseInt(match[3]),
    }),
  },
  
  // Expected token errors
  {
    pattern: /Expected '([^']+)', got '([^']+)'.*\[([^:]+):(\d+):(\d+)\]/,
    type: 'syntax',
    extract: (match) => ({
      message: `Expected '${match[1]}', got '${match[2]}'`,
      file: match[3],
      line: parseInt(match[4]),
      column: parseInt(match[5]),
    }),
  },
];

export function parseErrorOutput(output: string): BuildError[] {
  const errors: BuildError[] = [];
  
  for (const pattern of ERROR_PATTERNS) {
    const matches = output.matchAll(new RegExp(pattern.pattern, 'g'));
    
    for (const match of matches) {
      const extracted = pattern.extract(match);
      errors.push({
        type: pattern.type,
        raw: match[0],
        message: 'Unknown error',
        ...extracted,
      } as BuildError);
    }
  }
  
  // If no patterns matched, try to extract any error-like messages
  if (errors.length === 0) {
    const genericErrors = output.match(/Error:.*$/gm);
    if (genericErrors) {
      for (const error of genericErrors) {
        errors.push({
          type: 'unknown',
          message: error,
          raw: error,
        });
      }
    }
  }
  
  return errors;
}

// Quick fix suggestions for common errors
export interface QuickFix {
  errorPattern: RegExp;
  fix: (content: string, error: BuildError) => string;
  description: string;
}

export const QUICK_FIXES: QuickFix[] = [
  // Fix unterminated strings
  {
    errorPattern: /Unterminated string/,
    description: 'Add missing quote',
    fix: (content: string, error: BuildError) => {
      if (!error.line) return content;
      
      const lines = content.split('\n');
      if (error.line > 0 && error.line <= lines.length) {
        const line = lines[error.line - 1];
        
        // Count quotes
        const singleQuotes = (line.match(/'/g) || []).length;
        const doubleQuotes = (line.match(/"/g) || []).length;
        
        // Add missing quote
        if (singleQuotes % 2 !== 0) {
          lines[error.line - 1] = line + "'";
        } else if (doubleQuotes % 2 !== 0) {
          lines[error.line - 1] = line + '"';
        }
        
        return lines.join('\n');
      }
      
      return content;
    },
  },
  
  // Remove style jsx blocks
  {
    errorPattern: /style jsx|Expression expected/,
    description: 'Remove style jsx block',
    fix: (content: string) => {
      return content.replace(/<style jsx>\{`[\s\S]*?`\}<\/style>/g, '');
    },
  },
  
  // Fix missing React import
  {
    errorPattern: /React is not defined|Cannot find name 'React'/,
    description: 'Add React import',
    fix: (content: string) => {
      if (!content.includes("import React")) {
        return `import React from 'react';\n${content}`;
      }
      return content;
    },
  },
  
  // Fix self-closing tags
  {
    errorPattern: /JSX element.+has no corresponding closing tag/,
    description: 'Fix self-closing tags',
    fix: (content: string) => {
      return content
        .replace(/<img([^>]+)(?<!\/])>/g, '<img$1 />')
        .replace(/<input([^>]+)(?<!\/])>/g, '<input$1 />')
        .replace(/<br(?!\s*\/)>/g, '<br />')
        .replace(/<hr(?!\s*\/)>/g, '<hr />');
    },
  },
];