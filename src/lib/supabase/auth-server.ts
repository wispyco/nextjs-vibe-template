import { createClient } from './server-client';

/**
 * Get the current user's GitHub access token from Supabase Auth
 * This only works server-side
 */
export async function getGitHubToken(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.provider_token) {
    return null;
  }
  
  // The provider_token is the GitHub OAuth token
  return session.provider_token;
}

/**
 * Get the current user from Supabase Auth
 * This only works server-side
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }
  
  // Get additional user metadata
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  return {
    ...user,
    profile,
  };
}