import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3, MEDIA_BUCKET } from "@/lib/s3";

export const dynamic = "force-dynamic";

// Simple in-memory rate limit: max 100 requests per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100;
const WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

/**
 * Public image proxy for MinIO.
 * Serves property images at a public URL that external services (Meta, etc.) can access.
 *
 * URL: /api/images/{key}
 * Example: /api/images/properties/1234-photo.jpg
 *
 * Used by:
 * - Instagram publish (image_url must be public, Meta cURLs it)
 * - Facebook publish (url must be public)
 * - Property share links
 *
 * NOT used by:
 * - MercadoLibre (uses multipart upload, not URLs)
 * - Wasi (uses multipart upload, not URLs)
 *
 * Cache: 24 hours (images don't change once uploaded)
 */
export async function GET(
  request: Request,
  props: { params: Promise<{ key: string }> },
) {
  // Rate limit
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { key } = await props.params;

  if (!key) {
    return NextResponse.json({ error: "Key required" }, { status: 400 });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: MEDIA_BUCKET,
      Key: decodeURIComponent(key),
    });

    const response = await s3.send(command);

    if (!response.Body) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Convert to web ReadableStream
    const stream = response.Body.transformToWebStream();

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": response.ContentType || "image/jpeg",
        "Content-Length": response.ContentLength
          ? String(response.ContentLength)
          : "",
        "Cache-Control": "public, max-age=86400, immutable",
        "Access-Control-Allow-Origin": "*",
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
