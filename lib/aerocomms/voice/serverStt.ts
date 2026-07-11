export type ServerSttOptions = {
  /** ISO-639-1 language hint, e.g. "en". Optional. */
  language?: string;
  /**
   * Optional generic domain context passed to the transcription model to bias
   * vocabulary (e.g. aviation phraseology terms). Never pass the literal expected
   * answer here — the backend only transcribes, it must not be nudged toward
   * "hearing" a specific correct answer.
   */
  prompt?: string;
};

export type ServerSttResult = {
  transcript: string;
};

/**
 * Sends a recorded audio Blob to the server transcription route and returns the
 * transcript. Does not evaluate the transcript and does not store the audio —
 * evaluation stays entirely client-side via evaluateSpokenAnswer/evaluatePhraseAnswer.
 */
export async function transcribeAudioWithServer(
  audioBlob: Blob,
  options: ServerSttOptions = {},
): Promise<ServerSttResult> {
  const filename = audioBlob.type.includes("mp4")
    ? "audio.mp4"
    : audioBlob.type.includes("webm")
      ? "audio.webm"
      : audioBlob.type.includes("aac")
        ? "audio.aac"
        : "audio.dat";

  const formData = new FormData();
  formData.append("audio", audioBlob, filename);
  if (options.language) formData.append("language", options.language);
  if (options.prompt) formData.append("prompt", options.prompt);

  let response: Response;
  try {
    response = await fetch("/api/aerocomms/voice/transcribe", { method: "POST", body: formData });
  } catch {
    throw new Error("Could not reach the transcription service. Check your connection and try again.");
  }

  if (!response.ok) {
    let message = "Transcription failed. Please try again.";
    try {
      const data: unknown = await response.json();
      if (data && typeof data === "object" && "error" in data && typeof (data as { error?: unknown }).error === "string") {
        message = (data as { error: string }).error;
      }
    } catch {
      // ignore parse errors — fall back to the default message
    }
    throw new Error(message);
  }

  let data: { transcript?: string };
  try {
    data = await response.json();
  } catch {
    throw new Error("Received an invalid response from the transcription service.");
  }

  return { transcript: (data.transcript ?? "").trim() };
}
