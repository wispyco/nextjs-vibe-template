# Chaos Coder

<div align="center">
  <img src="./demo.gif" alt="Chaos Coder Demo" width="640">
</div>

## Overview

Chaos Coder is a Next.js application that generates multiple variations of web applications simultaneously using AI. This tool helps developers quickly explore different implementation possibilities for their web application ideas.

**Note:** All the code for this project is located in the `nextjs-web-app` folder.

## Key Files

This project contains several important files that form the core functionality:

### Core Application Files
- **`nextjs-web-app/src/app/results/page.tsx` (32KB)**: The main results page component that displays the generated web application variations. Handles code generation, UI rendering, voice input processing, and performance metrics tracking.

- **`nextjs-web-app/src/app/dashboard/page.tsx` (24KB)**: The user dashboard component. Manages user authentication state, subscription information, credit tracking, and user profile data.

- **`nextjs-web-app/src/app/page.tsx` (20KB)**: The landing page component with the primary application interface.

### Service and Infrastructure Files
- **`nextjs-web-app/src/lib/payment/index.ts` (24KB)**: The centralized payment service. Handles all Stripe integration, subscription management, customer creation, checkout sessions, webhook processing, and billing operations.

- **`nextjs-web-app/db/schema-updates.sql` (20KB)**: Database schema definitions for the Supabase backend. Contains table structures, indexes, row-level security policies, and stored procedures for user authentication, credit management, and subscription tracking.

### UI Components
- **`nextjs-web-app/src/components/SubscriptionPlans.tsx` (16KB)**: Component for displaying and managing subscription tiers and plans.

### Context Providers
- **`nextjs-web-app/src/context/AuthContext.tsx`**: Centralized authentication context that manages user sessions, tokens, and authentication state.
- **`nextjs-web-app/src/context/ThemeContext.tsx`**: Theme management context for light/dark mode.
- **`nextjs-web-app/src/context/GenerationsContext.tsx`**: Context for managing the number of web application variations to generate. Provides consistent state across the application.

### Assets
- **`nextjs-web-app/public/favicon.ico` (124KB)**: The website favicon.
- **`nextjs-web-app/public/coin.png` (100KB)**: Image asset for the credit/token system.

## Purpose

The purpose of Chaos Coder is to accelerate the development process by providing multiple variations of code solutions for web applications. By generating multiple different approaches at once, developers can compare and choose the best implementation for their specific needs.

## Features

- Generates multiple unique web application variations (configurable with no upper limit)
- Real-time code preview for each variation
- Interactive interface with theme toggling (light/dark mode)
- Voice input support for hands-free prompting
- Performance metrics for generation times
- Keyboard shortcuts for quick access to tools
- Robust user authentication with centralized AuthService
- Secure payment processing with Stripe integration
- Subscription plans (Free, Pro, Ultra) with different credit allotments
- Credit purchase system for additional generations
- User profile management with first name personalization
- Responsive design for mobile and desktop
- Persistent settings via localStorage

## Tech Stack

- Next.js 15 with Turbopack
- TypeScript
- Tailwind CSS
- Framer Motion
- Supabase for authentication and database
- Stripe for payment processing
- Zod for schema validation
- Hugging Face Inference API
- Radix UI for accessible components

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- A Supabase account for authentication and database
- A Stripe account for payment processing
- A Hugging Face account for AI model access

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/aj47/chaos-coder.git
cd chaos-coder
```

### 2. Install dependencies

```bash
cd nextjs-web-app
npm install
```

### 3. Set up environment variables

Create a `.env` file in the `nextjs-web-app` directory with the following variables:

```bash
# Hugging Face API token
HF_API_TOKEN=your_huggingface_api_token

# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_PRO_PRICE_ID=your_stripe_pro_price_id
STRIPE_ULTRA_PRICE_ID=your_stripe_ultra_price_id

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: Portkey API key if using Portkey
PORTKEY_API_KEY=your_portkey_api_key
```

### 4. Supabase Setup

1. Create a new project in Supabase
2. Enable Email Auth in Authentication settings
3. Set up email templates for verification
4. Create necessary database tables by running the schema scripts:
   ```bash
   # First create the exec_sql function
   psql -h your_supabase_host -U postgres -d postgres -f db/create-exec-sql-function.sql
   
   # Then apply the schema updates
   npm run db:schema
   ```
5. Copy your project URL and anon key to the `.env` file

### 5. Stripe Setup

1. Create a Stripe account if you don't have one
2. Set up subscription products for Pro and Ultra tiers
3. Configure webhook endpoints in the Stripe dashboard
4. Add your Stripe keys to the `.env` file

### 6. Run the development server

```bash
npm run dev
```

The application will be available at http://localhost:3000 (or another port if 3000 is in use).

## Usage

1. Access the application in your web browser
2. Sign up for an account or log in if you already have one
3. View your available credits in the dashboard
4. Upgrade to a paid subscription or purchase additional credits
5. Enter your web application requirements or ideas in the input form
6. View and compare the five different application variations
7. Use the code preview panel to inspect and edit the generated code
8. Deploy your favorite variation directly from the interface

### Keyboard Shortcuts

- Shift+L: Open prompt input
- Shift+P: Open performance metrics
- Shift+T: Toggle theme (light/dark mode)

## Development

### Available Scripts

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Apply database schema updates
npm run db:schema

# Deploy (requires configuration)
npm run deploy
```

### Project Structure

```
nextjs-web-app/
├── db/               # Database scripts and schemas
├── public/           # Static assets
├── scripts/          # Utility scripts
├── src/
│   ├── app/          # Next.js app router pages
│   │   ├── api/      # API routes
│   │   │   ├── stripe/  # Payment API endpoints
│   │   │   └── ...      # Other API endpoints
│   │   ├── auth/     # Auth-related pages
│   │   └── ...       # Other pages
│   ├── components/   # Reusable UI components
│   │   ├── auth/     # Authentication components
│   │   └── ...       # Other components
│   ├── context/      # React context providers
│   │   ├── auth/     # Authentication context
│   │   ├── theme/    # Theme management context
│   │   └── generations/ # Generations context
│   ├── lib/          # Utility functions and services
│   │   ├── auth/     # Centralized authentication service
│   │   ├── payment/  # Payment processing service
│   │   └── ...       # Other utilities
│   ├── store/        # State management (Zustand)
│   ├── types/        # TypeScript type definitions
│   ├── utils/        # Utility functions
│   └── fonts/        # Custom fonts
├── .env              # Environment variables
├── .eslintrc.json    # ESLint configuration
└── package.json      # Project dependencies and scripts
```

## Authentication System

The authentication system has been completely overhauled to use a centralized service-oriented architecture:

### AuthService

The `AuthService` class in `src/lib/auth/index.ts` provides a comprehensive API for all authentication operations:

```typescript
// Client-side authentication
const { data, error } = await AuthService.signIn(email, password);
const { data, error } = await AuthService.signUp(email, password, firstName);
const { error } = await AuthService.signOut();
const { data, error } = await AuthService.signInWithOAuth('google');

// Server-side authentication
const supabase = await AuthService.createServerClient(cookieStore);
const { user, error } = await AuthService.getCurrentUser(supabase);
```

### Features

- Unified client and server authentication
- Consistent error handling
- Session management
- OAuth integration (Google)
- User metadata management
- Type-safe database operations

## Payment System

The payment system uses Stripe for processing subscriptions and one-time purchases:

### PaymentService

The `PaymentService` class in `src/lib/payment/index.ts` handles all payment operations:

```typescript
// Create checkout sessions
const { url } = await PaymentService.createSubscriptionCheckout(customerId, 'pro', userId);
const { url } = await PaymentService.createCreditPurchaseCheckout(customerId, amount, 'pro', userId);

// Handle webhook events
const { success, message } = await PaymentService.handleWebhookEvent(body, signature, webhookSecret);

// Manage subscriptions
const { success, message } = await PaymentService.cancelSubscription(userId);
```

### Features

- Subscription management (Free, Pro, Ultra tiers)
- One-time credit purchases
- Automatic credit allocation
- Stripe webhook integration
- Secure payment processing
- Comprehensive error handling
- Transaction history

## Database Schema

The application uses a Supabase PostgreSQL database with the following tables:

### Core Tables

1. `profiles`
   - Purpose: Stores user profile information with subscription and credit data
   - Schema:
     * `id` (UUID): Primary key, linked to auth.users
     * `credits` (INTEGER): Current credit balance for user
     * `max_monthly_credits` (INTEGER): Monthly credit limit based on subscription tier
     * `stripe_customer_id` (TEXT): Stripe customer reference
     * `stripe_subscription_id` (TEXT): Stripe subscription reference
     * `subscription_period_start` (TIMESTAMP): Start of current subscription period
     * `subscription_period_end` (TIMESTAMP): End of current subscription period
     * `last_credited_at` (TIMESTAMP): When credits were last refreshed
     * `last_credit_refresh` (TIMESTAMP): Legacy field for credit refreshes
     * `subscription_tier` (ENUM): 'free', 'pro', or 'ultra'
     * `subscription_status` (ENUM): Status from Stripe (active, past_due, etc.)
     * `updated_at` (TIMESTAMP): Last update timestamp

2. `subscription_history`
   - Purpose: Tracks changes to user subscriptions
   - Schema:
     * `id` (UUID): Primary key
     * `user_id` (UUID): Reference to auth.users
     * `subscription_tier` (TEXT): Tier of subscription
     * `status` (TEXT): Status of subscription
     * `amount_paid` (DECIMAL): Amount paid
     * `currency` (TEXT): Currency of payment
     * `stripe_subscription_id` (TEXT): Stripe subscription reference
     * `stripe_customer_id` (TEXT): Stripe customer reference
     * `description` (TEXT): Additional details
     * `created_at` (TIMESTAMP): When record was created

3. `credit_purchases`
   - Purpose: Records one-time credit purchases
   - Schema:
     * `id` (UUID): Primary key
     * `user_id` (UUID): Reference to auth.users
     * `amount` (INTEGER): Number of credits purchased
     * `cost` (DECIMAL): Amount paid
     * `currency` (TEXT): Currency of payment
     * `stripe_session_id` (TEXT): Stripe checkout session ID
     * `stripe_payment_intent_id` (TEXT): Stripe payment intent ID
     * `created_at` (TIMESTAMP): When purchase was made

4. `credit_history`
   - Purpose: Audit trail of all credit transactions
   - Schema:
     * `id` (UUID): Primary key
     * `user_id` (UUID): Reference to auth.users
     * `amount` (INTEGER): Number of credits added/removed
     * `type` (TEXT): Transaction type (purchase, usage, reset, etc.)
     * `description` (TEXT): Additional details
     * `created_at` (TIMESTAMP): When transaction occurred
     * `request_id` (TEXT): Reference to generation request if applicable
     * `style_index` (TEXT): Style index if this is for a specific generation style

5. `credit_reset_logs`
   - Purpose: Logs when the credit reset function runs
   - Schema:
     * `id` (INTEGER): Auto-incrementing primary key
     * `executed_at` (TIMESTAMP): When reset was executed
     * `success` (BOOLEAN): Whether reset was successful
     * `error_message` (TEXT): Any error details if failed (optional)

6. `generation_requests`
   - Purpose: Stores user requests for code generation
   - Schema:
     * `id` (UUID): Primary key
     * `user_id` (UUID): Reference to auth.users
     * `prompt` (TEXT): The user's input prompt
     * `config` (JSONB): Configuration for the generation
     * `created_at` (TIMESTAMP): When request was created
     * `updated_at` (TIMESTAMP): When request was last updated

7. `generations`
   - Purpose: Stores the generated code variations
   - Schema:
     * `id` (UUID): Primary key
     * `request_id` (UUID): Foreign key to generation_requests
     * `style` (TEXT): Generation style identifier
     * `code` (TEXT): The generated code
     * `model_type` (TEXT): AI model used for generation
     * `generation_time` (FLOAT): Time taken to generate the code
     * `created_at` (TIMESTAMP): When generation was created

8. `admin_users`
   - Purpose: Stores administrative user information
   - Schema details omitted for security purposes

9. `audit_log`
   - Purpose: Logs system events for auditing
   - Captures security-relevant events like credit modifications

### Database Functions

The database includes the following secure functions for managing credits and user data:

1. `add_user_credits(user_id, amount, type, description)`: 
   - Purpose: Safely adds credits to a user account
   - Security: SECURITY DEFINER function to ensure proper authorization
   - Returns: The user's new credit balance
   - Creates an audit trail entry in credit_history

2. `deduct_user_credits(user_id, amount, description)`: 
   - Purpose: Safely removes credits from a user account
   - Security: SECURITY DEFINER function with validation checks
   - Returns: The user's new credit balance
   - Creates an audit trail entry in credit_history with negative amount

3. `deduct_generation_credit(user_id, request_id, style_index)`: 
   - Purpose: Specialized function for deducting credits for code generation
   - Security: SECURITY DEFINER function with duplicate prevention
   - Returns: The user's new credit balance
   - Creates an audit trail entry with generation metadata

4. `reset_daily_credits()`: 
   - Purpose: Automatically refreshes credits based on subscription tier
   - Logic: Free tier gets 30 credits, Pro tier gets 100, Ultra tier gets 1000
   - Creates audit trail entries for all refreshed accounts
   - Logs execution in credit_reset_logs

5. `refresh_user_credits(user_id)`: 
   - Purpose: Refreshes credits for a specific user if they haven't been refreshed today
   - Returns: The user's new credit balance after refresh

6. `initialize_user_credits()`: 
   - Purpose: Trigger function to set initial credits when a profile is created
   - Logic: Sets credits based on subscription tier (30/100/1000)

7. `handle_new_user()`: 
   - Purpose: Trigger function that creates a profile when a new user signs up
   - Security: SECURITY DEFINER to ensure proper access

8. `prevent_direct_credits_update()`: 
   - Purpose: Trigger function that prevents direct updates to the credits field
   - Security: Only allows updates through proper functions or service_role
   - Logging: Records unauthorized attempts in audit_log

9. `update_updated_at_column()`: 
   - Purpose: Trigger function to automatically update timestamp on record changes

10. `exec_sql(sql)`: 
    - Purpose: Administrative function to execute SQL commands
    - Security: Restricted to service_role only, used for schema updates

### Database Triggers

The database includes the following triggers:

1. `on_auth_user_created`: 
   - Table: auth.users
   - Trigger: AFTER INSERT
   - Function: handle_new_user()
   - Purpose: Creates a profile record when a new user signs up

2. `initialize_user_credits_trigger`: 
   - Table: profiles
   - Trigger: BEFORE INSERT
   - Function: initialize_user_credits()
   - Purpose: Sets initial credit values for new profiles

3. `prevent_direct_credits_update_trigger`: 
   - Table: profiles
   - Trigger: BEFORE UPDATE
   - Function: prevent_direct_credits_update()
   - Purpose: Prevents unauthorized credit updates

4. `update_profiles_updated_at`: 
   - Table: profiles
   - Trigger: BEFORE UPDATE
   - Function: update_updated_at_column()
   - Purpose: Updates timestamp when profile records change

### Row Level Security (RLS)

Each table is protected by Row Level Security (RLS) policies:

1. `profiles` table policies:
   - "Users can view own profile": Users can only select their own profile
   - "Users can update non-sensitive profile fields": Users can only update their own profile
   - "Service role can manage all profiles": Service role has full access
   - "Service role can insert profiles": Service role can create profiles

2. `credit_history`, `credit_purchases`, and `subscription_history` follow similar patterns:
   - Users can view their own records
   - Service role can manage all records

### Database Access Patterns

1. Credit management:
   - Credits are ONLY modified through secure functions
   - Direct updates to credits field are prevented by triggers
   - All credit changes are logged in credit_history

2. User provisioning:
   - When users sign up, a profile is automatically created
   - Default credits are assigned based on subscription tier
   - Free tier users start with 30 credits

3. Daily credit refresh:
   - Credits are automatically reset daily if below the tier threshold
   - Free tier: 30 credits
   - Pro tier: 100 credits
   - Ultra tier: 1000 credits

### Important Database Views

The database includes several views (not documented here) that provide aggregated data for reporting purposes.

### Database Migration and Maintenance

Database schema updates are managed through:
1. The `exec_sql` function for safe schema modifications
2. Migration scripts in the `/db/migrations` directory
3. Backup and restore capabilities via `/db/restore-from-backup.sql`

For complete schema details, refer to the `/db/schema-updates.sql` file.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Community

Join our Discord community for support, discussions, and updates:

[Join the Discord Server](https://discord.gg/cK9WeQ7jPq)

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Stripe](https://stripe.com/)
- [Hugging Face](https://huggingface.co/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Zod](https://zod.dev/)
