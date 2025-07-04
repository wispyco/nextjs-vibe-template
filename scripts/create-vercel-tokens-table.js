const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createVercelTokensTable() {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
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
      CREATE INDEX IF NOT EXISTS idx_vercel_tokens_user_id ON public.vercel_tokens(user_id);
    `
  });

  if (error) {
    console.error('Error creating table:', error);
  } else {
    console.log('Successfully created vercel_tokens table!');
  }
}

createVercelTokensTable();