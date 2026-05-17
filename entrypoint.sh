#!/bin/sh
set -e

# ---------------------------------------------------------------------------
# Repair: ensure migration 0010 changes are applied regardless of whether
# drizzle-kit already tracked it. All statements are idempotent.
# ---------------------------------------------------------------------------
if [ -n "$DATABASE_DIRECT_URL" ]; then
  echo "Running migration repair..."
  node -e "
    const postgres = require('postgres');
    const sql = postgres(process.env.DATABASE_DIRECT_URL, { max: 1 });

    async function repair() {
      // 1. Convert messages.metadata from text to jsonb if still text
      const [col] = await sql\`
        SELECT data_type FROM information_schema.columns
        WHERE table_name = 'messages' AND column_name = 'metadata'
      \`;
      if (col && col.data_type === 'text') {
        console.log('  Converting messages.metadata text -> jsonb...');
        await sql\`ALTER TABLE messages ALTER COLUMN metadata SET DATA TYPE jsonb USING metadata::jsonb\`;
        console.log('  Done.');
      } else {
        console.log('  messages.metadata already jsonb, skipping.');
      }

      // 2. Add unique constraint on social_accounts if missing
      const [constraint] = await sql\`
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'social_accounts_platform_user_uniq'
          AND table_name = 'social_accounts'
      \`;
      if (!constraint) {
        console.log('  Adding social_accounts unique constraint...');
        await sql\`ALTER TABLE social_accounts ADD CONSTRAINT social_accounts_platform_user_uniq UNIQUE(platform, user_id)\`;
        console.log('  Done.');
      } else {
        console.log('  social_accounts constraint already exists, skipping.');
      }

      await sql.end();
    }

    repair().then(() => {
      console.log('Migration repair complete.');
      process.exit(0);
    }).catch(err => {
      console.error('Migration repair failed:', err.message);
      process.exit(1);
    });
  "
fi

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
