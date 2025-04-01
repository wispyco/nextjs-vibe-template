-- Fix migration to handle existing profiles table and policies
-- This migration ensures we have a clean state before applying the full schema

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
    
    -- Add more policy drops if needed
END $$;

-- Disable RLS on the profiles table (if it's enabled)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS on the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Now we can recreate the policies in the subsequent migrations
