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

/**
 * Escape a string for safe interpolation into HTML.
 *
 * Replaces the 5 characters that have special meaning in HTML with their
 * corresponding character references. This prevents HTML injection when
 * user-supplied content (e.g. property descriptions) is embedded in
 * server-rendered HTML such as email templates.
 *
 * Reference: OWASP XSS Prevention Cheat Sheet — Rule #1
 * https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Scripting_Prevention_Cheat_Sheet.html
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
