"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { findExercise, screenType, type ExerciseType, type ScreenType } from "./content";

/** Local calendar date as YYYY-MM-DD (not UTC). */
export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayKey(): string {
  return getLocalDateKey();
}

function dayKey(offsetDays: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return getLocalDateKey(date);
}

export function isYesterday(dateKey: string, todayKeyStr: string = todayKey()): boolean {
  const [y, m, d] = todayKeyStr.split("-").map(Number);
  const base = new Date(y, m - 1, d);
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() - 1);
  return dateKey === getLocalDateKey(base);
}

export type Experience = "No Experience" | "Student Pilot" | "Pilot" | "Airline Pilot";
export type Subscription = "free" | "pro";
export type Difficulty = "Easy" | "Normal" | "Advanced";

export type Skills = {
  listening: number;
  readbacks: number;
  phraseology: number;
  /** Speaking accuracy — fed by real voice exercises (Voice Alpha Slice). */
  speaking: number;
  confidence: number;
};

/** Running total for one skill axis — used to compute the real average score. */
export type SkillStats = { totalScore: number; count: number };

/** Per-skill running totals. count === 0 means "no scored sessions yet" for that axis. */
export type SkillStatsMap = {
  listening:   SkillStats;
  readbacks:   SkillStats;
  phraseology: SkillStats;
  /** Running total for voice/speaking exercises (Voice Alpha Slice). */
  speaking:    SkillStats;
  confidence:  SkillStats;
};

export type SessionSource = "train" | "atc-mission";

export type SessionRecord = {
  id: string;
  name: string;
  detail: string;
  /**
   * Real score (0–100). Undefined for completion-only sessions that have no
   * genuine right/wrong evaluation. Legacy records (pre-isScored) may have a
   * random value here; treat them as unscored unless source === "atc-mission".
   */
  score?: number;
  /**
   * true  → real scored session (accuracy + skills updated from this score).
   * false → completion-only (no evaluation; accuracy + skills unchanged).
   * undefined → legacy record created before this field existed.
   */
  isScored?: boolean;
  at: number;
  /** Added in v2 — undefined on records created before this field existed. */
  source?: SessionSource;
  missionId?: string;
  exerciseId?: string;
  level?: string;
  stars?: number;
};

/**
 * Persistent summary of a single ATC Sim mission's best result.
 * Stored in missionResults[missionId] inside aerocomms.v2.
 */
export type MissionResultSummary = {
  missionId: string;
  score: number;
  bestScore: number;
  stars: number;
  bestStars: number;
  attempts: number;
  completed: boolean;
  /** ISO string — first successful completion. */
  completedAt: string;
  /** ISO string — most recent attempt. */
  lastAttemptAt: string;
  level?: string;
  title?: string;
};

export type AppState = {
  onboarded: boolean;
  name: string;
  experience: Experience | null;
  goal: string | null;
  dailyGoal: string;
  subscription: Subscription;
  difficulty: Difficulty;
  notifications: boolean;
  skills: Skills;
  /**
   * Per-skill running totals for computing real average scores.
   * Absent on records hydrated from pre-v3 localStorage — treated as empty (no data).
   */
  skillStats: SkillStatsMap;
  streakDays: number;
  /** Rolling average accuracy — updated ONLY from genuinely scored sessions. */
  accuracy: number;
  /** Total sessions including completion-only (all activity). */
  sessionsCount: number;
  /** Sessions that had a real score; used as the denominator for accuracy. */
  scoredCount: number;
  minutesToday: number;
  lastSessionAt: string | null;
  completedExercises: string[];
  history: SessionRecord[];
  /** @deprecated legacy counter kept only for backwards compatibility; never read by the UI. */
  moduleProgress: Record<string, number>;
  /** ATC Sim mission IDs that have been completed at least once. */
  completedMissions: string[];
  /** Per-mission best result, keyed by missionId. */
  missionResults: Record<string, MissionResultSummary>;
};

export const DAILY_GOALS = ["5 min/day", "10 min/day", "20 min/day", "30+ min/day"];
export const DIFFICULTIES: Difficulty[] = ["Easy", "Normal", "Advanced"];

// Clean slate: a brand-new user starts at zero. No fake sessions, streak or completion.
const DEFAULT_STATE: AppState = {
  onboarded: false,
  name: "Pilot",
  experience: null,
  goal: null,
  dailyGoal: "10 min/day",
  subscription: "free",
  difficulty: "Normal",
  notifications: true,
  skills: { listening: 0, readbacks: 0, phraseology: 0, speaking: 0, confidence: 0 },
  skillStats: {
    listening:   { totalScore: 0, count: 0 },
    readbacks:   { totalScore: 0, count: 0 },
    phraseology: { totalScore: 0, count: 0 },
    speaking:    { totalScore: 0, count: 0 },
    confidence:  { totalScore: 0, count: 0 },
  },
  streakDays: 0,
  accuracy: 0,
  sessionsCount: 0,
  scoredCount: 0,
  minutesToday: 0,
  lastSessionAt: null,
  completedExercises: [],
  history: [],
  moduleProgress: {},
  completedMissions: [],
  missionResults: {},
};

// v2: unified progress model (skills + clean baseline). Bumped so legacy v1 seed data is discarded.
const STORAGE_KEY = "aerocomms.v2";

/**
 * Normalize daily fields after loading persisted state.
 * Resets minutesToday on a new local day; breaks streak if last activity was 2+ days ago.
 * Does not touch historical progress (exercises, missions, history, accuracy, skillStats).
 */
export function normalizeDailyState(state: AppState): AppState {
  const today = todayKey();
  const last = state.lastSessionAt;

  if (!last) {
    return state.minutesToday === 0 ? state : { ...state, minutesToday: 0 };
  }

  if (last === today) {
    return state;
  }

  // New local day — daily minutes always reset until the user trains again today.
  let next: AppState = { ...state, minutesToday: 0 };

  if (isYesterday(last, today)) {
    // Trained yesterday: streak stays visible until broken or extended by new activity.
    return next;
  }

  // Last activity before yesterday — streak is broken until a new session.
  if (next.streakDays !== 0) {
    next = { ...next, streakDays: 0 };
  }
  return next;
}

/** Appends a new score to a SkillStats running total. */
function addToSkillStats(s: SkillStats, score: number): SkillStats {
  return { totalScore: s.totalScore + score, count: s.count + 1 };
}

/** Derives the integer display value (0–100) for a skill. Returns 0 when count === 0. */
function skillValue(s: SkillStats): number {
  return s.count > 0 ? Math.round(s.totalScore / s.count) : 0;
}

/**
 * Returns an updated SkillStatsMap and recomputed Skills averages for a scored session.
 * Only the skill axes relevant to the exercise type are updated.
 * Confidence is reserved for ATC Sim missions — the only real multi-axis scored activity.
 * Speaking is updated by real voice exercises (Voice Alpha Slice).
 * Lesson exercises never update any skill axis.
 */
function updateSkillStats(
  current: SkillStatsMap,
  screen: ScreenType | undefined,
  score: number,
): { statsMap: SkillStatsMap; skills: Skills } {
  const m: SkillStatsMap = {
    listening:   { ...current.listening },
    readbacks:   { ...current.readbacks },
    phraseology: { ...current.phraseology },
    speaking:    { ...current.speaking },
    confidence:  { ...current.confidence },
  };
  switch (screen) {
    case "listening":
      m.listening = addToSkillStats(m.listening, score);
      break;
    case "readback":
      m.readbacks = addToSkillStats(m.readbacks, score);
      break;
    case "phraseology":
      m.phraseology = addToSkillStats(m.phraseology, score);
      break;
    case "speaking":
      // Real voice exercises — updates Speaking axis only.
      m.speaking = addToSkillStats(m.speaking, score);
      break;
    case "scenario":
      // Challenge exercises evaluate Listening, Readbacks, and Phraseology.
      m.listening   = addToSkillStats(m.listening,   score);
      m.readbacks   = addToSkillStats(m.readbacks,   score);
      m.phraseology = addToSkillStats(m.phraseology, score);
      break;
    case "mission":
      // ATC Sim missions are the only real source of Confidence data.
      m.listening   = addToSkillStats(m.listening,   score);
      m.readbacks   = addToSkillStats(m.readbacks,   score);
      m.phraseology = addToSkillStats(m.phraseology, score);
      m.confidence  = addToSkillStats(m.confidence,  score);
      break;
    case "lesson":
    default:
      // Lesson/unknown exercises: no skill axis updated.
      break;
  }
  const skills: Skills = {
    listening:   skillValue(m.listening),
    readbacks:   skillValue(m.readbacks),
    phraseology: skillValue(m.phraseology),
    speaking:    skillValue(m.speaking),
    confidence:  skillValue(m.confidence),
  };
  return { statsMap: m, skills };
}

type RecordSessionInput = {
  name: string;
  detail?: string;
  /**
   * Real score 0–100. Required when isScored is true.
   * Omit (or leave undefined) for completion-only sessions — no random fallback is applied.
   */
  score?: number;
  /** true = genuine scored session; false/omitted = completion-only. */
  isScored?: boolean;
  minutes?: number;
  moduleId?: string;
  exerciseId?: string;
  type?: ExerciseType;
  source?: SessionSource;
  level?: string;
  stars?: number;
};

type RecordMissionResultInput = {
  missionId: string;
  title: string;
  level: string;
  score: number;
  stars: number;
  minutes?: number;
};

type AppContextValue = {
  state: AppState;
  hydrated: boolean;
  setOnboarding: (data: Partial<AppState>) => void;
  completeOnboarding: () => void;
  recordSession: (input: RecordSessionInput) => SessionRecord;
  recordMissionResult: (input: RecordMissionResultInput) => SessionRecord;
  upgrade: () => void;
  setNotifications: (value: boolean) => void;
  cycleDailyGoal: () => void;
  cycleDifficulty: () => void;
  reset: () => void;
  resetProgressOnly: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AppState>;
          const zeroStat: SkillStats = { totalScore: 0, count: 0 };
          setState(normalizeDailyState({
            ...DEFAULT_STATE,
            ...parsed,
            skills: { ...DEFAULT_STATE.skills, ...parsed.skills },
            // Guarantee new fields exist even in old localStorage blobs.
            completedMissions: parsed.completedMissions ?? DEFAULT_STATE.completedMissions,
            missionResults: parsed.missionResults ?? DEFAULT_STATE.missionResults,
            scoredCount: parsed.scoredCount ?? DEFAULT_STATE.scoredCount,
            // skillStats: new field. Legacy blobs without it start empty (correct — no EMA data to inherit).
            skillStats: {
              listening:   { ...zeroStat, ...(parsed.skillStats?.listening   ?? {}) },
              readbacks:   { ...zeroStat, ...(parsed.skillStats?.readbacks   ?? {}) },
              phraseology: { ...zeroStat, ...(parsed.skillStats?.phraseology ?? {}) },
              // speaking is new — old localStorage blobs without it start at zero (correct).
              speaking:    { ...zeroStat, ...(parsed.skillStats?.speaking    ?? {}) },
              confidence:  { ...zeroStat, ...(parsed.skillStats?.confidence  ?? {}) },
            },
          }));
        }
      } catch {
        // ignore corrupted storage
      }
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state, hydrated]);

  const setOnboarding = useCallback((data: Partial<AppState>) => {
    setState((s) => ({ ...s, ...data }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setState((s) => ({ ...s, onboarded: true }));
  }, []);

  const recordSession = useCallback((input: RecordSessionInput) => {
    const scored = input.isScored === true;
    // No random fallback. Completion-only sessions have no score.
    const score = scored ? input.score : undefined;
    const minutes = input.minutes ?? 5;
    const record: SessionRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: input.name,
      detail: input.detail ?? `Today \u00b7 ${minutes} min`,
      score,
      isScored: scored,
      at: Date.now(),
      // Optional enrichment fields (undefined on old records — backwards-compatible).
      source: input.source,
      level: input.level,
      stars: input.stars,
      exerciseId: input.exerciseId,
    };
    setState((s) => {
      const newCount = s.sessionsCount + 1;

      // Accuracy and skills are updated ONLY from genuinely scored sessions.
      // scoredCount tracks how many such sessions have been recorded (correct denominator).
      const newScoredCount = scored ? s.scoredCount + 1 : s.scoredCount;
      const newAccuracy = scored && score !== undefined
        ? (s.scoredCount === 0 ? score : Math.round((s.accuracy * s.scoredCount + score) / newScoredCount))
        : s.accuracy;

      // Resolve the exercise type (from input, else from the catalog) -> screen -> skills.
      const type = input.type ?? (input.exerciseId ? findExercise(input.exerciseId)?.exercise.type : undefined);
      const screen = type ? screenType(type) : undefined;
      const { statsMap: newSkillStats, skills } = (scored && score !== undefined)
        ? updateSkillStats(s.skillStats, screen, score)
        : { statsMap: s.skillStats, skills: s.skills };

      const completedExercises =
        input.exerciseId && !s.completedExercises.includes(input.exerciseId)
          ? [...s.completedExercises, input.exerciseId]
          : s.completedExercises;

      // Streak: same day keeps it, consecutive day extends it, a gap resets to 1.
      const today = todayKey();
      const yesterday = dayKey(-1);
      let streakDays: number;
      if (s.lastSessionAt === today) streakDays = Math.max(1, s.streakDays);
      else if (s.lastSessionAt === yesterday) streakDays = s.streakDays + 1;
      else streakDays = 1;

      const minutesToday = (s.lastSessionAt === today ? s.minutesToday : 0) + minutes;

      // Legacy map kept in sync but never read by the UI.
      const moduleProgress = { ...s.moduleProgress };
      if (input.moduleId) {
        moduleProgress[input.moduleId] = Math.min(100, (moduleProgress[input.moduleId] ?? 0) + 25);
      }

      return {
        ...s,
        sessionsCount: newCount,
        scoredCount: newScoredCount,
        accuracy: newAccuracy,
        skills,
        skillStats: newSkillStats,
        minutesToday,
        streakDays,
        lastSessionAt: today,
        moduleProgress,
        completedExercises,
        history: [record, ...s.history].slice(0, 20),
      };
    });
    return record;
  }, []);

  /**
   * Single action for completing an ATC Sim Guided Mission.
   *
   * Updates: missionResults, completedMissions, skills (mission branch),
   * history (source: "atc-mission"), accuracy, sessionsCount, streak.
   * Does NOT touch completedExercises (missions are not Train exercises).
   * Does NOT call recordSession — history is written here to avoid duplication.
   */
  const recordMissionResult = useCallback((input: RecordMissionResultInput): SessionRecord => {
    const minutes = input.minutes ?? 6;
    const record: SessionRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: input.title,
      detail: `ATC Sim \u00b7 ${minutes} min`,
      score: input.score,
      isScored: true,
      at: Date.now(),
      source: "atc-mission",
      missionId: input.missionId,
      level: input.level,
      stars: input.stars,
    };

    setState((s) => {
      const newCount = s.sessionsCount + 1;
      // ATC Sim missions always have a real score — use scoredCount as the denominator.
      const newScoredCount = s.scoredCount + 1;
      const newAccuracy =
        s.scoredCount === 0
          ? input.score
          : Math.round((s.accuracy * s.scoredCount + input.score) / newScoredCount);

      // ATC Sim missions: real scored activity — updates all four skill axes.
      const { statsMap: newSkillStats, skills } = updateSkillStats(s.skillStats, "mission", input.score);

      const today = todayKey();
      const yesterday = dayKey(-1);
      let streakDays: number;
      if (s.lastSessionAt === today) streakDays = Math.max(1, s.streakDays);
      else if (s.lastSessionAt === yesterday) streakDays = s.streakDays + 1;
      else streakDays = 1;

      const minutesToday = (s.lastSessionAt === today ? s.minutesToday : 0) + minutes;

      // Add to completedMissions (idempotent).
      const completedMissions = s.completedMissions.includes(input.missionId)
        ? s.completedMissions
        : [...s.completedMissions, input.missionId];

      // Update missionResults: preserve bestScore/bestStars, increment attempts.
      const existing = s.missionResults[input.missionId];
      const now = new Date().toISOString();
      const missionResult: MissionResultSummary = {
        missionId: input.missionId,
        score: input.score,
        bestScore: existing ? Math.max(existing.bestScore, input.score) : input.score,
        stars: input.stars,
        bestStars: existing ? Math.max(existing.bestStars, input.stars) : input.stars,
        attempts: (existing?.attempts ?? 0) + 1,
        completed: true,
        completedAt: existing?.completedAt ?? now,
        lastAttemptAt: now,
        level: input.level,
        title: input.title,
      };

      return {
        ...s,
        sessionsCount: newCount,
        scoredCount: newScoredCount,
        accuracy: newAccuracy,
        skills,
        skillStats: newSkillStats,
        minutesToday,
        streakDays,
        lastSessionAt: today,
        completedMissions,
        missionResults: { ...s.missionResults, [input.missionId]: missionResult },
        history: [record, ...s.history].slice(0, 20),
      };
    });

    return record;
  }, []);

  const upgrade = useCallback(() => {
    setState((s) => ({ ...s, subscription: "pro" }));
  }, []);

  const setNotifications = useCallback((value: boolean) => {
    setState((s) => ({ ...s, notifications: value }));
  }, []);

  const cycleDailyGoal = useCallback(() => {
    setState((s) => {
      const i = DAILY_GOALS.indexOf(s.dailyGoal);
      return { ...s, dailyGoal: DAILY_GOALS[(i + 1) % DAILY_GOALS.length] };
    });
  }, []);

  const cycleDifficulty = useCallback(() => {
    setState((s) => {
      const i = DIFFICULTIES.indexOf(s.difficulty);
      return { ...s, difficulty: DIFFICULTIES[(i + 1) % DIFFICULTIES.length] };
    });
  }, []);

  const reset = useCallback(() => setState(DEFAULT_STATE), []);

  /**
   * Clears all training and mission progress while preserving profile settings.
   * Safe to call from Profile → Reset Progress in Alpha testing.
   *
   * Clears: completedExercises, completedMissions, missionResults, history,
   *         skills, streakDays, accuracy, sessionsCount, minutesToday,
   *         lastSessionAt, moduleProgress.
   * Keeps:  onboarded, name, experience, goal, subscription,
   *         difficulty, dailyGoal, notifications.
   */
  const resetProgressOnly = useCallback(() => {
    setState((s) => ({
      ...s,
      completedExercises: [],
      completedMissions: [],
      missionResults: {},
      history: [],
      skills: { listening: 0, readbacks: 0, phraseology: 0, speaking: 0, confidence: 0 },
      skillStats: {
        listening:   { totalScore: 0, count: 0 },
        readbacks:   { totalScore: 0, count: 0 },
        phraseology: { totalScore: 0, count: 0 },
        speaking:    { totalScore: 0, count: 0 },
        confidence:  { totalScore: 0, count: 0 },
      },
      streakDays: 0,
      accuracy: 0,
      sessionsCount: 0,
      scoredCount: 0,
      minutesToday: 0,
      lastSessionAt: null,
      moduleProgress: {},
    }));
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      hydrated,
      setOnboarding,
      completeOnboarding,
      recordSession,
      recordMissionResult,
      upgrade,
      setNotifications,
      cycleDailyGoal,
      cycleDifficulty,
      reset,
      resetProgressOnly,
    }),
    [state, hydrated, setOnboarding, completeOnboarding, recordSession, recordMissionResult, upgrade, setNotifications, cycleDailyGoal, cycleDifficulty, reset, resetProgressOnly],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
