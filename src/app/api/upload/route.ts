import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, MEDIA_BUCKET, DOCS_BUCKET } from "@/lib/s3";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Rate limiting: max 20 uploads per user per minute
// ---------------------------------------------------------------------------

const uploadRateMap = new Map<string, { count: number; resetAt: number }>();
const UPLOAD_RATE_LIMIT = 20;
const UPLOAD_WINDOW_MS = 60_000;

function checkUploadRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = uploadRateMap.get(userId);
  if (!entry || now > entry.resetAt) {
    uploadRateMap.set(userId, { count: 1, resetAt: now + UPLOAD_WINDOW_MS });
    return true;
  }
  if (entry.count >= UPLOAD_RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ---------------------------------------------------------------------------
// Allowed MIME types
// ---------------------------------------------------------------------------

/** Allowed MIME types for media bucket (property photos/videos) */
const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
  "video/mp4",
  "video/quicktime",
]);

/** Allowed MIME types for docs bucket (contracts, floor plans, etc.) */
const ALLOWED_DOC_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

/**
 * Server-side file upload to MinIO.
 * The browser sends the file here, and this route uploads it to MinIO.
 * This is necessary because MinIO is on a private network (10.0.1.20:9000)
 * that the browser cannot reach directly.
 *
 * Used by: property image upload, document upload.
 *
 * POST /api/upload
 * Body: FormData with fields: file, key, bucket (optional, defaults to media)
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Rate limit
  if (!checkUploadRateLimit(userId)) {
    return NextResponse.json(
      { error: "Demasiados uploads. Espera un momento." },
      { status: 429 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const key = formData.get("key") as string | null;
    const bucketType = (formData.get("bucket") as string) || "media";

    if (!file || !key) {
      return NextResponse.json(
        { error: "Missing file or key" },
        { status: 400 },
      );
    }

    // Verify the key starts with the user's ID (prevent uploading to other users' paths)
    if (!key.startsWith(`${userId}/`)) {
      return NextResponse.json(
        { error: "Invalid key prefix" },
        { status: 403 },
      );
    }

    // Sanitize: reject keys with path traversal
    if (key.includes("..") || key.includes("\0")) {
      return NextResponse.json(
        { error: "Invalid key" },
        { status: 400 },
      );
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 413 },
      );
    }

    // Validate MIME type based on target bucket
    const isDocsBucket = bucketType === "docs";
    const allowedTypes = isDocsBucket ? ALLOWED_DOC_TYPES : ALLOWED_MEDIA_TYPES;

    if (!allowedTypes.has(file.type)) {
      const allowed = isDocsBucket
        ? "PDF, Word, Excel, JPEG, PNG, WebP"
        : "JPEG, PNG, WebP, HEIC, AVIF, MP4";
      return NextResponse.json(
        { error: `Tipo de archivo no permitido. Formatos aceptados: ${allowed}` },
        { status: 415 },
      );
    }

    const bucket = isDocsBucket ? DOCS_BUCKET : MEDIA_BUCKET;
    const buffer = Buffer.from(await file.arrayBuffer());

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    return NextResponse.json({ success: true, key });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 },
    );
  }
}
