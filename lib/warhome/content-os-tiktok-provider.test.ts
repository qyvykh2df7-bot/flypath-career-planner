import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import {
  exchangeContentOsTikTokCode,
  listContentOsTikTokVideos,
  revokeContentOsTikTokAccess,
} from "@/lib/warhome/content-os-tiktok-provider";

const configuration = {
  clientKey: "client",
  clientSecret: "secret",
  redirectUri: "https://www.flypath.es/callback",
  encryptionKey: Buffer.alloc(32),
  syncMaxVideos: 20,
};

describe("Content OS TikTok provider", () => {
  it("intercambia el código sin exponer credenciales en URL", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: "access",
          refresh_token: "refresh",
          open_id: "open",
          scope: "video.list,user.info.basic",
          expires_in: 86_400,
          refresh_expires_in: 31_536_000,
        }),
        { status: 200 },
      ),
    );
    const result = await exchangeContentOsTikTokCode("code", configuration, {
      fetcher,
      now: new Date("2026-07-30T10:00:00Z"),
    });
    expect(result.openId).toBe("open");
    expect(fetcher).toHaveBeenCalledWith(
      "https://open.tiktokapis.com/v2/oauth/token/",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetcher.mock.calls[0][0]).not.toContain("secret");
  });

  it("pagina vídeos y mapea métricas públicas", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              videos: [
                {
                  id: "1",
                  share_url: "https://www.tiktok.com/@pilot/video/1",
                  video_description: "Vuelo #Piloto",
                  create_time: 1_700_000_000,
                  duration: 30,
                  view_count: 100,
                  like_count: 10,
                  comment_count: 2,
                  share_count: 1,
                },
              ],
              has_more: true,
              cursor: 2,
            },
            error: { code: "ok" },
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              videos: [
                {
                  id: "2",
                  share_url: "https://www.tiktok.com/@pilot/video/2",
                  title: "Formación",
                  create_time: 1_700_000_100,
                },
              ],
              has_more: false,
            },
            error: { code: "ok" },
          }),
        ),
      );
    const videos = await listContentOsTikTokVideos("access", 2, { fetcher });
    expect(videos).toHaveLength(2);
    expect(videos[0]).toMatchObject({
      providerVideoId: "1",
      hashtags: ["piloto"],
      views: 100,
    });
    expect(videos[1].views).toBeNull();
  });

  it("revoca la autorización al desconectar sin filtrar secretos en URL", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    await revokeContentOsTikTokAccess("access-token", configuration, {
      fetcher,
    });
    expect(fetcher).toHaveBeenCalledWith(
      "https://open.tiktokapis.com/v2/oauth/revoke/",
      expect.objectContaining({
        method: "POST",
        body: expect.any(URLSearchParams),
      }),
    );
    expect(fetcher.mock.calls[0][0]).not.toContain("access-token");
    expect(fetcher.mock.calls[0][0]).not.toContain("secret");
  });
});
