import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, variation } = await req.json();
    
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
    }

    const client = new OpenAI({
      apiKey: groqApiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    const fullPrompt = `Create a well-structured, modern web application:

Instructions:
1. Base functionality: ${prompt}
2. Variation: ${variation}

Technical Requirements:
- Create a single HTML file with clean, indented code structure
- Organize the code in this order:
  1. <!DOCTYPE html> and meta tags
  2. <title> and other head elements
  3. CSS styles in a <style> tag
  4. HTML body with semantic markup
  5. JavaScript in a <script> tag at the end of body
- Use proper HTML5 semantic elements
- Include clear spacing between sections
- Add descriptive comments for each major component
- Ensure responsive design with mobile-first approach
- Use modern ES6+ JavaScript features
- Keep the code modular and well-organized
- Ensure all interactive elements have proper styling states (hover, active, etc.)

Additional Notes:
- The code must be complete and immediately runnable
- All CSS and JavaScript should be included inline
- Code must work properly when rendered in an iframe
- Focus on clean, maintainable code structure
- Return ONLY the HTML file content without any explanations

Format the code with proper indentation and spacing for readability.`;

    const response = await client.chat.completions.create({
      model: 'mixtral-8x7b-32768',
      messages: [{ role: 'user', content: fullPrompt }],
      temperature: 0.7,
      max_tokens: 2048,
    });

    return NextResponse.json({ code: response.choices[0].message.content });
  } catch (error) {
    console.error('Error generating code:', error);
    return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 });
  }
}
