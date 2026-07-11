/**
 * AeroComms — Mission evaluator concept model (v4).
 *
 * Generalizes the single-step "requiredItems" gate first built for Ground Operations
 * go-5 into a reusable, concept-aware matching system used across every mission in
 * atcSim.ts. The goal (per product spec) is matching by MEANING, not just fuzzy word
 * overlap — the flagship example is that a callsign spelled "...Alpha Bravo Charlie
 * Delta" must never satisfy an unrelated "Information Alpha" requirement just because
 * the word "Alpha" appears somewhere in the transcript.
 *
 * Design: each ConceptItem carries a `concept` (one of a fixed vocabulary — callsign,
 * runway, QNH, ATIS/info code, etc.) plus either an `expectedValue` (a concrete value
 * to look for, e.g. "27", "1013", "Alpha") or explicit `variants` (accepted free-form
 * phrasings, for concepts without a single canonical value, e.g. "request-intent").
 * Concepts with a natural canonical value are matched with a KEYWORD-ANCHORED search
 * (the value must appear near a concept-indicating keyword like "information"/"runway"/
 * "QNH") rather than a bare substring check — this is what prevents the callsign false
 * positive above, and generalizes to any letter/number/mission without hand-listing
 * every combination as a literal phrase.
 */

import { normalizePhrase } from "./evaluation";

export type ConceptId =
  | "callsign"
  | "request-intent"
  | "atis-info"
  | "qnh"
  | "runway"
  | "holding-point"
  | "taxi-route"
  | "clearance-readback"
  | "frequency"
  | "altitude"
  | "heading"
  | "squawk"
  | "position"
  | "instruction-ack";

/** One concept-tagged requirement — see module doc comment above. */
export type ConceptItem = {
  id: string;
  concept: ConceptId;
  /** Short human label used in corrective ATC messages/hints, e.g. "Information Alpha". */
  label: string;
  /**
   * Concrete value to search for (runway number, QNH digits, ATIS letter, frequency,
   * callsign, heading, squawk...). Matched via a keyword-anchored search for concepts
   * with keywords in CONCEPT_KEYWORDS below, or a plain substring check otherwise.
   */
  expectedValue?: string;
  /**
   * Explicit accepted phrasings for concepts without one canonical value (intent,
   * acknowledgement, route wording), or extra accepted phrasings on top of
   * expectedValue for value-based concepts. Checked as normalized substrings.
   */
  variants?: string[];
};

/**
 * Keyword anchors per concept — the expectedValue must appear within a short window
 * AFTER one of these keywords, not just anywhere in the transcript. This is the
 * mechanism that keeps matching concept-aware instead of bare word-matching: an ATIS
 * letter mentioned only as part of a callsign spelling (no "information"/"info"/"atis"
 * nearby) never satisfies an atis-info requirement.
 */
const CONCEPT_KEYWORDS: Partial<Record<ConceptId, string[]>> = {
  "atis-info": ["information", "info", "atis", "we have"],
  qnh: ["qnh"],
  runway: ["runway"],
  frequency: ["contact", "frequency", "changing to"],
  squawk: ["squawk"],
  altitude: ["altitude", "feet", "flight level"],
  heading: ["heading"],
  "holding-point": ["holding point", "hold short"],
};

/** How many words after a matched keyword we search for the value — generous enough
 * for natural phrasing ("with Information Alpha", "we have information Alpha today")
 * without being so wide it starts matching unrelated later content. */
const KEYWORD_SEARCH_WINDOW = 5;

/** normalizePhrase() doesn't unify the ICAO "Alfa" spelling with the common "Alpha"
 * spelling (that's an evaluation.ts concern for different tokens) — concept matching
 * needs both to compare equal since mission text/expectedValue may use either. */
function unifyIcaoLetterSpelling(text: string): string {
  return text.replace(/\balfa\b/g, "alpha");
}

/** Normalizes a value/transcript for concept comparison — same aviation-aware
 * pipeline used for scoring (evaluation.ts's normalizePhrase), plus alfa/alpha unify. */
export function conceptNormalize(text: string): string {
  return unifyIcaoLetterSpelling(normalizePhrase(text));
}

/**
 * Substring check that's also robust to compound-word differences between how a
 * phrase is authored/spoken vs. how normalizePhrase's punctuation stripping renders
 * it — e.g. "start-up" (authored, becomes "start up") vs. a pilot/STT saying "startup"
 * as one word (stays "startup", no inserted space). A bare `.includes()` check would
 * treat these as different strings and incorrectly reject a perfectly valid answer
 * (this was a real bug: "request startup" failed to match the "start up" variant).
 * Falls back to a space-insensitive comparison only when the plain check fails.
 */
function normalizedIncludes(haystack: string, needle: string): boolean {
  if (!needle) return false;
  if (haystack.includes(needle)) return true;
  return haystack.replace(/\s+/g, "").includes(needle.replace(/\s+/g, ""));
}

function keywordAnchoredMatch(transcriptWords: string[], keywords: string[], valueNorm: string): boolean {
  const valueWords = valueNorm.split(" ").filter(Boolean);
  if (valueWords.length === 0) return false;
  for (const kw of keywords) {
    // Keywords are raw human-written strings (e.g. "holding point") — normalize them
    // through the same pipeline as the transcript before comparing, since normalizePhrase
    // rewrites some words (e.g. aviation "point" -> "decimal" for frequency separators),
    // which would otherwise silently break a keyword like "holding point".
    const kwWords = conceptNormalize(kw).split(" ").filter(Boolean);
    for (let i = 0; i <= transcriptWords.length - kwWords.length; i++) {
      if (!kwWords.every((w, j) => transcriptWords[i + j] === w)) continue;
      const searchStart = i + kwWords.length;
      const searchEnd = Math.min(transcriptWords.length, searchStart + KEYWORD_SEARCH_WINDOW + valueWords.length);
      const window = transcriptWords.slice(searchStart, searchEnd).join(" ");
      // normalizedIncludes (not a bare substring check) so a keyword/value split across
      // a compound-word normalization quirk within the window still matches — the
      // keyword adjacency requirement above is what keeps this concept-aware rather
      // than a bare word-match (see module doc comment's callsign/ATIS example).
      if (normalizedIncludes(window, valueNorm)) return true;
    }
  }
  return false;
}

/**
 * Whether a single concept item is satisfied by an ALREADY-NORMALIZED transcript
 * (see conceptNormalize). `callsign` optionally supplies the mission's callsign for
 * items that don't set their own expectedValue.
 */
export function matchesConceptItem(transcriptNorm: string, item: ConceptItem, callsign?: string): boolean {
  if (item.variants?.some((v) => normalizedIncludes(transcriptNorm, conceptNormalize(v)))) return true;

  if (item.concept === "callsign") {
    const value = item.expectedValue ?? callsign;
    if (!value) return false;
    return normalizedIncludes(transcriptNorm, conceptNormalize(value));
  }

  if (!item.expectedValue) return false;
  const valueNorm = conceptNormalize(item.expectedValue);
  const keywords = CONCEPT_KEYWORDS[item.concept];
  if (keywords?.length) {
    return keywordAnchoredMatch(transcriptNorm.split(" "), keywords, valueNorm);
  }
  return normalizedIncludes(transcriptNorm, valueNorm);
}

/** Returns the subset of `items` NOT found in `transcript` (raw, un-normalized). */
export function findMissingConceptItems(transcript: string, items: ConceptItem[] | undefined, callsign?: string): ConceptItem[] {
  if (!items || items.length === 0) return [];
  const transcriptNorm = conceptNormalize(transcript);
  if (!transcriptNorm) return items;
  return items.filter((item) => !matchesConceptItem(transcriptNorm, item, callsign));
}

// ─── Auto-derivation from a step's canonical expected text ────────────────────────
// Hand-authoring bespoke requiredItems/softItems for every pilot step across every
// mission does not scale (90+ steps). Instead, every pilot step's `expected` text
// already IS the canonical correct answer — this derives concept items from it
// automatically, so every mission gets required/soft item gating by default. Specific
// steps can still override with hand-authored `requiredItems`/`softItems` for extra
// precision/custom correction prompts (see atcSim.ts's flagship examples).

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SOFT_KEYWORDS: { re: RegExp; id: string; label: string; phrase: string }[] = [
  { re: /\bwilco\b/i, id: "kw-wilco", label: '"wilco" acknowledgement', phrase: "wilco" },
  { re: /\broger\b/i, id: "kw-roger", label: '"roger" acknowledgement', phrase: "roger" },
  { re: /\bcleared\b/i, id: "kw-cleared", label: '"cleared" readback', phrase: "cleared" },
  { re: /\bline up\b/i, id: "kw-line-up", label: '"line up" phrasing', phrase: "line up" },
  { re: /\btouch and go\b/i, id: "kw-touch-and-go", label: '"touch and go" phrasing', phrase: "touch and go" },
  { re: /\bvia\b/i, id: "kw-via", label: '"via" routing detail', phrase: "via" },
  { re: /\bwith you\b/i, id: "kw-with-you", label: '"with you" check-in', phrase: "with you" },
];

export type StepKind = "request" | "readback";

/**
 * Infers whether a pilot step is a PILOT-INITIATED REQUEST (proactively asking ATC for
 * something — "request start-up", "request taxi") vs. a READBACK/ACKNOWLEDGEMENT of an
 * instruction/clearance ATC just gave (taxi clearance, runway, holding point, QNH,
 * squawk, frequency, altitude, heading, "cleared..."). This distinction is the crux of
 * the v5 evaluator fix (Part B/D): a value mentioned INCIDENTALLY inside a request
 * (e.g. "...QNH 1013, request start-up") should not be gated as critical the same way
 * a value the pilot is specifically being asked to read back is. Defaults to
 * "readback" (the majority/safer case — most pilot steps in this app ARE reading back
 * something ATC just said, and Part D's examples keep those concepts critical).
 */
export function inferStepKind(text: string): StepKind {
  const hasRequestVerb = /\b(request|requesting|ready for)\b/i.test(text);
  const hasReadbackOrClearanceMarker =
    /\b(cleared|approved|hold short|holding point|taxi to|contact|squawk|climb|descend|turn (left|right)|line up|report (final|downwind)|wilco|roger)\b/i.test(
      text,
    );
  return hasRequestVerb && !hasReadbackOrClearanceMarker ? "request" : "readback";
}

/**
 * Heuristically derives required/soft concept items from a pilot step's canonical
 * `expected` text (falls back to `text` if `expected` is absent). Conservative by
 * design (v5 evaluator fix — Part D): "if uncertain, classify as softItem, not
 * requiredItem." Callsign, ATIS/information code, and — for READBACK-kind steps only —
 * numeric clearance values (runway, QNH, squawk, frequency, holding point, heading)
 * become required; everything else (a value only INCIDENTALLY mentioned inside a
 * REQUEST-kind step, altitude mentioned in passing, generic ATC phraseology keywords)
 * becomes soft (score-affecting, non-blocking) instead. See inferStepKind's doc
 * comment for why a request step's incidental values are treated more leniently than a
 * readback step's — this is what fixed go-5 incorrectly requiring QNH on a startup
 * request (QNH there is soft; only callsign, request-intent, and the ATIS code are
 * required — see the hand-authored override in atcSim.ts for the exact, tuned version).
 */
export function deriveConceptItems(
  expectedText: string,
  callsign: string | undefined,
  stepKindHint?: StepKind,
): { requiredItems: ConceptItem[]; softItems: ConceptItem[] } {
  const required: ConceptItem[] = [];
  const soft: ConceptItem[] = [];
  const text = expectedText;
  const stepKind = stepKindHint ?? inferStepKind(text);
  // Numeric/clearance concepts are only auto-required for readback-kind steps — for a
  // request-kind step they're demoted to soft (see doc comment above).
  const numericTarget = stepKind === "readback" ? required : soft;

  if (callsign && new RegExp(`\\b${escapeRegExp(callsign)}\\b`, "i").test(text)) {
    required.push({ id: "callsign", concept: "callsign", label: "your callsign", expectedValue: callsign });
  }

  if (stepKind === "request") {
    // Broad variant list so real STT output (which commonly mishears "request" as
    // "quest" or "test" on Safari) still passes when the overall intent is clear
    // from context (callsign + specific action word like "startup", "taxi", "pushback").
    // The ACTION WORD variants ("startup", "start up") are intentionally included
    // here because the pilot's intent is unambiguous even without hearing "request":
    // "G-ABCD, startup, info Alpha" clearly conveys startup intent.
    required.push({
      id: "request-intent",
      concept: "request-intent",
      label: "your request",
      variants: [
        "request", "requesting", "ready for",
        "startup", "start up", "start-up",
        "taxi", "push back", "pushback",
      ],
    });
  }

  const runwayMatch = /runway\s+(\d{1,2})\b/i.exec(text);
  if (runwayMatch) numericTarget.push({ id: "runway", concept: "runway", label: "the runway", expectedValue: runwayMatch[1] });

  const qnhMatch = /QNH\s+(\d{3,4})\b/i.exec(text);
  if (qnhMatch) numericTarget.push({ id: "qnh", concept: "qnh", label: "QNH", expectedValue: qnhMatch[1] });

  const squawkMatch = /squawk\s+(\d{3,4})\b/i.exec(text);
  if (squawkMatch) numericTarget.push({ id: "squawk", concept: "squawk", label: "your squawk", expectedValue: squawkMatch[1] });

  // ATIS/information code stays required regardless of step kind — it's a scenario-
  // critical safety item (per Part C) whether the pilot is requesting or reading back.
  const infoMatch = /\b(?:information|info)\s+([a-z]+)\b/i.exec(text);
  if (infoMatch) {
    required.push({ id: "atis-info", concept: "atis-info", label: `Information ${infoMatch[1]}`, expectedValue: infoMatch[1] });
  }

  const freqMatch = /\b(\d{2,3}\.\d{1,3})\b/.exec(text);
  if (freqMatch) numericTarget.push({ id: "frequency", concept: "frequency", label: "the frequency", expectedValue: freqMatch[1] });

  const holdMatch = /holding point\s+([a-z]+)\b/i.exec(text);
  if (holdMatch) {
    numericTarget.push({ id: "holding-point", concept: "holding-point", label: "the holding point", expectedValue: holdMatch[1] });
  } else if (/hold short/i.test(text)) {
    numericTarget.push({ id: "holding-point", concept: "holding-point", label: "hold short acknowledgement", variants: ["hold short"] });
  }

  const headingMatch = /heading\s+(\d{1,3})\b/i.exec(text);
  if (headingMatch) numericTarget.push({ id: "heading", concept: "heading", label: "the heading", expectedValue: headingMatch[1] });

  // Altitude is always kept soft: it often appears alongside a stronger primary intent
  // (check-in calls, descent instructions) where over-gating on the exact figure would
  // be too strict for a beginner-friendly Alpha product.
  const altitudeMatch = /(\d{3,5})\s*feet\b/i.exec(text);
  if (altitudeMatch) soft.push({ id: "altitude", concept: "altitude", label: "the altitude", expectedValue: altitudeMatch[1] });

  for (const kw of SOFT_KEYWORDS) {
    if (kw.re.test(text)) soft.push({ id: kw.id, concept: "instruction-ack", label: kw.label, variants: [kw.phrase] });
  }

  return { requiredItems: required, softItems: soft };
}
