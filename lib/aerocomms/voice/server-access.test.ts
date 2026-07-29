import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAccess: vi.fn(),
  rpc: vi.fn(),
  isSameOriginRequest: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/aerocomms/access-server", () => ({ getAeroCommsAccess: mocks.getAccess }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: () => ({ rpc: mocks.rpc }) }));
vi.mock("@/lib/tracking/server", () => ({ isSameOriginRequest: mocks.isSameOriginRequest }));

import {
  authorizeAeroCommsVoiceRequest,
  getTrustedAeroCommsVoiceIp,
} from "./server-access";

const rateLimitSalt = "a-voice-rate-limit-test-salt-with-enough-entropy";
const request = new Request("https://flypath.test/api/aerocomms/voice/speak", {
  method: "POST",
  headers: { origin: "https://flypath.test", "x-real-ip": "198.51.100.12" },
});

describe("AeroComms voice server access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSameOriginRequest.mockReturnValue(true);
    mocks.getAccess.mockResolvedValue({
      status: "anonymous",
      accountId: null,
      access: { status: "anonymous_free", isPro: false, source: "free" },
    });
    mocks.rpc.mockResolvedValue({ data: [{ allowed: true, retry_after_seconds: 0 }], error: null });
  });

  it("permite el uso Free anónimo con una cuota distribuida ligada a una IP de confianza", async () => {
    await expect(authorizeAeroCommsVoiceRequest(request, "tts", {
      NODE_ENV: "test",
      AEROCOMMS_VOICE_RATE_LIMIT_SALT: rateLimitSalt,
    })).resolves.toMatchObject({ identity: "anonymous", isPro: false, rateLimitScope: "tts_anonymous" });

    expect(mocks.rpc).toHaveBeenCalledWith("consume_aerocomms_voice_rate_limit", {
      p_scope: "tts_anonymous",
      p_subject_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain("198.51.100.12");
  });

  it("usa identidad validada por servidor y la cuota Pro solo cuando existe entitlement", async () => {
    mocks.getAccess.mockResolvedValue({
      status: "authenticated",
      accountId: "a034aef9-293f-44f1-9990-b34ebd4e3a67",
      access: { status: "pro", isPro: true, source: "entitlement" },
    });

    await expect(authorizeAeroCommsVoiceRequest(request, "stt", {
      NODE_ENV: "production",
      AEROCOMMS_VOICE_RATE_LIMIT_SALT: rateLimitSalt,
    })).resolves.toMatchObject({ identity: "authenticated", isPro: true, rateLimitScope: "stt_pro" });

    expect(mocks.rpc).toHaveBeenCalledWith("consume_aerocomms_voice_rate_limit", expect.objectContaining({
      p_scope: "stt_pro",
    }));
  });

  it("rechaza una cuota excedida sin conceder acceso", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ allowed: false, retry_after_seconds: 321 }], error: null });

    await expect(authorizeAeroCommsVoiceRequest(request, "tts", {
      NODE_ENV: "test",
      AEROCOMMS_VOICE_RATE_LIMIT_SALT: rateLimitSalt,
    })).rejects.toMatchObject({ kind: "rate_limited", retryAfterSeconds: 321 });
  });

  it("falla cerrado cuando no puede consultar la cuota compartida o falta el secreto HMAC", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "unavailable" } });
    await expect(authorizeAeroCommsVoiceRequest(request, "tts", {
      NODE_ENV: "test",
      AEROCOMMS_VOICE_RATE_LIMIT_SALT: rateLimitSalt,
    })).rejects.toMatchObject({ kind: "unavailable" });

    await expect(authorizeAeroCommsVoiceRequest(request, "tts", { NODE_ENV: "test" }))
      .rejects.toMatchObject({ kind: "unavailable" });
  });

  it("no acepta un forwarded-for controlado por cliente para el uso anónimo en producción", () => {
    expect(getTrustedAeroCommsVoiceIp(request, { NODE_ENV: "production" })).toBeNull();
    expect(getTrustedAeroCommsVoiceIp(new Request("https://flypath.test", {
      headers: { "x-vercel-forwarded-for": "203.0.113.7" },
    }), { NODE_ENV: "production", VERCEL: "1" })).toBe("203.0.113.7");
  });

  it("rechaza solicitudes cross-origin antes de consultar acceso o cuota", async () => {
    mocks.isSameOriginRequest.mockReturnValue(false);
    await expect(authorizeAeroCommsVoiceRequest(request, "tts", {
      NODE_ENV: "test",
      AEROCOMMS_VOICE_RATE_LIMIT_SALT: rateLimitSalt,
    })).rejects.toMatchObject({ kind: "forbidden" });
    expect(mocks.getAccess).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
