-- Create vercel_tokens table for storing encrypted Vercel OAuth tokens
CREATE TABLE IF NOT EXISTS public.vercel_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_token TEXT NOT NULL,
    iv TEXT NOT NULL,
    auth_tag TEXT NOT NULL,
    team_id TEXT,
    installation_id TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.vercel_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only see their own tokens
CREATE POLICY "Users can view own vercel tokens" ON public.vercel_tokens
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert own vercel tokens" ON public.vercel_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update own vercel tokens" ON public.vercel_tokens
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete own vercel tokens" ON public.vercel_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- Create an index for faster lookups
CREATE INDEX idx_vercel_tokens_user_id ON public.vercel_tokens(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_vercel_tokens_updated_at
    BEFORE UPDATE ON public.vercel_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();