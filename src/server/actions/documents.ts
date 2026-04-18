"use server";

import { db } from "@/lib/db";
import { documents } from "@/server/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { s3, DOCS_BUCKET } from "@/lib/s3";
import { requireUserId } from "@/lib/auth-helper";
import { checkStorageQuota } from "@/lib/storage-quota";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getDocuments() {
  const userId = await requireUserId();

  return db.query.documents.findMany({
    where: eq(documents.userId, userId),
    with: {
      contact: true,
      property: true,
    },
    orderBy: [desc(documents.createdAt)],
  });
}

// ---------------------------------------------------------------------------
// Upload (presigned URL for client-side upload)
// ---------------------------------------------------------------------------

/** Generate a MinIO key for a document upload. */
export async function getDocumentUploadKey(
  filename: string,
) {
  const userId = await requireUserId();
  await checkStorageQuota(userId);
  const key = `${userId}/documents/${Date.now()}-${filename}`;
  return { key };
}

/** Get a download URL for a document via the server-side proxy. */
export async function getDocumentDownloadUrl(key: string) {
  await requireUserId();
  // Use the download proxy instead of presigned URLs (MinIO is on private network)
  return `/api/download?key=${encodeURIComponent(key)}`;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createDocument(data: {
  name: string;
  type?: string;
  key: string;
  filename: string;
  sizeBytes?: number;
  mimeType?: string;
  contactId?: string;
  propertyId?: string;
}) {
  const userId = await requireUserId();

  const [doc] = await db
    .insert(documents)
    .values({
      name: data.name,
      type: (data.type as typeof documents.$inferInsert.type) || "other",
      key: data.key,
      filename: data.filename,
      sizeBytes: data.sizeBytes ?? null,
      mimeType: data.mimeType ?? null,
      contactId: data.contactId || null,
      propertyId: data.propertyId || null,
      userId,
    })
    .returning();

  revalidatePath("/documents");
  return doc;
}

export async function deleteDocument(id: string, key: string) {
  const userId = await requireUserId();

  // Verify ownership BEFORE deleting from S3
  const doc = await db.query.documents.findFirst({
    where: and(eq(documents.id, id), eq(documents.userId, userId)),
  });
  if (!doc) throw new Error("Document not found");

  // Delete from MinIO (don't fail if the file doesn't exist)
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: DOCS_BUCKET,
        Key: key,
      }),
    );
  } catch (err) {
    console.error("MinIO delete error (continuing):", err);
  }

  // Always delete from DB even if MinIO fails
  await db
    .delete(documents)
    .where(eq(documents.id, id));
  revalidatePath("/documents");
}
