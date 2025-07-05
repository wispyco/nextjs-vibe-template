import { GeneratedProject } from '@/lib/ai/generateWebApp';
import { parse } from 'node-html-parser';

/**
 * Convert standalone HTML to a Next.js project
 */
export function convertHtmlToNextJs(
  html: string,
  projectName: string,
  description: string
): GeneratedProject {
  const root = parse(html);
  const files: Record<string, string> = {};

  // Extract metadata from HTML
  const title = root.querySelector('title')?.textContent || projectName;
  const metaTags = root.querySelectorAll('meta');

  // Extract styles
  const styleTags = root.querySelectorAll('style');
  const externalStyles = root.querySelectorAll('link[rel="stylesheet"]');
  let globalStyles = '';
  let componentStyles = '';

  styleTags.forEach((style) => {
    const css = style.innerHTML;
    // Separate global styles from component styles
    if (css.includes(':root') || css.includes('body') || css.includes('html') || css.includes('*')) {
      globalStyles += css + '\n';
    } else {
      componentStyles += css + '\n';
    }
  });

  // Extract scripts
  const scriptTags = root.querySelectorAll('script');
  let pageLogic = '';
  let hasInteractivity = false;

  scriptTags.forEach((script) => {
    const js = script.innerHTML;
    if (js.trim()) {
      hasInteractivity = true;
      pageLogic += `\n// Original script:\n${js}\n`;
    }
  });

  // Extract body content
  const bodyContent = root.querySelector('body')?.innerHTML || '';

  // Create app/layout.tsx
  files['src/app/layout.tsx'] = `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '${title.replace(/'/g, "\\'").replace(/\n/g, " ")}',
  description: '${description.replace(/'/g, "\\'").replace(/\n/g, " ")}',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`;

  // Create app/page.tsx
  const pageComponent = createPageComponent(bodyContent, componentStyles, pageLogic, hasInteractivity);
  files['src/app/page.tsx'] = pageComponent;

  // Create globals.css (include component styles here to avoid styled-jsx issues)
  files['src/app/globals.css'] = `@tailwind base;
@tailwind components;
@tailwind utilities;

${globalStyles}

/* Component styles */
${componentStyles}

/* External stylesheets */
${externalStyles.map(link => `/* @import url('${link.getAttribute('href')}'); */`).join('\n')}`;

  // Create package.json
  files['package.json'] = JSON.stringify({
    name: projectName.replace(/[^a-z0-9-]/g, '-'),
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint'
    },
    dependencies: {
      'next': '14.2.0',
      'react': '^18.3.1',
      'react-dom': '^18.3.1'
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      '@types/react': '^18.3.1',
      '@types/react-dom': '^18.3.0',
      'typescript': '^5.0.0',
      'tailwindcss': '^3.4.0',
      'postcss': '^8.4.38',
      'autoprefixer': '^10.4.19'
    }
  }, null, 2);

  // Create next.config.js
  files['next.config.js'] = `/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['*'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig`;

  // Create tsconfig.json
  files['tsconfig.json'] = JSON.stringify({
    compilerOptions: {
      target: 'es5',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [
        {
          name: 'next'
        }
      ],
      paths: {
        '@/*': ['./src/*']
      }
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules']
  }, null, 2);

  // Create tailwind.config.js
  files['tailwind.config.js'] = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;

  // Create postcss.config.js
  files['postcss.config.js'] = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

  // Create .gitignore
  files['.gitignore'] = `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

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
next-env.d.ts`;

  // Create README.md
  files['README.md'] = `# ${projectName}

${description}

This is a [Next.js](https://nextjs.org/) project bootstrapped from HTML.

## Getting Started

First, run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
\`\`\`

Open [https://8dbd-149-22-81-43.ngrok-free.app](https://8dbd-149-22-81-43.ngrok-free.app) with your browser to see the result.

You can start editing the page by modifying \`app/page.tsx\`. The page auto-updates as you edit the file.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com).`;

  return {
    files,
    framework: 'nextjs',
    dependencies: {
      'next': '14.2.0',
      'react': '^18.3.1',
      'react-dom': '^18.3.1'
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      '@types/react': '^18.3.1',
      '@types/react-dom': '^18.3.0',
      'typescript': '^5.0.0',
      'tailwindcss': '^3.4.0',
      'postcss': '^8.4.38',
      'autoprefixer': '^10.4.19'
    },
    projectName,
    description
  };
}

/**
 * Create the main page component from HTML body content
 */
function createPageComponent(
  bodyContent: string,
  componentStyles: string,
  pageLogic: string,
  hasInteractivity: boolean
): string {
  // Convert HTML to JSX
  let jsxContent = bodyContent
    .replace(/class=/g, 'className=')
    .replace(/for=/g, 'htmlFor=')
    .replace(/onclick=/g, 'onClick=')
    .replace(/onchange=/g, 'onChange=')
    .replace(/onsubmit=/g, 'onSubmit=')
    .replace(/style="([^"]*)"/g, (match, styles) => {
      // Convert inline styles to React style objects
      const styleObj = styles
        .split(';')
        .filter((s: string) => s.trim())
        .map((s: string) => {
          const [prop, value] = s.split(':').map((x: string) => x.trim());
          const camelProp = prop.replace(/-([a-z])/g, (g: string) => g[1].toUpperCase());
          return `${camelProp}: '${value}'`;
        })
        .join(', ');
      return `style={{${styleObj}}}`;
    });

  // Handle self-closing tags
  jsxContent = jsxContent
    .replace(/<img([^>]*)\/?>/g, '<img$1 />')
    .replace(/<input([^>]*)\/?>/g, '<input$1 />')
    .replace(/<br\s*\/?>/g, '<br />')
    .replace(/<hr\s*\/?>/g, '<hr />');

  // Create component with or without client-side interactivity
  const useClient = hasInteractivity ? "'use client'\n\n" : '';

  // Clean up JSX content
  const cleanJsxContent = jsxContent.trim();

  // Build the component
  let component = `${useClient}export default function Home() {`;

  if (pageLogic) {
    component += `\n  // TODO: Convert this JavaScript to React hooks and event handlers\n${pageLogic}\n`;
  }

  component += `\n  return (\n`;

  if (componentStyles) {
    // Remove problematic style jsx for now - we'll add styles to globals.css instead
    component += `    <div>\n      ${cleanJsxContent}\n    </div>\n`;
  } else {
    component += `    <>\n      ${cleanJsxContent}\n    </>\n`;
  }

  component += `  )\n}`;

  return component;
}