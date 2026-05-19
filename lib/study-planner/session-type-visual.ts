import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  ListChecks,
  RotateCcw,
} from "lucide-react";
import type { StudySessionType } from "./types";
import { getSessionTypeShortLabel } from "./labels";

export const SESSION_TYPE_ACCENT: Partial<Record<StudySessionType, string>> = {
  theory: "border-l-[#3b6ea8]",
  question_bank: "border-l-[#2d8a6b]",
  review: "border-l-[#8b6bb8]",
  mock: "border-l-[#c9a454]",
  error_correction: "border-l-[#b85c5c]",
  class: "border-l-[#5c6b8a]",
};

export const SESSION_TYPE_ICON: Partial<Record<StudySessionType, LucideIcon>> = {
  theory: BookOpen,
  question_bank: ListChecks,
  review: RotateCcw,
  mock: ClipboardCheck,
  error_correction: AlertCircle,
  class: GraduationCap,
};

/** Punto de color en vista mes (teoría=azul, banco=verde, mock=naranja, repaso=violeta). */
export const SESSION_TYPE_DOT_CLASS: Partial<Record<StudySessionType, string>> = {
  theory: "bg-[#3b6ea8]",
  question_bank: "bg-[#2d8a6b]",
  review: "bg-[#8b6bb8]",
  mock: "bg-[#d4923a]",
  error_correction: "bg-[#b85c5c]",
  class: "bg-slate-400",
};

export const SESSION_TYPE_BADGE_CLASS: Partial<Record<StudySessionType, string>> = {
  theory: "bg-sky-50 text-sky-900 ring-sky-200/80",
  question_bank: "bg-emerald-50 text-emerald-900 ring-emerald-200/80",
  review: "bg-violet-50 text-violet-900 ring-violet-200/80",
  mock: "bg-[#fff8e8] text-[#7a5a16] ring-[#c9a454]/35",
  error_correction: "bg-red-50 text-red-900 ring-red-200/80",
  class: "bg-slate-100 text-slate-700 ring-slate-200/80",
};

export function getSessionTypeIcon(type: StudySessionType): LucideIcon {
  return SESSION_TYPE_ICON[type] ?? BookOpen;
}

export function getSessionTypeAccentClass(type: StudySessionType): string {
  return SESSION_TYPE_ACCENT[type] ?? "border-l-slate-300";
}

export function getSessionTypeBadgeClass(type: StudySessionType): string {
  return SESSION_TYPE_BADGE_CLASS[type] ?? "bg-slate-100 text-slate-700 ring-slate-200/80";
}

export function getSessionTypeDotClass(type: StudySessionType): string {
  return SESSION_TYPE_DOT_CLASS[type] ?? "bg-slate-300";
}

export function formatSessionHeadline(params: {
  minutes: number;
  subjectName: string;
  sessionType: StudySessionType;
}): string {
  return `${params.minutes} min · ${params.subjectName} · ${getSessionTypeShortLabel(params.sessionType)}`;
}
