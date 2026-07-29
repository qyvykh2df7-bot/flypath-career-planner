import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class VoiceAccessError extends Error {
    constructor(public kind: string, public retryAfterSeconds?: number) {
      super("voice access error");
    }
  }
  return {
    VoiceAccessError,
    authorize: vi.fn(),
    voiceAccessErrorResponse: vi.fn((error: InstanceType<typeof VoiceAccessError>) => Response.json(
      { error: "Voice request limit reached. Please try again later.", code: error.kind },
      { status: error.kind === "rate_limited" ? 429 : 403 },
    )),
    speechCreate: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  };
});

vi.mock("server-only", () => ({}));
vi.mock("@/lib/aerocomms/voice/server-access", () => ({
  AeroCommsVoiceAccessError: mocks.VoiceAccessError,
  authorizeAeroCommsVoiceRequest: mocks.authorize,
  voiceAccessErrorResponse: mocks.voiceAccessErrorResponse,
}));
vi.mock("openai", () => ({
  default: class OpenAI {
    audio = { speech: { create: mocks.speechCreate } };
  },
}));
vi.mock("node:fs/promises", () => ({
  readFile: mocks.readFile,
  writeFile: mocks.writeFile,
  mkdir: mocks.mkdir,
}));

import { POST } from "./route";

function request(body: unknown, headers: HeadersInit = {}) {
  return new Request("https://flypath.test/api/aerocomms/voice/speak", {
    method: "POST",
    headers: { origin: "https://flypath.test", "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("AeroComms voice TTS route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-openai-key";
    delete process.env.VOICE_TTS_MODEL;
    mocks.authorize.mockResolvedValue({ identity: "anonymous", isPro: false, rateLimitScope: "tts_anonymous" });
    mocks.readFile.mockRejectedValue(new Error("cache miss"));
    mocks.speechCreate.mockResolvedValue({ arrayBuffer: async () => new TextEncoder().encode("audio").buffer });
  });

  it("autoriza una solicitud válida y resuelve modelo, voz y formato solo en servidor", async () => {
    const response = await POST(request({ text: "Ready for departure", profileId: "cadet-clear" }));
    expect(response.status).toBe(200);
    expect(mocks.authorize).toHaveBeenCalledWith(expect.any(Request), "tts");
    expect(mocks.speechCreate).toHaveBeenCalledWith(expect.objectContaining({
      model: "gpt-4o-mini-tts",
      voice: "ash",
      response_format: "mp3",
      input: "Ready for departure",
    }));
  });

  it("rechaza overrides de voz/modelo/formato y no llama al proveedor", async () => {
    const response = await POST(request({
      text: "Ready for departure",
      profileId: "cadet-clear",
      voice: "nova",
      model: "attacker-model",
      format: "wav",
    }));
    expect(response.status).toBe(400);
    expect(mocks.authorize).not.toHaveBeenCalled();
    expect(mocks.speechCreate).not.toHaveBeenCalled();
  });

  it("rechaza texto excesivo antes de consultar cuota o OpenAI", async () => {
    const response = await POST(request({ text: "x".repeat(501) }));
    expect(response.status).toBe(413);
    expect(mocks.authorize).not.toHaveBeenCalled();
    expect(mocks.speechCreate).not.toHaveBeenCalled();
  });

  it("devuelve 429 estable cuando se excede la cuota y no llama al proveedor", async () => {
    mocks.authorize.mockRejectedValue(new mocks.VoiceAccessError("rate_limited", 120));
    const response = await POST(request({ text: "Ready" }));
    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({ code: "rate_limited" });
    expect(mocks.speechCreate).not.toHaveBeenCalled();
  });

  it("rechaza una solicitud no autorizada antes de llegar a OpenAI", async () => {
    mocks.authorize.mockRejectedValue(new mocks.VoiceAccessError("forbidden"));
    const response = await POST(request({ text: "Ready" }));
    expect(response.status).toBe(403);
    expect(mocks.speechCreate).not.toHaveBeenCalled();
  });

  it("no filtra el detalle de un fallo del proveedor", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.speechCreate.mockRejectedValue({ status: 429, message: "provider secret diagnostic" });
    const response = await POST(request({ text: "Ready" }));
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: "Voice service is temporarily unavailable.", code: "unavailable" });
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain("provider secret diagnostic");
    errorLog.mockRestore();
  });
});
