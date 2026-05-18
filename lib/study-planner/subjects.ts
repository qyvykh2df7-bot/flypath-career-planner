import type { StudyMode, StudySession, StudySubject } from "./types";

const pplNames = [
  "Air Law",
  "Human Performance",
  "Meteorology",
  "Communications",
  "Navigation",
  "Flight Performance & Planning",
  "Aircraft General Knowledge",
  "Operational Procedures",
  "Principles of Flight",
] as const;

const atplNames = [
  "Air Law",
  "Aircraft General Knowledge",
  "Instrumentation",
  "Mass & Balance",
  "Performance",
  "Flight Planning",
  "Human Performance",
  "Meteorology",
  "General Navigation",
  "Radio Navigation",
  "Operational Procedures",
  "Principles of Flight",
  "Communications",
] as const;

function slugify(name: string, mode: StudyMode): string {
  return `${mode}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

export const PPL_SUBJECTS: StudySubject[] = pplNames.map((name) => ({
  id: slugify(name, "ppl"),
  name,
  mode: "ppl",
}));

export const ATPL_SUBJECTS: StudySubject[] = atplNames.map((name) => ({
  id: slugify(name, "atpl"),
  name,
  mode: "atpl",
}));

export function getSubjectsByMode(mode: StudyMode): StudySubject[] {
  if (mode === "ppl") return PPL_SUBJECTS;
  return ATPL_SUBJECTS;
}

export const ALL_SUBJECTS: StudySubject[] = [...ATPL_SUBJECTS, ...PPL_SUBJECTS];

export function getSubjectById(subjectId: string): StudySubject | undefined {
  return ALL_SUBJECTS.find((s) => s.id === subjectId);
}

export function getSubjectIdsForMode(mode: StudyMode): Set<string> {
  return new Set(getSubjectsByMode(mode).map((s) => s.id));
}

export function filterSessionsByMode(sessions: StudySession[], mode: StudyMode): StudySession[] {
  const ids = getSubjectIdsForMode(mode);
  return sessions.filter((s) => ids.has(s.subjectId));
}
