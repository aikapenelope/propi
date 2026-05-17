import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

/**
 * Application-level encryption for sensitive tokens stored in the database.
 *
 * Uses AES-256-GCM (authenticated encryption) with a 256-bit key derived
 * from the TOKEN_ENCRYPTION_KEY environment variable.
 *
 * Storage format: base64 of `iv (12 bytes) || authTag (16 bytes) || ciphertext`
 * This is a single opaque string safe for a `text` column.
 *
 * Backward compatibility: if a value doesn't start with the ENCRYPTED_PREFIX,
 * it's treated as a legacy plaintext token and returned as-is. This allows
 * a gradual migration — tokens are encrypted on next write.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Prefix prepended to every encrypted value so we can distinguish
 * encrypted tokens from legacy plaintext ones.
 */
const ENCRYPTED_PREFIX = "enc:";

function getKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY is not set. " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }

  // Accept either a 64-char hex string (32 bytes) or a 44-char base64 string (32 bytes)
  if (raw.length === 64 && /^[0-9a-f]+$/i.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  const buf = Buffer.from(raw, "base64");
  if (buf.length === 32) {
    return buf;
  }

  throw new Error(
    "TOKEN_ENCRYPTION_KEY must be a 64-character hex string or 44-character base64 string (32 bytes).",
  );
}

/**
 * Encrypt a plaintext string.
 * Returns a prefixed base64 string safe for storage in a text column.
 */
export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Pack: iv || authTag || ciphertext
  const packed = Buffer.concat([iv, authTag, encrypted]);
  return ENCRYPTED_PREFIX + packed.toString("base64");
}

/**
 * Decrypt a token string.
 *
 * If the value doesn't have the encrypted prefix, it's a legacy plaintext
 * token — return it as-is. This enables gradual migration: tokens are
 * encrypted on next write, and old plaintext tokens still work until then.
 */
export function decryptToken(stored: string): string {
  // Legacy plaintext token — return as-is
  if (!stored.startsWith(ENCRYPTED_PREFIX)) {
    return stored;
  }

  const key = getKey();
  const packed = Buffer.from(stored.slice(ENCRYPTED_PREFIX.length), "base64");

  if (packed.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error("Invalid encrypted token: too short");
  }

  const iv = packed.subarray(0, IV_LENGTH);
  const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = packed.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Check whether TOKEN_ENCRYPTION_KEY is configured.
 * Used to decide whether to encrypt on write (graceful degradation in dev).
 */
export function isEncryptionConfigured(): boolean {
  return !!process.env.TOKEN_ENCRYPTION_KEY;
}

/**
 * Encrypt a token if encryption is configured, otherwise return plaintext.
 * This allows development environments to work without a key.
 */
export function maybeEncrypt(plaintext: string): string {
  if (!isEncryptionConfigured()) return plaintext;
  return encryptToken(plaintext);
}

/**
 * Decrypt a token. Works for both encrypted and legacy plaintext values.
 * If encryption is not configured and the value is encrypted, throws.
 */
export function maybeDecrypt(stored: string): string {
  if (!stored.startsWith(ENCRYPTED_PREFIX)) return stored;
  return decryptToken(stored);
}
