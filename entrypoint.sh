#!/bin/sh
set -e

# Run drizzle-kit migrate to apply versioned migrations.
# Uses DATABASE_DIRECT_URL (port 5432, direct Postgres) to bypass PgBouncer
# which runs in transaction mode and cannot execute DDL.
#
# Unlike `push --force`, `migrate` only applies SQL files from /drizzle
# that haven't been applied yet (tracked in __drizzle_migrations table).
# It never drops columns or tables — only additive changes.
if [ -n "$DATABASE_DIRECT_URL" ]; then
  echo "Running drizzle-kit migrate..."
  node ./node_modules/drizzle-kit/bin.cjs migrate
  echo "Migrations complete."
else
  echo "WARNING: DATABASE_DIRECT_URL not set, skipping migrations."
fi

# Start the Next.js server
exec node server.js
