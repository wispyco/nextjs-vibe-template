import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// Client-side Pusher instance factory
export function createPusherClient() {
  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  });
}

// Event types for type safety
export interface DeploymentEvent {
  url: string;
  state: 'building' | 'ready' | 'error';
  branch: string;
  commitSha?: string;
  error?: string;
}

export interface ProjectUpdateEvent {
  projectId: string;
  status: 'generating' | 'committing' | 'deploying' | 'ready' | 'error';
  message: string;
  data?: any;
}

// Channel naming conventions
export const channels = {
  // For deployment updates
  deployment: (branch: string) => `deployment-${branch}`,
  
  // For project updates
  project: (projectId: string) => `project-${projectId}`,
  
  // For user-specific updates
  user: (userId: string) => `user-${userId}`,
} as const;

// Event names
export const events = {
  deploymentReady: 'deployment:ready',
  deploymentError: 'deployment:error',
  deploymentBuilding: 'deployment:building',
  
  projectUpdate: 'project:update',
  projectGenerated: 'project:generated',
  projectCommitted: 'project:committed',
  projectDeploying: 'project:deploying',
  projectReady: 'project:ready',
  projectError: 'project:error',
} as const;