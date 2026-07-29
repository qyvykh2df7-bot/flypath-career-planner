import OpenAI from "openai";
import { toFile } from "openai/uploads";
import {
  AEROCOMMS_VOICE_STT_MAX_AUDIO_BYTES,
  AEROCOMMS_VOICE_STT_MAX_REQUEST_BYTES,
  AEROCOMMS_VOICE_STT_MODELS,
  isAllowedAeroCommsVoiceAudioMimeType,
  resolveAeroCommsVoiceModel,
} from "@/lib/aerocomms/voice/voice-security";
import {
  AeroCommsVoiceAccessError,
  authorizeAeroCommsVoiceRequest,
  voiceAccessErrorResponse,
} from "@/lib/aerocomms/voice/server-access";

// Needs the Node.js runtime (not Edge) for the OpenAI SDK's multipart upload support.
export const runtime = "nodejs";

function errorResponse(message: string, status: number, code: "invalid_request" | "unavailable" = "invalid_request") {
  return Response.json({ error: message, code }, { status });
}

/** ISO-639-1 only — strips region subtags like "en-GB" -> "en" for the transcription API. */
function toIsoLanguage(language: string | null): string | undefined {
  if (!language) return undefined;
  const code = language.split("-")[0]?.trim().toLowerCase();
  return code || undefined;
}

export async function POST(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const declaredBytes = Number(contentLength);
    if (!Number.isFinite(declaredBytes) || declaredBytes < 0) return errorResponse("Invalid voice request.", 400);
    if (declaredBytes > AEROCOMMS_VOICE_STT_MAX_REQUEST_BYTES) {
      return errorResponse("Audio file is too large.", 413);
    }
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Invalid request body.", 400);
  }

  const allowedFields = new Set(["audio", "language"]);
  if ([...formData.keys()].some((key) => !allowedFields.has(key)) || formData.getAll("audio").length !== 1 || formData.getAll("language").length > 1) {
    return errorResponse("Invalid voice request.", 400);
  }

  const audio = formData.get("audio");
  if (!audio || !(audio instanceof Blob) || audio.size === 0) {
    return errorResponse("Missing audio.", 400);
  }

  if (audio.size > AEROCOMMS_VOICE_STT_MAX_AUDIO_BYTES) {
    return errorResponse("Audio file is too large.", 413);
  }
  if (!isAllowedAeroCommsVoiceAudioMimeType(audio.type)) return errorResponse("Unsupported audio format.", 400);

  const languageField = formData.get("language");
  const language = toIsoLanguage(typeof languageField === "string" ? languageField : null);
  if (language !== undefined && language !== "en") return errorResponse("Invalid voice request.", 400);

  const apiKey = process.env.OPENAI_API_KEY;
  const model = resolveAeroCommsVoiceModel(process.env.VOICE_STT_MODEL, AEROCOMMS_VOICE_STT_MODELS);
  if (!apiKey || !model) {
    console.error("[FlyPath] AeroComms voice unavailable: stt_configuration.");
    return errorResponse("Voice service is temporarily unavailable.", 503, "unavailable");
  }

  try {
    await authorizeAeroCommsVoiceRequest(request, "stt");
  } catch (error) {
    if (error instanceof AeroCommsVoiceAccessError) return voiceAccessErrorResponse(error);
    return errorResponse("Voice service is temporarily unavailable.", 503, "unavailable");
  }

  try {
    const client = new OpenAI({ apiKey });
    const filename = audio instanceof File && audio.name ? audio.name : "audio.webm";
    const file = await toFile(audio, filename, { type: audio.type || "audio/webm" });

    const transcription = await client.audio.transcriptions.create({
      file,
      model,
      language,
    });

    const transcript = (transcription.text ?? "").trim();
    return Response.json({ transcript });
  } catch (error) {
    const providerStatus = typeof error === "object" && error !== null && "status" in error &&
      typeof (error as { status?: unknown }).status === "number"
      ? (error as { status: number }).status
      : "unknown";
    console.error("[FlyPath] AeroComms voice provider failure.", {
      code: "stt_provider_failure",
      operation: "stt",
      providerStatus,
    });
    return errorResponse("Voice service is temporarily unavailable.", 502, "unavailable");
  }
}
