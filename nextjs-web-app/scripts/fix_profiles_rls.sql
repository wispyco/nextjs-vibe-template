-- Fix script for profiles table RLS and policies
-- Run this directly with psql before running supabase db push

-- First, drop any existing policies on the profiles table
DO $$
BEGIN
    -- Drop policies if they exist
    BEGIN
        DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping policy "Users can view own profile": %', SQLERRM;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping policy "Users can update own profile": %', SQLERRM;
    END;
END $$;

-- Disable RLS on the profiles table (if it's enabled)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS on the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Output success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully fixed profiles table RLS settings';
END $$;
