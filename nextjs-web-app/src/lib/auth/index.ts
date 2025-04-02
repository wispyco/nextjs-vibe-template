// Direct exports from client/server modules
export { createClient as createBrowserClient } from './client';
export {
  createClient as createServerClient,
  createServerComponentClient,
  createAdminClient
} from './server';

// Export API route helper
export { createAPIRouteClient } from './helpers';

// Export type definitions
export type { Database } from '@/types/supabase';

// Export AuthService for backwards compatibility
export { AuthService } from './service';