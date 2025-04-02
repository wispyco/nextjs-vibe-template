#!/bin/bash

# Consolidated script for pushing database schema to Supabase
# This script combines functionality from multiple scripts and provides a cleaner interface

# Display usage information
function show_usage {
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  --local           Push to local Supabase instance (default)"
  echo "  --remote          Push to remote Supabase instance"
  echo "  --fix-rls         Apply RLS fix before pushing schema"
  echo "  --db-url URL      Specify database URL (for remote)"
  echo "  --help            Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --local                  # Push to local Supabase"
  echo "  $0 --remote --fix-rls       # Push to remote with RLS fix"
  echo "  $0 --remote --db-url URL    # Push to specific remote URL"
}

# Default values
TARGET="local"
FIX_RLS=false
DB_URL=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --local)
      TARGET="local"
      shift
      ;;
    --remote)
      TARGET="remote"
      shift
      ;;
    --fix-rls)
      FIX_RLS=true
      shift
      ;;
    --db-url)
      DB_URL="$2"
      shift 2
      ;;
    --help)
      show_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
done

# Set up database URL
if [ "$TARGET" = "local" ]; then
  DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
  echo "Using local database: $DB_URL"
elif [ "$TARGET" = "remote" ] && [ -z "$DB_URL" ]; then
  # Try to get URL from Supabase CLI
  echo "No database URL provided, attempting to get from Supabase CLI..."
  DB_URL=$(supabase db remote get-connection-string)
  
  if [ -z "$DB_URL" ]; then
    echo "Error: Could not get remote database URL. Please link your project first with 'supabase link' or provide URL with --db-url."
    exit 1
  fi
fi

# Extract password for psql (but don't display it)
PASSWORD=$(echo "$DB_URL" | sed -n 's/.*postgres:\([^@]*\)@.*/\1/p')
DB_URL_NO_PASS=$(echo "$DB_URL" | sed 's/postgres:[^@]*@/postgres:******@/')

echo "=== Database Schema Push ==="
echo "Target: $TARGET"
echo "Database: $DB_URL_NO_PASS"
echo "Apply RLS fix: $FIX_RLS"

# Apply RLS fix if requested
if [ "$FIX_RLS" = true ]; then
  echo "Applying RLS fix..."
  PGPASSWORD="$PASSWORD" psql "$DB_URL" -f "$(dirname "$0")/fix_profiles_rls.sql"
  
  if [ $? -ne 0 ]; then
    echo "Error applying RLS fix. Please check the error message above."
    exit 1
  fi
  
  echo "RLS fix applied successfully!"
fi

# Create a temporary directory for the schema
TEMP_DIR=$(mktemp -d)
echo "Created temporary directory: $TEMP_DIR"

# Copy the schema to the temporary directory
cp "$(dirname "$0")/schema.sql" "$TEMP_DIR/schema.sql"

# Apply the schema
echo "Applying schema..."
PGPASSWORD="$PASSWORD" psql "$DB_URL" -f "$TEMP_DIR/schema.sql"

if [ $? -ne 0 ]; then
  echo "Error applying schema. Please check the error message above."
  rm -rf "$TEMP_DIR"
  exit 1
fi

echo "Schema applied successfully!"

# Clean up
rm -rf "$TEMP_DIR"
echo "Temporary files cleaned up."

echo "=== Database schema push completed ==="
