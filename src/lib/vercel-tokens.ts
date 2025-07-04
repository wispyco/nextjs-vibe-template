import { createClient } from '@/lib/supabase/server-client';
import { cookies } from 'next/headers';

// For edge runtime compatibility, we'll use Web Crypto API instead of Node crypto
const ENCRYPTION_KEY = process.env.VERCEL_TOKEN_ENCRYPTION_KEY || 'default-key-change-in-production';

interface VercelTokenData {
  access_token: string;
  token_type: string;
  installation_id: string;
  user_id: string;
  team_id?: string | null;
  created_at: string;
  expires_at?: string;
}

interface StoredVercelToken {
  id: string;
  user_id: string;
  encrypted_token: string;
  iv: string;
  auth_tag: string;
  team_id?: string | null;
  installation_id: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

// Simple base64 encoding for edge runtime (replace with proper encryption in production)
function encryptToken(token: string): { encrypted: string; iv: string; authTag: string } {
  // For edge runtime compatibility, using base64 encoding
  // In production, use a proper encryption service or middleware
  const encoded = btoa(token);
  return {
    encrypted: encoded,
    iv: 'edge-runtime',
    authTag: 'edge-runtime'
  };
}

// Simple base64 decoding for edge runtime
function decryptToken(encrypted: string, iv: string, authTag: string): string {
  // For edge runtime compatibility, using base64 decoding
  // In production, use a proper encryption service or middleware
  return atob(encrypted);
}

// Store Vercel token for a user
export async function storeVercelToken(tokenData: VercelTokenData): Promise<void> {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('User not authenticated');
  }
  
  // Encrypt the access token
  const { encrypted, iv, authTag } = encryptToken(tokenData.access_token);
  
  // Store in database
  const { error } = await supabase
    .from('vercel_tokens')
    .upsert({
      user_id: user.id,
      encrypted_token: encrypted,
      iv,
      auth_tag: authTag,
      team_id: tokenData.team_id,
      installation_id: tokenData.installation_id,
      vercel_user_id: tokenData.user_id,
      expires_at: tokenData.expires_at,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });
  
  if (error) {
    console.error('Error storing Vercel token:', {
      error,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw new Error(`Failed to store Vercel token: ${error.message || 'Unknown error'}`);
  }
}

// Retrieve Vercel token for current user
export async function getVercelToken(): Promise<string | null> {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return null;
  }
  
  // Retrieve token from database
  const { data, error } = await supabase
    .from('vercel_tokens')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  // Check if token is expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    // Token expired, delete it
    await deleteVercelToken();
    return null;
  }
  
  // Decrypt and return token
  try {
    return decryptToken(data.encrypted_token, data.iv, data.auth_tag);
  } catch (error) {
    console.error('Error decrypting Vercel token:', error);
    return null;
  }
}

// Get Vercel token for a specific user (admin only)
export async function getVercelTokenForUser(userId: string): Promise<string | null> {
  const supabase = await createClient();
  
  // This should be restricted to admin users only
  // Add your admin check here
  
  const { data, error } = await supabase
    .from('vercel_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  // Check if token is expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null;
  }
  
  // Decrypt and return token
  try {
    return decryptToken(data.encrypted_token, data.iv, data.auth_tag);
  } catch (error) {
    console.error('Error decrypting Vercel token:', error);
    return null;
  }
}

// Delete Vercel token for current user
export async function deleteVercelToken(): Promise<void> {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('User not authenticated');
  }
  
  // Delete token from database
  const { error } = await supabase
    .from('vercel_tokens')
    .delete()
    .eq('user_id', user.id);
  
  if (error) {
    console.error('Error deleting Vercel token:', error);
    throw new Error('Failed to delete Vercel token');
  }
}

// Check if user has a valid Vercel token
export async function hasValidVercelToken(): Promise<boolean> {
  const token = await getVercelToken();
  return token !== null;
}

// Get Vercel team ID for current user
export async function getVercelTeamId(): Promise<string | null> {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return null;
  }
  
  // Retrieve team ID from database
  const { data, error } = await supabase
    .from('vercel_tokens')
    .select('team_id')
    .eq('user_id', user.id)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data.team_id;
}

// Validate Vercel token by making a test API call
export async function validateVercelToken(): Promise<boolean> {
  const token = await getVercelToken();
  if (!token) {
    return false;
  }
  
  try {
    const response = await fetch('https://api.vercel.com/v2/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      // Token is invalid, delete it
      await deleteVercelToken();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating Vercel token:', error);
    return false;
  }
}