import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'edge';

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY! });

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  const msg = await client.messages.create({
    model: 'claude-3-5-sonnet',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });
  return NextResponse.json({ completion: msg.content[0].text });
}