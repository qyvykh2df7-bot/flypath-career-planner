"use client";

import { Calendar, MessageSquare, Target } from "lucide-react";
import type { FlyPathFollowUpSummary } from "@/lib/study-planner/teacher-follow-up";
import { formatFollowUpDate } from "@/lib/study-planner/teacher-follow-up";
import { plannerMetricCard } from "@/lib/study-planner/planner-ui";
import { getSubjectById } from "@/lib/study-planner/subjects";

type FollowUpSummaryCardProps = {
  summary: FlyPathFollowUpSummary;
  onPlanClass?: () => void;
  title?: string;
  variant?: "default" | "premium";
};

export function FollowUpSummaryCard({
  summary,
  onPlanClass,
  title = "Seguimiento FlyPath",
  variant = "default",
}: FollowUpSummaryCardProps) {
  const hasData =
    summary.latestComment ||
    summary.nextObjective ||
    summary.nextClass ||
    summary.generalStatus !== "Sin seguimiento registrado";

  if (!hasData) {
    return (
      <section className={`${plannerMetricCard} space-y-1`}>
        <h3 className="text-[14px] font-semibold text-[#0f1a33]">{title}</h3>
        <p className="text-[13px] leading-relaxed text-slate-600">
          {variant === "premium"
            ? "El profesor aún no ha dejado comentarios de seguimiento."
            : "Todavía no hay comentarios de seguimiento."}
        </p>
      </section>
    );
  }

  const latestPreview = summary.latestComment?.comment
    ? summary.latestComment.comment.length > 120
      ? `${summary.latestComment.comment.slice(0, 117)}…`
      : summary.latestComment.comment
    : null;

  const nextClassName = summary.nextClass
    ? (getSubjectById(summary.nextClass.subjectId)?.name ?? summary.nextClass.subjectId)
    : null;

  return (
    <section className={`${plannerMetricCard} space-y-3`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-[14px] font-semibold text-[#0f1a33]">{title}</h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            variant === "premium"
              ? "bg-[#fff8e8] text-[#7a5a16] ring-1 ring-[#c9a454]/25"
              : "bg-[#e8eef8] text-[#3b6ea8]"
          }`}
        >
          {variant === "premium" ? "Activo" : summary.generalStatus}
        </span>
      </div>

      <dl className="space-y-2.5">
        <div className="flex gap-2">
          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Último comentario
            </dt>
            <dd className="mt-0.5 text-[13px] leading-snug text-slate-700">
              {latestPreview ?? "—"}
              {summary.latestComment ? (
                <span className="mt-0.5 block text-[12px] text-slate-500">
                  {formatFollowUpDate(summary.latestComment.date)}
                </span>
              ) : null}
            </dd>
          </div>
        </div>

        <div className="flex gap-2">
          <Target className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Próximo objetivo
            </dt>
            <dd className="mt-0.5 text-[13px] leading-snug text-slate-700">
              {summary.nextObjective ?? "Sin tarea definida"}
            </dd>
          </div>
        </div>

        <div className="flex gap-2">
          <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a454]" aria-hidden />
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Próxima clase
            </dt>
            <dd className="mt-0.5 text-[13px] leading-snug text-slate-700">
              {summary.nextClass && nextClassName ? (
                <>
                  {nextClassName}
                  <span className="text-slate-500">
                    {" "}
                    · {formatFollowUpDate(summary.nextClass.date)}
                    {summary.nextClass.startTime ? ` · ${summary.nextClass.startTime}` : ""}
                  </span>
                </>
              ) : (
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                  <span>No hay clase planificada</span>
                  {onPlanClass ? (
                    <button
                      type="button"
                      onClick={onPlanClass}
                      className="inline-flex min-h-[28px] shrink-0 items-center rounded-md border border-[#c9a454]/45 bg-[#fff8e8]/80 px-2 py-0.5 text-[11px] font-semibold text-[#7a5a16] shadow-[0_1px_2px_-1px_rgba(201,164,84,0.2)] transition hover:border-[#c9a454]/65 hover:bg-[#fffdf8] hover:text-[#0f1a33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35"
                    >
                      Planificar clase
                    </button>
                  ) : null}
                </span>
              )}
            </dd>
          </div>
        </div>
      </dl>
    </section>
  );
}
