/**
 * Shared radio phraseology utilities for AeroComms.
 *
 * Conventions match existing content in:
 * - app/lib/atcSim.ts (display + spoken pairs)
 * - app/lib/cadetBank.ts (ICAO alphabet, frequency examples)
 * - docs/AeroComms_ICAO_Radiotelephony_Reference.md
 *
 * ICAO spellings use "Alfa" (not "Alpha"). Frequencies use "decimal" (not "point").
 */

/* ------------------------------------------------------------------ */
/* ICAO alphabet — mirrors cadetBank.ts ICAO_LETTERS                   */
/* ------------------------------------------------------------------ */

export const ICAO_LETTERS: ReadonlyArray<readonly [string, string]> = [
  ["A", "Alfa"],
  ["B", "Bravo"],
  ["C", "Charlie"],
  ["D", "Delta"],
  ["E", "Echo"],
  ["F", "Foxtrot"],
  ["G", "Golf"],
  ["H", "Hotel"],
  ["I", "India"],
  ["J", "Juliett"],
  ["K", "Kilo"],
  ["L", "Lima"],
  ["M", "Mike"],
  ["N", "November"],
  ["O", "Oscar"],
  ["P", "Papa"],
  ["Q", "Quebec"],
  ["R", "Romeo"],
  ["S", "Sierra"],
  ["T", "Tango"],
  ["U", "Uniform"],
  ["V", "Victor"],
  ["W", "Whiskey"],
  ["X", "X-ray"],
  ["Y", "Yankee"],
  ["Z", "Zulu"],
] as const;

const LETTER_TO_ICAO = new Map<string, string>(
  ICAO_LETTERS.map(([letter, word]) => [letter, word]),
);

/** Accept common misspellings users may type when matching phonetic input. */
const ICAO_WORD_ALIASES: Readonly<Record<string, string>> = {
  alpha: "alfa",
  juliet: "juliett",
};

/** Aviation digit pronunciation — mirrors cadetBank / session/page.tsx. */
const DIGIT_SPOKEN: Readonly<Record<string, string>> = {
  "0": "zero",
  "1": "one",
  "2": "two",
  "3": "tree",
  "4": "four",
  "5": "fife",
  "6": "six",
  "7": "seven",
  "8": "eight",
  "9": "niner",
};

const SPOKEN_TO_DIGIT: Readonly<Record<string, string>> = {
  zero: "0",
  one: "1",
  two: "2",
  tree: "3",
  three: "3",
  four: "4",
  fife: "5",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  ait: "8",
  niner: "9",
  nine: "9",
};

/* ------------------------------------------------------------------ */
/* Normalisation                                                       */
/* ------------------------------------------------------------------ */

/** Normalise radio text for comparison — lowercase, strip punctuation, collapse space. */
export function normalizeRadioText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\balpha\b/g, "alfa")
    .replace(/\bjuliet\b/g, "juliett")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Compact alphanumeric key for a callsign: "G-LOFT" → "gloft". */
export function callsignCompact(callsign: string): string {
  return callsign.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/* ------------------------------------------------------------------ */
/* Callsign formatting / spoken                                        */
/* ------------------------------------------------------------------ */

/** Spell a single letter or digit for radio (registration-style callsigns). */
function spellCallsignChar(ch: string): string {
  if (/[0-9]/.test(ch)) return DIGIT_SPOKEN[ch] ?? ch;
  const word = LETTER_TO_ICAO.get(ch.toUpperCase());
  return word ?? ch;
}

/**
 * Registration callsign → ICAO spoken form.
 * G-LOFT → Golf Lima Oscar Foxtrot Tango
 * EI-DOC → Echo India Delta Oscar Charlie
 */
export function registrationCallsignToSpoken(callsign: string): string {
  const chars = callsign.replace(/[-\s]/g, "").split("");
  return chars.map(spellCallsignChar).join(" ");
}

/**
 * Callsign → spoken form.
 * Registration (G-ABCD, EI-DOC): ICAO letter-by-letter.
 * Airline (SHAMROCK 21): name + digit-by-digit number (matches atcSim spoken style).
 */
export function callsignToSpoken(callsign: string): string {
  if (/^[A-Z]{1,2}-[A-Z0-9]+$/i.test(callsign.trim())) {
    return registrationCallsignToSpoken(callsign);
  }

  const airlineMatch = callsign.trim().match(/^([A-Za-z]+)\s+(\d+)$/);
  if (airlineMatch) {
    const name = airlineMatch[1].charAt(0).toUpperCase() + airlineMatch[1].slice(1).toLowerCase();
    const digits = airlineMatch[2]
      .split("")
      .map((d) => DIGIT_SPOKEN[d] ?? d)
      .join(" ");
    return `${name} ${digits}`;
  }

  return registrationCallsignToSpoken(callsign);
}

/** ICAO spoken words for a registration callsign (lowercase), for matching. */
export function callsignSpokenWords(callsign: string): string[] {
  return callsignToSpoken(callsign)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Returns true if pilot input contains the assigned callsign.
 * Accepts display form (G-LOFT), compact form (gloft), and ICAO phonetic spelling.
 */
export function pilotHasCallsign(input: string, callsign: string): boolean {
  const norm = normalizeRadioText(input);
  const compact = callsignCompact(callsign);

  if (norm.replace(/\s/g, "").includes(compact)) return true;

  const spaced = compact.split("").join(" ");
  if (norm.includes(spaced)) return true;

  if (norm.includes(normalizeRadioText(callsign))) return true;

  const words = callsignSpokenWords(callsign);
  if (words.length > 0 && words.every((w) => norm.includes(ICAO_WORD_ALIASES[w] ?? w))) {
    return true;
  }

  return false;
}

/**
 * Returns true if input appears to contain a DIFFERENT callsign than the one
 * assigned. Deliberately conservative to avoid mistaking ordinary words
 * ("five", "taxi", "radio") for registrations:
 *  - hyphenated registrations in the raw input (G-ZZZZ, EI-XYZ), or
 *  - mixed letter+digit tokens (airline/US style: SHAMROCK21, N123AB).
 * Pure-letter dictionary words are never treated as callsigns.
 */
export function pilotHasWrongCallsign(input: string, callsign: string): boolean {
  if (pilotHasCallsign(input, callsign)) return false;

  const own = callsignCompact(callsign);

  // Hyphenated registration tokens in the raw input: G-ZZZZ, EI-DOC, EC-MFS
  const hyphenated = input.match(/\b[a-z]{1,2}-[a-z0-9]{2,4}\b/gi) ?? [];
  if (hyphenated.some((h) => callsignCompact(h) !== own)) return true;

  // Mixed letter+digit tokens (airline number / US registration style)
  const norm = normalizeRadioText(input);
  const mixed = norm.match(/\b[a-z]{0,4}\d{1,4}[a-z]{0,3}\b/g) ?? [];
  if (
    mixed.some(
      (t) => /[a-z]/.test(t) && /\d/.test(t) && callsignCompact(t) !== own
    )
  ) {
    return true;
  }

  return false;
}

/* ------------------------------------------------------------------ */
/* Frequency formatting / spoken / matching                            */
/* ------------------------------------------------------------------ */

type ParsedFrequency = { integer: string; decimal: string };

function parseFrequency(freq: string): ParsedFrequency {
  const cleaned = freq.trim().replace(/[^\d.]/g, "");
  const [intPart = "", decPart = ""] = cleaned.split(".");
  return {
    integer: intPart,
    decimal: (decPart + "000").slice(0, 3),
  };
}

/** Display frequency with three decimal places — matches atcSim display (118.100, 121.705). */
export function formatFrequencyDisplay(freq: string): string {
  const { integer, decimal } = parseFrequency(freq);
  return `${integer}.${decimal}`;
}

/** Digit-only comparison key — 118.1 and 118.100 both → "118100". */
export function frequencyDigitKey(freq: string): string {
  const { integer, decimal } = parseFrequency(freq);
  return `${integer}${decimal}`;
}

/** Decimal portion → spoken digit words (handles .100, .750, .705 per ICAO rules). */
function decimalPartToSpoken(decPart: string): string {
  const d = decPart.padEnd(3, "0").slice(0, 3);
  let end = d.length;

  while (end > 1 && d[end - 1] === "0") {
    // Keep final zero for X50-style channel identifiers (e.g. 121.750).
    if (end === 3 && d[1] === "5" && d[2] === "0") break;
    end--;
  }

  const significant = d.slice(0, end);
  if (significant === "" || /^0+$/.test(significant)) {
    return DIGIT_SPOKEN["0"];
  }

  return significant
    .split("")
    .map((c) => DIGIT_SPOKEN[c] ?? c)
    .join(" ");
}

/**
 * Numeric frequency → spoken form.
 * 118.100 → one one eight decimal one
 * 121.705 → one two one decimal seven zero five
 */
export function frequencyToSpoken(freq: string): string {
  const { integer, decimal } = parseFrequency(formatFrequencyDisplay(freq));
  const intSpoken = integer
    .split("")
    .map((d) => DIGIT_SPOKEN[d] ?? d)
    .join(" ");
  const decSpoken = decimalPartToSpoken(decimal);
  return `${intSpoken} decimal ${decSpoken}`;
}

/** Expand spoken digit words and "decimal"/"point" to digits for frequency matching. */
function expandSpokenFrequencyDigits(norm: string): string {
  let result = ` ${norm} `;
  for (const [word, digit] of Object.entries(SPOKEN_TO_DIGIT)) {
    result = result.replace(new RegExp(`\\b${word}\\b`, "g"), ` ${digit} `);
  }
  result = result.replace(/\bdecimal\b/g, " ").replace(/\bpoint\b/g, " ");
  return result.replace(/\s+/g, "");
}

/**
 * Returns true if pilot input contains the given frequency.
 * Accepts display (118.100), shortened (118.1), and spoken (one one eight decimal one).
 */
export function pilotHasFrequency(input: string, freq: string): boolean {
  const norm = normalizeRadioText(input);
  const targetKey = frequencyDigitKey(freq);
  const display = formatFrequencyDisplay(freq);

  const compact = norm.replace(/\s/g, "").replace(/\./g, "");
  if (compact.includes(targetKey)) return true;

  if (norm.includes(display)) return true;

  // Numeric frequency in original input (118.100, 118.1, 121.705)
  const numericFreqMatch = input.match(/\b1[012]\d(?:\.\d{1,3})?\b/);
  if (numericFreqMatch && frequencyDigitKey(numericFreqMatch[0]) === targetKey) return true;

  // Shorter display without trailing decimal zeros (118.1)
  const shortDisplay = display.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  if (shortDisplay !== display && norm.includes(shortDisplay)) return true;

  const spoken = frequencyToSpoken(freq);
  if (norm.includes(normalizeRadioText(spoken))) return true;

  const expanded = expandSpokenFrequencyDigits(norm);
  if (expanded.includes(targetKey)) return true;

  return false;
}

/** True when input mentions a VHF frequency that is not the expected one. */
export function pilotMentionedWrongFrequency(input: string, correctFreq: string): boolean {
  if (pilotHasFrequency(input, correctFreq)) return false;

  const norm = normalizeRadioText(input);
  const expanded = expandSpokenFrequencyDigits(norm);

  if (/\b1[012]\d{2,5}\b/.test(expanded.replace(/\s/g, ""))) return true;
  if (/\bdecimal\b/.test(norm) || /\bpoint\b/.test(norm)) return true;

  return false;
}

/* ------------------------------------------------------------------ */
/* QNH helpers (digit-by-digit, matches atcSim spoken style)         */
/* ------------------------------------------------------------------ */

export function qnhToSpoken(qnh: number): string {
  return String(qnh)
    .split("")
    .map((d) => DIGIT_SPOKEN[d] ?? d)
    .join(" ");
}

/** Returns true if pilot input contains the correct QNH value. */
export function pilotHasQnh(input: string, qnh: number): boolean {
  const norm = normalizeRadioText(input);
  const qnhStr = String(qnh);

  const digits = (norm.match(/\d{3,4}/g) ?? []).map((n) => n);
  if (digits.includes(qnhStr)) return true;

  const spoken = qnhToSpoken(qnh);
  if (norm.includes(normalizeRadioText(spoken))) return true;

  const expanded = expandSpokenFrequencyDigits(norm);
  return expanded.includes(qnhStr);
}

/** True when a QNH-like value is present but wrong. */
export function pilotMentionedWrongQnh(input: string, qnh: number): boolean {
  if (pilotHasQnh(input, qnh)) return false;
  const norm = normalizeRadioText(input);
  return (norm.match(/\b10\d{2}\b/g) ?? []).some((n) => n !== String(qnh));
}

/* ------------------------------------------------------------------ */
/* Display → spoken (for TTS — matches atcSim spoken field pattern)  */
/* ------------------------------------------------------------------ */

export function runwayToSpoken(runway: string): string {
  return runway
    .split("")
    .map((d) => DIGIT_SPOKEN[d] ?? d)
    .join(" ");
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Context fields used when converting ATC display text to spoken TTS text. */
export type AtcSpokenContext = {
  callsign: string;
  groundFreq: string;
  towerFreq: string;
  qnh: number;
  runway: string;
};

/**
 * Convert ATC display text to spoken form using the same conventions as atcSim.ts.
 * Used when a state has display atcText but no explicit atcSpoken field.
 */
export function atcDisplayToSpoken(display: string, ctx: AtcSpokenContext): string {
  let spoken = display;

  spoken = spoken.replace(
    new RegExp(escapeRegex(ctx.callsign), "g"),
    callsignToSpoken(ctx.callsign),
  );

  spoken = spoken.replace(
    new RegExp(escapeRegex(formatFrequencyDisplay(ctx.groundFreq)), "g"),
    frequencyToSpoken(ctx.groundFreq),
  );

  spoken = spoken.replace(
    new RegExp(escapeRegex(formatFrequencyDisplay(ctx.towerFreq)), "g"),
    frequencyToSpoken(ctx.towerFreq),
  );

  spoken = spoken.replace(/QNH\s+(\d+)/gi, (_, digits: string) => {
    return `Q N H ${qnhToSpoken(Number(digits))}`;
  });

  spoken = spoken.replace(
    new RegExp(`runway\\s+${escapeRegex(ctx.runway)}`, "gi"),
    `runway ${runwayToSpoken(ctx.runway)}`,
  );

  return spoken;
}
