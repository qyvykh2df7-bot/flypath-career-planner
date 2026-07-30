import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireWarhomeAdmin: vi.fn(),
  getConfiguration: vi.fn(),
  connectAccount: vi.fn(),
}));

vi.mock("@/lib/warhome/auth", () => ({
  requireWarhomeAdmin: mocks.requireWarhomeAdmin,
}));
vi.mock("@/lib/warhome/content-os-tiktok-config", () => ({
  getContentOsTikTokConfiguration: mocks.getConfiguration,
}));
vi.mock("@/lib/warhome/content-os-tiktok", () => ({
  connectContentOsTikTokAccount: mocks.connectAccount,
}));

import { GET as connect } from "./connect/route";
import { GET as callback } from "./callback/route";
import { CONTENT_OS_TIKTOK_OAUTH_STATE_COOKIE } from "@/lib/warhome/content-os-tiktok-contract";

const configuration = {
  clientKey: "client-key",
  clientSecret: "private-secret",
  redirectUri:
    "https://www.flypath.es/api/warhome/content/integrations/tiktok/callback",
  encryptionKey: Buffer.alloc(32),
  syncMaxVideos: 20,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireWarhomeAdmin.mockResolvedValue({
    userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    role: "owner",
  });
  mocks.getConfiguration.mockReturnValue(configuration);
  mocks.connectAccount.mockResolvedValue(undefined);
});

describe("Content OS TikTok OAuth routes", () => {
  it("inicia OAuth solo para Warhome y guarda state HttpOnly", async () => {
    const response = await connect();
    const location = new URL(response.headers.get("location")!);
    expect(location.origin).toBe("https://www.tiktok.com");
    expect(location.searchParams.get("client_key")).toBe("client-key");
    expect(location.searchParams.get("scope")).toBe(
      "user.info.basic,video.list",
    );
    expect(location.searchParams.get("redirect_uri")).toBe(
      configuration.redirectUri,
    );
    expect(location.searchParams.get("state")).toBeTruthy();
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("location")).not.toContain("private-secret");
  });

  it("falla cerrado si no hay administrador Warhome", async () => {
    mocks.requireWarhomeAdmin.mockRejectedValue(new Error("unauthorized"));
    const response = await connect();
    expect(response.status).toBe(503);
    expect(mocks.getConfiguration).not.toHaveBeenCalled();
  });

  it("acepta el callback solo con el mismo state", async () => {
    const state = "opaque-state-value";
    const request = new NextRequest(
      `${configuration.redirectUri}?code=oauth-code&state=${state}`,
      {
        headers: {
          cookie: `${CONTENT_OS_TIKTOK_OAUTH_STATE_COOKIE}=${state}`,
        },
      },
    );
    const response = await callback(request);
    expect(response.headers.get("location")).toBe(
      "https://www.flypath.es/warhome/content/integrations/tiktok?tiktok=connected",
    );
    expect(mocks.connectAccount).toHaveBeenCalledWith("oauth-code");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("rechaza un callback con state distinto", async () => {
    const request = new NextRequest(
      `${configuration.redirectUri}?code=oauth-code&state=received`,
      {
        headers: {
          cookie: `${CONTENT_OS_TIKTOK_OAUTH_STATE_COOKIE}=expected`,
        },
      },
    );
    const response = await callback(request);
    expect(response.headers.get("location")).toContain("tiktok=error");
    expect(mocks.connectAccount).not.toHaveBeenCalled();
  });
});
