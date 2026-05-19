import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { propertyImages, documents } from "@/server/schema";
import { eq } from "drizzle-orm";
import { ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3, MEDIA_BUCKET, DOCS_BUCKET } from "@/lib/s3";

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
 * 1. List all objects in each bucket
 * 2. For each object, check if a corresponding DB record exists
 * 3. If no record exists AND the file is older than 24 hours, delete it
 *    (24h grace period prevents deleting files that are mid-upload)
 *
 * Protected by CRON_SECRET header.
 * Schedule: weekly (Sunday 4am, after cleanup-messages at 3am)
 *
 * Call: curl -H "Authorization: Bearer $CRON_SECRET" /api/cron/cleanup-storage
 */

const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_OBJECTS_PER_RUN = 1000; // Safety limit per bucket

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

    return NextResponse.json({
      success: true,
      media: mediaResult,
      docs: docsResult,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Storage cleanup error:", err);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Cleanup logic per bucket
// ---------------------------------------------------------------------------

async function cleanupBucket(
  bucket: string,
  type: "media" | "docs",
): Promise<{ scanned: number; orphansDeleted: number; errors: number }> {
  let scanned = 0;
  let orphansDeleted = 0;
  let errors = 0;
  let continuationToken: string | undefined;

  const now = Date.now();

  do {
    // List objects in the bucket (paginated, 1000 per page)
    const listResponse = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        MaxKeys: MAX_OBJECTS_PER_RUN,
        ContinuationToken: continuationToken,
      }),
    );

    const objects = listResponse.Contents || [];
    continuationToken = listResponse.NextContinuationToken;

    for (const obj of objects) {
      if (!obj.Key) continue;
      scanned++;

      // Skip files younger than 24 hours (may be mid-upload)
      const lastModified = obj.LastModified?.getTime() || now;
      if (now - lastModified < GRACE_PERIOD_MS) continue;

      // Check if this key exists in the DB
      const exists = await keyExistsInDb(obj.Key, type);

      if (!exists) {
        // Orphan — delete from MinIO
        try {
          await s3.send(
            new DeleteObjectCommand({ Bucket: bucket, Key: obj.Key }),
          );
          orphansDeleted++;
        } catch {
          errors++;
        }
      }
    }

    // Safety: only process one page per run to avoid long-running crons
    break;
  } while (continuationToken);

  return { scanned, orphansDeleted, errors };
}

/**
 * Check if a MinIO key has a corresponding record in the database.
 * Media keys are in property_images.key, docs keys are in documents.key.
 */
async function keyExistsInDb(key: string, type: "media" | "docs"): Promise<boolean> {
  if (type === "media") {
    const record = await db.query.propertyImages.findFirst({
      where: eq(propertyImages.key, key),
      columns: { id: true },
    });
    return !!record;
  }

  const record = await db.query.documents.findFirst({
    where: eq(documents.key, key),
    columns: { id: true },
  });
  return !!record;
}
