import { afterEach, describe, expect, it, vi } from "vitest";

import { speakWithServerTts } from "./serverTts";

describe("AeroComms server TTS client contract", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("envía solo texto y un perfil cerrado al endpoint", async () => {
    const request = vi.fn().mockResolvedValue(new Response(new Blob(["audio"]), { status: 200 }));
    vi.stubGlobal("window", {});
    vi.stubGlobal("fetch", request);
    vi.stubGlobal("Audio", class {
      playbackRate = 1;
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      play() { this.onended?.(); return Promise.resolve(); }
      pause() {}
      removeAttribute() {}
      load() {}
    });
    vi.stubGlobal("URL", { createObjectURL: () => "blob:voice", revokeObjectURL: vi.fn() });

    await speakWithServerTts("Ready for departure", {
      profileId: "cadet-clear",
    });

    const body = JSON.parse(request.mock.calls[0]?.[1]?.body as string);
    expect(body).toEqual({ text: "Ready for departure", profileId: "cadet-clear" });
  });
});
