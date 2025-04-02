-- Schema file for Supabase dashboard SQL editor
-- This file contains all the schema changes needed to match the local database

-- Handle profiles table
DO $$ 
BEGIN
  -- Check if profiles table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'profiles'
  ) THEN
    -- Create profiles table if it doesn't exist
    CREATE TABLE public.profiles (
      id UUID REFERENCES auth.users(id) PRIMARY KEY,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
    );
  END IF;

  -- Add columns if they don't exist
  -- Credits column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'credits'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN credits INTEGER DEFAULT 30 NOT NULL;
  ELSE
    -- Update default value if column exists
    ALTER TABLE public.profiles ALTER COLUMN credits SET DEFAULT 30;
  END IF;

  -- Subscription tier column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free' NOT NULL;
  ELSE
    -- Update default value if column exists
    ALTER TABLE public.profiles ALTER COLUMN subscription_tier SET DEFAULT 'free';
  END IF;

  -- Stripe customer ID column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN stripe_customer_id TEXT;
  END IF;

  -- Stripe subscription ID column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN stripe_subscription_id TEXT;
  END IF;

  -- Last credit refresh column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_credit_refresh'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN last_credit_refresh TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Subscription status column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_status TEXT;
  END IF;

  -- Role column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
  END IF;

  -- Remove deprecated columns
  ALTER TABLE public.profiles DROP COLUMN IF EXISTS max_daily_credits;
  ALTER TABLE public.profiles DROP COLUMN IF EXISTS max_monthly_credits;
  ALTER TABLE public.profiles DROP COLUMN IF EXISTS last_credited_at;
END $$;

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Policy to allow individuals to view their own profile
DO $$
BEGIN
  BEGIN
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    CREATE POLICY "Users can view own profile"
      ON public.profiles
      FOR SELECT
      USING (auth.uid() = id);
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Users can view own profile" already exists, skipping';
  END;

  BEGIN
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    -- Policy to allow individuals to update their own profile
    CREATE POLICY "Users can update own profile"
      ON public.profiles
      FOR UPDATE
      USING (auth.uid() = id);
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Users can update own profile" already exists, skipping';
  END;
END $$;

-- Create or replace the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    credits,
    subscription_tier,
    last_credit_refresh
  )
  VALUES (
    new.id, 
    30, -- Default free credits
    'free', -- Default plan
    now() -- Set initial refresh timestamp to now
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create credit_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.credit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up RLS for credit_history
ALTER TABLE public.credit_history ENABLE ROW LEVEL SECURITY;

-- Create policies for credit_history
DO $$
BEGIN
  BEGIN
    DROP POLICY IF EXISTS "Users can view own credit history" ON public.credit_history;
    CREATE POLICY "Users can view own credit history"
      ON public.credit_history
      FOR SELECT
      USING (auth.uid() = user_id);
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Users can view own credit history" already exists, skipping';
  END;

  BEGIN
    DROP POLICY IF EXISTS "Service role can manage all credit history" ON public.credit_history;
    CREATE POLICY "Service role can manage all credit history"
      ON public.credit_history
      USING (auth.role() = 'service_role');
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Service role can manage all credit history" already exists, skipping';
  END;
END $$;

-- Create subscription_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL,
  status TEXT NOT NULL,
  amount_paid DECIMAL(10, 2),
  currency TEXT,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up RLS for subscription_history
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Create policies for subscription_history
DO $$
BEGIN
  BEGIN
    DROP POLICY IF EXISTS "Users can view own subscription history" ON public.subscription_history;
    CREATE POLICY "Users can view own subscription history"
      ON public.subscription_history
      FOR SELECT
      USING (auth.uid() = user_id);
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Users can view own subscription history" already exists, skipping';
  END;

  BEGIN
    DROP POLICY IF EXISTS "Service can insert subscription history" ON public.subscription_history;
    CREATE POLICY "Service can insert subscription history"
      ON public.subscription_history
      FOR INSERT
      WITH CHECK (true);
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Service can insert subscription history" already exists, skipping';
  END;
END $$;

-- Create credit_purchases table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.credit_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  cost DECIMAL(10, 2) NOT NULL CHECK (cost > 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS credit_purchases_user_id_idx ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS credit_purchases_created_at_idx ON credit_purchases(created_at);

-- Set up RLS for credit_purchases
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for credit_purchases
DO $$
BEGIN
  BEGIN
    DROP POLICY IF EXISTS "view_own_credit_purchases" ON public.credit_purchases;
    CREATE POLICY "view_own_credit_purchases"
      ON public.credit_purchases
      FOR SELECT
      USING (auth.uid() = user_id);
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "view_own_credit_purchases" already exists, skipping';
  END;

  BEGIN
    DROP POLICY IF EXISTS "admin_manage_credit_purchases" ON public.credit_purchases;
    CREATE POLICY "admin_manage_credit_purchases"
      ON public.credit_purchases
      USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      ));
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "admin_manage_credit_purchases" already exists, skipping';
  END;
END $$;

-- Create credit_reset_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.credit_reset_logs (
  id SERIAL PRIMARY KEY,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  success BOOLEAN NOT NULL
);

-- Create or replace the reset_daily_credits function
CREATE OR REPLACE FUNCTION public.reset_daily_credits()
RETURNS void AS $$
BEGIN
  -- Update credits for free tier users
  UPDATE public.profiles
  SET 
    credits = 30,
    last_credit_refresh = now()
  WHERE 
    subscription_tier = 'free' 
    AND (credits < 30 OR last_credit_refresh < now() - INTERVAL '24 hours');
  
  -- Update credits for pro tier users
  UPDATE public.profiles
  SET 
    credits = 100,
    last_credit_refresh = now()
  WHERE 
    subscription_tier = 'pro' 
    AND (credits < 100 OR last_credit_refresh < now() - INTERVAL '24 hours');
  
  -- Update credits for ultra tier users
  UPDATE public.profiles
  SET 
    credits = 1000,
    last_credit_refresh = now()
  WHERE 
    subscription_tier = 'ultra' 
    AND (credits < 1000 OR last_credit_refresh < now() - INTERVAL '24 hours');
  
  -- Log the reset
  INSERT INTO public.credit_reset_logs (executed_at, success)
  VALUES (now(), true);
  
  -- Also record the credit changes in credit_history for audit trail
  -- Free tier
  INSERT INTO public.credit_history (
    user_id, 
    amount, 
    type, 
    description
  )
  SELECT 
    id, 
    30, 
    'daily_reset', 
    'Daily credit reset for free tier'
  FROM 
    public.profiles
  WHERE 
    subscription_tier = 'free' 
    AND (credits < 30 OR last_credit_refresh < now() - INTERVAL '24 hours');
  
  -- Pro tier
  INSERT INTO public.credit_history (
    user_id, 
    amount, 
    type, 
    description
  )
  SELECT 
    id, 
    100, 
    'daily_reset', 
    'Daily credit reset for pro tier'
  FROM 
    public.profiles
  WHERE 
    subscription_tier = 'pro' 
    AND (credits < 100 OR last_credit_refresh < now() - INTERVAL '24 hours');
  
  -- Ultra tier
  INSERT INTO public.credit_history (
    user_id, 
    amount, 
    type, 
    description
  )
  SELECT 
    id, 
    1000, 
    'daily_reset', 
    'Daily credit reset for ultra tier'
  FROM 
    public.profiles
  WHERE 
    subscription_tier = 'ultra' 
    AND (credits < 1000 OR last_credit_refresh < now() - INTERVAL '24 hours');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the initialize_user_credits function
CREATE OR REPLACE FUNCTION initialize_user_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set default credits based on subscription tier
  IF NEW.credits IS NULL THEN
    NEW.credits := 
      CASE CAST(NEW.subscription_tier AS TEXT)
        WHEN 'ultra' THEN 1000
        WHEN 'pro' THEN 100
        ELSE 30
      END;
  END IF;
    
  -- Set the last credit refresh time
  IF NEW.last_credit_refresh IS NULL THEN
    NEW.last_credit_refresh := NOW();
  END IF;
    
  RETURN NEW;
END;
$$;

-- Make sure the trigger is correctly set up
DROP TRIGGER IF EXISTS initialize_user_credits_trigger ON profiles;
CREATE TRIGGER initialize_user_credits_trigger
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION initialize_user_credits();

-- Create or replace the add_user_credits function
CREATE OR REPLACE FUNCTION add_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT DEFAULT 'purchase',
  p_description TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_credits INTEGER;
  v_new_credits INTEGER;
BEGIN
  -- Update the user's credits
  UPDATE public.profiles
  SET credits = credits + p_amount
  WHERE id = p_user_id
  RETURNING credits INTO v_new_credits;
  
  -- Record the credit change in the history table
  INSERT INTO public.credit_history (
    user_id,
    amount,
    type,
    description
  ) VALUES (
    p_user_id,
    p_amount,
    p_type,
    p_description
  );
  
  -- Return the new credit balance
  RETURN v_new_credits;
END;
$$;

-- Grant permissions
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.credit_history TO authenticated;
GRANT SELECT ON public.subscription_history TO authenticated;
GRANT SELECT ON public.credit_purchases TO authenticated;

GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.credit_history TO service_role;
GRANT ALL ON public.subscription_history TO service_role;
GRANT ALL ON public.credit_purchases TO service_role;
GRANT ALL ON public.credit_reset_logs TO service_role;
