import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("crypto", () => {
  const TEST_KEY =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

  beforeEach(() => {
    process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY;
  });

  afterEach(() => {
    delete process.env.TOKEN_ENCRYPTION_KEY;
  });

  it("encrypts and decrypts a token", async () => {
    // Dynamic import to pick up env var changes
    const { encryptToken, decryptToken } = await import("@/lib/crypto");
    const plaintext = "sk_live_test_token_12345";
    const encrypted = encryptToken(plaintext);

    expect(encrypted).not.toBe(plaintext);
    expect(encrypted.startsWith("enc:")).toBe(true);

    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("decrypts legacy plaintext tokens as-is", async () => {
    const { decryptToken } = await import("@/lib/crypto");
    const legacy = "sk_live_legacy_plaintext_token";
    expect(decryptToken(legacy)).toBe(legacy);
  });

  it("maybeEncrypt returns encrypted when key is set", async () => {
    const { maybeEncrypt } = await import("@/lib/crypto");
    const result = maybeEncrypt("test");
    expect(result.startsWith("enc:")).toBe(true);
  });

  it("maybeDecrypt handles both encrypted and plaintext", async () => {
    const { maybeEncrypt, maybeDecrypt } = await import("@/lib/crypto");
    const encrypted = maybeEncrypt("secret_value");
    expect(maybeDecrypt(encrypted)).toBe("secret_value");
    expect(maybeDecrypt("plain_value")).toBe("plain_value");
  });

  it("produces different ciphertexts for the same plaintext (random IV)", async () => {
    const { encryptToken } = await import("@/lib/crypto");
    const a = encryptToken("same_input");
    const b = encryptToken("same_input");
    expect(a).not.toBe(b);
  });
});
