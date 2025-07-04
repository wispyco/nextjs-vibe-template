'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, GitBranch, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';
import AIChatInterface from '@/components/AIChatInterface';
import { AuroraBackground } from '@/components/ui/aurora-background';

interface Project {
  id: string;
  name: string;
  description: string;
  github_repo: string;
  github_url: string;
  github_owner: string;
  github_name: string;
  vercel_project_name: string;
  status: string;
}

export default function ProjectEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [liveUrl, setLiveUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }
      const data = await response.json();
      setProject(data.project);
      setLiveUrl(`https://${data.project.vercel_project_name}.vercel.app`);
    } catch (error) {
      console.error('Error fetching project:', error);
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleChangesApplied = (changes: any[]) => {
    // Refresh the iframe to show new changes
    setIframeKey(prev => prev + 1);
    
    // Optionally refresh the live URL after a delay to allow deployment
    setTimeout(() => {
      setIframeKey(prev => prev + 1);
    }, 10000); // 10 seconds for deployment
  };

  const refreshPreview = () => {
    setIframeKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <AuroraBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-gray-600 dark:text-gray-400">Loading project...</p>
          </div>
        </div>
      </AuroraBackground>
    );
  }

  if (error || !project) {
    return (
      <AuroraBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Project not found'}</p>
            <Link
              href="/deployments"
              className="text-purple-600 hover:text-purple-700 underline"
            >
              Back to Deployments
            </Link>
          </div>
        </div>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`min-h-screen ${isFullscreen ? 'p-0' : 'p-4'}`}
      >
        {/* Header */}
        {!isFullscreen && (
          <div className="max-w-full mx-auto mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/deployments"
                  className={`flex items-center gap-2 hover:underline transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-300 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Link>
                <h1 className={`text-xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Editing: {project.name}
                </h1>
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                >
                  <GitBranch className="w-4 h-4" />
                  GitHub
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                >
                  Live Site
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshPreview}
                  className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Refresh preview"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={`${isFullscreen ? 'h-screen' : 'max-w-full mx-auto h-[calc(100vh-120px)]'}`}>
          <div className="grid lg:grid-cols-2 gap-4 h-full">
            {/* AI Chat Panel */}
            <div className={`${isFullscreen ? 'h-full' : 'h-full'} overflow-hidden`}>
              <AIChatInterface
                projectId={projectId}
                projectName={project.name}
                onChangesApplied={handleChangesApplied}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              />
            </div>

            {/* Preview Panel */}
            <div className={`${isFullscreen ? 'h-full' : 'h-full'} overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl`}>
              <div className="h-full flex flex-col">
                <div className={`flex items-center justify-between p-3 border-b ${
                  theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                      Live Preview
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {liveUrl}
                  </div>
                </div>
                <div className="flex-1 bg-white">
                  <iframe
                    key={iframeKey}
                    src={liveUrl}
                    className="w-full h-full border-0"
                    title="Live Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AuroraBackground>
  );
}