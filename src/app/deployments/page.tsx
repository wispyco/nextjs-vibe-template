'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaRocket, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';
import ProjectList from '@/components/DeploymentManager/ProjectList';
import DeploymentHistory from '@/components/DeploymentManager/DeploymentHistory';
import { AuroraBackground } from '@/components/ui/aurora-background';

interface Project {
  id: string;
  name: string;
  description: string;
  github_repo: string;
  github_url: string;
  vercel_project_name: string;
  status: string;
  last_deployed_at: string;
  created_at: string;
  deployments: any[];
}

export default function DeploymentsPage() {
  const { theme } = useTheme();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen p-4 sm:p-8"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className={`flex items-center gap-2 hover:underline transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FaArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
              <ThemeToggle />
            </div>
            <h1 className={`text-2xl sm:text-3xl font-bold flex items-center gap-3 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <FaRocket className="text-purple-600" />
              Deployment Manager
            </h1>
          </div>

          {/* Content */}
          {selectedProject ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                      {selectedProject.name}
                    </h2>
                    {selectedProject.description && (
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedProject.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/projects/${selectedProject.id}/edit`}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Project
                    </Link>
                    <button
                      onClick={() => setSelectedProject(null)}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Back to Projects
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Project Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">GitHub Repository:</span>
                        <a
                          href={selectedProject.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          {selectedProject.github_repo}
                        </a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Vercel Project:</span>
                        <span className="text-gray-900 dark:text-white">
                          {selectedProject.vercel_project_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <span className="text-gray-900 dark:text-white capitalize">
                          {selectedProject.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Deployment History
                    </h3>
                    <div className="max-h-96 overflow-y-auto">
                      <DeploymentHistory 
                        projectId={selectedProject.id}
                        projectName={selectedProject.name}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-lg p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Your Projects
              </h2>
              <ProjectList onProjectSelect={setSelectedProject} />
            </motion.div>
          )}
        </div>
      </motion.div>
    </AuroraBackground>
  );
}