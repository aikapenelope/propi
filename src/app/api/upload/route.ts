import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
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

/** Image MIME types that sharp can process and convert to WebP. */
const PROCESSABLE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
  "image/tiff",
]);

/** Allowed MIME types for media bucket (property photos/videos) */
const ALLOWED_MEDIA_TYPES = new Set([
  ...PROCESSABLE_IMAGE_TYPES,
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

// ---------------------------------------------------------------------------
// Image processing
// ---------------------------------------------------------------------------

/** Max dimension for property images (width or height). */
const MAX_IMAGE_DIMENSION = 1920;

/** WebP quality (0-100). 80 is a good balance of quality and file size. */
const WEBP_QUALITY = 80;

/**
 * Process an image: resize to max dimension and convert to WebP.
 * Returns the processed buffer and the new content type.
 *
 * - HEIC/HEIF from iPhones -> converted to WebP (browsers can't render HEIC)
 * - Large images -> resized to max 1920px on the longest side
 * - Already-small WebP/JPEG -> passed through with minimal re-encoding
 */
async function processImage(
  buffer: Buffer,
  mimeType: string,
): Promise<{ data: Buffer; contentType: string; key: string }> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const needsResize =
    width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION;
  const needsConversion =
    mimeType === "image/heic" ||
    mimeType === "image/heif" ||
    mimeType === "image/tiff" ||
    mimeType === "image/avif";

  // If already WebP and small enough, pass through
  if (mimeType === "image/webp" && !needsResize) {
    return { data: buffer, contentType: "image/webp", key: ".webp" };
  }

  // If JPEG/PNG and small enough, keep original format
  if (
    !needsConversion &&
    !needsResize &&
    (mimeType === "image/jpeg" || mimeType === "image/png")
  ) {
    return {
      data: buffer,
      contentType: mimeType,
      key: mimeType === "image/jpeg" ? ".jpg" : ".png",
    };
  }

  // Process: resize if needed + convert to WebP
  let pipeline = image;
  if (needsResize) {
    pipeline = pipeline.resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  // Auto-rotate based on EXIF orientation (common with phone photos)
  pipeline = pipeline.rotate();

  const processed = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();

  return { data: processed, contentType: "image/webp", key: ".webp" };
}

// ---------------------------------------------------------------------------
// Upload handler
// ---------------------------------------------------------------------------

/**
 * Server-side file upload to MinIO.
 * The browser sends the file here, and this route uploads it to MinIO.
 * This is necessary because MinIO is on a private network (10.0.1.20:9000)
 * that the browser cannot reach directly.
 *
 * For images: automatically converts HEIC/HEIF to WebP, resizes large
 * images to max 1920px, and auto-rotates based on EXIF orientation.
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
    let key = formData.get("key") as string | null;
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
    let buffer: Buffer = Buffer.from(await file.arrayBuffer());
    let contentType = file.type;

    // Process images: convert HEIC->WebP, resize large images, auto-rotate
    if (!isDocsBucket && PROCESSABLE_IMAGE_TYPES.has(file.type)) {
      try {
        const result = await processImage(buffer, file.type);
        buffer = result.data;
        contentType = result.contentType;

        // Update the key extension if the format changed
        if (result.key !== getExtension(key)) {
          key = key.replace(/\.[^.]+$/u, result.key);
        }
      } catch (imgErr) {
        console.error("Image processing error:", imgErr);
        return NextResponse.json(
          { error: "No se pudo procesar la imagen. Intenta con otro formato (JPEG, PNG, WebP)." },
          { status: 422 },
        );
      }
    }

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
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

/** Extract file extension including the dot. */
function getExtension(filename: string): string {
  const match = filename.match(/\.[^.]+$/u);
  return match ? match[0] : "";
}
