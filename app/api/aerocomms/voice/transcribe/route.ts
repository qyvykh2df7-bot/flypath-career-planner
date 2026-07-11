import OpenAI from "openai";
import { toFile } from "openai/uploads";

// Needs the Node.js runtime (not Edge) for the OpenAI SDK's multipart upload support.
export const runtime = "nodejs";

// Alpha safety limit — long readbacks/scenario turns are a few seconds of audio, never this large.
const MAX_AUDIO_BYTES = 15 * 1024 * 1024; // 15 MB
const DEFAULT_MODEL = "gpt-4o-mini-transcribe";

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/** ISO-639-1 only — strips region subtags like "en-GB" -> "en" for the transcription API. */
function toIsoLanguage(language: string | null): string | undefined {
  if (!language) return undefined;
  const code = language.split("-")[0]?.trim().toLowerCase();
  return code || undefined;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not set — server STT is unavailable.");
    return errorResponse("Server transcription is not configured.", 500);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Invalid request body.", 400);
  }

  const audio = formData.get("audio");
  if (!audio || !(audio instanceof Blob) || audio.size === 0) {
    return errorResponse("Missing audio.", 400);
  }

  if (audio.size > MAX_AUDIO_BYTES) {
    return errorResponse("Audio file is too large.", 413);
  }

  const languageField = formData.get("language");
  const promptField = formData.get("prompt");
  const language = toIsoLanguage(typeof languageField === "string" ? languageField : null);
  const prompt = typeof promptField === "string" && promptField.trim() ? promptField.trim() : undefined;

  const model = process.env.VOICE_STT_MODEL?.trim() || DEFAULT_MODEL;

  try {
    const client = new OpenAI({ apiKey });
    const filename = audio instanceof File && audio.name ? audio.name : "audio.webm";
    const file = await toFile(audio, filename, { type: audio.type || "audio/webm" });

    const transcription = await client.audio.transcriptions.create({
      file,
      model,
      language,
      prompt,
    });

    const transcript = (transcription.text ?? "").trim();
    return Response.json({ transcript });
  } catch (error) {
    console.error("Voice transcription failed:", error);
    return errorResponse("Transcription failed. Please try again.", 500);
  }
}
