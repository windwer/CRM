import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH_HEX = 64;

function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;

  if (!key || key.length !== KEY_LENGTH_HEX) {
    throw new Error("ENCRYPTION_KEY_MISSING_OR_INVALID");
  }

  return Buffer.from(key, "hex");
}

export function encryptApiKey(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [iv, authTag, encrypted].map((buffer) => buffer.toString("hex")).join(":");
}

export function decryptApiKey(encrypted: string): string {
  const [ivHex, authTagHex, encryptedHex] = encrypted.split(":");

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("INVALID_ENCRYPTED_API_KEY");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

export function maskApiKey(apiKey: string) {
  return `••••••••••••${apiKey.slice(-4)}`;
}
