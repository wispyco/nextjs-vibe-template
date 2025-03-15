import { Portkey } from "portkey-ai";
import { NextResponse, NextRequest } from "next/server";
import { getStylePrompt } from "@/config/styles";
import { SupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    // Create a server client with the admin service
    const supabase = await SupabaseAdmin.getInstance();
    
    // Parse the request body
    const body = await req.json();
    
    const { prompt, variation = '', framework, customStyle, requestId } = body;
    
    // Get the current user from the request cookies
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const user = data.user;
    
    // Check for duplicate request using SupabaseAdmin
    if (requestId) {
      try {
        const { data: existingRequest, error } = await SupabaseAdmin.getInstance().from('credit_history')
          .select('id')
          .eq('user_id', user.id)
          .eq('request_id', requestId)
          .maybeSingle();
        
        if (error) {
          console.error('[Generate] Error checking for duplicate request:', error);
        } else if (existingRequest) {
          console.log('[Generate] Duplicate request detected:', requestId);
          return NextResponse.json(
            { error: "Duplicate request" },
            { status: 409 }
          );
        }
      } catch (error) {
        console.error('[Generate] Error checking for duplicate request:', error);
      }
    }

    // Get user's credits using SupabaseAdmin
    const { credits, error: creditsError } = await SupabaseAdmin.getUserCredits(user.id);
    
    if (creditsError) {
      console.error('[Generate] Error getting user credits:', creditsError);
      return NextResponse.json(
        { error: "Failed to check credits" },
        { status: 500 }
      );
    }
    
    if (credits < 1) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 }
      );
    }

    // Get the style instructions from our central config
    const styleInstructions = customStyle || (framework && framework !== 'custom' 
      ? getStylePrompt(framework) 
      : '');
    
    const portkeyApiKey = process.env.PORTKEY_API_KEY;
    if (!portkeyApiKey) {
      return NextResponse.json(
        { error: "PORTKEY_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Configure Portkey with main provider (groq) and fallback (openrouter)
    const portkey = new Portkey({
      apiKey: portkeyApiKey,
      config: {
        strategy: {
          mode: "fallback",
        },
        targets: [
          {
            provider: "groq",
            config: {
              model: "llama3-70b-8192",
            },
          },
          {
            provider: "openrouter",
            config: {
              model: "anthropic/claude-3-opus:beta",
            },
          },
        ],
      },
    });

    // Construct the full prompt with style instructions
    let fullPrompt = prompt;
    
    if (styleInstructions) {
      fullPrompt = `${prompt}\n\nPlease follow these style guidelines:\n${styleInstructions}`;
    }

    if (variation) {
      fullPrompt = `${fullPrompt}\n\nFor this specific variation, focus on: ${variation}`;
    }

    try {
      const response = await portkey.chat.completions.create({
        messages: [{ role: "user", content: fullPrompt }],
        temperature: 0.7,
        max_tokens: 4096,
      });

      // Get the response content
      let code = response.choices[0]?.message?.content || "";

      if (!code) {
        console.error('[Generate] Empty code response from API');
        return NextResponse.json(
          { error: "Empty response from API" },
          { status: 500 }
        );
      }

      // Trim out any markdown code blocks (```html, ```, etc.)
      if (typeof code === 'string') {
        code = code
          .replace(/^```(?:html|javascript|js)?\n([\s\S]*?)```$/m, "$1")
          .trim();
      }
      
      // Trim out <think> blocks
      if (typeof code === 'string') {
        code = code.replace(/<think>([\s\S]*?)<\/think>/g, "");
      }

      // Deduct credits using SupabaseAdmin
      const { error: deductionError } = await SupabaseAdmin.deductGenerationCredit(
        user.id,
        requestId || null,
        variation || null
      );
      
      if (deductionError) {
        console.error('[Generate] Credit deduction failed:', deductionError);
        return NextResponse.json(
          { error: "Failed to deduct credits", details: deductionError.message },
          { status: 500 }
        );
      }

      // Get the updated credits
      const { credits: updatedCredits } = await SupabaseAdmin.getUserCredits(user.id);

      return NextResponse.json({
        code,
        credits: updatedCredits,
        model: response.model || "Unknown model",
        provider: response.provider || "Unknown provider",
      });
    } catch (error) {
      console.error('[Generate] Error generating code:', error);
      return NextResponse.json(
        { error: "Failed to generate code" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Generate] Unexpected error:', error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
