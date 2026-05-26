/** Opciones de hora para sesiones planificadas (06:00–23:00, cada 30 min). */
export const PLANNED_SESSION_START_TIME_OPTIONS: readonly string[] = (() => {
  const options: string[] = [];
  for (let hour = 6; hour <= 23; hour += 1) {
    options.push(`${String(hour).padStart(2, "0")}:00`);
    if (hour < 23) {
      options.push(`${String(hour).padStart(2, "0")}:30`);
    }
  }
  return options;
})();

const MIN_MINUTES = 6 * 60;
const MAX_MINUTES = 23 * 60;
const DEFAULT_START_TIME = "09:00";

function parseTimeToMinutes(raw: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(raw.trim());
  if (!match) return null;
  const hours = Number.parseInt(match[1]!, 10);
  const minutes = Number.parseInt(match[2]!, 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function minutesToTimeString(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function isOption(value: string): boolean {
  return (PLANNED_SESSION_START_TIME_OPTIONS as readonly string[]).includes(value);
}

/**
 * Devuelve una hora `HH:MM` válida para el desplegable.
 * Valores fuera de rango o no alineados a 30 min se redondean al slot más cercano.
 */
export function normalizePlannedSessionStartTime(
  raw?: string | null,
  fallback: string = DEFAULT_START_TIME,
): string {
  const fallbackNormalized = isOption(fallback) ? fallback : DEFAULT_START_TIME;
  if (!raw?.trim()) return fallbackNormalized;

  const trimmed = raw.trim();
  if (isOption(trimmed)) return trimmed;

  const parsed = parseTimeToMinutes(trimmed);
  if (parsed === null) return fallbackNormalized;

  const clamped = Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, parsed));
  const rounded = Math.round(clamped / 30) * 30;
  const normalized = minutesToTimeString(rounded);
  return isOption(normalized) ? normalized : fallbackNormalized;
}
