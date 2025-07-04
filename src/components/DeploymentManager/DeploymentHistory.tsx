'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock, 
  FaSpinner, 
  FaExternalLinkAlt,
  FaGitAlt,
  FaRedo
} from 'react-icons/fa';
import { formatDistanceToNow, format } from 'date-fns';

interface Deployment {
  id: string;
  deployment_id: string;
  deployment_url: string;
  github_commit_sha: string | null;
  github_commit_message: string | null;
  status: string;
  environment: string;
  source: string;
  error_message: string | null;
  metadata: any;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

interface DeploymentHistoryProps {
  projectId: string;
  projectName?: string;
}

export default function DeploymentHistory({ projectId, projectName }: DeploymentHistoryProps) {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDeployments();
    // Poll for updates every 10 seconds if there are pending deployments
    const interval = setInterval(() => {
      if (deployments.some(d => d.status === 'pending' || d.status === 'building')) {
        fetchDeployments();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [projectId]);

  const fetchDeployments = async () => {
    try {
      const response = await fetch(`/api/deployments?project_id=${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch deployments');
      }
      const data = await response.json();
      setDeployments(data.deployments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deployments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <FaCheckCircle className="text-green-600 dark:text-green-400" />;
      case 'building':
      case 'pending':
        return <FaSpinner className="text-yellow-600 dark:text-yellow-400 animate-spin" />;
      case 'error':
      case 'cancelled':
        return <FaTimesCircle className="text-red-600 dark:text-red-400" />;
      default:
        return <FaClock className="text-gray-600 dark:text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'git-push':
        return <FaGitAlt className="w-4 h-4" />;
      case 'redeploy':
        return <FaRedo className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400">Loading deployment history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (deployments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">No deployments yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {deployments.map((deployment, index) => (
        <motion.div
          key={deployment.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-1">{getStatusIcon(deployment.status)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {getStatusLabel(deployment.status)}
                  </span>
                  {deployment.source && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                      {getSourceIcon(deployment.source)}
                      {deployment.source}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {deployment.environment}
                  </span>
                </div>

                {deployment.github_commit_message && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {deployment.github_commit_message}
                  </p>
                )}

                {deployment.error_message && (
                  <p className="text-sm text-red-600 dark:text-red-400 mb-1">
                    Error: {deployment.error_message}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                  <span>
                    Started {formatDistanceToNow(new Date(deployment.started_at), { addSuffix: true })}
                  </span>
                  {deployment.completed_at && (
                    <span>
                      Duration: {Math.round(
                        (new Date(deployment.completed_at).getTime() - new Date(deployment.started_at).getTime()) / 1000
                      )}s
                    </span>
                  )}
                </div>
              </div>
            </div>

            {deployment.deployment_url && deployment.status === 'ready' && (
              <a
                href={`https://${deployment.deployment_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              >
                <span>View</span>
                <FaExternalLinkAlt className="w-3 h-3" />
              </a>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}