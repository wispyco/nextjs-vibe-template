import { NextResponse } from 'next/server';
import { getVercelToken } from '@/lib/vercel-tokens';
import { listProjects } from '@/lib/vercel';

export async function GET() {
  try {
    // Check if we have a token
    const hasToken = await getVercelToken();
    
    if (!hasToken) {
      return NextResponse.json({ 
        success: false, 
        message: 'No Vercel token found' 
      });
    }

    // Try to list projects to verify the token works
    const projects = await listProjects(5);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Vercel integration is working!',
      projectCount: projects.projects.length,
      projects: projects.projects.map(p => ({
        name: p.name,
        id: p.id,
        createdAt: new Date(p.createdAt).toLocaleDateString()
      }))
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Error testing Vercel integration',
      error: error.message 
    });
  }
}