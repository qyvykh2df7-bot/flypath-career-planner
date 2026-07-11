export type VoiceUiState =
  | "idle"
  | "requesting_permission"
  | "recording"
  | "processing"
  | "result"
  | "unsupported"
  | "error";

export type SttResult = {
  transcript: string;
  confidence?: number;
  alternatives?: string[];
  /**
   * Server-mode-only timing metadata (real measured values, never estimated/fake —
   * undefined for browser-mode results, where the Web Speech API doesn't expose
   * these phases separately). Used for dev-only Missions latency logging
   * (see RadioConversation.tsx's `[mission:latency]` logs) without needing to
   * duplicate VoiceRecorder's own timing instrumentation.
   */
  timing?: {
    recordingMs: number;
    transcribeMs: number;
    stopReason: "silence" | "maxDuration" | "manual";
  };
};

export type SttOptions = {
  lang?: string;
  timeoutMs?: number;
};

export type SttAdapter = {
  isSupported(): boolean;
  transcribeOnce(options?: SttOptions): Promise<SttResult>;
  cancel(): void;
};

export type TtsOptions = {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
};

export type TtsAdapter = {
  isSupported(): boolean;
  speak(text: string, options?: TtsOptions): Promise<void>;
  cancel(): void;
};

export type VoiceEvaluationInput = {
  transcript: string;
  expected: string;
  confidence?: number;
  /** Accepted alternative phrasings (normalized at call site or raw — evaluator normalizes). */
  acceptedVariants?: string[];
  /** Success feedback from the drill definition, used by phrase evaluator on correct answers. */
  drillFeedback?: string;
};

export type VoiceEvaluationResult = {
  correct: boolean;
  score: number;
  normalizedTranscript: string;
  matchedToken: string | null;
  expectedToken: string;
  feedback: string;
  lowConfidenceWarning: boolean;
};

export type BrowserSpeechRecognitionResultAlternative = {
  transcript: string;
  confidence?: number;
};

export type BrowserSpeechRecognitionResult = {
  readonly length: number;
  item(index: number): BrowserSpeechRecognitionResultAlternative;
  [index: number]: BrowserSpeechRecognitionResultAlternative;
  isFinal?: boolean;
};

export type BrowserSpeechRecognitionEvent = Event & {
  readonly resultIndex: number;
  readonly results: {
    readonly length: number;
    item(index: number): BrowserSpeechRecognitionResult;
    [index: number]: BrowserSpeechRecognitionResult;
  };
};

export type BrowserSpeechRecognitionErrorEvent = Event & {
  error?: string;
  message?: string;
};

export type BrowserSpeechRecognition = EventTarget & {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onaudioend: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onnomatch: ((event: Event) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

export type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;
