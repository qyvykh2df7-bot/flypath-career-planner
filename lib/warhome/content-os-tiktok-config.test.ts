import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import {
  ContentOsTikTokConfigurationError,
  parseContentOsTikTokConfiguration,
} from "@/lib/warhome/content-os-tiktok-config";

const validEnvironment = {
  NODE_ENV: "test" as const,
  TIKTOK_CLIENT_KEY: "client-key",
  TIKTOK_CLIENT_SECRET: "client-secret",
  TIKTOK_REDIRECT_URI:
    "https://www.flypath.es/api/warhome/content/integrations/tiktok/callback",
  CONTENT_OS_TIKTOK_TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString(
    "base64",
  ),
  FLYPATH_CANONICAL_ORIGIN: "https://www.flypath.es",
};

describe("Content OS TikTok configuration", () => {
  it("acepta una configuración server-side completa", () => {
    expect(
      parseContentOsTikTokConfiguration(validEnvironment),
    ).toMatchObject({
      clientKey: "client-key",
      syncMaxVideos: 20,
    });
  });

  it("rechaza redirect externo y claves de cifrado inválidas", () => {
    expect(() =>
      parseContentOsTikTokConfiguration({
        ...validEnvironment,
        TIKTOK_REDIRECT_URI: "https://evil.example/callback",
      }),
    ).toThrow(ContentOsTikTokConfigurationError);
    expect(() =>
      parseContentOsTikTokConfiguration({
        ...validEnvironment,
        CONTENT_OS_TIKTOK_TOKEN_ENCRYPTION_KEY: "short",
      }),
    ).toThrow(ContentOsTikTokConfigurationError);
  });

  it("limita el volumen de sincronización", () => {
    expect(() =>
      parseContentOsTikTokConfiguration({
        ...validEnvironment,
        CONTENT_OS_TIKTOK_SYNC_MAX_VIDEOS: "101",
      }),
    ).toThrow(ContentOsTikTokConfigurationError);
  });
});
