'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaGithub, FaRocket, FaClock, FaExternalLinkAlt, FaTrash } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Deployment {
  id: string;
  deployment_id: string;
  deployment_url: string;
  status: string;
  environment: string;
  created_at: string;
  completed_at: string | null;
}

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
  deployments: Deployment[];
}

interface ProjectListProps {
  onProjectSelect?: (project: Project) => void;
}

export default function ProjectList({ onProjectSelect }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      // Remove project from list
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (err) {
      alert('Failed to delete project');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
      case 'deployed':
        return 'text-green-600 dark:text-green-400';
      case 'building':
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchProjects}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <FaRocket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No projects yet</h3>
        <p className="text-gray-600 dark:text-gray-400">Deploy your first project to see it here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project, index) => {
        const latestDeployment = project.deployments[0];
        
        return (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {project.name}
                  </h3>
                  <span className={`text-sm font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
                
                {project.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {project.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <FaGithub />
                    <span>{project.github_repo}</span>
                    <FaExternalLinkAlt className="w-3 h-3" />
                  </a>

                  {latestDeployment && (
                    <a
                      href={`https://${latestDeployment.deployment_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                    >
                      <FaRocket />
                      <span>View Live</span>
                      <FaExternalLinkAlt className="w-3 h-3" />
                    </a>
                  )}

                  <span className="flex items-center gap-1 text-gray-500 dark:text-gray-500">
                    <FaClock />
                    {project.last_deployed_at
                      ? formatDistanceToNow(new Date(project.last_deployed_at), { addSuffix: true })
                      : 'Never deployed'}
                  </span>
                </div>

                {project.deployments.length > 0 && (
                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    {project.deployments.length} deployment{project.deployments.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => onProjectSelect?.(project)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  View Details
                </button>
                <button
                  onClick={() => deleteProject(project.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete project"
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}