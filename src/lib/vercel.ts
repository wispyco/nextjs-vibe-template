import { getVercelToken, getVercelTeamId } from './vercel-tokens';

export interface VercelProject {
  id: string;
  name: string;
  accountId: string;
  createdAt: number;
  framework?: string;
  gitRepository?: {
    type: string;
    repo: string;
    repoId: string | number;
  };
  link?: {
    type: string;
    repo: string;
    repoId: number;
    gitCredentialId?: string;
    sourceless?: boolean;
    createdAt: number;
    updatedAt: number;
    deployHooks?: Array<{
      createdAt: number;
      id: string;
      name: string;
      ref: string;
      url: string;
    }>;
  };
}

export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  created: number;
  creator: {
    uid: string;
    username: string;
  };
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  readyState: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  type: 'LAMBDAS';
  inspectorUrl: string;
  meta: Record<string, any>;
}

export interface CreateProjectParams {
  projectName: string;
  gitRepoId: string | number;
  gitRepoOwner: string;
  gitRepoName: string;
  framework?: string;
  rootDirectory?: string;
  buildCommand?: string;
  outputDirectory?: string;
  installCommand?: string;
  devCommand?: string;
}

export interface VercelError {
  error: {
    code: string;
    message: string;
  };
}

/**
 * Create a new Vercel project linked to a GitHub repository
 */
export async function createProjectWithRepo(params: CreateProjectParams): Promise<VercelProject> {
  const token = await getVercelToken();
  if (!token) {
    throw new Error('No Vercel integration found. Please connect your Vercel account.');
  }
  
  const teamId = await getVercelTeamId();
  
  const {
    projectName,
    gitRepoId,
    gitRepoOwner,
    gitRepoName,
    framework = 'nextjs',
    rootDirectory,
    buildCommand,
    outputDirectory,
    installCommand,
    devCommand,
  } = params;

  const url = teamId 
    ? `https://api.vercel.com/v9/projects?teamId=${teamId}`
    : 'https://api.vercel.com/v9/projects';
    
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: projectName,
      framework,
      publicSource: false,
      gitRepository: {
        type: 'github',
        repo: `${gitRepoOwner}/${gitRepoName}`,
        repoId: gitRepoId,
      },
      // Optional build settings
      ...(rootDirectory && { rootDirectory }),
      ...(buildCommand && { buildCommand }),
      ...(outputDirectory && { outputDirectory }),
      ...(installCommand && { installCommand }),
      ...(devCommand && { devCommand }),
    }),
  });

  if (!response.ok) {
    const error = await response.json() as VercelError;
    throw new Error(`Failed to create Vercel project: ${error.error?.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Trigger a new deployment for a project
 */
export async function triggerDeployment(
  projectName: string,
  gitBranch: string = 'main',
  repoId?: string | number,
  repoOwner?: string,
  repoName?: string
): Promise<VercelDeployment> {
  const token = await getVercelToken();
  if (!token) {
    throw new Error('No Vercel integration found. Please connect your Vercel account.');
  }
  
  const teamId = await getVercelTeamId();
  const url = teamId
    ? `https://api.vercel.com/v13/deployments?teamId=${teamId}`
    : `https://api.vercel.com/v13/deployments`;
    
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: projectName,
      project: projectName,
      gitSource: {
        ref: gitBranch,
        type: 'github',
        ...(repoId && { repoId: String(repoId) }),
        ...(repoOwner && repoName && { repo: `${repoOwner}/${repoName}` }),
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json() as VercelError;
    throw new Error(`Failed to trigger deployment: ${error.error?.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Get deployment status
 */
export async function getDeploymentStatus(
  deploymentId: string
): Promise<VercelDeployment> {
  const token = await getVercelToken();
  if (!token) {
    throw new Error('No Vercel integration found. Please connect your Vercel account.');
  }
  
  const teamId = await getVercelTeamId();
  const url = teamId
    ? `https://api.vercel.com/v13/deployments/${deploymentId}?teamId=${teamId}`
    : `https://api.vercel.com/v13/deployments/${deploymentId}`;
    
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json() as VercelError;
    throw new Error(`Failed to get deployment status: ${error.error?.message || response.statusText}`);
  }

  return response.json();
}

/**
 * List all projects for the authenticated user
 */
export async function listProjects(
  limit: number = 20
): Promise<{ projects: VercelProject[] }> {
  const token = await getVercelToken();
  if (!token) {
    throw new Error('No Vercel integration found. Please connect your Vercel account.');
  }
  
  const teamId = await getVercelTeamId();
  const url = teamId
    ? `https://api.vercel.com/v9/projects?limit=${limit}&teamId=${teamId}`
    : `https://api.vercel.com/v9/projects?limit=${limit}`;
    
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json() as VercelError;
    throw new Error(`Failed to list projects: ${error.error?.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Get a single project by name or ID
 */
export async function getProject(
  projectIdOrName: string
): Promise<VercelProject> {
  const token = await getVercelToken();
  if (!token) {
    throw new Error('No Vercel integration found. Please connect your Vercel account.');
  }
  
  const teamId = await getVercelTeamId();
  const url = teamId
    ? `https://api.vercel.com/v9/projects/${projectIdOrName}?teamId=${teamId}`
    : `https://api.vercel.com/v9/projects/${projectIdOrName}`;
    
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json() as VercelError;
    throw new Error(`Failed to get project: ${error.error?.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a project
 */
export async function deleteProject(
  projectIdOrName: string
): Promise<void> {
  const token = await getVercelToken();
  if (!token) {
    throw new Error('No Vercel integration found. Please connect your Vercel account.');
  }
  
  const teamId = await getVercelTeamId();
  const url = teamId
    ? `https://api.vercel.com/v9/projects/${projectIdOrName}?teamId=${teamId}`
    : `https://api.vercel.com/v9/projects/${projectIdOrName}`;
    
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json() as VercelError;
    throw new Error(`Failed to delete project: ${error.error?.message || response.statusText}`);
  }
}

/**
 * Update project settings
 */
export async function updateProject(
  projectIdOrName: string,
  settings: {
    buildCommand?: string;
    devCommand?: string;
    installCommand?: string;
    outputDirectory?: string;
    publicSource?: boolean;
    rootDirectory?: string;
  }
): Promise<VercelProject> {
  const token = await getVercelToken();
  if (!token) {
    throw new Error('No Vercel integration found. Please connect your Vercel account.');
  }
  
  const teamId = await getVercelTeamId();
  const url = teamId
    ? `https://api.vercel.com/v9/projects/${projectIdOrName}?teamId=${teamId}`
    : `https://api.vercel.com/v9/projects/${projectIdOrName}`;
    
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const error = await response.json() as VercelError;
    throw new Error(`Failed to update project: ${error.error?.message || response.statusText}`);
  }

  return response.json();
}

/**
 * List deployments for a project
 */
export async function listDeployments(
  projectId: string,
  limit: number = 10
): Promise<{ deployments: VercelDeployment[] }> {
  const token = await getVercelToken();
  if (!token) {
    throw new Error('No Vercel integration found. Please connect your Vercel account.');
  }
  
  const teamId = await getVercelTeamId();
  const url = teamId
    ? `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=${limit}&teamId=${teamId}`
    : `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=${limit}`;
    
  const response = await fetch(url,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json() as VercelError;
    throw new Error(`Failed to list deployments: ${error.error?.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Get or create a deploy hook for a project
 */
export async function getOrCreateDeployHook(
  projectIdOrName: string,
  branch: string = 'main'
): Promise<{ id: string; url: string }> {
  const token = await getVercelToken();
  if (!token) {
    throw new Error('No Vercel integration found. Please connect your Vercel account.');
  }
  
  const teamId = await getVercelTeamId();
  
  // First, get the project to check for existing hooks
  const project = await getProject(projectIdOrName);
  
  // Check if a deploy hook already exists for this branch
  const existingHook = project.link?.deployHooks?.find(hook => hook.ref === branch);
  if (existingHook) {
    return { id: existingHook.id, url: existingHook.url };
  }

  // Create a new deploy hook
  const url = teamId
    ? `https://api.vercel.com/v9/projects/${projectIdOrName}/deploy-hooks?teamId=${teamId}`
    : `https://api.vercel.com/v9/projects/${projectIdOrName}/deploy-hooks`;
    
  const response = await fetch(url,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `vibe-web-${branch}`,
        ref: branch,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json() as VercelError;
    throw new Error(`Failed to create deploy hook: ${error.error?.message || response.statusText}`);
  }

  const hook = await response.json();
  return { id: hook.id, url: hook.url };
}