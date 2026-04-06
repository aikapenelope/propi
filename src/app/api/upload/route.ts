import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, MEDIA_BUCKET, DOCS_BUCKET } from "@/lib/s3";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

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

    const bucket = bucketType === "docs" ? DOCS_BUCKET : MEDIA_BUCKET;
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
