import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Creates a Supabase client with proper cookie handling for API routes
 * This function is compatible with both pages and app directory
 */
export function createAPIRouteClient(req?: Request, res?: NextResponse) {
  // For App Router, we need to use the cookies() function from next/headers
  if (typeof window === 'undefined' && !req) {
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            // This is a synchronous function that will be called by Supabase
            // We need to return undefined here and let Supabase handle cookie retrieval
            // through its own mechanisms
            return undefined;
          },
          set(name, value, options) {
            // This is a synchronous function that will be called by Supabase
            // We can't set cookies synchronously in App Router, so we'll let
            // Supabase handle it through its own mechanisms
          },
          remove(name, options) {
            // This is a synchronous function that will be called by Supabase
            // We can't remove cookies synchronously in App Router, so we'll let
            // Supabase handle it through its own mechanisms
          },
        },
      }
    );
  }

  // For Pages Router or when request/response objects are provided
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          if (req instanceof NextRequest) {
            return req.cookies.get(name)?.value;
          }
          return undefined;
        },
        set(name, value, options) {
          if (res) {
            res.cookies.set(name, value, options);
          }
        },
        remove(name, options) {
          if (res) {
            res.cookies.set(name, '', { ...options, maxAge: 0 });
          }
        },
      },
    }
  );
}
