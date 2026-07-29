import OpenAI from "openai";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getTtsProfile } from "@/lib/aerocomms/voice/ttsProfiles";
import {
  AEROCOMMS_VOICE_FORMAT,
  AEROCOMMS_VOICE_TTS_MAX_REQUEST_BYTES,
  AEROCOMMS_VOICE_TTS_MAX_TEXT_LENGTH,
  AEROCOMMS_VOICE_TTS_MODELS,
  hasOnlyKeys,
  isRecord,
  resolveAeroCommsVoiceModel,
} from "@/lib/aerocomms/voice/voice-security";
import {
  AeroCommsVoiceAccessError,
  authorizeAeroCommsVoiceRequest,
  voiceAccessErrorResponse,
} from "@/lib/aerocomms/voice/server-access";
import {
  readJsonBodyWithinLimit,
  RequestBodyTooLargeError,
} from "@/lib/tracking/server";

// Needs the Node.js runtime (not Edge) for the OpenAI SDK and local dev cache file access.
export const runtime = "nodejs";

const DEFAULT_PROFILE_ID = "standard-atc";
const ALLOWED_TTS_VOICES = new Set(["ash", "nova"]);
type AudioFormat = typeof AEROCOMMS_VOICE_FORMAT;

const isDev = process.env.NODE_ENV !== "production";
// Local/dev cache only — NOT production storage. Production storage/CDN is a separate
// task planned after the FlyPath migration. Never committed (see .gitignore: .cache/).
const CACHE_DIR = path.join(process.cwd(), ".cache", "tts");

function errorResponse(message: string, status: number, code: "invalid_request" | "unavailable" = "invalid_request") {
  return Response.json({ error: message, code }, { status });
}

function contentTypeFor(): string {
  return "audio/mpeg";
}

/**
 * Hash of everything that affects the generated audio — safe, non-reversible cache key.
 * Includes the resolved profile fields (not just the profile ID). Deliberately
 * excludes noiseType/noiseVolume — those are playback-only fields applied
 * client-side and never reach OpenAI.
 */
function cacheKeyFor(
  text: string,
  model: string,
  voice: string,
  voiceType: string,
  format: string,
  profileId: string,
  styleInstruction: string,
): string {
  return createHash("sha256")
    .update(`${model}::${voice}::${voiceType}::${format}::${profileId}::${styleInstruction}::${text}`)
    .digest("hex");
}

async function readFromCache(key: string, format: AudioFormat): Promise<Buffer | null> {
  if (!isDev) return null;
  try {
    return await readFile(path.join(CACHE_DIR, `${key}.${format}`));
  } catch {
    return null;
  }
}

async function writeToCache(key: string, format: AudioFormat, data: Buffer): Promise<void> {
  if (!isDev) return;
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(path.join(CACHE_DIR, `${key}.${format}`), data);
  } catch (error) {
    console.error("Failed to write TTS dev cache:", error instanceof Error ? error.message : "unknown error");
  }
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return errorResponse("Invalid voice request.", 400);
  }

  let body: unknown;
  try {
    body = await readJsonBodyWithinLimit(request, AEROCOMMS_VOICE_TTS_MAX_REQUEST_BYTES);
  } catch (error) {
    return errorResponse("Invalid voice request.", error instanceof RequestBodyTooLargeError ? 413 : 400);
  }

  if (!isRecord(body) || !hasOnlyKeys(body, ["text", "profileId"])) {
    return errorResponse("Invalid voice request.", 400);
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return errorResponse("Invalid voice request.", 400);
  if (text.length > AEROCOMMS_VOICE_TTS_MAX_TEXT_LENGTH) return errorResponse("Voice text is too long.", 413);

  if (body.profileId !== undefined && (typeof body.profileId !== "string" || !body.profileId.trim())) {
    return errorResponse("Invalid voice request.", 400);
  }
  const profileId = typeof body.profileId === "string" ? body.profileId.trim() : DEFAULT_PROFILE_ID;
  if (profileId.length > 80) return errorResponse("Invalid voice request.", 400);
  const profile = getTtsProfile(profileId);
  if (!profile || !ALLOWED_TTS_VOICES.has(profile.voice)) return errorResponse("Invalid voice request.", 400);

  const apiKey = process.env.OPENAI_API_KEY;
  const model = resolveAeroCommsVoiceModel(process.env.VOICE_TTS_MODEL, AEROCOMMS_VOICE_TTS_MODELS);
  if (!apiKey || !model) {
    console.error("[FlyPath] AeroComms voice unavailable: tts_configuration.");
    return errorResponse("Voice service is temporarily unavailable.", 503, "unavailable");
  }

  try {
    await authorizeAeroCommsVoiceRequest(request, "tts");
  } catch (error) {
    if (error instanceof AeroCommsVoiceAccessError) return voiceAccessErrorResponse(error);
    return errorResponse("Voice service is temporarily unavailable.", 503, "unavailable");
  }

  const format: AudioFormat = AEROCOMMS_VOICE_FORMAT;
  const voice = profile.voice;
  const styleInstruction = profile.styleInstruction;
  const cacheKey = cacheKeyFor(text, model, voice, profile.voiceType, format, profileId, styleInstruction);

  // Dev-only cache lookup — avoids re-calling OpenAI for text/voice/format combos
  // already generated during local development. Disabled in production.
  const cached = await readFromCache(cacheKey, format);
  if (cached) {
    return new Response(new Uint8Array(cached), {
      headers: { "Content-Type": contentTypeFor(), "X-TTS-Cache": "hit" },
    });
  }

  try {
    const client = new OpenAI({ apiKey });
    const speech = await client.audio.speech.create({
      model,
      voice,
      input: text,
      response_format: format,
      // instructions only affects gpt-4o-mini-tts-family models — harmless no-op on tts-1/tts-1-hd.
      ...(styleInstruction ? { instructions: styleInstruction } : {}),
    });

    const buffer = Buffer.from(await speech.arrayBuffer());
    await writeToCache(cacheKey, format, buffer);

    return new Response(new Uint8Array(buffer), {
      headers: { "Content-Type": contentTypeFor(), "X-TTS-Cache": "miss" },
    });
  } catch (error) {
    const providerStatus = typeof error === "object" && error !== null && "status" in error &&
      typeof (error as { status?: unknown }).status === "number"
      ? (error as { status: number }).status
      : "unknown";
    console.error("[FlyPath] AeroComms voice provider failure.", {
      code: "tts_provider_failure",
      operation: "tts",
      providerStatus,
    });
    return errorResponse("Voice service is temporarily unavailable.", 502, "unavailable");
  }
}
