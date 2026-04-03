"use server";

import { db } from "@/lib/db";
import { documents } from "@/server/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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

export async function getDocumentUploadUrl(
  filename: string,
  contentType: string,
) {
  const userId = await requireUserId();
  await checkStorageQuota(userId);
  const key = `${userId}/documents/${Date.now()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: DOCS_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 600 });
  return { url, key };
}

export async function getDocumentDownloadUrl(key: string) {
  // Key is already scoped by userId prefix ({userId}/documents/...)
  // but verify the caller is authenticated
  await requireUserId();

  const command = new GetObjectCommand({
    Bucket: DOCS_BUCKET,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn: 3600 });
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

  await s3.send(
    new DeleteObjectCommand({
      Bucket: DOCS_BUCKET,
      Key: key,
    }),
  );

  await db
    .delete(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, userId)));
  revalidatePath("/documents");
}
