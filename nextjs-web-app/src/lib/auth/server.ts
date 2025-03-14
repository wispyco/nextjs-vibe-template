import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import type { NextRequest, NextResponse } from 'next/server'

/**
 * Creates a Supabase client for the middleware
 */
export function createMiddlewareClient(req: NextRequest, res: NextResponse) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )
}

/**
 * Creates a Supabase client for server-side contexts
 * This function dynamically imports next/headers to avoid SSR issues
 */
export async function createClient() {
  try {
    // Dynamic import to avoid issues in non-App Router contexts
    const { cookies } = await import('next/headers')

    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const cookieStore = cookies()
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              const cookieStore = cookies()
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // This can be ignored if using middleware to refresh sessions
            }
          },
        },
      }
    )
  } catch (error) {
    console.error('Error creating server client:', error)
    
    // Return a minimal client that won't throw errors in non-App Router contexts
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() { /* empty */ },
        },
      }
    )
  }
}

/**
 * Creates a Supabase client with admin privileges using the service role key
 */
export async function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    throw new Error('Admin client configuration error: Missing SUPABASE_SERVICE_ROLE_KEY')
  }
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      cookies: {
        getAll() { return [] },
        setAll() { /* empty */ },
      },
    }
  )
}

/**
 * Creates a Supabase client for server components.
 * This should be used in App Router server components and API routes.
 */
export function createServerComponentClient() {
  return {
    async getClient() {
      try {
        // Dynamic import to work with App Router
        const { cookies } = await import('next/headers')
        
        // Create a Supabase client for server-side usage
        return createServerClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() {
                return cookies().getAll()
              },
              setAll(cookiesToSet) {
                try {
                  cookiesToSet.forEach(({ name, value, options }) => {
                    cookies().set(name, value, options)
                  })
                } catch (e) {
                  // This can be safely ignored if middleware is handling auth
                  console.log('Cookie setting failed in server component')
                }
              },
            },
          }
        )
      } catch (e) {
        console.error('Error creating server component client:', e)
        throw new Error('Failed to create Supabase client')
      }
    }
  }
} 