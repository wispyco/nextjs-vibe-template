import { NextRequest, NextResponse } from 'next/server';
import { validateSyntax } from '@/lib/build-validator';

export const runtime = 'nodejs'; // Use Node.js runtime for file operations

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { files } = body;

    if (!files || typeof files !== 'object') {
      return NextResponse.json(
        { error: 'Files object is required' },
        { status: 400 }
      );
    }

    // Run syntax validation
    const validation = validateSyntax(files);

    return NextResponse.json({
      success: validation.success,
      errors: validation.errors,
      warnings: validation.warnings,
    });

  } catch (error) {
    console.error('Build validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate build' },
      { status: 500 }
    );
  }
}