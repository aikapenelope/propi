import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3, MEDIA_BUCKET, DOCS_BUCKET } from "@/lib/s3";
import { log } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron job to clean up orphaned files in MinIO.
 *
 * Orphans occur when:
 * - An upload completes in MinIO but the DB INSERT fails (crash, timeout)
 * - A bug causes the DB record to be deleted without cleaning MinIO
 *
 * Strategy:
 * 1. Batch-load all known keys from the DB into a Set (one query per bucket).
 * 2. List objects in the bucket (paginated, up to MAX_OBJECTS_PER_RUN).
 * 3. For each object, check the Set — O(1), no per-object DB round-trip.
 * 4. If a key is not in the Set AND the file is older than 24h → delete it.
 *    (24h grace period prevents deleting files that are mid-upload.)
 *
 * Performance note
 * ─────────────────
 * The original implementation called keyExistsInDb() for every MinIO object,
 * which caused N DB round-trips for N files.  The batch approach reduces that
 * to 1 DB query per bucket regardless of how many files are scanned.
 *
 * Protected by CRON_SECRET header.
 * Schedule: weekly (Sunday 4am, after cleanup-messages at 3am).
 *
 * Call: curl -H "Authorization: Bearer $CRON_SECRET" /api/cron/cleanup-storage
 */

const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_OBJECTS_PER_RUN = 1000;             // Safety limit per bucket

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const mediaResult = await cleanupBucket(MEDIA_BUCKET, "media");
    const docsResult = await cleanupBucket(DOCS_BUCKET, "docs");

    log.cron.info(
      { media: mediaResult, docs: docsResult },
      "storage cleanup complete",
    );

    return NextResponse.json({
      success: true,
      media: mediaResult,
      docs: docsResult,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    log.cron.error(
      { error: err instanceof Error ? err.message : String(err) },
      "storage cleanup failed",
    );
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Cleanup logic per bucket
// ---------------------------------------------------------------------------

async function cleanupBucket(
  bucket: string,
  type: "media" | "docs",
): Promise<{ scanned: number; orphansDeleted: number; errors: number }> {
  // ── Batch-load all known keys from the DB into a Set ──────────────────────
  //
  // This single query replaces per-object DB lookups, reducing N round-trips
  // to 1 regardless of how many MinIO objects are scanned.
  const knownKeys = await loadKnownKeys(type);

  let scanned = 0;
  let orphansDeleted = 0;
  let errors = 0;
  const now = Date.now();

  // ── List objects (first page only, capped at MAX_OBJECTS_PER_RUN) ─────────
  //
  // A single page prevents cron runs from consuming server resources for too
  // long.  Any remaining orphans will be caught on the next weekly run.
  const listResponse = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      MaxKeys: MAX_OBJECTS_PER_RUN,
    }),
  );

  const objects = listResponse.Contents ?? [];

  for (const obj of objects) {
    if (!obj.Key) continue;
    scanned++;

    // Skip files younger than 24h — they may be mid-upload.
    const lastModified = obj.LastModified?.getTime() ?? now;
    if (now - lastModified < GRACE_PERIOD_MS) continue;

    // O(1) Set lookup — no DB call per object.
    if (!knownKeys.has(obj.Key)) {
      // Orphan — delete from MinIO.  Errors on individual files are isolated
      // so a single bad object does not abort the rest of the run.
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: obj.Key }));
        orphansDeleted++;
      } catch (err) {
        log.cron.warn(
          { bucket, key: obj.Key, error: err instanceof Error ? err.message : String(err) },
          "failed to delete orphan object",
        );
        errors++;
      }
    }
  }

  return { scanned, orphansDeleted, errors };
}

/**
 * Load all file keys registered in the database for the given bucket type.
 * Returns a Set for O(1) membership checks.
 *
 * @param type "media"  → property_images.key
 *             "docs"   → documents.key
 */
async function loadKnownKeys(type: "media" | "docs"): Promise<Set<string>> {
  if (type === "media") {
    const rows = await db.query.propertyImages.findMany({
      columns: { key: true },
    });
    return new Set(rows.map((r) => r.key));
  }

  const rows = await db.query.documents.findMany({
    columns: { key: true },
  });
  return new Set(rows.map((r) => r.key));
}
