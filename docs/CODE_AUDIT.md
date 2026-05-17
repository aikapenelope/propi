# Propi CRM — Code Audit Report

**Date:** May 2026
**Scope:** Full codebase review of the `propi` repository — security, database design, code robustness, and production readiness.
**Stack:** Next.js 16, Drizzle ORM, PostgreSQL + PgBouncer, MinIO, Redis/BullMQ, Clerk, Meta APIs, MercadoLibre, Wasi, Resend, Groq AI. Deployed on Hetzner Cloud via Coolify.

---

## Table of Contents

1. [Security](#1-security)
2. [Database Design](#2-database-design)
3. [Code Robustness & Implementation](#3-code-robustness--implementation)
4. [What's Missing & Improvements](#4-whats-missing--improvements)
5. [Summary & Priority](#5-summary--priority)

---

## 1. Security

### Strengths

- Clerk middleware protects all non-public routes correctly.
- Every server action calls `requireUserId()` and scopes queries with `userId` — solid tenant isolation at the application layer.
- Upload route (`/api/upload`) validates MIME types, enforces a 10 MB limit, checks key prefix ownership, and rejects path traversal (`..`, `\0`).
- Meta webhook validates HMAC-SHA256 signatures with `crypto.timingSafeEqual` — correct constant-time comparison.
- Cron routes are protected by a `CRON_SECRET` bearer token.
- CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy headers are configured in `next.config.ts`.
- SQL injection is mitigated via Drizzle ORM parameterized queries and `sanitizeLike()` for ILIKE patterns.
- Download route (`/api/download`) verifies the S3 key belongs to the requesting user before streaming.

### Issues

| # | Severity | Finding | Location |
|---|----------|---------|----------|
| S1 | **HIGH** | **Access tokens stored in plaintext in the database.** `socialAccounts.accessToken`, `socialAccounts.refreshToken`, and `serviceCredentials.accessToken/refreshToken` are stored as plain `text`. These are long-lived OAuth tokens for Meta, MercadoLibre, Wasi, and Resend. If the database is compromised, all third-party integrations are exposed. Encrypt at rest using application-level encryption (e.g., AES-256-GCM with a key from an env var) or Postgres `pgcrypto`. | `src/server/schema.ts` — `socialAccounts`, `serviceCredentials` |
| S2 | **HIGH** | **Meta webhook accepts unsigned payloads when `META_APP_SECRET` is not set.** If `appSecret` is falsy the signature check is skipped entirely and the payload is processed. A misconfigured deployment (missing env var) silently disables webhook authentication. The handler should reject all POST requests when `META_APP_SECRET` is not configured. | `src/app/api/webhooks/meta/route.ts` lines 50-64 |
| S3 | **MEDIUM** | **Image proxy (`/api/images/[...key]`) has no authentication and no path traversal check.** Any user or bot can enumerate and download all property images from MinIO by guessing keys. The reassembled key from URL segments is not checked for `..` sequences. Add a traversal guard on the joined key. | `src/app/api/images/[...key]/route.ts` |
| S4 | **MEDIUM** | **In-memory rate limiting doesn't work across instances.** `uploadRateMap`, `rateLimitMap`, and `userChatLimits` are all in-process `Map` objects. Scaling to multiple replicas or restarting the process resets all limits. Use Redis-based rate limiting for production. | `src/app/api/upload/route.ts`, `src/app/api/images/[...key]/route.ts`, `src/app/api/chat/market/route.ts` |
| S5 | **MEDIUM** | **CSP allows `'unsafe-inline'` and `'unsafe-eval'` for scripts.** This significantly weakens XSS protection. `'unsafe-eval'` may be needed for dev tooling but should be removed in production builds. Consider using nonces for inline scripts. | `next.config.ts` — `Content-Security-Policy` header |
| S6 | **MEDIUM** | **`Content-Disposition` header in download route is vulnerable to header injection.** The filename is derived from the S3 key (`key.split("/").pop()`) without sanitization. A crafted filename with special characters could inject headers. Sanitize the filename or use RFC 5987 encoding. | `src/app/api/download/route.ts` line 45 |
| S7 | **LOW** | **Token logged to stdout in worker.** The first 25 characters of the MercadoLibre access token are logged. This is enough to be useful to an attacker with log access. Remove token logging. | `src/workers/market-sync-worker.ts` line 297 |
| S8 | **LOW** | **Public agent portal (`/agente/[id]`) accepts arbitrary Clerk user IDs.** While it only shows active properties, it leaks the existence of user accounts and their property counts. Consider using a slug or public profile ID instead of the raw Clerk `userId`. | `src/app/agente/[id]/page.tsx` |

---

## 2. Database Design

### Strengths

- Well-normalized schema with proper foreign keys and cascade deletes.
- Comprehensive indexing strategy — composite indexes for KPI queries, individual indexes on all foreign keys and common filter columns.
- UUID primary keys throughout (good for distributed systems and avoids enumeration).
- `withTimezone: true` on all timestamps.
- Drizzle relations are fully defined for the query builder.
- PgBouncer for connection pooling with a separate direct connection for DDL migrations.
- Versioned migrations via `drizzle-kit migrate` (not `push`) — safe for production.

### Issues

| # | Severity | Finding | Location |
|---|----------|---------|----------|
| D1 | **HIGH** | **No multi-tenant isolation at the database level.** All tenants share the same tables with `userId` as a filter column. There is no Row-Level Security (RLS) policy. A bug in any server action that omits the `userId` filter would leak data across tenants. Enable Postgres RLS with `SET app.current_user_id` per connection for defense-in-depth. | All tables with `userId` column |
| D2 | **MEDIUM** | **`socialAccounts` lacks a unique constraint on `(platform, userId)`.** The `upsertSocialAccount` function does a manual find-then-insert, which has a race condition under concurrent requests. Use a unique constraint and `ON CONFLICT` for a proper upsert. | `src/server/schema.ts` — `socialAccounts`; `src/server/actions/social-accounts.ts` |
| D3 | **MEDIUM** | **`marketListings` will grow unbounded.** With daily syncs across 6 categories x 20 pages x 50 items = up to 6,000 listings/day, this table will reach millions of rows with no retention policy or partitioning. Consider time-based partitioning on `createdAt` or a TTL cleanup job. | `src/server/schema.ts` — `marketListings` |
| D4 | **MEDIUM** | **`notifications` table has no cleanup.** Notifications accumulate forever. Add a cron job to delete read notifications older than 30 days. | `src/server/schema.ts` — `notifications` |
| D5 | **LOW** | **`messages.metadata` is `text` instead of `jsonb`.** It stores JSON strings but can't be queried efficiently. Should be `jsonb` for consistency with other JSON columns in the schema. | `src/server/schema.ts` — `messages` |
| D6 | **LOW** | **Missing functional index on `contacts.birthDate` for birthday queries.** The cron job uses `EXTRACT(MONTH/DAY FROM birth_date)` which can't use a B-tree index. Add: `CREATE INDEX ON contacts (EXTRACT(MONTH FROM birth_date), EXTRACT(DAY FROM birth_date))`. | `src/server/schema.ts` — `contacts`; `src/app/api/cron/generate-notifications/route.ts` |
| D7 | **LOW** | **`dripEnrollments` lacks a unique constraint on `(sequenceId, contactId)`.** A contact could be enrolled in the same drip sequence multiple times. | `src/server/schema.ts` — `dripEnrollments` |

---

## 3. Code Robustness & Implementation

### Strengths

- Clean separation: server actions in `src/server/actions/`, lib utilities in `src/lib/`, API routes in `src/app/api/`.
- Consistent use of `"use server"` directives and `requireUserId()` pattern across all mutations.
- Worker process is properly separated with its own Dockerfile and graceful shutdown handlers (`SIGINT`, `SIGTERM`).
- BullMQ job configuration includes retries with exponential backoff and completed/failed job cleanup limits.
- MercadoLibre API calls include retry logic for 429 rate limits.
- Meta Graph API has proper timeout handling with `AbortController`.
- Deduplication in `storeInboundMessage` prevents duplicate webhook processing.
- WhatsApp 24-hour session window enforcement before sending free-form messages.
- Storage quota system prevents unbounded uploads per user.

### Issues

| # | Severity | Finding | Location |
|---|----------|---------|----------|
| C1 | **HIGH** | **Worker does individual DB queries per listing (N+1 problem).** In `syncCategory()`, each of the up to 1,000 listings per category does a `findFirst` + `update` or `insert` individually. Use batch upserts with `ON CONFLICT (external_id) DO UPDATE` to reduce thousands of queries to a handful. | `src/workers/market-sync-worker.ts` — `syncCategory()` |
| C2 | **MEDIUM** | **No error boundary or consistent error handling for server actions.** If a server action throws, the error propagates to the client as an unhandled rejection. Server actions should return `{ success, error }` result objects or use a consistent error wrapper to avoid exposing internal error messages. | All files in `src/server/actions/` |
| C3 | **MEDIUM** | **`revalidateTag` called with two arguments.** `revalidateTag(\`dashboard-${userId}\`, "max")` — `revalidateTag` only accepts one argument (the tag string). The second argument `"max"` is silently ignored and has no effect. | `src/server/actions/contacts.ts` line 123, `src/server/actions/properties.ts` line 191 |
| C4 | **MEDIUM** | **Tag replacement in `updateContact`/`updateProperty` is not transactional.** The delete-then-insert of tags is two separate operations. If the insert fails after the delete, the entity loses all its tags. Wrap in `db.transaction(async (tx) => { ... })`. | `src/server/actions/contacts.ts` lines 157-165, `src/server/actions/properties.ts` lines 257-265 |
| C5 | **MEDIUM** | **`Dockerfile` deletes `package-lock.json` and reinstalls from scratch.** Builds are not reproducible — you get whatever versions npm resolves at build time. The comment explains this is a workaround for native binary issues. A better approach is to use `--platform linux/amd64` in the build or configure `.npmrc` with `optional=true`. | `Dockerfile` line 26 |
| C6 | **LOW** | **No runtime input validation on server action parameters.** `ContactFormData` and `PropertyFormData` are TypeScript types only — they provide no runtime validation. A malicious client could send unexpected values. Use Zod schemas for runtime validation at the server action boundary. | `src/server/actions/contacts.ts`, `src/server/actions/properties.ts` |
| C7 | **LOW** | **`db.ts` proxy throws at runtime if `DATABASE_URL` is missing.** This is intentional for build time, but in production a missing `DATABASE_URL` should fail fast at startup with a clear message rather than on first query. | `src/lib/db.ts` |
| C8 | **LOW** | **`cleanupOldMessages` returns raw `db.execute` result for conversations.** The `emptyConvos` variable is the raw driver result, not a count. Should return a proper count via `RETURNING` or by inspecting the result. | `src/server/actions/messaging.ts` — `cleanupOldMessages()` |

---

## 4. What's Missing & Improvements

| # | Category | Recommendation |
|---|----------|----------------|
| M1 | **Testing** | Zero test files in the repository. No unit tests, no integration tests, no E2E tests. At minimum add tests for: CSV/vCard parsing, market query parsing, server action authorization, webhook signature validation. |
| M2 | **CI/CD** | No GitHub Actions or CI pipeline configuration. Add: lint + typecheck on PR, migration dry-run, Docker build verification. |
| M3 | **Observability** | No structured logging, no error tracking (Sentry or similar), no metrics. Add at minimum: structured JSON logging, error tracking for production, and basic metrics (request latency, queue depth, sync success rate). |
| M4 | **Email Unsubscribe** | Drip campaigns and email campaigns have no unsubscribe mechanism. This is a legal requirement (CAN-SPAM, GDPR). Add an unsubscribe link to every marketing email and honor opt-outs in the database. |
| M5 | **Environment Validation** | No startup validation of required environment variables. Use a Zod schema to validate all env vars at boot and fail fast with clear messages listing which vars are missing. |
| M6 | **Database Backups** | Hetzner server backups are enabled (good), but there is no application-level `pg_dump` or point-in-time recovery (WAL archiving) configuration visible. Add automated logical backups. |
| M7 | **Health Check** | The `/api/health` endpoint only checks DB connectivity. Add checks for Redis connectivity and MinIO availability for a complete readiness probe. |
| M8 | **Pagination** | All list queries use `limit: 200` with no cursor or offset pagination. This will degrade as data grows. Add cursor-based pagination to contacts, properties, conversations, and notifications. |
| M9 | **Audit Trail** | `activityLog` only tracks contact-related activities. There is no audit trail for changes to properties, social accounts, settings, or user permissions. |
| M10 | **Soft Deletes** | Contacts and properties are hard-deleted with no recovery path. Consider soft deletes (`deletedAt` column) for data recovery and audit compliance. |
| M11 | **Docker Worker Permissions** | The main Dockerfile correctly uses `USER node`, but the worker Dockerfile does not set `WORKDIR` permissions before switching to `node`. Files copied as root may not be readable by the `node` user. | 
| M12 | **Connection Pool Sizing** | Production pool is `max: 10` but PgBouncer is in the path. Ensure PgBouncer's `max_client_conn` and `default_pool_size` are configured to match. The worker also opens 5 direct connections bypassing PgBouncer — verify the total doesn't exceed Postgres `max_connections`. |

---

## 5. Summary & Priority

The codebase is well-structured for an early-stage product with good tenant isolation patterns, proper auth middleware, and thoughtful API design. Below are the most critical items to address for production readiness, ordered by priority:

1. **Encrypt OAuth tokens at rest** in the database (S1)
2. **Reject unsigned webhooks** when `META_APP_SECRET` is missing (S2)
3. **Add database-level RLS** as defense-in-depth for multi-tenancy (D1)
4. **Batch the market sync worker's DB operations** to fix the N+1 problem (C1)
5. **Add email unsubscribe** for legal compliance (M4)
6. **Add a test suite and CI pipeline** (M1, M2)
7. **Add environment variable validation** at startup (M5)
8. **Wrap tag replacements in transactions** (C4)
9. **Add unique constraints** on `socialAccounts(platform, userId)` and `dripEnrollments(sequenceId, contactId)` (D2, D7)
10. **Move rate limiting to Redis** for multi-instance correctness (S4)
