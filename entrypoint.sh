#!/bin/sh
set -e

# Run drizzle-kit migrate to apply any remaining versioned migrations.
# Uses DATABASE_DIRECT_URL (port 5432, direct Postgres) to bypass PgBouncer
# which runs in transaction mode and cannot execute DDL.
if [ -n "$DATABASE_DIRECT_URL" ]; then
  echo "Running drizzle-kit migrate..."
  node ./node_modules/drizzle-kit/bin.cjs migrate
  echo "Migrations complete."
else
  echo "WARNING: DATABASE_DIRECT_URL not set, skipping migrations."
fi

# Start the Next.js server
exec node server.js
