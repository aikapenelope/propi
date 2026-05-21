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
 *
 * Design notes
 * ────────────
 * • Content-Disposition is set to `attachment` (not `inline`).
 *   Using `inline` causes the browser to try to render the file in-tab.
 *   For PDFs this works, but for .docx / .xlsx / images the browser either
 *   shows a blank page or stalls.  `attachment` consistently triggers the
 *   "Save File" dialog across all file types and all browsers.
 *
 * • Content-Length is only sent when S3 provides it.  Sending an empty
 *   string ("") is an invalid HTTP header value and can confuse proxies
 *   and browser download managers into misreporting file size or stalling.
 *
 * • The filename is sanitized (control chars, quotes, backslashes removed)
 *   and encoded with RFC 5987 (`filename*=UTF-8''…`) so non-ASCII names
 *   (e.g. Spanish accented characters) round-trip correctly across browsers.
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

    // Derive and sanitize the filename from the S3 key.
    //
    // Two-pass sanitization keeps each regex simple and easy to audit:
    //   Pass 1 — strip ASCII control characters (0–31) and DEL (127).
    //            These are never valid in HTTP header values.
    //   Pass 2 — strip characters that break the quoted-string syntax of
    //            Content-Disposition: double quote (ends the quoted token)
    //            and backslash (escape character inside a quoted token).
    //
    // The RFC 5987 `filename*=UTF-8''…` form is the authoritative value;
    // the plain `filename=` fallback covers legacy HTTP/1.0 clients.
    const rawFilename = key.split("/").pop() ?? "document";
    const safeFilename = rawFilename
      .replace(/[\x00-\x1f\x7f]/g, "_")
      .replace(/["\\]/g, "_");
    const encodedFilename = encodeURIComponent(safeFilename);

    // Build response headers.  Content-Length is included only when S3
    // provides it — sending an empty string would be an invalid header.
    const headers: Record<string, string> = {
      "Content-Type": response.ContentType ?? "application/octet-stream",
      // `attachment` forces a download dialog for every file type.
      // `inline` is intentionally NOT used here; see module-level docs.
      "Content-Disposition": `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`,
      "Cache-Control": "private, max-age=3600",
    };

    if (response.ContentLength != null) {
      headers["Content-Length"] = String(response.ContentLength);
    }

    return tracker.end(
      new Response(stream, { status: 200, headers }),
    );
  } catch (err) {
    tracker.error(err);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
