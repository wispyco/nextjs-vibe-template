'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Rocket, Check, AlertCircle, ExternalLink, Github, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface DeployButtonProps {
  code: string;
  appTitle: string;
  project?: any; // Next.js project structure
  className?: string;
}

interface DeploymentProgress {
  message: string;
  type: 'info' | 'success' | 'error';
  timestamp: Date;
}

interface DeploymentResult {
  success: boolean;
  repoUrl?: string;
  liveUrl?: string;
  error?: string;
}

export default function DeployButton({ code, appTitle, project, className = '' }: DeployButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [progress, setProgress] = useState<DeploymentProgress[]>([]);
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);
  const [existingProjects, setExistingProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('new');
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const resetModal = useCallback(() => {
    setProjectName('');
    setProgress([]);
    setDeploymentResult(null);
    setIsDeploying(false);
    setSelectedProject('new');
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    // Reset state after animation completes
    setTimeout(resetModal, 300);
  }, [resetModal]);

  const addProgress = useCallback((message: string, type: DeploymentProgress['type'] = 'info') => {
    setProgress(prev => [...prev, { message, type, timestamp: new Date() }]);
  }, []);

  // Fetch existing projects when modal opens
  const fetchProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setExistingProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  // Handle modal open
  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
    fetchProjects();
  }, [fetchProjects]);

  const handleDeploy = useCallback(async () => {
    const deployProjectName = selectedProject === 'new' ? projectName.trim() : selectedProject;
    
    if (!deployProjectName) {
      addProgress('Please enter a project name or select an existing project', 'error');
      return;
    }

    setIsDeploying(true);
    setDeploymentResult(null);
    addProgress('Initializing deployment...');

    try {
      // Send deployment request
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          projectName: deployProjectName,
          appTitle,
          project // Include Next.js project if available
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Deployment failed: ${response.statusText}`);
      }

      // Read the SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.stage === 'creating-repo') {
                addProgress(data.message, 'info');
              } else if (data.stage === 'pushing-code') {
                addProgress(data.message, 'info');
              } else if (data.stage === 'creating-project') {
                addProgress(data.message, 'info');
              } else if (data.stage === 'deploying') {
                addProgress(data.message, 'info');
              } else if (data.stage === 'complete') {
                addProgress(data.message, 'success');
                setDeploymentResult({
                  success: true,
                  repoUrl: data.data?.repoUrl,
                  liveUrl: data.data?.deploymentUrl
                });
                setIsDeploying(false);
              } else if (data.stage === 'error') {
                addProgress(data.message, 'error');
                setDeploymentResult({
                  success: false,
                  error: data.error
                });
                setIsDeploying(false);
                
                // If authentication is required, redirect to login
                if (data.error === 'Please sign in to deploy') {
                  setTimeout(() => {
                    window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
                  }, 2000);
                }
              }
            } catch (error) {
              console.error('Error parsing SSE data:', error);
            }
          }
        }
      }

    } catch (error) {
      console.error('Deployment error:', error);
      addProgress(error instanceof Error ? error.message : 'Deployment failed', 'error');
      setDeploymentResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      setIsDeploying(false);
    }
  }, [projectName, selectedProject, code, appTitle, addProgress]);

  return (
    <>
      <button
        onClick={handleOpenModal}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 ${className}`}
      >
        <Rocket className="w-4 h-4" />
        Deploy
      </button>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDeploying) {
                closeModal();
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Rocket className="w-6 h-6 text-purple-600" />
                  Deploy Your App
                </h2>
                <button
                  onClick={closeModal}
                  disabled={isDeploying}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {!deploymentResult && (
                  <div className="space-y-4">
                    {/* Project Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Deploy to
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="projectType"
                            value="new"
                            checked={selectedProject === 'new'}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            disabled={isDeploying}
                            className="text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-gray-900 dark:text-white">Create new project</span>
                        </label>
                        
                        {existingProjects.length > 0 && (
                          <>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="projectType"
                                value="existing"
                                checked={selectedProject !== 'new' && selectedProject !== ''}
                                onChange={() => setSelectedProject(existingProjects[0]?.name || '')}
                                disabled={isDeploying}
                                className="text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-gray-900 dark:text-white">Update existing project</span>
                            </label>
                            
                            {selectedProject !== 'new' && (
                              <select
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                disabled={isDeploying || isLoadingProjects}
                                className="ml-6 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {existingProjects.map((project) => (
                                  <option key={project.id} value={project.name}>
                                    {project.name} - {project.description || 'No description'}
                                  </option>
                                ))}
                              </select>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* New Project Name Input */}
                    {selectedProject === 'new' && (
                      <div>
                        <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Project Name
                        </label>
                        <input
                          id="projectName"
                          type="text"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          placeholder="my-awesome-app"
                          disabled={isDeploying}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isDeploying) {
                              handleDeploy();
                            }
                          }}
                        />
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          This will be your GitHub repository name and Vercel project name
                        </p>
                      </div>
                    )}

                    {/* Progress Messages */}
                    {progress.length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {progress.map((item, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex items-start gap-2 text-sm ${
                              item.type === 'error' 
                                ? 'text-red-600 dark:text-red-400' 
                                : item.type === 'success' 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {item.type === 'error' ? (
                              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            ) : item.type === 'success' ? (
                              <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Loader2 className="w-4 h-4 flex-shrink-0 mt-0.5 animate-spin" />
                            )}
                            <span>{item.message}</span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Deployment Result */}
                {deploymentResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {deploymentResult.success ? (
                      <>
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <Check className="w-6 h-6" />
                          <span className="text-lg font-semibold">Deployment Successful!</span>
                        </div>
                        <div className="space-y-3">
                          {deploymentResult.repoUrl && (
                            <a
                              href={deploymentResult.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                              <Github className="w-5 h-5" />
                              <span className="flex-1">View GitHub Repository</span>
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          {deploymentResult.liveUrl && (
                            <a
                              href={deploymentResult.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-lg hover:from-purple-200 hover:to-blue-200 dark:hover:from-purple-800 dark:hover:to-blue-800 transition-all"
                            >
                              <Rocket className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              <span className="flex-1 font-medium">Visit Live Site</span>
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <Link
                            href="/deployments"
                            className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-center justify-center"
                          >
                            <span className="font-medium">View All Deployments</span>
                          </Link>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-start gap-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-6 h-6 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">Deployment Failed</p>
                          <p className="text-sm mt-1">{deploymentResult.error}</p>
                          {deploymentResult.error === 'Please sign in to deploy' && (
                            <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
                              Redirecting to login page...
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t dark:border-gray-700">
                <button
                  onClick={closeModal}
                  disabled={isDeploying}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deploymentResult ? 'Close' : 'Cancel'}
                </button>
                {!deploymentResult && (
                  <button
                    onClick={handleDeploy}
                    disabled={isDeploying || (selectedProject === 'new' && !projectName.trim())}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-purple-600 disabled:hover:to-blue-600 flex items-center gap-2"
                  >
                    {isDeploying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4" />
                        {selectedProject === 'new' ? 'Deploy' : 'Redeploy'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}