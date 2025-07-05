'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';
import { ArrowLeft, GitBranch, Cpu, FileCode, Zap, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { AuroraBackground } from '@/components/ui/aurora-background';

export default function ArchitectureLLMAlgoPage() {
  const { theme } = useTheme();

  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen p-4 sm:p-8"
      >
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className={`flex items-center gap-2 hover:underline transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
              <h1 className={`text-2xl sm:text-3xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Tree-Based LLM Architecture Algorithm
              </h1>
            </div>
            <ThemeToggle />
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Overview Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`p-6 rounded-xl shadow-lg ${
                theme === 'dark' ? 'bg-gray-800/90' : 'bg-white/90'
              } backdrop-blur-sm`}
            >
              <h2 className="text-xl font-semibold mb-4 text-purple-600">Overview</h2>
              <p className={`mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Transform your YAML DSL into an executable specification that generates entire Next.js applications
                using a tree-traversal algorithm with LLM-powered code generation.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <Cpu className="w-5 h-5 text-purple-500 mt-1" />
                  <div>
                    <h3 className="font-medium">Deterministic Generation</h3>
                    <p className="text-sm opacity-75">Tree structure ensures every component is created in the right order</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-yellow-500 mt-1" />
                  <div>
                    <h3 className="font-medium">Parallel Processing</h3>
                    <p className="text-sm opacity-75">Independent subtrees can be generated concurrently</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RefreshCw className="w-5 h-5 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-medium">Self-Healing</h3>
                    <p className="text-sm opacity-75">Pinpoint and regenerate only failing components</p>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Tree Structure Diagram */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`p-6 rounded-xl shadow-lg ${
                theme === 'dark' ? 'bg-gray-800/90' : 'bg-white/90'
              } backdrop-blur-sm`}
            >
              <h2 className="text-xl font-semibold mb-4 text-purple-600">1. YAML to Tree Transformation</h2>
              <div className="relative">
                <svg viewBox="0 0 800 400" className="w-full h-auto">
                  {/* YAML Box */}
                  <rect x="20" y="50" width="200" height="300" rx="8" 
                    fill={theme === 'dark' ? '#374151' : '#f3f4f6'} 
                    stroke={theme === 'dark' ? '#6b7280' : '#e5e7eb'} strokeWidth="2"/>
                  <text x="120" y="30" textAnchor="middle" className="fill-current font-semibold">app-architecture.yaml</text>
                  <text x="30" y="80" className="fill-current text-sm font-mono">app:</text>
                  <text x="30" y="100" className="fill-current text-sm font-mono">  name: vibeweb</text>
                  <text x="30" y="120" className="fill-current text-sm font-mono">  features:</text>
                  <text x="30" y="140" className="fill-current text-sm font-mono">    - ai_editing</text>
                  <text x="30" y="160" className="fill-current text-sm font-mono">workflows:</text>
                  <text x="30" y="180" className="fill-current text-sm font-mono">  generation:</text>
                  <text x="30" y="200" className="fill-current text-sm font-mono">    steps: [...]</text>
                  <text x="30" y="220" className="fill-current text-sm font-mono">api_endpoints:</text>
                  <text x="30" y="240" className="fill-current text-sm font-mono">  /api/generate</text>
                  <text x="30" y="260" className="fill-current text-sm font-mono">  /api/deploy</text>

                  {/* Arrow */}
                  <path d="M 240 200 L 340 200" stroke={theme === 'dark' ? '#9333ea' : '#7c3aed'} strokeWidth="3" markerEnd="url(#arrowhead)"/>
                  <text x="290" y="190" textAnchor="middle" className="fill-current text-sm">parse</text>

                  {/* Tree Structure */}
                  <g transform="translate(380, 200)">
                    {/* Root */}
                    <circle cx="0" cy="0" r="25" fill={theme === 'dark' ? '#9333ea' : '#7c3aed'}/>
                    <text x="0" y="5" textAnchor="middle" fill="white" className="text-sm font-semibold">App</text>
                    
                    {/* Level 1 */}
                    <line x1="0" y1="25" x2="-100" y2="80" stroke={theme === 'dark' ? '#6b7280' : '#9ca3af'} strokeWidth="2"/>
                    <line x1="0" y1="25" x2="0" y2="80" stroke={theme === 'dark' ? '#6b7280' : '#9ca3af'} strokeWidth="2"/>
                    <line x1="0" y1="25" x2="100" y2="80" stroke={theme === 'dark' ? '#6b7280' : '#9ca3af'} strokeWidth="2"/>
                    
                    <circle cx="-100" cy="80" r="20" fill={theme === 'dark' ? '#10b981' : '#059669'}/>
                    <text x="-100" y="85" textAnchor="middle" fill="white" className="text-xs">Frontend</text>
                    
                    <circle cx="0" cy="80" r="20" fill={theme === 'dark' ? '#3b82f6' : '#2563eb'}/>
                    <text x="0" y="85" textAnchor="middle" fill="white" className="text-xs">API</text>
                    
                    <circle cx="100" cy="80" r="20" fill={theme === 'dark' ? '#f59e0b' : '#d97706'}/>
                    <text x="100" y="85" textAnchor="middle" fill="white" className="text-xs">AI</text>
                    
                    {/* Level 2 */}
                    <line x1="-100" y1="100" x2="-130" y2="140" stroke={theme === 'dark' ? '#6b7280' : '#9ca3af'} strokeWidth="1"/>
                    <line x1="-100" y1="100" x2="-70" y2="140" stroke={theme === 'dark' ? '#6b7280' : '#9ca3af'} strokeWidth="1"/>
                    
                    <circle cx="-130" cy="140" r="15" fill={theme === 'dark' ? '#4b5563' : '#e5e7eb'}/>
                    <text x="-130" y="144" textAnchor="middle" className="text-xs">pages</text>
                    
                    <circle cx="-70" cy="140" r="15" fill={theme === 'dark' ? '#4b5563' : '#e5e7eb'}/>
                    <text x="-70" y="144" textAnchor="middle" className="text-xs">ui</text>
                    
                    <line x1="0" y1="100" x2="-30" y2="140" stroke={theme === 'dark' ? '#6b7280' : '#9ca3af'} strokeWidth="1"/>
                    <line x1="0" y1="100" x2="30" y2="140" stroke={theme === 'dark' ? '#6b7280' : '#9ca3af'} strokeWidth="1"/>
                    
                    <circle cx="-30" cy="140" r="15" fill={theme === 'dark' ? '#4b5563' : '#e5e7eb'}/>
                    <text x="-30" y="144" textAnchor="middle" className="text-xs">deploy</text>
                    
                    <circle cx="30" cy="140" r="15" fill={theme === 'dark' ? '#4b5563' : '#e5e7eb'}/>
                    <text x="30" y="144" textAnchor="middle" className="text-xs">agent</text>
                  </g>

                  {/* Arrow marker */}
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill={theme === 'dark' ? '#9333ea' : '#7c3aed'} />
                    </marker>
                  </defs>
                </svg>
              </div>
            </motion.section>

            {/* Generation Flow Diagram */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`p-6 rounded-xl shadow-lg ${
                theme === 'dark' ? 'bg-gray-800/90' : 'bg-white/90'
              } backdrop-blur-sm`}
            >
              <h2 className="text-xl font-semibold mb-4 text-purple-600">2. Tree Traversal & LLM Generation</h2>
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Left: Process Flow */}
                <div>
                  <h3 className="font-medium mb-3">Generation Process</h3>
                  <div className="space-y-3">
                    {[
                      { icon: '1️⃣', title: 'Start at Root', desc: 'Begin with app node' },
                      { icon: '2️⃣', title: 'Depth-First Traversal', desc: 'Visit children before siblings' },
                      { icon: '3️⃣', title: 'LLM Prompt per Node', desc: 'Generate code based on context' },
                      { icon: '4️⃣', title: 'Write Files', desc: 'Save generated content' },
                      { icon: '5️⃣', title: 'Continue Traversal', desc: 'Move to next node' }
                    ].map((step, idx) => (
                      <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <span className="text-lg">{step.icon}</span>
                        <div>
                          <h4 className="font-medium">{step.title}</h4>
                          <p className="text-sm opacity-75">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Code Example */}
                <div>
                  <h3 className="font-medium mb-3">LLM Prompt Example</h3>
                  <div className={`p-4 rounded-lg font-mono text-sm ${
                    theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
                  }`}>
                    <pre className="overflow-x-auto">
{`function llm_prompt(node):
  context = {
    parent: node.parent.name,
    siblings: node.siblings.map(s => s.name),
    env_vars: gather_env_vars(node),
    imports: gather_imports(node)
  }
  
  prompt = """
  Generate \${node.type} '\${node.name}'
  for Next.js + Supabase app.
  
  Context: \${JSON.stringify(context)}
  Requirements: \${node.props}
  
  Output ONLY TypeScript code.
  """
  
  return LLM.call(prompt)`}</pre>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Self-Healing Diagram */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`p-6 rounded-xl shadow-lg ${
                theme === 'dark' ? 'bg-gray-800/90' : 'bg-white/90'
              } backdrop-blur-sm`}
            >
              <h2 className="text-xl font-semibold mb-4 text-purple-600">3. Self-Healing Process</h2>
              <div className="relative">
                <svg viewBox="0 0 800 300" className="w-full h-auto">
                  {/* Build Phase */}
                  <rect x="20" y="50" width="150" height="80" rx="8" 
                    fill={theme === 'dark' ? '#374151' : '#f3f4f6'} 
                    stroke={theme === 'dark' ? '#6b7280' : '#e5e7eb'} strokeWidth="2"/>
                  <text x="95" y="85" textAnchor="middle" className="fill-current font-medium">npm run build</text>
                  <text x="95" y="105" textAnchor="middle" className="fill-current text-xs">⚙️ Building...</text>

                  {/* Success Path */}
                  <path d="M 170 90 L 250 60" stroke="#10b981" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#successArrow)"/>
                  <rect x="250" y="40" width="120" height="40" rx="8" fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="2"/>
                  <text x="310" y="65" textAnchor="middle" fill="#10b981" className="font-medium">Success!</text>

                  {/* Error Path */}
                  <path d="M 170 90 L 250 120" stroke="#ef4444" strokeWidth="2" markerEnd="url(#errorArrow)"/>
                  <rect x="250" y="100" width="120" height="40" rx="8" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="2"/>
                  <text x="310" y="125" textAnchor="middle" fill="#ef4444" className="font-medium">Build Failed</text>

                  {/* Error Analysis */}
                  <path d="M 370 120 L 430 120" stroke={theme === 'dark' ? '#6b7280' : '#9ca3af'} strokeWidth="2" markerEnd="url(#arrowhead)"/>
                  <rect x="430" y="90" width="140" height="60" rx="8" 
                    fill={theme === 'dark' ? '#4b5563' : '#e5e7eb'} 
                    stroke={theme === 'dark' ? '#6b7280' : '#9ca3af'} strokeWidth="2"/>
                  <text x="500" y="110" textAnchor="middle" className="fill-current text-sm">Parse Errors</text>
                  <text x="500" y="130" textAnchor="middle" className="fill-current text-sm">Map to Nodes</text>

                  {/* Self Heal */}
                  <path d="M 570 120 L 630 120" stroke={theme === 'dark' ? '#6b7280' : '#9ca3af'} strokeWidth="2" markerEnd="url(#arrowhead)"/>
                  <rect x="630" y="90" width="140" height="60" rx="8" 
                    fill={theme === 'dark' ? '#9333ea' : '#7c3aed'} fillOpacity="0.2"
                    stroke={theme === 'dark' ? '#9333ea' : '#7c3aed'} strokeWidth="2"/>
                  <text x="700" y="110" textAnchor="middle" className="fill-current text-sm font-medium">LLM Fix</text>
                  <text x="700" y="130" textAnchor="middle" className="fill-current text-sm">Regenerate Node</text>

                  {/* Loop Back */}
                  <path d="M 700 150 Q 700 200 95 200 Q 20 200 20 130" 
                    stroke={theme === 'dark' ? '#9333ea' : '#7c3aed'} strokeWidth="2" 
                    strokeDasharray="5,5" fill="none" markerEnd="url(#loopArrow)"/>
                  <text x="400" y="210" textAnchor="middle" className="fill-current text-sm">Retry (max 3x)</text>

                  {/* Markers */}
                  <defs>
                    <marker id="successArrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
                    </marker>
                    <marker id="errorArrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                    </marker>
                    <marker id="loopArrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill={theme === 'dark' ? '#9333ea' : '#7c3aed'} />
                    </marker>
                  </defs>
                </svg>
              </div>
            </motion.section>

            {/* Implementation Steps */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`p-6 rounded-xl shadow-lg ${
                theme === 'dark' ? 'bg-gray-800/90' : 'bg-white/90'
              } backdrop-blur-sm`}
            >
              <h2 className="text-xl font-semibold mb-4 text-purple-600">4. Implementation Steps</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-blue-500" />
                    CLI Integration
                  </h3>
                  <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <code className="text-sm">
                      npx vibeweb scaffold --from=app-architecture.yaml<br/>
                      --variant=3 --pr --self-heal
                    </code>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Loads YAML DSL</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Builds tree structure</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Generates variant 3</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Creates PR with changes</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-purple-500" />
                    PR Workflow
                  </h3>
                  <div className="space-y-3">
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <h4 className="font-medium text-sm mb-1">Feature Branch</h4>
                      <code className="text-xs">feat/scaffold-1234abcd</code>
                    </div>
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <h4 className="font-medium text-sm mb-1">Commits</h4>
                      <div className="space-y-1 text-xs font-mono">
                        <div>✓ chore: scaffold frontend components</div>
                        <div>✓ feat: add API endpoints</div>
                        <div>✓ feat: add AI agents</div>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <h4 className="font-medium text-sm mb-1">PR Description</h4>
                      <p className="text-xs opacity-75">Auto-generated by LLM with full change summary</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Benefits Grid */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className={`p-6 rounded-xl shadow-lg ${
                theme === 'dark' ? 'bg-gray-800/90' : 'bg-white/90'
              } backdrop-blur-sm`}
            >
              <h2 className="text-xl font-semibold mb-4 text-purple-600">Benefits in Practice</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    title: 'Deterministic Generation',
                    desc: 'Every component created once, in the right order',
                    icon: '🎯'
                  },
                  {
                    title: 'Dependency Awareness',
                    desc: 'Auth middleware before routes, imports resolved',
                    icon: '🔗'
                  },
                  {
                    title: 'Parallel Generation',
                    desc: 'UI and API subtrees built simultaneously',
                    icon: '⚡'
                  },
                  {
                    title: 'Selective Regeneration',
                    desc: 'Fix only failing components, not entire app',
                    icon: '🔧'
                  },
                  {
                    title: 'Clean PR Workflow',
                    desc: 'Small, focused commits for easy review',
                    icon: '📝'
                  },
                  {
                    title: 'Future Automation',
                    desc: 'Same tree feeds docs, tests, and infra',
                    icon: '🚀'
                  }
                ].map((benefit, idx) => (
                  <div key={idx} className={`p-4 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <div className="text-2xl mb-2">{benefit.icon}</div>
                    <h3 className="font-medium mb-1">{benefit.title}</h3>
                    <p className="text-sm opacity-75">{benefit.desc}</p>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Code Example */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className={`p-6 rounded-xl shadow-lg ${
                theme === 'dark' ? 'bg-gray-800/90' : 'bg-white/90'
              } backdrop-blur-sm`}
            >
              <h2 className="text-xl font-semibold mb-4 text-purple-600">Complete Implementation</h2>
              <div className={`p-4 rounded-lg font-mono text-sm overflow-x-auto ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
              }`}>
                <pre>{`// scaffold.ts - Tree-based LLM App Generator

import { load } from 'js-yaml';
import { OpenAI } from 'openai';
import { promises as fs } from 'fs';
import { execSync } from 'child_process';

// Types
interface Node {
  name: string;
  type: 'app' | 'service' | 'component' | 'file';
  props: Record<string, any>;
  children: Node[];
  path?: string;
}

// Load and parse YAML into tree
async function buildTree(yamlPath: string): Promise<Node> {
  const yaml = await fs.readFile(yamlPath, 'utf-8');
  const arch = load(yaml) as any;
  
  return {
    name: arch.app.name,
    type: 'app',
    props: arch.app,
    children: [
      buildFrontendTree(arch.architecture.frontend),
      buildAPITree(arch.api_endpoints),
      buildAITree(arch.components.ai_system)
    ]
  };
}

// Generate code for each node
async function generate(node: Node, llm: OpenAI): Promise<void> {
  if (node.type === 'file') {
    const code = await llmPrompt(node, llm);
    await fs.writeFile(node.path!, code);
    console.log(\`✓ Generated \${node.path}\`);
    return;
  }
  
  // Process children in topological order
  for (const child of topologicalSort(node.children)) {
    await generate(child, llm);
  }
}

// LLM prompt with context
async function llmPrompt(node: Node, llm: OpenAI): Promise<string> {
  const context = gatherContext(node);
  
  const response = await llm.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'system',
      content: 'You are scaffolding a Next.js + Supabase app. Output only code.'
    }, {
      role: 'user',
      content: \`
Generate \${node.type} '\${node.name}' with these requirements:
\${JSON.stringify(node.props, null, 2)}

Context:
\${JSON.stringify(context, null, 2)}

Use TypeScript, follow Next.js 14 patterns, no placeholders.
\`
    }],
    temperature: 0.3 // Lower temp for more consistent output
  });
  
  return response.choices[0].message.content || '';
}

// Self-healing build loop
async function buildAndHeal(llm: OpenAI, maxAttempts = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      execSync('npm run build', { stdio: 'pipe' });
      return true;
    } catch (error: any) {
      console.log(\`Build failed (attempt \${attempt}/\${maxAttempts})\`);
      
      const errors = parseBuildErrors(error.stdout + error.stderr);
      const failingNodes = mapErrorsToNodes(errors);
      
      for (const node of failingNodes) {
        console.log(\`Healing \${node.name}...\`);
        const fixedCode = await llm.chat.completions.create({
          model: 'gpt-4o',
          messages: [{
            role: 'user',
            content: \`Fix these errors in \${node.path}:
\${errors.filter(e => e.file === node.path).map(e => e.message).join('\\n')}

Current code:
\${await fs.readFile(node.path!, 'utf-8')}
\`
          }]
        });
        
        await fs.writeFile(node.path!, fixedCode.choices[0].message.content || '');
      }
    }
  }
  
  return false;
}

// Main CLI
async function main() {
  const args = process.argv.slice(2);
  const yamlPath = args.find(a => a.startsWith('--from='))?.split('=')[1] || 'app-architecture.yaml';
  const createPR = args.includes('--pr');
  
  console.log('🌳 Building tree from YAML...');
  const tree = await buildTree(yamlPath);
  
  console.log('🤖 Generating code...');
  const llm = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  await generate(tree, llm);
  
  console.log('🔨 Building and self-healing...');
  const success = await buildAndHeal(llm);
  
  if (success) {
    console.log('✅ Build successful!');
    
    if (createPR) {
      execSync('git checkout -b feat/scaffold-' + Date.now());
      execSync('git add .');
      execSync('git commit -m "chore: scaffold app from YAML"');
      execSync('git push -u origin HEAD');
      console.log('🔗 PR created!');
    }
  } else {
    console.error('❌ Build failed after max attempts');
    process.exit(1);
  }
}

main().catch(console.error);`}</pre>
              </div>
            </motion.section>
          </div>
        </div>
      </motion.div>
    </AuroraBackground>
  );
}