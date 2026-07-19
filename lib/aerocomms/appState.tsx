"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { findExercise, screenType, type ExerciseType, type ScreenType } from "./content";
import { initializeFlyPathAuthState } from "@/lib/auth/client";
import type { FlyPathClientAuthState } from "@/lib/auth/types";
import {
  createAeroCommsClientSessionId,
  createAeroCommsPersistencePayload,
  createAeroCommsSyncOperationId,
  readAeroCommsRemoteProgressSnapshot,
  type AeroCommsPersistencePayload,
} from "./persistence-contract";
import {
  acknowledgeAeroCommsOutboxSessions,
  appendAeroCommsSyncOutbox,
  clearAeroCommsPersistenceIntent,
  getAeroCommsOutboxSessions,
  readAeroCommsPersistenceIntent,
  removeAeroCommsLocalProgress,
  writeAeroCommsPersistenceIntent,
} from "./persistence-local";
import { mergeAeroCommsRemoteProgress } from "./persistence-merge";
import {
  getAeroCommsLocalSyncEligibility,
  postAeroCommsProgressReset,
  postAeroCommsProgressSync,
  resolveAeroCommsAuthenticatedWorkspace,
  shouldShowAeroCommsLocalImportDecision,
} from "./persistence-client";
import {
  resolveAeroCommsAccountName,
  type AeroCommsAccountNamePrompt,
} from "./account-name";

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
  /** Exact sum for scored sessions. Accuracy is only its rounded presentation. */
  scoreSum: number;
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
  scoreSum: 0,
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
const SYNC_OWNER_STORAGE_KEY = "aerocomms.v2.sync-owner";
const ACCOUNT_STATE_STORAGE_KEY_PREFIX = "aerocomms.v2.account.";

export type AeroCommsSyncStatus =
  | "synced"
  | "anonymous"
  | "unavailable"
  | "invalid"
  | "requires_import_confirmation"
  | "owned_by_another_account";

function accountStateStorageKey(userId: string): string {
  return `${ACCOUNT_STATE_STORAGE_KEY_PREFIX}${userId}`;
}

function readStoredAeroCommsState(storageKey: string = STORAGE_KEY): AppState | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const zeroStat: SkillStats = { totalScore: 0, count: 0 };
    return normalizeDailyState({
      ...DEFAULT_STATE,
      ...parsed,
      skills: { ...DEFAULT_STATE.skills, ...parsed.skills },
      completedMissions: parsed.completedMissions ?? DEFAULT_STATE.completedMissions,
      missionResults: parsed.missionResults ?? DEFAULT_STATE.missionResults,
      scoredCount: parsed.scoredCount ?? DEFAULT_STATE.scoredCount,
      scoreSum: typeof parsed.scoreSum === "number" && Number.isFinite(parsed.scoreSum)
        ? parsed.scoreSum
        : (typeof parsed.accuracy === "number" && typeof parsed.scoredCount === "number"
          ? parsed.accuracy * parsed.scoredCount
          : 0),
      skillStats: {
        listening: { ...zeroStat, ...(parsed.skillStats?.listening ?? {}) },
        readbacks: { ...zeroStat, ...(parsed.skillStats?.readbacks ?? {}) },
        phraseology: { ...zeroStat, ...(parsed.skillStats?.phraseology ?? {}) },
        speaking: { ...zeroStat, ...(parsed.skillStats?.speaking ?? {}) },
        confidence: { ...zeroStat, ...(parsed.skillStats?.confidence ?? {}) },
      },
    });
  } catch {
    return null;
  }
}

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

function clearDurableProgress(state: AppState): AppState {
  return {
    ...state,
    completedExercises: [],
    completedMissions: [],
    missionResults: {},
    history: [],
    skills: { listening: 0, readbacks: 0, phraseology: 0, speaking: 0, confidence: 0 },
    skillStats: {
      listening: { totalScore: 0, count: 0 },
      readbacks: { totalScore: 0, count: 0 },
      phraseology: { totalScore: 0, count: 0 },
      speaking: { totalScore: 0, count: 0 },
      confidence: { totalScore: 0, count: 0 },
    },
    streakDays: 0,
    accuracy: 0,
    sessionsCount: 0,
    scoredCount: 0,
    scoreSum: 0,
    minutesToday: 0,
    lastSessionAt: null,
    moduleProgress: {},
  };
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
  /**
   * Synchronizes only durable progress. Existing anonymous progress needs an
   * explicit confirmation before it can become owned by an account.
   */
  syncProgress: (options?: { confirmLocalImport?: boolean }) => Promise<AeroCommsSyncStatus>;
  localImportDecisionRequired: boolean;
  dismissLocalImportDecision: () => void;
  foreignLocalProgressDetected: boolean;
  dismissForeignLocalProgressDecision: () => void;
  discardForeignLocalProgress: () => Promise<AeroCommsSyncStatus>;
  reset: () => void;
  resetProgressOnly: () => Promise<AeroCommsSyncStatus>;
  accountNamePrompt: AeroCommsAccountNamePrompt;
  keepAccountProfileName: () => void;
  applyAccountProfileName: (fullName: string) => void;
  dismissAccountNamePrompt: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export type AeroCommsAccountProfile = { userId: string; fullName: string | null };

export function AppStateProvider({
  children,
  accountProfile = null,
}: {
  children: ReactNode;
  accountProfile?: AeroCommsAccountProfile | null;
}) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [localImportDecisionRequired, setLocalImportDecisionRequired] = useState(false);
  const [foreignLocalProgressDetected, setForeignLocalProgressDetected] = useState(false);
  const [authenticatedAccountId, setAuthenticatedAccountId] = useState<string | null>(null);
  const [accountNamePrompt, setAccountNamePrompt] = useState<AeroCommsAccountNamePrompt>(null);
  const [confirmedAccountProfileName, setConfirmedAccountProfileName] = useState<string | null>(null);
  const stateRef = useRef(state);
  const hydratedRef = useRef(hydrated);
  const authStateRef = useRef<FlyPathClientAuthState>({ status: "loading" });
  const pendingSyncPayloadRef = useRef<AeroCommsPersistencePayload | null>(null);
  const pendingSyncOwnerRef = useRef<string | null>(null);
  const pendingSyncImportConfirmedRef = useRef(false);
  const pendingSyncBaselineOutboxIdsRef = useRef<string[]>([]);
  const pendingResetOperationRef = useRef<string | null>(null);
  const pendingResetOwnerRef = useRef<string | null>(null);
  const pendingResetFingerprintRef = useRef<string | null>(null);
  const syncInFlightRef = useRef(false);
  const syncGenerationRef = useRef(0);
  const syncOwnerRef = useRef<string | null>(null);
  const foreignLocalProgressRef = useRef(false);
  const foreignLocalProgressOwnerRef = useRef<string | null>(null);
  const persistLocalStateRef = useRef(true);
  const retryAttemptRef = useRef(0);
  const retryTimerRef = useRef<number | null>(null);
  const lastSyncedFingerprintRef = useRef<string | null>(null);
  const accountNameResolutionKeyRef = useRef<string | null>(null);
  const syncProgressRef = useRef<(options?: { confirmLocalImport?: boolean }) => Promise<AeroCommsSyncStatus>>(async () => "unavailable");

  useEffect(() => {
    stateRef.current = state;
    hydratedRef.current = hydrated;
  }, [state, hydrated]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const stored = readStoredAeroCommsState();
      let storedOwner: string | null = null;
      try {
        storedOwner = localStorage.getItem(SYNC_OWNER_STORAGE_KEY);
      } catch {
        storedOwner = syncOwnerRef.current;
      }
      if (storedOwner) {
        syncOwnerRef.current = storedOwner;
        // Account-owned browser data stays hidden until Auth identifies the account.
        persistLocalStateRef.current = false;
      } else if (stored) {
        setState(stored);
      }
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !persistLocalStateRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state, hydrated]);

  const currentProgressFingerprint = useCallback((candidate: AppState) => JSON.stringify({
    completedExercises: candidate.completedExercises,
    missionResults: candidate.missionResults,
    history: candidate.history,
    skillStats: candidate.skillStats,
    accuracy: candidate.accuracy,
    scoreSum: candidate.scoreSum,
    sessionsCount: candidate.sessionsCount,
    scoredCount: candidate.scoredCount,
    streakDays: candidate.streakDays,
    lastSessionAt: candidate.lastSessionAt,
  }), []);

  const hasDurableProgress = useCallback((candidate: AppState) => {
    return candidate.completedExercises.length > 0 || candidate.completedMissions.length > 0 ||
      candidate.history.length > 0 || candidate.sessionsCount > 0 || candidate.scoredCount > 0;
  }, []);

  const readSyncOwner = useCallback((): string | null => {
    try {
      const stored = localStorage.getItem(SYNC_OWNER_STORAGE_KEY);
      if (stored) syncOwnerRef.current = stored;
      return stored ?? syncOwnerRef.current;
    } catch {
      return syncOwnerRef.current;
    }
  }, []);

  const writeSyncOwner = useCallback((userId: string) => {
    syncOwnerRef.current = userId;
    try {
      localStorage.setItem(SYNC_OWNER_STORAGE_KEY, userId);
    } catch {
      // The in-memory owner keeps this browser session syncable when storage is restricted.
    }
  }, []);

  const archiveAccountProgress = useCallback((userId: string, candidate: AppState) => {
    try {
      localStorage.setItem(accountStateStorageKey(userId), JSON.stringify(candidate));
      return true;
    } catch {
      return false;
    }
  }, []);

  const clearSyncOwner = useCallback(() => {
    syncOwnerRef.current = null;
    try {
      localStorage.removeItem(SYNC_OWNER_STORAGE_KEY);
    } catch {
      // The owner remains unavailable only while browser storage is restricted.
    }
  }, []);

  const clearAnonymousWorkspace = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // The current in-memory state remains isolated until storage recovers.
    }
  }, []);

  /**
   * Activity created while signed in belongs to that account immediately. An
   * ownerless workspace with existing durable progress remains importable until
   * the user explicitly chooses to import it from Profile.
   */
  const claimAuthenticatedWorkspaceForNewActivity = useCallback(() => {
    const authState = authStateRef.current;
    if (authState.status !== "authenticated" || foreignLocalProgressRef.current) return;
    const eligibility = getAeroCommsLocalSyncEligibility(
      hasDurableProgress(stateRef.current),
      readSyncOwner(),
      authState.account.id,
    );
    if (eligibility === "requires_import_confirmation" || eligibility === "owned_by_another_account") return;
    writeSyncOwner(authState.account.id);
  }, [hasDurableProgress, readSyncOwner, writeSyncOwner]);

  const scheduleSyncRetry = useCallback(() => {
    if (retryTimerRef.current !== null) return;
    const delay = Math.min(3_000 * 2 ** retryAttemptRef.current, 60_000);
    retryAttemptRef.current += 1;
    retryTimerRef.current = window.setTimeout(() => {
      retryTimerRef.current = null;
      void syncProgressRef.current();
    }, delay);
  }, []);

  useEffect(() => () => {
    if (retryTimerRef.current !== null) window.clearTimeout(retryTimerRef.current);
  }, []);

  const syncProgress = useCallback(async (
    options: { confirmLocalImport?: boolean } = {},
  ): Promise<AeroCommsSyncStatus> => {
    if (!hydratedRef.current) return "unavailable";
    if (syncInFlightRef.current) {
      scheduleSyncRetry();
      return "unavailable";
    }
    const authState = authStateRef.current;
    if (authState.status === "anonymous") return "anonymous";
    if (authState.status !== "authenticated") return "unavailable";

    const syncGeneration = syncGenerationRef.current;
    const accountId = authState.account.id;
    const persistedIntent = readAeroCommsPersistenceIntent();
    if (!pendingResetOperationRef.current && persistedIntent?.kind === "reset" && persistedIntent.ownerId === accountId) {
      pendingResetOperationRef.current = persistedIntent.operationId;
      pendingResetOwnerRef.current = persistedIntent.ownerId;
    }
    if (pendingResetOperationRef.current) {
      if (pendingResetOwnerRef.current !== accountId) return "owned_by_another_account";
      syncInFlightRef.current = true;
      const result = await postAeroCommsProgressReset(pendingResetOperationRef.current);
      syncInFlightRef.current = false;
      if (syncGeneration !== syncGenerationRef.current) return "unavailable";
      if (result.status !== "synced") {
        if (result.status === "unavailable") scheduleSyncRetry();
        if (result.status !== "unavailable") {
          pendingResetOperationRef.current = null;
          pendingResetOwnerRef.current = null;
          clearAeroCommsPersistenceIntent();
        }
        return result.status === "unauthenticated" ? "anonymous" : result.status;
      }

      const snapshot = readAeroCommsRemoteProgressSnapshot(result.snapshot);
      if (!snapshot || snapshot.summary.sessionCount !== 0 || snapshot.summary.scoredSessionCount !== 0) {
        scheduleSyncRetry();
        return "unavailable";
      }
      pendingResetOperationRef.current = null;
      pendingResetOwnerRef.current = null;
      lastSyncedFingerprintRef.current = pendingResetFingerprintRef.current ?? currentProgressFingerprint(stateRef.current);
      pendingResetFingerprintRef.current = null;
      clearAeroCommsPersistenceIntent();
      retryAttemptRef.current = 0;
      writeSyncOwner(accountId);
      return "synced";
    }

    if (foreignLocalProgressRef.current) return "owned_by_another_account";
    if (!pendingSyncPayloadRef.current && persistedIntent?.kind === "sync" && persistedIntent.ownerId === accountId) {
      pendingSyncPayloadRef.current = persistedIntent.payload;
      pendingSyncOwnerRef.current = persistedIntent.ownerId;
      pendingSyncImportConfirmedRef.current = persistedIntent.importConfirmed;
      pendingSyncBaselineOutboxIdsRef.current = persistedIntent.baselineOutboxSessionIds ?? [];
    }

    const candidate = stateRef.current;
    const eligibility = getAeroCommsLocalSyncEligibility(
      hasDurableProgress(candidate),
      readSyncOwner(),
      accountId,
    );
    if (!pendingSyncPayloadRef.current) {
      if (eligibility === "owned_by_another_account") return eligibility;
      if (shouldShowAeroCommsLocalImportDecision(eligibility) && !options.confirmLocalImport) {
        setLocalImportDecisionRequired(true);
        return eligibility;
      }
    }

    const fingerprint = currentProgressFingerprint(candidate);
    if (!pendingSyncPayloadRef.current) {
      const importingAnonymousProgress = eligibility === "requires_import_confirmation" && options.confirmLocalImport === true;
      const outboxSessions = getAeroCommsOutboxSessions(accountId, importingAnonymousProgress);
      const sessionRecords = importingAnonymousProgress
        ? [...candidate.history, ...outboxSessions]
        : outboxSessions;
      const payload = createAeroCommsPersistencePayload(
        candidate,
        createAeroCommsSyncOperationId(),
        { sessionRecords },
      );
      if (!payload) return "invalid";
      pendingSyncPayloadRef.current = payload;
      pendingSyncOwnerRef.current = accountId;
      pendingSyncImportConfirmedRef.current = importingAnonymousProgress;
      if (importingAnonymousProgress) {
        // The explicit choice binds this browser workspace to the account even
        // when the network retry happens after a logout or reload.
        writeSyncOwner(accountId);
        setLocalImportDecisionRequired(false);
      }
      pendingSyncBaselineOutboxIdsRef.current = importingAnonymousProgress
        ? outboxSessions.map((session) => session.id)
        : [];
      writeAeroCommsPersistenceIntent({
        kind: "sync",
        ownerId: accountId,
        payload,
        importConfirmed: importingAnonymousProgress,
        ...(importingAnonymousProgress ? { baselineOutboxSessionIds: pendingSyncBaselineOutboxIdsRef.current } : {}),
      });
    }

    if (pendingSyncOwnerRef.current !== accountId) return "owned_by_another_account";

    syncInFlightRef.current = true;
    const result = await postAeroCommsProgressSync(pendingSyncPayloadRef.current);
    syncInFlightRef.current = false;
    if (syncGeneration !== syncGenerationRef.current) return "unavailable";
    if (result.status !== "synced") {
      if (result.status === "unavailable") scheduleSyncRetry();
      else {
        pendingSyncPayloadRef.current = null;
        pendingSyncOwnerRef.current = null;
        pendingSyncImportConfirmedRef.current = false;
        pendingSyncBaselineOutboxIdsRef.current = [];
        clearAeroCommsPersistenceIntent();
      }
      return result.status === "unauthenticated" ? "anonymous" : result.status;
    }

    const snapshot = readAeroCommsRemoteProgressSnapshot(result.snapshot);
    if (!snapshot) {
      pendingSyncPayloadRef.current = null;
      pendingSyncOwnerRef.current = null;
      pendingSyncImportConfirmedRef.current = false;
      pendingSyncBaselineOutboxIdsRef.current = [];
      clearAeroCommsPersistenceIntent();
      return "invalid";
    }

    // Keep the local source untouched until the complete remote snapshot is accepted.
    setState((current) => mergeAeroCommsRemoteProgress(current, snapshot));
    const sentSessionIds = pendingSyncImportConfirmedRef.current
      ? pendingSyncBaselineOutboxIdsRef.current
      : pendingSyncPayloadRef.current.sessions.map((session) => session.clientSessionId);
    acknowledgeAeroCommsOutboxSessions(accountId, sentSessionIds);
    writeSyncOwner(accountId);
    lastSyncedFingerprintRef.current = fingerprint;
    pendingSyncPayloadRef.current = null;
    pendingSyncOwnerRef.current = null;
    pendingSyncImportConfirmedRef.current = false;
    pendingSyncBaselineOutboxIdsRef.current = [];
    clearAeroCommsPersistenceIntent();
    setLocalImportDecisionRequired(false);
    retryAttemptRef.current = 0;
    if (getAeroCommsOutboxSessions(accountId, false).length > 0) scheduleSyncRetry();
    return "synced";
  }, [currentProgressFingerprint, hasDurableProgress, readSyncOwner, scheduleSyncRetry, writeSyncOwner]);

  useEffect(() => {
    syncProgressRef.current = syncProgress;
  }, [syncProgress]);

  useEffect(() => initializeFlyPathAuthState((authState) => {
    const previous = authStateRef.current;
    if (previous.status === "authenticated" &&
      (authState.status !== "authenticated" || previous.account.id !== authState.account.id)) {
      archiveAccountProgress(previous.account.id, stateRef.current);
      syncGenerationRef.current += 1;
      pendingSyncPayloadRef.current = null;
      pendingSyncOwnerRef.current = null;
      pendingSyncImportConfirmedRef.current = false;
      pendingSyncBaselineOutboxIdsRef.current = [];
      pendingResetOperationRef.current = null;
      pendingResetOwnerRef.current = null;
      pendingResetFingerprintRef.current = null;
      lastSyncedFingerprintRef.current = null;
    }
    authStateRef.current = authState;
    setAuthenticatedAccountId(authState.status === "authenticated" ? authState.account.id : null);
    if (authState.status !== "authenticated") {
      setConfirmedAccountProfileName(null);
      setAccountNamePrompt(null);
      accountNameResolutionKeyRef.current = null;
    }
    if (!hydratedRef.current) return;

    if (authState.status === "loading" || authState.status === "unavailable") return;

    let localOwner = readSyncOwner();
    if (authState.status === "anonymous") {
      if (localOwner) {
        const stored = readStoredAeroCommsState();
        if (stored) archiveAccountProgress(localOwner, stored);
        clearAnonymousWorkspace();
        clearSyncOwner();
        stateRef.current = DEFAULT_STATE;
        setState(DEFAULT_STATE);
      }
      foreignLocalProgressRef.current = false;
      foreignLocalProgressOwnerRef.current = null;
      setForeignLocalProgressDetected(false);
      persistLocalStateRef.current = true;
      return;
    }

    const browserProgress = readStoredAeroCommsState();
    const accountSnapshot = readStoredAeroCommsState(accountStateStorageKey(authState.account.id));
    const authenticatedWorkspace = resolveAeroCommsAuthenticatedWorkspace(
      localOwner,
      authState.account.id,
      Boolean(browserProgress && hasDurableProgress(browserProgress)),
      Boolean(accountSnapshot),
    );
    if (authenticatedWorkspace === "foreign" && localOwner) {
      const foreignOwnerId = localOwner;
      const stored = readStoredAeroCommsState();
      if (stored) archiveAccountProgress(foreignOwnerId, stored);
      clearAnonymousWorkspace();
      clearSyncOwner();
      localOwner = null;
      foreignLocalProgressRef.current = true;
      // Keep this only for Profile's non-destructive resolution. The shared
      // owner marker has already been removed before User B can write locally.
      foreignLocalProgressOwnerRef.current = foreignOwnerId;
      setForeignLocalProgressDetected(true);
      stateRef.current = DEFAULT_STATE;
      setState(DEFAULT_STATE);
    } else {
      foreignLocalProgressRef.current = false;
      foreignLocalProgressOwnerRef.current = null;
      setForeignLocalProgressDetected(false);
    }

    persistLocalStateRef.current = true;
    if (localOwner === authState.account.id) {
      const stored = readStoredAeroCommsState();
      if (stored) {
        stateRef.current = stored;
        setState(stored);
      }
    } else {
      const anonymousProgress = readStoredAeroCommsState();
      const accountProgress = readStoredAeroCommsState(accountStateStorageKey(authState.account.id));
      const workspace = resolveAeroCommsAuthenticatedWorkspace(
        localOwner,
        authState.account.id,
        Boolean(anonymousProgress && hasDurableProgress(anonymousProgress)),
        Boolean(accountProgress),
      );
      if (workspace === "import_anonymous" && anonymousProgress) {
        stateRef.current = anonymousProgress;
        setState(anonymousProgress);
      } else if (workspace === "account" && accountProgress) {
        stateRef.current = accountProgress;
        setState(accountProgress);
        writeSyncOwner(authState.account.id);
      }
    }
    void syncProgressRef.current();
  }), [archiveAccountProgress, clearAnonymousWorkspace, clearSyncOwner, hasDurableProgress, readSyncOwner, writeSyncOwner]);

  useEffect(() => {
    if (!hydrated || !authenticatedAccountId || accountProfile?.userId !== authenticatedAccountId) return;

    const effectiveAccountName = confirmedAccountProfileName ?? accountProfile.fullName;
    const resolutionKey = [
      authenticatedAccountId,
      effectiveAccountName ?? "",
      state.name,
      foreignLocalProgressRef.current ? "foreign" : "current",
    ].join("|");
    if (accountNameResolutionKeyRef.current === resolutionKey) return;
    accountNameResolutionKeyRef.current = resolutionKey;

    const resolution = resolveAeroCommsAccountName({
      localName: state.name,
      authenticated: true,
      accountName: effectiveAccountName,
      isCurrentWorkspace: !foreignLocalProgressRef.current,
      hasLocalOnboardingName: state.onboarded,
    });

    setAccountNamePrompt(resolution.prompt);
    if (resolution.displayedName !== state.name) {
      stateRef.current = { ...stateRef.current, name: resolution.displayedName };
      setState((current) => ({ ...current, name: resolution.displayedName }));
    }
  }, [accountProfile?.fullName, accountProfile?.userId, authenticatedAccountId, confirmedAccountProfileName, hydrated, state.name, state.onboarded]);

  useEffect(() => {
    let active = true;
    if (!hydrated) return;
    const authState = authStateRef.current;
    const localOwner = readSyncOwner();
    if (authState.status === "anonymous" && localOwner) {
      const stored = readStoredAeroCommsState();
      if (stored) archiveAccountProgress(localOwner, stored);
      clearAnonymousWorkspace();
      clearSyncOwner();
      foreignLocalProgressRef.current = false;
      foreignLocalProgressOwnerRef.current = null;
      setForeignLocalProgressDetected(false);
      persistLocalStateRef.current = true;
      stateRef.current = DEFAULT_STATE;
      setState(DEFAULT_STATE);
      return;
    }
    if (authState.status === "authenticated" && localOwner && localOwner !== authState.account.id) {
      const foreignOwnerId = localOwner;
      const stored = readStoredAeroCommsState();
      if (stored) archiveAccountProgress(foreignOwnerId, stored);
      clearAnonymousWorkspace();
      clearSyncOwner();
      foreignLocalProgressRef.current = true;
      foreignLocalProgressOwnerRef.current = foreignOwnerId;
      setForeignLocalProgressDetected(true);
      persistLocalStateRef.current = true;
      stateRef.current = DEFAULT_STATE;
      setState(DEFAULT_STATE);
      return;
    }
    if (authState.status === "authenticated" && localOwner === authState.account.id) {
      const stored = readStoredAeroCommsState();
      if (stored) {
        persistLocalStateRef.current = true;
        stateRef.current = stored;
        queueMicrotask(() => {
          if (!active) return;
          setState(stored);
          void syncProgressRef.current();
        });
      } else {
        void syncProgressRef.current();
      }
    }
    return () => {
      active = false;
    };
  }, [archiveAccountProgress, clearAnonymousWorkspace, clearSyncOwner, hydrated, readSyncOwner]);

  useEffect(() => {
    if (!hydrated || authStateRef.current.status !== "authenticated") return;
    const fingerprint = currentProgressFingerprint(state);
    if (fingerprint === lastSyncedFingerprintRef.current) return;
    const timeout = window.setTimeout(() => {
      void syncProgressRef.current();
    }, 750);
    return () => window.clearTimeout(timeout);
  }, [state, hydrated, currentProgressFingerprint]);

  const setOnboarding = useCallback((data: Partial<AppState>) => {
    setState((s) => ({ ...s, ...data }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setState((s) => ({ ...s, onboarded: true }));
  }, []);

  const recordSession = useCallback((input: RecordSessionInput) => {
    claimAuthenticatedWorkspaceForNewActivity();
    const scored = input.isScored === true;
    // No random fallback. Completion-only sessions have no score.
    const score = scored ? input.score : undefined;
    const minutes = input.minutes ?? 5;
    const record: SessionRecord = {
      id: createAeroCommsClientSessionId(),
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
      const newScoreSum = scored && score !== undefined ? s.scoreSum + score : s.scoreSum;
      const newAccuracy = scored && score !== undefined
        ? Math.round(newScoreSum / newScoredCount)
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
        scoreSum: newScoreSum,
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
    const authState = authStateRef.current;
    appendAeroCommsSyncOutbox({
      ownerId: authState.status === "authenticated" ? authState.account.id : null,
      session: record,
    });
    return record;
  }, [claimAuthenticatedWorkspaceForNewActivity]);

  /**
   * Single action for completing an ATC Sim Guided Mission.
   *
   * Updates: missionResults, completedMissions, skills (mission branch),
   * history (source: "atc-mission"), accuracy, sessionsCount, streak.
   * Does NOT touch completedExercises (missions are not Train exercises).
   * Does NOT call recordSession — history is written here to avoid duplication.
   */
  const recordMissionResult = useCallback((input: RecordMissionResultInput): SessionRecord => {
    claimAuthenticatedWorkspaceForNewActivity();
    const minutes = input.minutes ?? 6;
    const record: SessionRecord = {
      id: createAeroCommsClientSessionId(),
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
      const newScoreSum = s.scoreSum + input.score;
      const newAccuracy = Math.round(newScoreSum / newScoredCount);

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
        scoreSum: newScoreSum,
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

    const authState = authStateRef.current;
    appendAeroCommsSyncOutbox({
      ownerId: authState.status === "authenticated" ? authState.account.id : null,
      session: record,
    });

    return record;
  }, [claimAuthenticatedWorkspaceForNewActivity]);

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

  const beginPersistentReset = useCallback((nextState: AppState): Promise<AeroCommsSyncStatus> => {
    syncGenerationRef.current += 1;
    pendingSyncPayloadRef.current = null;
    pendingSyncOwnerRef.current = null;
    pendingSyncImportConfirmedRef.current = false;
    pendingSyncBaselineOutboxIdsRef.current = [];
    lastSyncedFingerprintRef.current = null;

    const authState = authStateRef.current;
    const ownerId = authState.status === "authenticated"
      ? authState.account.id
      : foreignLocalProgressRef.current
        ? null
        : readSyncOwner();
    if (ownerId) {
      pendingResetOperationRef.current = createAeroCommsSyncOperationId();
      pendingResetOwnerRef.current = ownerId;
      pendingResetFingerprintRef.current = currentProgressFingerprint(nextState);
      writeAeroCommsPersistenceIntent({
        kind: "reset",
        ownerId,
        operationId: pendingResetOperationRef.current,
      });
    } else {
      clearAeroCommsPersistenceIntent();
    }
    setLocalImportDecisionRequired(false);
    removeAeroCommsLocalProgress(ownerId);
    if (ownerId !== null) removeAeroCommsLocalProgress(null);
    setState(nextState);

    if (authState.status === "authenticated" && ownerId === authState.account.id) {
      return syncProgressRef.current();
    }
    return Promise.resolve(authState.status === "anonymous" ? "anonymous" : "unavailable");
  }, [currentProgressFingerprint, readSyncOwner]);

  const reset = useCallback(() => {
    void beginPersistentReset(DEFAULT_STATE);
  }, [beginPersistentReset]);

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
  const resetProgressOnly = useCallback(() => beginPersistentReset(clearDurableProgress(stateRef.current)), [beginPersistentReset]);

  const dismissLocalImportDecision = useCallback(() => {
    setLocalImportDecisionRequired(false);
  }, []);

  const dismissForeignLocalProgressDecision = useCallback(() => {
    setForeignLocalProgressDetected(false);
  }, []);

  const discardForeignLocalProgress = useCallback(async (): Promise<AeroCommsSyncStatus> => {
    const ownerId = foreignLocalProgressOwnerRef.current ?? readSyncOwner();
    if (!foreignLocalProgressRef.current || !ownerId) return "invalid";
    // Do not delete the other account's outbox or retry intent. This action
    // only resolves what is rendered for the current account in this browser.
    pendingSyncPayloadRef.current = null;
    pendingSyncOwnerRef.current = null;
    pendingResetOperationRef.current = null;
    pendingResetOwnerRef.current = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SYNC_OWNER_STORAGE_KEY);
    } catch {
      // In-memory state still prevents the previous account's progress leaking this session.
    }
    syncOwnerRef.current = null;
    foreignLocalProgressRef.current = false;
    foreignLocalProgressOwnerRef.current = null;
    setForeignLocalProgressDetected(false);
    persistLocalStateRef.current = true;
    stateRef.current = DEFAULT_STATE;
    setState(DEFAULT_STATE);
    return syncProgressRef.current();
  }, [readSyncOwner]);

  const keepAccountProfileName = useCallback(() => {
    if (!authenticatedAccountId || accountProfile?.userId !== authenticatedAccountId) return;
    const fullName = confirmedAccountProfileName ?? accountProfile.fullName;
    if (!fullName) return;
    accountNameResolutionKeyRef.current = null;
    setAccountNamePrompt(null);
    stateRef.current = { ...stateRef.current, name: fullName };
    setState((current) => ({ ...current, name: fullName }));
  }, [accountProfile, authenticatedAccountId, confirmedAccountProfileName]);

  const applyAccountProfileName = useCallback((fullName: string) => {
    if (!authenticatedAccountId) return;
    accountNameResolutionKeyRef.current = null;
    setConfirmedAccountProfileName(fullName);
    setAccountNamePrompt(null);
    stateRef.current = { ...stateRef.current, name: fullName };
    setState((current) => ({ ...current, name: fullName }));
  }, [authenticatedAccountId]);

  const dismissAccountNamePrompt = useCallback(() => {
    setAccountNamePrompt(null);
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
      syncProgress,
      localImportDecisionRequired,
      dismissLocalImportDecision,
      foreignLocalProgressDetected,
      dismissForeignLocalProgressDecision,
      discardForeignLocalProgress,
      reset,
      resetProgressOnly,
      accountNamePrompt,
      keepAccountProfileName,
      applyAccountProfileName,
      dismissAccountNamePrompt,
    }),
    [state, hydrated, setOnboarding, completeOnboarding, recordSession, recordMissionResult, upgrade, setNotifications, cycleDailyGoal, cycleDifficulty, syncProgress, localImportDecisionRequired, dismissLocalImportDecision, foreignLocalProgressDetected, dismissForeignLocalProgressDecision, discardForeignLocalProgress, reset, resetProgressOnly, accountNamePrompt, keepAccountProfileName, applyAccountProfileName, dismissAccountNamePrompt],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
