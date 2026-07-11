import { LEVELS } from "./content";

const STORAGE_KEY = "aerocomms.trainLevelId";

export function levelIndexFromId(levelId: string | null | undefined): number {
  if (!levelId) return 0;
  const i = LEVELS.findIndex((l) => l.id === levelId);
  return i >= 0 ? i : 0;
}

export function persistTrainLevelId(levelId: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, levelId);
  } catch {
    // ignore storage errors
  }
}

export function readPersistedTrainLevelId(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Resolve the Train level carousel index from URL (?level=) or session persistence. */
export function resolveTrainLevelIndex(levelIdFromUrl: string | null): number {
  if (levelIdFromUrl) return levelIndexFromId(levelIdFromUrl);
  return levelIndexFromId(readPersistedTrainLevelId());
}

/** Level-aware Train route — keeps the carousel on the correct level when navigating back. */
export function trainHref(levelId?: string): string {
  return levelId ? `/aerocomms/app/train?level=${encodeURIComponent(levelId)}` : "/aerocomms/app/train";
}
