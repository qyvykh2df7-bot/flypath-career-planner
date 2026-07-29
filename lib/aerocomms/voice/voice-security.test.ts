import { describe, expect, it } from "vitest";

import {
  AEROCOMMS_VOICE_RATE_LIMITS,
  isAllowedAeroCommsVoiceAudioMimeType,
  resolveAeroCommsVoiceModel,
} from "./voice-security";

describe("AeroComms voice security contract", () => {
  it("mantiene cuotas distintas para TTS y STT", () => {
    expect(AEROCOMMS_VOICE_RATE_LIMITS.tts_anonymous).not.toEqual(AEROCOMMS_VOICE_RATE_LIMITS.stt_anonymous);
    expect(AEROCOMMS_VOICE_RATE_LIMITS.tts_pro.limit).toBeGreaterThan(AEROCOMMS_VOICE_RATE_LIMITS.tts_authenticated_free.limit);
    expect(AEROCOMMS_VOICE_RATE_LIMITS.stt_anonymous).toEqual({ limit: 2, windowSeconds: 60 * 60 });
    expect(AEROCOMMS_VOICE_RATE_LIMITS.stt_authenticated_free).toEqual({ limit: 8, windowSeconds: 60 * 60 });
    expect(AEROCOMMS_VOICE_RATE_LIMITS.stt_pro).toEqual({ limit: 100, windowSeconds: 60 * 60 });
  });

  it("acepta exclusivamente MIME de grabación compatibles y modelos cerrados", () => {
    expect(isAllowedAeroCommsVoiceAudioMimeType("audio/webm;codecs=opus")).toBe(true);
    expect(isAllowedAeroCommsVoiceAudioMimeType("application/octet-stream")).toBe(false);
    expect(resolveAeroCommsVoiceModel("gpt-4o-mini-tts", ["gpt-4o-mini-tts"])).toBe("gpt-4o-mini-tts");
    expect(resolveAeroCommsVoiceModel("attacker-selected-model", ["gpt-4o-mini-tts"])).toBeNull();
  });
});
