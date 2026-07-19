import { findMission } from "./atcSim";
import { findExercise } from "./content";
import { createLegacyAeroCommsSessionId, type AeroCommsRemoteProgressSnapshot } from "./persistence-contract";
import type { AppState, MissionResultSummary, SessionRecord, SkillStatsMap, Skills } from "./appState";

function displaySkills(stats: SkillStatsMap): Skills {
  return {
    listening: stats.listening.count ? Math.round(stats.listening.totalScore / stats.listening.count) : 0,
    readbacks: stats.readbacks.count ? Math.round(stats.readbacks.totalScore / stats.readbacks.count) : 0,
    phraseology: stats.phraseology.count ? Math.round(stats.phraseology.totalScore / stats.phraseology.count) : 0,
    speaking: stats.speaking.count ? Math.round(stats.speaking.totalScore / stats.speaking.count) : 0,
    confidence: stats.confidence.count ? Math.round(stats.confidence.totalScore / stats.confidence.count) : 0,
  };
}

function sessionIdentity(session: Pick<SessionRecord, "id" | "at" | "missionId" | "exerciseId">): string {
  return session.id.includes("-") && session.id.length === 36
    ? session.id
    : createLegacyAeroCommsSessionId(`${session.id}:${session.missionId ?? session.exerciseId ?? "activity"}:${session.at}`);
}

function toLocalSession(snapshot: AeroCommsRemoteProgressSnapshot["sessions"][number]): SessionRecord {
  const exercise = snapshot.exerciseId ? findExercise(snapshot.exerciseId)?.exercise : undefined;
  const mission = snapshot.missionId ? findMission(snapshot.missionId) : undefined;
  return {
    id: snapshot.clientSessionId,
    name: mission?.title ?? exercise?.title ?? (snapshot.activityType === "mission" ? "ATC Sim mission" : "Training exercise"),
    detail: snapshot.activityType === "mission" ? "ATC Sim" : "Training",
    ...(snapshot.score !== undefined ? { score: snapshot.score } : {}),
    isScored: snapshot.isScored,
    at: Date.parse(snapshot.occurredAt),
    source: snapshot.source,
    ...(snapshot.missionId ? { missionId: snapshot.missionId } : {}),
    ...(snapshot.exerciseId ? { exerciseId: snapshot.exerciseId } : {}),
    ...(snapshot.levelId ? { level: snapshot.levelId } : {}),
    ...(snapshot.stars !== undefined ? { stars: snapshot.stars } : {}),
  };
}

/**
 * Replaces only durable progress fields with the canonical remote merge. Local
 * settings, subscription, onboarding, UI preferences, and local storage stay intact.
 */
export function mergeAeroCommsRemoteProgress(
  local: AppState,
  snapshot: AeroCommsRemoteProgressSnapshot,
): AppState {
  const resetTimestamp = snapshot.summary.resetAt ? Date.parse(snapshot.summary.resetAt) : null;
  const hasRemoteReset = resetTimestamp !== null && !Number.isNaN(resetTimestamp);
  const resetBoundary = resetTimestamp ?? Number.NEGATIVE_INFINITY;
  const localHistory = hasRemoteReset
    ? local.history.filter((session) => session.at > resetBoundary)
    : local.history;
  const localMissionResults = hasRemoteReset
    ? Object.fromEntries(Object.entries(local.missionResults).filter(([, mission]) => {
      const attemptedAt = Date.parse(mission.lastAttemptAt);
      return !Number.isNaN(attemptedAt) && attemptedAt > resetBoundary;
    }))
    : local.missionResults;
  const localCompletedExercises = hasRemoteReset
    ? localHistory.flatMap((session) => session.exerciseId ? [session.exerciseId] : [])
    : local.completedExercises;
  const localCompletedMissions = hasRemoteReset
    ? Object.keys(localMissionResults)
    : local.completedMissions;

  const skillStats = (hasRemoteReset
    ? {
      listening: { totalScore: 0, count: 0 },
      readbacks: { totalScore: 0, count: 0 },
      phraseology: { totalScore: 0, count: 0 },
      speaking: { totalScore: 0, count: 0 },
      confidence: { totalScore: 0, count: 0 },
    }
    : { ...local.skillStats }) as SkillStatsMap;
  for (const stat of snapshot.skillStats) {
    skillStats[stat.skillId] = { totalScore: stat.scoreSum, count: stat.scoredCount };
  }

  const missionResults = { ...localMissionResults };
  for (const mission of snapshot.missions) {
    if (!mission.completedAt || mission.lastScore === null || mission.bestScore === null ||
      mission.lastStars === null || mission.bestStars === null) continue;
    const existing = missionResults[mission.missionId];
    const result: MissionResultSummary = {
      missionId: mission.missionId,
      score: mission.lastScore,
      bestScore: mission.bestScore,
      stars: mission.lastStars,
      bestStars: mission.bestStars,
      attempts: mission.attemptCount,
      completed: true,
      completedAt: mission.completedAt,
      lastAttemptAt: mission.lastAttemptAt,
      level: mission.levelId,
      title: existing?.title ?? findMission(mission.missionId)?.title,
    };
    missionResults[mission.missionId] = result;
  }

  const historyById = new Map(localHistory.map((session) => [sessionIdentity(session), session]));
  for (const session of snapshot.sessions) {
    historyById.set(session.clientSessionId, toLocalSession(session));
  }
  const history = [...historyById.values()].sort((left, right) => right.at - left.at).slice(0, 20);

  return {
    ...local,
    completedExercises: [...new Set([...localCompletedExercises, ...snapshot.completedExerciseIds])],
    completedMissions: [...new Set([
      ...localCompletedMissions,
      ...snapshot.missions.filter((mission) => mission.completedAt !== null).map((mission) => mission.missionId),
    ])],
    missionResults,
    skillStats,
    skills: displaySkills(skillStats),
    accuracy: snapshot.summary.accuracy ?? 0,
    scoreSum: snapshot.summary.scoreSum,
    sessionsCount: snapshot.summary.sessionCount,
    scoredCount: snapshot.summary.scoredSessionCount,
    streakDays: snapshot.summary.streakDays,
    lastSessionAt: snapshot.summary.lastActivityDate,
    history,
  };
}
