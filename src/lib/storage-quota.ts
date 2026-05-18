import { db } from "@/lib/db";
import { documents, properties, propertyImages } from "@/server/schema";
import { eq, sql } from "drizzle-orm";

/** Max storage per user: 500MB */
const MAX_STORAGE_BYTES = 500 * 1024 * 1024;

/** Estimated size per property image (MinIO doesn't track size in DB) */
const ESTIMATED_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Check if a user has exceeded their storage quota.
 * Throws if over limit. Call before any upload.
 */
export async function checkStorageQuota(userId: string): Promise<void> {
  // Sum document sizes (we track sizeBytes in documents table)
  const [docUsage] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${documents.sizeBytes}), 0)::bigint`,
    })
    .from(documents)
    .where(eq(documents.userId, userId));

  // Count images (estimate 2MB each since we don't track image size)
  const [imageCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(propertyImages)
    .innerJoin(properties, eq(propertyImages.propertyId, properties.id))
    .where(eq(properties.userId, userId));

  const estimated =
    Number(docUsage.total || 0) +
    (imageCount.count || 0) * ESTIMATED_IMAGE_SIZE;

  if (estimated > MAX_STORAGE_BYTES) {
    const usedMB = Math.round(estimated / 1024 / 1024);
    const maxMB = Math.round(MAX_STORAGE_BYTES / 1024 / 1024);
    throw new Error(
      `Limite de almacenamiento alcanzado (${usedMB}MB de ${maxMB}MB). Elimina archivos para continuar.`,
    );
  }
}
