import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const VERSION = "v1";

export class ContentOsTikTokTokenError extends Error {
  constructor() {
    super("Content OS TikTok token is unavailable");
    this.name = "ContentOsTikTokTokenError";
  }
}

export function encryptContentOsTikTokToken(
  token: string,
  key: Buffer,
): string {
  if (!token || key.length !== 32) throw new ContentOsTikTokTokenError();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptContentOsTikTokToken(
  encrypted: string,
  key: Buffer,
): string {
  if (key.length !== 32) throw new ContentOsTikTokTokenError();
  const parts = encrypted.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new ContentOsTikTokTokenError();
  }
  try {
    const iv = Buffer.from(parts[1], "base64url");
    const authTag = Buffer.from(parts[2], "base64url");
    const ciphertext = Buffer.from(parts[3], "base64url");
    if (iv.length !== IV_BYTES || authTag.length !== 16 || !ciphertext.length) {
      throw new ContentOsTikTokTokenError();
    }
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new ContentOsTikTokTokenError();
  }
}
