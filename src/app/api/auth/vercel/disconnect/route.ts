import { NextResponse } from 'next/server';
import { deleteVercelToken } from '@/lib/vercel-tokens';

export const runtime = 'edge';

export async function POST() {
  try {
    await deleteVercelToken();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to disconnect Vercel integration:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}