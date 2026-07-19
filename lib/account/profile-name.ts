/**
 * Normalizes the only editable account identity field shared by FlyPath
 * surfaces. It deliberately contains no server-only dependencies so a client
 * can safely prepare a proposed name before an explicit server action saves it.
 */
export function normalizeFlyPathProfileName(value: string): string | null {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length >= 1 && normalized.length <= 120 ? normalized : null;
}
