import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

export function isEncryptionKeyConfigured(): boolean {
  return Boolean(
    (process.env.AI_ENCRYPTION_KEY && process.env.AI_ENCRYPTION_KEY.trim().length > 0) ||
    (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length > 0)
  );
}

/**
 * Derives a deterministic 32-byte key for AES-256-GCM.
 * Prioritizes AI_ENCRYPTION_KEY, then JWT_SECRET, with a secure application default.
 */
function getDerivedKey(): Buffer {
  const secret =
    process.env.AI_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    "awaaz_jamkhedcha_secure_ai_key_2026_default";

  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a plain text API key using AES-256-GCM.
 * Returns format: `${ivHex}:${authTagHex}:${encryptedHex}`
 */
export function encryptApiKey(plainKey: string): string {
  if (!plainKey) return "";

  const key = getDerivedKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainKey, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted API key.
 */
export function decryptApiKey(encryptedData: string): string {
  if (!encryptedData) return "";

  // If the key is already plain text (e.g. legacy or unencrypted during migration)
  if (!encryptedData.includes(":")) {
    return encryptedData;
  }

  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted key format. Expected iv:tag:ciphertext.");
  }

  const [ivHex, authTagHex, cipherHex] = parts;
  const key = getDerivedKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Masks an API key for safe public or admin view (e.g. ••••••••1a2b).
 * Never exposes the full plaintext key to the browser.
 */
export function maskApiKey(plainKey: string): string {
  if (!plainKey) return "••••••••";
  const trimmed = plainKey.trim();
  if (trimmed.length <= 4) return "••••••••";
  const lastFour = trimmed.slice(-4);
  return `••••••••${lastFour}`;
}

