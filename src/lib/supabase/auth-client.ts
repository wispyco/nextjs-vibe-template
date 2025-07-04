import { createClient as createBrowserClient } from './browser-client';

/**
 * Sign in with GitHub
 * This works client-side
 */
export async function signInWithGitHub(redirectTo?: string) {
  const supabase = createBrowserClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
      scopes: 'repo user',
    },
  });
  
  if (error) {
    throw error;
  }
  
  return data;
}

/**
 * Sign out
 * This works client-side
 */
export async function signOut() {
  const supabase = createBrowserClient();
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw error;
  }
}

/**
 * Get session client-side
 */
export async function getSession() {
  const supabase = createBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Check if user is authenticated client-side
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}