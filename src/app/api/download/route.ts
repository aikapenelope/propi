import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3, DOCS_BUCKET } from "@/lib/s3";
import { auth } from "@clerk/nextjs/server";
import { startTracking } from "@/lib/track-request";

export const dynamic = "force-dynamic";

/**
 * Server-side document download proxy.
 * Streams files from MinIO (private network) to the browser.
 *
 * GET /api/download?key=userId/documents/filename.pdf
 */
export async function GET(request: Request) {
  const tracker = startTracking(request);

  const { userId } = await auth();
  if (!userId) {
    return tracker.end(
      NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    );
  }

  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "Key required" }, { status: 400 });
  }

  // Reject path traversal attempts
  if (key.includes("..") || key.includes("\0")) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  // Verify the key belongs to this user
  if (!key.startsWith(`${userId}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: DOCS_BUCKET,
      Key: key,
    });

    const response = await s3.send(command);

    if (!response.Body) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const stream = response.Body.transformToWebStream();
    const rawFilename = key.split("/").pop() || "document";
    // Sanitize filename: remove control chars, quotes, and backslashes
    // to prevent header injection. Use RFC 5987 encoding for safety.
    const safeFilename = rawFilename.replace(/["\\\x00-\x1f\x7f]/g, "_");
    const encodedFilename = encodeURIComponent(safeFilename);

    return tracker.end(
      new Response(stream, {
        status: 200,
        headers: {
          "Content-Type": response.ContentType || "application/octet-stream",
          "Content-Length": response.ContentLength
            ? String(response.ContentLength)
            : "",
          "Content-Disposition": `inline; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`,
          "Cache-Control": "private, max-age=3600",
        },
      }),
    );
  } catch (err) {
    tracker.error(err);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
