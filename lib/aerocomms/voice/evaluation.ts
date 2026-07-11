import type { VoiceEvaluationInput, VoiceEvaluationResult } from "./types";

type IcaoEntry = {
  canonical: string;
  variants: string[];
};

const ICAO_VOCABULARY: IcaoEntry[] = [
  { canonical: "alfa", variants: ["alfa", "alpha"] },
  { canonical: "bravo", variants: ["bravo"] },
  { canonical: "charlie", variants: ["charlie"] },
  { canonical: "delta", variants: ["delta"] },
  { canonical: "echo", variants: ["echo"] },
  { canonical: "foxtrot", variants: ["foxtrot", "fox trot"] },
  { canonical: "golf", variants: ["golf"] },
  { canonical: "hotel", variants: ["hotel"] },
  { canonical: "india", variants: ["india"] },
  { canonical: "juliett", variants: ["juliett", "juliet"] },
  { canonical: "kilo", variants: ["kilo"] },
  { canonical: "lima", variants: ["lima"] },
  { canonical: "mike", variants: ["mike"] },
  { canonical: "november", variants: ["november"] },
  { canonical: "oscar", variants: ["oscar"] },
  { canonical: "papa", variants: ["papa"] },
  { canonical: "quebec", variants: ["quebec"] },
  { canonical: "romeo", variants: ["romeo"] },
  { canonical: "sierra", variants: ["sierra"] },
  { canonical: "tango", variants: ["tango"] },
  { canonical: "uniform", variants: ["uniform"] },
  { canonical: "victor", variants: ["victor"] },
  { canonical: "whiskey", variants: ["whiskey", "whisky"] },
  { canonical: "xray", variants: ["x-ray", "xray", "x ray", "ex ray"] },
  { canonical: "yankee", variants: ["yankee"] },
  { canonical: "zulu", variants: ["zulu"] },
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/x\s*-\s*ray/g, "xray")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: string): string {
  return normalizeText(value).replace(/\s+/g, "");
}

function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

function canonicalFor(value: string): string | null {
  const normalized = normalizeText(value);
  const compressed = compact(value);

  for (const entry of ICAO_VOCABULARY) {
    if (entry.variants.some((variant) => normalizeText(variant) === normalized || compact(variant) === compressed)) {
      return entry.canonical;
    }
  }

  const tokens = normalized.split(" ").filter(Boolean);
  for (const token of tokens) {
    const tokenCompact = compact(token);
    const exact = ICAO_VOCABULARY.find((entry) =>
      entry.variants.some((variant) => compact(variant) === tokenCompact),
    );
    if (exact) return exact.canonical;
  }

  let best: { canonical: string; distance: number; length: number } | null = null;
  for (const entry of ICAO_VOCABULARY) {
    for (const variant of entry.variants) {
      const variantCompact = compact(variant);
      const distance = editDistance(compressed, variantCompact);
      if (!best || distance < best.distance) {
        best = { canonical: entry.canonical, distance, length: variantCompact.length };
      }
    }
  }

  if (!best) return null;
  const tolerance = best.length <= 5 ? 1 : 2;
  return best.distance <= tolerance ? best.canonical : null;
}

function displayToken(canonical: string): string {
  if (canonical === "alfa") return "Alfa";
  if (canonical === "juliett") return "Juliett";
  if (canonical === "xray") return "X-ray";
  return canonical.charAt(0).toUpperCase() + canonical.slice(1);
}

// ─── Phrase evaluator ──────────────────────────────────────────────────────────
// Used for multi-word aviation phrases (radio checks, frequencies, QNH readbacks,
// clarification phrases, etc.). Handles STT variation via accepted variants and
// key-term overlap, falling back to edit distance for near-misses.

const PHRASE_STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "with", "of", "is", "it", "do",
]);

// Standard English digit names (what STT returns for aviation digit-by-digit speech).
const DIGIT_NAMES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"] as const;
const toDigitWords = (s: string): string =>
  [...s].map((c) => DIGIT_NAMES[+c] ?? c).join(" ");

/**
 * Expands aviation number tokens in text to their spoken digit-by-digit equivalents.
 * Applied to BOTH the transcript and the expected before comparison so that
 * numeric STT output (e.g. "7700") matches the spoken expected ("seven seven zero zero").
 *
 * Rules applied in order:
 *  1. "FL120" / "fl 120"  → "flight level one two zero"
 *  2. "1,500" / "2,000"   → "1500" / "2000" (strip thousand-separator comma)
 *  3. "121.700"           → "one two one decimal seven zero zero"
 *  4. Four-digit codes    → digit by digit  (squawk, QNH, headings 1000+)
 *  5. Three-digit codes   → digit by digit  (headings 000–999)
 *  6. Two-digit codes     → digit by digit  (runway designators, e.g. "24" → "two four")
 *
 * Note: standalone altitude words like "two thousand" are NOT touched because
 * they contain no digit characters. acceptedVariants on altitude drills cover
 * the spoken ↔ display mismatch for those cases.
 */
function expandAviationNumbers(text: string): string {
  return text
    // FL120 / fl 120 → flight level one two zero
    .replace(/\bfl\s*(\d+)\b/gi, (_, d) => "flight level " + toDigitWords(d))
    // Strip thousand-separator commas: 1,500 → 1500
    .replace(/\b(\d{1,3}),(\d{3})\b/g, (_, a, b) => a + b)
    // Frequencies: 121.700 → one two one decimal seven zero zero
    .replace(/\b(\d{2,3})\.(\d{1,3})\b/g, (_, i, d) =>
      toDigitWords(i.padStart(3, "0")) + " decimal " + toDigitWords(d.padStart(3, "0")),
    )
    // Four-digit codes (squawk, QNH, times, altitudes)
    .replace(/\b(\d{4})\b/g, (_, d) => toDigitWords(d))
    // Three-digit headings / altitudes hundreds
    .replace(/\b(\d{3})\b/g, (_, d) => toDigitWords(d))
    // Two-digit codes — runway designators, headings shorthand
    .replace(/\b(\d{2})\b/g, (_, d) => toDigitWords(d));
}

/**
 * Normalises aviation pronunciation variants so that STT output using
 * standard English words ("nine", "three", "five") matches expected phrases
 * that use aviation words ("niner", "tree", "fife"), and vice versa. Also
 * unifies "point" and "decimal" since both are heard for frequency separators.
 */
function normalizeAviationPronunciation(text: string): string {
  return text
    .replace(/\bniner\b/gi, "nine")
    .replace(/\btree\b/gi, "three")
    .replace(/\bfife\b/gi, "five")
    .replace(/\bpoint\b/gi, "decimal");
}

const REGISTRATION_ICAO: Record<string, string> = {
  a: "alfa", b: "bravo", c: "charlie", d: "delta", e: "echo", f: "foxtrot", g: "golf",
  h: "hotel", i: "india", j: "juliett", k: "kilo", l: "lima", m: "mike", n: "november",
  o: "oscar", p: "papa", q: "quebec", r: "romeo", s: "sierra", t: "tango", u: "uniform",
  v: "victor", w: "whiskey", x: "xray", y: "yankee", z: "zulu",
};

/**
 * Expands hyphenated registration callsigns (e.g. "EC-ABC", "G-ABCD") into their
 * full ICAO-spelled form so the expected text matches STT transcripts where the
 * pilot spelled the registration aloud letter by letter ("echo charlie alfa bravo
 * charlie"), which is how this app teaches registrations to be spoken. Exported for
 * reuse by atcSim.ts's corrective ATC message builder, so a dynamically-generated
 * corrective line's TTS-spoken text pronounces the callsign phonetically instead of
 * reading "G-ABCD" as letters/a word.
 */
export function expandRegistrationCallsigns(text: string): string {
  return text.replace(/\b([a-z]{1,2})-([a-z]{2,5})\b/gi, (_, p1: string, p2: string) =>
    (p1 + p2)
      .toLowerCase()
      .split("")
      .map((l) => REGISTRATION_ICAO[l] ?? l)
      .join(" "),
  );
}

/**
 * Normalizes a spoken/written aviation phrase for comparison — expands numbers,
 * registration callsigns, and pronunciation variants (niner/tree/fife), then strips
 * punctuation. Exported for reuse by mission required-item checks (atcSim.ts) so
 * "Information Alpha" / "info alpha" / "G-ABCD" / "Golf Alfa Bravo Charlie Delta"
 * all normalize to the same comparable form as they do for scoring.
 */
export function normalizePhrase(text: string): string {
  const lowered = text.toLowerCase();
  const expandedNumbers = expandAviationNumbers(lowered);
  const expandedCallsigns = expandRegistrationCallsigns(expandedNumbers);
  const pronounced = normalizeAviationPronunciation(expandedCallsigns);
  return pronounced
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function phraseKeyTerms(normalized: string): string[] {
  return normalized.split(" ").filter((w) => w.length > 1 && !PHRASE_STOP_WORDS.has(w));
}

/**
 * Groups contiguous digit-word tokens (plus "decimal") in a normalized phrase into
 * blocks — one per number spoken (frequency, squawk, altitude, heading, QNH, etc).
 * These are the "critical values" of a radio call: wording around them may vary,
 * but the digits themselves must be heard correctly for the call to be correct.
 */
function numberTokenBlocks(normalized: string): string[][] {
  const isNumberWord = (w: string): boolean => (DIGIT_NAMES as readonly string[]).includes(w) || w === "decimal";
  const blocks: string[][] = [];
  let current: string[] = [];
  for (const w of normalized.split(" ").filter(Boolean)) {
    if (isNumberWord(w)) {
      current.push(w);
    } else if (current.length) {
      blocks.push(current);
      current = [];
    }
  }
  if (current.length) blocks.push(current);
  return blocks;
}

/**
 * Evaluates multi-word aviation phrases (radio checks, QNH readbacks, frequencies, etc.).
 * Accepts `input.acceptedVariants` for STT spelling variations.
 * Returns the same `VoiceEvaluationResult` shape as `evaluateSpokenAnswer`.
 */
export function evaluatePhraseAnswer(input: VoiceEvaluationInput): VoiceEvaluationResult {
  const transcriptNorm = normalizePhrase(input.transcript);
  const expectedNorm   = normalizePhrase(input.expected);

  // Build variant pool: canonical + any accepted alternatives.
  const allVariants = [
    expectedNorm,
    ...(input.acceptedVariants?.map(normalizePhrase) ?? []),
  ];

  const exactMatch = !!transcriptNorm && allVariants.some((v) => transcriptNorm === v);

  // Key-term overlap: critical words (callsign, QNH value, station, phrase) must be present.
  const expectedTerms  = phraseKeyTerms(expectedNorm);
  const transcriptSet  = new Set(phraseKeyTerms(transcriptNorm));
  const matched        = expectedTerms.filter((t) => transcriptSet.has(t));
  const overlap        = expectedTerms.length > 0 ? matched.length / expectedTerms.length : 0;

  const lowConfidenceWarning =
    typeof input.confidence === "number" && input.confidence > 0 && input.confidence < 0.55;

  let correct = false;
  let score   = 0;

  if (exactMatch) {
    correct = true;
    score   = 100;
  } else if (overlap >= 0.8) {
    // High key-term coverage — accept as correct (STT variation on minor words).
    correct = true;
    score   = Math.round(80 + overlap * 20);
  } else if (overlap >= 0.5) {
    score = Math.round(overlap * 60);
  } else if (transcriptNorm) {
    // Last resort: edit distance on compacted strings.
    const tC = transcriptNorm.replace(/\s/g, "");
    const eC = expectedNorm.replace(/\s/g, "");
    const d  = editDistance(tC, eC);
    const ratio = 1 - d / Math.max(tC.length, eC.length, 1);
    score = ratio >= 0.8 ? 40 : ratio >= 0.6 ? 20 : 0;
  }

  // Critical-value gate: wording around a number can vary, but the digits
  // themselves (frequency, squawk, altitude, heading, QNH, callsign number...)
  // must be heard correctly. A high key-term overlap must not paper over a
  // wrong or missing number.
  if (!exactMatch) {
    const criticalBlocks = numberTokenBlocks(expectedNorm);
    const numbersOk = criticalBlocks.every((block) => transcriptNorm.includes(block.join(" ")));
    if (criticalBlocks.length > 0 && !numbersOk) {
      correct = false;
      score = Math.min(score, 55);
    }
  }

  const successFeedback = input.drillFeedback ?? `Good. "${input.expected}"`;
  const failFeedback = transcriptNorm
    ? `You said "${input.transcript}". Expected: "${input.expected}". Try again.`
    : `No speech detected. Expected: "${input.expected}".`;

  return {
    correct,
    score,
    normalizedTranscript: transcriptNorm,
    matchedToken: correct ? input.expected : null,
    expectedToken: input.expected,
    feedback: correct ? successFeedback : failFeedback,
    lowConfidenceWarning,
  };
}

// ─── Letter evaluator (existing — unchanged) ───────────────────────────────────
export function evaluateSpokenAnswer(input: VoiceEvaluationInput): VoiceEvaluationResult {
  const normalizedTranscript = normalizeText(input.transcript);
  const expectedToken = canonicalFor(input.expected) ?? compact(input.expected);
  const matchedToken = canonicalFor(input.transcript);
  const lowConfidenceWarning = typeof input.confidence === "number" && input.confidence > 0 && input.confidence < 0.55;
  const correct = !!matchedToken && matchedToken === expectedToken;

  let score = 0;
  if (correct) {
    score = 100;
  } else if (!normalizedTranscript) {
    score = 0;
  } else if (matchedToken) {
    score = 20;
  } else {
    const distance = editDistance(compact(input.transcript), expectedToken);
    score = distance <= 2 ? 60 : 0;
  }

  const expectedDisplay = displayToken(expectedToken);
  const matchedDisplay = matchedToken ? displayToken(matchedToken) : null;

  return {
    correct,
    score,
    normalizedTranscript,
    matchedToken: matchedDisplay,
    expectedToken: expectedDisplay,
    feedback: correct
      ? `Correct. ${expectedDisplay} is the ICAO word.`
      : matchedDisplay
        ? `You said ${matchedDisplay}. The expected word was ${expectedDisplay}.`
        : `I could not match that to ${expectedDisplay}. Try saying the ICAO word clearly.`,
    lowConfidenceWarning,
  };
}
