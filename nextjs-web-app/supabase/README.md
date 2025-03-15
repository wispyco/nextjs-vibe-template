# Supabase Configuration

This directory contains the configuration files for Supabase, including database migrations, seed data, and custom SQL functions.

## Database Schema

The database schema includes the following tables:

### Profiles

The `profiles` table stores user profile information and is linked to the Supabase Auth users table.

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  credits INTEGER DEFAULT 30,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  last_credit_refresh TIMESTAMP WITH TIME ZONE DEFAULT now(),
  subscription_period_start TIMESTAMP WITH TIME ZONE,
  subscription_period_end TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'inactive',
  max_monthly_credits INTEGER
);
```

### Credit History

The `credit_history` table tracks all credit transactions for users.

```sql
CREATE TABLE IF NOT EXISTS public.credit_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  request_id TEXT,
  style_index TEXT
);
```

### Credit Reset Logs

The `credit_reset_logs` table tracks when credit reset operations are executed.

```sql
CREATE TABLE IF NOT EXISTS public.credit_reset_logs (
  id SERIAL PRIMARY KEY,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  success BOOLEAN DEFAULT false
);
```

### Credit Purchases

The `credit_purchases` table records credit purchase transactions.

```sql
CREATE TABLE IF NOT EXISTS public.credit_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  amount INTEGER NOT NULL,
  cost NUMERIC NOT NULL,
  currency TEXT DEFAULT 'usd',
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Subscription History

The `subscription_history` table tracks changes to user subscriptions.

```sql
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  subscription_tier TEXT NOT NULL,
  status TEXT NOT NULL,
  amount_paid NUMERIC,
  currency TEXT DEFAULT 'usd',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Database Functions

The database includes several functions to manage user profiles and credits:

### User Management

- `handle_new_user()`: Trigger function that creates a profile record when a new user signs up.
- `update_updated_at_column()`: Updates the `updated_at` timestamp when a record is modified.

### Credit Management

- `initialize_user_credits()`: Sets default credits based on subscription tier when a new profile is created.
- `refresh_user_credits(p_user_id UUID)`: Refreshes a user's credits based on their subscription tier.
- `add_user_credits(p_user_id UUID, p_amount INTEGER, p_type TEXT, p_description TEXT)`: Adds credits to a user's account.
- `deduct_user_credits(p_user_id UUID, p_amount INTEGER, p_type TEXT, p_description TEXT)`: Deducts credits from a user's account.
- `reset_daily_credits()`: Resets credits for all users based on their subscription tier.
- `deduct_generation_credit(p_user_id UUID, p_request_id TEXT, p_style_index TEXT)`: Deducts a credit for a generation request.

### Security Functions

- `prevent_sensitive_updates()`: Prevents direct updates to sensitive fields.
- `prevent_direct_credits_update()`: Ensures credits are only updated through the appropriate functions.

## Row Level Security (RLS)

Row Level Security is enabled on all tables to ensure that users can only access their own data.

## Authentication Implementation

The application uses Supabase Auth with the `@supabase/ssr` package for authentication. The implementation includes:

### Client-Side Authentication

```typescript
// src/lib/auth/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Server-Side Authentication

```typescript
// src/lib/auth/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient(cookieStore) {
  // Use provided cookie store or create empty fallback
  const cookies = cookieStore || {
    getAll: () => [],
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookies.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Handle cookie setting
            });
          } catch {
            // Can be safely ignored if using middleware
          }
        },
      },
    }
  );
}
```

### Middleware

The application uses Next.js middleware to handle authentication and session management:

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          supabaseResponse = NextResponse.next({
            request,
          })
          
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

## Credit Refresh Mechanism

Credits are refreshed through user interaction with the API:

1. **API Interaction**: Credits are refreshed when a user interacts with the API for the first time each day.
2. **Per-User Refresh**: The `refresh_user_credits(p_user_id UUID)` function is called to refresh an individual user's credits.
3. **Check-Auth Endpoint**: The primary mechanism is the `/api/check-auth` endpoint which refreshes credits when users interact with the application.

The refresh logic checks:
- If the user's credits are below their tier's base amount
- If the user's credits haven't been refreshed today (based on the `last_credit_refresh` timestamp)

If either condition is true, credits are reset to the base amount for the user's subscription tier.

## Migrations

The `migrations` directory contains SQL files that define the database schema and are applied in order based on their timestamp prefix.

To apply migrations manually:

1. Connect to your Supabase project
2. Go to the SQL Editor
3. Copy and paste the contents of the migration file
4. Run the SQL commands

Alternatively, use the provided script:

```bash
node scripts/apply-schema-updates.js
```

## Schema Cleanup

Recent schema cleanup efforts have:

1. Consolidated timestamp fields (standardized on `last_credit_refresh`)
2. Removed redundant fields like `max_daily_credits` and `max_monthly_credits`
3. Updated the credit reset function for consistency
4. Ensured proper credit history tracking

## Local Development

For local development with Supabase:

1. Install the Supabase CLI: `npm install -g supabase`
2. Start a local Supabase instance: `supabase start`
3. Apply migrations: `supabase db reset`
4. Connect your application to the local instance

## Environment Variables

Make sure to set the following environment variables in your `.env` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (for admin operations)
```

For local development, these will be provided by the Supabase CLI when you run `supabase start`.

## Scheduled Jobs

The application no longer relies on scheduled jobs for credit refresh. Instead, credits are refreshed on-demand when users interact with the API.

### Previous Approach (Deprecated)

~~For credit refresh to work properly, the `pg_cron` extension should be installed and configured to run the `reset_daily_credits()` function daily. This requires a paid Supabase plan.~~

~~Example setup (to be run by a Supabase administrator):~~

```sql
-- Install pg_cron extension (requires paid plan)
-- DEPRECATED: No longer needed as credits refresh on API interaction
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily credit reset at midnight UTC
-- DEPRECATED: No longer needed as credits refresh on API interaction
-- SELECT cron.schedule('daily-credit-reset', '0 0 * * *', 'SELECT reset_daily_credits()');
```

### Current Approach

The application now uses a more efficient on-demand approach:

1. When a user makes an API request, the application checks if their credits need to be refreshed
2. If the user hasn't received credits today or their credits are below the base amount for their tier, the application calls the `refresh_user_credits` function
3. This approach eliminates the need for a scheduled job and ensures users always have their credits refreshed when they need them

This implementation:
- Reduces database load by only refreshing credits for active users
- Eliminates the need for a paid Supabase plan with `pg_cron`
- Provides immediate credit refresh when users interact with the application 