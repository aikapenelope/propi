"use server";

import { db } from "@/lib/db";
import { documents } from "@/server/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, DOCS_BUCKET } from "@/lib/s3";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getDocuments() {
  return db.query.documents.findMany({
    with: {
      contact: true,
      property: true,
      agent: true,
    },
    orderBy: [desc(documents.createdAt)],
  });
}

export async function getDocumentsByContact(contactId: string) {
  return db.query.documents.findMany({
    where: eq(documents.contactId, contactId),
    orderBy: [desc(documents.createdAt)],
  });
}

export async function getDocumentsByProperty(propertyId: string) {
  return db.query.documents.findMany({
    where: eq(documents.propertyId, propertyId),
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
  const key = `documents/${Date.now()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: DOCS_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 600 });
  return { url, key };
}

export async function getDocumentDownloadUrl(key: string) {
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
    })
    .returning();

  revalidatePath("/documents");
  return doc;
}

export async function deleteDocument(id: string, key: string) {
  // Delete from MinIO
  await s3.send(
    new DeleteObjectCommand({
      Bucket: DOCS_BUCKET,
      Key: key,
    }),
  );

  await db.delete(documents).where(eq(documents.id, id));
  revalidatePath("/documents");
}
