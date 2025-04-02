# Database Schema Management

This directory contains scripts for managing the database schema.

## Files Overview

- `schema.sql`: The complete database schema with all tables, functions, and policies
- `fix_profiles_rls.sql`: Script to fix Row Level Security (RLS) issues with the profiles table
- `push-schema.sh`: Consolidated script for pushing schema to local or remote Supabase

## Pushing Schema to Supabase

### Option 1: Using the Supabase Dashboard (Recommended)

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Navigate to your project
3. Go to the SQL Editor
4. Create a new query
5. Copy the contents of `schema.sql` from this directory
6. Paste it into the SQL Editor
7. Run the query

This will apply all the schema changes to your remote database while handling existing tables and columns.

### Option 2: Using the Consolidated Script

The `push-schema.sh` script provides a unified interface for pushing schema changes:

```bash
# Push to local Supabase
./scripts/push-schema.sh --local

# Push to remote Supabase with RLS fix
./scripts/push-schema.sh --remote --fix-rls

# Push to specific database URL
./scripts/push-schema.sh --remote --db-url "postgresql://postgres:password@db.example.supabase.co:5432/postgres"

# Show help
./scripts/push-schema.sh --help
```

## Common Issues and Solutions

### RLS Policy Conflicts

If you encounter errors related to RLS policies (e.g., "policy already exists"), use the `--fix-rls` option:

```bash
./scripts/push-schema.sh --remote --fix-rls
```

This will drop and recreate the RLS policies before applying the schema.

### Column Already Exists

The schema is designed to be idempotent and will check if columns exist before creating them. If you still encounter issues, you may need to manually drop the column first.

## Notes

- The schema.sql file is designed to be idempotent, meaning it can be run multiple times without causing errors
- It checks for the existence of tables and columns before trying to create them
- It drops and recreates policies to ensure they are up to date
- Always back up your database before making schema changes to production
