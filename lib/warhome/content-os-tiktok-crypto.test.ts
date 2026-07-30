import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import {
  ContentOsTikTokTokenError,
  decryptContentOsTikTokToken,
  encryptContentOsTikTokToken,
} from "@/lib/warhome/content-os-tiktok-crypto";

describe("Content OS TikTok token encryption", () => {
  it("cifra con AES-GCM y recupera el token", () => {
    const key = Buffer.alloc(32, 3);
    const encrypted = encryptContentOsTikTokToken("secret-token", key);
    expect(encrypted).not.toContain("secret-token");
    expect(decryptContentOsTikTokToken(encrypted, key)).toBe("secret-token");
  });

  it("falla cerrado ante manipulación", () => {
    const key = Buffer.alloc(32, 3);
    const encrypted = encryptContentOsTikTokToken("secret-token", key);
    const parts = encrypted.split(".");
    parts[3] = `${parts[3][0] === "A" ? "B" : "A"}${parts[3].slice(1)}`;
    expect(() =>
      decryptContentOsTikTokToken(parts.join("."), key),
    ).toThrow(ContentOsTikTokTokenError);
  });
});
