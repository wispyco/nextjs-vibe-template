# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**vibeweb.app** is an AI-powered web application generator that creates multiple variations of web applications from a single user prompt. Users can generate 1-6 different implementations of their idea, each with unique approaches and styling.

## Common Development Commands

```bash
# Development server with Turbopack (fast refresh)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run ESLint
npm run lint

# Deploy to Vercel (requires VERCEL_TOKEN env var)
npm run deploy
```

## High-Level Architecture

### Technology Stack
- **Framework**: Next.js 15.2.0 with TypeScript
- **Runtime**: Edge runtime for API routes
- **AI Integration**: Custom AI agent gateway backend
  - Endpoint: `${NEXT_PUBLIC_VIBE_BACKEND}/ai/generate`
  - Returns either git patches or direct HTML code
- **Styling**: Tailwind CSS v4, Styled Components, Framer Motion
- **State Management**: Jotai
- **Code Execution**: E2B SDK for sandboxed execution

### Project Structure
```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes (edge runtime)
│   │   └── generate/      # Main AI generation endpoint
│   ├── results/           # Results display page
│   ├── page.tsx           # Home page with prompt input
│   └── layout.tsx         # Root layout with metadata
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── DevTools/         # Developer tools (prompt input, voice)
│   ├── AppTile.tsx       # Individual app preview tile
│   ├── CodePreviewPanel.tsx  # Code editor view
│   └── FullscreenPreview.tsx # Full screen app preview
├── context/              # React contexts
│   └── ThemeContext.tsx  # Dark/light theme management
└── lib/                  # Utility functions
```

### Key API Endpoints

**`/api/generate` (POST)**
- Proxies requests to the AI agent gateway backend
- Supports both new generation and code updates
- Request body:
  ```typescript
  {
    prompt: string;
    variation: string;
    framework: "tailwind" | "materialize" | "bootstrap" | "patternfly" | "pure";
    isUpdate?: boolean;
    existingCode?: string;
  }
  ```
- The backend gateway handles:
  - AI model selection (GPT-4, Claude, etc.)
  - Tool chaining for complex generation
  - Git patch generation for incremental updates

**`/api/chat/claude` (POST)**
- Direct Claude API endpoint for chat completions
- Uses Claude 3.5 Sonnet model
- Request body:
  ```typescript
  {
    prompt: string;
  }
  ```
- Response:
  ```typescript
  {
    completion: string;
  }
  ```

### Application Flow

1. **Home Page** (`/page.tsx`)
   - User enters prompt describing desired web app
   - Selects number of variations (1-6)
   - Submits to results page

2. **Results Page** (`/results/page.tsx`)
   - Calls `/api/generate` endpoint for each variation in parallel
   - Displays loading states for each generation
   - Shows app previews in iframes with code editing capabilities
   - Allows fullscreen preview and code updates

3. **Generation Process**
   - Each variation gets different instructions (visual focus, minimalist, creative, etc.)
   - AI generates complete, self-contained HTML files
   - Code includes inline CSS and JavaScript
   - Optimized for iframe rendering

## Important Configuration Notes

### Environment Variables Required
```bash
# Core Application
NEXT_PUBLIC_VIBE_BACKEND=     # Required: URL of the AI agent gateway (e.g., https://api.vibeweb.app)
NEXT_PUBLIC_APP_URL=          # Required: Your app's base URL (e.g., https://vibeweb.app)

# AI Integration
CLAUDE_API_KEY=               # Required for /api/chat/claude endpoint

# Vercel Integration (OAuth)
VERCEL_CLIENT_ID=             # Required: From Vercel Integration dashboard
VERCEL_CLIENT_SECRET=         # Required: From Vercel Integration dashboard  
VERCEL_TOKEN_ENCRYPTION_KEY=  # Required: Hex string for token encryption (generate with: openssl rand -hex 32)
VERCEL_WEBHOOK_SECRET=        # Optional: For deployment webhooks

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=     # Required: Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Required: Your Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=    # Required: For server-side operations

# Pusher (Real-time updates)
PUSHER_APP_ID=                # Required: For real-time deployment updates
PUSHER_KEY=                   # Required: Public key
PUSHER_SECRET=                # Required: Secret key
PUSHER_CLUSTER=               # Required: Your Pusher cluster
NEXT_PUBLIC_PUSHER_KEY=       # Required: Same as PUSHER_KEY
NEXT_PUBLIC_PUSHER_CLUSTER=   # Required: Same as PUSHER_CLUSTER
```

### Build Configuration Issues
**WARNING**: The project currently ignores TypeScript and ESLint errors during builds:
- `next.config.ts` has `ignoreBuildErrors: true` for TypeScript
- `next.config.ts` has `ignoreDuringBuilds: true` for ESLint
- Consider removing these for production deployments

### Missing Infrastructure
- **No test files or testing framework** - Consider adding Jest/Vitest
- **No CI/CD pipeline** - Only manual Vercel deployment
- **Limited error handling** - Add proper error boundaries
- **No monitoring/analytics** - Consider adding error tracking

## Development Workflow Tips

### Working with the AI Agent Gateway
- The app now uses a custom backend gateway instead of direct AI provider calls
- The gateway handles all AI orchestration, model selection, and tool chaining
- Framework instructions and prompt engineering are handled by the backend
- The frontend simply sends the user's request and receives generated code

### Modifying UI Components
- All components support both dark and light themes via `ThemeContext`
- Use existing UI components from `src/components/ui/` for consistency
- Animations use Framer Motion - maintain consistent animation patterns

### Adding New Features
1. **New CSS Frameworks**: Add to `frameworkPrompts` in `/api/generate/route.ts`
2. **New Variations**: Modify `variations` array in `/results/page.tsx`
3. **UI Changes**: Check both dark and light theme appearances

### Code Generation Prompts
- The AI is instructed to create complete, self-contained HTML files
- All code must work properly when rendered in an iframe
- Emphasis on avoiding generic patterns (like todo lists) unless specifically requested

## Vercel Integration Setup

### Creating a Vercel Integration

1. **Navigate to Vercel Dashboard**
   - Go to https://vercel.com/dashboard/integrations
   - Click "Create Integration"

2. **Fill Integration Details**
   - **Name**: "Vibe Web Deploy" (or your preferred name)
   - **Logo**: Upload a 32x32 PNG icon
   - **Redirect URL**: 
     - Production: `https://your-app.com/api/auth/vercel/callback`
     - Development: `http://localhost:3000/api/auth/vercel/callback`

3. **Configure OAuth Scopes**
   ```
   read:projects
   write:projects
   read:deployments
   write:deployments
   offline_access
   ```

4. **Save Credentials**
   After creating the integration, save the Client ID and Client Secret to your `.env.local`:
   ```bash
   VERCEL_CLIENT_ID=oac_xxxxxxxxxxxxx
   VERCEL_CLIENT_SECRET=xxxxxxxxxxxxx
   ```

5. **Generate Encryption Key**
   ```bash
   # Generate a secure encryption key for token storage
   openssl rand -hex 32
   ```
   Add to `.env.local`:
   ```bash
   VERCEL_TOKEN_ENCRYPTION_KEY=your_generated_key_here
   ```

### Integration vs "Sign in with Vercel"

This app uses a **Vercel Integration** (not "Sign in with Vercel"):
- **Integration**: Allows users to grant your app permissions to manage their Vercel projects
- **"Sign in with Vercel"**: A future identity product for authentication (not yet publicly available)

The Integration approach gives you:
- Access to create projects in user's Vercel account
- Ability to trigger deployments
- Read deployment status and logs
- Manage environment variables

## Common Tasks

### Running the Development Server
```bash
npm run dev
# Opens at http://localhost:3000
```

### Testing AI Generation Locally
1. Ensure `NEXT_PUBLIC_VIBE_BACKEND` is set in `.env.local`
2. Run dev server
3. Test with simple prompts first
4. Check browser console for API errors
5. Verify the backend gateway is running and accessible

### Debugging Generation Issues
- Check `/api/generate` logs for provider fallback messages
- Verify generated HTML is complete (not truncated)
- Ensure all CDN links in generated code are accessible

### Updating Dependencies
```bash
npm update
npm run build  # Verify build still works
```

Note: Always test thoroughly after updates as the app relies on specific AI model behaviors.