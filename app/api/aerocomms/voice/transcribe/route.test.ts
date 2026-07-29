import { beforeEach, describe, expect, it, vi } from "vitest";
import { AEROCOMMS_VOICE_STT_MAX_AUDIO_BYTES, AEROCOMMS_VOICE_STT_MAX_REQUEST_BYTES } from "@/lib/aerocomms/voice/voice-security";

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
    transcribeCreate: vi.fn(),
    toFile: vi.fn(),
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
    audio = { transcriptions: { create: mocks.transcribeCreate } };
  },
}));
vi.mock("openai/uploads", () => ({ toFile: mocks.toFile }));

import { POST } from "./route";

function audioRequest(audio: Blob, extras: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("audio", audio, "audio.webm");
  formData.set("language", "en");
  for (const [key, value] of Object.entries(extras)) formData.set(key, value);
  return new Request("https://flypath.test/api/aerocomms/voice/transcribe", {
    method: "POST",
    headers: { origin: "https://flypath.test" },
    body: formData,
  });
}

describe("AeroComms voice STT route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-openai-key";
    delete process.env.VOICE_STT_MODEL;
    mocks.authorize.mockResolvedValue({ identity: "anonymous", isPro: false, rateLimitScope: "stt_anonymous" });
    mocks.toFile.mockResolvedValue("openai-file");
    mocks.transcribeCreate.mockResolvedValue({ text: "Roger" });
  });

  it("autoriza audio permitido y mantiene el modelo cerrado", async () => {
    const response = await POST(audioRequest(new Blob(["audio"], { type: "audio/webm" })));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ transcript: "Roger" });
    expect(mocks.authorize).toHaveBeenCalledWith(expect.any(Request), "stt");
    expect(mocks.transcribeCreate).toHaveBeenCalledWith(expect.objectContaining({ model: "gpt-4o-mini-transcribe", language: "en" }));
  });

  it("rechaza Content-Length excesivo antes de parsear o llamar al proveedor", async () => {
    const response = await POST(new Request("https://flypath.test/api/aerocomms/voice/transcribe", {
      method: "POST",
      headers: {
        origin: "https://flypath.test",
        "content-length": String(AEROCOMMS_VOICE_STT_MAX_REQUEST_BYTES + 1),
      },
      body: "not-read",
    }));
    expect(response.status).toBe(413);
    expect(mocks.authorize).not.toHaveBeenCalled();
    expect(mocks.transcribeCreate).not.toHaveBeenCalled();
  });

  it("rechaza el archivo real excesivo aunque falte Content-Length", async () => {
    const response = await POST(audioRequest(new Blob([new Uint8Array(AEROCOMMS_VOICE_STT_MAX_AUDIO_BYTES + 1)], { type: "audio/webm" })));
    expect(response.status).toBe(413);
    expect(mocks.authorize).not.toHaveBeenCalled();
    expect(mocks.transcribeCreate).not.toHaveBeenCalled();
  });

  it("rechaza MIME no permitido y campos que intenten modificar la petición", async () => {
    const unsupported = await POST(audioRequest(new Blob(["audio"], { type: "audio/ogg" })));
    expect(unsupported.status).toBe(400);
    const prompt = await POST(audioRequest(new Blob(["audio"], { type: "audio/webm" }), { prompt: "override" }));
    expect(prompt.status).toBe(400);
    expect(mocks.authorize).not.toHaveBeenCalled();
    expect(mocks.transcribeCreate).not.toHaveBeenCalled();
  });

  it("no llama al proveedor cuando se rechaza la cuota", async () => {
    mocks.authorize.mockRejectedValue(new mocks.VoiceAccessError("rate_limited", 90));
    const response = await POST(audioRequest(new Blob(["audio"], { type: "audio/webm" })));
    expect(response.status).toBe(429);
    expect(mocks.transcribeCreate).not.toHaveBeenCalled();
  });

  it("oculta los detalles de errores del proveedor", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.transcribeCreate.mockRejectedValue({ status: 400, message: "provider sensitive error" });
    const response = await POST(audioRequest(new Blob(["audio"], { type: "audio/webm" })));
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: "Voice service is temporarily unavailable.", code: "unavailable" });
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain("provider sensitive error");
    errorLog.mockRestore();
  });
});
