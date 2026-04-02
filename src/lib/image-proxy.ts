/**
 * Convert a MinIO storage key to a public URL via the image proxy.
 * Used when publishing to Meta (IG/FB) which requires a publicly accessible URL.
 *
 * @param key - The MinIO object key (e.g. "properties/1234-photo.jpg")
 * @returns Public URL (e.g. "https://propi.aikalabs.cc/api/images/properties/1234-photo.jpg")
 */
export function getPublicImageUrl(key: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://propi.aikalabs.cc";
  return `${baseUrl}/api/images/${encodeURIComponent(key)}`;
}
