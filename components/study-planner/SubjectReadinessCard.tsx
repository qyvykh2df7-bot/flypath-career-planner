"use client";

import type { ExamDate, StudySubject, SubjectReadiness } from "@/lib/study-planner/types";
import { formatMockScore, minutesToHoursLabel } from "@/lib/study-planner/calculations";
import {
  getSubjectDisplayLabel,
  resolveSubjectDisplayStatus,
} from "@/lib/study-planner/subjects-page-logic";

type SubjectReadinessCardProps = {
  subject: StudySubject;
  readiness: SubjectReadiness;
  pendingErrorsCount?: number;
  examDates?: ExamDate[];
};

function levelStyles(level: SubjectReadiness["level"]): {
  badge: string;
  bar: string;
  ring: string;
} {
  switch (level) {
    case "no_data":
      return {
        badge: "bg-slate-50 text-slate-600 ring-slate-200/80",
        bar: "bg-slate-300",
        ring: "ring-slate-200/80",
      };
    case "low":
      return {
        badge: "bg-amber-50 text-amber-900 ring-amber-200/70",
        bar: "bg-amber-400/80",
        ring: "ring-amber-200/50",
      };
    case "medium":
      return {
        badge: "bg-[#fff8e8] text-[#7a5a16] ring-[#c9a454]/35",
        bar: "bg-gradient-to-r from-[#c9a454] to-[#ddb75c]",
        ring: "ring-[#c9a454]/25",
      };
    case "high":
      return {
        badge: "bg-[#e8eef8] text-[#0f1a33] ring-[#0f1a33]/15",
        bar: "bg-gradient-to-r from-[#0f1a33] to-[#1a2d52]",
        ring: "ring-[#0f1a33]/15",
      };
    case "solid":
      return {
        badge: "bg-emerald-50 text-emerald-800 ring-emerald-200/70",
        bar: "bg-emerald-500/80",
        ring: "ring-emerald-200/50",
      };
  }
}

function formatLastSession(days: number | null): string {
  if (days === null) return "Sin sesiones";
  if (days === 0) return "Hoy";
  if (days === 1) return "Hace 1 día";
  return `Hace ${days} días`;
}

export function SubjectReadinessCard({
  subject,
  readiness,
  pendingErrorsCount = 0,
  examDates = [],
}: SubjectReadinessCardProps) {
  const styles = levelStyles(readiness.level);
  const { factors, breakdown } = readiness;
  const barPct = readiness.level === "no_data" ? 0 : readiness.score;
  const displayStatus = resolveSubjectDisplayStatus(readiness, examDates, pendingErrorsCount);
  const statusLabel = getSubjectDisplayLabel(displayStatus, readiness);

  return (
    <article
      className={`flex flex-col rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ${styles.ring}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-[14px] font-semibold leading-snug text-[#0f1a33]">{subject.name}</h4>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${styles.badge}`}
          >
            {statusLabel}
          </span>
          {readiness.isProvisional ? (
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200/80">
              Dato provisional
            </span>
          ) : null}
        </div>
      </div>

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
        Nivel de preparación
      </p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums text-[#0f1a33]">
          {readiness.level === "no_data" ? "—" : readiness.score}
        </span>
        {readiness.level !== "no_data" ? (
          <span className="text-[13px] text-slate-500">/ 100 orientativo</span>
        ) : null}
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all ${styles.bar}`} style={{ width: `${barPct}%` }} />
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-slate-600">{readiness.message}</p>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-100 pt-3 text-[12px]">
        <div>
          <dt className="text-slate-500">Base teórica</dt>
          <dd className="font-medium text-slate-700">{minutesToHoursLabel(breakdown.theoryMinutes)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Banco</dt>
          <dd className="font-medium text-slate-700">{minutesToHoursLabel(breakdown.bankMinutes)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Simulacros de examen</dt>
          <dd className="font-medium text-slate-700">
            {breakdown.mockCount > 0
              ? `${breakdown.mockCount}${factors.averageMockScore !== null ? ` · media ${formatMockScore(factors.averageMockScore)}` : ""}`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Errores / repasos</dt>
          <dd className="font-medium text-slate-700">
            {breakdown.pendingErrors} / {breakdown.pendingReviews}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Recencia</dt>
          <dd className="font-medium text-slate-700">{formatLastSession(factors.daysSinceLastSession)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Confianza del cálculo</dt>
          <dd className="font-medium text-slate-700">{readiness.confidenceLabel}</dd>
        </div>
      </dl>
    </article>
  );
}
