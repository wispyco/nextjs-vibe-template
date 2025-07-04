import { NextResponse, NextRequest } from "next/server";
import { generateWebApp } from "@/lib/generate";
import { generateWebApp as generateMultiFileApp } from "@/lib/ai/generateWebApp";
import { convertHtmlToNextJs } from "@/lib/html-to-nextjs";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      prompt, 
      variation, 
      framework, 
      isUpdate, 
      existingCode,
      multiFile = false,  // New parameter to enable multi-file generation
      projectType,        // nextjs, remix, vite, static
    } = body;

    // If multiFile is requested, use the new AI generation
    if (multiFile && projectType) {
      try {
        const project = await generateMultiFileApp({
          prompt: `${prompt}${variation ? `\n\nVariation: ${variation}` : ''}`,
          framework: projectType,
          styling: framework || 'tailwind',
          typescript: true,
        });

        return NextResponse.json({
          success: true,
          multiFile: true,
          project,
        });
      } catch (error) {
        console.error("Multi-file generation error:", error);
        // Fall back to single file generation
      }
    }

    // Default: Generate Next.js project from HTML
    try {
      // First generate HTML code
      const htmlCode = await generateWebApp(
        prompt,
        variation || "",
        framework || "tailwind",
        isUpdate || false,
        existingCode || ""
      );

      // Clean up the code if needed
      let cleanedCode = htmlCode;
      
      // Trim out any markdown code blocks (```html, ```, etc.)
      cleanedCode = cleanedCode
        .replace(/^```(?:html|javascript|js)?\n([\s\S]*?)```$/m, "$1")
        .trim();

      // Strip everything before the starting <html> tag (case insensitive)
      if (typeof cleanedCode === 'string') {
        const htmlStartMatch = cleanedCode.match(/<html[^>]*>/i);
        if (htmlStartMatch) {
          const htmlStartIndex = cleanedCode.indexOf(htmlStartMatch[0]);
          cleanedCode = cleanedCode.substring(htmlStartIndex);
        }
      }

      // Convert HTML to Next.js project
      const projectName = prompt.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      
      const project = convertHtmlToNextJs(
        cleanedCode,
        projectName,
        prompt.substring(0, 200)
      );

      // Return the project structure for deployment
      return NextResponse.json({ 
        code: cleanedCode, // Keep for backwards compatibility
        project: project, // New Next.js project structure
        isNextJs: true
      });
    } catch (error) {
      console.error("Error generating code:", error);
      
      // Return a more specific error message if available
      const errorMessage = error instanceof Error ? error.message : "Failed to generate code";
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to generate code" },
      { status: 500 }
    );
  }
}