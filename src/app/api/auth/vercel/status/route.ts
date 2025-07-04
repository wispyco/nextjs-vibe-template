import { NextResponse } from 'next/server';
import { hasValidVercelToken } from '@/lib/vercel-tokens';

export const runtime = 'edge';

export async function GET() {
  try {
    const connected = await hasValidVercelToken();
    return NextResponse.json({ connected });
  } catch (error) {
    console.error('Failed to check Vercel token status:', error);
    return NextResponse.json({ connected: false });
  }
}