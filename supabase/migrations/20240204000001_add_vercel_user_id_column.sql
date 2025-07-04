-- Add vercel_user_id column to vercel_tokens table
ALTER TABLE public.vercel_tokens
ADD COLUMN IF NOT EXISTS vercel_user_id TEXT;