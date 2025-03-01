import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { NextResponse } from 'next/server';

const frameworkPrompts = {
  tailwind: 'Use Tailwind CSS for styling with modern utility classes. Include the Tailwind CDN.',
  materialize: 'Use Materialize CSS framework for a Material Design look. Include the Materialize CDN.',
  bootstrap: 'Use Bootstrap 5 for responsive components and layout. Include the Bootstrap CDN.',
  patternfly: 'Use PatternFly 4 for enterprise-grade UI components. Include the PatternFly CDN.',
  bulma: 'Use Bulma CSS framework for a modern look. Include the Bulma CDN.',
  pure: 'Use Pure CSS for minimalist, responsive design. Include the Pure CSS CDN.'
};

// Initialize AWS Bedrock client
const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    const { prompt, variation, framework, existingCode, isUpdate } = await req.json();
    
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json({ error: 'AWS credentials not configured' }, { status: 500 });
    }

    const frameworkInstructions = framework ? frameworkPrompts[framework as keyof typeof frameworkPrompts] : '';

    const fullPrompt = isUpdate 
      ? `You are an HTML code updater. Given the following existing HTML code and update request, modify the code according to the request while maintaining the existing structure and styling.

Existing code:
${existingCode}

Update request:
${prompt}

Requirements:
- Preserve the existing framework and styling
- Keep the same overall structure
- Only modify what's necessary based on the update request
- Ensure the code remains complete and self-contained
- Maintain all necessary CSS and JS

IMPORTANT: Output only the updated HTML code with no other text.`
      : `You are an HTML generator. Respond with ONLY valid HTML code. No introduction, no explanation, no markdown formatting.

Requirements:
${prompt}
${variation ? `Variation: ${variation}\n` : ''}${frameworkInstructions ? `Framework: ${frameworkInstructions}\n` : ''}

Your response must:
- Start with <!DOCTYPE html>
- Include all necessary CSS and JS inline
- Be complete and self-contained
- Work in an iframe
- Use semantic HTML5 elements
- Be responsive
- Follow framework-specific best practices

IMPORTANT: Output only the HTML code with no other text.`;

    const input = {
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
      }),
    };

    const command = new InvokeModelCommand(input);
    const response = await client.send(command);

    // Parse the response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const generatedCode = responseBody.content[0].text.trim();

    return NextResponse.json({ code: generatedCode });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate code' },
      { status: 500 }
    );
  }
}
