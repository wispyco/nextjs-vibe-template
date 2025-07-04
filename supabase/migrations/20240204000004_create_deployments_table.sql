-- Create deployments table for tracking deployment history
CREATE TABLE IF NOT EXISTS public.deployments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    deployment_id TEXT NOT NULL, -- Vercel deployment ID
    deployment_url TEXT,
    github_commit_sha TEXT,
    github_commit_message TEXT,
    status TEXT DEFAULT 'pending', -- pending, building, ready, error, cancelled
    environment TEXT DEFAULT 'production', -- production, preview
    source TEXT DEFAULT 'manual', -- manual, git-push, redeploy
    error_message TEXT,
    metadata JSONB DEFAULT '{}', -- Additional Vercel deployment data
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only see their own deployments
CREATE POLICY "Users can view own deployments" ON public.deployments
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own deployments
CREATE POLICY "Users can insert own deployments" ON public.deployments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own deployments
CREATE POLICY "Users can update own deployments" ON public.deployments
    FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX idx_deployments_project_id ON public.deployments(project_id);
CREATE INDEX idx_deployments_user_id ON public.deployments(user_id);
CREATE INDEX idx_deployments_deployment_id ON public.deployments(deployment_id);
CREATE INDEX idx_deployments_status ON public.deployments(status);
CREATE INDEX idx_deployments_created_at ON public.deployments(created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER handle_deployments_updated_at
    BEFORE UPDATE ON public.deployments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();