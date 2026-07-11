import type { TtsAdapter, TtsOptions } from "./types";

export class BrowserTtsAdapter implements TtsAdapter {
  isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  }

  speak(text: string, options: TtsOptions = {}): Promise<void> {
    if (!this.isSupported() || !text.trim()) return Promise.resolve();

    return new Promise((resolve) => {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = options.lang ?? "en-GB";
        utterance.rate = options.rate ?? 0.9;
        utterance.pitch = options.pitch ?? 0.75;
        utterance.volume = options.volume ?? 1;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      } catch {
        resolve();
      }
    });
  }

  cancel(): void {
    try {
      if (this.isSupported()) window.speechSynthesis.cancel();
    } catch {
      // ignore unavailable browser speech APIs
    }
  }
}
