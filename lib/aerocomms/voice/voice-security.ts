export const AEROCOMMS_VOICE_TTS_MAX_TEXT_LENGTH = 500;
export const AEROCOMMS_VOICE_TTS_MAX_REQUEST_BYTES = 2_048;
export const AEROCOMMS_VOICE_STT_MAX_AUDIO_BYTES = 10 * 1024 * 1024;
// Multipart framing adds a small overhead beyond the audio file itself.
export const AEROCOMMS_VOICE_STT_MAX_REQUEST_BYTES = AEROCOMMS_VOICE_STT_MAX_AUDIO_BYTES + 64 * 1024;

export const AEROCOMMS_VOICE_TTS_MODELS = ["gpt-4o-mini-tts"] as const;
export const AEROCOMMS_VOICE_STT_MODELS = ["gpt-4o-mini-transcribe"] as const;
export const AEROCOMMS_VOICE_FORMAT = "mp3" as const;
export const AEROCOMMS_VOICE_ALLOWED_AUDIO_MIME_TYPES = [
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  "audio/mpeg",
  "audio/wav",
] as const;

export type AeroCommsVoiceOperation = "tts" | "stt";
export type AeroCommsVoiceRateLimitScope =
  | "tts_anonymous"
  | "tts_authenticated_free"
  | "tts_pro"
  | "stt_anonymous"
  | "stt_authenticated_free"
  | "stt_pro";

/**
 * Product quotas are deliberately conservative for anonymous Free use. They
 * preserve the public voice exercises while preventing the OpenAI server key
 * from becoming an unlimited anonymous API.
 */
export const AEROCOMMS_VOICE_RATE_LIMITS = {
  tts_anonymous: { limit: 8, windowSeconds: 10 * 60 },
  tts_authenticated_free: { limit: 30, windowSeconds: 10 * 60 },
  tts_pro: { limit: 90, windowSeconds: 10 * 60 },
  stt_anonymous: { limit: 2, windowSeconds: 60 * 60 },
  stt_authenticated_free: { limit: 8, windowSeconds: 60 * 60 },
  stt_pro: { limit: 100, windowSeconds: 60 * 60 },
} as const satisfies Record<AeroCommsVoiceRateLimitScope, { limit: number; windowSeconds: number }>;

const allowedAudioMimeTypes = new Set<string>(AEROCOMMS_VOICE_ALLOWED_AUDIO_MIME_TYPES);

export function isAllowedAeroCommsVoiceAudioMimeType(value: string): boolean {
  return allowedAudioMimeTypes.has(value.split(";", 1)[0]?.trim().toLowerCase() ?? "");
}

export function resolveAeroCommsVoiceModel(
  configured: string | undefined,
  allowed: readonly string[],
): string | null {
  const model = configured?.trim() || allowed[0];
  return model && allowed.includes(model) ? model : null;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function hasOnlyKeys(value: Record<string, unknown>, allowedKeys: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowedKeys.includes(key));
}
