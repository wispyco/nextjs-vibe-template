import { NextRequest, NextResponse } from 'next/server';
import { pusherServer, channels, events, DeploymentEvent } from '@/lib/pusher';
import crypto from 'crypto';

// Remove edge runtime to allow Node.js crypto module

interface VercelWebhookPayload {
  id: string;
  type: string;
  createdAt: number;
  payload: {
    deployment: {
      id: string;
      url: string;
      name: string;
      meta: {
        githubCommitRef?: string;
        githubCommitSha?: string;
        githubCommitMessage?: string;
        githubCommitAuthorName?: string;
        branchName?: string;
      };
    };
    project: {
      id: string;
      name: string;
    };
    team?: {
      id: string;
      name: string;
    };
    user: {
      id: string;
      username: string;
      email: string;
    };
    region: string;
    deploymentUrl: string;
  };
}

// Verify Vercel webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;
  
  const hash = crypto
    .createHmac('sha1', secret)
    .update(payload)
    .digest('hex');
  
  return `sha1=${hash}` === signature;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-vercel-signature');
    
    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.VERCEL_WEBHOOK_SECRET;
    if (webhookSecret && !verifyWebhookSignature(body, signature, webhookSecret)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload: VercelWebhookPayload = JSON.parse(body);
    console.log('Vercel webhook received:', payload.type);

    // Handle different webhook events
    switch (payload.type) {
      case 'deployment.created':
        await handleDeploymentCreated(payload);
        break;
        
      case 'deployment.succeeded':
        await handleDeploymentSucceeded(payload);
        break;
        
      case 'deployment.ready':
        await handleDeploymentReady(payload);
        break;
        
      case 'deployment.error':
      case 'deployment.failed':
        await handleDeploymentError(payload);
        break;
        
      default:
        console.log('Unhandled webhook event:', payload.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Vercel webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleDeploymentCreated(payload: VercelWebhookPayload) {
  const branch = payload.payload.deployment.meta.branchName || 
                 payload.payload.deployment.meta.githubCommitRef || 
                 'main';

  const event: DeploymentEvent = {
    url: payload.payload.deploymentUrl,
    state: 'building',
    branch,
    commitSha: payload.payload.deployment.meta.githubCommitSha,
  };

  await pusherServer.trigger(
    channels.deployment(branch),
    events.deploymentBuilding,
    event
  );
}

async function handleDeploymentSucceeded(payload: VercelWebhookPayload) {
  const branch = payload.payload.deployment.meta.branchName || 
                 payload.payload.deployment.meta.githubCommitRef || 
                 'main';

  const event: DeploymentEvent = {
    url: payload.payload.deploymentUrl,
    state: 'ready',
    branch,
    commitSha: payload.payload.deployment.meta.githubCommitSha,
  };

  await pusherServer.trigger(
    channels.deployment(branch),
    events.deploymentReady,
    event
  );
}

async function handleDeploymentReady(payload: VercelWebhookPayload) {
  const branch = payload.payload.deployment.meta.branchName || 
                 payload.payload.deployment.meta.githubCommitRef || 
                 'main';

  const event: DeploymentEvent = {
    url: payload.payload.deploymentUrl,
    state: 'ready',
    branch,
    commitSha: payload.payload.deployment.meta.githubCommitSha,
  };

  await pusherServer.trigger(
    channels.deployment(branch),
    events.deploymentReady,
    event
  );

  // Also trigger project-specific event if we have a project ID in metadata
  const projectId = payload.payload.deployment.meta.githubCommitMessage?.match(/project:(\w+)/)?.[1];
  if (projectId) {
    await pusherServer.trigger(
      channels.project(projectId),
      events.projectReady,
      {
        projectId,
        status: 'ready',
        message: 'Deployment is ready',
        data: {
          url: payload.payload.deploymentUrl,
          branch,
        },
      }
    );
  }
}

async function handleDeploymentError(payload: VercelWebhookPayload) {
  const branch = payload.payload.deployment.meta.branchName || 
                 payload.payload.deployment.meta.githubCommitRef || 
                 'main';

  const event: DeploymentEvent = {
    url: payload.payload.deploymentUrl,
    state: 'error',
    branch,
    commitSha: payload.payload.deployment.meta.githubCommitSha,
    error: 'Deployment failed',
  };

  await pusherServer.trigger(
    channels.deployment(branch),
    events.deploymentError,
    event
  );
}