import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("unsubscribe tokens", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-cron-secret-for-hmac";
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("creates and verifies a valid token", async () => {
    const { createUnsubscribeToken, verifyUnsubscribeToken } = await import(
      "@/lib/unsubscribe"
    );
    const contactId = "550e8400-e29b-41d4-a716-446655440000";
    const token = createUnsubscribeToken(contactId);

    expect(token).toContain(contactId);
    expect(token).toContain(".");

    const result = verifyUnsubscribeToken(token);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.contactId).toBe(contactId);
    }
  });

  it("rejects a tampered token", async () => {
    const { createUnsubscribeToken, verifyUnsubscribeToken } = await import(
      "@/lib/unsubscribe"
    );
    const token = createUnsubscribeToken("some-contact-id");
    const tampered = token.slice(0, -4) + "xxxx";

    const result = verifyUnsubscribeToken(tampered);
    expect(result.valid).toBe(false);
  });

  it("rejects a token with no dot separator", async () => {
    const { verifyUnsubscribeToken } = await import("@/lib/unsubscribe");
    const result = verifyUnsubscribeToken("no-dot-here");
    expect(result.valid).toBe(false);
  });

  it("generates a full unsubscribe URL", async () => {
    const { getUnsubscribeUrl } = await import("@/lib/unsubscribe");
    const url = getUnsubscribeUrl("test-contact-id");
    expect(url).toContain("/api/unsubscribe?token=");
    expect(url).toContain("test-contact-id");
  });

  it("generates an HTML footer with unsubscribe link", async () => {
    const { getUnsubscribeFooter } = await import("@/lib/unsubscribe");
    const footer = getUnsubscribeFooter("test-contact-id");
    expect(footer).toContain("/api/unsubscribe");
    expect(footer).toContain("cancela tu suscripcion");
  });
});
