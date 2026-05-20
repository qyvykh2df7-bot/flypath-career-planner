export function formatWeeklyBlockPosition(
  completedSessions: number,
  totalPlannedSessions: number,
): string | undefined {
  if (totalPlannedSessions <= 0) return undefined;
  const nextIndex = Math.min(completedSessions + 1, totalPlannedSessions);
  return `Bloque ${nextIndex} de ${totalPlannedSessions}`;
}
