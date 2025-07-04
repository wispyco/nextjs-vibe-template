import { createDeployment } from '@vercel/client';
import { join } from 'path';

async function deploy() {
  try {
    const token = process.env.VERCEL_TOKEN;
    if (!token) {
      throw new Error('VERCEL_TOKEN environment variable is required');
    }

    let deploymentUrl: string | undefined;
    let deploymentState: string = 'pending';

    for await (const event of createDeployment({
      token,
      path: join(process.cwd()),
    })) {
      console.log(event.type, event.payload);
      
      if (event.type === 'created') {
        deploymentUrl = event.payload.url;
        console.log('Deployment started:', deploymentUrl);
      }
      
      if (event.type === 'ready') {
        deploymentState = 'ready';
        console.log('Deployment completed successfully');
        if (deploymentUrl) {
          console.log('Live URL:', `https://${deploymentUrl}`);
        }
        break;
      }
      
      if (event.type === 'error') {
        throw new Error(`Deployment error: ${JSON.stringify(event.payload)}`);
      }
    }
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

deploy();