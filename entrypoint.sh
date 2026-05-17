#!/bin/sh
set -e

# ---------------------------------------------------------------------------
# Migration repair for 0010_db-integrity-constraints
#
# Context: Migration 0010 originally had a text->jsonb ALTER without a USING
# clause, which caused it to hang. Drizzle runs migrations in a transaction,
# so the hang meant the INSERT into __drizzle_migrations was rolled back.
# On every restart, drizzle-kit tries to re-run 0010, which now conflicts
# with the already-applied schema changes from the repair script.
#
# Solution: Apply the schema changes idempotently, then mark migration 0010
# as completed in drizzle.__drizzle_migrations so drizzle-kit skips it.
# ---------------------------------------------------------------------------
if [ -n "$DATABASE_DIRECT_URL" ]; then
  echo "Running migration repair..."
  node -e "
    const crypto = require('crypto');
    const fs = require('fs');
    const postgres = require('postgres');
    const sql = postgres(process.env.DATABASE_DIRECT_URL, { max: 1 });

    async function repair() {
      // 1. Convert messages.metadata from text to jsonb if still text
      const [col] = await sql\`
        SELECT data_type FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'messages'
          AND column_name = 'metadata'
      \`;
      if (col && col.data_type === 'text') {
        console.log('  Converting messages.metadata text -> jsonb...');
        await sql\`ALTER TABLE public.messages ALTER COLUMN metadata SET DATA TYPE jsonb USING metadata::jsonb\`;
        console.log('  Done.');
      } else {
        console.log('  messages.metadata already jsonb, skipping.');
      }

      // 2. Add unique constraint on social_accounts if missing
      const [constraint] = await sql\`
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND constraint_name = 'social_accounts_platform_user_uniq'
          AND table_name = 'social_accounts'
      \`;
      if (!constraint) {
        console.log('  Adding social_accounts unique constraint...');
        await sql\`ALTER TABLE public.social_accounts ADD CONSTRAINT social_accounts_platform_user_uniq UNIQUE(platform, user_id)\`;
        console.log('  Done.');
      } else {
        console.log('  social_accounts constraint already exists, skipping.');
      }

      // 3. Mark migration 0010 as applied in drizzle.__drizzle_migrations
      //    so drizzle-kit migrate skips it and doesn't try to re-run it.
      const migrationTag = '0010_db-integrity-constraints';
      const migrationMillis = 1778979770005;

      const [existing] = await sql\`
        SELECT 1 FROM drizzle.__drizzle_migrations
        WHERE created_at = \${migrationMillis}
      \`;
      if (!existing) {
        // Compute hash the same way drizzle-orm does: sha256 of the SQL file content
        const sqlContent = fs.readFileSync('/app/drizzle/' + migrationTag + '.sql', 'utf8');
        const hash = crypto.createHash('sha256').update(sqlContent).digest('hex');
        console.log('  Recording migration 0010 in __drizzle_migrations...');
        await sql\`
          INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
          VALUES (\${hash}, \${migrationMillis})
        \`;
        console.log('  Done.');
      } else {
        console.log('  Migration 0010 already recorded, skipping.');
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
