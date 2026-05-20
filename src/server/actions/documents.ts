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
import { documentSchema } from "@/lib/validators";
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
    limit: 200,
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
  const validated = documentSchema.parse(data);

  const [doc] = await db
    .insert(documents)
    .values({
      name: validated.name,
      type: validated.type || "other",
      key: validated.key,
      filename: validated.filename,
      sizeBytes: validated.sizeBytes ?? null,
      mimeType: validated.mimeType ?? null,
      contactId: validated.contactId || null,
      propertyId: validated.propertyId || null,
      userId,
    })
    .returning();

  revalidatePath("/documents");
  return doc;
}

export async function deleteDocument(id: string) {
  const userId = await requireUserId();

  // Verify ownership and retrieve the authoritative S3 key from the DB.
  // Never trust a client-supplied key for deletion — use the DB record.
  const doc = await db.query.documents.findFirst({
    where: and(eq(documents.id, id), eq(documents.userId, userId)),
  });
  if (!doc) throw new Error("Document not found");

  // Delete from MinIO using the key stored in the DB (don't fail if missing)
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: DOCS_BUCKET,
        Key: doc.key,
      }),
    );
  } catch (err) {
    console.error("MinIO delete error (continuing):", err);
  }

  // Always delete from DB even if MinIO fails
  await db
    .delete(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, userId)));
  revalidatePath("/documents");
}
