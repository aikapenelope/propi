import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3, MEDIA_BUCKET } from "@/lib/s3";
import { createRateLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Rate limit: max 100 requests per IP per minute (distributed via Redis)
const imageLimiter = createRateLimiter({
  prefix: "rl:images",
  limit: 100,
  windowMs: 60_000,
});

/**
 * Public image proxy for MinIO.
 * Serves property images via a public URL.
 *
 * Uses catch-all route [...key] to handle keys with slashes:
 *   /api/images/user_abc/properties/uuid/photo.jpg
 *   -> key segments: ["user_abc", "properties", "uuid", "photo.jpg"]
 *   -> MinIO key: "user_abc/properties/uuid/photo.jpg"
 *
 * Cache: 24 hours, immutable (images don't change once uploaded)
 */
export async function GET(
  request: Request,
  props: { params: Promise<{ key: string[] }> },
) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!(await imageLimiter.check(ip))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { key: keySegments } = await props.params;

  if (!keySegments || keySegments.length === 0) {
    return NextResponse.json({ error: "Key required" }, { status: 400 });
  }

  // Rejoin segments into the full MinIO key
  const key = keySegments.map(decodeURIComponent).join("/");

  // Reject path traversal attempts
  if (key.includes("..") || key.includes("\0")) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: MEDIA_BUCKET,
      Key: key,
    });

    const response = await s3.send(command);

    if (!response.Body) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const stream = response.Body.transformToWebStream();

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": response.ContentType || "image/jpeg",
        "Content-Length": response.ContentLength
          ? String(response.ContentLength)
          : "",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("NoSuchKey") || message.includes("not found")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
