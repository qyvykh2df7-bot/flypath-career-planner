import { afterEach, describe, expect, it, vi } from "vitest";

import { transcribeAudioWithServer } from "./serverStt";

describe("AeroComms server STT client contract", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("no envía prompts ni parámetros que puedan alterar la petición al proveedor", async () => {
    const request = vi.fn().mockResolvedValue(Response.json({ transcript: "Roger" }));
    vi.stubGlobal("fetch", request);
    const audio = new Blob(["audio"], { type: "audio/webm" });

    await expect(transcribeAudioWithServer(audio, { language: "en" })).resolves.toEqual({ transcript: "Roger" });
    const formData = request.mock.calls[0]?.[1]?.body as FormData;
    expect([...formData.keys()].sort()).toEqual(["audio", "language"]);
  });
});
