-- Create projects table for tracking deployed projects
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    github_repo TEXT NOT NULL, -- full repo name (owner/repo)
    github_owner TEXT NOT NULL,
    github_name TEXT NOT NULL,
    github_url TEXT NOT NULL,
    vercel_project_id TEXT,
    vercel_project_name TEXT,
    is_private BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'created', -- created, deployed, error
    framework TEXT, -- tailwind, bootstrap, etc.
    last_deployed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only see their own projects
CREATE POLICY "Users can view own projects" ON public.projects
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own projects
CREATE POLICY "Users can insert own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects" ON public.projects
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_github_repo ON public.projects(github_repo);
CREATE INDEX idx_projects_status ON public.projects(status);

-- Create updated_at trigger
CREATE TRIGGER handle_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();