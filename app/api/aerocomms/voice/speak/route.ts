import OpenAI from "openai";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getTtsProfile } from "@/lib/aerocomms/voice/ttsProfiles";

// Needs the Node.js runtime (not Edge) for the OpenAI SDK and local dev cache file access.
export const runtime = "nodejs";

// Alpha safety limit — this route is for short ATC/controller/ATIS lines, never long-form text.
const MAX_TEXT_LENGTH = 500;
// Client-supplied styleInstruction override (bypassing a profile) — kept short and safe.
const MAX_STYLE_INSTRUCTION_LENGTH = 300;
const DEFAULT_MODEL = "gpt-4o-mini-tts";
const DEFAULT_CONTROLLER_VOICE = "onyx";
const DEFAULT_ATIS_VOICE = "nova";

type VoiceType = "controller" | "atis";
type AudioFormat = "mp3" | "wav";

const isDev = process.env.NODE_ENV !== "production";
// Local/dev cache only — NOT production storage. Production storage/CDN is a separate
// task planned after the FlyPath migration. Never committed (see .gitignore: .cache/).
const CACHE_DIR = path.join(process.cwd(), ".cache", "tts");

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function contentTypeFor(format: AudioFormat): string {
  return format === "wav" ? "audio/wav" : "audio/mpeg";
}

function resolveVoice(voiceType: VoiceType | undefined, voiceOverride: string | undefined): string {
  if (voiceOverride) return voiceOverride;
  if (voiceType === "atis") return process.env.VOICE_TTS_VOICE_ATIS?.trim() || DEFAULT_ATIS_VOICE;
  return process.env.VOICE_TTS_VOICE_CONTROLLER?.trim() || DEFAULT_CONTROLLER_VOICE;
}

/**
 * Hash of everything that affects the generated audio — safe, non-reversible cache key.
 * Includes the resolved styleInstruction text (not just the profileId) so that an
 * explicit styleInstruction override still produces a distinct cache entry from the
 * profile's default. Deliberately excludes noiseType/noiseVolume — those are
 * playback-only fields applied client-side and never reach OpenAI.
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
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not set — server TTS is unavailable.");
    return errorResponse("Server voice synthesis is not configured.", 500);
  }

  let body: {
    text?: unknown;
    voiceType?: unknown;
    voice?: unknown;
    format?: unknown;
    profileId?: unknown;
    styleInstruction?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.", 400);
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return errorResponse("Missing text.", 400);
  if (text.length > MAX_TEXT_LENGTH) return errorResponse("Text is too long.", 413);

  const profileId = typeof body.profileId === "string" && body.profileId.trim() ? body.profileId.trim() : undefined;
  const profile = getTtsProfile(profileId);

  const requestedVoiceType = body.voiceType === "atis" ? "atis" : body.voiceType === "controller" ? "controller" : undefined;
  const voiceType: VoiceType | undefined = requestedVoiceType ?? profile?.voiceType;
  const voiceOverride = typeof body.voice === "string" && body.voice.trim() ? body.voice.trim() : profile?.voice;
  const format: AudioFormat = body.format === "wav" ? "wav" : "mp3";

  const styleInstructionOverride =
    typeof body.styleInstruction === "string" && body.styleInstruction.trim()
      ? body.styleInstruction.trim().slice(0, MAX_STYLE_INSTRUCTION_LENGTH)
      : undefined;
  const styleInstruction = styleInstructionOverride ?? profile?.styleInstruction ?? "";

  const model = process.env.VOICE_TTS_MODEL?.trim() || DEFAULT_MODEL;
  const voice = resolveVoice(voiceType, voiceOverride);
  const cacheKey = cacheKeyFor(text, model, voice, voiceType ?? "default", format, profileId ?? "none", styleInstruction);

  // Dev-only cache lookup — avoids re-calling OpenAI for text/voice/format combos
  // already generated during local development. Disabled in production.
  const cached = await readFromCache(cacheKey, format);
  if (cached) {
    return new Response(new Uint8Array(cached), {
      headers: { "Content-Type": contentTypeFor(format), "X-TTS-Cache": "hit" },
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
      headers: { "Content-Type": contentTypeFor(format), "X-TTS-Cache": "miss" },
    });
  } catch (error) {
    // Never log the request text or the API key — only a generic failure marker.
    console.error("Voice synthesis failed:", error instanceof Error ? error.message : "unknown error");
    return errorResponse("Voice synthesis failed. Please try again.", 500);
  }
}
