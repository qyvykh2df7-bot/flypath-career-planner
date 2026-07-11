import type {
  BrowserSpeechRecognition,
  BrowserSpeechRecognitionConstructor,
  BrowserSpeechRecognitionEvent,
  SttAdapter,
  SttOptions,
  SttResult,
} from "./types";

type SpeechWindow = Window & {
  SpeechRecognition?: BrowserSpeechRecognitionConstructor;
  webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
};

function getRecognitionConstructor(): BrowserSpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as SpeechWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

export class BrowserSttAdapter implements SttAdapter {
  private recognition: BrowserSpeechRecognition | null = null;

  isSupported(): boolean {
    return getRecognitionConstructor() !== null;
  }

  transcribeOnce(options: SttOptions = {}): Promise<SttResult> {
    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      return Promise.reject(new Error("Voice recognition is not supported in this browser yet."));
    }

    this.cancel();

    return new Promise((resolve, reject) => {
      const recognition = new Recognition();
      let settled = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        if (timeoutId) clearTimeout(timeoutId);
        fn();
      };

      recognition.lang = options.lang ?? "en-GB";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;

      recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
        const result = event.results[event.resultIndex] ?? event.results[0];
        const primary = result?.[0];
        const alternatives: string[] = [];
        if (result) {
          for (let i = 0; i < result.length; i++) {
            const alt = result[i]?.transcript?.trim();
            if (alt) alternatives.push(alt);
          }
        }
        settle(() => {
          this.recognition = null;
          resolve({
            transcript: primary?.transcript?.trim() ?? "",
            confidence: primary?.confidence,
            alternatives,
          });
        });
      };

      recognition.onnomatch = () => {
        settle(() => {
          this.recognition = null;
          resolve({ transcript: "", confidence: 0, alternatives: [] });
        });
      };

      recognition.onerror = (event) => {
        settle(() => {
          this.recognition = null;
          reject(new Error(event.message || event.error || "Voice recognition failed."));
        });
      };

      recognition.onend = () => {
        if (!settled) {
          settle(() => {
            this.recognition = null;
            resolve({ transcript: "", confidence: 0, alternatives: [] });
          });
        }
      };

      timeoutId = setTimeout(() => {
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      }, options.timeoutMs ?? 6500);

      this.recognition = recognition;

      try {
        recognition.start();
      } catch (error) {
        settle(() => {
          this.recognition = null;
          reject(error instanceof Error ? error : new Error("Voice recognition could not start."));
        });
      }
    });
  }

  cancel(): void {
    try {
      this.recognition?.abort();
    } catch {
      // ignore stale recognition sessions
    } finally {
      this.recognition = null;
    }
  }
}
