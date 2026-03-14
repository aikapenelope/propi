import { S3Client } from "@aws-sdk/client-s3";

/**
 * MinIO/S3 client for file storage.
 *
 * Connects to MinIO on the Data Plane (10.0.1.20:9000).
 * Buckets: propi-media (property photos), propi-documents (contracts).
 *
 * Required env vars: S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY
 */
export const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT || "http://10.0.1.20:9000",
  region: "us-east-1", // MinIO requires a region but ignores it
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
  forcePathStyle: true, // Required for MinIO
});

export const MEDIA_BUCKET = process.env.S3_MEDIA_BUCKET || "propi-media";
export const DOCS_BUCKET = process.env.S3_DOCS_BUCKET || "propi-documents";
