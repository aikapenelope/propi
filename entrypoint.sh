#!/bin/sh
set -e

# Run drizzle-kit push to sync schema (creates tables if they don't exist).
# Uses DATABASE_DIRECT_URL (port 5432, direct Postgres) to bypass PgBouncer
# which runs in transaction mode and cannot execute DDL.
# This is safe to run on every deploy - it only applies diffs.
if [ -n "$DATABASE_DIRECT_URL" ]; then
  echo "Running drizzle-kit push..."
  npx drizzle-kit push --force
  echo "Schema sync complete."
else
  echo "WARNING: DATABASE_DIRECT_URL not set, skipping schema sync."
fi

# Start the Next.js server
exec node server.js
