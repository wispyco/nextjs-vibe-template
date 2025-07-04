// Interface for Git patches that the AI agent gateway returns
export interface GitPatch {
  path: string;
  content: string;
  action: 'create' | 'modify' | 'delete';
}

// Interface for the generation request
export interface GenerateRequest {
  prompt: string;
  files?: Record<string, string>;
  variation?: string;
  framework?: string;
  isUpdate?: boolean;
  existingCode?: string;
}

// Interface for the generation response
export interface GenerateResponse {
  patches?: GitPatch[];
  code?: string;
  error?: string;
}

/**
 * Calls the AI agent gateway to generate web application code
 * @param request - The generation request parameters
 * @returns The generated code or git patches
 */
export async function generateFromVibe(request: GenerateRequest): Promise<GenerateResponse> {
  const backendUrl = process.env.NEXT_PUBLIC_VIBE_BACKEND;
  
  // If no backend URL is configured, use direct Claude API as fallback
  if (!backendUrl) {
    try {
      const frameworkInstructions: Record<string, string> = {
        tailwind: 'Use Tailwind CSS classes for styling. Include the Tailwind CSS CDN.',
        bootstrap: 'Use Bootstrap 5 classes for styling. Include the Bootstrap CDN.',
        materialize: 'Use Materialize CSS for Material Design styling. Include the Materialize CDN.',
        patternfly: 'Use PatternFly 5 for enterprise UI patterns. Include the PatternFly CDN.',
        pure: 'Use Pure CSS for a minimal, responsive design. Include the Pure CSS CDN.',
      };

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: `Create a complete, single-file HTML web application based on this request: "${request.prompt}"
              
              ${request.variation ? `Variation instructions: ${request.variation}` : ''}
              ${request.isUpdate && request.existingCode ? `Update this existing code: ${request.existingCode}` : ''}
              
              Framework: ${frameworkInstructions[request.framework || 'tailwind'] || frameworkInstructions.tailwind}
              
              Requirements:
              - Create a COMPLETE, self-contained HTML file
              - Include all CSS inline in <style> tags or use CDN links
              - Include all JavaScript inline in <script> tags
              - Make it visually appealing, modern, and fully functional
              - Ensure the design is responsive and works on mobile
              - Add smooth interactions and animations where appropriate
              - The entire response should be valid HTML that can be saved as an .html file
              
              Return ONLY the HTML code, no explanations or markdown.`
            }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      return { code: data.content[0].text };
    } catch (error) {
      console.error('Error calling Claude API:', error);
      throw error;
    }
  }

  // Original code for when backend is configured
  try {
    const response = await fetch(`${backendUrl}/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: request.prompt,
        files: request.files || {},
        variation: request.variation,
        framework: request.framework,
        isUpdate: request.isUpdate,
        existingCode: request.existingCode,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as GenerateResponse;
    
    // Handle both patch-based and direct code responses
    if (data.patches && data.patches.length > 0) {
      // If patches are returned, we could process them here
      // For now, we'll assume the backend handles patch application
      return data;
    } else if (data.code) {
      // Direct code response
      return { code: data.code };
    } else if (data.error) {
      throw new Error(data.error);
    } else {
      throw new Error('Invalid response from AI agent gateway');
    }
  } catch (error) {
    console.error('Error calling AI agent gateway:', error);
    throw error;
  }
}

/**
 * Legacy wrapper for backward compatibility with existing code
 * @param prompt - The user prompt
 * @param variation - The variation instructions
 * @param framework - The CSS framework to use
 * @param isUpdate - Whether this is an update to existing code
 * @param existingCode - The existing code to update
 * @returns The generated code
 */
export async function generateWebApp(
  prompt: string,
  variation: string = '',
  framework: string = 'tailwind',
  isUpdate: boolean = false,
  existingCode: string = ''
): Promise<string> {
  const response = await generateFromVibe({
    prompt,
    variation,
    framework,
    isUpdate,
    existingCode,
  });

  if (response.code) {
    return response.code;
  } else if (response.patches && response.patches.length > 0) {
    // If we get patches, we could convert them to a single HTML file
    // For now, we'll just return the first patch's content
    return response.patches[0]?.content || '';
  } else {
    throw new Error('No code generated');
  }
}