/**
 * Sanitize a string for use in SQL ILIKE patterns.
 * Escapes %, _, and \ which are special characters in LIKE/ILIKE.
 */
export function sanitizeLike(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}
