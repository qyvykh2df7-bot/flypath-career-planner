import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireWarhomeAdmin: vi.fn(),
  getSupabaseAdmin: vi.fn(),
  loadContentOsBrandProfile: vi.fn(),
  analyzeContentOsTikTokVideos: vi.fn(),
  getConfiguration: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/warhome/auth", () => ({
  requireWarhomeAdmin: mocks.requireWarhomeAdmin,
}));
vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: mocks.getSupabaseAdmin,
}));
vi.mock("@/lib/warhome/content-os-brand", () => ({
  loadContentOsBrandProfile: mocks.loadContentOsBrandProfile,
}));
vi.mock("@/lib/warhome/content-os-tiktok-ai", () => ({
  analyzeContentOsTikTokVideos: mocks.analyzeContentOsTikTokVideos,
}));
vi.mock("@/lib/warhome/content-os-tiktok-config", () => ({
  getContentOsTikTokConfiguration: mocks.getConfiguration,
}));
vi.mock("@/lib/warhome/content-os-tiktok-provider", () => ({
  exchangeContentOsTikTokCode: vi.fn(),
  getContentOsTikTokUser: vi.fn(),
  listContentOsTikTokVideos: vi.fn(),
  refreshContentOsTikTokTokens: vi.fn(),
  revokeContentOsTikTokAccess: vi.fn(),
}));

import {
  getContentOsTikTokWorkspace,
  importContentOsTikTokUrl,
  reviewContentOsTikTokVideo,
} from "@/lib/warhome/content-os-tiktok";

const adminUser = {
  userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  role: "owner",
};
const videoId = "11111111-1111-4111-8111-111111111111";
const brand = {
  workspaceKey: "pilotfeliu",
  brandName: "PilotFeliu",
  brandDescription: "Piloto comercial.",
  audiences: ["Futuros pilotos"],
  products: {
    guide: "Guía",
    career_planner: "Planner",
    aerocomms: "AeroComms",
    mentorships: "Mentorías",
  },
  contentPillars: ["Vida de piloto"],
  objectives: ["growth", "authority", "community", "conversion"],
  toneStyle: "Directo",
  tonePersonality: "Cercano",
  toneCommunication: "Claro",
  toneAvoid: "Datos profesionales sensibles",
  createdAt: null,
  updatedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireWarhomeAdmin.mockResolvedValue(adminUser);
  mocks.loadContentOsBrandProfile.mockResolvedValue(brand);
  mocks.getConfiguration.mockReturnValue({
    clientKey: "client",
    clientSecret: "secret",
    redirectUri: "https://www.flypath.es/callback",
    encryptionKey: Buffer.alloc(32),
    syncMaxVideos: 20,
  });
  mocks.analyzeContentOsTikTokVideos.mockResolvedValue({
    model: "test-model",
    analyses: [
      {
        providerVideoId: "123",
        title: "Título",
        summary: "Resumen",
        hook: "Hook",
        pillar: "pilot_life",
        objective: "community",
        relatedProduct: null,
      },
    ],
  });
});

describe("Content OS TikTok server layer", () => {
  it("exige autorización Warhome antes de leer la integración", async () => {
    mocks.requireWarhomeAdmin.mockRejectedValue(new Error("unauthorized"));
    await expect(getContentOsTikTokWorkspace()).rejects.toThrow("unauthorized");
    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("importa por URL de forma idempotente y conserva métricas manuales", async () => {
    let analysisStatus = "pending_analysis";
    const rpc = vi.fn(
      async (name: string, _parameters: Record<string, unknown>) => {
      void _parameters;
      if (name === "upsert_content_os_tiktok_video") {
        return { data: videoId, error: null };
      }
      if (name === "save_content_os_tiktok_analysis") {
        analysisStatus = "pending_review";
        return { data: videoId, error: null };
      }
      return { data: null, error: new Error("unexpected rpc") };
      },
    );
    const from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          in: vi.fn().mockImplementation(async () => ({
            data: [
              {
                id: videoId,
                tiktok_video_id: "123",
                analysis_status: analysisStatus,
                content_item_id: null,
              },
            ],
            error: null,
          })),
        })),
      })),
    }));
    mocks.getSupabaseAdmin.mockReturnValue({ rpc, from });

    const input = {
      shareUrl: "https://www.tiktok.com/@pilot/video/123",
      caption: "Vida de piloto #aviacion",
      publishedOn: "2026-07-30",
      durationSeconds: 30,
      views: 100,
      likes: 10,
      comments: 2,
      shares: 1,
      saves: 4,
    };
    await expect(importContentOsTikTokUrl(input)).resolves.toMatchObject({
      imported: 1,
      analyzed: 1,
    });
    await expect(importContentOsTikTokUrl(input)).resolves.toMatchObject({
      imported: 1,
      analyzed: 0,
    });

    const upserts = rpc.mock.calls.filter(
      ([name]) => name === "upsert_content_os_tiktok_video",
    );
    expect(upserts).toHaveLength(2);
    expect(upserts[0][1]).toMatchObject({
      p_tiktok_video_id: "123",
      p_saves: 4,
      p_import_source: "manual_url",
      p_metrics_source: "manual",
    });
    expect(mocks.analyzeContentOsTikTokVideos).toHaveBeenCalledTimes(1);
  });

  it("confirma o rechaza mediante la RPC atómica", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: "22222222-2222-4222-8222-222222222222",
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null });
    mocks.getSupabaseAdmin.mockReturnValue({ rpc });
    const input = {
      title: "Título",
      summary: "Resumen",
      hook: "Hook",
      pillar: "pilot_life" as const,
      objective: "community" as const,
      relatedProduct: null,
    };
    await expect(
      reviewContentOsTikTokVideo(videoId, "confirmed", input),
    ).resolves.toBe("22222222-2222-4222-8222-222222222222");
    await expect(
      reviewContentOsTikTokVideo(videoId, "rejected", input),
    ).resolves.toBeNull();
    expect(rpc).toHaveBeenCalledWith(
      "review_content_os_tiktok_analysis",
      expect.objectContaining({
        p_admin_user_id: adminUser.userId,
        p_video_id: videoId,
      }),
    );
  });

  it("limita los reintentos de análisis fallido", async () => {
    let attemptCount = 0;
    const rpc = vi.fn(async (name: string) => {
      if (name === "upsert_content_os_tiktok_video") {
        return { data: videoId, error: null };
      }
      if (name === "mark_content_os_tiktok_analysis_failed") {
        attemptCount += 1;
        return { data: 1, error: null };
      }
      return { data: null, error: new Error("unexpected rpc") };
    });
    const from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          in: vi.fn().mockResolvedValue({
            data: [
              {
                id: videoId,
                tiktok_video_id: "123",
                analysis_status: attemptCount ? "failed" : "pending_analysis",
                analysis_attempt_count: attemptCount,
                analysis_next_retry_at: null,
                content_item_id: null,
              },
            ],
            error: null,
          }),
        })),
      })),
    }));
    mocks.getSupabaseAdmin.mockReturnValue({ rpc, from });
    mocks.analyzeContentOsTikTokVideos.mockRejectedValueOnce(new Error("provider"));

    const input = {
      shareUrl: "https://www.tiktok.com/@pilot/video/123",
      caption: "Vídeo #aviacion",
      publishedOn: "2026-07-30",
      durationSeconds: 30,
      views: null,
      likes: null,
      comments: null,
      shares: null,
      saves: null,
    };
    await expect(importContentOsTikTokUrl(input)).resolves.toMatchObject({
      imported: 1,
      analyzed: 0,
      analysisFailed: 1,
    });
    expect(
      rpc.mock.calls.some(([name]) => name === "mark_content_os_tiktok_analysis_failed"),
    ).toBe(true);

    attemptCount = 3;
    mocks.analyzeContentOsTikTokVideos.mockClear();
    await expect(importContentOsTikTokUrl(input)).resolves.toMatchObject({
      imported: 1,
      analyzed: 0,
      analysisFailed: 0,
    });
    expect(mocks.analyzeContentOsTikTokVideos).not.toHaveBeenCalled();
  });
});
